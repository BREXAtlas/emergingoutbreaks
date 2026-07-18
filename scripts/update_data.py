#!/usr/bin/env python3
"""Refresh the public Cyclospora data file from traceable public sources.

The updater is deliberately conservative: it extracts only clearly labeled federal
figures and RSS metadata, preserves the previous value when parsing fails, and never
turns community posts or article counts into official case totals.
"""

from __future__ import annotations

import email.utils
import html
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "public" / "data" / "live.json"
CDC_URL = "https://www.cdc.gov/cyclosporiasis/php/surveillance/index.html"
FDA_URL = (
    "https://www.fda.gov/food/outbreaks-foodborne-illness/"
    "investigation-5-state-outbreak-cyclospora-illnesses-iceberg-lettuce-july-2026"
)
RSS_URL = (
    "https://news.google.com/rss/search?"
    + urllib.parse.urlencode(
        {
            "q": "Cyclospora OR cyclosporiasis when:2d",
            "hl": "en-US",
            "gl": "US",
            "ceid": "US:en",
        }
    )
)
USER_AGENT = "BREXAtlas-EmergingOutbreaks/1.0 (+https://github.com/BREXAtlas/emergingoutbreaks)"


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        value = " ".join(data.split())
        if value:
            self.parts.append(value)


def fetch(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT, "Accept": "text/html,application/rss+xml"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def page_text(url: str) -> str:
    parser = TextExtractor()
    parser.feed(fetch(url).decode("utf-8", errors="replace"))
    return html.unescape(" ".join(parser.parts))


def first_int(text: str, patterns: list[str], fallback: int) -> int:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return int(match.group(1).replace(",", ""))
    return fallback


def first_date(text: str, patterns: list[str], fallback: str) -> str:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            try:
                parsed = datetime.strptime(match.group(1).strip(), "%B %d, %Y")
                return parsed.date().isoformat()
            except ValueError:
                continue
    return fallback


def rss_items() -> list[dict[str, str]]:
    root = ET.fromstring(fetch(RSS_URL))
    items: list[dict[str, str]] = []
    for item in root.findall("./channel/item"):
        title = html.unescape((item.findtext("title") or "").strip())
        url = (item.findtext("link") or "").strip()
        published_raw = (item.findtext("pubDate") or "").strip()
        source_node = item.find("source")
        source = (source_node.text or "Independent newsroom").strip() if source_node is not None else "Independent newsroom"
        if not title or not url or not published_raw:
            continue
        published = email.utils.parsedate_to_datetime(published_raw).astimezone(timezone.utc)
        items.append(
            {
                "title": title,
                "source": source,
                "sourceType": "newsroom",
                "published": published.isoformat().replace("+00:00", "Z"),
                "url": url,
                "summary": "Headline metadata from the daily news index. Open the source for full context and verify safety actions against CDC or FDA.",
            }
        )
    return items[:8]


def main() -> int:
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    now = datetime.now(timezone.utc).replace(microsecond=0)
    yesterday = (now - timedelta(days=1)).date()
    warnings: list[str] = []

    try:
        cdc = page_text(CDC_URL)
        national = data["national"]
        national["confirmedDomestic"] = first_int(
            cdc,
            [
                r"U\.S\. cases reported to CDC\s*:?\s*([\d,]+)",
                r"As of [A-Za-z]+ \d{1,2}, 20\d{2},\s*([\d,]+) lab-confirmed cases",
                r"received reports of\s*([\d,]+) confirmed domestic cases",
            ],
            national["confirmedDomestic"],
        )
        national["hospitalizations"] = first_int(
            cdc,
            [r"2026 fast facts.*?Hospitalizations\s*:?\s*([\d,]+)", r"Of [\d,]+ people.*?([\d,]+) were hospitalized"],
            national["hospitalizations"],
        )
        national["statesReporting"] = first_int(
            cdc,
            [r"States reporting cases\s*:?\s*([\d,]+)", r"Cases were reported by\s*([\d,]+) states"],
            national["statesReporting"],
        )
        national["asOf"] = first_date(
            cdc,
            [r"As of ([A-Za-z]+ \d{1,2}, 20\d{2})"],
            national["asOf"],
        )
    except Exception as exc:  # Network failures must not erase the last verified snapshot.
        warnings.append(f"CDC refresh failed: {exc}")

    try:
        fda = page_text(FDA_URL)
        linked = data["linkedOutbreak"]
        linked["cases"] = first_int(
            fda,
            [r"Total Illnesses\s*:?\s*([\d,]+)", r"a total of\s*([\d,]+) people infected"],
            linked["cases"],
        )
        linked["hospitalizations"] = first_int(
            fda,
            [r"Hospitalizations\s*:?\s*([\d,]+)"],
            linked["hospitalizations"],
        )
        linked["lastOnset"] = first_date(
            fda,
            [r"Last Illness Onset\s*:?\s*([A-Za-z]+ \d{1,2}, 20\d{2})"],
            linked["lastOnset"],
        )
    except Exception as exc:
        warnings.append(f"FDA refresh failed: {exc}")

    try:
        indexed_news = rss_items()
        official = [item for item in data.get("news", []) if item.get("sourceType") == "official"]
        data["news"] = (official + indexed_news)[:10]
        yesterday_items = [
            item
            for item in indexed_news
            if datetime.fromisoformat(item["published"].replace("Z", "+00:00")).date() == yesterday
        ]
        topic_titles = [re.sub(r"\s+-\s+[^-]+$", "", item["title"]) for item in yesterday_items[:3]]
        topic_line = "; ".join(topic_titles) if topic_titles else "no new indexed headlines"
        data["blog"] = {
            "date": now.date().isoformat(),
            "window": f"News published on {yesterday.strftime('%B %d, %Y')}",
            "title": "News in Reverse: start with the verified scope",
            "dek": f"Yesterday’s public feed contained {len(yesterday_items)} indexed item(s). The daily brief works backward from official scope before adding headlines.",
            "paragraphs": [
                f"The headline trail, newest first: {topic_line}.",
                f"The stable reference point remains {data['national']['confirmedDomestic']:,} federally confirmed domestically acquired cases across {data['national']['statesReporting']} reporting states. State totals may be newer, broader, or include probable cases.",
                "The current federal source finding applies to a large five-state lettuce-linked subset. Water remains a possible general transmission route, but the current CDC and FDA pages do not identify a municipal water system as this outbreak’s source.",
            ],
            "method": "Automatically assembled from RSS headline metadata plus the latest saved CDC/FDA figures. It does not copy article bodies, diagnose illness, or convert headlines into case counts.",
        }
    except Exception as exc:
        warnings.append(f"News refresh failed: {exc}")

    burden = data["national"]["confirmedDomestic"]
    states = data["national"]["statesReporting"]
    score = min(100, 35 + min(25, burden // 100) + min(20, states // 2) + 10)
    data["alert"] = {
        "level": "high" if score >= 70 else "medium" if score >= 40 else "low",
        "score": score,
        "reason": "An official food safety alert is open, the response spans multiple jurisdictions, and source investigation is incomplete.",
    }
    data["generatedAt"] = now.isoformat().replace("+00:00", "Z")
    DATA_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    for warning in warnings:
        print(f"warning: {warning}", file=sys.stderr)
    print(
        f"updated {DATA_PATH.relative_to(ROOT)}: "
        f"{data['national']['confirmedDomestic']} confirmed cases, "
        f"alert {data['alert']['level']} ({data['alert']['score']})"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
