<div align="center">

# 🛡️ Blackwing
### AI Red Teaming Console — by Tinycrows

**Run autonomous AI red-teaming and penetration tests from a single web GUI.
No terminal. No command line. Just a browser.**

</div>

---

Blackwing is a self-hosted console that puts a friendly web interface in front of
a powerful autonomous red-teaming engine. An operator configures an assessment,
clicks **Run**, and watches the agent work in real time — reconnaissance, probing,
tool execution, and confirmed findings — all in the browser. When the run
finishes, Blackwing produces a polished **AI Red Teaming Report (PDF)** in the
Tinycrows house style, ready to hand to a client.

- 🖥️ **GUI only** — your users never touch a terminal or the engine.
- 🧠 **Powered by AWS Bedrock** — uses the best available Claude models automatically.
- 📡 **Live activity feed** — watch the engine reason, run tools, and record findings as it goes.
- 🗂️ **History** — browse every past scan, its findings, and its report.
- 📄 **One-click report** — download a pixel-faithful Tinycrows AI Red Teaming Report.

---

## What you need

- **Docker** and **Docker Compose** (Docker Desktop on Windows/macOS, or Docker Engine on Linux).
- An **AWS Bedrock API key** (a bearer token) with access to Claude models in your region.
- ~4 GB free RAM for the engine and its tools.

> ⚠️ **Authorised testing only.** Only run assessments against systems you own or
> are explicitly authorised to test. The console requires you to confirm
> authorisation before every run.

---

## Quick start

```bash
# 1. Clone
git clone https://github.com/singhjatintinycrows/blackwing_agi.git
cd blackwing_agi

# 2. Configure
cp .env.example .env
#   then edit .env and set at least:
#     BEDROCK_BEARER_TOKEN   = your AWS Bedrock API key
#     BLACKWING_ADMIN_PASSWORD = a password for the GUI login
#     JWT_SECRET, COOKIE_SIGNING_SALT, POSTGRES_PASSWORD = long random strings

# 3. Launch (first run pulls the engine image — a few minutes)
docker compose up -d

# 4. Open the console
#    http://localhost:8080
#    Sign in with BLACKWING_ADMIN_EMAIL / BLACKWING_ADMIN_PASSWORD from your .env
```

That's it. The engine, database, and web recon service all start automatically
and stay **internal** — only the Blackwing GUI is exposed (on the port you set in
`BLACKWING_GUI_PORT`, default `8080`).

To stop: `docker compose down` (add `-v` to also wipe data).

---

## Using Blackwing

### Run a new scan
1. Open the console and go to **Assessment**.
2. Fill in the target (a URL you are authorised to test), the application name,
   scope, and standards. Add authentication details if the target needs a login.
3. Tick the authorisation confirmation and click **Run Assessment**.

### Watch it live
A live activity panel streams exactly what the engine is doing, classified as:

| Tag | Meaning | Colour |
|---|---|---|
| **STATUS** | progress, tasks, tool runs, terminal output | navy |
| **THINK** | the agent's reasoning | muted |
| **FINDING** | a confirmed weakness | crimson |

### See findings & old scans
- **Vulnerabilities** — every finding across all scans, filterable by severity/status.
- **Reports** — one entry per completed assessment (your scan history). Open one to
  see its findings and the raw activity log.

### Download the report
Open a report and click **↓ Download Report (PDF)**. Blackwing renders the full
Tinycrows **AI Red Teaming Report** — cover, executive summary, OWASP LLM Top 10
mapping, MITRE ATLAS attack path, per-finding detail blocks, recommendations,
sign-off and appendices — populated with this scan's findings.

---

## Configuration

All settings live in `.env`. The important ones:

| Variable | Default | What it does |
|---|---|---|
| `BLACKWING_GUI_PORT` | `8080` | Host port for the web console |
| `BLACKWING_ADMIN_EMAIL` / `BLACKWING_ADMIN_PASSWORD` | `admin@tinycrows.com` / — | GUI sign-in (seeded on first boot) |
| `JWT_SECRET` | — | Signs GUI sessions — use a long random string |
| `BEDROCK_BEARER_TOKEN` | — | Your AWS Bedrock API key |
| `BEDROCK_REGION` | `us-east-1` | Bedrock region for model calls |
| `COOKIE_SIGNING_SALT`, `POSTGRES_PASSWORD`, `SCRAPER_PASSWORD` | — | Engine secrets — change for production |

**Models:** you don't choose models by hand. With Bedrock configured, the engine
uses its built-in best-in-class defaults — Claude Opus for the heavy reasoning
roles and Claude Sonnet/Haiku for support roles. Make sure your Bedrock key has
access to those Claude models in your chosen region.

---

## Local development (no Docker)

```bash
cd gui
npm install
# Terminal A — API + live GUI (Vite dev server on :5173, API on :3000)
npm run dev
```

By default (no engine configured) the agent runs in **mock mode** and streams a
realistic demo assessment — handy for working on the UI or the PDF report. Point
it at a real engine by setting `BLACKWING_ENGINE_URL` (and the engine's admin
credentials) in `gui/.env`.

Generate a report PDF straight from the report module without the full app? See
`gui/server/services/report/generate.js` (`generateReportPdf(data)`).

---

## How it fits together

```
┌───────────────┐   HTTPS/GraphQL    ┌──────────────────────┐
│  Blackwing    │ ─────────────────▶ │   Red-teaming engine  │
│  GUI (:8080)  │   live log stream  │   (internal only)     │
│  React+Node   │ ◀───────────────── │   + tools + scraper   │
└───────┬───────┘                    └──────────┬───────────┘
        │ SQLite (history, findings, reports)   │ AWS Bedrock (Claude)
        ▼                                        ▼
   Reports & PDF                            autonomous testing
```

The GUI launches a bridge that drives the engine and re-streams its activity into
the console, so you get the full picture without ever leaving the browser.

Third-party components and their licenses: see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

---

## Security notes

- Only the GUI port is published; the engine is reachable only on the internal
  Docker network.
- Keep your `.env` out of version control (it already is via `.gitignore`).
- If a credential is ever exposed, rotate it.
- Blackwing is for **authorised** security testing only.

---

<div align="center">
Made by <b>Tinycrows</b> · info@tinycrows.com
</div>
