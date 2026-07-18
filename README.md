# Outbreak Atlas — Cyclospora Situation Desk

An evidence-led U.S. Cyclospora outbreak tracker from BREXAtlas. The site separates federal confirmed surveillance, state reports, a specific linked outbreak, independent news, and unverified community chatter so unlike totals are never silently combined.

Original repository note: “Outbreak track.”

## What is included

- interactive U.S. signal map with city/ZIP/geolocation search
- current national and five-state linked-outbreak case scopes
- sortable jurisdiction table and alert methodology
- daily **News in Reverse** brief generated from the previous day’s indexed news
- CDC/FDA safety guidance, care and water-treatment resources
- parasite lifecycle, Cyclospora/COVID comparison, quiz, and historical context
- fully labeled official, research, newsroom, and community sources
- device-local guest notes plus a public GitHub correction path

## Daily data workflow

`.github/workflows/daily-intelligence.yml` runs every day. It:

1. reads clearly labeled figures from the CDC surveillance and FDA outbreak pages;
2. indexes recent Cyclospora headline metadata;
3. writes `public/data/live.json` without erasing the last verified values if a source is unavailable;
4. validates source scope and required fields; and
5. commits a changed snapshot.

This automation does not treat news headlines, social posts, or self-reports as official cases.

## Local development

Requires Node.js 22+ and pnpm.

```bash
pnpm install
pnpm dev
pnpm test
```

To run the refresh manually:

```bash
python scripts/update_data.py
node scripts/validate-live-data.mjs
```

## Test

The `Validate website` GitHub Action installs the locked dependencies, builds the site, server-renders the finished page, and validates the live data contract on every push and pull request.

## Medical and data disclaimer

This project is for public-interest education. It is not medical advice, a government service, or a complete real-time case census. Counts have different definitions and reporting lags. Follow linked CDC, FDA, state health department, and clinician guidance for decisions.
