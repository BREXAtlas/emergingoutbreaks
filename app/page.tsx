"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  CircleAlert,
  Clock3,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  HeartPulse,
  Info,
  MapPinned,
  MessageCircle,
  Microscope,
  Newspaper,
  Search,
  ShieldCheck,
  Sparkles,
  Thermometer,
  Waves,
  X,
} from "lucide-react";
import OutbreakMap, { type MapSignal } from "./components/OutbreakMap";

type NewsItem = {
  title: string;
  source: string;
  sourceType: "official" | "newsroom" | "community";
  published: string;
  url: string;
  summary: string;
};

type LiveData = {
  generatedAt: string;
  alert: { level: string; score: number; reason: string };
  national: {
    confirmedDomestic: number;
    hospitalizations: number;
    deaths: number;
    statesReporting: number;
    asOf: string;
    pageUpdated: string;
    reportingLagWeeks: number;
    source: string;
    sourceUrl: string;
  };
  linkedOutbreak: {
    cases: number;
    hospitalizations: number;
    deaths: number;
    states: string[];
    lastOnset: string;
    product: string;
    status: string;
    asOf: string;
    source: string;
    sourceUrl: string;
  };
  mapSignals: MapSignal[];
  news: NewsItem[];
  blog: {
    date: string;
    window: string;
    title: string;
    dek: string;
    paragraphs: string[];
    method: string;
  };
};

const fallbackData: LiveData = {
  generatedAt: "2026-07-18T14:00:00Z",
  alert: {
    level: "high",
    score: 86,
    reason: "A federal food safety alert is open and the investigation remains active.",
  },
  national: {
    confirmedDomestic: 1645,
    hospitalizations: 141,
    deaths: 0,
    statesReporting: 34,
    asOf: "2026-07-13",
    pageUpdated: "2026-07-15",
    reportingLagWeeks: 6,
    source: "CDC Cyclosporiasis Surveillance",
    sourceUrl: "https://www.cdc.gov/cyclosporiasis/php/surveillance/index.html",
  },
  linkedOutbreak: {
    cases: 1644,
    hospitalizations: 94,
    deaths: 0,
    states: ["IN", "KY", "MI", "OH", "WV"],
    lastOnset: "2026-07-13",
    product: "Shredded iceberg lettuce from Taylor Farms de Mexico served at some Taco Bell locations",
    status: "Open",
    asOf: "2026-07-17",
    source: "FDA outbreak advisory",
    sourceUrl:
      "https://www.fda.gov/food/outbreaks-foodborne-illness/investigation-5-state-outbreak-cyclospora-illnesses-iceberg-lettuce-july-2026",
  },
  mapSignals: [],
  news: [],
  blog: {
    date: "2026-07-18",
    window: "News published on July 17, 2026",
    title: "News in Reverse: the source narrowed while the scope stayed wider",
    dek: "The strongest new evidence applies to one large five-state subset—not every case nationwide.",
    paragraphs: [],
    method: "Generated from dated, linked source records.",
  },
};

const situationRows = [
  {
    place: "United States",
    scope: "Confirmed, domestically acquired",
    cases: 1645,
    display: "1,645",
    asOf: "Jul 13",
    level: "High",
    type: "Official",
    source: "CDC",
    url: "https://www.cdc.gov/cyclosporiasis/php/surveillance/index.html",
  },
  {
    place: "5-state linked subset",
    scope: "Reported Taco Bell exposure",
    cases: 1644,
    display: ">1,644",
    asOf: "Jul 17",
    level: "High",
    type: "Official",
    source: "FDA / CDC",
    url: "https://www.fda.gov/food/outbreaks-foodborne-illness/investigation-5-state-outbreak-cyclospora-illnesses-iceberg-lettuce-july-2026",
  },
  {
    place: "Michigan",
    scope: "State reports; may include probable",
    cases: 2640,
    display: "2,640",
    asOf: "Jul 13",
    level: "High",
    type: "Official",
    source: "MDHHS",
    url: "https://www.michigan.gov/mdhhs/inside-mdhhs/newsroom/2026/07/13/cyclo-3",
  },
  {
    place: "Kentucky",
    scope: "Reported / confirmed",
    cases: 192,
    display: "192 / 108",
    asOf: "Jul 16",
    level: "High",
    type: "Newsroom",
    source: "WKYT citing KDPH",
    url: "https://www.wkyt.com/2026/07/16/kentucky-health-officials-investigating-nearly-200-reported-cases-cyclosporiasis/",
  },
  {
    place: "Indiana",
    scope: "Increased reports; count not posted here",
    cases: 0,
    display: "↑ activity",
    asOf: "Jul 16",
    level: "High",
    type: "Official",
    source: "IDOH",
    url: "https://www.in.gov/health/idepd/diseases-and-conditions-resource-page/cyclosporiasis/",
  },
  {
    place: "Washington",
    scope: "No common-source outbreak signal reported",
    cases: 0,
    display: "monitoring",
    asOf: "Jul 17",
    level: "Watch",
    type: "Newsroom",
    source: "Axios citing WADOH",
    url: "https://www.axios.com/local/seattle/2026/07/17/what-washingtonians-should-know-about-the-cyclospora-outbreak",
  },
];

const annualCases = [
  { year: 2016, value: 537, comparable: true },
  { year: 2017, value: 1194, comparable: true },
  { year: 2018, value: 3519, comparable: true },
  { year: 2019, value: 4703, comparable: true },
  { year: 2020, value: null, comparable: false },
  { year: 2021, value: null, comparable: false },
  { year: 2022, value: 3091, comparable: true },
  { year: 2023, value: null, comparable: false },
  { year: 2024, value: 4211, comparable: true },
  { year: 2025, value: 3948, comparable: true },
  { year: 2026, value: 1645, comparable: false },
];

const sources = [
  {
    title: "2026 national surveillance",
    org: "CDC",
    type: "Official",
    topic: "Cases",
    url: "https://www.cdc.gov/cyclosporiasis/php/surveillance/index.html",
    note: "Confirmed domestic case total, hospitalization count, caveats, and reporting lag.",
  },
  {
    title: "Five-state lettuce outbreak advisory",
    org: "FDA",
    type: "Official",
    topic: "Outbreak",
    url: "https://www.fda.gov/food/outbreaks-foodborne-illness/investigation-5-state-outbreak-cyclospora-illnesses-iceberg-lettuce-july-2026",
    note: "Traceback, implicated product, states, cases, and consumer recommendations.",
  },
  {
    title: "Cyclospora outbreak alert",
    org: "CDC",
    type: "Official",
    topic: "Outbreak",
    url: "https://www.cdc.gov/cyclosporiasis/outbreaks/07-26/index.html",
    note: "Plain-language alert, symptoms, and produce safety advice.",
  },
  {
    title: "Life cycle and laboratory identification",
    org: "CDC DPDx",
    type: "Official",
    topic: "Research",
    url: "https://www.cdc.gov/dpdx/cyclosporiasis/index.html",
    note: "Why fresh oocysts are not immediately infectious and how the parasite develops.",
  },
  {
    title: "Life Cycle and Transmission: Knowns and Unknowns",
    org: "Clinical Microbiology Reviews / PubMed",
    type: "Research",
    topic: "Research",
    url: "https://pubmed.ncbi.nlm.nih.gov/35056567/",
    note: "Peer-reviewed review of established evidence and remaining knowledge gaps.",
  },
  {
    title: "Detection, epidemiology and control scoping review",
    org: "Epidemiology & Infection / PubMed",
    type: "Research",
    topic: "Research",
    url: "https://pubmed.ncbi.nlm.nih.gov/33504406/",
    note: "Review covering produce, water, soil, detection, and control literature.",
  },
  {
    title: "1996 U.S. Cyclospora outbreak",
    org: "CDC MMWR",
    type: "Official",
    topic: "History",
    url: "https://www.cdc.gov/Mmwr/preview/mmwrhtml/00042789.htm",
    note: "Contemporary federal report on the raspberry-associated outbreak.",
  },
  {
    title: "Independent current outbreak reporting",
    org: "Associated Press",
    type: "Newsroom",
    topic: "News",
    url: "https://apnews.com/article/13d9e9ebdc46a4d05a58da2ae8e8d0de",
    note: "Independent reporting; useful context, but official advisories control safety actions.",
  },
  {
    title: "Community discussion monitor",
    org: "Reddit search",
    type: "Community",
    topic: "Chatter",
    url: "https://www.reddit.com/search/?q=cyclospora&sort=new",
    note: "Unverified public conversation. Never counted as cases or evidence of a source.",
  },
];

const quiz = [
  {
    question: "Which current claim has the strongest federal evidence?",
    options: [
      "All U.S. cases came from municipal water",
      "One large five-state subset is linked to shredded iceberg lettuce",
      "Cyclospora spreads easily from person to person",
    ],
    answer: 1,
    explain: "FDA traceback converged on one lettuce supplier for the five-state subset; other national cases remain under investigation.",
  },
  {
    question: "What symptom most strongly fits cyclosporiasis?",
    options: ["Frequent watery diarrhea", "A rash only", "A cough only"],
    answer: 0,
    explain: "Watery diarrhea is the most common symptom; fatigue, cramping, nausea, and loss of appetite can also occur.",
  },
  {
    question: "Can a routine stool test miss Cyclospora?",
    options: ["No, every panel includes it", "Yes, a specific test may be needed", "Testing is never useful"],
    answer: 1,
    explain: "CDC advises patients and clinicians that Cyclospora-specific testing may need to be requested.",
  },
  {
    question: "What does washing produce do?",
    options: ["Guarantees removal", "Reduces risk but cannot guarantee removal", "Makes produce sterile"],
    answer: 1,
    explain: "Running water can reduce risk, but CDC says washing alone cannot guarantee removal; cooking to at least 158°F (70°C) kills the parasite.",
  },
  {
    question: "Why is direct person-to-person spread unlikely?",
    options: ["The parasite cannot enter humans", "Shed oocysts need time in the environment to become infectious", "It only infects plants"],
    answer: 1,
    explain: "Freshly shed oocysts are not infectious. They must mature outside the host for days or weeks.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function SourceTag({ type }: { type: string }) {
  const lowered = type.toLowerCase();
  return <span className={`source-tag source-${lowered}`}>{type}</span>;
}

function SectionHead({
  kicker,
  title,
  copy,
}: {
  kicker: string;
  title: string;
  copy?: string;
}) {
  return (
    <div className="section-head">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      {copy && <p>{copy}</p>}
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState<LiveData>(fallbackData);
  const [feedFilter, setFeedFilter] = useState<"all" | "official" | "newsroom" | "community">("all");
  const [tableSort, setTableSort] = useState<"cases" | "place">("cases");
  const [sourceQuery, setSourceQuery] = useState("");
  const [sourceType, setSourceType] = useState("All");
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizChoice, setQuizChoice] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [comment, setComment] = useState("");
  const [commentName, setCommentName] = useState("");
  const [savedComments, setSavedComments] = useState<Array<{ name: string; body: string; date: string }>>([]);

  useEffect(() => {
    fetch("/data/live.json", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Live data unavailable");
        return (await response.json()) as LiveData;
      })
      .then((payload) => setData(payload))
      .catch(() => undefined);
    try {
      const stored = localStorage.getItem("outbreak-atlas-comments");
      if (stored) setSavedComments(JSON.parse(stored));
    } catch {
      // Device-local comments are optional and never block the site.
    }
  }, []);

  const filteredNews = useMemo(
    () => data.news.filter((item) => feedFilter === "all" || item.sourceType === feedFilter),
    [data.news, feedFilter],
  );
  const sortedRows = useMemo(
    () =>
      [...situationRows].sort((a, b) =>
        tableSort === "cases" ? b.cases - a.cases : a.place.localeCompare(b.place),
      ),
    [tableSort],
  );
  const filteredSources = useMemo(() => {
    const query = sourceQuery.toLowerCase();
    return sources.filter(
      (source) =>
        (sourceType === "All" || source.type === sourceType) &&
        `${source.title} ${source.org} ${source.note}`.toLowerCase().includes(query),
    );
  }, [sourceQuery, sourceType]);

  function answerQuiz(choice: number) {
    if (quizChoice !== null) return;
    setQuizChoice(choice);
    if (choice === quiz[quizIndex].answer) setQuizScore((score) => score + 1);
  }

  function advanceQuiz() {
    if (quizIndex < quiz.length - 1) {
      setQuizIndex((index) => index + 1);
      setQuizChoice(null);
    } else {
      setQuizIndex(0);
      setQuizChoice(null);
      setQuizScore(0);
    }
  }

  function saveComment(event: React.FormEvent) {
    event.preventDefault();
    if (!comment.trim()) return;
    const next = [
      { name: commentName.trim() || "Guest", body: comment.trim(), date: new Date().toISOString() },
      ...savedComments,
    ].slice(0, 8);
    setSavedComments(next);
    setComment("");
    try {
      localStorage.setItem("outbreak-atlas-comments", JSON.stringify(next));
    } catch {
      // Local storage may be disabled.
    }
  }

  const maxAnnual = 4703;
  const today = new Date("2026-07-18T12:00:00Z");
  const seasonStart = new Date("2026-05-01T00:00:00Z");
  const seasonEnd = new Date("2026-08-31T00:00:00Z");
  const seasonDay = Math.floor((today.getTime() - seasonStart.getTime()) / 86400000) + 1;
  const daysLeft = Math.ceil((seasonEnd.getTime() - today.getTime()) / 86400000);

  return (
    <main>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <a href="#top" className="brand" aria-label="Outbreak Atlas home">
          <span className="brand-mark"><Activity size={19} /></span>
          <span><strong>Outbreak Atlas</strong><small>Cyclospora desk</small></span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#situation">Situation</a>
          <a href="#map">Map</a>
          <a href="#analysis">Analysis</a>
          <a href="#learn">Learn</a>
          <a href="#sources">Sources</a>
        </nav>
        <a className="header-alert" href="#safety"><CircleAlert size={16} /> What to do now</a>
      </header>

      <div id="top" className="alert-ticker" role="status">
        <span className="live-dot" />
        <strong>{data.alert.level.toUpperCase()} ALERT</strong>
        <span>Day {seasonDay} of the 2026 U.S. Cyclospora season</span>
        <span>{daysLeft} days to the seasonal window’s end</span>
        <span>Last known onset: {formatDate(data.linkedOutbreak.lastOnset)}</span>
        <a href={data.linkedOutbreak.sourceUrl} target="_blank" rel="noreferrer">Open federal advisory <ArrowUpRight size={14} /></a>
      </div>

      <section id="main-content" className="hero section-dark">
        <div className="hero-copy">
          <p className="eyebrow light">United States / live public-health intelligence</p>
          <h1>The outbreak, mapped—<em>without the rumor.</em></h1>
          <p className="hero-lede">
            One evidence-led desk for Cyclospora cases, official alerts, local signals,
            news, research, and practical actions. Every claim has a scope, timestamp,
            and source label.
          </p>
          <div className="hero-actions">
            <a className="button button-primary" href="#map"><MapPinned size={18} /> Search near me</a>
            <a className="button button-ghost" href="#safety"><ShieldCheck size={18} /> Stay safer</a>
          </div>
          <div className="verified-note"><BadgeCheck size={17} /> Last source check {formatDate(data.generatedAt)} · Daily workflow enabled</div>
        </div>

        <div className="hero-dashboard" aria-label="Current case summary">
          <div className="alert-gauge">
            <div className="gauge-head"><span>Evidence alert index</span><strong>{data.alert.score}/100</strong></div>
            <div className="gauge-track"><span style={{ width: `${data.alert.score}%` }} /></div>
            <p>{data.alert.reason}</p>
            <button className="method-link" onClick={() => document.querySelector("#methodology")?.scrollIntoView({ behavior: "smooth" })}>How this is scored <ChevronDown size={14} /></button>
          </div>
          <div className="stat-grid">
            <article className="stat-card stat-primary">
              <span>Confirmed domestic cases</span>
              <strong>{data.national.confirmedDomestic.toLocaleString()}</strong>
              <small>CDC · as of {formatDate(data.national.asOf)}</small>
            </article>
            <article className="stat-card">
              <span>States reporting</span>
              <strong>{data.national.statesReporting}</strong>
              <small>Laboratory-confirmed national surveillance</small>
            </article>
            <article className="stat-card">
              <span>Hospitalizations</span>
              <strong>{data.national.hospitalizations}</strong>
              <small>National confirmed cases</small>
            </article>
            <article className="stat-card">
              <span>Reported deaths</span>
              <strong>{data.national.deaths}</strong>
              <small>Not the same as “no risk”</small>
            </article>
          </div>
          <div className="lag-card"><Clock3 size={18} /><div><strong>Expect a reporting lag</strong><span>CDC assumes about {data.national.reportingLagWeeks} weeks from illness onset to federal reporting.</span></div></div>
        </div>
      </section>

      <section className="scope-strip">
        <div><span className="scope-number">1</span><p><strong>National surveillance</strong><br />1,645 confirmed domestic cases across 34 states.</p></div>
        <div className="scope-connector">contains, but is not identical to</div>
        <div><span className="scope-number">2</span><p><strong>Linked outbreak subset</strong><br />More than 1,644 illness reports with Taco Bell exposure in five states.</p></div>
        <div className="scope-warning"><Info size={18} /><p>Different pipelines and definitions can produce totals that look contradictory. Do not add these numbers together.</p></div>
      </section>

      <section id="situation" className="content-section">
        <SectionHead
          kicker="01 / Current situation"
          title="What officials know right now"
          copy="The actionable finding is narrower than the national surge: a large five-state subset is linked to shredded iceberg lettuce. Other illnesses are still under investigation."
        />
        <div className="situation-grid">
          <article className="advisory-card">
            <div className="advisory-top"><SourceTag type="Official" /><span>Updated Jul 17</span></div>
            <p className="eyebrow">Federal food safety alert</p>
            <h3>Do not eat implicated shredded iceberg lettuce at some Taco Bell locations.</h3>
            <p>The CDC and FDA advisory applies to locations in Indiana, Kentucky, Michigan, Ohio, and West Virginia. Not every location received the product.</p>
            <div className="state-chips">{data.linkedOutbreak.states.map((state) => <span key={state}>{state}</span>)}</div>
            <a href={data.linkedOutbreak.sourceUrl} target="_blank" rel="noreferrer">Read the FDA advisory <ExternalLink size={15} /></a>
          </article>
          <article className="known-unknown-card">
            <div className="known-column">
              <p className="eyebrow"><Check size={15} /> Confirmed</p>
              <ul>
                <li>Traceback converged on Taylor Farms de Mexico for the five-state subset.</li>
                <li>The implicated food is shredded iceberg lettuce served at some Taco Bell locations.</li>
                <li>The supplier announced removal of central-Mexico iceberg lettuce from the U.S. market.</li>
              </ul>
            </div>
            <div className="unknown-column">
              <p className="eyebrow"><Search size={15} /> Still unknown</p>
              <ul>
                <li>What sources explain every U.S. case outside the linked subset.</li>
                <li>Whether additional brands, restaurants, retailers, or channels will be identified.</li>
                <li>The true total, because testing and reporting are incomplete and delayed.</li>
              </ul>
            </div>
          </article>
        </div>
      </section>

      <section id="map" className="map-section section-dark">
        <SectionHead
          kicker="02 / Geographic signals"
          title="Cases near me"
          copy="Markers show public jurisdiction-level signals—not patient addresses and not a complete census. Search results point to the nearest listed signal and always preserve the uncertainty."
        />
        <OutbreakMap signals={data.mapSignals} />
        <div className="map-footnotes">
          <p><ShieldCheck size={16} /> Privacy rule: no exact patient, household, or hospital-level case locations.</p>
          <p><Database size={16} /> Coverage rule: absence of a marker is not evidence of zero cases.</p>
        </div>
      </section>

      <section className="content-section table-section">
        <SectionHead
          kicker="03 / Explorer"
          title="Jurisdiction comparison table"
          copy="A Tableau-like comparison with explicit definitions. Sort it, follow the source, and compare only like with like."
        />
        <div className="table-toolbar">
          <div className="table-pills">
            <button className={tableSort === "cases" ? "active" : ""} onClick={() => setTableSort("cases")}>Sort by signal</button>
            <button className={tableSort === "place" ? "active" : ""} onClick={() => setTableSort("place")}>Sort A–Z</button>
          </div>
          <p><Info size={15} /> State reports may include probable cases and arrive before federal confirmation.</p>
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead><tr><th>Jurisdiction</th><th>Measure / definition</th><th>Reported signal</th><th>As of</th><th>Level</th><th>Source</th></tr></thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr key={row.place}>
                  <td><strong>{row.place}</strong></td>
                  <td>{row.scope}</td>
                  <td className="mono strong">{row.display}</td>
                  <td>{row.asOf}</td>
                  <td><span className={`level-pill level-${row.level.toLowerCase()}`}>{row.level}</span></td>
                  <td><SourceTag type={row.type} /> <a href={row.url} target="_blank" rel="noreferrer">{row.source} ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="feed-section section-paper">
        <SectionHead
          kicker="04 / Intelligence stream"
          title="News, public agencies, and chatter"
          copy="Official alerts drive recommendations. News adds context. Community chatter is useful for questions and access barriers—but never counted as evidence."
        />
        <div className="feed-tabs" role="tablist" aria-label="Filter intelligence feed">
          {(["all", "official", "newsroom", "community"] as const).map((filter) => (
            <button key={filter} className={feedFilter === filter ? "active" : ""} onClick={() => setFeedFilter(filter)}>{filter === "all" ? "All sources" : filter}</button>
          ))}
        </div>
        <div className="feed-layout">
          <div className="news-list">
            {filteredNews.map((item) => (
              <article className="news-card" key={item.url}>
                <div className="news-meta"><SourceTag type={item.sourceType === "newsroom" ? "Newsroom" : item.sourceType === "community" ? "Community" : "Official"} /><span>{item.source}</span><time>{formatDate(item.published)}</time></div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <a href={item.url} target="_blank" rel="noreferrer">Open source <ArrowUpRight size={15} /></a>
              </article>
            ))}
            {feedFilter === "community" && (
              <article className="news-card rumor-card">
                <div className="news-meta"><SourceTag type="Community" /><span>Unverified pattern</span></div>
                <h3>Testing access and “is it the water?” dominate community questions.</h3>
                <p>These are valid questions, not verified case reports. Current CDC/FDA evidence does not identify a municipal water system as the source of this outbreak.</p>
                <a href="https://www.reddit.com/search/?q=cyclospora&sort=new" target="_blank" rel="noreferrer">View unverified public discussion <ArrowUpRight size={15} /></a>
              </article>
            )}
          </div>
          <aside className="chatter-panel">
            <p className="eyebrow"><MessageCircle size={15} /> Chatter watch</p>
            <h3>Signals people are discussing</h3>
            <div className="chatter-item"><span>High volume</span><strong>Testing delays & requesting the right stool panel</strong><small>Action: point to CDC clinical guidance</small></div>
            <div className="chatter-item"><span>High volume</span><strong>Fresh produce and restaurant exposure questions</strong><small>Action: point to the exact five-state advisory</small></div>
            <div className="chatter-item chatter-rumor"><span>Rumor</span><strong>“The municipal water is confirmed”</strong><small>Verdict: unsupported by current outbreak evidence</small></div>
            <p className="panel-note">Chatter categories are qualitative and never affect the case count. They can raise questions for official follow-up.</p>
          </aside>
        </div>
      </section>

      <section className="reverse-section section-dark">
        <div className="reverse-intro">
          <span className="reverse-badge"><Newspaper size={19} /> Daily edition</span>
          <p className="eyebrow light">News in Reverse / {data.blog.window}</p>
          <h2>{data.blog.title}</h2>
          <p>{data.blog.dek}</p>
        </div>
        <article className="reverse-article">
          <div className="reverse-rule"><span>Now</span><i /><span>Yesterday</span></div>
          {(data.blog.paragraphs.length ? data.blog.paragraphs : [data.blog.dek]).map((paragraph, index) => (
            <div className="reverse-step" key={paragraph}><span>{String(index + 1).padStart(2, "0")}</span><p>{paragraph}</p></div>
          ))}
          <footer><Sparkles size={16} /><span>{data.blog.method}</span></footer>
        </article>
      </section>

      <section id="analysis" className="content-section analysis-section">
        <SectionHead
          kicker="05 / Predictive synthesis"
          title="What the evidence most likely means"
          copy="This is a structured evidence synthesis, not a diagnostic tool or a numerical epidemic forecast. Confidence falls when claims outrun official tracebacks."
        />
        <div className="hypothesis-grid">
          <article className="hypothesis-card confidence-high">
            <div><span>Very high confidence</span><strong>01</strong></div>
            <h3>A large five-state subset came through one lettuce supply chain.</h3>
            <p>Federal epidemiology and traceback converged on shredded iceberg lettuce from Taylor Farms de Mexico served at some Taco Bell locations.</p>
            <a href={data.linkedOutbreak.sourceUrl} target="_blank" rel="noreferrer">FDA evidence <ExternalLink size={14} /></a>
          </article>
          <article className="hypothesis-card confidence-medium">
            <div><span>Moderate confidence</span><strong>02</strong></div>
            <h3>The national surge likely includes more than one cluster or exposure.</h3>
            <p>CDC explicitly says it is investigating several outbreaks and that not all national illnesses belong to the five-state subset.</p>
            <a href={data.national.sourceUrl} target="_blank" rel="noreferrer">CDC surveillance <ExternalLink size={14} /></a>
          </article>
          <article className="hypothesis-card confidence-low">
            <div><span>Low / unsupported</span><strong>03</strong></div>
            <h3>A U.S. municipal water system caused the current outbreak.</h3>
            <p>Water can transmit Cyclospora and may contaminate produce upstream. But current CDC/FDA outbreak pages do not implicate municipal drinking water.</p>
            <a href="https://www.cdc.gov/cyclosporiasis/about/index.html" target="_blank" rel="noreferrer">Transmission facts <ExternalLink size={14} /></a>
          </article>
        </div>
        <div id="methodology" className="methodology-card">
          <div className="method-score"><span>{data.alert.score}</span><small>High alert</small></div>
          <div><p className="eyebrow">Transparent alert method</p><h3>Severity + spread + growth + source confidence − reporting quality</h3><p>The current score is driven by an open federal alert, multi-state spread, more than 1,000 confirmed cases, hospitalizations, and incomplete source resolution. It is not a government alert scale and should never replace an official advisory.</p></div>
          <div className="score-breakdown"><span><i style={{ width: "92%" }} /> Official alert 23/25</span><span><i style={{ width: "84%" }} /> Geographic spread 21/25</span><span><i style={{ width: "80%" }} /> Case burden 20/25</span><span><i style={{ width: "88%" }} /> Uncertainty 22/25</span></div>
        </div>
      </section>

      <section id="safety" className="safety-section section-paper">
        <SectionHead
          kicker="06 / Evidence-based protection"
          title="What to do today"
          copy="Practical steps follow CDC and FDA guidance. There are no affiliate links and no product is presented as a cure."
        />
        <div className="safety-grid">
          <article className="safety-now">
            <p className="eyebrow"><CircleAlert size={15} /> During the active advisory</p>
            <ol>
              <li><span>01</span><div><strong>Follow the exact lettuce warning</strong><p>Avoid implicated shredded iceberg lettuce at Taco Bell locations in IN, KY, MI, OH, and WV.</p></div></li>
              <li><span>02</span><div><strong>Wash produce under running water</strong><p>Do not use soap, bleach, or detergent. Washing reduces risk but cannot guarantee removal.</p></div></li>
              <li><span>03</span><div><strong>Cook when practical</strong><p>CDC says cooking produce to at least 158°F (70°C) kills Cyclospora.</p></div></li>
              <li><span>04</span><div><strong>Ask for the right test</strong><p>For persistent watery diarrhea, contact a clinician and mention Cyclospora; routine stool tests may miss it.</p></div></li>
              <li><span>05</span><div><strong>Hydrate and watch red flags</strong><p>Seek urgent care for severe dehydration, confusion, fainting, inability to keep fluids down, or worsening symptoms.</p></div></li>
            </ol>
          </article>
          <div className="supply-column">
            <article className="supply-card">
              <Thermometer size={22} />
              <div><SourceTag type="Official" /><h3>Food thermometer</h3><p>Use for cooked produce when following the 158°F (70°C) outbreak guidance.</p><a href="https://www.cdc.gov/cyclosporiasis/outbreaks/07-26/index.html" target="_blank" rel="noreferrer">CDC cooking guidance ↗</a></div>
            </article>
            <article className="supply-card">
              <Waves size={22} />
              <div><SourceTag type="Official" /><h3>Water treatment guidance</h3><p>If an authority issues a water advisory, follow that advisory. Boiling is the most reliable emergency pathogen-reduction method.</p><a href="https://www.cdc.gov/water-emergency/about/index.html" target="_blank" rel="noreferrer">CDC emergency water steps ↗</a></div>
            </article>
            <article className="supply-card">
              <ShieldCheck size={22} />
              <div><SourceTag type="Official" /><h3>Certified filter lookup</h3><p>No consumer filter is endorsed here specifically for Cyclospora. Check certification claims and the contaminant the unit is certified to reduce.</p><a href="https://info.nsf.org/Certified/DWTU/" target="_blank" rel="noreferrer">NSF certified product database ↗</a></div>
            </article>
            <article className="supply-card">
              <Building2 size={22} />
              <div><SourceTag type="Official" /><h3>Find care near you</h3><p>Hospital-level case counts are not public. Use official directories to locate care—not to infer where infections occurred.</p><a href="https://www.medicare.gov/care-compare/?providerType=Hospital" target="_blank" rel="noreferrer">Medicare Care Compare ↗</a><a href="https://findahealthcenter.hrsa.gov/" target="_blank" rel="noreferrer">HRSA health centers ↗</a></div>
            </article>
          </div>
        </div>
      </section>

      <section id="learn" className="content-section lifecycle-section">
        <SectionHead
          kicker="07 / Parasite lifecycle"
          title="Why the spread pattern is different"
          copy="Cyclospora is not immediately infectious when it leaves a person. Environmental maturation is the crucial step—and the reason direct person-to-person spread is unlikely."
        />
        <div className="lifecycle-track">
          {[
            ["01", "Shed", "Unsporulated oocysts leave the body in stool; they are not yet infectious."],
            ["02", "Mature", "In favorable conditions, oocysts sporulate in the environment over days or weeks."],
            ["03", "Contaminate", "Infectious oocysts can reach food or water through fecal contamination."],
            ["04", "Ingest", "A person consumes contaminated food or water; the parasite reaches the small intestine."],
            ["05", "Multiply", "Sporozoites invade intestinal cells, reproduce, and can trigger watery diarrhea and fatigue."],
            ["06", "Repeat", "New unsporulated oocysts are shed, beginning the environmental stage again."],
          ].map(([number, title, copy]) => (
            <article key={number}><span>{number}</span><div className="cycle-icon"><Microscope size={23} /></div><h3>{title}</h3><p>{copy}</p></article>
          ))}
        </div>
        <div className="lifecycle-note"><FlaskConical size={20} /><p><strong>Known:</strong> maturation outside the host is required. <strong>Still being studied:</strong> how survival, temperature, water, soil, and farm conditions combine in real supply chains.</p><a href="https://www.cdc.gov/dpdx/cyclosporiasis/index.html" target="_blank" rel="noreferrer">CDC DPDx lifecycle ↗</a></div>
      </section>

      <section className="compare-section section-dark">
        <SectionHead
          kicker="08 / Preventing miseducation"
          title="Cyclospora is not “the next COVID”"
          copy="Both demand transparent surveillance, but the agents, routes, prevention tools, and outbreak response are fundamentally different."
        />
        <div className="comparison-table" role="table" aria-label="Cyclospora and COVID-19 comparison">
          <div className="comparison-row comparison-head" role="row"><span>Feature</span><strong>Cyclospora</strong><strong>COVID-19</strong></div>
          {[
            ["Agent", "Single-celled protozoan parasite", "SARS-CoV-2 virus"],
            ["Primary route", "Contaminated food or water", "Airborne respiratory particles"],
            ["Direct person spread", "Unlikely; oocysts mature outside the host", "Common, including before symptoms"],
            ["Main illness pattern", "Gastrointestinal; prolonged watery diarrhea", "Respiratory/systemic; severity varies"],
            ["Prevention", "Source control, recalls, produce hygiene, cooking", "Vaccination, cleaner air, staying home when sick, masks when useful"],
            ["Specific treatment", "Prescription TMP-SMX is standard", "Antivirals for eligible patients; supportive care"],
          ].map((row) => <div className="comparison-row" role="row" key={row[0]}><span>{row[0]}</span><p>{row[1]}</p><p>{row[2]}</p></div>)}
        </div>
        <div className="lesson-strip"><BadgeCheck size={19} /><p><strong>The shared lesson:</strong> early laboratory detection, rapid reporting, transparent uncertainty, supply-chain or transmission-source control, and public guidance that matches the actual route.</p><a href="https://www.cdc.gov/covid/prevention/index.html" target="_blank" rel="noreferrer">CDC COVID prevention ↗</a></div>
      </section>

      <section className="content-section history-section">
        <SectionHead
          kicker="09 / Long view"
          title="From first recognition to today"
          copy="Event sizes below are not directly comparable. This timeline is about response lessons, while the bar chart uses only years with a cited national Cyclospora total."
        />
        <div className="history-layout">
          <div className="timeline">
            {[
              ["1977–79", "First recognized human cases", "Early cases were described before the organism received its current name."],
              ["1981", "AIDS recognized in the U.S.", "A reminder that syndromic observation and transparent reporting can precede complete biological understanding."],
              ["1993", "Milwaukee Cryptosporidium outbreak", "An estimated 403,000 illnesses showed the consequences of a water-treatment failure—but involved a different parasite."],
              ["1996–97", "Raspberry-linked Cyclospora outbreaks", "Imported raspberries were linked to major U.S./Canadian outbreaks; produce testing was still limited."],
              ["1999", "Nationally notifiable", "Cyclosporiasis entered national surveillance, creating a more consistent signal."],
              ["2019", "4,703 cases reported", "The highest cited pre-2026 national total in CDC’s recent trend discussion."],
              ["2020", "COVID-19 pandemic", "Public health scaled testing, dashboards, genomic surveillance, and risk communication—with mixed trust outcomes."],
              ["2026", "Current Cyclospora surge", "Federal surveillance, state reports, and a five-state lettuce traceback are updating at different speeds."],
            ].map(([year, title, copy]) => <article key={year}><span>{year}</span><div><h3>{title}</h3><p>{copy}</p></div></article>)}
          </div>
          <div className="trend-card">
            <div className="trend-head"><div><p className="eyebrow">Reported U.S. cyclosporiasis</p><h3>Selected annual totals</h3></div><span><ArrowDown size={15} /> Missing years stay missing</span></div>
            <div className="bar-chart" aria-label="Selected annual U.S. cyclosporiasis totals">
              {annualCases.map((item) => (
                <div className={`bar-column ${item.comparable ? "" : "partial"}`} key={item.year}>
                  <span className="bar-value">{item.value?.toLocaleString() ?? "n/a"}</span>
                  <div className="bar-slot">{item.value ? <i style={{ height: `${Math.max(8, (item.value / maxAnnual) * 100)}%` }} /> : <i className="bar-missing" />}</div>
                  <small>{item.year}</small>
                </div>
              ))}
            </div>
            <p className="chart-note">2016–19 totals: CDC MMWR. 2022: sum of CDC final monthly table. 2024–25: NNDSS week-52 totals. 2026: confirmed domestic cases since May 1, through July 13—partial and not definition-matched.</p>
            <a href="https://www.cdc.gov/mmwr/volumes/72/wr/mm7227a3.htm" target="_blank" rel="noreferrer">CDC trend context <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </section>

      <section className="quiz-section section-paper">
        <div className="quiz-intro"><p className="eyebrow">10 / Interactive check</p><h2>Could you spot the parasite—and the misinformation?</h2><p>Five quick questions based on CDC and FDA guidance. This is educational, not a symptom checker.</p><div className="quiz-progress"><span style={{ width: `${((quizIndex + 1) / quiz.length) * 100}%` }} /></div><small>Question {quizIndex + 1} of {quiz.length} · Score {quizScore}/{quiz.length}</small></div>
        <div className="quiz-card">
          <span className="quiz-number">0{quizIndex + 1}</span>
          <h3>{quiz[quizIndex].question}</h3>
          <div className="quiz-options">
            {quiz[quizIndex].options.map((option, index) => {
              const answered = quizChoice !== null;
              const correct = index === quiz[quizIndex].answer;
              const chosen = index === quizChoice;
              return <button key={option} onClick={() => answerQuiz(index)} disabled={answered} className={answered && correct ? "correct" : answered && chosen ? "wrong" : ""}><span>{String.fromCharCode(65 + index)}</span>{option}{answered && correct && <Check size={18} />}{answered && chosen && !correct && <X size={18} />}</button>;
            })}
          </div>
          {quizChoice !== null && <div className="quiz-explain"><Info size={18} /><p>{quiz[quizIndex].explain}</p><button onClick={advanceQuiz}>{quizIndex === quiz.length - 1 ? "Restart quiz" : "Next question"} <ArrowUpRight size={15} /></button></div>}
        </div>
      </section>

      <section id="sources" className="content-section sources-section">
        <SectionHead
          kicker="11 / Source directory"
          title="Follow the evidence yourself"
          copy="Official sources control alerts and counts. Peer-reviewed research explains mechanisms. News and community links are clearly labeled and never silently upgraded."
        />
        <div className="source-toolbar">
          <label><Search size={17} /><span className="sr-only">Search sources</span><input value={sourceQuery} onChange={(event) => setSourceQuery(event.target.value)} placeholder="Search cases, lifecycle, history…" /></label>
          <div>{["All", "Official", "Research", "Newsroom", "Community"].map((type) => <button key={type} className={sourceType === type ? "active" : ""} onClick={() => setSourceType(type)}>{type}</button>)}</div>
        </div>
        <div className="source-grid">
          {filteredSources.map((source) => (
            <a className="source-card" key={source.url} href={source.url} target="_blank" rel="noreferrer">
              <div><SourceTag type={source.type} /><span>{source.topic}</span></div>
              <h3>{source.title}</h3><p>{source.note}</p><footer><span>{source.org}</span><ExternalLink size={16} /></footer>
            </a>
          ))}
        </div>
      </section>

      <section className="comments-section section-dark">
        <div className="comments-copy"><p className="eyebrow light">12 / Guest notes</p><h2>Questions, observations, and corrections</h2><p>Version one saves notes only on this device. It does not publish health claims or collect patient data. Do not include names, exact addresses, medical records, or accusations.</p><a href="https://github.com/BREXAtlas/emergingoutbreaks/issues/new" target="_blank" rel="noreferrer"><FileText size={17} /> Submit a public, reviewable correction on GitHub</a></div>
        <div className="comment-box">
          <form onSubmit={saveComment}>
            <label>Display name <input value={commentName} onChange={(event) => setCommentName(event.target.value)} placeholder="Guest" maxLength={40} /></label>
            <label>Your note <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Ask a question or leave a source-backed correction…" maxLength={500} /></label>
            <div><small>{comment.length}/500 · saved locally</small><button type="submit">Save note <MessageCircle size={16} /></button></div>
          </form>
          {savedComments.length > 0 && <div className="saved-comments">{savedComments.map((item, index) => <article key={`${item.date}-${index}`}><div><strong>{item.name}</strong><time>{formatDate(item.date)}</time></div><p>{item.body}</p><span>Unverified guest note · this device only</span></article>)}</div>}
        </div>
      </section>

      <footer className="site-footer">
        <div className="brand"><span className="brand-mark"><Activity size={19} /></span><span><strong>Outbreak Atlas</strong><small>Cyclospora desk</small></span></div>
        <p>Public-interest outbreak education by BREXAtlas. Not medical advice, not a government service, and not a substitute for your clinician or health department.</p>
        <div><a href={data.national.sourceUrl} target="_blank" rel="noreferrer">CDC surveillance</a><a href={data.linkedOutbreak.sourceUrl} target="_blank" rel="noreferrer">FDA advisory</a><a href="https://github.com/BREXAtlas/emergingoutbreaks" target="_blank" rel="noreferrer">Open source</a></div>
      </footer>
    </main>
  );
}
