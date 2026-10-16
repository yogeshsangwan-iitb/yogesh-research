# 1stmillionmile

Personal research site of Yogesh Sangwan: long-form research on startups and industries, plus an automatic **Daily brief** of venture capital, startup and finance news in plain English.

Built with Next.js, hosted on Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

| What | Where |
| --- | --- |
| Research articles | `content/*.mdx` (one file per article) |
| Report files (PDF, Word, images) | `public/reports/<article-slug>/` |
| Daily briefs | `content/news/YYYY-MM-DD.json` (written automatically) |
| Brief pages | `app/news/` and `components/BriefView.tsx` |
| Your public links (LinkedIn, email, resume) | `lib/profile.ts` |
| Colours, fonts, animations | `app/globals.css` |
| News sources | `scripts/news/sources.json` |
| Brief builder script | `scripts/news/build_brief.py` |

## Adding a research report

Reports are added through Claude, not the news robot (no API key involved):

1. Put the files in `public/reports/<slug>/`: the PDF shown in the side reader, the original Word file (optional download), a cover image and any charts.
2. Create `content/<slug>.mdx`. The frontmatter holds the title, description, category, sector, date, `view`, `keyFigures`, `cover` and `report` (`pdf`, `docx`, `pages`). See `content/amperehour-energy-equity-research.mdx` as the template.
3. The body is the plain-English summary. Tables are written as HTML `<table>` tags and charts with `<Figure src="..." alt="..." caption="..." />`, because MDX expressions in `{}` are disabled for safety.

## How the Daily brief works

Every day at 6:45 AM India time, a GitHub Action (`.github/workflows/daily-brief.yml`):

1. reads the news feeds listed in `scripts/news/sources.json`,
2. keeps recent stories about funding, VC funds, IPOs and exits, startups, and the economy, and removes duplicates,
3. asks an AI model to rewrite them in simple English with a "why a VC would care" line and a concept of the day,
4. saves the result as `content/news/<date>.json`, deletes briefs older than 7 days, and commits.

Readers can switch between the last 7 days on `/news`. Older briefs stay in the git history.

Vercel sees the commit and redeploys the site, so the new brief appears on `/news` without you doing anything.

### One-time setup

1. Get a free Gemini API key at https://aistudio.google.com (Get API key).
2. In this repo on GitHub, go to **Settings → Secrets and variables → Actions → New repository secret**.
   Name: `GEMINI_API_KEY`, value: your key. Never paste the key anywhere else.
3. Go to **Actions → Daily Brief → Run workflow** once to test it. A new commit named "Daily Brief: <date>" should appear.

Optional settings (Settings → Secrets and variables → Actions):

| Name | Type | Purpose |
| --- | --- | --- |
| `OPENAI_API_KEY` | secret | Use OpenAI instead of, or as a backup to, Gemini |
| `AI_PROVIDER` | variable | `gemini` (default) or `openai` |
| `GEMINI_MODEL` / `OPENAI_MODEL` | variable | Pin a specific model; otherwise one is chosen automatically |
| `VERCEL_DEPLOY_HOOK` | secret | A Vercel Deploy Hook URL, only needed if Vercel ever stops redeploying after the bot's commits |

### If something goes wrong

- GitHub emails you when a run fails. Open the run under **Actions**; the reason is shown at the top of the run page.
- "No AI key found": the `GEMINI_API_KEY` secret is missing or misspelt.
- A news site changed its feed: that feed is skipped and the rest still work. Edit `scripts/news/sources.json` to fix or replace it.
- Test the script locally without using the AI: `python scripts/news/build_brief.py --dry-run`
- Run the tests: `python -m unittest discover -s scripts/news/tests`
