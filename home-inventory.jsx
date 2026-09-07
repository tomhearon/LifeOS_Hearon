import React, { useState, useEffect, useMemo, useRef } from "react";

/* ═══════════════════════════════════════════════════════════════
   HOME INVENTORY & LIBRARY  ·  v1
   Two capture paths, one store. Books get arranged; valuables get
   documented. Storage keys are namespaced so this can be folded
   into the Life OS shell as module 04 without a migration.
   ═══════════════════════════════════════════════════════════════ */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "Inter, -apple-system, BlinkMacSystemFont, sans-serif";

const C = {
  bg: "#131211",
  panel: "#1B1A18",
  rule: "#2E2C29",
  text: "#E4E1DA",
  dim: "#A9A49B",
  dimmer: "#6E6960",
  amber: "#E9A13B",
  good: "#6FA36B",
  warn: "#C4685A",
  wood: "#3A2E24",
};

const K = {
  books: "homeinv:v1:books",
  items: "homeinv:v1:items",
  cases: "homeinv:v1:cases",
  photo: (id) => `homeinv:v1:photo:${id}`,
  drinks: "homeinv:v1:drinks",
  shot: (id) => `homeinv:v1:shot:${id}`,
};

/* ─────────────────────────  REFERENCE DATA  ───────────────────────── */

const SPINE_COLORS = [
  { k: "maroon", hex: "#6E2B2B" }, { k: "crimson", hex: "#9E2B2B" }, { k: "red", hex: "#BF3A2B" },
  { k: "rust", hex: "#A85332" }, { k: "terracotta", hex: "#C97B5A" }, { k: "burnt orange", hex: "#B5641F" },
  { k: "orange", hex: "#D4832F" }, { k: "amber", hex: "#D9A441" }, { k: "mustard", hex: "#C9A227" },
  { k: "gold", hex: "#C7B037" }, { k: "pale yellow", hex: "#DDD08A" }, { k: "olive", hex: "#7A8248" },
  { k: "moss", hex: "#5D7248" }, { k: "forest", hex: "#2F4F32" }, { k: "green", hex: "#4E8A52" },
  { k: "sage", hex: "#93AE8C" }, { k: "mint", hex: "#A9CBB0" }, { k: "teal", hex: "#2F7F7B" },
  { k: "seafoam", hex: "#6FAFA8" }, { k: "cyan", hex: "#4FA3B8" }, { k: "navy", hex: "#1F2E4F" },
  { k: "royal blue", hex: "#2E4F9E" }, { k: "blue", hex: "#3A6FB0" }, { k: "slate blue", hex: "#556B8D" },
  { k: "sky", hex: "#7FA9CE" }, { k: "powder blue", hex: "#AEC7DE" }, { k: "indigo", hex: "#3D3A7A" },
  { k: "purple", hex: "#5E3F82" }, { k: "violet", hex: "#7C5BA6" }, { k: "lavender", hex: "#A99BC4" },
  { k: "plum", hex: "#6B3B5C" }, { k: "magenta", hex: "#A03A6E" }, { k: "pink", hex: "#C07A9A" },
  { k: "rose", hex: "#D0A0A8" }, { k: "blush", hex: "#E0BFC2" }, { k: "chocolate", hex: "#4A342A" },
  { k: "brown", hex: "#6B4F3A" }, { k: "tan", hex: "#A98B68" }, { k: "camel", hex: "#C0A175" },
  { k: "cream", hex: "#DCCDAE" }, { k: "ivory", hex: "#E8E0CC" }, { k: "white", hex: "#E9E6DF" },
  { k: "light grey", hex: "#B5B1AA" }, { k: "grey", hex: "#7E7A74" }, { k: "charcoal", hex: "#3A3836" },
  { k: "black", hex: "#1F1E1D" },
];
const colorOf = (k) => SPINE_COLORS.find((c) => c.k === k) || SPINE_COLORS[43];
/* Rendering uses the colour actually seen in the photo; grouping uses the
   nearest palette entry, so a shelf of forty greens still sorts sensibly. */
const spineHex = (b) => (/^#[0-9a-f]{6}$/i.test(b.hex || "") ? b.hex : colorOf(b.color).hex);

function hexToRgb(h) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(h || ""));
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function nearestColor(hex) {
  const t = hexToRgb(hex);
  if (!t) return "grey";
  let best = "grey", bd = Infinity;
  for (const c of SPINE_COLORS) {
    const r = hexToRgb(c.hex);
    const d = (r[0] - t[0]) ** 2 + (r[1] - t[1]) ** 2 + (r[2] - t[2]) ** 2;
    if (d < bd) { bd = d; best = c.k; }
  }
  return best;
}
function hslOf(hex) {
  const rgb = hexToRgb(hex) || [128, 128, 128];
  const [r, g, b] = rgb.map((v) => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  const l = (mx + mn) / 2;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const SUBJECTS = [
  "Classics & Antiquity",
  "Ancient & Medieval History",
  "Modern History",
  "Military & Strategy",
  "Politics & Government",
  "Law & Policy",
  "Economics & Finance",
  "Business & Leadership",
  "Philosophy",
  "Religion & Theology",
  "Psychology & Mind",
  "Language & Linguistics",
  "Literary Criticism",
  "Fiction — Literary",
  "Fiction — Genre",
  "Poetry & Drama",
  "Biography & Memoir",
  "Travel & Place",
  "Science & Nature",
  "Mathematics",
  "Technology & Computing",
  "Medicine & Health",
  "Art & Photography",
  "Architecture & Design",
  "Music & Performance",
  "Food & Drink",
  "Sport & Outdoors",
  "Home & Craft",
  "Education & Student Life",
  "Yearbooks & Annuals",
  "Children & Young Readers",
  "Reference & Atlases",
  "Unsorted",
];

const FORMATS = {
  hardcover: { label: "Hardcover", h: 23.5, w: 3.2 },
  trade: { label: "Trade paperback", h: 20.3, w: 2.0 },
  mass: { label: "Mass market", h: 17.5, w: 1.6 },
  oversize: { label: "Oversize / art", h: 28.5, w: 3.6 },
};

const CATEGORIES = [
  "Electronics", "Jewellery", "Watches", "Art & Prints", "Furniture",
  "Musical", "Optics & Camera", "Tools", "Appliance", "Collectible", "Other",
];

const DEFAULT_CASES = [
  {
    id: "case-1",
    name: "Study bookcase",
    room: "Study",
    cols: 1,
    shelves: [
      { id: "s1", label: "Top", widthCm: 90, heightCm: 32 },
      { id: "s2", label: "Second", widthCm: 90, heightCm: 28 },
      { id: "s3", label: "Third", widthCm: 90, heightCm: 24 },
      { id: "s4", label: "Bottom", widthCm: 90, heightCm: 36 },
    ],
  },
];

/* Interior openings, not carcass size — the carcass number on the box is
   what a room needs, the opening is what a book needs. */
const CASE_CATALOGUE = [
  { id: "kallax-1x1", brand: "IKEA", name: "Kallax 1×1", carcass: "42 × 42 cm", grid: [1, 1], cell: [33, 33] },
  { id: "kallax-2x2", brand: "IKEA", name: "Kallax 2×2", carcass: "77 × 77 cm", grid: [2, 2], cell: [33, 33] },
  { id: "kallax-1x4", brand: "IKEA", name: "Kallax 1×4 (tall)", carcass: "42 × 147 cm", grid: [1, 4], cell: [33, 33] },
  { id: "kallax-2x4", brand: "IKEA", name: "Kallax 2×4", carcass: "77 × 147 cm", grid: [2, 4], cell: [33, 33] },
  { id: "kallax-4x2", brand: "IKEA", name: "Kallax 4×2 (wide)", carcass: "147 × 77 cm", grid: [4, 2], cell: [33, 33] },
  { id: "kallax-4x4", brand: "IKEA", name: "Kallax 4×4", carcass: "147 × 147 cm", grid: [4, 4], cell: [33, 33] },
  { id: "kallax-5x5", brand: "IKEA", name: "Kallax 5×5", carcass: "182 × 182 cm", grid: [5, 5], cell: [33, 33] },
  { id: "billy-80", brand: "IKEA", name: "Billy 80 cm", carcass: "80 × 202 × 28 cm", grid: [1, 6], cell: [76, 26], note: "Five movable shelves plus the fixed top" },
  { id: "billy-40", brand: "IKEA", name: "Billy 40 cm", carcass: "40 × 202 × 28 cm", grid: [1, 6], cell: [36, 26] },
  { id: "billy-80-low", brand: "IKEA", name: "Billy 80 cm low", carcass: "80 × 106 × 28 cm", grid: [1, 3], cell: [76, 30] },
  { id: "billy-height-ext", brand: "IKEA", name: "Billy 80 cm with height extension", carcass: "80 × 237 × 28 cm", grid: [1, 7], cell: [76, 26] },
  { id: "hemnes-90", brand: "IKEA", name: "Hemnes 90 cm", carcass: "90 × 197 × 37 cm", grid: [1, 5], cell: [85, 33] },
  { id: "besta-shelf", brand: "IKEA", name: "Bestå shelf unit", carcass: "60 × 64 × 42 cm", grid: [1, 2], cell: [56, 28] },
  { id: "generic-90", brand: "Generic", name: "Standard 90 cm bookcase", carcass: "90 × 180 cm", grid: [1, 5], cell: [86, 30] },
  { id: "generic-alcove", brand: "Generic", name: "Alcove shelving", carcass: "custom", grid: [1, 4], cell: [100, 30] },
];

const unitWord = (k) => ((k?.cols || 1) > 1 ? "cube" : "shelf");
const unitWordCap = (k) => ((k?.cols || 1) > 1 ? "Cube" : "Shelf");

/* A Kallax 5×5 is five rows of five cubes — twenty-five openings, not five.
   Labels say which row and which cube so the shelf plan matches the object. */
function openingLabel(cols, idx) {
  if ((cols || 1) > 1) return `Row ${Math.floor(idx / cols) + 1} · Cube ${(idx % cols) + 1}`;
  return `Shelf ${idx + 1}`;
}

function caseFromSpec(spec) {
  const [cols, rows] = spec.grid;
  const [w, h] = spec.cell;
  const shelves = [];
  for (let i = 0; i < rows * cols; i++)
    shelves.push({ id: uid(), label: openingLabel(cols, i), widthCm: w, heightCm: h });
  return { id: uid(), name: `${spec.brand} ${spec.name}`, room: "", cols, shelves };
}

async function searchBookcases(query) {
  const { text } = await askClaude(
    `Find real bookcase or shelving products matching "${query}". For each, give the interior opening of one shelf or compartment — the usable space a book sits in — not the external carcass size. ` +
      `Reply with ONLY a minified JSON array of at most 6 objects: [{"b":brand,"n":model and size,"x":carcass size as text,"g":[columns,rows],"c":[openingWidthCm,openingHeightCm]}]`,
    true
  );
  const arr = parseJson(text);
  return (Array.isArray(arr) ? arr : [arr])
    .filter((d) => d && d.c && d.g)
    .map((d) => ({
      id: uid(), brand: d.b || "", name: d.n || "Unnamed", carcass: d.x || "",
      grid: [Number(d.g[0]) || 1, Number(d.g[1]) || 1],
      cell: [Number(d.c[0]) || 76, Number(d.c[1]) || 28],
    }));
}

/* ─────────────────────────  STORAGE  ───────────────────────── */

async function loadKey(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.storage) return fallback;
    const r = await window.storage.get(key, false);
    if (!r || !r.value) return fallback;
    return JSON.parse(r.value);
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    if (typeof window === "undefined" || !window.storage) return false;
    const r = await window.storage.set(key, JSON.stringify(value), false);
    return !!r;
  } catch {
    return false;
  }
}

const uid = () => Math.random().toString(36).slice(2, 10);

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/* ─────────────────────────  CLAUDE CALLS  ───────────────────────── */

async function askClaude(content, useSearch) {
  const body = {
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content }],
  };
  if (useSearch) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "The model returned an error.");
  if (!Array.isArray(data.content)) throw new Error("The model returned no content.");
  const text = data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
  if (!text.trim()) throw new Error("The model returned an empty reply.");
  return { text, truncated: data.stop_reason === "max_tokens" };
}

function parseJson(text) {
  const clean = String(text || "").replace(/```json|```/g, "").trim();
  const start = clean.search(/[[{]/);
  if (start < 0) throw new Error("The reply contained no data — try a clearer photo.");
  const end = Math.max(clean.lastIndexOf("]"), clean.lastIndexOf("}"));
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    // Reply was cut off mid-array. Keep every object that did close.
    const objs = clean.match(/\{[^{}]*\}/g) || [];
    const salvaged = objs.map((o) => { try { return JSON.parse(o); } catch { return null; } }).filter(Boolean);
    if (!salvaged.length) throw new Error("The reply came back malformed.");
    return salvaged;
  }
}

const FMT_CODE = { h: "hardcover", t: "trade", m: "mass", o: "oversize" };

const COMPACT_SPEC =
  `Object shape, keys exactly: {"t":title,"a":author,"y":year or null,"p":pages or null,` +
  `"f":"h"|"t"|"m"|"o" (hardcover/trade paperback/mass market/oversize),` +
  `"c":dominant spine colour as a "#rrggbb" hex value sampled from the image,` +
  `"s":short subject phrase such as "roman history" or "school yearbook",` +
  `"u":1 only if you cannot identify the book,"x":locator string, required when u is 1}`;

function expandBook(d = {}) {
  const compact = ["t", "a", "f", "c", "u", "x"].some((k) => k in d);
  const b = compact
    ? normaliseBook({
        title: d.t, author: d.a, year: d.y, pages: d.p,
        format: FMT_CODE[d.f] || "trade", hex: d.c,
        subject: d.s ? bucketSubject([d.s]) : "Unsorted", isbn: d.i,
        keywords: d.s ? [String(d.s).toLowerCase()] : undefined,
      })
    : normaliseBook(d);
  if (compact && d.u) {
    b.needsReview = true;
    b.title = "";
    b.where = d.x || "position not recorded";
  } else if (compact && d.x) {
    b.where = d.x;
  }
  return b;
}

async function readShelfPhoto(b64, mediaType, maxBooks = 14) {
  const { text, truncated } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text:
          `Photograph of books — a shelf, a stack, a single cover, or a barcode. ` +
          `Return one object for every physical book you can SEE, in order from left to right, including books whose title you cannot make out. ` +
          `For a book you cannot identify, set "u":1, leave "t" empty, and write "x" as a locator someone standing at the shelf could act on: ` +
          `its position counted from the left, its colour, its height against its neighbours, and any legible fragment, symbol or damage. ` +
          `Example locator: "7th from left, tall dark green cloth, gold band at foot, no lettering visible". ` +
          `For a book you do identify, fill author, year and page count from your knowledge of the real edition where you are confident, null where not; omit "u" and "x". ` +
          `Colour is what the spine actually looks like in this image. Return at most ${maxBooks} books. ` +
          `Reply with ONLY a minified JSON array — no prose, no fences. ${COMPACT_SPEC}`,
      },
    ],
    false
  );
  const raw = parseJson(text);
  const list = (Array.isArray(raw) ? raw : [raw]).map(expandBook);
  return { list, truncated };
}

/* The establishing shot. Not for reading titles — for reading structure,
   so the shelf photos that follow have somewhere to land. */
async function readBookcasePhoto(b64, mediaType) {
  const { text } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text:
          `Photograph of a whole bookcase. Do not read individual titles. Describe the structure only, counting rows from the top. ` +
          `If it is a cube unit like an IKEA Kallax, set "cols" to the number of columns and return one entry in "s" per ROW, not per cube — a 5×5 Kallax is cols 5 with 5 row entries. ` +
          `For an ordinary bookcase set "cols" to 1 and return one entry per shelf. ` +
          `Estimate each shelf's clear height and the usable width in centimetres from the proportions of the books, assuming a typical hardcover is 24 cm tall. ` +
          `Reply with ONLY a minified JSON object: ` +
          `{"cols":number of columns,"w":usable width cm of ONE opening,"s":[{"n":row number,"c":approximate book count in that whole row,"h":clear height cm,"d":"short description of what sits there, e.g. tall art books, mostly cream spines"}]}`,
      },
    ],
    false
  );
  const d = parseJson(text);
  const shelves = (Array.isArray(d?.s) ? d.s : []).map((x, i) => ({
    n: Number(x.n) || i + 1,
    count: Number(x.c) || 0,
    heightCm: Math.min(Math.max(Number(x.h) || 30, 16), 60),
    note: String(x.d || "").slice(0, 90),
  }));
  return { cols: Math.max(1, Number(d?.cols) || 1), widthCm: Math.min(Math.max(Number(d?.w) || 80, 25), 240), shelves };
}

/* One book, from its barcode or its cover. The barcode is the better path:
   if the digits are legible we go straight to an authoritative lookup. */
async function identifyFromPhoto(b64, mediaType) {
  const { text } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text:
          `A single book — its cover, its title page, or the barcode on the back. ` +
          `If an ISBN or EAN barcode is visible, read the digits exactly and put them in "i" as a plain digit string; never guess digits you cannot see. ` +
          `Otherwise read the cover. Reply with ONLY a minified JSON object. ${COMPACT_SPEC}, plus "i":isbn digits or null`,
      },
    ],
    false
  );
  let d = expandBook(parseJson(text));
  if (d.isbn && d.isbn.replace(/\D/g, "").length >= 10) {
    try {
      const auth = await lookupIsbn(d.isbn.replace(/[^0-9Xx]/g, ""));
      d = { ...d, ...normaliseBook({ ...auth, isbn: d.isbn, hex: d.hex, color: d.color }) };
    } catch {
      /* keep what the cover gave us */
    }
  }
  return d;
}

async function lookupIsbn(isbn) {
  if (await netOk()) try {
    const r = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    );
    const j = await r.json();
    const d = j[`ISBN:${isbn}`];
    if (d) {
      return {
        title: d.title,
        author: (d.authors || []).map((a) => a.name).join(", "),
        year: parseInt(String(d.publish_date || "").match(/\d{4}/)?.[0] || "") || null,
        pages: d.number_of_pages || null,
        subject: bucketSubject((d.subjects || []).map((s) => s.name)),
        format: /hardcover/i.test(d.physical_format || "") ? "hardcover" : "trade",
      };
    }
  } catch {
    /* fall through to Claude */
  }
  const { text } = await askClaude(
    `Look up the book with ISBN ${isbn}. Reply with ONLY a minified JSON object, no prose. ${COMPACT_SPEC}`,
    true
  );
  return expandBook(parseJson(text));
}

async function readValuablePhoto(b64, mediaType) {
  const { text: txt } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text: `This is a photograph of a household possession being catalogued for insurance. Reply with ONLY a JSON object, no prose: {"name":string,"brand":string|null,"model":string|null,"serial":string|null,"category":one of ${CATEGORIES.map((c) => `"${c}"`).join("|")},"estValue":number|null,"notes":string}. Put the serial number only if it is actually legible in the image — never guess one. estValue is a replacement cost in euros, your best estimate for the item as shown.`,
      },
    ],
    false
  );
  return parseJson(txt);
}

const OL_FIELDS = "key,title,author_name,first_publish_year,number_of_pages_median,cover_i,subject,isbn";

/* Three outcomes, not two. Open Library answers a missing cover with a blank
   1x1 rather than a 404, so "loaded but blank" proves images are allowed
   while telling us this particular edition has no art. */
function probeImage(url) {
  return new Promise((res) => {
    const i = new Image();
    let done = false;
    const finish = (r) => { if (!done) { done = true; res(r); } };
    i.onload = () => finish({ status: i.naturalWidth > 10 ? "ok" : "blank", w: i.naturalWidth });
    i.onerror = () => finish({ status: "error" });
    i.src = url;
    setTimeout(() => finish({ status: "timeout" }), 7000);
  });
}
const imageExists = async (url) => (await probeImage(url)).status === "ok";

/* Whether this sandbox can reach third-party APIs at all. Worked out once and
   remembered — with 800 books, retrying a blocked fetch each time is minutes
   of nothing. */
let NET = null;
async function netOk() {
  if (NET !== null) return NET;
  try {
    const r = await fetch("https://openlibrary.org/search.json?title=dune&limit=1&fields=key");
    await r.json();
    NET = true;
  } catch { NET = false; }
  return NET;
}

async function googleBooks(b, isbn) {
  const q = isbn
    ? `isbn:${encodeURIComponent(isbn)}`
    : `intitle:${encodeURIComponent(b.title || "")}${b.author ? `+inauthor:${encodeURIComponent(b.author)}` : ""}`;
  const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=1`);
  return (await r.json())?.items?.[0]?.volumeInfo || null;
}

/* Asking Claude for the cover id instead of fetching it. This matters when
   the sandbox blocks outbound requests to third-party APIs but still allows
   images to load — different CSP directives, so one can work without the
   other. api.anthropic.com is always reachable from here. */
async function enrichViaClaude(b) {
  const { text } = await askClaude(
    `The book "${b.title}"${b.author ? ` by ${b.author}` : ""}${b.isbn ? ` (ISBN ${b.isbn})` : ""}. ` +
      `Reply with ONLY a minified JSON object: ` +
      `{"cover":Open Library numeric cover id or null,"isbns":[up to 3 real 13-digit ISBNs for editions of this book],` +
      `"gb":Google Books volume id or null,"y":first publication year or null,"p":typical page count or null,` +
      `"k":[6 lowercase subject keywords a cataloguer would assign],` +
      `"s":"a three-sentence synopsis: what it covers, how it approaches the material, who it is for"}. ` +
      `Never invent an id or an ISBN — null and an empty list are correct when you are not sure. ` +
      `If you do not recognise this book at all, reply {"unknown":1}.`,
    true
  );
  const d = parseJson(text);
  if (!d || d.unknown) return null;
  return {
    cover: Number(d.cover) || null,
    isbns: (Array.isArray(d.isbns) ? d.isbns : []).map((x) => String(x).replace(/\D/g, "")).filter((x) => x.length >= 10).slice(0, 3),
    gb: d.gb ? String(d.gb).slice(0, 24) : null,
    year: Number(d.y) || null,
    pages: Number(d.p) || null,
    keywords: (Array.isArray(d.k) ? d.k : []).map((x) => String(x).toLowerCase()).slice(0, 8),
    summary: String(d.s || "").slice(0, 900),
  };
}

/* Candidate URLs in order of reliability, each tried until one returns real
   pixels. A blank or a 404 costs one image load, not a whole book. */
function coverCandidates({ cover, isbns = [], gb }, existingIsbn) {
  const urls = [];
  if (cover) urls.push(`https://covers.openlibrary.org/b/id/${cover}-M.jpg`);
  for (const i of [existingIsbn, ...isbns].filter(Boolean))
    urls.push(`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(i)}-M.jpg?default=false`);
  if (gb) urls.push(`https://books.google.com/books/content?id=${encodeURIComponent(gb)}&printsec=frontcover&img=1&zoom=1`);
  return [...new Set(urls)];
}

async function pickCover(urls) {
  for (const u of urls) {
    const r = await probeImage(u);
    if (r.status === "ok") return u;
    if (r.status === "error" && u.includes("default=false")) continue; // no cover for that edition
  }
  return null;
}

/* Direct lookups first when the network allows them, otherwise straight to
   the model — which is reachable from here regardless. */
async function findCover(b, doc) {
  let d = doc;
  if (!d && (await netOk())) {
    try {
      const p = new URLSearchParams({ limit: "1", fields: OL_FIELDS });
      if (b.isbn) p.set("isbn", b.isbn); else { p.set("title", b.title || ""); if (b.author) p.set("author", b.author); }
      const r = await fetch(`https://openlibrary.org/search.json?${p.toString()}`);
      d = (await r.json()).docs?.[0] || null;
    } catch { d = null; }
  }
  const direct = [];
  if (d?.cover_i) direct.push(`https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg`);
  const isbn = b.isbn || d?.isbn?.[0];
  if (isbn) direct.push(`https://covers.openlibrary.org/b/isbn/${encodeURIComponent(isbn)}-M.jpg?default=false`);
  const hit = await pickCover(direct);
  if (hit) return { url: hit, isbn: isbn || null };

  const c = await enrichViaClaude(b);
  if (!c) return null;
  const url = await pickCover(coverCandidates(c, isbn));
  return url ? { url, isbn: isbn || c.isbns[0] || null, meta: c } : null;
}

/* Which channels actually work from inside this sandbox. Guesswork about CSP
   is worthless; this reports what happened, and distinguishes a blocked image
   from an edition that simply has no cover art. */
async function probeSources(sample) {
  const out = [];
  const net = await netOk();
  out.push({ name: "Open Library search", ok: net, detail: net ? "reachable" : "blocked from this sandbox" });
  let gb = false;
  try { const r = await fetch("https://www.googleapis.com/books/v1/volumes?q=isbn:9780441013593&maxResults=1"); await r.json(); gb = true; } catch { gb = false; }
  out.push({ name: "Google Books", ok: gb, detail: gb ? "reachable" : "blocked from this sandbox" });

  // Does anything from this host render at all? A known-good Open Library
  // cover id answers that on its own, separately from any of your books.
  const control = await probeImage("https://covers.openlibrary.org/b/id/240727-M.jpg");
  const imagesWork = control.status === "ok" || control.status === "blank";
  out.push({
    name: "Images from covers.openlibrary.org",
    ok: imagesWork,
    detail: control.status === "ok" ? `loading fine (${control.w}px test image)`
      : control.status === "blank" ? "reachable, test image was blank"
      : control.status === "timeout" ? "timed out" : "blocked — no image from that host will render",
  });

  let url = null;
  if (sample) {
    const c = await findCover(sample);
    url = c?.url || null;
    out.push({ name: `Cover found for “${sample.title}”`, ok: !!url, detail: url || "no source produced one that renders" });
  }
  return { out, url, imagesWork };
}

function olDescription(d) {
  const v = d?.description ?? d?.excerpts?.[0]?.excerpt;
  const t = typeof v === "object" ? v?.value : v;
  if (!t) return "";
  return String(t).split(/\n\s*-{2,}|\r?\n\r?\n\[/)[0].replace(/\s*\(\[source\].*$/i, "").trim().slice(0, 900);
}

async function fetchSummary(b) {
  const online = await netOk();
  if (b.workKey && online) {
    try {
      const r = await fetch(`https://openlibrary.org${b.workKey}.json`);
      const text = olDescription(await r.json());
      if (text && text.length > 60) return { summary: text, summarySource: "Open Library" };
    } catch {
      /* try the model instead */
    }
  }
  if (online) {
    try {
      const v = await googleBooks(b, b.isbn);
      const t = String(v?.description || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      if (t.length > 60) return { summary: t.slice(0, 900), summarySource: "Google Books" };
    } catch {
      /* fall through to the model */
    }
  }
  try {
    const { text } = await askClaude(
      `Write a three-sentence synopsis of the book "${b.title}"${b.author ? ` by ${b.author}` : ""}: what it covers, how it approaches the material, and who it is for. ` +
        `If you are not confident this book exists as described, reply with exactly: UNKNOWN. No preamble either way.`,
      true
    );
    const t = text.trim();
    if (t && !/^unknown/i.test(t)) return { summary: t.slice(0, 900), summarySource: "Looked up" };
  } catch {
    /* leave empty; the button can be pressed again */
  }
  return {};
}

function cleanKeywords(list) {
  const seen = new Set();
  const out = [];
  for (const s of list || []) {
    const k = String(s).trim().toLowerCase();
    if (!k || k.length > 34 || /[(){}\[\]<>]|--|^\d+$/.test(k)) continue;
    if (/accessible book|protected daisy|in library|internal-pdf|overdrive|large type|reading level/.test(k)) continue;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length >= 10) break;
  }
  return out;
}

/* Cover art and subject headings for one book. Open Library first — its
   headings are cataloguer-written, which beats anything invented. */
async function enrichBook(b) {
  const out = { enriched: true };
  const online = await netOk();
  let d = null;
  if (online) {
    try {
      if (b.isbn) {
        const r = await fetch(`https://openlibrary.org/search.json?isbn=${encodeURIComponent(b.isbn)}&limit=1&fields=${OL_FIELDS}`);
        d = (await r.json()).docs?.[0] || null;
      }
      if (!d && b.title) {
        const p = new URLSearchParams({ title: b.title, limit: "1", fields: OL_FIELDS });
        if (b.author) p.set("author", b.author);
        const r = await fetch(`https://openlibrary.org/search.json?${p.toString()}`);
        d = (await r.json()).docs?.[0] || null;
      }
    } catch { d = null; }
  }

  if (d) {
    if (d.key) out.workKey = d.key;
    if (!b.author && d.author_name?.length) out.author = d.author_name.join(", ");
    if (!b.year && d.first_publish_year) out.year = d.first_publish_year;
    if (!b.pages && d.number_of_pages_median) out.pages = d.number_of_pages_median;
    if (!b.isbn && d.isbn?.length) out.isbn = d.isbn[0];
    const kw = cleanKeywords([...(b.keywords || []), ...(d.subject || [])]);
    if (kw.length) out.keywords = kw;
    if ((!b.subject || b.subject === "Unsorted") && d.subject) out.subject = bucketSubject(d.subject);
    const url = await pickCover([
      d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : null,
      (b.isbn || d.isbn?.[0]) ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(b.isbn || d.isbn[0])}-M.jpg?default=false` : null,
    ].filter(Boolean));
    if (url) out.coverUrl = url;
  }

  // One call covers cover, ISBNs, keywords and synopsis together — three
  // round trips per book was the slow part when the direct APIs are blocked.
  const needs = !out.coverUrl || !out.keywords || (!b.summary && !out.summary);
  if (needs) {
    const c = await enrichViaClaude({ ...b, ...out });
    if (c) {
      if (!out.keywords && c.keywords.length) out.keywords = c.keywords;
      if (!b.summary && c.summary.length > 60) { out.summary = c.summary; out.summarySource = "Looked up"; }
      if (!out.year && c.year) out.year = c.year;
      if (!out.pages && c.pages) out.pages = c.pages;
      if (!b.isbn && !out.isbn && c.isbns[0]) out.isbn = c.isbns[0];
      if (!out.coverUrl) {
        const url = await pickCover(coverCandidates(c, b.isbn || out.isbn));
        if (url) out.coverUrl = url;
      }
    }
  }

  if (!b.summary && !out.summary) Object.assign(out, await fetchSummary({ ...b, ...out }));
  return out;
}

function matchesQuery(b, q) {
  const hay = [b.title, b.author, b.subject, b.where, b.summary, ...(b.keywords || [])].join(" ").toLowerCase();
  return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
}
function bucketSubject(list) {
  const s = (list || []).join(" ").toLowerCase();
  const map = [
    ["Yearbooks & Annuals", /yearbook|school annual|class of 19|class of 20|alumni annual/],
    ["Classics & Antiquity", /rome|roman|latin|ancient greek|antiquity|classical|caesar|cicero|homer|virgil/],
    ["Military & Strategy", /military|warfare|strategy|army|naval|battle|defen[cs]e|insurgen|clausewitz/],
    ["Ancient & Medieval History", /medieval|middle ages|byzantine|crusade|mesopotam|egyptolog|prehistor/],
    ["Modern History", /history|historical|century|empire|revolution|world war|cold war/],
    ["Politics & Government", /politic|government|democracy|diplomacy|foreign relations|public administration/],
    ["Law & Policy", /law|legal|jurisprudence|constitution|treaty|regulation/],
    ["Economics & Finance", /economic|finance|investment|monetary|trade|market/],
    ["Business & Leadership", /business|management|leadership|entrepreneur|organi[sz]ational|project management/],
    ["Philosophy", /philosoph|ethic|stoic|metaphys|epistem|logic/],
    ["Religion & Theology", /religio|theolog|bible|christian|islam|judaism|buddhis|spiritual/],
    ["Psychology & Mind", /psycholog|cognitive|behaviou?r|consciousness|neuroscience/],
    ["Language & Linguistics", /language|grammar|linguist|dictionary|italian|german|vocabulary|phrasebook/],
    ["Literary Criticism", /criticism|literary theory|literature--history/],
    ["Poetry & Drama", /poetry|poems|drama|plays|verse|sonnet/],
    ["Fiction — Genre", /mystery|thriller|science fiction|fantasy|romance|crime fiction|espionage|horror/],
    ["Fiction — Literary", /fiction|novel|short stories/],
    ["Biography & Memoir", /biograph|memoir|autobiograph|letters|diaries|correspondence/],
    ["Travel & Place", /travel|guidebook|geography|voyage|description and travel/],
    ["Mathematics", /mathematic|algebra|geometry|statistic|calculus|probability/],
    ["Technology & Computing", /computer|software|data|informatics|programming|algorithm|engineering|technolog|cyber|artificial intelligence/],
    ["Medicine & Health", /medicine|medical|health|anatomy|nutrition|surgery|disease/],
    ["Science & Nature", /science|physic|biolog|chemistry|nature|astronom|geolog|ecolog|botan/],
    ["Art & Photography", /art|painting|photograph|sculpture|drawing|museum/],
    ["Architecture & Design", /architect|interior design|typography|graphic design|urban/],
    ["Music & Performance", /music|opera|composer|theatre|theater|dance|film/],
    ["Food & Drink", /cook|recipe|cuisine|wine|baking|gastronom|food/],
    ["Sport & Outdoors", /sport|athlet|climbing|hiking|running|cycling|fitness|training/],
    ["Home & Craft", /gardening|woodwork|knitting|needlework|home improvement|craft|handicraft/],
    ["Education & Student Life", /education|teaching|school|university|students|pedagog|curriculum/],
    ["Children & Young Readers", /juvenile|children|picture book|young adult/],
    ["Reference & Atlases", /reference|handbook|manual|encyclop|atlas|almanac/],
  ];
  for (const [bucket, re] of map) if (re.test(s)) return bucket;
  return "Unsorted";
}

/* Free-text subjects get mapped to a shelf bucket. The library heading is
   shown alongside so the suggestion can be judged, not just accepted. */
const SUBJECT_SYNONYMS = [
  { re: /yearbook|school annual|class book/, bucket: "Yearbooks & Annuals", heading: "School yearbooks (LCSH, class LB3621)" },
  { re: /college annual|university yearbook/, bucket: "Yearbooks & Annuals", heading: "College yearbooks (LCSH, class LB3621.67)" },
  { re: /cookbook|recipes|cooking/, bucket: "Food & Drink", heading: "Cooking (LCSH)" },
  { re: /war college|doctrine|tactics/, bucket: "Military & Strategy", heading: "Military art and science (LCSH)" },
  { re: /coding|programming|software/, bucket: "Technology & Computing", heading: "Computer programming (LCSH)" },
  { re: /self.?help|productivity/, bucket: "Psychology & Mind", heading: "Self-actualization (Psychology) (LCSH)" },
  { re: /coffee table|photo book/, bucket: "Art & Photography", heading: "Photography (LCSH)" },
  { re: /textbook|coursebook/, bucket: "Education & Student Life", heading: "Textbooks (LCSH)" },
];

async function suggestSubject(raw) {
  const q = String(raw || "").trim();
  if (!q) return null;
  const exact = SUBJECTS.find((s) => s.toLowerCase() === q.toLowerCase());
  if (exact) return { bucket: exact, heading: null, source: "exact" };
  for (const s of SUBJECT_SYNONYMS)
    if (s.re.test(q.toLowerCase())) return { bucket: s.bucket, heading: s.heading, source: "built-in" };
  const guess = bucketSubject([q]);
  if (guess !== "Unsorted") return { bucket: guess, heading: null, source: "matched" };
  try {
    const { text } = await askClaude(
      `A home library uses these shelf categories: ${SUBJECTS.slice(0, -1).join("; ")}. ` +
        `Someone typed the subject "${q}". Which single category fits best, and what is the authorised Library of Congress subject heading for it? ` +
        `Reply with ONLY a minified JSON object: {"b":one of the categories exactly as written,"h":the LC heading with its class letters if you know them}`,
      true
    );
    const d = parseJson(text);
    if (d && SUBJECTS.includes(d.b)) return { bucket: d.b, heading: d.h || null, source: "looked up" };
  } catch {
    /* fall through — the typed value is kept as-is */
  }
  return null;
}

/* ─────────────────────────  GEOMETRY  ───────────────────────── */

function spineCm(b) {
  if (b.spineCm) return b.spineCm;
  const f = FORMATS[b.format] || FORMATS.trade;
  if (b.pages) return Math.round((b.pages * 0.0055 + (b.format === "hardcover" ? 0.7 : 0.3)) * 10) / 10;
  return f.w;
}
function heightCm(b) {
  if (b.heightCm) return b.heightCm;
  return (FORMATS[b.format] || FORMATS.trade).h;
}

/* ─────────────────────────  ARRANGEMENT ENGINE  ───────────────────────── */

const METHODS = {
  designer: { label: "Designed for looks", blurb: "A programme per shelf — what goes where and why, weighted for how the case reads across the room rather than how fast you find a title." },
  current: { label: "Current arrangement", blurb: "What's actually on the shelf. Once you've recorded a layout this is your baseline; before that, it's capture order — one photo per shelf, left to right, as you shot them." },
  subject: { label: "By subject", blurb: "Grouped by theme, alphabetical by author inside each group. The way you'll actually find a book." },
  color: { label: "By colour", blurb: "One continuous spectrum across every shelf, neutrals bookending the runs." },
  height: { label: "By height", blurb: "Tall to short, left to right. Reads as calm; costs you findability." },
  author: { label: "By author", blurb: "Straight A–Z across the whole case." },
  hybrid: { label: "Subject blocks, colour inside", blurb: "Findable and photogenic. Subjects stay together; each block runs its own gradient." },
};

function subjectOrder(books) {
  const extra = [...new Set(books.map((b) => b.subject).filter((s) => s && !SUBJECTS.includes(s)))].sort();
  const list = [...SUBJECTS.slice(0, -1), ...extra, "Unsorted"];
  return (s) => {
    const i = list.indexOf(s);
    return i < 0 ? list.length : i;
  };
}

function sortBooks(books, method) {
  const bs = [...books];
  const byAuthor = (a, b) => (a.author || "zz").localeCompare(b.author || "zz");
  const ord = subjectOrder(books);
  // Neutrals have no meaningful hue, so they run as a lightness ramp after
  // the spectrum rather than landing arbitrarily inside it.
  const hueKey = (b) => {
    const { h, s, l } = hslOf(spineHex(b));
    return s < 0.15 ? 1000 + l * 100 : h;
  };
  const shadeKey = (b) => hslOf(spineHex(b)).l;
  if (method === "author") return bs.sort(byAuthor);
  if (method === "height") return bs.sort((a, b) => heightCm(b) - heightCm(a));
  if (method === "color") return bs.sort((a, b) => hueKey(a) - hueKey(b) || shadeKey(a) - shadeKey(b));
  if (method === "subject")
    return bs.sort((a, b) => ord(a.subject) - ord(b.subject) || byAuthor(a, b));
  return bs.sort((a, b) => ord(a.subject) - ord(b.subject) || hueKey(a) - hueKey(b) || shadeKey(a) - shadeKey(b));
}


/* The design pass sends the shape of the collection, never the whole list —
   distributions fit in a prompt where 800 titles would not. It comes back with
   a programme per shelf, which a local packer then executes. */
const SHELF_RULES = ["height-desc", "height-asc", "colour-spectrum", "colour-warm", "colour-cool", "colour-dark", "colour-light", "subject", "mixed"];

async function designShelves(books, kase) {
  const subj = {};
  books.forEach((b) => { subj[b.subject] = (subj[b.subject] || 0) + 1; });
  const hue = { warm: 0, cool: 0, neutral: 0 };
  books.forEach((b) => {
    const { h, s: sat } = hslOf(spineHex(b));
    if (sat < 0.15) hue.neutral++;
    else if (h < 70 || h > 320) hue.warm++;
    else hue.cool++;
  });
  const heights = books.map(heightCm).sort((a, z) => a - z);
  const shelves = kase.shelves.map((sh, i) => `${i + 1}:${sh.label} ${sh.widthCm}×${sh.heightCm}cm`).join("; ");

  const { text } = await askClaude(
    `You are arranging a home bookcase for looks as much as use. The case has ${kase.shelves.length} openings: ${shelves}. ` +
      `The collection: ${books.length} books. Subjects: ${Object.entries(subj).sort((a, z) => z[1] - a[1]).slice(0, 10).map(([k, v]) => `${k} ${v}`).join(", ")}. ` +
      `Spine colours: ${hue.warm} warm, ${hue.cool} cool, ${hue.neutral} neutral. Heights from ${heights[0] || 0} to ${heights[heights.length - 1] || 0} cm. ` +
      `Give each opening a programme. Available rules: ${SHELF_RULES.join(", ")}. Use "subject" only with a subject name in "s". ` +
      `Think about weight low and light high, where the eye rests, breaks between dense runs, and leaving room for objects. ` +
      `Reply with ONLY minified JSON: {"p":"one sentence on the overall principle","sh":[{"n":opening number,"r":rule,"s":subject name or null,"note":"one short line on why","gap":cm to leave free for objects or 0}],"tips":["two or three short practical notes"]}`,
    false
  );
  const d = parseJson(text);
  return {
    principle: String(d?.p || "").slice(0, 220),
    tips: (Array.isArray(d?.tips) ? d.tips : []).slice(0, 4).map((t) => String(t).slice(0, 160)),
    shelves: (Array.isArray(d?.sh) ? d.sh : []).map((x, i) => ({
      n: Number(x.n) || i + 1,
      rule: SHELF_RULES.includes(x.r) ? x.r : "mixed",
      subject: x.s || null,
      note: String(x.note || "").slice(0, 120),
      gap: Math.max(0, Math.min(Number(x.gap) || 0, 40)),
    })),
  };
}

function applyDesign(books, kase, design) {
  const shelves = kase.shelves.map((s) => ({ ...s, books: [], usedCm: 0 }));
  const pool = [...books];
  const warmth = (b) => { const { h, s } = hslOf(spineHex(b)); return s < 0.15 ? 2 : h < 70 || h > 320 ? 0 : 1; };
  const light = (b) => hslOf(spineHex(b)).l;

  const take = (prog, sh) => {
    let cands = pool;
    if (prog.rule === "subject" && prog.subject) {
      const m = pool.filter((b) => b.subject === prog.subject);
      if (m.length) cands = m;
    } else if (prog.rule === "colour-warm") cands = pool.filter((b) => warmth(b) === 0).length ? pool.filter((b) => warmth(b) === 0) : pool;
    else if (prog.rule === "colour-cool") cands = pool.filter((b) => warmth(b) === 1).length ? pool.filter((b) => warmth(b) === 1) : pool;
    else if (prog.rule === "colour-dark") cands = pool.filter((b) => light(b) < 0.45).length ? pool.filter((b) => light(b) < 0.45) : pool;
    else if (prog.rule === "colour-light") cands = pool.filter((b) => light(b) >= 0.45).length ? pool.filter((b) => light(b) >= 0.45) : pool;

    const sorted = [...cands].sort((a, z) => {
      if (prog.rule === "height-desc") return heightCm(z) - heightCm(a);
      if (prog.rule === "height-asc") return heightCm(a) - heightCm(z);
      if (prog.rule.startsWith("colour")) {
        const ha = hslOf(spineHex(a)), hz = hslOf(spineHex(z));
        const ka = ha.s < 0.15 ? 1000 + ha.l * 100 : ha.h;
        const kz = hz.s < 0.15 ? 1000 + hz.l * 100 : hz.h;
        return ka - kz || ha.l - hz.l;
      }
      return (a.author || "zz").localeCompare(z.author || "zz");
    });

    const budget = sh.widthCm - (prog.gap || 0);
    for (const b of sorted) {
      if (heightCm(b) > sh.heightCm - 1) continue;
      if (sh.usedCm + spineCm(b) > budget) continue;
      sh.books.push(b);
      sh.usedCm += spineCm(b);
      pool.splice(pool.indexOf(b), 1);
    }
  };

  shelves.forEach((sh, i) => take(design.shelves.find((x) => x.n === i + 1) || { rule: "mixed", gap: 0 }, sh));
  // Anything the programmes left over goes wherever it fits.
  const unplaced = [];
  for (const b of pool) {
    const sh = shelves.find((x) => heightCm(b) <= x.heightCm - 1 && x.usedCm + spineCm(b) <= x.widthCm);
    if (sh) { sh.books.push(b); sh.usedCm += spineCm(b); }
    else unplaced.push({ ...b, reason: "no room left" });
  }
  return { shelves, unplaced, source: "designer" };
}

/* The shelf as it actually stands: a recorded baseline if there is one,
   otherwise the order the photos were taken in — each shot treated as one
   shelf, which is how people photograph a bookcase. */
function arrangeCurrent(books, kase) {
  const shelves = kase.shelves.map((s) => ({ ...s, books: [], usedCm: 0 }));
  const unplaced = [];
  const mine = books.filter((b) => b.placement?.caseId === kase.id);

  if (mine.length) {
    for (const b of [...mine].sort((a, z) => (a.placement.pos ?? 0) - (z.placement.pos ?? 0))) {
      const sh = shelves.find((s) => s.id === b.placement.shelfId);
      if (!sh) { unplaced.push({ ...b, reason: "its shelf no longer exists" }); continue; }
      sh.books.push(b);
      sh.usedCm += spineCm(b);
    }
    for (const b of books) if (b.placement?.caseId !== kase.id) unplaced.push({ ...b, reason: "not placed on this case" });
    return { shelves, unplaced, source: "baseline" };
  }

  const batches = new Map();
  for (const b of books) {
    const key = b.cap?.t ?? 0;
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(b);
  }
  let si = 0;
  for (const key of [...batches.keys()].sort((a, z) => a - z)) {
    const run = batches.get(key).sort((a, z) => (a.cap?.i ?? 0) - (z.cap?.i ?? 0));
    const tagged = run[0]?.shelfIdx;
    if (tagged && tagged <= shelves.length) si = tagged - 1;      // photographed shelf
    else if (si < shelves.length && shelves[si].books.length) si++; // one photo, one shelf
    for (const b of run) {
      let placed = false;
      for (let k = si; k < shelves.length; k++) {
        if (shelves[k].usedCm + spineCm(b) > shelves[k].widthCm) continue;
        shelves[k].books.push(b);
        shelves[k].usedCm += spineCm(b);
        si = k;
        placed = true;
        break;
      }
      if (!placed) unplaced.push({ ...b, reason: "no room left" });
    }
  }
  return { shelves, unplaced, source: "capture" };
}

function arrange(books, kase, method, design) {
  if (method === "current") return arrangeCurrent(books, kase);
  if (method === "designer") return design ? applyDesign(books, kase, design) : { shelves: kase.shelves.map((s) => ({ ...s, books: [], usedCm: 0 })), unplaced: [], source: "designer-empty" };
  const ordered = sortBooks(books, method);
  const shelves = kase.shelves.map((s) => ({ ...s, books: [], usedCm: 0 }));
  const unplaced = [];
  const keepBlocks = method === "subject" || method === "hybrid";
  let si = 0;

  const blocks = [];
  if (keepBlocks) {
    let cur = null;
    for (const b of ordered) {
      const key = b.subject || "Unsorted";
      if (!cur || cur.key !== key) { cur = { key, books: [] }; blocks.push(cur); }
      cur.books.push(b);
    }
  } else {
    blocks.push({ key: null, books: ordered });
  }

  for (const block of blocks) {
    const blockCm = block.books.reduce((n, b) => n + spineCm(b), 0);
    // Start a fresh shelf for a block that would be badly split
    if (keepBlocks && si < shelves.length) {
      const left = shelves[si].widthCm - shelves[si].usedCm;
      const fitsWhole = blockCm <= shelves[si].widthCm;
      if (fitsWhole && left < blockCm && left < shelves[si].widthCm * 0.9 && si + 1 < shelves.length) si++;
    }
    for (const b of block.books) {
      const w = spineCm(b);
      const h = heightCm(b);
      let placed = false;
      for (let k = si; k < shelves.length; k++) {
        const sh = shelves[k];
        if (h > sh.heightCm - 1) continue;
        if (sh.usedCm + w > sh.widthCm) continue;
        sh.books.push(b);
        sh.usedCm += w;
        si = k;
        placed = true;
        break;
      }
      if (!placed) unplaced.push({ ...b, reason: h > Math.max(...kase.shelves.map((s) => s.heightCm)) - 1 ? "too tall" : "no room" });
    }
  }
  return { shelves, unplaced };
}


/* ═══════════════════════  CELLAR  ═══════════════════════ */

const DRINK_KINDS = [
  "Wine — Red", "Wine — White", "Wine — Rosé", "Wine — Sparkling", "Wine — Fortified",
  "Whisky", "Gin", "Rum", "Tequila & Mezcal", "Brandy & Cognac", "Vodka",
  "Liqueur", "Vermouth & Aperitif", "Beer & Cider", "Sake", "Other",
];
const isWine = (k) => String(k || "").startsWith("Wine");

/* Coordinates for the places drink labels actually name. Region first, then
   country as a fallback, so an unrecognised appellation still lands somewhere
   defensible instead of nowhere. */
const REGION_COORDS = {
  bordeaux: [44.8, -0.6], burgundy: [47.0, 4.8], bourgogne: [47.0, 4.8], champagne: [49.1, 4.0],
  loire: [47.4, 0.7], rhone: [44.9, 4.9], "côtes du rhône": [44.9, 4.9], alsace: [48.3, 7.4],
  provence: [43.5, 6.0], languedoc: [43.4, 3.0], beaujolais: [46.1, 4.7], chablis: [47.8, 3.8],
  tuscany: [43.4, 11.3], toscana: [43.4, 11.3], piedmont: [44.7, 8.0], piemonte: [44.7, 8.0],
  veneto: [45.5, 11.5], sicily: [37.5, 14.0], sicilia: [37.5, 14.0], puglia: [40.8, 17.0],
  umbria: [42.9, 12.5], "alto adige": [46.5, 11.3], friuli: [46.0, 13.2], abruzzo: [42.2, 14.0],
  rioja: [42.4, -2.5], "ribera del duero": [41.6, -3.9], priorat: [41.2, 0.8],
  "rías baixas": [42.4, -8.7], jerez: [36.7, -6.1], sherry: [36.7, -6.1], navarra: [42.7, -1.6],
  douro: [41.1, -7.8], porto: [41.1, -7.8], port: [41.1, -7.8], alentejo: [38.6, -7.9], madeira: [32.7, -16.9],
  mosel: [49.9, 6.9], rheingau: [50.0, 8.0], pfalz: [49.4, 8.2], baden: [48.5, 7.9],
  franken: [49.8, 10.0], rheinhessen: [49.8, 8.2], nahe: [49.8, 7.7], ahr: [50.5, 7.1],
  wachau: [48.4, 15.4], burgenland: [47.7, 16.7], kamptal: [48.5, 15.7], tokaj: [48.1, 21.4],
  santorini: [36.4, 25.4], napa: [38.5, -122.3], sonoma: [38.4, -122.7], "paso robles": [35.6, -120.7],
  willamette: [45.2, -123.1], "columbia valley": [46.5, -119.5], "finger lakes": [42.6, -76.9],
  mendoza: [-33.0, -68.8], salta: [-25.0, -65.5], maipo: [-33.7, -70.8], colchagua: [-34.6, -71.2],
  casablanca: [-33.3, -71.4], barossa: [-34.5, 139.0], "mclaren vale": [-35.2, 138.5],
  yarra: [-37.7, 145.5], "margaret river": [-33.9, 115.1], coonawarra: [-37.3, 140.8],
  marlborough: [-41.5, 173.9], "central otago": [-45.0, 169.2], "hawke's bay": [-39.6, 176.8],
  stellenbosch: [-33.9, 18.9], swartland: [-33.3, 18.7], ningxia: [38.5, 106.2],
  speyside: [57.5, -3.2], islay: [55.7, -6.2], highlands: [57.0, -4.5], campbeltown: [55.4, -5.6],
  kentucky: [38.0, -84.9], tennessee: [35.9, -86.6], jalisco: [20.7, -103.4], oaxaca: [17.1, -96.7],
  cognac: [45.7, -0.3], armagnac: [43.9, 0.2], calvados: [49.1, -0.4],
};
const COUNTRY_COORDS = {
  france: [46.6, 2.5], italy: [42.8, 12.5], spain: [40.4, -3.7], portugal: [39.5, -8.0],
  germany: [51.0, 10.0], austria: [47.6, 14.1], hungary: [47.2, 19.5], greece: [39.1, 21.8],
  "united states": [39.8, -98.6], usa: [39.8, -98.6], "united kingdom": [54.5, -3.5],
  scotland: [56.5, -4.2], ireland: [53.4, -8.2], argentina: [-38.4, -63.6], chile: [-35.7, -71.5],
  australia: [-25.3, 133.8], "new zealand": [-41.0, 174.0], "south africa": [-30.6, 22.9],
  japan: [36.2, 138.3], mexico: [23.6, -102.6], cuba: [22.0, -79.5], jamaica: [18.1, -77.3],
  barbados: [13.2, -59.5], canada: [56.1, -106.3], switzerland: [46.8, 8.2], israel: [31.4, 35.0],
  lebanon: [33.9, 35.9], georgia: [42.3, 43.4], romania: [45.9, 25.0], slovenia: [46.1, 14.8], croatia: [45.1, 15.2],
};

function coordsFor(d) {
  const r = String(d.region || "").toLowerCase();
  for (const key of Object.keys(REGION_COORDS)) if (r.includes(key)) return REGION_COORDS[key];
  const c = String(d.country || "").toLowerCase();
  for (const key of Object.keys(COUNTRY_COORDS)) if (c.includes(key)) return COUNTRY_COORDS[key];
  return null;
}

const DRINK_SPEC =
  `Object shape, keys exactly: {"n":wine or bottle name,"p":producer or distillery,` +
  `"k":one of ${DRINK_KINDS.map((k) => `"${k}"`).join("|")},"r":region or appellation,"c":country,` +
  `"v":vintage year or null,"g":grape or style,"ab":alcohol percent as a number or null,` +
  `"u":1 only if you cannot identify the bottle,"x":locator, required when u is 1}`;

async function readBottlePhoto(b64, mediaType, max = 10) {
  const { text, truncated } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text:
          `Photograph of bottles — a rack, a shelf, or a single label. Return one object per bottle you can SEE, left to right, ` +
          `including any whose label you cannot read. For those set "u":1 and write "x" as a locator someone standing at the rack could use: ` +
          `position from the left, bottle colour and shape, capsule colour, any legible fragment. ` +
          `For bottles you do identify, fill region, country, vintage and grape from the label and from your knowledge of the producer; use null where unsure. ` +
          `Never invent a vintage that is not printed. Return at most ${max} bottles. Reply with ONLY a minified JSON array. ${DRINK_SPEC}`,
      },
    ],
    false
  );
  const raw = parseJson(text);
  const list = (Array.isArray(raw) ? raw : [raw]).map((d) => ({
    id: uid(),
    name: d.u ? "" : d.n || "Unnamed",
    producer: d.p || "",
    kind: DRINK_KINDS.includes(d.k) ? d.k : "Other",
    region: d.r || "",
    country: d.c || "",
    vintage: Number(d.v) || null,
    grape: d.g || "",
    abv: Number(d.ab) || null,
    qty: 1,
    estValue: 0,
    location: "",
    notes: "",
    ...(d.u ? { needsReview: true, where: d.x || "position not recorded" } : {}),
  }));
  return { list, truncated };
}

/* Stylised equirectangular backdrop. The outlines are coarse on purpose —
   they exist to place the dots, which sit at true coordinates. */
const LANDMASS = [
  [[-168,66],[-158,72],[-125,70],[-95,73],[-80,73],[-60,60],[-55,50],[-65,45],[-70,42],[-75,35],[-81,25],[-97,26],[-107,23],[-115,30],[-125,40],[-125,48],[-135,58],[-150,60],[-168,66]],
  [[-81,8],[-75,11],[-60,5],[-50,0],[-35,-5],[-38,-13],[-48,-25],[-53,-34],[-58,-39],[-68,-50],[-75,-53],[-73,-45],[-71,-30],[-70,-18],[-77,-5],[-79,0],[-81,8]],
  [[-17,15],[-16,22],[-10,30],[0,36],[10,37],[25,32],[35,31],[43,12],[51,12],[41,-2],[40,-15],[35,-24],[25,-34],[18,-35],[12,-18],[9,-1],[0,5],[-8,5],[-13,10],[-17,15]],
  [[-10,36],[-9,43],[-2,48],[-5,50],[-6,58],[5,62],[15,68],[30,70],[40,66],[45,55],[40,48],[30,45],[25,40],[20,40],[15,38],[10,44],[3,42],[-2,37],[-10,36]],
  [[30,45],[45,55],[60,70],[80,74],[105,78],[130,73],[160,70],[180,66],[175,62],[160,58],[145,45],[135,35],[120,22],[105,10],[95,5],[80,8],[72,20],[60,25],[50,30],[45,38],[30,45]],
  [[113,-22],[115,-34],[129,-32],[138,-35],[147,-38],[153,-28],[148,-20],[142,-11],[132,-11],[122,-16],[113,-22]],
  [[172,-34],[174,-37],[178,-38],[176,-41],[172,-41],[170,-44],[167,-46],[170,-46],[174,-41],[172,-34]],
  [[130,32],[135,34],[140,36],[142,41],[145,44],[141,45],[138,37],[133,34],[130,32]],
  [[-5,50],[-3,54],[-5,58],[-2,58],[0,53],[1,51],[-5,50]],
];

function OriginMap({ drinks, onSelect, selected }) {
  const W = 860, H = 400, TOP = 80, BOT = -56;
  const px = (lng) => ((lng + 180) / 360) * W;
  const py = (lat) => ((TOP - lat) / (TOP - BOT)) * H;

  const groups = useMemo(() => {
    const m = new Map();
    for (const d of drinks) {
      const c = coordsFor(d);
      if (!c) continue;
      const key = `${c[0]},${c[1]}`;
      if (!m.has(key)) m.set(key, { lat: c[0], lng: c[1], items: [], label: d.region || d.country });
      m.get(key).items.push(d);
    }
    return [...m.values()];
  }, [drinks]);

  const unplaced = drinks.filter((d) => !coordsFor(d)).length;

  return (
    <>
      <div style={{ overflowX: "auto" }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 520, display: "block", background: "#141715", borderRadius: 3, border: `1px solid ${C.rule}` }}>
          {[-40, -20, 0, 20, 40, 60].map((lat) => (
            <line key={lat} x1={0} x2={W} y1={py(lat)} y2={py(lat)} stroke={lat === 0 ? "#2C332E" : "#22271F"} strokeWidth={lat === 0 ? 1 : 0.5} />
          ))}
          {LANDMASS.map((poly, i) => (
            <polygon key={i} points={poly.map(([lng, lat]) => `${px(lng)},${py(lat)}`).join(" ")} fill="#1F2621" stroke="#2E362F" strokeWidth="0.8" />
          ))}
          {groups.map((g) => {
            const n = g.items.reduce((a, d) => a + (Number(d.qty) || 1), 0);
            const r = Math.min(4 + Math.sqrt(n) * 2.6, 17);
            const on = selected === g.label;
            return (
              <g key={g.label} onClick={() => onSelect?.(on ? null : g.label)} style={{ cursor: "pointer" }}>
                <circle cx={px(g.lng)} cy={py(g.lat)} r={r} fill={on ? C.amber : "#B8603F"} fillOpacity={on ? 0.85 : 0.55} stroke={on ? C.amber : "#D98A63"} strokeWidth="1" />
                <text x={px(g.lng)} y={py(g.lat) + 3} textAnchor="middle" fontSize={n > 9 ? 9 : 8} fill="#12100E" fontFamily={MONO}>{n}</text>
                <text x={px(g.lng)} y={py(g.lat) - r - 4} textAnchor="middle" fontSize="9" fill={on ? C.amber : C.dim} fontFamily={MONO}>{g.label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer, marginTop: 8 }}>
        {groups.length} {groups.length === 1 ? "origin" : "origins"} plotted{unplaced ? ` · ${unplaced} without a recognised region` : ""} · click a dot to filter
      </div>
    </>
  );
}


function CellarTab({ drinks, onChange, flash }) {
  const [busy, setBusy] = useState(null);
  const [pending, setPending] = useState([]);
  const [q, setQ] = useState("");
  const [pin, setPin] = useState(null);
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const camRef = useRef(null);
  const fileRef = useRef(null);

  const onPhoto = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    let got = 0, unread = 0;
    for (let f = 0; f < files.length; f++) {
      setBusy(files.length > 1 ? `Reading photo ${f + 1} of ${files.length}` : "Reading the label");
      try {
        const { b64, type } = await toBase64(files[f], 1100, 0.72);
        const { list } = await readBottlePhoto(b64, type);
        got += list.length;
        unread += list.filter((d) => d.needsReview).length;
        setPending((p) => [...list, ...p]);
      } catch (err) {
        if (files.length === 1) flash(err?.message || "That photo couldn't be read.");
      }
    }
    if (got && unread) flash(`${unread} of ${got} ${unread === 1 ? "bottle wasn't identified" : "bottles weren't identified"} — each is listed with where to find it.`);
    else if (!got) flash("No bottles recognised. Labels facing the camera, one rack at a time.");
    setBusy(null);
    e.target.value = "";
  };

  const commit = () => { onChange([...pending, ...drinks]); setPending([]); };
  const addBlank = () => setPending((p) => [{ id: uid(), name: "", producer: "", kind: "Wine — Red", region: "", country: "", vintage: null, grape: "", abv: null, qty: 1, estValue: 0, location: "", notes: "" }, ...p]);

  const wines = drinks.filter((d) => isWine(d.kind));
  const flagged = drinks.filter((d) => d.needsReview).length;
  const bottles = drinks.reduce((a, d) => a + (Number(d.qty) || 1), 0);
  const value = drinks.reduce((a, d) => a + (Number(d.estValue) || 0) * (Number(d.qty) || 1), 0);

  const shown = drinks.filter((d) => {
    if (onlyFlagged && !d.needsReview) return false;
    if (pin && (d.region || d.country) !== pin) return false;
    if (!q.trim()) return true;
    const hay = [d.name, d.producer, d.kind, d.region, d.country, d.grape, d.vintage, d.where].join(" ").toLowerCase();
    return q.toLowerCase().split(/\s+/).filter(Boolean).every((t) => hay.includes(t));
  });

  const byKind = {};
  drinks.forEach((d) => { byKind[d.kind] = (byKind[d.kind] || 0) + (Number(d.qty) || 1); });

  return (
    <>
      <Panel title="Add bottles">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => camRef.current?.click()} style={btn} disabled={!!busy}>Photograph a rack</button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={btn} disabled={!!busy}>Upload photos</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPhoto} style={{ display: "none" }} />
          <button onClick={addBlank} style={btn}>Add by hand</button>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
          Labels facing the camera, up to ten bottles a shot. Producer, region, country, vintage and grape are read from the label and filled out from what's known about the producer — but a vintage is only recorded if it's actually printed, never inferred. Bottles it can't read come back flagged with a locator rather than being dropped.
        </p>
        {busy && <div style={{ fontFamily: MONO, fontSize: 12, color: C.amber, marginTop: 10 }}>{busy}…</div>}
      </Panel>

      {pending.length > 0 && (
        <Panel title={`Review — ${pending.length} not yet saved`}>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {pending.map((d, i) => (
              <DrinkRow key={d.id} d={d} editable
                onChange={(nd) => setPending((p) => p.map((x, j) => (j === i ? nd : x)))}
                onRemove={() => setPending((p) => p.filter((_, j) => j !== i))} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={commit} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Save {pending.length} to the cellar</button>
            <button onClick={() => setPending([])} style={btn}>Discard</button>
          </div>
        </Panel>
      )}

      {wines.length > 0 && (
        <Panel title="Where the wine comes from">
          <OriginMap drinks={wines} selected={pin} onSelect={setPin} />
        </Panel>
      )}

      <Panel title={`Cellar — ${bottles} ${bottles === 1 ? "bottle" : "bottles"}`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: barolo nebbiolo" style={{ ...input, flex: 1, minWidth: 140 }} />
          {flagged > 0 && (
            <button onClick={() => setOnlyFlagged(!onlyFlagged)} style={{ ...btn, color: onlyFlagged ? C.amber : C.warn, borderColor: onlyFlagged ? C.amber : C.warn }}>
              {onlyFlagged ? "Show all" : `${flagged} unidentified`}
            </button>
          )}
          {pin && <button onClick={() => setPin(null)} style={{ ...btn, color: C.amber, borderColor: C.amber }}>{pin} ×</button>}
        </div>
        {drinks.length === 0 ? (
          <Empty>Nothing in the cellar yet. Photograph a rack to fill it.</Empty>
        ) : (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {shown.map((d) => (
              <DrinkRow key={d.id} d={d}
                onChange={(nd) => onChange(drinks.map((x) => (x.id === d.id ? nd : x)))}
                onRemove={() => onChange(drinks.filter((x) => x.id !== d.id))} />
            ))}
          </div>
        )}
        {drinks.length > 0 && (
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer, marginTop: 12 }}>
            {Object.entries(byKind).sort((a, z) => z[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join("  ·  ")}
            {value ? `  ·  €${value.toLocaleString("de-DE")} declared` : ""}
          </div>
        )}
      </Panel>
    </>
  );
}

function DrinkRow({ d, onChange, onRemove, editable }) {
  const [open, setOpen] = useState((!!editable && !d.name) || !!d.needsReview);
  const flagged = !!d.needsReview;
  const set = (patch) => {
    const next = { ...d, ...patch };
    if (next.name && next.name.trim()) delete next.needsReview;
    onChange(next);
  };
  const placed = !!coordsFor(d);
  return (
    <div style={{ border: `1px solid ${flagged ? C.warn : C.rule}`, borderRadius: 3, background: C.bg, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer", minWidth: 0 }} onClick={() => setOpen(!open)}>
        <div style={{ width: 6, height: 34, background: isWine(d.kind) ? (d.kind.includes("White") ? "#C7B037" : d.kind.includes("Rosé") ? "#C07A9A" : "#6E2B2B") : "#A85332", borderRadius: 1, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14, color: flagged ? C.warn : C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {[d.producer, d.name].filter(Boolean).join(" — ") || "Not identified"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {flagged
              ? d.where || "no locator"
              : [d.vintage, d.kind, d.region || d.country, d.grape, (Number(d.qty) || 1) > 1 ? `×${d.qty}` : null, !placed && (d.region || d.country) ? "not on map" : null].filter(Boolean).join("  ·  ")}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ ...btn, padding: "4px 9px", fontSize: 11, flexShrink: 0 }}>Remove</button>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: 10, minWidth: 0, boxSizing: "border-box" }}>
          {flagged && (
            <div style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginBottom: 10 }}>
              Where to find it: {d.where || "not recorded"}. Name it and the flag clears.
            </div>
          )}
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(min(150px,100%),1fr))" }}>
            <Field label="Producer"><input value={d.producer} onChange={(e) => set({ producer: e.target.value })} style={input} /></Field>
            <Field label="Name"><input value={d.name} onChange={(e) => set({ name: e.target.value })} style={input} autoFocus={flagged} /></Field>
            <Field label="Kind">
              <select value={d.kind} onChange={(e) => set({ kind: e.target.value })} style={{ ...input, width: "100%" }}>
                {DRINK_KINDS.map((k) => <option key={k}>{k}</option>)}
              </select>
            </Field>
            <Field label="Region"><input value={d.region} onChange={(e) => set({ region: e.target.value })} style={input} /></Field>
            <Field label="Country"><input value={d.country} onChange={(e) => set({ country: e.target.value })} style={input} /></Field>
            <Field label="Vintage"><input value={d.vintage || ""} onChange={(e) => set({ vintage: Number(e.target.value) || null })} style={input} inputMode="numeric" /></Field>
            <Field label="Grape or style"><input value={d.grape} onChange={(e) => set({ grape: e.target.value })} style={input} /></Field>
            <Field label="ABV %"><input value={d.abv || ""} onChange={(e) => set({ abv: Number(e.target.value) || null })} style={input} inputMode="decimal" /></Field>
            <Field label="Bottles"><input value={d.qty} onChange={(e) => set({ qty: Math.max(1, Number(e.target.value) || 1) })} style={input} inputMode="numeric" /></Field>
            <Field label="Value € each"><input value={d.estValue} onChange={(e) => set({ estValue: Number(e.target.value) || 0 })} style={input} inputMode="numeric" /></Field>
            <Field label="Stored"><input value={d.location} onChange={(e) => set({ location: e.target.value })} placeholder="rack, shelf, cellar" style={input} /></Field>
          </div>
          <Field label="Notes"><textarea value={d.notes} onChange={(e) => set({ notes: e.target.value })} style={{ ...input, width: "100%", minHeight: 54, marginTop: 10 }} /></Field>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  SIMILARITY  ─────────────────────────
   An inverted index built once per library change. Rare shared terms
   count for more than common ones, so two books sharing "punic wars"
   rank far above two sharing "history". */

const STOP = new Set(
  "the a an and or of in on to for from with by at as is its his her their this that new complete guide book books vol volume edition life story history introduction"
    .split(" ")
);

function tokensOf(b) {
  const out = new Set();
  (b.keywords || []).forEach((k) => out.add(String(k).toLowerCase()));
  String(b.title || "")
    .toLowerCase()
    .split(/[^a-zà-ÿ0-9]+/)
    .forEach((w) => { if (w.length > 3 && !STOP.has(w)) out.add(w); });
  return out;
}

function buildSimilarityIndex(books) {
  const df = new Map();
  const toks = new Map();
  for (const b of books) {
    const t = tokensOf(b);
    toks.set(b.id, t);
    for (const k of t) df.set(k, (df.get(k) || 0) + 1);
  }
  return { df, toks, n: Math.max(books.length, 1) };
}

function similarBooks(b, books, idx, n = 5) {
  if (!b || !idx) return [];
  const mine = idx.toks.get(b.id) || tokensOf(b);
  const sameAuthor = (o) => o.author && b.author && o.author.toLowerCase() === b.author.toLowerCase();
  const out = [];
  for (const o of books) {
    if (o.id === b.id || o.needsReview || !o.title) continue;
    const theirs = idx.toks.get(o.id) || tokensOf(o);
    let score = 0;
    const shared = [];
    for (const k of mine) {
      if (!theirs.has(k)) continue;
      score += 2 * Math.log(1 + idx.n / (idx.df.get(k) || 1));
      shared.push(k);
    }
    if (o.subject === b.subject && b.subject !== "Unsorted") score += 2.5;
    if (sameAuthor(o)) score += 7;
    if (o.year && b.year && Math.abs(o.year - b.year) <= 15) score += 0.6;
    if (score < 1.3) continue;
    out.push({
      book: o,
      score,
      why: sameAuthor(o)
        ? "same author"
        : shared.length
        ? shared.slice(0, 3).join(", ")
        : `also ${o.subject.toLowerCase()}`,
    });
  }
  return out.sort((x, y) => y.score - x.score).slice(0, n);
}

/* ─────────────────────────  APP  ───────────────────────── */

export default function HomeInventory() {
  const [tab, setTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [items, setItems] = useState([]);
  const [cases, setCases] = useState(DEFAULT_CASES);
  const [drinks, setDrinks] = useState([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      setBooks(await loadKey(K.books, []));
      setItems(await loadKey(K.items, []));
      setCases(await loadKey(K.cases, DEFAULT_CASES));
      setDrinks(await loadKey(K.drinks, []));
      setReady(true);
    })();
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const persistBooks = async (next) => {
    setBooks(next);
    if (!(await saveKey(K.books, next))) flash("Books didn't save. Nothing was lost on screen — try again.");
  };
  const persistItems = async (next) => {
    setItems(next);
    if (!(await saveKey(K.items, next))) flash("Valuables didn't save. Try again.");
  };
  const persistCases = async (next) => { setCases(next); await saveKey(K.cases, next); };
  const persistDrinks = async (next) => {
    setDrinks(next);
    if (!(await saveKey(K.drinks, next))) flash("The cellar didn't save. Try again.");
  };

  const totalValue = items.reduce((n, i) => n + (Number(i.estValue) || 0), 0);
  const simIndex = useMemo(() => buildSimilarityIndex(books), [books]);

  if (!ready) return <Shell><div style={{ color: C.dimmer, fontFamily: MONO, padding: 40 }}>Opening your inventory…</div></Shell>;

  return (
    <Shell>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: 22 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 23, letterSpacing: "-0.01em" }}>Home inventory</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer, marginTop: 4 }}>
            {books.length} books · {drinks.reduce((a, d) => a + (Number(d.qty) || 1), 0)} bottles · {items.length} valuables · €{totalValue.toLocaleString("de-DE")} declared
          </div>
        </div>
        <nav style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["books", "Books"], ["shelves", "Shelves"], ["cellar", "Cellar"], ["valuables", "Valuables"], ["report", "Report"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{ ...navBtn, color: tab === k ? C.amber : C.dim, borderColor: tab === k ? C.amber : C.rule }}>{l}</button>
          ))}
        </nav>
      </header>

      {toast && (
        <div style={{ background: "rgba(196,104,90,0.12)", border: `1px solid ${C.warn}`, borderRadius: 3, padding: "10px 14px", marginBottom: 16, fontFamily: MONO, fontSize: 12, color: C.text }}>{toast}</div>
      )}

      {tab === "books" && <BooksTab books={books} onChange={persistBooks} flash={flash} simIndex={simIndex} cases={cases} onCases={persistCases} />}
      {tab === "shelves" && <ShelvesTab books={books} onBooks={persistBooks} cases={cases} onCases={persistCases} simIndex={simIndex} flash={flash} />}
      {tab === "cellar" && <CellarTab drinks={drinks} onChange={persistDrinks} flash={flash} />}
      {tab === "valuables" && <ValuablesTab items={items} onChange={persistItems} flash={flash} />}
      {tab === "report" && <ReportTab books={books} items={items} drinks={drinks} cases={cases}
        onBooks={persistBooks} onItems={persistItems} onDrinks={persistDrinks} onCases={persistCases} flash={flash} />}
    </Shell>
  );
}

/* ─────────────────────────  BOOKS  ───────────────────────── */

function BooksTab({ books, onChange, flash, simIndex, cases, onCases }) {
  const [busy, setBusy] = useState(null);
  const [pending, setPending] = useState([]);
  const [shots, setShots] = useState({});
  const [isbn, setIsbn] = useState("");
  const [q, setQ] = useState("");
  const [onlyFlagged, setOnlyFlagged] = useState(false);
  const [enriching, setEnriching] = useState(null);
  const [view, setView] = useState("list");
  const [detail, setDetail] = useState(null);
  const [probe, setProbe] = useState(null);
  const [probing, setProbing] = useState(false);

  const runProbe = async () => {
    setProbing(true);
    setProbe(null);
    try { setProbe(await probeSources(books.find((b) => b.title && !b.needsReview))); }
    catch (e) { flash(e?.message || "The test itself failed."); }
    setProbing(false);
  };
  const fileRef = useRef(null);
  const camRef = useRef(null);
  const caseCamRef = useRef(null);
  const caseFileRef = useRef(null);
  // A capture session: one establishing shot of the bookcase, then a shelf
  // photo per opening. Shelf number advances on its own but stays editable.
  const [layout, setLayout] = useState(null);
  const [targetCase, setTargetCase] = useState(cases?.[0]?.id || "");
  const [nextShelf, setNextShelf] = useState(1);
  const [shelfShots, setShelfShots] = useState(0);

  const addIsbn = async () => {
    const clean = isbn.replace(/[^0-9Xx]/g, "");
    if (clean.length < 10) return flash("That doesn't look like an ISBN — 10 or 13 digits.");
    setBusy("Looking up " + clean);
    try {
      const d = await lookupIsbn(clean);
      setPending((p) => [{ ...normaliseBook(d), isbn: clean, id: uid(), cap: { t: Date.now(), i: 0 } }, ...p]);
      setIsbn("");
    } catch {
      flash("Couldn't find that ISBN. Add it by hand below, or photograph the cover.");
    }
    setBusy(null);
  };

  const onPhoto = async (e) => {
    const files = [...(e.target.files || [])];
    if (!files.length) return;
    // One photo stays on the shelf you're working: a Kallax row or a 90 cm
    // shelf needs several. Only a multi-file selection walks forward.
    const spread = files.length > 1;
    let shelf = nextShelf;
    let unread = 0, got = 0, failed = 0;
    for (let f = 0; f < files.length; f++) {
      setBusy(spread ? `Reading photo ${f + 1} of ${files.length} — shelf ${shelf}` : `Reading shelf ${shelf}`);
      try {
        const { b64, type } = await toBase64(files[f], 1100, 0.72);
        const { list, truncated } = await readShelfPhoto(b64, type);
        const shotId = uid();
        const t = Date.now() + f;
        // Batch timestamp, position in frame, and which shelf it came off.
        const withIds = list.map((d, i) => ({ ...d, id: uid(), shotId, shelfIdx: shelf, cap: { t, i } }));
        unread += withIds.filter((b) => b.needsReview).length;
        got += withIds.length;
        if (truncated) flash(`Shelf ${shelf} was cut off after ${withIds.length} — photograph the rest of it separately.`);
        setShots((s) => ({ ...s, [shotId]: b64 }));
        setPending((p) => [...withIds, ...p]);
      } catch (err) {
        failed++;
        if (files.length === 1) flash(err?.message || "The photo couldn't be read.");
      }
      if (spread) shelf++;
    }
    if (spread) { setNextShelf(shelf); setShelfShots(0); }
    else setShelfShots((n) => n + 1);
    if (files.length > 1) {
      flash(`${got} books across ${files.length - failed} of ${files.length} photos${unread ? `, ${unread} unidentified` : ""}${failed ? `, ${failed} unreadable` : ""}.`);
    } else if (!got && !failed) {
      flash("Nothing recognisable in that frame. Square-on, spines filling the shot.");
    } else if (unread) {
      flash(`${unread} of ${got} ${unread === 1 ? "spine couldn't be identified" : "spines couldn't be identified"} — each is listed below with where to find it.`);
    }
    setBusy(null);
    e.target.value = "";
  };

  const onCasePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("Reading the bookcase");
    try {
      const { b64, type } = await toBase64(file, 1100, 0.72);
      const l = await readBookcasePhoto(b64, type);
      if (!l.shelves.length) flash("Couldn't make out the shelves. Step back so the whole case is in frame.");
      setLayout({ ...l, b64 });
      setNextShelf(1);
    } catch (err) {
      flash(err?.message || "That photo couldn't be read.");
    }
    setBusy(null);
    e.target.value = "";
  };

  // Existing shelf ids are kept where they line up, so books already placed
  // on this case don't lose their shelf when the dimensions change.
  const updateCaseFromLayout = () => {
    const k = (cases || []).find((c) => c.id === targetCase);
    if (!k || !layout) return;
    const cols = layout.cols || 1;
    const shelves = [];
    for (let r = 0; r < layout.shelves.length; r++)
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        shelves.push({
          id: k.shelves[i]?.id || uid(),
          label: openingLabel(cols, i),
          widthCm: layout.widthCm,
          heightCm: layout.shelves[r].heightCm,
        });
      }
    onCases?.((cases || []).map((c) => (c.id === k.id ? { ...c, cols, shelves } : c)));
    flash(`“${k.name}” now has ${shelves.length} ${cols > 1 ? `cubes (${cols}×${layout.shelves.length})` : "shelves"} from the scan.`);
  };

  const caseFromLayout = () => {
    const cols = layout.cols || 1;
    const rows = layout.shelves.length;
    // A row of a grid is cols openings wide, so expand rather than take one each.
    const shelves = [];
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++)
        shelves.push({
          id: uid(),
          label: openingLabel(cols, r * cols + c),
          widthCm: layout.widthCm,
          heightCm: layout.shelves[r].heightCm,
        });
    const k = {
      id: uid(),
      name: cols > 1 ? `Scanned ${cols}×${rows} unit` : `Scanned bookcase (${rows} shelves)`,
      room: "",
      cols,
      shelves,
    };
    onCases?.([...(cases || []), k]);
    setTargetCase(k.id);
    flash(`Created “${k.name}”. Shelf photos will now land on it.`);
  };

  const testConnection = async () => {
    setBusy("Testing");
    try {
      const { text } = await askClaude("Reply with the single word: ok");
      flash(/ok/i.test(text) ? "Connection is fine — the problem is the image, not the link." : `Unexpected reply: ${text.slice(0, 80)}`);
    } catch (err) {
      flash(`Connection failed — ${err?.message || "unknown"}`);
    }
    setBusy(null);
  };

  const runEnrichment = async (list) => {
    const targets = list.filter((b) => !b.enriched && b.title && !b.needsReview);
    if (!targets.length) return;
    let current = [...list];
    setEnriching({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const patch = await enrichBook(targets[i]);
      current = current.map((x) => (x.id === targets[i].id ? { ...x, ...patch } : x));
      setEnriching({ done: i + 1, total: targets.length });
      if ((i + 1) % 4 === 0 || i === targets.length - 1) onChange(current);
      await new Promise((r) => setTimeout(r, 120));
    }
    setEnriching(null);
  };

  const targetCaseObj = (cases || []).find((c) => c.id === targetCase);
  const targetCaseName = targetCaseObj?.name || "";
  const targetIsGrid = (targetCaseObj?.cols || 1) > 1;

  const commit = async () => {
    // Keep the source photo only while something from it is still unidentified.
    const keep = new Set(pending.filter((b) => b.needsReview && b.shotId).map((b) => b.shotId));
    for (const id of keep) if (shots[id]) await saveKey(K.shot(id), shots[id]);
    // Shelf photos become the starting layout: each book is placed on the
    // opening it was photographed from.
    const k = (cases || []).find((c) => c.id === targetCase);
    const on = new Date().toISOString().slice(0, 10);
    const placed = pending.map((b) => {
      const sh = k && b.shelfIdx ? k.shelves[b.shelfIdx - 1] : null;
      return sh ? { ...b, placement: { caseId: k.id, shelfId: sh.id, pos: b.shelfIdx * 1000 + (b.cap?.i ?? 0), on } } : b;
    });
    const next = [...placed, ...books];
    onChange(next);
    setPending([]);
    setShots({});
    setLayout(null);
    setNextShelf(1);
    setShelfShots(0);
    runEnrichment(next);
  };

  const unresolvedPending = pending.filter((b) => b.needsReview).length;
  // Checked before saving, so the catalogue never gains the duplicate at all.
  const alreadyHave = useMemo(
    () => pending.filter((b) => b.title && !b.needsReview && books.some((x) => (dupeScore(b, x)?.score || 0) >= 0.8)),
    [pending, books]
  );
  const unresolvedSaved = books.filter((b) => b.needsReview).length;

  const shown = books.filter((b) => {
    if (onlyFlagged && !b.needsReview) return false;
    if (!q.trim()) return true;
    return matchesQuery(b, q);
  });
  const unenriched = books.filter((b) => !b.enriched && b.title && !b.needsReview).length;
  const noCover = books.filter((b) => b.enriched && !b.coverUrl && b.title && !b.needsReview).length;

  const retryCovers = async () => {
    const targets = books.filter((b) => b.enriched && !b.coverUrl && b.title && !b.needsReview);
    let current = [...books];
    setEnriching({ done: 0, total: targets.length });
    for (let i = 0; i < targets.length; i++) {
      const c = await findCover(targets[i]);
      if (c?.url) current = current.map((x) => (x.id === targets[i].id ? { ...x, coverUrl: c.url, isbn: x.isbn || c.isbn || "" } : x));
      setEnriching({ done: i + 1, total: targets.length });
      if ((i + 1) % 4 === 0 || i === targets.length - 1) onChange(current);
      await new Promise((r) => setTimeout(r, 120));
    }
    setEnriching(null);
  };

  return (
    <>
      <Panel title="Step 1 — the whole bookcase">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => caseCamRef.current?.click()} style={btn} disabled={!!busy}>Photograph the bookcase</button>
          <input ref={caseCamRef} type="file" accept="image/*" capture="environment" onChange={onCasePhoto} style={{ display: "none" }} />
          <button onClick={() => caseFileRef.current?.click()} style={btn} disabled={!!busy}>Upload one</button>
          <input ref={caseFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onCasePhoto} style={{ display: "none" }} />
          {layout && <button onClick={() => { setLayout(null); setNextShelf(1); setShelfShots(0); }} style={btn}>Discard</button>}
          <div style={{ width: 1, height: 22, background: C.rule }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer }}>filling</span>
          <select value={targetCase} onChange={(e) => { setTargetCase(e.target.value); setNextShelf(1); setShelfShots(0); }} style={{ ...input, maxWidth: 230 }}>
            <option value="">No bookcase — just catalogue them</option>
            {(cases || []).map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.shelves.length})</option>
            ))}
          </select>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
          Step back and get the whole case in frame. This shot isn't read for titles — it's read for structure: how many shelves, roughly how full each one is, and what clear height each has. The shelf photos in step 2 then land on the right shelf instead of being guessed at.
        </p>

        {layout && (
          <div style={{ marginTop: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <img src={`data:image/jpeg;base64,${layout.b64}`} alt="" style={{ width: 150, borderRadius: 3, border: `1px solid ${C.rule}` }} />
            <div style={{ flex: 1, minWidth: 240 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><th style={th}>{layout.cols > 1 ? "Row" : "Shelf"}</th><th style={th}>Books</th><th style={th}>Height</th><th style={th}>Contents</th></tr></thead>
                <tbody>
                  {layout.shelves.map((sh) => (
                    <tr key={sh.n}>
                      <td style={{ ...td, fontFamily: MONO, fontSize: 11.5 }}>{sh.n}</td>
                      <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.dim }}>~{sh.count}</td>
                      <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.dim }}>{sh.heightCm} cm</td>
                      <td style={{ ...td, fontSize: 12.5, color: C.dim }}>{sh.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer, marginTop: 8 }}>
                {layout.cols > 1
                  ? `${layout.cols} columns × ${layout.shelves.length} rows = ${layout.cols * layout.shelves.length} cubes · `
                  : ""}~{layout.widthCm} cm usable width each
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <button onClick={caseFromLayout} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Create a bookcase from this</button>
                {targetCase && <button onClick={updateCaseFromLayout} style={btn}>Apply to the selected bookcase</button>}
              </div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Step 2 — shelf by shelf">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => camRef.current?.click()} style={btn} disabled={!!busy}>Photograph a shelf</button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={btn} disabled={!!busy}>Upload shelf photos</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onPhoto} style={{ display: "none" }} />
          <div style={{ width: 1, height: 22, background: C.rule }} />
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer }}>shelf</span>
          <input value={nextShelf} onChange={(e) => { setNextShelf(Math.max(1, Number(e.target.value) || 1)); setShelfShots(0); }} style={{ ...input, width: 52, textAlign: "center" }} inputMode="numeric" />
          <button onClick={() => { setNextShelf((n) => n + 1); setShelfShots(0); }} style={{ ...btn, borderColor: C.amber, color: C.amber }} disabled={!!busy}>
            Done — next shelf
          </button>
        </div>

        <div style={{ fontFamily: MONO, fontSize: 11, color: shelfShots ? C.good : C.dimmer, marginTop: 10 }}>
          {targetCaseName ? `${targetCaseName} · ` : ""}
          {targetCaseObj ? targetCaseObj.shelves[nextShelf - 1]?.label || `opening ${nextShelf}` : `shelf ${nextShelf}`}
          {shelfShots ? ` · ${shelfShots} ${shelfShots === 1 ? "photo" : "photos"} so far — keep going or press “Done”` : " · no photos yet"}
        </div>

        {targetIsGrid && (
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.amber, lineHeight: 1.6, marginTop: 8, maxWidth: 620 }}>
            This is a cube unit, so shelf {nextShelf} means one cube, not a whole row. Photograph a single cube at a time here — or catalogue the books without a bookcase and use “Place books from a photo” in the Shelves tab, which reads the dividers and splits a whole row across its cubes.
          </div>
        )}
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 10, maxWidth: 620 }}>
          Each shot reads up to fourteen books, so one shelf usually takes several photos. Stay on the same shelf number for all of them and press “Done — next shelf” when you've finished that row. Selecting several files at once is the exception: those are assigned to consecutive shelves, one photo each.
        </p>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="ISBN" style={{ ...input, width: 170 }} onKeyDown={(e) => e.key === "Enter" && addIsbn()} />
          <button onClick={addIsbn} style={btn} disabled={!!busy}>Look up</button>
          <button onClick={() => setPending((p) => [{ ...normaliseBook({}), id: uid(), title: "", cap: { t: Date.now(), i: 0 } }, ...p])} style={btn}>Add by hand</button>
          <button onClick={testConnection} style={{ ...btn, fontSize: 11, padding: "4px 9px" }} disabled={!!busy}>Test connection</button>
        </div>
        {busy && <div style={{ fontFamily: MONO, fontSize: 12, color: C.amber, marginTop: 10 }}>{busy}…</div>}
      </Panel>

      {pending.length > 0 && (
        <Panel title={`Review — ${pending.length} not yet saved`}>
          {unresolvedPending > 0 && (
            <div style={{ border: `1px solid ${C.warn}`, background: "rgba(196,104,90,0.10)", borderRadius: 3, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>
                {unresolvedPending} {unresolvedPending === 1 ? "book was seen but not identified" : "books were seen but not identified"}. Each carries a locator describing where it sits and what it looks like. Fill in the title now, or save as-is and they'll stay flagged in the catalogue with the photo attached.
              </div>
            </div>
          )}
          {alreadyHave.length > 0 && (
            <div style={{ border: `1px solid ${C.amber}`, background: "rgba(233,161,59,0.09)", borderRadius: 3, padding: "10px 12px", marginBottom: 12 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, lineHeight: 1.6 }}>
                {alreadyHave.length} of these {alreadyHave.length === 1 ? "looks like a book" : "look like books"} already in your catalogue:{" "}
                {alreadyHave.slice(0, 4).map((x) => x.title).join(", ")}{alreadyHave.length > 4 ? `, and ${alreadyHave.length - 4} more` : ""}.
              </div>
              <button onClick={() => setPending(pending.filter((b) => !alreadyHave.some((x) => x.id === b.id)))}
                style={{ ...btn, marginTop: 8, padding: "4px 10px", fontSize: 11 }}>
                Drop the ones I already have
              </button>
            </div>
          )}
          {Object.entries(shots).map(([sid, b64]) => (
            <img key={sid} src={`data:image/jpeg;base64,${b64}`} alt="" style={{ maxWidth: "100%", borderRadius: 3, marginBottom: 12, display: "block", border: `1px solid ${C.rule}` }} />
          ))}
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {pending.map((b, i) => (
              <BookRow key={b.id} b={b} editable
                onChange={(nb) => setPending((p) => p.map((x, j) => (j === i ? nb : x)))}
                onRemove={() => setPending((p) => p.filter((_, j) => j !== i))} />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button onClick={commit} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Save {pending.length} to catalogue</button>
            <button onClick={() => setPending([])} style={btn}>Discard</button>
          </div>
        </Panel>
      )}

      <DuplicatePanel books={books} onChange={onChange} flash={flash} />

      <Panel title={`Catalogue — ${books.length}`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Try: roman history" style={{ ...input, flex: 1, minWidth: 140 }} />
          {unresolvedSaved > 0 && (
            <button onClick={() => setOnlyFlagged(!onlyFlagged)} style={{ ...btn, color: onlyFlagged ? C.amber : C.warn, borderColor: onlyFlagged ? C.amber : C.warn }}>
              {onlyFlagged ? "Show all" : `${unresolvedSaved} unidentified`}
            </button>
          )}
          {unenriched > 0 && !enriching && (
            <button onClick={() => runEnrichment(books)} style={btn}>Fetch covers &amp; keywords ({unenriched})</button>
          )}
          {!unenriched && noCover > 0 && !enriching && (
            <button onClick={retryCovers} style={btn}>Retry {noCover} missing {noCover === 1 ? "cover" : "covers"}</button>
          )}
          {books.length > 0 && (
            <button onClick={runProbe} style={btn} disabled={probing}>{probing ? "Testing…" : "Why no covers?"}</button>
          )}
          <button onClick={() => setView(view === "covers" ? "list" : "covers")} style={{ ...btn, color: view === "covers" ? C.amber : C.dim, borderColor: view === "covers" ? C.amber : C.rule }}>
            {view === "covers" ? "List" : "Covers"}
          </button>
        </div>
        {probe && (
          <div style={{ border: `1px solid ${C.rule}`, borderRadius: 3, padding: "10px 12px", marginBottom: 12 }}>
            {probe.out.map((r, i) => (
              <div key={i} style={{ fontFamily: MONO, fontSize: 11, color: r.ok ? C.good : C.warn, lineHeight: 1.7, overflowWrap: "anywhere" }}>
                {r.ok ? "ok" : "no"} · {r.name}: {r.detail}
              </div>
            ))}
            <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dim, lineHeight: 1.6, marginTop: 8 }}>
              {probe.imagesWork
                ? "Images render from that host, so covers are a lookup problem, not a blocking one. “Retry missing covers” now goes through the model and tries several candidate URLs per book, keeping the first that returns real artwork."
                : "Images from that host don't render at all here, so no automatic cover will ever appear. Paste a URL by hand into any book — the field is in its expanded row — or export to CSV and keep covers in whatever you import into."}
            </div>
            <button onClick={() => setProbe(null)} style={{ ...btn, marginTop: 8, padding: "3px 9px", fontSize: 10 }}>Hide</button>
          </div>
        )}
        {enriching && (
          <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.amber, marginBottom: 10 }}>
            Fetching covers and keywords — {enriching.done} of {enriching.total}
          </div>
        )}
        {q.trim() && (
          <div style={{ fontFamily: MONO, fontSize: 11, color: C.dimmer, marginBottom: 10 }}>
            {shown.length} of {books.length} match
          </div>
        )}
        {books.length === 0 ? (
          <Empty>Nothing catalogued yet. Photograph a shelf to fill this in a few minutes.</Empty>
        ) : view === "covers" ? (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fill,minmax(min(104px,100%),1fr))" }}>
            {shown.map((b) => (
              <CoverTile key={b.id} b={b} onClick={() => setDetail(b.id)} />
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {shown.map((b) => (
              <BookRow key={b.id} b={b} onKeyword={setQ} library={books} simIndex={simIndex}
                onOpenBook={(nb) => { setQ(nb.title); setOnlyFlagged(false); }}
                onChange={(nb) => onChange(books.map((x) => (x.id === b.id ? nb : x)))}
                onRemove={() => onChange(books.filter((x) => x.id !== b.id))} />
            ))}
          </div>
        )}
      </Panel>

      {detail && books.some((x) => x.id === detail) && (
        <BookDetail
          b={books.find((x) => x.id === detail)}
          books={books}
          simIndex={simIndex}
          onChange={(nb) => onChange(books.map((x) => (x.id === nb.id ? nb : x)))}
          onSelect={(nb) => setDetail(nb.id)}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function CoverTile({ b, onClick }) {
  const [failed, setFailed] = useState(false);
  const show = b.coverUrl && !failed;
  return (
    <div onClick={onClick} style={{ cursor: "pointer" }}>
      <div style={{ aspectRatio: "2 / 3", borderRadius: 3, overflow: "hidden", border: `1px solid ${C.rule}`, background: show ? C.panel : spineHex(b), display: "flex", alignItems: "flex-end" }}>
        {show ? (
          <img src={b.coverUrl} alt="" onError={() => setFailed(true)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ padding: 8, fontFamily: SANS, fontSize: 11, lineHeight: 1.3, color: hslOf(spineHex(b)).l > 0.62 ? "#26241F" : "rgba(255,255,255,0.9)" }}>
            {b.title || "Not identified"}
          </div>
        )}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11.5, marginTop: 5, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {b.title || "Not identified"}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.dimmer, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {b.author || "—"}
      </div>
    </div>
  );
}

function normaliseBook(d = {}) {
  const hex = /^#[0-9a-f]{6}$/i.test(d.hex || "") ? d.hex : null;
  return {
    title: d.title || "Untitled",
    author: d.author || "",
    isbn: d.isbn || "",
    year: d.year || null,
    pages: d.pages || null,
    summary: d.summary || "",
    keywords: Array.isArray(d.keywords) ? d.keywords : [],
    format: FORMATS[d.format] ? d.format : "trade",
    hex: hex || undefined,
    color: SPINE_COLORS.some((c) => c.k === d.color) ? d.color : hex ? nearestColor(hex) : "grey",
    // Any string is allowed — the picker offers the standard list plus whatever
    // has been typed before, so a one-off shelf category survives.
    subject: typeof d.subject === "string" && d.subject.trim() ? d.subject : "Unsorted",
  };
}

function BookRow({ b, onChange, onRemove, onKeyword, editable, library, simIndex, onOpenBook }) {
  const [open, setOpen] = useState((!!editable && !b.title) || !!b.needsReview);
  const [shot, setShot] = useState(null);
  const [coverFailed, setCoverFailed] = useState(false);
  const flagged = !!b.needsReview;
  const cover = b.coverUrl && !coverFailed;

  useEffect(() => {
    if (open && flagged && b.shotId && !shot) loadKey(K.shot(b.shotId), null).then(setShot);
  }, [open]);

  const resolve = (patch) => {
    const next = { ...b, ...patch };
    if (next.title && next.title.trim()) { delete next.needsReview; }
    onChange(next);
  };

  const idRef = useRef(null);
  const [idBusy, setIdBusy] = useState(false);
  // Barcode first, cover second: if the digits are readable we get an
  // authoritative record rather than a guess from the jacket.
  const identify = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIdBusy(true);
    try {
      const { b64, type } = await toBase64(file, 1100, 0.72);
      const d = await identifyFromPhoto(b64, type);
      const next = { ...b, ...d, id: b.id, cap: b.cap, shelfIdx: b.shelfIdx, enriched: false };
      if (next.title && next.title !== "Untitled") delete next.needsReview;
      onChange(next);
    } catch (err) {
      onChange({ ...b, where: err?.message || "That photo couldn't be read." });
    }
    setIdBusy(false);
    e.target.value = "";
  };

  const [coverBusy, setCoverBusy] = useState(false);
  const findCoverNow = async () => {
    setCoverBusy(true);
    const c = await findCover(b);
    if (c?.url) { setCoverFailed(false); onChange({ ...b, coverUrl: c.url, isbn: b.isbn || c.isbn || "" }); }
    setCoverBusy(false);
  };

  const [syn, setSyn] = useState(false);
  const fetchSyn = async () => {
    setSyn(true);
    const patch = await fetchSummary(b);
    if (patch.summary) onChange({ ...b, ...patch });
    setSyn(false);
  };

  return (
    <div style={{ border: `1px solid ${flagged ? C.warn : C.rule}`, borderRadius: 3, background: C.bg, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", cursor: "pointer", minWidth: 0 }} onClick={() => setOpen(!open)}>
        {cover ? (
          <img src={b.coverUrl} alt="" onError={() => setCoverFailed(true)}
            style={{ width: 30, height: 44, objectFit: "cover", borderRadius: 2, flexShrink: 0, background: C.panel }} />
        ) : (
          <div style={{ width: 6, height: 40, background: spineHex(b), borderRadius: 1, flexShrink: 0 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14, color: flagged ? C.warn : C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {b.title || "Not identified"}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {flagged
              ? b.where || "no locator"
              : [b.author, b.subject, `${spineCm(b)} cm`, b.shelfIdx ? `shelf ${b.shelfIdx}` : null].filter(Boolean).join("  ·  ")}
          </div>
          {!flagged && b.summary && !open && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: C.dim, marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {b.summary}
            </div>
          )}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ ...btn, padding: "4px 9px", fontSize: 11, flexShrink: 0 }}>Remove</button>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: 10, minWidth: 0, boxSizing: "border-box" }}>
          {flagged && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
                Where to find it: {b.where || "not recorded"}. Type a title and the flag clears.
              </div>
              {shot && <img src={`data:image/jpeg;base64,${shot}`} alt="" style={{ maxWidth: "100%", borderRadius: 3, marginTop: 8, border: `1px solid ${C.rule}` }} />}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap", alignItems: "center" }}>
            <button onClick={() => idRef.current?.click()} style={{ ...btn, padding: "4px 10px", fontSize: 11 }} disabled={idBusy}>
              {idBusy ? "Reading…" : "Identify from barcode or cover"}
            </button>
            <input ref={idRef} type="file" accept="image/*" capture="environment" onChange={identify} style={{ display: "none" }} />
            <span style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>fills this entry from a photo</span>
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(min(150px,100%),1fr))" }}>
            <Field label="Title"><input value={b.title} onChange={(e) => resolve({ title: e.target.value })} style={input} autoFocus={flagged} /></Field>
            <Field label="Author"><input value={b.author} onChange={(e) => onChange({ ...b, author: e.target.value })} style={input} /></Field>
          <Field label="Subject"><SubjectPicker value={b.subject} onChange={(s) => onChange({ ...b, subject: s })} /></Field>
          <Field label="Format">
            <select value={b.format} onChange={(e) => onChange({ ...b, format: e.target.value })} style={input}>
              {Object.entries(FORMATS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Pages"><input value={b.pages || ""} onChange={(e) => onChange({ ...b, pages: Number(e.target.value) || null })} style={input} inputMode="numeric" /></Field>
          <Field label="Spine colour">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {SPINE_COLORS.map((sc) => (
                <button key={sc.k} onClick={() => onChange({ ...b, color: sc.k, hex: sc.hex })} title={sc.k}
                  style={{ width: 16, height: 16, borderRadius: 2, background: sc.hex, cursor: "pointer", border: b.color === sc.k ? `2px solid ${C.amber}` : `1px solid ${C.rule}` }} />
              ))}
            </div>
          </Field>
        </div>
        {b.keywords?.length > 0 && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 5 }}>
            {b.keywords.map((k) => (
              <button key={k} onClick={() => onKeyword?.(k)}
                style={{ background: "transparent", border: `1px solid ${C.rule}`, borderRadius: 20, color: C.dim, fontFamily: MONO, fontSize: 10.5, padding: "3px 9px", cursor: onKeyword ? "pointer" : "default", maxWidth: "100%", overflowWrap: "break-word", textAlign: "left" }}>
                {k}
              </button>
            ))}
          </div>
        )}
        <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 190 }}>
            <Field label="Cover image URL">
              <input value={b.coverUrl || ""} onChange={(e) => { setCoverFailed(false); onChange({ ...b, coverUrl: e.target.value.trim() }); }}
                placeholder="paste a direct image link" style={{ ...input, width: "100%" }} />
            </Field>
          </div>
          <button onClick={findCoverNow} disabled={coverBusy} style={{ ...btn, padding: "6px 10px", fontSize: 11 }}>
            {coverBusy ? "Looking…" : "Find a cover"}
          </button>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>
              Summary{b.summarySource ? ` · ${b.summarySource}` : ""}
            </div>
            {b.title && (
              <button onClick={fetchSyn} disabled={syn} style={{ ...btn, padding: "2px 8px", fontSize: 10 }}>
                {syn ? "Fetching…" : b.summary ? "Fetch again" : "Fetch a summary"}
              </button>
            )}
          </div>
          <textarea
            value={b.summary || ""}
            onChange={(e) => onChange({ ...b, summary: e.target.value, summarySource: "Written by you" })}
            placeholder="What this book is, in your own words — or fetch one."
            style={{ ...input, width: "100%", minHeight: 70, lineHeight: 1.55 }}
          />
        </div>
        {library && library.length > 3 && b.title && !flagged && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.rule}`, paddingTop: 12 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginBottom: 8 }}>If you liked this</div>
            <SimilarList b={b} books={library} simIndex={simIndex} compact onSelect={onOpenBook} />
          </div>
        )}
        </div>
      )}
    </div>
  );
}
function SubjectPicker({ value, onChange }) {
  const known = SUBJECTS.includes(value);
  const [custom, setCustom] = useState(known ? "" : value || "");
  const [mode, setMode] = useState(known ? "list" : "custom");
  const [busy, setBusy] = useState(false);
  const [tip, setTip] = useState(null);

  const check = async (raw) => {
    const q = raw.trim();
    if (!q) return;
    onChange(q);
    setBusy(true);
    setTip(null);
    const s = await suggestSubject(q);
    setBusy(false);
    if (s && s.bucket.toLowerCase() !== q.toLowerCase()) setTip({ ...s, typed: q });
    else if (s?.source === "exact") { onChange(s.bucket); setMode("list"); }
  };

  return (
    <div>
      {mode === "list" ? (
        <select
          value={value}
          onChange={(e) => { if (e.target.value === "__custom") { setMode("custom"); setCustom(""); } else onChange(e.target.value); }}
          style={{ ...input, width: "100%" }}
        >
          {!known && value && <option value={value}>{value}</option>}
          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          <option value="__custom">Type my own…</option>
        </select>
      ) : (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onBlur={() => check(custom)}
            onKeyDown={(e) => e.key === "Enter" && check(custom)}
            placeholder="e.g. Yearbook"
            style={{ ...input, flex: 1, minWidth: 0 }}
            autoFocus
          />
          <button onClick={() => { setMode("list"); setTip(null); }} style={{ ...btn, padding: "4px 8px", fontSize: 11 }}>List</button>
        </div>
      )}
      {busy && <div style={{ fontFamily: MONO, fontSize: 10, color: C.amber, marginTop: 5 }}>Checking…</div>}
      {tip && (
        <div style={{ border: `1px solid ${C.amber}`, borderRadius: 3, padding: "8px 9px", marginTop: 6 }}>
          <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.text, lineHeight: 1.5 }}>
            Shelve “{tip.typed}” under <strong style={{ color: C.amber, fontWeight: 500 }}>{tip.bucket}</strong>?
            {tip.heading && <span style={{ color: C.dim }}> Libraries file this as {tip.heading}.</span>}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 7 }}>
            <button onClick={() => { onChange(tip.bucket); setMode("list"); setTip(null); }} style={{ ...btn, padding: "4px 9px", fontSize: 11, color: C.amber, borderColor: C.amber }}>Use it</button>
            <button onClick={() => { onChange(tip.typed); setTip(null); }} style={{ ...btn, padding: "4px 9px", fontSize: 11 }}>Keep “{tip.typed}”</button>
          </div>
        </div>
      )}
    </div>
  );
}

function SimilarList({ b, books, simIndex, onSelect, compact }) {
  const hits = useMemo(() => similarBooks(b, books, simIndex, compact ? 4 : 6), [b, books, simIndex, compact]);
  if (!hits.length) {
    return (
      <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dimmer, lineHeight: 1.6 }}>
        Nothing else in the library sits close to this one yet. Similarity gets sharper as more books gain keywords.
      </div>
    );
  }
  return (
    <div style={{ display: "grid", gap: 6, gridTemplateColumns: "minmax(0, 1fr)" }}>
      {hits.map(({ book, why }) => (
        <div key={book.id} onClick={() => onSelect?.(book)}
          style={{ display: "flex", alignItems: "center", gap: 9, padding: "5px 7px", border: `1px solid ${C.rule}`, borderRadius: 3, cursor: onSelect ? "pointer" : "default", minWidth: 0, overflow: "hidden" }}>
          {book.coverUrl
            ? <img src={book.coverUrl} alt="" style={{ width: 22, height: 32, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
            : <div style={{ width: 5, height: 32, background: spineHex(book), borderRadius: 1, flexShrink: 0 }} />}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: SANS, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{book.title}</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {book.author || "unknown author"} · {why}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function BookDetail({ b, books, simIndex, shelfLabel, onChange, onSelect, onClose }) {
  const [syn, setSyn] = useState(false);
  const fetchSyn = async () => {
    setSyn(true);
    const patch = await fetchSummary(b);
    if (patch.summary) onChange?.({ ...b, ...patch });
    setSyn(false);
  };
  const rows = [
    ["Author", b.author || "—"],
    ["Published", b.year || "—"],
    ["Pages", b.pages || "—"],
    ["Format", (FORMATS[b.format] || FORMATS.trade).label],
    ["Spine", `${spineCm(b)} × ${heightCm(b)} cm`],
    ["Subject", b.subject],
    ["ISBN", b.isbn || "—"],
    ["Sits on", shelfLabel || "—"],
  ];
  return (
    <div onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(8,8,7,0.72)", zIndex: 60, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "5vh 16px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()}
        style={{ background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 4, maxWidth: 620, width: "100%", padding: 18, boxSizing: "border-box", overflowWrap: "break-word" }}>
        <div style={{ display: "flex", gap: 15 }}>
          {b.coverUrl
            ? <img src={b.coverUrl} alt="" style={{ width: 96, borderRadius: 3, flexShrink: 0, alignSelf: "flex-start" }} />
            : <div style={{ width: 20, height: 130, background: spineHex(b), borderRadius: 2, flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: 19, lineHeight: 1.25 }}>{b.title || "Not identified"}</div>
            {b.where && <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.warn, marginTop: 6 }}>{b.where}</div>}
            <table style={{ marginTop: 10, borderCollapse: "collapse", tableLayout: "fixed", width: "100%" }}>
              <tbody>
                {rows.map(([k, v]) => (
                  <tr key={k}>
                    <td style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, padding: "3px 14px 3px 0", verticalAlign: "top" }}>{k}</td>
                    <td style={{ fontFamily: SANS, fontSize: 13, padding: "3px 0", overflowWrap: "break-word" }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={onClose} style={{ ...btn, padding: "3px 9px", fontSize: 12, alignSelf: "flex-start" }}>Close</button>
        </div>

        {b.keywords?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
            {b.keywords.map((k) => (
              <span key={k} style={{ border: `1px solid ${C.rule}`, borderRadius: 20, color: C.dim, fontFamily: MONO, fontSize: 10.5, padding: "3px 9px" }}>{k}</span>
            ))}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>Summary{b.summarySource ? ` · ${b.summarySource}` : ""}</div>
            {b.title && <button onClick={fetchSyn} disabled={syn} style={{ ...btn, padding: "2px 8px", fontSize: 10 }}>{syn ? "Fetching…" : b.summary ? "Fetch again" : "Fetch a summary"}</button>}
          </div>
          {b.summary
            ? <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, lineHeight: 1.65, whiteSpace: "pre-wrap", overflowWrap: "break-word", maxWidth: "100%" }}>{b.summary}</div>
            : <div style={{ fontFamily: SANS, fontSize: 13, color: C.dimmer }}>No summary yet.</div>}
        </div>

        <div style={{ marginTop: 18, borderTop: `1px solid ${C.rule}`, paddingTop: 14 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginBottom: 8 }}>Similar in your library</div>
          <SimilarList b={b} books={books} simIndex={simIndex} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}




/* ═══════════════════════  DUPLICATES  ═══════════════════════ */

const flatTitle = (t) => String(t || "").toLowerCase().replace(/[^a-z0-9à-ÿ]/g, "");

/* Graded rather than binary. A shared ISBN is near-certain; a shared title
   with no author is worth showing but not worth acting on unprompted. */
function dupeScore(a, b) {
  const ai = String(a.isbn || "").replace(/\D/g, "");
  const bi = String(b.isbn || "").replace(/\D/g, "");
  if (ai && ai === bi && ai.length >= 10) return { score: 1, why: "same ISBN" };

  const at = new Set(titleTokens(a.title));
  const bt = new Set(titleTokens(b.title));
  if (!at.size || !bt.size) return null;
  let inter = 0;
  for (const w of at) if (bt.has(w)) inter++;
  const dice = (2 * inter) / (at.size + bt.size);
  if (dice < 0.6) return null;

  const aa = titleTokens(a.author);
  const ba = titleTokens(b.author);
  const sameAuthor = aa.length && ba.length && aa.some((w) => ba.includes(w));
  const exact = flatTitle(a.title) === flatTitle(b.title);

  if (exact && sameAuthor) return { score: 0.98, why: "same title and author" };
  if (dice >= 0.8 && sameAuthor) return { score: 0.9, why: "near-identical title, same author" };
  if (exact) return { score: 0.82, why: "same title, author differs or is missing" };
  if (sameAuthor) return { score: 0.68, why: "similar title, same author" };
  if (dice >= 0.85) return { score: 0.66, why: "near-identical title" };
  return null;
}

/* Only books sharing a title word are ever compared, so this stays quick on a
   large library instead of going quadratic. */
function findDuplicates(books) {
  const byToken = new Map();
  books.forEach((b) => {
    for (const t of new Set(titleTokens(b.title))) {
      if (!byToken.has(t)) byToken.set(t, []);
      byToken.get(t).push(b);
    }
  });

  const pairs = new Map();
  const seen = new Set();
  for (const bucket of byToken.values()) {
    if (bucket.length < 2 || bucket.length > 60) continue;
    for (let i = 0; i < bucket.length; i++)
      for (let j = i + 1; j < bucket.length; j++) {
        const a = bucket[i], b = bucket[j];
        const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if ((a.dupeOk || []).includes(b.id) || (b.dupeOk || []).includes(a.id)) continue;
        const r = dupeScore(a, b);
        if (r && r.score >= 0.65) pairs.set(key, { a, b, ...r });
      }
  }

  const parent = new Map();
  const find = (x) => { while (parent.get(x) !== x) { parent.set(x, parent.get(parent.get(x))); x = parent.get(x); } return x; };
  for (const { a, b } of pairs.values()) {
    if (!parent.has(a.id)) parent.set(a.id, a.id);
    if (!parent.has(b.id)) parent.set(b.id, b.id);
    parent.set(find(a.id), find(b.id));
  }

  const groups = new Map();
  for (const { a, b, score, why } of pairs.values()) {
    const root = find(a.id);
    if (!groups.has(root)) groups.set(root, { books: new Map(), score: 0, why });
    const g = groups.get(root);
    g.books.set(a.id, a);
    g.books.set(b.id, b);
    if (score > g.score) { g.score = score; g.why = why; }
  }

  return [...groups.values()]
    .map((g) => {
      const list = [...g.books.values()];
      // Different years or formats usually means different editions, which is
      // a thing people deliberately own.
      const years = new Set(list.map((b) => b.year).filter(Boolean));
      const editions = years.size > 1 || new Set(list.map((b) => b.format)).size > 1;
      return { books: list, score: g.score, why: g.why, editions };
    })
    .sort((a, b) => b.score - a.score);
}

function DuplicatePanel({ books, onChange, flash }) {
  const groups = useMemo(() => findDuplicates(books), [books]);
  const [open, setOpen] = useState(false);
  if (!groups.length) return null;

  const merge = (group, keepId) => {
    const keep = group.books.find((b) => b.id === keepId);
    const others = group.books.filter((b) => b.id !== keepId);
    const merged = { ...keep };
    for (const o of others) {
      for (const f of ["author", "isbn", "year", "pages", "coverUrl", "summary", "summarySource", "workKey"])
        if (!merged[f] && o[f]) merged[f] = o[f];
      if (!merged.placement && o.placement) merged.placement = o.placement;
      if ((!merged.subject || merged.subject === "Unsorted") && o.subject && o.subject !== "Unsorted") merged.subject = o.subject;
      merged.keywords = [...new Set([...(merged.keywords || []), ...(o.keywords || [])])].slice(0, 10);
    }
    const drop = new Set(others.map((o) => o.id));
    onChange(books.filter((b) => !drop.has(b.id)).map((b) => (b.id === keepId ? merged : b)));
    flash(`Kept “${keep.title}” and folded in ${others.length} other ${others.length === 1 ? "copy" : "copies"}. Anything the keeper was missing was filled from them.`);
  };

  const dismiss = (group) => {
    const ids = group.books.map((b) => b.id);
    onChange(books.map((b) => (ids.includes(b.id) ? { ...b, dupeOk: [...new Set([...(b.dupeOk || []), ...ids.filter((i) => i !== b.id)])] } : b)));
  };

  return (
    <Panel title={`Possible duplicates — ${groups.length}`}>
      {!open ? (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button onClick={() => setOpen(true)} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Review them</button>
          <span style={{ fontFamily: SANS, fontSize: 13, color: C.dim }}>
            {groups.length} {groups.length === 1 ? "set of books looks" : "sets of books look"} like the same title entered twice.
          </span>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {groups.map((g, gi) => (
              <div key={gi} style={{ border: `1px solid ${C.rule}`, borderRadius: 3, padding: 10 }}>
                <div style={{ fontFamily: MONO, fontSize: 10.5, color: g.score > 0.9 ? C.warn : C.amber, marginBottom: 8 }}>
                  {g.why}
                  {g.editions && " · different years or formats, so these may be editions you meant to keep"}
                </div>
                {g.books.map((b) => (
                  <div key={b.id} style={{ display: "flex", gap: 9, alignItems: "center", padding: "5px 0", flexWrap: "wrap" }}>
                    {b.coverUrl
                      ? <img src={b.coverUrl} alt="" style={{ width: 22, height: 32, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />
                      : <div style={{ width: 5, height: 32, background: spineHex(b), borderRadius: 1, flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <div style={{ fontFamily: SANS, fontSize: 13 }}>{b.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>
                        {[b.author, b.year, b.isbn, (FORMATS[b.format] || FORMATS.trade).label, b.placement ? "placed" : "unplaced"].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button onClick={() => merge(g, b.id)} style={{ ...btn, padding: "4px 9px", fontSize: 11, flexShrink: 0 }}>Keep this one</button>
                  </div>
                ))}
                <button onClick={() => dismiss(g)} style={{ ...btn, padding: "4px 9px", fontSize: 11, marginTop: 6 }}>Not duplicates</button>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.dim, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
            Keeping one folds the others into it — anything the keeper is missing, like a cover, an ISBN or a shelf placement, is taken from the copies before they go. “Not duplicates” remembers the decision and won't raise that set again.
          </p>
          <button onClick={() => setOpen(false)} style={{ ...btn, marginTop: 8 }}>Close</button>
        </>
      )}
    </Panel>
  );
}

/* ═══════════  PLACING BOOKS ALREADY IN THE CATALOGUE  ═══════════ */

function titleTokens(t) {
  return String(t || "").toLowerCase().replace(/[^a-z0-9à-ÿ ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}

/* Dice coefficient over title words, nudged by the author. Deliberately
   forgiving: a spine read as "Decline & Fall Vol II" should still find
   "The Decline and Fall of the Roman Empire". */
function matchBook(cand, books) {
  const ct = titleTokens(cand.title);
  if (!ct.length) return null;
  const cset = new Set(ct);
  const cauth = titleTokens(cand.author);
  let best = null, bs = 0;
  for (const b of books) {
    const bt = new Set(titleTokens(b.title));
    if (!bt.size) continue;
    let inter = 0;
    for (const w of cset) if (bt.has(w)) inter++;
    if (!inter) continue;
    let sc = (2 * inter) / (cset.size + bt.size);
    const bauth = titleTokens(b.author);
    if (cauth.length && bauth.some((w) => cauth.includes(w))) sc += 0.25;
    if (sc > bs) { bs = sc; best = b; }
  }
  return bs >= 0.45 ? { book: best, score: bs } : null;
}

async function readPlacementPhoto(b64, mediaType, cubes) {
  const divider =
    cubes > 1
      ? `This photo shows a row of ${cubes} compartments separated by vertical dividers. For every book, "cu" is which compartment it sits in, counted 1 to ${cubes} from the left. Use the dividers to decide, not the spacing. `
      : `This photo shows one shelf. Set "cu" to 1 for every book. `;
  const { text, truncated } = await askClaude(
    [
      { type: "image", source: { type: "base64", media_type: mediaType, data: b64 } },
      {
        type: "text",
        text:
          `${divider}Read every book you can, left to right. Titles and authors only — no colours, no formats. ` +
          `Include books whose title you cannot read, with "t" empty and "x" describing where they sit. ` +
          `Reply with ONLY a minified JSON array, at most 24 objects: [{"t":title,"a":author or null,"cu":compartment number,"x":locator when the title is unreadable}]`,
      },
    ],
    false
  );
  const raw = parseJson(text);
  return {
    list: (Array.isArray(raw) ? raw : [raw]).filter(Boolean).map((d, i) => ({
      key: `${i}`,
      title: String(d.t || "").trim(),
      author: String(d.a || "").trim(),
      cu: Math.max(1, Math.min(Number(d.cu) || 1, cubes || 1)),
      where: String(d.x || "").slice(0, 90),
    })),
    truncated,
  };
}

function PlaceFromPhoto({ kase, books, onBooks, flash }) {
  const cols = kase.cols || 1;
  const rows = Math.ceil(kase.shelves.length / cols);
  const [scope, setScope] = useState(cols > 1 ? "row" : "shelf");
  const [target, setTarget] = useState(0);          // row index, or shelf index
  const [busy, setBusy] = useState(null);
  const [rows_, setRows_] = useState(null);         // review list
  const camRef = useRef(null);
  const fileRef = useRef(null);

  const cubes = scope === "row" ? cols : 1;
  const targetName =
    scope === "row"
      ? cols > 1 ? `Row ${target + 1} — all ${cols} cubes` : `Shelf ${target + 1}`
      : kase.shelves[target]?.label || "—";

  const shelfIdFor = (cu) =>
    scope === "row" ? kase.shelves[target * cols + (cu - 1)]?.id : kase.shelves[target]?.id;

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy("Reading the shelf");
    try {
      const { b64, type } = await toBase64(file, 1300, 0.74);
      const { list, truncated } = await readPlacementPhoto(b64, type, cubes);
      if (truncated) flash("The reply ran out of room — photograph fewer compartments at a time.");
      const reviewed = list.map((d) => {
        const m = d.title ? matchBook(d, books) : null;
        return { ...d, bookId: m?.book?.id || "", score: m?.score || 0, shelfId: shelfIdFor(d.cu) || "" };
      });
      setRows_(reviewed);
      const hit = reviewed.filter((r) => r.bookId).length;
      flash(`${hit} of ${reviewed.length} matched your catalogue.`);
    } catch (err) {
      flash(err?.message || "That photo couldn't be read.");
    }
    setBusy(null);
    e.target.value = "";
  };

  const apply = () => {
    const on = new Date().toISOString().slice(0, 10);
    const perShelf = new Map();
    let next = [...books];
    let placed = 0, added = 0;
    for (const r of rows_ || []) {
      if (!r.shelfId || r.bookId === "skip") continue;
      const n = perShelf.get(r.shelfId) || 0;
      perShelf.set(r.shelfId, n + 1);
      const idx = kase.shelves.findIndex((x) => x.id === r.shelfId);
      const placement = { caseId: kase.id, shelfId: r.shelfId, pos: idx * 1000 + n, on };
      if (r.bookId) {
        next = next.map((b) => (b.id === r.bookId ? { ...b, placement } : b));
        placed++;
      } else if (r.bookId === "" && r.title) {
        next = [{ ...normaliseBook({ title: r.title, author: r.author }), id: uid(), cap: { t: Date.now(), i: n }, placement }, ...next];
        added++;
      }
    }
    onBooks(next);
    setRows_(null);
    if (scope === "row" && target + 1 < rows) setTarget(target + 1);
    else if (scope === "shelf" && target + 1 < kase.shelves.length) setTarget(target + 1);
    flash(`${placed} placed${added ? `, ${added} added as new` : ""}. ${scope === "row" ? "Row" : "Opening"} advanced — photograph the next one.`);
  };

  return (
    <Panel title="Place books from a photo">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {cols > 1 && (
          <select value={scope} onChange={(e) => { setScope(e.target.value); setTarget(0); setRows_(null); }} style={{ ...input, maxWidth: 190 }}>
            <option value="row">A whole row at once</option>
            <option value="shelf">One cube at a time</option>
          </select>
        )}
        <select value={target} onChange={(e) => { setTarget(Number(e.target.value)); setRows_(null); }} style={{ ...input, maxWidth: 210 }}>
          {scope === "row"
            ? Array.from({ length: rows }, (_, i) => <option key={i} value={i}>Row {i + 1}</option>)
            : kase.shelves.map((sh, i) => <option key={sh.id} value={i}>{sh.label}</option>)}
        </select>
        <button onClick={() => camRef.current?.click()} style={{ ...btn, borderColor: C.amber, color: C.amber }} disabled={!!busy}>Photograph it</button>
        <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
        <button onClick={() => fileRef.current?.click()} style={btn} disabled={!!busy}>Upload</button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} style={{ display: "none" }} />
      </div>

      <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.amber, marginTop: 10 }}>
        Next: photograph {targetName}
      </div>
      <p style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 8, maxWidth: 620 }}>
        {cols > 1 && scope === "row"
          ? `Get the whole row in frame with the dividers visible — the scan uses them to work out which cube each book is in, and splits them across the ${cols} openings. Titles are matched against books already in your catalogue, so nothing is duplicated.`
          : "Get the opening square-on. Titles are matched against books already in your catalogue and placed here; anything unrecognised can be added as new or skipped."}
        {" "}The target advances by itself after each batch, so you can work along the case.
      </p>
      {busy && <div style={{ fontFamily: MONO, fontSize: 12, color: C.amber, marginTop: 8 }}>{busy}…</div>}

      {rows_ && (
        <div style={{ marginTop: 14 }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 460 }}>
              <thead><tr><th style={th}>Read from the photo</th><th style={th}>Matched to</th><th style={th}>Goes in</th></tr></thead>
              <tbody>
                {rows_.map((r, i) => (
                  <tr key={r.key}>
                    <td style={{ ...td, fontSize: 12.5 }}>
                      {r.title || <span style={{ color: C.warn }}>unreadable — {r.where || "no locator"}</span>}
                      {r.author && <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer }}>{r.author}</div>}
                    </td>
                    <td style={td}>
                      <select value={r.bookId} onChange={(e) => setRows_(rows_.map((x, j) => (j === i ? { ...x, bookId: e.target.value } : x)))}
                        style={{ ...input, fontSize: 12, padding: "4px 6px", maxWidth: 220 }}>
                        <option value="">{r.title ? "Add as a new book" : "Nothing"}</option>
                        <option value="skip">Skip it</option>
                        {books.map((b) => (
                          <option key={b.id} value={b.id}>{b.title}{b.author ? ` — ${b.author}` : ""}</option>
                        ))}
                      </select>
                      {r.score > 0 && r.bookId && (
                        <div style={{ fontFamily: MONO, fontSize: 9.5, color: r.score > 0.7 ? C.good : C.amber }}>
                          {r.score > 0.7 ? "confident" : "check this one"}
                        </div>
                      )}
                    </td>
                    <td style={td}>
                      <select value={r.shelfId} onChange={(e) => setRows_(rows_.map((x, j) => (j === i ? { ...x, shelfId: e.target.value } : x)))}
                        style={{ ...input, fontSize: 12, padding: "4px 6px", maxWidth: 170 }}>
                        {kase.shelves.map((sh) => <option key={sh.id} value={sh.id}>{sh.label}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={apply} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Place these</button>
            <button onClick={() => setRows_(null)} style={btn}>Discard</button>
          </div>
        </div>
      )}
    </Panel>
  );
}

/* Bookcases positioned as they stand in the room. Coordinates are stored as
   percentages so the plan survives a resize or a different screen. */
function RoomView({ cases, books, activeId, onSelect, onMove, onDropBook, dragId, moving }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(null);

  const down = (e, k) => {
    const field = ref.current.getBoundingClientRect();
    const cx = ((k.x ?? 10) / 100) * field.width;
    const cy = ((k.y ?? 10) / 100) * field.height;
    setDrag({ id: k.id, dx: e.clientX - field.left - cx, dy: e.clientY - field.top - cy });
    e.currentTarget.setPointerCapture(e.pointerId);
    onSelect(k.id);
  };
  const move = (e) => {
    if (!drag) return;
    const field = ref.current.getBoundingClientRect();
    const x = ((e.clientX - field.left - drag.dx) / field.width) * 100;
    const y = ((e.clientY - field.top - drag.dy) / field.height) * 100;
    onMove(drag.id, Math.max(0, Math.min(92, x)), Math.max(0, Math.min(88, y)));
  };

  return (
    <>
      <div ref={ref} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)}
        style={{ position: "relative", height: 300, background: "#16151300", backgroundImage: `linear-gradient(${C.rule} 1px, transparent 1px), linear-gradient(90deg, ${C.rule} 1px, transparent 1px)`, backgroundSize: "28px 28px", border: `1px solid ${C.rule}`, borderRadius: 3, overflow: "hidden", touchAction: "none" }}>
        {cases.map((k) => {
          const cols = k.cols || 1;
          const rows = Math.ceil(k.shelves.length / cols);
          const wCm = (k.shelves[0]?.widthCm || 80) * cols;
          const w = Math.max(34, Math.min(wCm * 0.55, 190));
          const count = books.filter((b) => b.placement?.caseId === k.id).length;
          const on = k.id === activeId;
          return (
            <div key={k.id} onPointerDown={(e) => down(e, k)}
              onDragOver={(e) => { if (dragId) e.preventDefault(); }}
              onDrop={(e) => { e.preventDefault(); if (dragId) onDropBook?.(dragId, k.id); }}
              onClick={() => { if (moving) onDropBook?.(moving, k.id); }}
              style={{ position: "absolute", left: `${k.x ?? 10}%`, top: `${k.y ?? 10}%`, width: w, cursor: "grab", userSelect: "none",
                outline: (dragId || moving) && !on ? `1px dashed ${C.good}` : "none", outlineOffset: 3 }}>
              <div style={{ background: C.wood, border: `1px solid ${on ? C.amber : "#4A3B2E"}`, borderRadius: 2, padding: 3, display: "grid", gap: 2, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {k.shelves.map((sh) => (
                  <div key={sh.id} style={{ height: Math.max(4, Math.min(sh.heightCm * 0.32, 14)), background: "#241C15", borderRadius: 1 }} />
                ))}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9.5, color: on ? C.amber : C.dim, marginTop: 3, lineHeight: 1.3 }}>
                {k.name}
                <div style={{ color: C.dimmer }}>{cols > 1 ? `${cols}×${rows}` : `${k.shelves.length} shelves`} · {count} books</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer, marginTop: 8 }}>
        Drag to match the room · click to select · the selected case is the one shown below
      </div>
    </>
  );
}

/* ─────────────────────────  SHELVES  ───────────────────────── */

function ShelvesTab({ books, onBooks, cases, onCases, simIndex, flash }) {
  const [caseId, setCaseId] = useState(cases[0]?.id);
  const [method, setMethod] = useState("current");
  const [hover, setHover] = useState(null);
  const [rearrange, setRearrange] = useState(false);
  const [detail, setDetail] = useState(null);
  const detailBook = detail ? books.find((x) => x.id === detail.id) : null;
  const kase = cases.find((c) => c.id === caseId) || cases[0];
  const [design, setDesign] = useState(null);
  const [designing, setDesigning] = useState(false);
  const plan = useMemo(() => (kase ? arrange(books, kase, method, design) : null), [books, kase, method, design]);

  const runDesign = async () => {
    setDesigning(true);
    try { setDesign(await designShelves(books, kase)); }
    catch { setDesign({ principle: "The design pass didn't come back — try again.", tips: [], shelves: [] }); }
    setDesigning(false);
  };
  const [armed, setArmed] = useState(false);
  const placedCount = books.filter((b) => b.placement?.caseId === kase?.id).length;
  const placedAt = books.find((b) => b.placement?.caseId === kase?.id)?.placement?.on || "";

  // Records the plan on screen as the physical truth: shelf plus a running
  // position, so order survives even if shelves are later resized.
  const applyLayout = () => {
    const map = new Map();
    let pos = 0;
    const on = new Date().toISOString().slice(0, 10);
    for (const s of plan.shelves)
      for (const b of s.books) map.set(b.id, { caseId: kase.id, shelfId: s.id, pos: pos++, on });
    onBooks(books.map((b) => (map.has(b.id) ? { ...b, placement: map.get(b.id) } : b)));
  };

  const [armedDelete, setArmedDelete] = useState(null);
  const [moving, setMoving] = useState(null);   // tap-to-move, for touch
  const [dragId, setDragId] = useState(null);   // native drag, for a mouse
  const [dropOn, setDropOn] = useState(null);

  /* One book onto one opening. Position is the shelf's index plus how many are
     already on it, so it lands at the right-hand end and the order holds. */
  const placeBook = (bookId, targetCaseId, shelfId) => {
    const k = cases.find((c) => c.id === targetCaseId);
    if (!k) return;
    const idx = k.shelves.findIndex((x) => x.id === shelfId);
    if (idx < 0) return;
    const already = books.filter((b) => b.id !== bookId && b.placement?.caseId === targetCaseId && b.placement?.shelfId === shelfId).length;
    const on = new Date().toISOString().slice(0, 10);
    onBooks(books.map((b) => (b.id === bookId ? { ...b, placement: { caseId: targetCaseId, shelfId, pos: idx * 1000 + already, on } } : b)));
    setMoving(null);
    setDragId(null);
    setDropOn(null);
  };

  const dropToCase = (bookId, targetCaseId) => {
    const k = cases.find((c) => c.id === targetCaseId);
    const b = books.find((x) => x.id === bookId);
    if (!k || !b) return;
    const fits = k.shelves.find((sh) => {
      const used = books.filter((x) => x.id !== bookId && x.placement?.shelfId === sh.id).reduce((a, x) => a + spineCm(x), 0);
      return heightCm(b) <= sh.heightCm - 1 && used + spineCm(b) <= sh.widthCm;
    });
    if (fits) placeBook(bookId, k.id, fits.id);
    else { setMoving(null); setDragId(null); }
  };

  const addEmptyCase = () => {
    const k = {
      id: uid(), name: `Bookcase ${cases.length + 1}`, room: "", cols: 1,
      shelves: [1, 2, 3, 4].map((n) => ({ id: uid(), label: `Shelf ${n}`, widthCm: 80, heightCm: 30 })),
      x: 6 + (cases.length * 17) % 70, y: 8 + (cases.length % 3) * 26,
    };
    onCases([...cases, k]);
    setCaseId(k.id);
  };

  const deleteCase = () => {
    const gone = kase.id;
    const rest = cases.filter((c) => c.id !== gone);
    // Books survive; they just stop being placed anywhere.
    onBooks(books.map((b) => (b.placement?.caseId === gone ? { ...b, placement: undefined } : b)));
    onCases(rest);
    setArmedDelete(null);
    if (rest.length) setCaseId(rest[0].id);
  };

  const clearLayout = () => {
    onBooks(books.map((b) => (b.placement?.caseId === kase.id ? { ...b, placement: undefined } : b)));
  };

  if (!kase)
    return (
      <Panel title="The room">
        <Empty>No bookcases yet. Add an empty one and set its dimensions, search for a model below, or photograph a case in the Books tab.</Empty>
        <button onClick={addEmptyCase} style={{ ...btn, marginTop: 10 }}>Add an empty bookcase</button>
      </Panel>
    );

  const setShelf = (sid, patch) =>
    onCases(cases.map((c) => c.id !== kase.id ? c : { ...c, shelves: c.shelves.map((s) => (s.id === sid ? { ...s, ...patch } : s)) }));

  const addShelf = () =>
    onCases(cases.map((c) => c.id !== kase.id ? c : { ...c, shelves: [...c.shelves, { id: uid(), label: `Shelf ${c.shelves.length + 1}`, widthCm: 90, heightCm: 28 }] }));

  const scale = 3.0;
  const planText = plan.shelves.map((s) =>
    `${s.label} (${Math.round(s.usedCm)}/${s.widthCm} cm)\n` + s.books.map((b, i) => `  ${i + 1}. ${b.title} — ${b.author}`).join("\n")
  ).join("\n\n");

  return (
    <>
      <Panel title="Arrangement">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} style={input}>
            {cases.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {Object.entries(METHODS).map(([k, m]) => (
            <button key={k} onClick={() => setMethod(k)} style={{ ...btn, color: method === k ? C.amber : C.dim, borderColor: method === k ? C.amber : C.rule }}>{m.label}</button>
          ))}
        </div>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.dim, lineHeight: 1.6, maxWidth: 620, margin: 0 }}>{METHODS[method].blurb}</p>

        {method === "designer" && (
          <div style={{ marginTop: 14 }}>
            <button onClick={runDesign} style={{ ...btn, borderColor: C.amber, color: C.amber }} disabled={designing || !books.length}>
              {designing ? "Working through the collection…" : design ? "Design it again" : "Design this bookcase"}
            </button>
            {design && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.text, lineHeight: 1.6, maxWidth: 620 }}>{design.principle}</div>
                {design.shelves.length > 0 && (
                  <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                    <thead><tr><th style={th}>Opening</th><th style={th}>Programme</th><th style={th}>Why</th></tr></thead>
                    <tbody>
                      {design.shelves.map((sh) => (
                        <tr key={sh.n}>
                          <td style={{ ...td, fontFamily: MONO, fontSize: 11.5 }}>{sh.n}</td>
                          <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.amber }}>
                            {sh.rule}{sh.subject ? `: ${sh.subject}` : ""}{sh.gap ? ` · ${sh.gap} cm free` : ""}
                          </td>
                          <td style={{ ...td, fontSize: 12.5, color: C.dim }}>{sh.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {design.tips.length > 0 && (
                  <ul style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.65, marginTop: 10, paddingLeft: 18, maxWidth: 620 }}>
                    {design.tips.map((t, i) => <li key={i}>{t}</li>)}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        {method !== "current" && books.length > 0 && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.rule}`, paddingTop: 12 }}>
            {armed ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>
                  Have you physically moved the books to match this? {placedCount > 0 ? "It replaces the layout already recorded." : ""}
                </span>
                <button onClick={() => { applyLayout(); setArmed(false); setMethod("current"); }} style={{ ...btn, borderColor: C.amber, color: C.amber }}>Yes, record it</button>
                <button onClick={() => setArmed(false)} style={btn}>Not yet</button>
              </div>
            ) : (
              <button onClick={() => setArmed(true)} style={btn}>Set as current bookcase layout</button>
            )}
          </div>
        )}

        {method === "current" && (
          <div style={{ marginTop: 14, borderTop: `1px solid ${C.rule}`, paddingTop: 12, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: plan?.source === "baseline" ? C.good : C.dimmer }}>
              {plan?.source === "baseline"
                ? `Baseline recorded${placedAt ? ` ${placedAt}` : ""} · ${placedCount} placed`
                : "No baseline recorded — showing capture order"}
            </span>
            {plan?.source === "baseline" && (
              <button onClick={clearLayout} style={{ ...btn, padding: "4px 9px", fontSize: 11 }}>Clear baseline</button>
            )}
          </div>
        )}
      </Panel>

      <Panel title={kase.name}>
        {method === "current" && books.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
            <button onClick={() => { setRearrange(!rearrange); setMoving(null); }}
              style={{ ...btn, color: rearrange ? C.good : C.dim, borderColor: rearrange ? C.good : C.rule }}>
              {rearrange ? "Done rearranging" : "Rearrange books"}
            </button>
            <span style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer }}>
              {rearrange
                ? moving
                  ? `Moving “${books.find((b) => b.id === moving)?.title || ""}” — tap the ${unitWord(kase)} it goes in`
                  : `Drag a spine, or tap one then tap its new ${unitWord(kase)}. Drop onto a bookcase in the room to send it there.`
                : "Turn on to move books between shelves and bookcases"}
            </span>
          </div>
        )}
        {books.length === 0 ? (
          <Empty>Catalogue some books and they'll lay themselves out here.</Empty>
        ) : (
          <div style={{ overflowX: "auto", paddingBottom: 8 }}>
            <div style={{ display: "inline-block", background: C.wood, padding: "0 10px 10px", borderRadius: 3 }}>
              {chunk(plan.shelves, kase.cols || 1).map((row, ri) => (
                <div key={ri} style={{ display: "flex", gap: (kase.cols || 1) > 1 ? 6 : 0 }}>
              {row.map((s) => (
                <div key={s.id} style={{ paddingTop: 10 }}>
                  <div
                    onDragOver={(e) => { if (rearrange && dragId) { e.preventDefault(); setDropOn(s.id); } }}
                    onDragLeave={() => setDropOn((v) => (v === s.id ? null : v))}
                    onDrop={(e) => { e.preventDefault(); if (dragId) placeBook(dragId, kase.id, s.id); }}
                    onClick={() => { if (rearrange && moving) placeBook(moving, kase.id, s.id); }}
                    style={{ display: "flex", alignItems: "flex-end", gap: 1, height: s.heightCm * scale, borderBottom: `4px solid #241C15`, minWidth: s.widthCm * scale,
                      background: dropOn === s.id ? "rgba(233,161,59,0.18)" : moving ? "rgba(111,163,107,0.10)" : "transparent",
                      outline: dropOn === s.id ? `1px dashed ${C.amber}` : "none" }}>
                    {s.books.map((b) => {
                      const hx = spineHex(b);
                      const w = Math.max(spineCm(b) * scale, 5);
                      const h = heightCm(b) * scale;
                      const light = hslOf(hx).l > 0.62;
                      return (
                        <div key={b.id}
                          draggable={rearrange}
                          onDragStart={() => setDragId(b.id)}
                          onDragEnd={() => { setDragId(null); setDropOn(null); }}
                          onMouseEnter={(e) => setHover({ b, shelf: s.label, x: e.clientX, y: e.clientY })}
                          onMouseMove={(e) => setHover((v) => (v && v.b.id === b.id ? { ...v, x: e.clientX, y: e.clientY } : v))}
                          onMouseLeave={() => setHover((v) => (v && v.b.id === b.id ? null : v))}
                          onClick={() => {
                            setHover(null);
                            if (rearrange) setMoving(moving === b.id ? null : b.id);
                            else setDetail({ id: b.id, shelf: s.label });
                          }}
                          style={{ width: w, height: h, background: hx, borderRadius: "1px 1px 0 0", boxShadow: "inset -2px 0 0 rgba(0,0,0,0.18)", position: "relative", overflow: "hidden", flexShrink: 0, cursor: rearrange ? "grab" : "pointer",
                            opacity: dragId === b.id ? 0.35 : 1,
                            outline: moving === b.id ? `2px solid ${C.good}` : hover?.b?.id === b.id ? `2px solid ${C.amber}` : "none", outlineOffset: -2 }}>
                          {w > 13 && (
                            <div style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%) rotate(90deg)", transformOrigin: "center", whiteSpace: "nowrap", fontFamily: MONO, fontSize: 8, color: light ? "#2A2A2A" : "rgba(255,255,255,0.85)", width: h - 14, textAlign: "left" }}>
                              {b.title.slice(0, 26)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(255,255,255,0.4)", paddingTop: 3 }}>
                    {s.label} · {s.books.length} vols · {Math.round(s.usedCm)}/{s.widthCm} cm
                    {s.usedCm / s.widthCm < 0.75 && s.books.length > 0 ? " · room for a bookend" : ""}
                  </div>
                </div>
              ))}
                </div>
              ))}
            </div>
          </div>
        )}
        {plan.unplaced.length > 0 && (
          <div style={{ marginTop: 14, border: `1px solid ${C.warn}`, borderRadius: 3, padding: 10 }}>
            <div style={{ fontFamily: MONO, fontSize: 11, color: C.warn, marginBottom: 6 }}>
              {plan.unplaced.length} {method === "current" && plan.source === "baseline" ? "not on this case" : "didn't fit"}
            </div>
            {plan.unplaced.slice(0, 20).map((b) => (
              <div key={b.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", padding: "3px 0" }}>
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: C.dim, flex: 1, minWidth: 140 }}>
                  {b.title || "Not identified"} <span style={{ color: C.dimmer }}>— {b.reason}</span>
                </div>
                <select
                  value=""
                  onChange={(e) => { const [ci, si] = e.target.value.split("|"); if (si) placeBook(b.id, ci, si); }}
                  style={{ ...input, fontSize: 12, padding: "4px 6px", maxWidth: 230 }}
                >
                  <option value="">Put it somewhere…</option>
                  {cases.map((c) => (
                    <optgroup key={c.id} label={c.name}>
                      {c.shelves.map((sh) => {
                        const used = books.filter((x) => x.placement?.shelfId === sh.id).reduce((a, x) => a + spineCm(x), 0);
                        const room = Math.round(sh.widthCm - used);
                        const tall = heightCm(b) > sh.heightCm - 1;
                        return (
                          <option key={sh.id} value={`${c.id}|${sh.id}`} disabled={tall}>
                            {sh.label} — {tall ? "too short" : `${room} cm free`}
                          </option>
                        );
                      })}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
            {plan.unplaced.length > 20 && (
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.dimmer, marginTop: 6 }}>
                and {plan.unplaced.length - 20} more
              </div>
            )}
          </div>
        )}
        {books.length > 0 && (
          <button onClick={() => navigator.clipboard?.writeText(planText)} style={{ ...btn, marginTop: 14 }}>Copy shelving order</button>
        )}
      </Panel>

      <Panel title={`The room — ${cases.length} ${cases.length === 1 ? "bookcase" : "bookcases"}`}>
        <RoomView cases={cases} books={books} activeId={kase.id} onSelect={setCaseId}
          onMove={(id, x, y) => onCases(cases.map((c) => (c.id === id ? { ...c, x, y } : c)))}
          onDropBook={dropToCase} dragId={dragId} moving={moving} />
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={addEmptyCase} style={btn}>Add an empty bookcase</button>
          {armedDelete === kase.id ? (
            <>
              <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>
                Delete “{kase.name}”?{placedCount ? ` ${placedCount} ${placedCount === 1 ? "book stays" : "books stay"} in the catalogue but lose their shelf.` : ""}
              </span>
              <button onClick={deleteCase} style={{ ...btn, borderColor: C.warn, color: C.warn }}>Yes, delete</button>
              <button onClick={() => setArmedDelete(null)} style={btn}>Keep it</button>
            </>
          ) : (
            <button onClick={() => setArmedDelete(kase.id)} style={{ ...btn, borderColor: C.warn, color: C.warn }}>Delete “{kase.name}”</button>
          )}
        </div>
      </Panel>

      <BookcaseFinder
        onAdd={(spec) => {
          const k = { ...caseFromSpec(spec), x: 6 + (cases.length * 17) % 70, y: 8 + (cases.length % 3) * 26 };
          onCases([...cases, k]);
          setCaseId(k.id);
        }}
      />

      {books.length > 0 && (
        <PlaceFromPhoto kase={kase} books={books} onBooks={onBooks} flash={flash} />
      )}

      <Panel title={`Shelf dimensions — ${kase.name}`}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center" }}>
          <input value={kase.name} onChange={(e) => onCases(cases.map((c) => (c.id === kase.id ? { ...c, name: e.target.value } : c)))} style={{ ...input, width: 220 }} />
          <button onClick={() => setArmedDelete(kase.id)} style={{ ...btn, borderColor: C.warn, color: C.warn }}>Delete this bookcase</button>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>{unitWordCap(kase)}</th><th style={th}>Width cm</th><th style={th}>Clear height cm</th></tr></thead>
          <tbody>
            {kase.shelves.map((s) => (
              <tr key={s.id}>
                <td style={td}><input value={s.label} onChange={(e) => setShelf(s.id, { label: e.target.value })} style={{ ...input, width: 120 }} /></td>
                <td style={td}><input value={s.widthCm} onChange={(e) => setShelf(s.id, { widthCm: Number(e.target.value) || 0 })} style={{ ...input, width: 80 }} inputMode="numeric" /></td>
                <td style={td}><input value={s.heightCm} onChange={(e) => setShelf(s.id, { heightCm: Number(e.target.value) || 0 })} style={{ ...input, width: 80 }} inputMode="numeric" /></td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addShelf} style={{ ...btn, marginTop: 12 }}>Add a shelf</button>
      </Panel>

      {hover && (
        <div style={{
          position: "fixed", zIndex: 50, pointerEvents: "none",
          left: Math.min(hover.x + 14, (typeof window !== "undefined" ? window.innerWidth : 900) - 268),
          top: hover.y + 16, width: 250,
          background: C.panel, border: `1px solid ${C.amber}`, borderRadius: 3, padding: "9px 11px",
          boxShadow: "0 8px 22px rgba(0,0,0,0.45)",
        }}>
          <div style={{ display: "flex", gap: 9 }}>
            {hover.b.coverUrl && (
              <img src={hover.b.coverUrl} alt="" style={{ width: 40, borderRadius: 2, flexShrink: 0, alignSelf: "flex-start" }} />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 13.5, lineHeight: 1.35 }}>{hover.b.title || "Not identified"}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginTop: 4 }}>
                {[hover.b.author, hover.b.year].filter(Boolean).join(" · ") || "—"}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.dim, marginTop: 4 }}>
                {hover.b.subject} · {spineCm(hover.b)} cm · {hover.shelf}
              </div>
            </div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.amber, marginTop: 6 }}>Click for the full record</div>
        </div>
      )}

      {detailBook && (
        <BookDetail
          b={detailBook}
          books={books}
          simIndex={simIndex}
          shelfLabel={detail.shelf}
          onChange={(nb) => onBooks(books.map((x) => (x.id === nb.id ? nb : x)))}
          onSelect={(nb) => setDetail({ id: nb.id, shelf: shelfOf(plan, nb.id) })}
          onClose={() => setDetail(null)}
        />
      )}
    </>
  );
}

function shelfOf(plan, id) {
  for (const s of plan?.shelves || []) if (s.books.some((b) => b.id === id)) return s.label;
  return null;
}

function BookcaseFinder({ onAdd }) {
  const [q, setQ] = useState("");
  const [web, setWeb] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const local = q.trim()
    ? CASE_CATALOGUE.filter((c) => `${c.brand} ${c.name}`.toLowerCase().includes(q.trim().toLowerCase()))
    : [];

  const searchWeb = async () => {
    setBusy(true); setErr(null); setWeb(null);
    try { setWeb(await searchBookcases(q)); }
    catch (e) { setErr(e?.message || "The search came back empty."); }
    setBusy(false);
  };

  const results = [...local, ...(web || [])];

  return (
    <Panel title="Find a bookcase">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input value={q} onChange={(e) => { setQ(e.target.value); setWeb(null); }} placeholder="IKEA Kallax" style={{ ...input, width: 240 }} onKeyDown={(e) => e.key === "Enter" && local.length === 0 && searchWeb()} />
        <button onClick={searchWeb} style={btn} disabled={busy || !q.trim()}>Search beyond the built-in list</button>
      </div>
      {busy && <div style={{ fontFamily: MONO, fontSize: 12, color: C.amber, marginTop: 10 }}>Searching…</div>}
      {err && <div style={{ fontFamily: MONO, fontSize: 12, color: C.warn, marginTop: 10 }}>{err}</div>}

      {q.trim() && !busy && results.length === 0 && (
        <Empty>Nothing matched. Search the web, or build one by hand in the panel below.</Empty>
      )}

      {results.length > 0 && (
        <div style={{ overflowX: "auto", marginTop: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 420 }}>
          <thead><tr><th style={th}>Model</th><th style={th}>Carcass</th><th style={th}>Layout</th><th style={th}>Opening</th><th style={th} /></tr></thead>
          <tbody>
            {results.map((c) => (
              <tr key={c.id}>
                <td style={td}>{c.brand} {c.name}</td>
                <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.dim }}>{c.carcass}</td>
                <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.dim }}>{c.grid[0]} × {c.grid[1]}</td>
                <td style={{ ...td, fontFamily: MONO, fontSize: 11.5, color: C.dim }}>{c.cell[0]} × {c.cell[1]} cm</td>
                <td style={td}><button onClick={() => onAdd(c)} style={{ ...btn, padding: "4px 10px", fontSize: 11 }}>Use this</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
      <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.dimmer, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
        Opening is the usable space inside one shelf or cube, which is what decides whether a book fits. A Kallax 5×5 measures 182 cm on the outside and gives you twenty-five 33 × 33 cm cubes — so it holds no hardcover taller than about 32 cm, whatever the box says.
      </p>
    </Panel>
  );
}

/* ─────────────────────────  VALUABLES  ───────────────────────── */

function ValuablesTab({ items, onChange, flash }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const camRef = useRef(null);

  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const big = await toBase64(file, 1400);
      const d = await readValuablePhoto(big.b64, big.type);
      const id = uid();
      const thumb = await toBase64(file, 420, 0.6);
      await saveKey(K.photo(id), thumb.b64);
      onChange([{
        id, name: d.name || "Unnamed item", brand: d.brand || "", model: d.model || "",
        serial: d.serial || "", category: CATEGORIES.includes(d.category) ? d.category : "Other",
        room: "", estValue: d.estValue || 0, purchaseDate: "", notes: d.notes || "", hasPhoto: true,
      }, ...items]);
    } catch (err) {
      flash(err?.message || "Couldn't read that photo. Add the item by hand instead.");
    }
    setBusy(false);
    e.target.value = "";
  };

  const addBlank = () => onChange([{ id: uid(), name: "", brand: "", model: "", serial: "", category: "Other", room: "", estValue: 0, purchaseDate: "", notes: "", hasPhoto: false }, ...items]);

  return (
    <>
      <Panel title="Add a valuable">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => camRef.current?.click()} style={btn} disabled={busy}>Take a photo</button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={onPhoto} style={{ display: "none" }} />
          <button onClick={() => fileRef.current?.click()} style={btn} disabled={busy}>Upload an image</button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPhoto} style={{ display: "none" }} />
          <button onClick={addBlank} style={btn}>Add by hand</button>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
          Photograph the item, then photograph its serial plate as a second entry if the number isn't legible in the first. A claim stands on three things: an image, a serial, and a purchase price — the fields flagged in the report are the ones an adjuster will ask for.
        </p>
        {busy && <div style={{ fontFamily: MONO, fontSize: 12, color: C.amber, marginTop: 10 }}>Reading the photo…</div>}
      </Panel>

      <Panel title={`Valuables — ${items.length}`}>
        {items.length === 0 ? <Empty>Start with the four or five things you'd most hate to replace.</Empty> : (
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "minmax(0, 1fr)" }}>
            {items.map((it) => (
              <ItemRow key={it.id} it={it}
                onChange={(n) => onChange(items.map((x) => (x.id === it.id ? n : x)))}
                onRemove={() => onChange(items.filter((x) => x.id !== it.id))} />
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}

function ItemRow({ it, onChange, onRemove }) {
  const [open, setOpen] = useState(!it.name);
  const [photo, setPhoto] = useState(null);
  useEffect(() => {
    if (open && it.hasPhoto && !photo) loadKey(K.photo(it.id), null).then(setPhoto);
  }, [open]);
  const gaps = ["serial", "estValue", "room"].filter((f) => !it[f]);
  return (
    <div style={{ border: `1px solid ${C.rule}`, borderRadius: 3, background: C.bg, minWidth: 0, maxWidth: "100%", overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", cursor: "pointer", minWidth: 0 }} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14 }}>{it.name || "Unnamed item"}</div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: gaps.length ? C.warn : C.dimmer, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {it.category}{it.room ? ` · ${it.room}` : ""} · €{Number(it.estValue || 0).toLocaleString("de-DE")}
            {gaps.length ? ` · missing ${gaps.join(", ")}` : " · complete"}
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ ...btn, padding: "4px 9px", fontSize: 11, flexShrink: 0 }}>Remove</button>
      </div>
      {open && (
        <div style={{ borderTop: `1px solid ${C.rule}`, padding: 10, minWidth: 0, boxSizing: "border-box" }}>
          {photo && <img src={`data:image/jpeg;base64,${photo}`} alt="" style={{ maxWidth: 220, borderRadius: 3, marginBottom: 12, display: "block" }} />}
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(min(150px,100%),1fr))" }}>
            <Field label="Name"><input value={it.name} onChange={(e) => onChange({ ...it, name: e.target.value })} style={input} /></Field>
            <Field label="Brand"><input value={it.brand} onChange={(e) => onChange({ ...it, brand: e.target.value })} style={input} /></Field>
            <Field label="Model"><input value={it.model} onChange={(e) => onChange({ ...it, model: e.target.value })} style={input} /></Field>
            <Field label="Serial"><input value={it.serial} onChange={(e) => onChange({ ...it, serial: e.target.value })} style={input} /></Field>
            <Field label="Room"><input value={it.room} onChange={(e) => onChange({ ...it, room: e.target.value })} style={input} /></Field>
            <Field label="Category">
              <select value={it.category} onChange={(e) => onChange({ ...it, category: e.target.value })} style={input}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Replacement value €"><input value={it.estValue} onChange={(e) => onChange({ ...it, estValue: Number(e.target.value) || 0 })} style={input} inputMode="numeric" /></Field>
            <Field label="Purchased"><input value={it.purchaseDate} onChange={(e) => onChange({ ...it, purchaseDate: e.target.value })} placeholder="YYYY-MM" style={input} /></Field>
          </div>
          <Field label="Notes"><textarea value={it.notes} onChange={(e) => onChange({ ...it, notes: e.target.value })} style={{ ...input, width: "100%", minHeight: 54, marginTop: 10 }} /></Field>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  REPORT  ───────────────────────── */

function ReportTab({ books, items, drinks, cases, onBooks, onItems, onDrinks, onCases, flash }) {
  const [payload, setPayload] = useState("");
  const byCat = {};
  items.forEach((i) => { byCat[i.category] = (byCat[i.category] || 0) + (Number(i.estValue) || 0); });
  const total = Object.values(byCat).reduce((a, b) => a + b, 0);
  const incomplete = items.filter((i) => !i.serial || !i.estValue || !i.hasPhoto);

  const bySubject = {};
  books.forEach((b) => { bySubject[b.subject] = (bySubject[b.subject] || 0) + 1; });
  const shelfMetres = books.reduce((n, b) => n + spineCm(b), 0) / 100;
  const dupeCount = useMemo(() => findDuplicates(books).length, [books]);

  const exportAll = () => {
    const text = JSON.stringify(
      { format: "home-inventory", version: 1, exported: new Date().toISOString(), books, items, drinks, cases },
      null, 1
    );
    setPayload(text);
    navigator.clipboard?.writeText(text).then(
      () => flash(`Copied — ${books.length} books, ${drinks.length} drinks, ${items.length} valuables, ${cases.length} bookcases. Paste it into a file and keep it.`),
      () => flash("Couldn't reach the clipboard. Select the text below and copy it by hand.")
    );
  };

  /* A flat spreadsheet view of the catalogue. JSON round-trips back into the
     app; this is for taking the collection somewhere else. */
  const exportCsv = () => {
    const cell = (v) => {
      const t = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const shelfName = (b) => {
      const k = cases.find((c) => c.id === b.placement?.caseId);
      const sh = k?.shelves.find((x) => x.id === b.placement?.shelfId);
      return k ? `${k.name} / ${sh?.label || "?"}` : "";
    };
    const head = ["Title", "Author", "Year", "Pages", "ISBN", "Subject", "Format", "Spine cm", "Height cm", "Colour", "Keywords", "Location", "Identified", "Summary"];
    const rows = books.map((b) => [
      b.title, b.author, b.year, b.pages, b.isbn, b.subject,
      (FORMATS[b.format] || FORMATS.trade).label, spineCm(b), heightCm(b),
      b.color, (b.keywords || []).join("; "), shelfName(b), b.needsReview ? "no" : "yes", b.summary,
    ]);
    const text = [head, ...rows].map((r) => r.map(cell).join(",")).join("\n");
    setPayload(text);
    navigator.clipboard?.writeText(text).then(
      () => flash(`${books.length} rows copied as CSV — paste straight into Excel or Sheets.`),
      () => flash("Couldn't reach the clipboard. Select the text below and copy it by hand.")
    );
  };

  const importAll = () => {
    try {
      const d = JSON.parse(payload);
      if (!d || typeof d !== "object" || Array.isArray(d)) throw new Error("shape");
      const mergeById = (a, b) => { const m = new Map((a || []).map((x) => [x.id, x])); (b || []).forEach((x) => x?.id && m.set(x.id, x)); return [...m.values()]; };
      const counts = [];
      if (Array.isArray(d.books)) { onBooks(mergeById(books, d.books)); counts.push(`${d.books.length} books`); }
      if (Array.isArray(d.items)) { onItems(mergeById(items, d.items)); counts.push(`${d.items.length} valuables`); }
      if (Array.isArray(d.drinks)) { onDrinks(mergeById(drinks, d.drinks)); counts.push(`${d.drinks.length} drinks`); }
      if (Array.isArray(d.cases)) { onCases(mergeById(cases, d.cases)); counts.push(`${d.cases.length} bookcases`); }
      flash(counts.length ? `Merged ${counts.join(", ")}. Matching ids were updated, nothing was deleted.` : "Nothing recognisable in that text.");
    } catch { flash("That isn't a valid export. Paste the JSON you copied, not the CSV."); }
  };

  return (
    <>
      <Panel title="Insurance position">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Category</th><th style={th}>Declared value</th><th style={th}>Share</th></tr></thead>
          <tbody>
            {Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <tr key={k}>
                <td style={td}>{k}</td>
                <td style={{ ...td, fontFamily: MONO }}>€{v.toLocaleString("de-DE")}</td>
                <td style={{ ...td, fontFamily: MONO, color: C.dimmer }}>{total ? Math.round((v / total) * 100) : 0}%</td>
              </tr>
            ))}
            <tr><td style={{ ...td, color: C.amber }}>Total</td><td style={{ ...td, fontFamily: MONO, color: C.amber }}>€{total.toLocaleString("de-DE")}</td><td style={td} /></tr>
          </tbody>
        </table>
        {incomplete.length > 0 && (
          <div style={{ marginTop: 14, fontFamily: SANS, fontSize: 13, color: C.dim, lineHeight: 1.6 }}>
            {incomplete.length} {incomplete.length === 1 ? "item is" : "items are"} missing a serial, a value or a photograph. Those are the records that fail at claim time.
          </div>
        )}
      </Panel>

      <Panel title="Library">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead><tr><th style={th}>Subject</th><th style={th}>Volumes</th><th style={th}>Linear cm</th></tr></thead>
          <tbody>
            {Object.entries(bySubject).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
              <tr key={k}>
                <td style={td}>{k}</td>
                <td style={{ ...td, fontFamily: MONO }}>{v}</td>
                <td style={{ ...td, fontFamily: MONO, color: C.dimmer }}>
                  {Math.round(books.filter((b) => b.subject === k).reduce((n, b) => n + spineCm(b), 0))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.dimmer, marginTop: 12 }}>
          {books.length} volumes · {shelfMetres.toFixed(2)} linear metres of shelf needed
        </div>
        {dupeCount > 0 && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.amber, marginTop: 8, lineHeight: 1.6 }}>
            {dupeCount} possible {dupeCount === 1 ? "duplicate set" : "duplicate sets"} — review them in the Books tab.
          </div>
        )}
        {books.filter((b) => b.needsReview).length > 0 && (
          <div style={{ fontFamily: SANS, fontSize: 13, color: C.warn, marginTop: 8, lineHeight: 1.6 }}>
            {books.filter((b) => b.needsReview).length} seen but not identified. They occupy shelf space in the layout and carry a locator, but they aren't catalogued until you name them.
          </div>
        )}
      </Panel>

      <Panel title="Move between devices">
        <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
          <button onClick={exportAll} style={btn}>Copy everything as JSON</button>
          <button onClick={exportCsv} style={btn} disabled={!books.length}>Copy the catalogue as CSV</button>
          <button onClick={importAll} style={{ ...btn, borderColor: C.amber, color: C.amber }} disabled={!payload.trim()}>Merge pasted data</button>
        </div>
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.dim, lineHeight: 1.6, marginBottom: 10, maxWidth: 620 }}>
          JSON is the backup — books, drinks, valuables and bookcases, with placements intact, and it merges straight back in. CSV is one row per book for a spreadsheet and doesn't come back. This sandbox can't write files, so both copy to the clipboard and appear below; paste into a document and save it somewhere you'll find it.
        </p>
        <textarea value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Paste an export here to merge it in." style={{ ...input, width: "100%", minHeight: 110, fontFamily: MONO, fontSize: 11 }} />
      </Panel>

      <Panel title="Start over">
        <ResetButton
          label="Clear the library"
          confirm={`Delete all ${books.length} books and their photos?`}
          onConfirm={async () => { await clearPrefix("homeinv:v1:shot:"); onBooks([]); flash("Library cleared."); }}
        />
        <div style={{ height: 8 }} />
        <ResetButton
          label="Clear the cellar"
          confirm={`Delete all ${drinks.length} cellar entries?`}
          onConfirm={async () => { onDrinks([]); flash("Cellar cleared."); }}
        />
        <div style={{ height: 8 }} />
        <ResetButton
          label="Clear the valuables"
          confirm={`Delete all ${items.length} valuables and their photos?`}
          onConfirm={async () => { await clearPrefix("homeinv:v1:photo:"); onItems([]); flash("Valuables cleared."); }}
        />
        <p style={{ fontFamily: SANS, fontSize: 12.5, color: C.dimmer, lineHeight: 1.6, marginTop: 12, maxWidth: 620 }}>
          Both are permanent and there's no undo. Copy an export from the panel above first if you might want any of it back.
        </p>
      </Panel>
    </>
  );
}

function ResetButton({ label, confirm, onConfirm }) {
  const [armed, setArmed] = useState(false);
  if (!armed) return <button onClick={() => setArmed(true)} style={{ ...btn, borderColor: C.warn, color: C.warn }}>{label}</button>;
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ fontFamily: SANS, fontSize: 13, color: C.text }}>{confirm}</span>
      <button onClick={async () => { setArmed(false); await onConfirm(); }} style={{ ...btn, borderColor: C.warn, color: C.warn }}>Yes, delete</button>
      <button onClick={() => setArmed(false)} style={btn}>Keep it</button>
    </div>
  );
}

async function clearPrefix(prefix) {
  try {
    const r = await window.storage.list(prefix, false);
    for (const k of r?.keys || []) {
      const key = typeof k === "string" ? k : k.key;
      if (key) await window.storage.delete(key, false);
    }
  } catch {
    /* nothing stored under that prefix */
  }
}

/* ─────────────────────────  UTIL & PARTS  ───────────────────────── */

async function toBase64(file, maxPx, quality = 0.82) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () =>
      rej(new Error(
        /heic|heif/i.test(file.type + file.name)
          ? "This browser can't open HEIC files. On iPhone: Settings › Camera › Formats › Most Compatible, or export the photo as JPEG."
          : "The image couldn't be decoded. JPEG or PNG works best."
      ));
    i.src = dataUrl;
  });
  if (!img.width || !img.height) throw new Error("The image came through empty.");
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const cv = document.createElement("canvas");
  cv.width = Math.round(img.width * scale);
  cv.height = Math.round(img.height * scale);
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  return { b64: cv.toDataURL("image/jpeg", quality).split(",")[1], type: "image/jpeg" };
}

function Shell({ children }) {
  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100%", padding: "22px 18px 60px", fontFamily: SANS }}>
      <div style={{ maxWidth: 940, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>{children}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <section style={{ background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 3, padding: 16, marginBottom: 16, boxSizing: "border-box", maxWidth: "100%", overflowWrap: "break-word" }}>
      <h2 style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.09em", color: C.dimmer, margin: "0 0 14px", fontWeight: 400 }}>{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontFamily: MONO, fontSize: 10, color: C.dimmer, marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  );
}

function Empty({ children }) {
  return <div style={{ fontFamily: SANS, fontSize: 13.5, color: C.dimmer, padding: "10px 0", lineHeight: 1.6 }}>{children}</div>;
}

const btn = {
  background: C.panel, border: `1px solid ${C.rule}`, borderRadius: 3, color: C.dim,
  fontFamily: MONO, fontSize: 12, padding: "7px 12px", cursor: "pointer",
};
const navBtn = { ...btn, fontSize: 13, padding: "8px 14px" };
const input = {
  background: C.bg, border: `1px solid ${C.rule}`, borderRadius: 3, color: C.text,
  fontFamily: SANS, fontSize: 13, padding: "7px 9px", outline: "none",
  // Without this, every width:100% field overflows its panel by its padding.
  boxSizing: "border-box", maxWidth: "100%", resize: "vertical",
};
const th = {
  textAlign: "left", padding: "7px 10px 7px 0", color: C.dimmer, fontWeight: 400,
  fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", borderBottom: `1px solid ${C.rule}`,
};
const td = { padding: "8px 10px 8px 0", borderBottom: `1px solid ${C.rule}`, fontFamily: SANS, fontSize: 13, overflowWrap: "break-word" };
