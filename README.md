# MultiAgent News Analyst

> *Fetch. Filter. Summarize. Automatically.*

A fully autonomous, three-agent AI pipeline that pulls live news headlines from across the web, ranks them by relevance to your chosen topics, and delivers a curated summary — all in a single click.

---

## What It Does

Most news dashboards show you everything and let you sort it out. This one does the sorting for you, using a coordinated pipeline of three specialized AI agents working in sequence.

**You pick your topics. The agents do the rest.**

---

## How It Works

### The Three-Agent Pipeline

```
Agent A → Agent B → Agent C
```

| Agent | Role | Task |
|---|---|---|
| **Agent A** · *Headline Scanner* | Data Ingestion | Fetches live headlines from Google News RSS feeds across all your selected topics simultaneously. Deduplicates results and auto-tags each headline by category. |
| **Agent B** · *Relevance Ranker* | Intelligence | Scores every headline against your chosen topics using keyword and context analysis. Selects the top 3 highest-relevance results. |
| **Agent C** · *Summary Writer* | Output | Drafts a rich, contextual one-paragraph summary for each of the three selected headlines, tailored to your specific interests. |

### Step by Step

1. **Choose your topics** — select from 12 preset categories (AI, Cybersecurity, Web Dev, Startups, etc.) or type any custom topic
2. **Click Run Pipeline** — all three agents activate in sequence
3. **Read your results** — three curated headline cards with relevance scores, topic tags, publication dates, and full summaries
4. **Go deeper** — expand the full Agent A catalogue to see every fetched headline ranked by score
5. **Copy or refresh** — copy all summaries to clipboard or run again for a fresh fetch

---

## Topics You Can Track

**Built-in presets:**
- 🧲 Google Antigravity IDE
- 🤖 AI & Machine Learning
- 🧠 Google DeepMind
- 💻 AI Coding Assistants
- 🔗 Multi-Agent Systems
- ⚡ OpenAI / ChatGPT
- 🔒 Cybersecurity
- 🌐 Web Development
- ☁️ Cloud & DevOps
- 🚀 Startups & VC
- 🔷 Blockchain & Web3
- 📦 Open Source

**Or type anything** — custom topics are fully supported.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5 · Vanilla CSS · Vanilla JavaScript |
| Backend | Python 3 (stdlib only — no pip packages) |
| News Source | Google News RSS (free, no API key) |
| Hosting | Vercel (static + Python Serverless Functions) |
| Fonts | Cormorant Garamond · Inter (Google Fonts) |

No external APIs. No API keys. No subscription fees. Fully open-source.

---

## Local Development

**Requirements:** Python 3.8+

```bash
# Clone the repo
git clone https://github.com/Rashad1019/news-dashboard.git
cd news-dashboard

# Start the local server (handles both static files and /api/news)
python server.py

# Open in browser
http://localhost:5500
```

---

## Project Structure

```
news-dashboard/
├── index.html          # App shell and UI markup
├── style.css           # Midnight & Bronze design system
├── agents.js           # All three agent logic (frontend)
├── server.py           # Local development server
├── api/
│   └── news.py         # Vercel serverless function (/api/news)
├── vercel.json         # Vercel deployment config
├── requirements.txt    # Python dependencies (stdlib only)
├── .gitignore
├── README.md
└── ANTIGRAVITY.md      # How Google Antigravity IDE made this possible
```

---

## Deployment

This project is deployed on **Vercel** via GitHub. Every push to `main` triggers an automatic redeploy.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Rashad1019/news-dashboard)

---

## Contact

**Rashad**
📧 [Rashad19@outlook.com](mailto:Rashad19@outlook.com)
🐙 [github.com/Rashad1019](https://github.com/Rashad1019)

---

*Built with Google Antigravity IDE · See [ANTIGRAVITY.md](./ANTIGRAVITY.md) for the full story.*
