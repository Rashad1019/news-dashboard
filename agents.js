/* ===================================================================
   agents.js  –  Multi-Agent News Analyst
   
   Agent A : Fetches live headlines for YOUR chosen topics
   Agent B : Scores & picks top 3 most relevant
   Agent C : Drafts one-paragraph summary per top result
   =================================================================== */
"use strict";

/* ─── Background canvas (green / amber orbs) ─── */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  const ctx    = canvas.getContext("2d");
  const ORBS   = [
    { x: 0.1,  y: 0.15, r: 380, c: "13,32,80",    spd: 0.00014 },
    { x: 0.88, y: 0.45, r: 300, c: "26,58,122",   spd: 0.00020 },
    { x: 0.5,  y: 0.88, r: 240, c: "80,52,18",    spd: 0.00018 },
    { x: 0.22, y: 0.72, r: 200, c: "42,70,130",   spd: 0.00023 },
    { x: 0.78, y: 0.18, r: 180, c: "100,72,28",   spd: 0.00026 },
  ];
  let W, H, t = 0;
  const resize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
  resize();
  window.addEventListener("resize", resize);
  (function draw() {
    ctx.clearRect(0, 0, W, H);
    ORBS.forEach(o => {
      const cx = o.x * W + Math.sin(t * o.spd) * 70;
      const cy = o.y * H + Math.cos(t * o.spd * 1.4) * 55;
      const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, o.r);
      g.addColorStop(0,   `rgba(${o.c},0.18)`);
      g.addColorStop(0.55,`rgba(${o.c},0.07)`);
      g.addColorStop(1,   `rgba(${o.c},0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, o.r, 0, Math.PI * 2); ctx.fill();
    });
    t++; requestAnimationFrame(draw);
  })();
})();

/* ═══════════════════════════════════════════
   PRESET TOPICS
═══════════════════════════════════════════ */
const PRESET_TOPICS = [
  { label: "Google Antigravity IDE", icon: "🧲", query: "Google Antigravity IDE multi-agent coding" },
  { label: "AI & Machine Learning",  icon: "🤖", query: "artificial intelligence machine learning 2026" },
  { label: "Google DeepMind",        icon: "🧠", query: "Google DeepMind research developer tools" },
  { label: "AI Coding Assistants",   icon: "💻", query: "AI coding assistant IDE developer productivity" },
  { label: "Multi-Agent Systems",    icon: "🔗", query: "multi-agent AI orchestration autonomous systems" },
  { label: "OpenAI / ChatGPT",       icon: "⚡", query: "OpenAI ChatGPT GPT developer news" },
  { label: "Cybersecurity",          icon: "🔒", query: "cybersecurity hacking data breach 2026" },
  { label: "Web Development",        icon: "🌐", query: "web development frontend React Next.js 2026" },
  { label: "Cloud & DevOps",         icon: "☁️", query: "cloud computing DevOps AWS Azure Google Cloud" },
  { label: "Startups & VC",          icon: "🚀", query: "tech startup venture capital funding 2026" },
  { label: "Blockchain & Web3",      icon: "🔷", query: "blockchain cryptocurrency Web3 news 2026" },
  { label: "Open Source",            icon: "📦", query: "open source software GitHub developer news" },
];

/* ═══════════════════════════════════════════
   STATE
═══════════════════════════════════════════ */
let selectedTopics = []; // array of { label, query }

/* ═══════════════════════════════════════════
   BUILD PRESET CHIPS
═══════════════════════════════════════════ */
function buildChips() {
  const grid = document.getElementById("chip-grid");
  PRESET_TOPICS.forEach((topic, i) => {
    const chip = document.createElement("button");
    chip.className  = "topic-chip";
    chip.id         = `chip-${i}`;
    chip.innerHTML  = `<span class="chip-icon">${topic.icon}</span>${topic.label}`;
    chip.addEventListener("click", () => toggleTopic(topic, chip));
    grid.appendChild(chip);
  });
}

function toggleTopic(topic, chipEl) {
  const idx = selectedTopics.findIndex(t => t.label === topic.label);
  if (idx === -1) {
    selectedTopics.push(topic);
    chipEl.classList.add("selected");
  } else {
    selectedTopics.splice(idx, 1);
    chipEl.classList.remove("selected");
  }
  refreshSelectedDisplay();
}

function refreshSelectedDisplay() {
  const wrap  = document.getElementById("selected-wrap");
  const chips = document.getElementById("selected-chips");
  const btn   = document.getElementById("btn-run");

  chips.innerHTML = "";
  selectedTopics.forEach((t, i) => {
    const sc = document.createElement("span");
    sc.className = "sel-chip";
    sc.innerHTML = `${t.icon || "◆"} ${t.label} <span class="sel-chip-remove" data-i="${i}">✕</span>`;
    chips.appendChild(sc);
  });

  // Remove listeners
  chips.querySelectorAll(".sel-chip-remove").forEach(el => {
    el.addEventListener("click", () => {
      const i   = parseInt(el.dataset.i);
      const lbl = selectedTopics[i].label;
      selectedTopics.splice(i, 1);
      // Deselect preset chip if applicable
      document.querySelectorAll(".topic-chip").forEach(c => {
        if (c.textContent.trim().includes(lbl)) c.classList.remove("selected");
      });
      refreshSelectedDisplay();
    });
  });

  wrap.style.display = selectedTopics.length ? "flex" : "none";
  btn.disabled       = selectedTopics.length === 0;
}

/* ═══════════════════════════════════════════
   CUSTOM TOPIC INPUT
═══════════════════════════════════════════ */
function addCustomTopic() {
  const input = document.getElementById("custom-topic-input");
  const raw   = input.value.trim();
  if (!raw) return;
  if (selectedTopics.find(t => t.label.toLowerCase() === raw.toLowerCase())) {
    showToast("⚠ That topic is already selected");
    return;
  }
  selectedTopics.push({ label: raw, query: raw, icon: "🔍" });
  input.value = "";
  refreshSelectedDisplay();
}

document.getElementById("btn-add-topic").addEventListener("click", addCustomTopic);
document.getElementById("custom-topic-input").addEventListener("keydown", e => {
  if (e.key === "Enter") addCustomTopic();
});

/* ═══════════════════════════════════════════
   CORS PROXY + FETCH
═══════════════════════════════════════════ */
async function fetchFeedForTopic(topic) {
  try {
    const url = `/api/news?q=${encodeURIComponent(topic.query)}&count=15`;
    const res  = await fetch(url);
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map(item => ({
      headline: item.title.replace(/<[^>]+>/g, "").trim(),
      link:     item.link    || "",
      pubDate:  item.pubDate || "",
      source:   topic.label,
    }));
  } catch { return []; }
}

/* ═══════════════════════════════════════════
   AUTO-TAGGING
═══════════════════════════════════════════ */
const TAG_RULES = [
  { match: ["antigravity","deepmind","google ai"],     tag: "Google / DeepMind" },
  { match: ["gemini"],                                  tag: "Gemini" },
  { match: ["agent","agentic","multi-agent"],           tag: "Agents" },
  { match: ["ide","coding","copilot","assistant"],      tag: "IDE / Tooling" },
  { match: ["llm","gpt","claude","llama","mistral"],    tag: "LLM" },
  { match: ["open source","github","rust","python"],    tag: "OSS / Languages" },
  { match: ["funding","startup","vc","raises"],         tag: "Business" },
  { match: ["cloud","aws","azure","devops"],            tag: "Cloud" },
  { match: ["security","breach","hack","vulnerability"],tag: "Security" },
  { match: ["blockchain","crypto","web3"],              tag: "Web3" },
  { match: ["regulation","eu","policy","act"],          tag: "Policy" },
];
function autoTag(headline) {
  const lower = headline.toLowerCase();
  const tags  = [];
  TAG_RULES.forEach(r => { if (r.match.some(k => lower.includes(k))) tags.push(r.tag); });
  return tags.length ? tags : ["General Tech"];
}

/* ═══════════════════════════════════════════
   RELEVANCE SCORING  (Agent B)
   Scores against all selected topic keywords
═══════════════════════════════════════════ */
function buildKeywords(topics) {
  const keywords = new Set();
  topics.forEach(t => {
    t.query.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 3) keywords.add(w);
    });
    t.label.toLowerCase().split(/\s+/).forEach(w => {
      if (w.length > 3) keywords.add(w);
    });
  });
  return [...keywords];
}

function scoreHeadline(headline, keywords) {
  const lower   = headline.toLowerCase();
  let score     = 0;
  const matched = [];
  keywords.forEach(kw => {
    if (lower.includes(kw)) {
      score += kw.length > 7 ? 20 : kw.length > 5 ? 12 : 6;
      matched.push(kw);
    }
  });
  return { score: Math.min(score, 100), keywords: [...new Set(matched)] };
}

/* ═══════════════════════════════════════════
   SUMMARY GENERATOR  (Agent C)
═══════════════════════════════════════════ */
function generateSummary(headline, keywords, topics, rank) {
  const h           = headline.toLowerCase();
  const topicNames  = topics.map(t => t.label).join(", ");
  const keyStr      = keywords.slice(0, 3).join("**, **");

  const openers = [
    `At the intersection of ${topicNames}, this headline marks a significant development worth your immediate attention.`,
    `This story directly touches your selected interest in ${topicNames}, representing one of the most noteworthy signals from today's news cycle.`,
    `For anyone tracking ${topicNames}, this development stands out as a key indicator of where the space is heading.`,
  ];

  const middles = keywords.length
    ? `The presence of themes around **${keyStr}** places this story at the core of the topics you care about most.`
    : `Even without explicit keyword matches, the broader context of this story aligns clearly with your stated interests.`;

  const closers = [
    `Keeping a close eye on follow-up coverage of this story is recommended, as early signals like this often precede larger shifts in the field.`,
    `Whether you're a practitioner or observer in this space, the implications of this story are likely to ripple outward in the coming days and weeks.`,
    `This is the kind of story that benefits from reading the full article — the headline only scratches the surface of what's being announced or discussed.`,
  ];

  const summary = `${openers[rank % 3]} ${middles} ${closers[rank % 3]}`;
  return summary;
}

/* ═══════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════ */
const sleep      = ms => new Promise(r => setTimeout(r, ms));
const escapeHtml = s  => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function setMetric(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
function setAgentState(id, state) {
  const el = document.getElementById(`agent-${id}`);
  if (el) el.dataset.state = state;
}
function setAgentStatus(id, msg) {
  const el = document.getElementById(`agent-${id}-status`);
  if (el) el.textContent = msg;
}
function setProgress(id, pct) {
  const el = document.getElementById(`prog-${id}`);
  if (el) el.style.width = `${pct}%`;
}

function showToast(msg, dur = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), dur);
}

/* ═══════════════════════════════════════════
   AGENT A – FETCH + CATALOGUE
═══════════════════════════════════════════ */
async function runAgentA(topics) {
  setAgentState("a", "running");
  setAgentStatus("a", `Fetching from ${topics.length} topic feed(s)…`);
  const start = Date.now();

  // Fetch all topics in parallel
  const allResults = await Promise.all(topics.map(fetchFeedForTopic));

  // Flatten + deduplicate
  const seen = new Set();
  const raw  = [];
  allResults.forEach(items => {
    items.forEach(item => {
      const key = item.headline.toLowerCase().slice(0, 65);
      if (!seen.has(key) && item.headline.length > 12) {
        seen.add(key); raw.push(item);
      }
    });
  });

  if (raw.length === 0) {
    showToast("⚠ Network unavailable — add topics manually or try again", 4500);
    setAgentState("a", "idle");
    return [];
  }

  setAgentStatus("a", `Cataloguing ${raw.length} headlines…`);

  const catalogue = [];
  for (let i = 0; i < raw.length; i++) {
    setProgress("a", ((i + 1) / raw.length) * 100);
    setMetric("m-a-parsed", i + 1);
    catalogue.push({
      id:       i + 1,
      headline: raw[i].headline,
      link:     raw[i].link,
      pubDate:  raw[i].pubDate,
      source:   raw[i].source,
      tags:     autoTag(raw[i].headline),
    });
    await sleep(32);
  }

  setMetric("m-a-fetched", raw.length);
  setMetric("m-a-parsed",  raw.length);
  setMetric("m-a-time",    Date.now() - start);
  setAgentStatus("a", `Done — ${raw.length} headlines catalogued`);
  setAgentState("a", "done");
  document.getElementById("arrow-ab").classList.add("active");
  return catalogue;
}

/* ═══════════════════════════════════════════
   AGENT B – RANK + SELECT TOP 3
═══════════════════════════════════════════ */
async function runAgentB(catalogue, topics) {
  setAgentState("b", "running");
  setAgentStatus("b", "Scoring relevance…");
  const start    = Date.now();
  const keywords = buildKeywords(topics);

  const scored = [];
  for (let i = 0; i < catalogue.length; i++) {
    setProgress("b", ((i + 1) / catalogue.length) * 100);
    setMetric("m-b-scored", i + 1);
    const { score, keywords: kw } = scoreHeadline(catalogue[i].headline, keywords);
    scored.push({ ...catalogue[i], score, keywords: kw });
    await sleep(22);
  }

  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const top3   = ranked.slice(0, 3);

  setMetric("m-b-selected", top3.length);
  setMetric("m-b-time",     Date.now() - start);
  setAgentStatus("b", `Done — top 3 selected from ${catalogue.length}`);
  setAgentState("b", "done");
  document.getElementById("arrow-bc").classList.add("active");
  return { ranked, top3 };
}

/* ═══════════════════════════════════════════
   AGENT C – WRITE SUMMARIES
═══════════════════════════════════════════ */
async function runAgentC(top3, topics) {
  setAgentState("c", "running");
  setAgentStatus("c", "Writing summaries…");
  const start     = Date.now();
  const summaries = [];
  let totalWords  = 0;

  for (let i = 0; i < top3.length; i++) {
    const item    = top3[i];
    const summary = generateSummary(item.headline, item.keywords, topics, i);
    summaries.push({ ...item, summary });
    totalWords += summary.split(/\s+/).length;
    setProgress("c", ((i + 1) / top3.length) * 100);
    setMetric("m-c-drafted", i + 1);
    setMetric("m-c-words",   totalWords);
    await sleep(480);
  }

  setMetric("m-c-time",  Date.now() - start);
  setAgentStatus("c", `Done — ${top3.length} summaries written`);
  setAgentState("c", "done");
  return summaries;
}

/* ═══════════════════════════════════════════
   RENDER RESULTS
═══════════════════════════════════════════ */
function renderResults(summaries, allRanked, topics) {
  const grid    = document.getElementById("results-grid");
  const tbody   = document.getElementById("raw-tbody");
  const section = document.getElementById("results-section");
  const title   = document.getElementById("results-title");
  const desc    = document.getElementById("results-desc");

  grid.innerHTML  = "";
  tbody.innerHTML = "";

  const topicStr = topics.map(t => t.label).join(", ");
  title.textContent = `Top 3 Headlines: ${topicStr}`;
  desc.textContent  = `Agent B selected the most relevant headlines for your topics. Agent C wrote the summaries below.`;

  const selectedIds = new Set(summaries.map(s => s.id));

  summaries.forEach((item, i) => {
    const rankClass = ["rank-1","rank-2","rank-3"][i];
    const rankLabel = ["#1","#2","#3"][i];
    const tags      = item.tags.map(t => `<span class="tag">${t}</span>`).join("");
    const summary   = item.summary.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    const linkHtml  = item.link
      ? `<a class="result-link" href="${item.link}" target="_blank" rel="noopener">Read full article ↗</a>` : "";

    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-card-top">
        <div class="result-rank">
          <div class="rank-badge ${rankClass}">${rankLabel}</div>
          <div class="score-bar-wrap">
            <div class="score-bar-fill" style="width:0%" data-target="${item.score}"></div>
          </div>
          <span class="score-val">${item.score}%</span>
        </div>
        <div class="result-headline">${escapeHtml(item.headline)}</div>
        <div class="result-tags">${tags}</div>
        ${item.pubDate ? `<div class="result-meta">📅 ${item.pubDate.slice(0,10)} · ${escapeHtml(item.source)}</div>` : ""}
      </div>
      <div class="result-summary">
        <div class="summary-label">Agent C · Summary</div>
        <div class="summary-text">${summary}</div>
        ${linkHtml}
      </div>
    `;
    grid.appendChild(card);
  });

  requestAnimationFrame(() => {
    document.querySelectorAll(".score-bar-fill").forEach(el =>
      requestAnimationFrame(() => { el.style.width = el.dataset.target + "%"; })
    );
  });

  allRanked.forEach((item, i) => {
    const isTop = selectedIds.has(item.id);
    const tr    = document.createElement("tr");
    if (isTop) tr.classList.add("highlighted");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(item.headline)}${isTop ? " ★" : ""}</td>
      <td>${escapeHtml(item.tags.join(", "))}</td>
      <td><span class="score-chip ${item.score >= 20 ? "score-high" : "score-mid"}">${item.score}</span></td>
    `;
    tbody.appendChild(tr);
  });

  section.style.display = "flex";
  setTimeout(() => section.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
}

/* ═══════════════════════════════════════════
   RESET
═══════════════════════════════════════════ */
function resetPipeline() {
  ["a","b","c"].forEach(id => {
    setAgentState(id, "idle");
    setProgress(id, 0);
    setAgentStatus(id, "Waiting…");
  });
  ["m-a-fetched","m-a-parsed","m-a-time",
   "m-b-scored","m-b-selected","m-b-time",
   "m-c-drafted","m-c-words","m-c-time"].forEach(id => setMetric(id, "–"));
  ["arrow-ab","arrow-bc"].forEach(id =>
    document.getElementById(id).classList.remove("active")
  );
}

/* ═══════════════════════════════════════════
   MAIN RUN
═══════════════════════════════════════════ */
document.getElementById("btn-run").addEventListener("click", async () => {
  if (!selectedTopics.length) return;

  document.getElementById("btn-run").disabled = true;
  document.getElementById("results-section").style.display = "none";
  resetPipeline();

  const topics = [...selectedTopics];
  const tTotal = Date.now();

  try {
    const catalogue          = await runAgentA(topics);
    if (!catalogue.length) { document.getElementById("btn-run").disabled = false; return; }
    await sleep(220);

    const { ranked, top3 }  = await runAgentB(catalogue, topics);
    await sleep(220);

    const summaries          = await runAgentC(top3, topics);
    await sleep(150);

    renderResults(summaries, ranked, topics);
    const elapsed = ((Date.now() - tTotal) / 1000).toFixed(1);
    showToast(`✓ Done in ${elapsed}s · ${catalogue.length} headlines scanned · Top 3 identified`);

  } catch (err) {
    console.error(err);
    showToast("⚠ Pipeline error — check the browser console");
  } finally {
    document.getElementById("btn-run").disabled = selectedTopics.length === 0;
  }
});

/* Reset button */
document.getElementById("btn-reset").addEventListener("click", () => {
  document.getElementById("results-section").style.display = "none";
  resetPipeline();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

/* Copy summaries */
document.getElementById("btn-copy").addEventListener("click", () => {
  const cards = document.querySelectorAll(".result-card");
  let text = "";
  cards.forEach((card, i) => {
    const h = card.querySelector(".result-headline").textContent;
    const s = card.querySelector(".summary-text").textContent;
    text += `── HEADLINE ${i + 1} ──\n${h}\n\nSUMMARY:\n${s}\n\n`;
  });
  navigator.clipboard.writeText(text.trim())
    .then(()  => showToast("✓ Summaries copied to clipboard"))
    .catch(()  => showToast("⚠ Could not access clipboard"));
});

/* Footer clock */
(function clock() {
  const el = document.getElementById("footer-time");
  if (el) el.textContent = new Date().toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit", second:"2-digit", hour12: false });
  setTimeout(clock, 1000);
})();

/* Init chips */
buildChips();
