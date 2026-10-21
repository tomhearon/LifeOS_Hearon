import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";

/* ════════════════════  LIFE OS · MONEY › CLAIMS  ════════════════════
   Tracks medical bills against Cigna Envoy reimbursement:
   bill in → ready (invoice + proof of payment) → submitted (Envoy ref) → paid / partial / denied / appeal.
   Envoy has no member API, so submission stays manual (app photo claim or website form);
   this module does the bookkeeping, the claim packet, and reconciliation.

   DATA-LAYER CONTRACT (do not rename when re-skinning — see DESIGN-HANDOFF.md):
   - Main key   : "lifeos.v1.claims"            → { v, members[], settings{}, bills[], claims[] }
   - Documents  : "lifeos.v1.claims:doc:<id>"   → { name, type, data(base64), kind, bytes, added }
   - Persistence via window.storage only (no localStorage).
   - Bill amounts stored in their billed currency (EUR by default); reimbursements stored in USD.
   - Theme is read (never written) from the health app's key "lifeos.v3.health".
   ================================================================== */

const KEY = "lifeos.v1.claims";
const DOC = (id) => `${KEY}:doc:${id}`;
const HEALTH_KEY = "lifeos.v3.health";
const MODEL = "claude-sonnet-4-6";
const ENVOY_FILE_LIMIT = 6 * 1024 * 1024; // Envoy accepts attachments up to 6 MB

/* ── Theme system (from the Claude Design round, Sep 2026) ──
   Every color is a CSS custom property; a theme is a token set applied to :root.
   C maps the app's legacy names onto the tokens, so all existing styles re-theme instantly. */
const THEMES = {
  field: { label: "Field Ledger", tag: "DEFAULT", desc: "Paper base · console density · glow on live elements", sw: ["#93402A", "#E2725B", "#8B5E7B"], swBg: "#F8F4EB",
    t: { bg: "#F8F4EB", card: "#FFFDF7", card2: "#F1EADC", card3: "#E9DFCC", ink: "#211B14", sub: "#6E6254", mut: "#9A8570", line: "#E5DCCB", lineSoft: "#EDE5D4",
      acc: "#93402A", accInk: "#FFFFFF", accSoft: "rgba(147,64,42,0.10)", health: "#C1533B", money: "#B98A2F", admin: "#5E7B8B", learn: "#8B5E7B", learnBg: "rgba(139,94,123,0.12)",
      good: "#4E6B3E", goodBg: "rgba(110,139,94,0.14)", bad: "#C24A2E", pop: "#93402A", glow: "0 0 14px rgba(147,64,42,0.15)",
      fDisp: "'Newsreader', Georgia, serif", fBody: "system-ui, -apple-system, sans-serif" } },
  espresso: { label: "Espresso Command", tag: "", desc: "Warm dark · dense console · bright terracotta", sw: ["#FF7A55", "#FFB340", "#FF8FA8"], swBg: "#221912",
    t: { bg: "#1B1410", card: "#251C16", card2: "#2E231B", card3: "#382B20", ink: "#F4EADB", sub: "#B39C87", mut: "#7E6B5A", line: "#42332699", lineSoft: "#3A2D2266",
      acc: "#E8A64C", accInk: "#1B1410", accSoft: "rgba(232,166,76,0.13)", health: "#E2725B", money: "#FFB340", admin: "#7FB5A8", learn: "#D98594", learnBg: "rgba(217,133,148,0.13)",
      good: "#9DBE8D", goodBg: "rgba(157,190,141,0.13)", bad: "#D06248", pop: "#FFB454", glow: "0 0 16px rgba(255,122,85,0.18)",
      fDisp: "'Space Grotesk', system-ui, sans-serif", fBody: "Inter, system-ui, -apple-system, sans-serif" } },
  ledger: { label: "The Ledger", tag: "", desc: "Warm paper · serif numerals · broadsheet calm", sw: ["#93402A", "#B98A2F", "#6E8B5E"], swBg: "#F8F4EB",
    t: { bg: "#F8F4EB", card: "#F8F4EB", card2: "#F1EADC", card3: "#E9DFCC", ink: "#211B14", sub: "#6E6254", mut: "#9A8570", line: "#E5DCCB", lineSoft: "#EDE5D4",
      acc: "#93402A", accInk: "#FFFFFF", accSoft: "rgba(147,64,42,0.10)", health: "#93402A", money: "#B98A2F", admin: "#5E7B8B", learn: "#8B5E7B", learnBg: "rgba(139,94,123,0.12)",
      good: "#4E6B3E", goodBg: "rgba(110,139,94,0.14)", bad: "#C24A2E", pop: "#B98A2F", glow: "none",
      fDisp: "'Newsreader', Georgia, serif", fBody: "system-ui, -apple-system, sans-serif" } },
  midnight: { label: "Midnight Signal", tag: "", desc: "Green-black · multi-neon glow · glassy cards", sw: ["#3DF0A4", "#4DD8FF", "#C77DFF"], swBg: "#081009",
    t: { bg: "#081009", card: "#0F1D15", card2: "#142A1E", card3: "#1A3526", ink: "#E9F5EC", sub: "#8FB39D", mut: "#567A64", line: "#1F3B2C", lineSoft: "#16301F",
      acc: "#3DF0A4", accInk: "#081009", accSoft: "rgba(61,240,164,0.10)", health: "#3DF0A4", money: "#4DD8FF", admin: "#FFC24B", learn: "#C77DFF", learnBg: "rgba(199,125,255,0.12)",
      good: "#3DF0A4", goodBg: "rgba(61,240,164,0.10)", bad: "#F07B5B", pop: "#E4FF5F", glow: "0 0 18px rgba(61,240,164,0.22)",
      fDisp: "'Sora', system-ui, sans-serif", fBody: "'Sora', system-ui, sans-serif" } },
  atlas: { label: "Obsidian Atlas", tag: "GRAPHICS", desc: "Deep slate · cyan glow · glass cards, photo-ready", sw: ["#3DD6F5", "#54E3A2", "#B08CFF"], swBg: "#0B0E13",
    t: { bg: "#0B0E13", card: "#131820", card2: "#1A2029", card3: "#212936", ink: "#EAF0F6", sub: "#7C8A99", mut: "#586674", line: "#232B36", lineSoft: "#1B222C",
      acc: "#3DD6F5", accInk: "#0B0E13", accSoft: "rgba(61,214,245,0.10)", health: "#54E3A2", money: "#3DD6F5", admin: "#F5D93D", learn: "#B08CFF", learnBg: "rgba(176,140,255,0.12)",
      good: "#54E3A2", goodBg: "rgba(84,227,162,0.12)", bad: "#F07B5B", pop: "#54E3A2", glow: "0 0 18px rgba(61,214,245,0.22)",
      fDisp: "'Sora', system-ui, sans-serif", fBody: "'Sora', system-ui, sans-serif" } },
};
const applyTheme = (id) => {
  const t = (THEMES[id] || THEMES.field).t;
  const r = document.documentElement;
  Object.entries(t).forEach(([k, v]) => r.style.setProperty("--" + k, v));
};


const C = {
  bg: "var(--bg)", card: "var(--card)", card2: "var(--card2)", card3: "var(--card3)",
  ink: "var(--ink)", sub: "var(--sub)", mut: "var(--mut)", line: "var(--line)", lineSoft: "var(--lineSoft)",
  acc: "var(--acc)", accInk: "var(--accInk)", accSoft: "var(--accSoft)",
  money: "var(--money)", health: "var(--health)", admin: "var(--admin)", learn: "var(--learn)",
  good: "var(--good)", goodBg: "var(--goodBg)", bad: "var(--bad)", pop: "var(--pop)",
};
const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const SANS = "var(--fBody)";
const DISP = "var(--fDisp)";

/* ════════════════════  CONSTANTS  ════════════════════ */

const CATEGORIES = ["Doctor", "Specialist", "Dental", "Pharmacy", "Hospital", "Lab / imaging", "Therapy", "Vision", "Other"];
const DOC_KINDS = { invoice: "Invoice", proof: "Proof of payment", both: "Invoice + proof", eob: "Envoy EOB", other: "Other" };
const CHANNELS = { app: "Envoy app (photo claim)", web: "Envoy website", post: "Post / fax" };

const STAGES = {
  need:      { label: "Missing info", color: "bad",   order: 0 },
  ready:     { label: "Ready to claim", color: "acc", order: 1 },
  submitted: { label: "Submitted", color: "admin",    order: 2 },
  appeal:    { label: "Appeal", color: "learn",       order: 3 },
  partial:   { label: "Part-paid", color: "money",    order: 4 },
  denied:    { label: "Denied", color: "bad",         order: 5 },
  paid:      { label: "Paid", color: "good",          order: 6 },
};
const CLAIM_STATES = ["submitted", "paid", "partial", "denied", "appeal"];

const blank = () => ({
  v: 1,
  members: [{ id: "m1", name: "Tom" }, { id: "m2", name: "Spouse" }, { id: "m3", name: "Child" }],
  settings: { deadlineDays: 365, warnDays: 60, chaseDays: 30, fx: 1.08 },
  bills: [],
  claims: [],
});

/* ════════════════════  UTIL  ════════════════════ */

const uid = () => Math.random().toString(36).slice(2, 10);
const todayISO = () => new Date().toISOString().slice(0, 10);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pretty = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} ${MON[+m - 1]} ${y.slice(2)}`;
};
const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
const addDays = (iso, n) => { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const num = (v) => { const n = parseFloat(String(v ?? "").replace(",", ".")); return Number.isFinite(n) ? n : 0; };
const money = (n, cur = "USD") => {
  const sym = cur === "USD" ? "$" : cur === "EUR" ? "€" : cur + " ";
  return sym + (Math.round(num(n) * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const kb = (bytes) => bytes > 1048576 ? (bytes / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(bytes / 1024)) + " KB";

async function loadKey(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.storage) return fallback;
    const r = await window.storage.get(key, false);
    if (!r || !r.value) return fallback;
    return JSON.parse(r.value);
  } catch { return fallback; }
}
async function saveKey(key, value) {
  try {
    if (typeof window === "undefined" || !window.storage) return false;
    return !!(await window.storage.set(key, JSON.stringify(value), false));
  } catch { return false; }
}
async function dropKey(key) {
  try { if (window.storage) await window.storage.delete(key, false); } catch { /* ignore */ }
}

function parseJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.search(/[[{]/);
  if (start < 0) throw new Error("The reply contained no data.");
  const end = Math.max(clean.lastIndexOf("]"), clean.lastIndexOf("}"));
  return JSON.parse(clean.slice(start, end + 1));
}

async function askClaude(content, maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: maxTokens, messages: [{ role: "user", content }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "The model returned an error.");
  const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
  if (!text.trim()) throw new Error("The model returned an empty reply.");
  return text;
}

/* Images are shrunk to JPEG (keeps storage small and well under Envoy's 6 MB limit). PDFs are kept as-is. */
async function readFile(file) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("Couldn't read " + file.name));
    r.readAsDataURL(file);
  });
  if (file.type === "application/pdf") {
    const data = dataUrl.split(",")[1];
    return { name: file.name, type: "application/pdf", data, bytes: Math.round(data.length * 0.75) };
  }
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(/heic|heif/i.test(file.type + file.name)
      ? "This browser can't open HEIC. On iPhone: Settings › Camera › Formats › Most Compatible."
      : "That image couldn't be decoded — JPEG, PNG or PDF work best."));
    i.src = dataUrl;
  });
  const scale = Math.min(1, 2000 / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * scale); cv.height = Math.round(img.height * scale);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  const data = cv.toDataURL("image/jpeg", 0.85).split(",")[1];
  return { name: file.name.replace(/\.\w+$/, "") + ".jpg", type: "image/jpeg", data, bytes: Math.round(data.length * 0.75) };
}

const toBlobUrl = (doc) => {
  const bin = atob(doc.data);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([arr], { type: doc.type }));
};

/* ════════════════════  CLAUDE TASKS  ════════════════════ */

async function extractBill(files, members) {
  const parts = files.slice(0, 4).map((f) => f.type === "application/pdf"
    ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.data } }
    : { type: "image", source: { type: "base64", media_type: f.type, data: f.data } });
  parts.push({ type: "text", text:
`These are documents for ONE medical bill (usually a German "Rechnung" from a doctor, dentist, pharmacy or hospital, possibly with a bank transfer or card receipt as proof of payment). Extract the details for an insurance reimbursement claim.
Reply with ONLY a JSON object, no prose:
{"provider":string,"invoiceNo":string|null,"invoiceDate":"YYYY-MM-DD"|null,"serviceDate":"YYYY-MM-DD"|null,"serviceDateTo":"YYYY-MM-DD"|null,"patient":string|null,"amount":number|null,"currency":"EUR"|"USD"|string,"category":one of ${CATEGORIES.map((c) => `"${c}"`).join("|")},"summary":string,"hasProofOfPayment":boolean,"paidDate":"YYYY-MM-DD"|null,"dueDate":"YYYY-MM-DD"|null}
Rules: amount is the total the patient owes ("Rechnungsbetrag"/"Gesamtbetrag"/"zu zahlen"), as a number with a dot decimal. serviceDate is the first treatment date ("Behandlungsdatum"/"Leistungsdatum"); serviceDateTo only if a range. hasProofOfPayment is true only if a payment confirmation, receipt stamp ("bezahlt", "Betrag erhalten") or bank transfer record is visible. summary is max 12 words in English describing the service — no diagnosis codes. Family members on this policy: ${members.map((m) => m.name).join(", ")}. Never invent values that aren't legible; use null.` });
  return parseJson(await askClaude(parts, 900));
}

async function parseEnvoyStatus(text, claims, bills) {
  const known = claims.map((c) => ({ ref: c.ref || null, submitted: c.submittedDate,
    total: c.billIds.map((id) => bills.find((b) => b.id === id)).filter(Boolean).reduce((s, b) => s + num(b.amount), 0) }));
  const out = await askClaude([{ type: "text", text:
`Below is text copied from the Cigna Envoy "My Claims" page. Extract each claim listed.
Reply with ONLY a JSON array: [{"ref":string|null,"status":"submitted"|"paid"|"partial"|"denied"|"appeal","submittedDate":"YYYY-MM-DD"|null,"paidDate":"YYYY-MM-DD"|null,"billed":number|null,"billedCurrency":string|null,"paidUSD":number|null,"note":string}]
Map Envoy wording: received/in progress/pending/under review → submitted; paid/finalised with full payment → paid; partially paid → partial; declined/rejected/not covered → denied. paidUSD only if a USD reimbursement amount is shown. note: max 12 words (e.g. reason for denial, info requested).
For reference, claims already in the tracker: ${JSON.stringify(known)}

ENVOY TEXT:
${text.slice(0, 12000)}` }], 1500);
  const arr = parseJson(out);
  return Array.isArray(arr) ? arr : [arr];
}

/* ════════════════════  DERIVED STATE  ════════════════════ */

function billInfo(b, claims, settings) {
  const claim = claims.find((c) => c.billIds.includes(b.id)) || null;
  const kinds = new Set((b.docs || []).map((d) => d.kind));
  const missing = [];
  if (!num(b.amount)) missing.push("amount");
  if (!b.serviceDate) missing.push("service date");
  if (!kinds.has("invoice") && !kinds.has("both")) missing.push("invoice");
  if (!kinds.has("proof") && !kinds.has("both") && !b.proofOnInvoice) missing.push("proof of payment");
  const stage = claim ? claim.status : missing.length ? "need" : "ready";
  const deadline = b.serviceDate ? addDays(b.serviceDate, settings.deadlineDays) : null;
  const daysLeft = deadline ? daysBetween(todayISO(), deadline) : null;
  return { claim, missing, stage, deadline, daysLeft };
}

/* ════════════════════  UI PARTS  ════════════════════ */

const Label = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.mut, ...style }}>{children}</div>
);
const Card = ({ children, tone = "money", style }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderLeft: `3px solid var(--${tone})`,
    borderRadius: 12, padding: 16, ...style }}>{children}</div>
);
const Btn = ({ children, onClick, kind = "ghost", disabled, style, title }) => (
  <button onClick={onClick} disabled={disabled} title={title} style={{
    fontFamily: MONO, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase",
    padding: "10px 14px", minHeight: 40, borderRadius: 8, cursor: disabled ? "default" : "pointer",
    opacity: disabled ? 0.45 : 1,
    background: kind === "primary" ? C.acc : kind === "danger" ? "transparent" : C.card2,
    color: kind === "primary" ? C.accInk : kind === "danger" ? C.bad : C.ink,
    border: `1px solid ${kind === "primary" ? C.acc : kind === "danger" ? C.bad : C.line}`, ...style }}>{children}</button>
);
const Chip = ({ on, onClick, children, color = "acc" }) => (
  <button onClick={onClick} style={{ fontFamily: MONO, fontSize: 11, padding: "7px 11px", borderRadius: 999, cursor: "pointer",
    background: on ? `var(--${color})` : "transparent", color: on ? C.bg : C.sub,
    border: `1px solid ${on ? `var(--${color})` : C.line}`, whiteSpace: "nowrap" }}>{children}</button>
);
const StageTag = ({ stage }) => {
  const s = STAGES[stage] || STAGES.need;
  return <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
    color: `var(--${s.color})`, border: `1px solid var(--${s.color})`, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>{s.label}</span>;
};
const inputStyle = { width: "100%", boxSizing: "border-box", background: "var(--card2)", border: "1px solid var(--line)",
  borderRadius: 8, padding: "10px 11px", color: "var(--ink)", fontFamily: "var(--fBody)", fontSize: 15, minHeight: 42 };
const Field = ({ label, children, span = 1 }) => (
  <label style={{ display: "block", gridColumn: `span ${span}` }}>
    <Label style={{ marginBottom: 5 }}>{label}</Label>{children}
  </label>
);
const Stat = ({ label, value, sub, tone }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 14px 12px" }}>
    <Label>{label}</Label>
    <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, marginTop: 6, color: tone ? `var(--${tone})` : C.ink }}>{value}</div>
    {sub && <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);
const Copy = ({ text }) => {
  const [ok, setOk] = useState(false);
  return <button onClick={async () => { try { await navigator.clipboard.writeText(String(text ?? "")); setOk(true); setTimeout(() => setOk(false), 1100); } catch { /* ignore */ } }}
    style={{ fontFamily: MONO, fontSize: 10, background: "transparent", border: `1px solid ${C.line}`, color: ok ? C.good : C.sub,
      borderRadius: 6, padding: "5px 8px", cursor: "pointer", minWidth: 54 }}>{ok ? "✓" : "COPY"}</button>;
};
const Sheet = ({ title, onClose, children }) => (
  <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 50,
    display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
    <div onClick={(e) => e.stopPropagation()} style={{ background: C.bg, width: "100%", maxWidth: 760, maxHeight: "92vh",
      overflowY: "auto", borderRadius: "16px 16px 0 0", border: `1px solid ${C.line}`, padding: "18px 16px 28px", boxSizing: "border-box" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: DISP, fontSize: 20, fontWeight: 600 }}>{title}</div>
        <button onClick={onClose} style={{ background: "transparent", border: "none", color: C.sub, fontSize: 22, cursor: "pointer", minWidth: 44, minHeight: 44 }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

/* ════════════════════  BILL FORM  ════════════════════ */

function BillForm({ bill, members, onChange }) {
  const set = (k, v) => onChange({ ...bill, [k]: v });
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
      <Field label="Patient">
        <select style={inputStyle} value={bill.member} onChange={(e) => set("member", e.target.value)}>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </Field>
      <Field label="Provider" span={2}><input style={inputStyle} value={bill.provider} onChange={(e) => set("provider", e.target.value)} placeholder="Dr. med. …" /></Field>
      <Field label="Category">
        <select style={inputStyle} value={bill.category} onChange={(e) => set("category", e.target.value)}>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
      </Field>
      <Field label="Service date"><input type="date" style={inputStyle} value={bill.serviceDate || ""} onChange={(e) => set("serviceDate", e.target.value)} /></Field>
      <Field label="Service to (optional)"><input type="date" style={inputStyle} value={bill.serviceDateTo || ""} onChange={(e) => set("serviceDateTo", e.target.value)} /></Field>
      <Field label="Invoice date"><input type="date" style={inputStyle} value={bill.invoiceDate || ""} onChange={(e) => set("invoiceDate", e.target.value)} /></Field>
      <Field label="Invoice no."><input style={inputStyle} value={bill.invoiceNo || ""} onChange={(e) => set("invoiceNo", e.target.value)} /></Field>
      <Field label="Amount">
        <div style={{ display: "flex", gap: 6 }}>
          <input inputMode="decimal" style={{ ...inputStyle, flex: 1 }} value={bill.amount ?? ""} onChange={(e) => set("amount", e.target.value)} placeholder="0.00" />
          <select style={{ ...inputStyle, width: 78 }} value={bill.currency} onChange={(e) => set("currency", e.target.value)}>
            {["EUR", "USD", "GBP", "CHF"].map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </Field>
      <Field label="Paid to provider on"><input type="date" style={inputStyle} value={bill.paidDate || ""} onChange={(e) => set("paidDate", e.target.value)} /></Field>
      <Field label="Due date (Zahlungsziel)"><input type="date" style={inputStyle} value={bill.dueDate || ""} onChange={(e) => set("dueDate", e.target.value)} /></Field>
      <Field label="What it was for" span={2}><input style={inputStyle} value={bill.summary || ""} onChange={(e) => set("summary", e.target.value)} /></Field>
      <label style={{ gridColumn: "1 / -1", display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: C.sub, cursor: "pointer" }}>
        <input type="checkbox" checked={!!bill.proofOnInvoice} onChange={(e) => set("proofOnInvoice", e.target.checked)} style={{ width: 20, height: 20 }} />
        Invoice itself shows it was paid (receipt stamp / "Betrag erhalten")
      </label>
      <Field label="Notes" span={3}><input style={inputStyle} value={bill.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
    </div>
  );
}

function DocList({ docs, onOpen, onKind, onRemove }) {
  if (!docs?.length) return <div style={{ fontSize: 13, color: C.mut }}>No documents attached.</div>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {docs.map((d) => (
        <div key={d.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", background: C.card2, borderRadius: 8, padding: "8px 10px" }}>
          <span style={{ fontSize: 14, flex: "1 1 160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {d.type === "application/pdf" ? "📄" : "🖼"} {d.name}
          </span>
          <span style={{ fontFamily: MONO, fontSize: 10, color: d.bytes > ENVOY_FILE_LIMIT ? C.bad : C.mut }}>
            {kb(d.bytes)}{d.bytes > ENVOY_FILE_LIMIT ? " · OVER ENVOY 6 MB" : ""}</span>
          {onKind && <select value={d.kind} onChange={(e) => onKind(d.id, e.target.value)} style={{ ...inputStyle, width: 170, minHeight: 36, padding: "6px 8px", fontSize: 13 }}>
            {Object.entries(DOC_KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>}
          {onOpen && <Btn onClick={() => onOpen(d)} style={{ padding: "6px 10px", minHeight: 34 }}>Open</Btn>}
          {onRemove && <Btn kind="danger" onClick={() => onRemove(d.id)} style={{ padding: "6px 10px", minHeight: 34 }}>✕</Btn>}
        </div>
      ))}
    </div>
  );
}

/* ════════════════════  APP  ════════════════════ */

export default function LifeOSClaims() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("overview");
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(null);     // bill id open in the editor sheet
  const [packet, setPacket] = useState(null);       // { memberId, billIds[] } claim packet sheet
  const [paying, setPaying] = useState(null);       // claim id in the payment sheet

  /* ── load + theme ── */
  useEffect(() => {
    (async () => {
      const d = await loadKey(KEY, null);
      setData(d ? { ...blank(), ...d, settings: { ...blank().settings, ...(d.settings || {}) } } : blank());
      const h = await loadKey(HEALTH_KEY, {});
      const night = new Date().getHours() >= 19 || new Date().getHours() < 7;
      applyTheme(h?.theme || (h?.autoDark === false ? "field" : night ? "midnight" : "field"));
      setStatus("ready");
    })();
  }, []);

  const persist = useCallback(async (next) => {
    setData(next); setStatus("saving");
    const ok = await saveKey(KEY, next);
    setStatus(ok ? "saved" : "offline");
    if (ok) setTimeout(() => setStatus("ready"), 900);
  }, []);
  const flash = (t, ok = true) => { setToast({ t, ok }); setTimeout(() => setToast(null), 2600); };

  const openDoc = async (d) => {
    const full = await loadKey(DOC(d.id), null);
    if (!full) return flash("That document isn't on this device (documents don't travel with EXPORT).", false);
    const url = toBlobUrl(full);
    const a = document.createElement("a");
    a.href = url; a.target = "_blank"; a.rel = "noopener"; a.download = full.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  if (!data) return <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: MONO, color: C.mut, fontSize: 12, letterSpacing: "0.16em" }}>LOADING CLAIMS…</div>;

  const { members, settings, bills, claims } = data;
  const memberName = (id) => members.find((m) => m.id === id)?.name || "—";
  const info = Object.fromEntries(bills.map((b) => [b.id, billInfo(b, claims, settings)]));

  const updateBill = (b) => persist({ ...data, bills: data.bills.map((x) => (x.id === b.id ? b : x)) });
  const removeBill = async (id) => {
    const b = bills.find((x) => x.id === id);
    for (const d of b?.docs || []) await dropKey(DOC(d.id));
    persist({ ...data, bills: bills.filter((x) => x.id !== id), claims: claims.map((c) => ({ ...c, billIds: c.billIds.filter((x) => x !== id) })).filter((c) => c.billIds.length) });
    setEditing(null); flash("Bill deleted.");
  };

  const TABS = [["overview", "Overview"], ["bills", "Bills"], ["add", "+ Add bill"], ["claims", "Claims"], ["settings", "Settings"]];

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: "100vh", fontFamily: SANS, paddingBottom: 80 }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 0", boxSizing: "border-box" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
          <div>
            <Label style={{ color: C.money }}>Life OS · Money</Label>
            <div style={{ fontFamily: DISP, fontSize: 26, fontWeight: 600, marginTop: 4 }}>Medical claims</div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 4 }}>CIGNA ENVOY · BILLS IN € · REIMBURSED IN $</div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: status === "offline" ? C.bad : C.mut, letterSpacing: "0.1em" }}>
            {status === "saving" ? "SAVING…" : status === "saved" ? "✓ SAVED" : status === "offline" ? "NOT SAVED — STORAGE OFFLINE" : "● SYNCED"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, overflowX: "auto", margin: "18px 0 16px", paddingBottom: 4 }}>
          {TABS.map(([id, label]) => <Chip key={id} on={tab === id} onClick={() => setTab(id)} color="money">{label}</Chip>)}
        </div>

        {tab === "overview" && <Overview {...{ data, info, memberName, setTab, setEditing, setPacket }} />}
        {tab === "bills" && <Bills {...{ data, info, memberName, setEditing }} />}
        {tab === "add" && <AddBill {...{ data, persist, flash, setTab, setEditing }} />}
        {tab === "claims" && <Claims {...{ data, info, persist, memberName, flash, setPacket, setPaying, setEditing }} />}
        {tab === "settings" && <Settings {...{ data, persist, flash }} />}
      </div>

      {editing && bills.find((b) => b.id === editing) && (
        <BillEditor bill={bills.find((b) => b.id === editing)} info={info[editing]} members={members}
          onSave={(b) => { updateBill(b); setEditing(null); flash("Bill saved."); }}
          onDelete={removeBill} onOpen={openDoc} onClose={() => setEditing(null)} />
      )}
      {packet && <Packet {...{ data, packet, info, memberName, persist, flash, openDoc }} onClose={() => setPacket(null)} />}
      {paying && claims.find((c) => c.id === paying) && (
        <PaymentSheet claim={claims.find((c) => c.id === paying)} {...{ data, persist, flash }} onClose={() => setPaying(null)} />
      )}

      {toast && <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", zIndex: 60,
        background: C.card3, color: toast.ok ? C.ink : C.bad, border: `1px solid ${C.line}`, borderRadius: 10,
        padding: "11px 16px", fontSize: 14, maxWidth: "88vw", boxShadow: "0 6px 24px rgba(0,0,0,0.3)" }}>{toast.t}</div>}
    </div>
  );
}

/* ════════════════════  OVERVIEW  ════════════════════ */

function Overview({ data, info, memberName, setTab, setEditing, setPacket }) {
  const { bills, claims, settings, members } = data;
  const year = todayISO().slice(0, 4);
  const sumBills = (arr) => arr.reduce((s, b) => s + (b.currency === "USD" ? num(b.amount) / settings.fx : num(b.amount)), 0);
  const by = (st) => bills.filter((b) => info[b.id].stage === st);
  const toClaim = bills.filter((b) => ["need", "ready"].includes(info[b.id].stage));
  const waiting = claims.filter((c) => ["submitted", "appeal"].includes(c.status));
  const waitingBills = bills.filter((b) => ["submitted", "appeal"].includes(info[b.id].stage));
  const paidYTD = claims.filter((c) => (c.paidDate || "").startsWith(year)).reduce((s, c) => s + num(c.paidUSD), 0);
  const oldestWait = waiting.length ? Math.max(...waiting.map((c) => daysBetween(c.submittedDate, todayISO()))) : null;
  const done = claims.filter((c) => c.paidDate && c.submittedDate);
  const avgDays = done.length ? Math.round(done.reduce((s, c) => s + daysBetween(c.submittedDate, c.paidDate), 0) / done.length) : null;

  /* next actions, most urgent first */
  const actions = [];
  toClaim.filter((b) => info[b.id].daysLeft !== null && info[b.id].daysLeft <= settings.warnDays)
    .sort((a, b) => info[a.id].daysLeft - info[b.id].daysLeft)
    .forEach((b) => actions.push({ tone: "bad", t: `${b.provider || "Bill"} — ${info[b.id].daysLeft < 0 ? "past" : info[b.id].daysLeft + " days to"} filing deadline`,
      sub: `${memberName(b.member)} · service ${pretty(b.serviceDate)} · ${money(b.amount, b.currency)}`, go: () => setEditing(b.id) }));
  members.forEach((m) => {
    const ready = by("ready").filter((b) => b.member === m.id);
    if (ready.length) actions.push({ tone: "acc", t: `Submit ${ready.length} ready bill${ready.length > 1 ? "s" : ""} for ${m.name}`,
      sub: `${money(sumBills(ready), "EUR")} · build the claim packet`, go: () => setPacket({ memberId: m.id, billIds: ready.map((b) => b.id) }) });
  });
  by("need").forEach((b) => actions.push({ tone: "money", t: `${b.provider || "Bill"} — needs ${info[b.id].missing.join(", ")}`,
    sub: `${memberName(b.member)} · ${pretty(b.serviceDate)}`, go: () => setEditing(b.id) }));
  waiting.filter((c) => daysBetween(c.submittedDate, todayISO()) > settings.chaseDays).forEach((c) => actions.push({ tone: "admin",
    t: `Chase claim ${c.ref || "(no ref)"} — ${daysBetween(c.submittedDate, todayISO())} days with Cigna`,
    sub: `Submitted ${pretty(c.submittedDate)} · check Envoy, then paste status on Claims`, go: () => setTab("claims") }));
  claims.filter((c) => c.status === "denied" && !c.appealDecided).forEach((c) => actions.push({ tone: "learn",
    t: `Decide on denied claim ${c.ref || ""}`, sub: c.note || "Appeal or close it out", go: () => setTab("claims") }));

  /* per member × year */
  const years = [...new Set(bills.map((b) => (b.serviceDate || "").slice(0, 4)).filter(Boolean))].sort().reverse().slice(0, 3);
  const rows = [];
  years.forEach((y) => members.forEach((m) => {
    const mine = bills.filter((b) => b.member === m.id && (b.serviceDate || "").startsWith(y));
    if (!mine.length) return;
    const claimIds = new Set(mine.map((b) => info[b.id].claim?.id).filter(Boolean));
    const reimb = claims.filter((c) => claimIds.has(c.id)).reduce((s, c) => s + num(c.paidUSD), 0);
    const open = mine.filter((b) => !["paid", "denied"].includes(info[b.id].stage));
    rows.push({ y, m: m.name, n: mine.length, billed: sumBills(mine), reimb, open: sumBills(open) });
  }));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
        <Stat label="To claim" value={money(sumBills(toClaim), "EUR")} sub={`${toClaim.length} bills · ${by("ready").length} ready`} tone="acc" />
        <Stat label="With Cigna" value={money(sumBills(waitingBills), "EUR")} sub={waiting.length ? `${waiting.length} claims · oldest ${oldestWait} d` : "nothing pending"} tone="admin" />
        <Stat label={`Reimbursed ${year}`} value={money(paidYTD, "USD")} sub={avgDays !== null ? `avg ${avgDays} days to pay` : "no payments yet"} tone="good" />
        <Stat label="Missing info" value={by("need").length} sub="invoice, proof or amount" tone={by("need").length ? "bad" : null} />
      </div>

      <Card tone="acc">
        <Label style={{ marginBottom: 10 }}>Next actions</Label>
        {!actions.length && <div style={{ fontSize: 14, color: C.sub }}>
          {bills.length ? "All clear — nothing to claim or chase." : "No bills yet. Add your first bill to start the ledger."}
          {!bills.length && <div style={{ marginTop: 10 }}><Btn kind="primary" onClick={() => setTab("add")}>+ Add bill</Btn></div>}
        </div>}
        <div style={{ display: "grid", gap: 2 }}>
          {actions.slice(0, 10).map((a, i) => (
            <div key={i} onClick={a.go} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 4px", cursor: "pointer",
              borderTop: i ? `1px solid ${C.lineSoft}` : "none", minHeight: 44 }}>
              <span style={{ width: 8, height: 8, borderRadius: 4, background: `var(--${a.tone})`, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15 }}>{a.t}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.mut, marginTop: 3 }}>{a.sub}</div>
              </div>
              <span style={{ fontFamily: MONO, fontSize: 11, color: C.mut }}>→</span>
            </div>
          ))}
        </div>
      </Card>

      {rows.length > 0 && <Card tone="money">
        <Label style={{ marginBottom: 10 }}>By family member</Label>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 460 }}>
            <thead><tr>{["Year", "Member", "Bills", "Billed (€)", "Reimbursed ($)", "Still open (€)"].map((h, i) => (
              <th key={h} style={{ textAlign: i > 1 ? "right" : "left", fontFamily: MONO, fontSize: 10, color: C.mut, fontWeight: 400,
                letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 6px", borderBottom: `1px solid ${C.line}` }}>{h}</th>))}</tr></thead>
            <tbody>{rows.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: "8px 6px", fontFamily: MONO }}>{r.y}</td>
                <td style={{ padding: "8px 6px" }}>{r.m}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: MONO }}>{r.n}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: MONO }}>{money(r.billed, "EUR")}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: MONO, color: C.good }}>{money(r.reimb, "USD")}</td>
                <td style={{ padding: "8px 6px", textAlign: "right", fontFamily: MONO, color: r.open ? C.acc : C.mut }}>{money(r.open, "EUR")}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>}
    </div>
  );
}

/* ════════════════════  BILLS LEDGER  ════════════════════ */

function Bills({ data, info, memberName, setEditing }) {
  const [stage, setStage] = useState("open");
  const [member, setMember] = useState("all");
  const [q, setQ] = useState("");
  const list = data.bills
    .filter((b) => stage === "all" || (stage === "open" ? !["paid", "denied"].includes(info[b.id].stage) : info[b.id].stage === stage))
    .filter((b) => member === "all" || b.member === member)
    .filter((b) => !q || `${b.provider} ${b.summary} ${b.invoiceNo} ${b.notes}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => STAGES[info[a.id].stage].order - STAGES[info[b.id].stage].order || (b.serviceDate || "").localeCompare(a.serviceDate || ""));
  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
        <Chip on={stage === "open"} onClick={() => setStage("open")}>Open</Chip>
        {Object.entries(STAGES).map(([k, s]) => <Chip key={k} on={stage === k} color={s.color} onClick={() => setStage(k)}>{s.label}</Chip>)}
        <Chip on={stage === "all"} onClick={() => setStage("all")}>All</Chip>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <select value={member} onChange={(e) => setMember(e.target.value)} style={{ ...inputStyle, width: 150 }}>
          <option value="all">Everyone</option>
          {data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search provider, invoice no., notes" style={{ ...inputStyle, flex: "1 1 200px" }} />
      </div>
      {!list.length && <div style={{ color: C.mut, fontSize: 14, padding: 12 }}>No bills match.</div>}
      {list.map((b) => {
        const i = info[b.id];
        return (
          <div key={b.id} onClick={() => setEditing(b.id)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
            borderLeft: `3px solid var(--${STAGES[i.stage].color})`, padding: "12px 14px", cursor: "pointer", display: "grid", gap: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{b.provider || "Unnamed provider"}</div>
              <div style={{ fontFamily: MONO, fontSize: 15 }}>{money(b.amount, b.currency)}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontFamily: MONO, fontSize: 11, color: C.sub }}>
              <StageTag stage={i.stage} />
              <span>{memberName(b.member)}</span><span>·</span><span>{pretty(b.serviceDate)}</span>
              <span>·</span><span>{b.category}</span>
              {i.claim?.ref && <><span>·</span><span>REF {i.claim.ref}</span></>}
              {["need", "ready"].includes(i.stage) && i.daysLeft !== null && i.daysLeft <= data.settings.warnDays &&
                <span style={{ color: C.bad }}>⚑ {i.daysLeft < 0 ? "PAST DEADLINE" : `${i.daysLeft} D TO DEADLINE`}</span>}
            </div>
            {i.stage === "need" && <div style={{ fontSize: 13, color: C.bad }}>Missing: {i.missing.join(", ")}</div>}
            {b.summary && <div style={{ fontSize: 13, color: C.mut }}>{b.summary}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ════════════════════  ADD BILL (INTAKE)  ════════════════════ */

const newBill = (members) => ({ id: uid(), member: members[0]?.id, provider: "", category: "Doctor", serviceDate: "", serviceDateTo: "",
  invoiceDate: "", invoiceNo: "", amount: "", currency: "EUR", paidDate: "", dueDate: "", summary: "", notes: "", proofOnInvoice: false,
  docs: [], added: todayISO() });

function AddBill({ data, persist, flash, setTab, setEditing }) {
  const [bill, setBill] = useState(() => newBill(data.members));
  const [files, setFiles] = useState([]); // { id, name, type, data, bytes, kind }
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const inp = useRef();

  const onFiles = async (e) => {
    setErr(null);
    const picked = [...(e.target.files || [])];
    e.target.value = "";
    const out = [];
    for (const f of picked) {
      try { out.push({ id: uid(), kind: files.length + out.length === 0 ? "invoice" : "proof", ...(await readFile(f)) }); }
      catch (x) { setErr(x.message); }
    }
    setFiles((p) => [...p, ...out]);
  };

  const read = async () => {
    setBusy(true); setErr(null);
    try {
      const r = await extractBill(files, data.members);
      const match = data.members.find((m) => r.patient && r.patient.toLowerCase().includes(m.name.toLowerCase()));
      setBill((b) => ({ ...b,
        provider: r.provider || b.provider, invoiceNo: r.invoiceNo || b.invoiceNo, invoiceDate: r.invoiceDate || b.invoiceDate,
        serviceDate: r.serviceDate || b.serviceDate, serviceDateTo: r.serviceDateTo || b.serviceDateTo,
        amount: r.amount != null ? String(r.amount) : b.amount, currency: r.currency || b.currency,
        category: CATEGORIES.includes(r.category) ? r.category : b.category, summary: r.summary || b.summary,
        paidDate: r.paidDate || b.paidDate, dueDate: r.dueDate || b.dueDate,
        member: match ? match.id : b.member,
        proofOnInvoice: files.length === 1 && r.hasProofOfPayment ? true : b.proofOnInvoice }));
      if (r.hasProofOfPayment && files.length > 1) setFiles((fs) => fs.map((f, i) => (i === 0 ? f : { ...f, kind: "proof" })));
      flash(`Read: ${r.provider || "provider"} · ${r.amount != null ? money(r.amount, r.currency || "EUR") : "no amount"} — check the fields.`);
    } catch (x) { setErr("Couldn't read the bill: " + x.message + " Fill the fields by hand."); }
    setBusy(false);
  };

  const save = async (andNew) => {
    const docs = [];
    for (const f of files) {
      const ok = await saveKey(DOC(f.id), { name: f.name, type: f.type, data: f.data, kind: f.kind, bytes: f.bytes, added: todayISO() });
      if (!ok) { setErr(`Couldn't store ${f.name} — it may be too large for storage.`); return; }
      docs.push({ id: f.id, name: f.name, type: f.type, kind: f.kind, bytes: f.bytes });
    }
    const b = { ...bill, docs };
    await persist({ ...data, bills: [...data.bills, b] });
    const i = billInfo(b, data.claims, data.settings);
    flash(i.stage === "ready" ? "Saved — ready to claim." : `Saved — still needs ${i.missing.join(", ")}.`);
    setBill(newBill(data.members)); setFiles([]);
    if (!andNew) setTab("bills");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <Card tone="acc">
        <Label style={{ marginBottom: 8 }}>1 · Documents</Label>
        <div style={{ fontSize: 14, color: C.sub, marginBottom: 12 }}>
          Photo or PDF of the Rechnung, plus proof of payment (bank transfer, card slip, or a "bezahlt" stamp). Envoy needs both for reimbursement.
        </div>
        <input ref={inp} type="file" accept="image/*,application/pdf" multiple capture="environment" onChange={onFiles} style={{ display: "none" }} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: files.length ? 12 : 0 }}>
          <Btn kind="primary" onClick={() => inp.current?.click()}>📷 Add photo / PDF</Btn>
          {files.length > 0 && <Btn onClick={read} disabled={busy}>{busy ? "Reading…" : "✦ Read with Claude"}</Btn>}
        </div>
        <DocList docs={files}
          onKind={(id, kind) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, kind } : f)))}
          onRemove={(id) => setFiles((fs) => fs.filter((f) => f.id !== id))} />
        {err && <div style={{ marginTop: 10, color: C.bad, fontSize: 14 }}>{err}</div>}
      </Card>

      <Card tone="money">
        <Label style={{ marginBottom: 12 }}>2 · Bill details</Label>
        <BillForm bill={bill} members={data.members} onChange={setBill} />
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
          <Btn kind="primary" onClick={() => save(false)} disabled={!bill.provider && !files.length}>Save bill</Btn>
          <Btn onClick={() => save(true)} disabled={!bill.provider && !files.length}>Save + add another</Btn>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════  BILL EDITOR  ════════════════════ */

function BillEditor({ bill, info, members, onSave, onDelete, onOpen, onClose }) {
  const [b, setB] = useState(bill);
  const [confirmDel, setConfirmDel] = useState(false);
  const inp = useRef();
  const addFiles = async (e) => {
    const picked = [...(e.target.files || [])]; e.target.value = "";
    const docs = [...b.docs];
    for (const f of picked) {
      try {
        const r = await readFile(f); const id = uid();
        const kind = docs.length ? "proof" : "invoice";
        if (await saveKey(DOC(id), { ...r, kind, added: todayISO() })) docs.push({ id, name: r.name, type: r.type, kind, bytes: r.bytes });
      } catch { /* skip unreadable file */ }
    }
    setB({ ...b, docs });
  };
  const removeDoc = async (id) => { await dropKey(DOC(id)); setB({ ...b, docs: b.docs.filter((d) => d.id !== id) }); };
  return (
    <Sheet title={b.provider || "Bill"} onClose={onClose}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <StageTag stage={info.stage} />
        {info.claim && <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>
          Claim {info.claim.ref || "(no ref)"} · submitted {pretty(info.claim.submittedDate)}</span>}
        {info.deadline && !info.claim && <span style={{ fontFamily: MONO, fontSize: 11, color: info.daysLeft <= 60 ? C.bad : C.sub }}>
          File by {pretty(info.deadline)}</span>}
      </div>
      {info.stage === "need" && <div style={{ color: C.bad, fontSize: 14, marginBottom: 12 }}>Missing: {info.missing.join(", ")}</div>}
      <BillForm bill={b} members={members} onChange={setB} />
      <Label style={{ margin: "18px 0 8px" }}>Documents</Label>
      <DocList docs={b.docs} onOpen={onOpen}
        onKind={(id, kind) => setB({ ...b, docs: b.docs.map((d) => (d.id === id ? { ...d, kind } : d)) })} onRemove={removeDoc} />
      <input ref={inp} type="file" accept="image/*,application/pdf" multiple onChange={addFiles} style={{ display: "none" }} />
      <div style={{ marginTop: 8 }}><Btn onClick={() => inp.current?.click()}>+ Attach document</Btn></div>
      <div style={{ display: "flex", gap: 8, marginTop: 20, flexWrap: "wrap", justifyContent: "space-between" }}>
        <Btn kind="primary" onClick={() => onSave(b)}>Save</Btn>
        {confirmDel
          ? <Btn kind="danger" onClick={() => onDelete(b.id)}>Confirm delete</Btn>
          : <Btn kind="danger" onClick={() => setConfirmDel(true)}>Delete bill</Btn>}
      </div>
    </Sheet>
  );
}

/* ════════════════════  CLAIM PACKET  ════════════════════ */

function Packet({ data, packet, info, memberName, persist, flash, openDoc, onClose }) {
  const [sel, setSel] = useState(new Set(packet.billIds));
  const [ref, setRef] = useState("");
  const [date, setDate] = useState(todayISO());
  const [channel, setChannel] = useState("app");
  const candidates = data.bills.filter((b) => b.member === packet.memberId && info[b.id].stage === "ready");
  const chosen = candidates.filter((b) => sel.has(b.id));
  const total = chosen.reduce((s, b) => s + num(b.amount), 0);
  const cur = chosen[0]?.currency || "EUR";
  const toggle = (id) => { const n = new Set(sel); n.has(id) ? n.delete(id) : n.add(id); setSel(n); };

  const submit = () => {
    const c = { id: uid(), ref: ref.trim(), submittedDate: date, channel, billIds: chosen.map((b) => b.id), member: packet.memberId,
      status: "submitted", paidUSD: "", paidDate: "", note: "" };
    persist({ ...data, claims: [...data.claims, c] });
    flash(`Logged as submitted — ${chosen.length} bill${chosen.length > 1 ? "s" : ""}.`); onClose();
  };

  const rowStyle = { display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderTop: `1px solid ${C.lineSoft}` };
  return (
    <Sheet title={`Claim packet · ${memberName(packet.memberId)}`} onClose={onClose}>
      <div style={{ fontSize: 14, color: C.sub, marginBottom: 14 }}>
        Open Envoy (app: photo claim · web: Submit a new claim), pick <b>{memberName(packet.memberId)}</b>, and enter these values. One claim can carry several invoices for the same person.
      </div>
      {candidates.map((b) => (
        <Card key={b.id} tone={sel.has(b.id) ? "acc" : "line"} style={{ marginBottom: 10, opacity: sel.has(b.id) ? 1 : 0.55 }}>
          <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", marginBottom: 6 }}>
            <input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} style={{ width: 20, height: 20 }} />
            <span style={{ fontWeight: 600, fontSize: 15 }}>{b.provider}</span>
          </label>
          {sel.has(b.id) && <>
            {[["Provider", b.provider], ["Country of treatment", "Germany"], ["Service date", b.serviceDate + (b.serviceDateTo ? ` – ${b.serviceDateTo}` : "")],
              ["Invoice no.", b.invoiceNo], ["Amount", num(b.amount).toFixed(2)], ["Currency", b.currency], ["Type of care", b.category],
              ["Description", b.summary]].filter(([, v]) => v).map(([k, v]) => (
              <div key={k} style={rowStyle}>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.mut, textTransform: "uppercase", letterSpacing: "0.08em", width: 130, flexShrink: 0 }}>{k}</span>
                <span style={{ flex: 1, fontSize: 14 }}>{v}</span><Copy text={v} />
              </div>))}
            <div style={{ marginTop: 8 }}><DocList docs={b.docs} onOpen={openDoc} /></div>
          </>}
        </Card>
      ))}
      <Card tone="money" style={{ marginTop: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <Label>Claim total</Label><span style={{ fontFamily: MONO, fontSize: 16 }}>{money(total, cur)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <Field label="Envoy reference"><input style={inputStyle} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="from the confirmation" /></Field>
          <Field label="Submitted on"><input type="date" style={inputStyle} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
          <Field label="Via"><select style={inputStyle} value={channel} onChange={(e) => setChannel(e.target.value)}>
            {Object.entries(CHANNELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
        </div>
        <div style={{ marginTop: 14 }}><Btn kind="primary" disabled={!chosen.length} onClick={submit}>Mark submitted to Cigna</Btn></div>
      </Card>
    </Sheet>
  );
}

/* ════════════════════  CLAIMS + RECONCILIATION  ════════════════════ */

function Claims({ data, info, persist, memberName, flash, setPacket, setPaying, setEditing }) {
  const [paste, setPaste] = useState("");
  const [busy, setBusy] = useState(false);
  const [proposals, setProposals] = useState(null);
  const [filter, setFilter] = useState("open");
  const { bills, claims, members } = data;
  const billTotal = (c) => c.billIds.map((id) => bills.find((b) => b.id === id)).filter(Boolean).reduce((s, b) => s + num(b.amount), 0);

  const runParse = async () => {
    setBusy(true);
    try {
      const rows = await parseEnvoyStatus(paste, claims, bills);
      setProposals(rows.map((r) => {
        let match = claims.find((c) => c.ref && r.ref && c.ref.replace(/\W/g, "") === String(r.ref).replace(/\W/g, ""));
        if (!match && r.billed) match = claims.find((c) => !c.ref && Math.abs(billTotal(c) - num(r.billed)) < 0.02);
        return { ...r, matchId: match?.id || null, apply: !!match };
      }));
    } catch (x) { flash("Couldn't parse that: " + x.message, false); }
    setBusy(false);
  };
  const applyProposals = () => {
    const next = claims.map((c) => {
      const p = proposals.find((x) => x.apply && x.matchId === c.id);
      if (!p) return c;
      return { ...c, ref: c.ref || p.ref || "", status: CLAIM_STATES.includes(p.status) ? p.status : c.status,
        paidUSD: p.paidUSD != null ? String(p.paidUSD) : c.paidUSD, paidDate: p.paidDate || c.paidDate, note: p.note || c.note };
    });
    persist({ ...data, claims: next });
    flash(`Updated ${proposals.filter((p) => p.apply && p.matchId).length} claims from Envoy.`);
    setProposals(null); setPaste("");
  };

  const readyByMember = members.map((m) => ({ m, n: bills.filter((b) => b.member === m.id && info[b.id].stage === "ready") })).filter((x) => x.n.length);
  const list = claims.filter((c) => filter === "all" || (filter === "open" ? ["submitted", "appeal", "denied"].includes(c.status) && !c.appealDecided : c.status === filter))
    .sort((a, b) => (b.submittedDate || "").localeCompare(a.submittedDate || ""));

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card tone="acc">
        <Label style={{ marginBottom: 10 }}>Build a claim</Label>
        {!readyByMember.length && <div style={{ fontSize: 14, color: C.sub }}>No bills are ready. A bill is ready once it has an amount, service date, invoice and proof of payment.</div>}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {readyByMember.map(({ m, n }) => (
            <Btn key={m.id} kind="primary" onClick={() => setPacket({ memberId: m.id, billIds: n.map((b) => b.id) })}>
              {m.name} · {n.length} bill{n.length > 1 ? "s" : ""}</Btn>))}
        </div>
      </Card>

      <Card tone="admin">
        <Label style={{ marginBottom: 8 }}>Update from Envoy</Label>
        <div style={{ fontSize: 14, color: C.sub, marginBottom: 10 }}>
          In Envoy, open My Claims, select all the text on the page, copy, and paste it here. Claude matches each line to your claims by reference or amount; you approve each change.
        </div>
        <textarea value={paste} onChange={(e) => setPaste(e.target.value)} rows={4} placeholder="Paste Envoy claim list…" style={{ ...inputStyle, minHeight: 90, fontFamily: MONO, fontSize: 12 }} />
        <div style={{ marginTop: 10 }}><Btn onClick={runParse} disabled={!paste.trim() || busy}>{busy ? "Reading…" : "✦ Read Envoy status"}</Btn></div>
        {proposals && <div style={{ marginTop: 14, display: "grid", gap: 8 }}>
          {proposals.map((p, i) => {
            const c = claims.find((x) => x.id === p.matchId);
            return (
              <div key={i} style={{ background: C.card2, borderRadius: 8, padding: 10, display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ fontFamily: MONO, fontSize: 12 }}>{p.ref || "no ref"} · <StageTag stage={p.status} /> {p.paidUSD != null && `· ${money(p.paidUSD)}`}</span>
                  <select value={p.matchId || ""} onChange={(e) => setProposals(proposals.map((x, j) => (j === i ? { ...x, matchId: e.target.value || null, apply: !!e.target.value } : x)))}
                    style={{ ...inputStyle, width: 220, minHeight: 36, padding: "6px 8px", fontSize: 13 }}>
                    <option value="">— not matched —</option>
                    {claims.map((x) => <option key={x.id} value={x.id}>{x.ref || "no ref"} · {memberName(x.member)} · {money(billTotal(x), "EUR")}</option>)}
                  </select>
                </div>
                {p.note && <div style={{ fontSize: 13, color: C.sub }}>{p.note}</div>}
                {c && <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13, color: C.sub }}>
                  <input type="checkbox" checked={p.apply} onChange={(e) => setProposals(proposals.map((x, j) => (j === i ? { ...x, apply: e.target.checked } : x)))} />
                  Apply: {c.status} → {p.status}</label>}
              </div>);
          })}
          <div style={{ display: "flex", gap: 8 }}>
            <Btn kind="primary" onClick={applyProposals} disabled={!proposals.some((p) => p.apply && p.matchId)}>Apply selected</Btn>
            <Btn onClick={() => setProposals(null)}>Discard</Btn>
          </div>
        </div>}
      </Card>

      <div style={{ display: "flex", gap: 6, overflowX: "auto" }}>
        {[["open", "Open"], ...CLAIM_STATES.map((s) => [s, STAGES[s].label]), ["all", "All"]].map(([k, l]) =>
          <Chip key={k} on={filter === k} color={STAGES[k]?.color || "acc"} onClick={() => setFilter(k)}>{l}</Chip>)}
      </div>
      {!list.length && <div style={{ color: C.mut, fontSize: 14, padding: 8 }}>No claims here.</div>}
      {list.map((c) => {
        const days = daysBetween(c.submittedDate, c.paidDate || todayISO());
        const total = billTotal(c);
        const rate = num(c.paidUSD) && total ? num(c.paidUSD) / (total * data.settings.fx) : null;
        return (
          <Card key={c.id} tone={STAGES[c.status].color}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "baseline" }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{memberName(c.member)} · {c.ref || "no reference"}</div>
              <div style={{ fontFamily: MONO, fontSize: 14 }}>{money(total, "EUR")}{c.paidUSD ? <span style={{ color: C.good }}> → {money(c.paidUSD)}</span> : null}</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontFamily: MONO, fontSize: 11, color: C.sub, margin: "6px 0 8px" }}>
              <StageTag stage={c.status} /><span>sent {pretty(c.submittedDate)}</span><span>· {CHANNELS[c.channel]?.split(" (")[0]}</span>
              <span>· {c.paidDate ? `paid in ${days} d` : `${days} d waiting`}</span>
              {rate !== null && <span>· ≈{Math.round(rate * 100)}% of billed</span>}
            </div>
            {c.note && <div style={{ fontSize: 13, color: C.sub, marginBottom: 8 }}>{c.note}</div>}
            <div style={{ display: "grid", gap: 2, marginBottom: 10 }}>
              {c.billIds.map((id) => bills.find((b) => b.id === id)).filter(Boolean).map((b) => (
                <div key={b.id} onClick={() => setEditing(b.id)} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: C.sub, cursor: "pointer", padding: "4px 0" }}>
                  <span>{b.provider} · {pretty(b.serviceDate)}</span><span style={{ fontFamily: MONO }}>{money(b.amount, b.currency)}</span>
                </div>))}
            </div>
            <Btn onClick={() => setPaying(c.id)}>Record outcome</Btn>
          </Card>
        );
      })}
    </div>
  );
}

function PaymentSheet({ claim, data, persist, flash, onClose }) {
  const [c, setC] = useState(claim);
  const set = (k, v) => setC({ ...c, [k]: v });
  const save = () => { persist({ ...data, claims: data.claims.map((x) => (x.id === c.id ? c : x)) }); flash("Claim updated."); onClose(); };
  const reopen = () => { persist({ ...data, claims: data.claims.filter((x) => x.id !== c.id) }); flash("Claim removed — bills are back in the queue."); onClose(); };
  return (
    <Sheet title={`Claim ${c.ref || "(no ref)"}`} onClose={onClose}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {CLAIM_STATES.map((s) => <Chip key={s} on={c.status === s} color={STAGES[s].color} onClick={() => set("status", s)}>{STAGES[s].label}</Chip>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Field label="Envoy reference"><input style={inputStyle} value={c.ref} onChange={(e) => set("ref", e.target.value)} /></Field>
        <Field label="Reimbursed (USD)"><input inputMode="decimal" style={inputStyle} value={c.paidUSD} onChange={(e) => set("paidUSD", e.target.value)} placeholder="0.00" /></Field>
        <Field label="Paid on"><input type="date" style={inputStyle} value={c.paidDate || ""} onChange={(e) => set("paidDate", e.target.value)} /></Field>
        <Field label="Note (EOB, denial reason, info requested)" span={3}><input style={inputStyle} value={c.note || ""} onChange={(e) => set("note", e.target.value)} /></Field>
      </div>
      {c.status === "denied" && <label style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 14, color: C.sub, marginTop: 12 }}>
        <input type="checkbox" checked={!!c.appealDecided} onChange={(e) => set("appealDecided", e.target.checked)} style={{ width: 20, height: 20 }} />
        Closed out — not appealing</label>}
      <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap", justifyContent: "space-between" }}>
        <Btn kind="primary" onClick={save}>Save</Btn>
        <Btn kind="danger" onClick={reopen} title="Use if it was logged by mistake or must be resubmitted">Undo submission</Btn>
      </div>
    </Sheet>
  );
}

/* ════════════════════  SETTINGS / EXPORT  ════════════════════ */

function Settings({ data, persist, flash }) {
  const [members, setMembers] = useState(data.members);
  const [s, setS] = useState(data.settings);
  const [imp, setImp] = useState("");
  const exportJson = JSON.stringify({ app: "lifeos.claims", exported: todayISO(), ...data });
  const save = () => { persist({ ...data, members: members.filter((m) => m.name.trim()), settings: { ...s, deadlineDays: num(s.deadlineDays) || 365,
    warnDays: num(s.warnDays) || 60, chaseDays: num(s.chaseDays) || 30, fx: num(s.fx) || 1.08 } }); flash("Settings saved."); };
  const doImport = () => {
    try {
      const inc = JSON.parse(imp);
      const mergeById = (a, b) => { const m = new Map(a.map((x) => [x.id, x])); (b || []).forEach((x) => m.set(x.id, x)); return [...m.values()]; };
      persist({ ...data, members: mergeById(data.members, inc.members), bills: mergeById(data.bills, inc.bills), claims: mergeById(data.claims, inc.claims) });
      flash(`Merged ${(inc.bills || []).length} bills and ${(inc.claims || []).length} claims.`); setImp("");
    } catch { flash("Couldn't read that — paste the complete JSON from COPY ALL.", false); }
  };
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card tone="money">
        <Label style={{ marginBottom: 10 }}>Family members on the policy</Label>
        <div style={{ display: "grid", gap: 8 }}>
          {members.map((m, i) => (
            <div key={m.id} style={{ display: "flex", gap: 8 }}>
              <input style={inputStyle} value={m.name} onChange={(e) => setMembers(members.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              {members.length > 1 && !data.bills.some((b) => b.member === m.id) &&
                <Btn kind="danger" onClick={() => setMembers(members.filter((_, j) => j !== i))}>✕</Btn>}
            </div>))}
        </div>
        <div style={{ marginTop: 8 }}><Btn onClick={() => setMembers([...members, { id: uid(), name: "" }])}>+ Member</Btn></div>
      </Card>
      <Card tone="admin">
        <Label style={{ marginBottom: 10 }}>Rules</Label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
          <Field label="Filing deadline (days after service)"><input inputMode="numeric" style={inputStyle} value={s.deadlineDays} onChange={(e) => setS({ ...s, deadlineDays: e.target.value })} /></Field>
          <Field label="Warn this many days before"><input inputMode="numeric" style={inputStyle} value={s.warnDays} onChange={(e) => setS({ ...s, warnDays: e.target.value })} /></Field>
          <Field label="Chase Cigna after (days)"><input inputMode="numeric" style={inputStyle} value={s.chaseDays} onChange={(e) => setS({ ...s, chaseDays: e.target.value })} /></Field>
          <Field label="EUR → USD rate (estimates)"><input inputMode="decimal" style={inputStyle} value={s.fx} onChange={(e) => setS({ ...s, fx: e.target.value })} /></Field>
        </div>
        <div style={{ fontSize: 13, color: C.mut, marginTop: 10 }}>Confirm the filing deadline against your Booz Allen plan booklet in Envoy (My Account › My Documents). The rate is only used for the "% of billed" estimate.</div>
        <div style={{ marginTop: 14 }}><Btn kind="primary" onClick={save}>Save settings</Btn></div>
      </Card>
      <Card tone="learn">
        <Label style={{ marginBottom: 8 }}>Backup & sync</Label>
        <div style={{ fontSize: 14, color: C.sub, marginBottom: 10 }}>Exports bills and claims. Document images stay on this device.</div>
        <Copy text={exportJson} /> <span style={{ fontFamily: MONO, fontSize: 11, color: C.mut }}>COPY ALL · {data.bills.length} bills · {data.claims.length} claims</span>
        <textarea value={imp} onChange={(e) => setImp(e.target.value)} rows={3} placeholder="Paste an export to merge…" style={{ ...inputStyle, minHeight: 72, marginTop: 12, fontFamily: MONO, fontSize: 12 }} />
        <div style={{ marginTop: 8 }}><Btn onClick={doImport} disabled={!imp.trim()}>Merge import</Btn></div>
      </Card>
    </div>
  );
}
