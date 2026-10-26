import React, { useState, useEffect, useMemo, useCallback } from "react";

/* ════════════════════  LIFE OS · HOUSEHOLD › CELLAR  ════════════════════
   Tracks the wine rack and spirits shelf in the Gau-Bischofsheim basement:
   what is stored, where it physically sits, and how urgently it needs drinking.

   The collection was stored too warm at the previous address and lost ~30 bottles
   to heat oxidation, so `status` is a drink-order field, not a decorative tag.

   DATA-LAYER CONTRACT (do not rename when re-skinning — see DESIGN-HANDOFF.md):
   - Main key   : "lifeos.v1.cellar"  → { v, settings{rackRows,rackSlots}, items[] }
   - item       : { id, category, subtype, producer, name, vintage, country, region,
                    size_ml, location_type, location_row, location_pos,
                    status, priority, notes, opened }
   - id prefixes: W### wine, S### spirits. Stable — never renumber on insert.
   - Persistence via window.storage only (no localStorage).
   - Theme is read (never written) from the health app's key "lifeos.v3.health".
   - A rack slot is unique: (location_row, location_pos) for location_type "Rack".
   ====================================================================== */

const KEY = "lifeos.v1.cellar";
const HEALTH_KEY = "lifeos.v3.health";

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
const DISP = "var(--fDisp)";

/* ════════════════════  CONSTANTS  ════════════════════ */

/* order = drink order. Lower goes first. */
const STATUSES = {
  "Triage":      { label: "Triage",      color: "bad",   order: 0, hint: "Heat-damaged odds; open to find out, don't save" },
  "Open soon":   { label: "Open soon",   color: "pop",   order: 1, hint: "Still likely sound but past its window" },
  "Drink fresh": { label: "Drink fresh", color: "money", order: 2, hint: "Young whites and sparkling — freshness is the point" },
  "Mid-term":    { label: "Mid-term",    color: "admin", order: 3, hint: "Drink over the next year or two" },
  "Keep":        { label: "Keep",        color: "good",  order: 4, hint: "Holding well; has somewhere left to go" },
  "Shelf":       { label: "Shelf",       color: "learn", order: 5, hint: "Spirits — stable upright, no drink-by pressure" },
  "To shelve":   { label: "To shelve",   color: "acc",   order: 6, hint: "Not yet in position" },
  "Refrigerate": { label: "Refrigerate", color: "health",order: 7, hint: "Perishable — belongs in the fridge, not the basement" },
  "Opened":      { label: "Opened",      color: "mut",   order: 8, hint: "Cork pulled; logged for the record" },
};
const STATUS_LIST = Object.keys(STATUSES);
const CELLAR_ROWS = 6;
const CELLAR_SLOTS = 8;

/* Rows 1–3 sit in the basement window's light path; 4–6 are shaded and cooler. */
const ROW_NOTE = {
  1: "Window level — light exposure, warmest",
  2: "Window level — light exposure",
  3: "Window level — reserved for boxed wine once the window is covered",
  4: "Below the sill — shaded, easy to reach",
  5: "Shaded, cooler",
  6: "Bottom — coolest and most stable",
};

const SEED_ITEMS = [
  { id: "W001", category: "Wine", subtype: "Red", producer: "Ramón Bilbao", name: "Gran Reserva", vintage: 2009, country: "Spain", region: "Rioja", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 1, status: "Triage", priority: 1, notes: "Most heat-resilient of the triage reds; open first", opened: null },
  { id: "W002", category: "Wine", subtype: "Red", producer: "Bodegas Gran Feudo", name: "Reserva", vintage: 2011, country: "Spain", region: "Navarra", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 2, status: "Triage", priority: 2, opened: null },
  { id: "W003", category: "Wine", subtype: "Red", producer: "Kistenmacher & Hengerer", name: "Cuvée Maximilian", vintage: 2011, country: "Germany", region: "Württemberg", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 3, status: "Triage", priority: 2, notes: "Good small producer; 15 yrs", opened: null },
  { id: "W004", category: "Wine", subtype: "Red", producer: "Torre Raone", name: "Lucanto Montepulciano d'Abruzzo", vintage: 2012, country: "Italy", region: "Abruzzo", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 4, status: "Triage", priority: 2, notes: "Montepulciano tannin may carry it", opened: null },
  { id: "W005", category: "Wine", subtype: "Red", producer: "Calvet", name: "Grande Réserve Bordeaux Supérieur", vintage: 2014, country: "France", region: "Bordeaux", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 5, status: "Triage", priority: 2, opened: null },
  { id: "W006", category: "Wine", subtype: "White", producer: "Inama", name: "Vigneti di Foscarino Soave Classico", vintage: 2014, country: "Italy", region: "Veneto", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 6, status: "Triage", priority: 2, notes: "Volcanic cru Soave; age-worthy style but 12 yrs", opened: null },
  { id: "W007", category: "Wine", subtype: "Red", producer: "Rocca Maura", name: "Côtes du Rhône", vintage: 2015, country: "France", region: "Rhône", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 7, status: "Triage", priority: 2, opened: null },
  { id: "W008", category: "Wine", subtype: "Red", producer: "Félix Solís", name: "Caliza Gran Selección", vintage: 2016, country: "Spain", size_ml: 750, location_type: "Rack", location_row: 1, location_pos: 8, status: "Triage", priority: 3, opened: null },
  { id: "W009", category: "Wine", subtype: "Red", producer: "Marsovin", name: "Cheval Franc Private Estate Selection", vintage: 2016, country: "Malta", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 1, status: "Triage", priority: 3, notes: "Souvenir bottle", opened: null },
  { id: "W010", category: "Wine", subtype: "White", producer: "Tenuta Sant'Antonio", name: "Vecchie Vigne Soave", vintage: 2017, country: "Italy", region: "Veneto", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 2, status: "Triage", priority: 2, opened: null },
  { id: "W011", category: "Wine", subtype: "Red", producer: "Barton & Guestier", name: "Cabernet Sauvignon Réserve", vintage: 2019, country: "France", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 3, status: "Triage", priority: 3, opened: null },
  { id: "W012", category: "Wine", subtype: "Red", name: "Cuvée Sachsen Rotwein Trocken", vintage: 2019, country: "Germany", region: "Sachsen", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 4, status: "Triage", priority: 3, notes: "Vintage unconfirmed (approx 2019)", opened: null },
  { id: "W013", category: "Wine", subtype: "Red", producer: "Gabriel Meffre", name: "Laurus Châteauneuf-du-Pape", vintage: 2012, country: "France", region: "Rhône", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 5, status: "Open soon", priority: 1, notes: "Real structure; best of the older reds", opened: null },
  { id: "W014", category: "Wine", subtype: "Red", producer: "Caves Velhas", name: "Romeira Reserva", vintage: 2015, country: "Portugal", region: "Alentejano", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 6, status: "Open soon", priority: 1, notes: "Ripe tannin buffers heat damage", opened: null },
  { id: "W015", category: "Wine", subtype: "Red", producer: "Calvet", name: "Collection Pomerol", vintage: 2018, country: "France", region: "Pomerol", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 7, status: "Open soon", priority: 2, notes: "Merlot-dominant", opened: null },
  { id: "W016", category: "Wine", subtype: "White", producer: "Josten & Klein", name: "Schiefer Riesling", country: "Germany", region: "Mittelrhein", size_ml: 750, location_type: "Rack", location_row: 2, location_pos: 8, status: "Open soon", priority: 2, notes: "VINTAGE UNKNOWN — label water-damaged", opened: null },
  { id: "W017", category: "Wine", subtype: "Sparkling", producer: "Hans Wirsching", name: "Wi'secco", country: "Germany", region: "Franken", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 1, status: "Drink fresh", priority: 1, notes: "Sparkling degrades fastest", opened: null },
  { id: "W018", category: "Wine", subtype: "White", producer: "Schloss Wackerbarth", name: "Edition Frauenkirche Weiss", vintage: 2019, country: "Germany", region: "Sachsen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 2, status: "Drink fresh", priority: 2, opened: null },
  { id: "W019", category: "Wine", subtype: "White", name: "Riesling Spätlese lieblich", country: "Germany", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 3, status: "Drink fresh", priority: 2, notes: "Handwritten label; producer and vintage unknown", opened: null },
  { id: "W020", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Riesling Kreuz", vintage: 2023, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 4, status: "Drink fresh", priority: 3, opened: null },
  { id: "W021", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Sauvignon Blanc Trocken", vintage: 2024, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 5, status: "Drink fresh", priority: 3, opened: null },
  { id: "W022", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Grauer Burgunder Aulenberg", vintage: 2024, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 6, status: "Drink fresh", priority: 3, opened: null },
  { id: "W023", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Silvaner Trocken", vintage: 2025, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 7, status: "Drink fresh", priority: 3, opened: null },
  { id: "W024", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Silvaner Trocken", vintage: 2025, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 4, location_pos: 8, status: "Drink fresh", priority: 3, opened: null },
  { id: "W025", category: "Wine", subtype: "Red", producer: "Teliani Valley", name: "Saperavi Réserve", vintage: 2017, country: "Georgia", region: "Kakheti", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 1, status: "Mid-term", priority: 2, notes: "Saperavi is heat-tolerant", opened: null },
  { id: "W026", category: "Wine", subtype: "Red", producer: "Weingut Hägemann Charlottenhof", name: "Dienheimer Kreuz Merlot Trocken", vintage: 2018, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 2, status: "Mid-term", priority: 2, notes: "Oak-aged; estate bottled", opened: null },
  { id: "W027", category: "Wine", subtype: "Red", producer: "Diemersfontein", name: "Pinotage", vintage: 2019, country: "South Africa", region: "Wellington", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 3, status: "Mid-term", priority: 2, opened: null },
  { id: "W028", category: "Wine", subtype: "White", producer: "Stallmann-Hiestand", name: "Silvaner Trocken", vintage: 2025, country: "Germany", region: "Rheinhessen", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 4, status: "Drink fresh", priority: 3, notes: "Third bottle; overflow from row 4", opened: null },
  { id: "W029", category: "Wine", subtype: "Red", producer: "Mitravelas", name: "Kokkino Se Mavro", vintage: 2023, country: "Greece", region: "Nemea", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 5, status: "Keep", priority: 3, notes: "Youngest red in the collection", opened: null },
  { id: "W030", category: "Wine", subtype: "Sparkling", producer: "Bisol", name: "1875 Valdobbiadene Prosecco Superiore", country: "Italy", region: "Veneto", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 6, status: "Drink fresh", priority: 1, notes: "Prosecco is a 2-3 yr wine; drink first", opened: null },
  { id: "W031", category: "Wine", subtype: "Sparkling", producer: "Schloss Wackerbarth", name: "1836 Hommage au Bussard", country: "Germany", region: "Sachsen", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 7, status: "Drink fresh", priority: 2, notes: "Survivor of the original six", opened: null },
  { id: "W032", category: "Wine", subtype: "Sparkling", producer: "Bollinger", name: "Rosé Brut", country: "France", region: "Champagne", size_ml: 750, location_type: "Rack", location_row: 5, location_pos: 8, status: "Keep", priority: 2, opened: null },
  { id: "W033", category: "Wine", subtype: "Dessert", name: "Cinque Terre Sciacchetrà", vintage: 2005, country: "Italy", region: "Liguria", size_ml: 375, location_type: "Rack", location_row: 6, location_pos: 1, status: "Keep", priority: 4, notes: "Passito; sugar preserves it. Expect fig/walnut/caramel at 21 yrs", opened: null },
  { id: "W034", category: "Wine", subtype: "Fortified", producer: "Croft", name: "Quinta da Roeda Vintage Port", vintage: 2012, country: "Portugal", region: "Douro", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 2, status: "Keep", priority: 4, notes: "Unfiltered — MUST stay horizontal. Decades of life", opened: null },
  { id: "W035", category: "Wine", subtype: "White", producer: "Weingut Werner", name: "Independence Riesling", vintage: 2018, country: "Germany", region: "Rheingau (Hochheim)", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 3, status: "Keep", priority: 3, notes: "VDP estate", opened: null },
  { id: "W036", category: "Wine", subtype: "White", producer: "Weingut Werner", name: "Independence Riesling", vintage: 2018, country: "Germany", region: "Rheingau (Hochheim)", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 4, status: "Keep", priority: 3, notes: "VDP estate", opened: null },
  { id: "W037", category: "Wine", subtype: "White", producer: "Villa Gutenberg / Richard Nägler", name: "Optimus Riesling", vintage: 2018, country: "Germany", region: "Rheingau", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 5, status: "Keep", priority: 3, opened: null },
  { id: "W038", category: "Wine", subtype: "Red", producer: "Ramos Pinto", name: "Duas Quintas", vintage: 2019, country: "Portugal", region: "Douro", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 6, status: "Keep", priority: 3, notes: "Douro field blend; heat-tough", opened: null },
  { id: "W039", category: "Wine", subtype: "Red", producer: "Abtei St. Hildegard", name: "Assmannshäuser Hinterkirch Spätburgunder", vintage: 2020, country: "Germany", region: "Rheingau", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 7, status: "Keep", priority: 4, notes: "Serious Rheingau Pinot ground", opened: null },
  { id: "W040", category: "Wine", subtype: "White", producer: "St. Antony", name: "Riesling Orbel GG", vintage: 2021, country: "Germany", region: "Rheinhessen (Nierstein)", size_ml: 750, location_type: "Rack", location_row: 6, location_pos: 8, status: "Keep", priority: 4, notes: "Grosses Gewächs; best bottle in the collection. Decant 30 min", opened: null },
  { id: "S001", category: "Spirit", subtype: "Gin", producer: "Edinburgh Gin", name: "The Classic London Dry", country: "Scotland", size_ml: 700, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", opened: null },
  { id: "S002", category: "Spirit", subtype: "Gin", producer: "Ferdinand's", name: "Saar Dry Gin", country: "Germany", region: "Saar", size_ml: 500, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", opened: null },
  { id: "S003", category: "Spirit", subtype: "Gin", producer: "Etsu", name: "Handcrafted Gin", country: "Japan", size_ml: 700, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", opened: null },
  { id: "S004", category: "Spirit", subtype: "Gin", producer: "6N Friday", name: "Chic Gin", size_ml: 700, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", notes: "40% ABV", opened: null },
  { id: "S005", category: "Spirit", subtype: "Gin", producer: "Schloss Gin", name: "Small Batch", country: "Germany", size_ml: 500, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", opened: null },
  { id: "S006", category: "Spirit", subtype: "Gin", producer: "The Illusionist", name: "Dry Gin", country: "Germany", size_ml: 500, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", notes: "Colour-changing gin", opened: null },
  { id: "S007", category: "Spirit", subtype: "Gin", producer: "Kaiser Hill", name: "16 Bavarian Dry Gin", country: "Germany", region: "Bavaria", size_ml: 500, location_type: "Shelf", location_row: "Gin bay", status: "Shelf", opened: null },
  { id: "S008", category: "Spirit", subtype: "Irish Whiskey", producer: "Midleton", name: "Very Rare", country: "Ireland", region: "Co. Cork", size_ml: 700, location_type: "Shelf", location_row: "Whiskey bay", status: "Shelf", notes: "Boxed. Replace cardboard sleeve if basement is damp", opened: null },
  { id: "S009", category: "Spirit", subtype: "Scotch", producer: "Kirkland", name: "10 Year Speyside Single Malt", country: "Scotland", region: "Speyside", size_ml: 700, location_type: "Shelf", location_row: "Whiskey bay", status: "Shelf", notes: "Low fill — drink before full bottles", opened: null },
  { id: "S010", category: "Spirit", subtype: "Scotch", producer: "Kirkland", name: "Highland Single Malt", country: "Scotland", region: "Highland", size_ml: 200, location_type: "Shelf", location_row: "Whiskey bay", status: "Shelf", notes: "Low fill", opened: null },
  { id: "S011", category: "Spirit", subtype: "Bourbon", producer: "Maker's Mark", name: "46", country: "USA", region: "Kentucky", size_ml: 750, location_type: "Shelf", location_row: "Whiskey bay", status: "Shelf", notes: "47% ABV. Low fill — oxidising", opened: null },
  { id: "S012", category: "Spirit", subtype: "Bourbon", producer: "Old 55", name: "Single Barrel", country: "USA", region: "Newtown IN", size_ml: 750, location_type: "Shelf", location_row: "Whiskey bay", status: "Shelf", notes: "Signed label. Low fill", opened: null },
  { id: "S013", category: "Spirit", subtype: "Cognac", producer: "Rémy Martin", name: "VSOP Fine Champagne", country: "France", region: "Cognac", size_ml: 700, location_type: "Shelf", location_row: "Brandy bay", status: "Shelf", opened: null },
  { id: "S014", category: "Spirit", subtype: "Apple Brandy", producer: "Busnel", name: "Calvados Vieilli en Fûts de Chêne", country: "France", region: "Normandy", size_ml: 200, location_type: "Shelf", location_row: "Brandy bay", status: "Shelf", notes: "40% ABV", opened: null },
  { id: "S015", category: "Spirit", subtype: "Grappa", producer: "Podere Spazzavento", name: "Grappa Toscana Riserva", country: "Italy", region: "Tuscany", size_ml: 500, location_type: "Shelf", location_row: "Brandy bay", status: "Shelf", opened: null },
  { id: "S016", category: "Spirit", subtype: "Fortified", producer: "W. & J. Graham's", name: "10 Year Tawny Port", country: "Portugal", region: "Douro", size_ml: 500, location_type: "Shelf", location_row: "Liqueur bay", status: "To shelve", notes: "In garage — bring in. Upright; screwcap", opened: null },
  { id: "S017", category: "Spirit", subtype: "Fortified", producer: "W. & J. Graham's", name: "20 Year Tawny Port", country: "Portugal", region: "Douro", size_ml: 500, location_type: "Shelf", location_row: "Liqueur bay", status: "To shelve", notes: "In garage — bring in. Upright; screwcap", opened: null },
  { id: "S018", category: "Spirit", subtype: "Bitter", producer: "Campari", name: "Campari Milano", country: "Italy", size_ml: 700, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", opened: null },
  { id: "S019", category: "Spirit", subtype: "Bitter", producer: "Campari", name: "Campari Milano", country: "Italy", size_ml: 700, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", opened: null },
  { id: "S020", category: "Spirit", subtype: "Liqueur", producer: "Mastic Tears", name: "Mastiha Spirit Classic", country: "Greece", region: "Chios", size_ml: 700, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", opened: null },
  { id: "S021", category: "Spirit", subtype: "Liqueur", producer: "Mastic Tears", name: "Mastiha Spirit Classic", country: "Greece", region: "Chios", size_ml: 50, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", notes: "Mini", opened: null },
  { id: "S022", category: "Spirit", subtype: "Liqueur", producer: "Mariquinhas", name: "Licor de Ginja de Óbidos", vintage: 2022, country: "Portugal", region: "Óbidos", size_ml: 200, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", notes: "Sour cherry", opened: null },
  { id: "S023", category: "Spirit", subtype: "Liqueur", producer: "Sabores da Gardunha", name: "Ginja com Fruto", country: "Portugal", size_ml: 200, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", notes: "19% ABV; cherries in bottle", opened: null },
  { id: "S024", category: "Spirit", subtype: "Liqueur", producer: "Rauschritter", name: "LIMALI", country: "Germany", region: "Mainz", size_ml: 700, location_type: "Shelf", location_row: "Liqueur bay", status: "Shelf", notes: "16% ABV", opened: null },
  { id: "S025", category: "Spirit", subtype: "Vermouth", name: "Wermut Bierstein am Rhein", country: "Germany", size_ml: 750, location_type: "Fridge", status: "Refrigerate", priority: 1, notes: "Wine-based — oxidises within weeks of opening. NOT basement", opened: null },
  { id: "S026", category: "Spirit", subtype: "Sake", producer: "Hakuro Shuzo", name: "Junmai Daiginjo (ANA edition)", country: "Japan", region: "Niigata", size_ml: 720, location_type: "Fridge", status: "Refrigerate", priority: 1, notes: "Check brewing date on bottle. Most perishable item — drink soon", opened: null },
];

/* ════════════════════  UTIL  ════════════════════ */

const todayISO = () => new Date().toISOString().slice(0, 10);
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pretty = (iso) => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d} ${MON[+m - 1]} ${y.slice(2)}`;
};
const age = (vintage) => (vintage ? new Date().getFullYear() - vintage : null);
const label = (it) => [it.producer, it.name].filter(Boolean).join(" ").trim() || it.id;
const sizeTag = (it) => (it.size_ml && it.size_ml !== 750 ? `${it.size_ml}ml` : "");

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

const blank = () => ({
  v: 1,
  settings: { rackRows: CELLAR_ROWS, rackSlots: CELLAR_SLOTS },
  items: SEED_ITEMS.map((x) => ({ ...x })),
});

/* Rack slot collisions are a real failure mode — two bottles claiming row 6 pos 2
   means the map no longer matches the basement. Surfaced, never silently resolved. */
function slotConflicts(items) {
  const seen = new Map();
  const bad = [];
  items.filter((i) => i.location_type === "Rack" && i.location_row && i.location_pos)
    .forEach((i) => {
      const k = `${i.location_row}:${i.location_pos}`;
      if (seen.has(k)) bad.push({ slot: k, ids: [seen.get(k), i.id] });
      else seen.set(k, i.id);
    });
  return bad;
}

const byDrinkOrder = (a, b) => {
  const sa = STATUSES[a.status]?.order ?? 99;
  const sb = STATUSES[b.status]?.order ?? 99;
  if (sa !== sb) return sa - sb;
  const pa = a.priority ?? 9;
  const pb = b.priority ?? 9;
  if (pa !== pb) return pa - pb;
  return (a.vintage ?? 9999) - (b.vintage ?? 9999);
};

/* ════════════════════  PRIMITIVES  ════════════════════ */

const Label = ({ children, style }) => (
  <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: C.mut, ...style }}>{children}</div>
);
const Chip = ({ on, color = "acc", onClick, children }) => (
  <button onClick={onClick} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase",
    background: on ? `var(--${color})` : "transparent", color: on ? "var(--accInk)" : C.sub, borderRadius: 999,
    padding: "6px 11px", cursor: "pointer", minHeight: 32,
    border: `1px solid ${on ? `var(--${color})` : C.line}`, whiteSpace: "nowrap" }}>{children}</button>
);
const StatusTag = ({ status }) => {
  const s = STATUSES[status] || STATUSES.Keep;
  return <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
    color: `var(--${s.color})`, border: `1px solid var(--${s.color})`, borderRadius: 4, padding: "2px 6px", whiteSpace: "nowrap" }}>{s.label}</span>;
};
const Stat = ({ label: l, value, sub, tone }) => (
  <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 14px 12px" }}>
    <Label>{l}</Label>
    <div style={{ fontFamily: DISP, fontSize: 24, fontWeight: 600, marginTop: 6, color: tone ? `var(--${tone})` : C.ink }}>{value}</div>
    {sub && <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 4 }}>{sub}</div>}
  </div>
);
const inputStyle = { width: "100%", boxSizing: "border-box", background: "var(--card2)", border: "1px solid var(--line)",
  borderRadius: 8, padding: "10px 11px", color: "var(--ink)", fontFamily: "var(--fBody)", fontSize: 15, minHeight: 42 };
const Field = ({ label: l, children, span = 1 }) => (
  <label style={{ display: "block", gridColumn: `span ${span}` }}>
    <Label style={{ marginBottom: 5 }}>{l}</Label>{children}
  </label>
);
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

/* ════════════════════  RACK MAP  ════════════════════ */

function RackMap({ items, onPick }) {
  const rows = [];
  for (let r = 1; r <= CELLAR_ROWS; r++) {
    const slots = [];
    for (let p = 1; p <= CELLAR_SLOTS; p++) {
      const it = items.find((i) => i.location_type === "Rack" && i.location_row === r && i.location_pos === p);
      slots.push({ p, it });
    }
    rows.push({ r, slots });
  }
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map(({ r, slots }) => (
        <div key={r} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "11px 12px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <Label>Row {r}</Label>
            <div style={{ fontFamily: MONO, fontSize: 10, color: C.mut, textAlign: "right" }}>{ROW_NOTE[r]}</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${CELLAR_SLOTS}, minmax(0, 1fr))`, gap: 5 }}>
            {slots.map(({ p, it }) => {
              const s = it ? STATUSES[it.status] : null;
              return (
                <button key={p} onClick={() => it && onPick(it.id)} title={it ? `${label(it)}${it.vintage ? " " + it.vintage : ""}` : `Row ${r}, slot ${p} — empty`}
                  style={{ aspectRatio: "1 / 2.1", minHeight: 52, cursor: it ? "pointer" : "default", padding: 2,
                    borderRadius: 5, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2,
                    background: it ? `var(--${s.color})` : "transparent",
                    border: it ? `1px solid var(--${s.color})` : `1px dashed ${C.lineSoft}`,
                    color: it ? "var(--accInk)" : C.mut, opacity: it ? 1 : 0.45 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.04em" }}>{it ? it.id : p}</span>
                  {it?.vintage && <span style={{ fontFamily: MONO, fontSize: 8, opacity: 0.85 }}>{String(it.vintage).slice(2)}</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ════════════════════  BOTTLE SHEET  ════════════════════ */

function BottleSheet({ item, onClose, onSave }) {
  const [it, setIt] = useState(item);
  const set = (k, v) => setIt({ ...it, [k]: v });
  const s = STATUSES[it.status] || STATUSES.Keep;
  const a = age(it.vintage);
  return (
    <Sheet title={label(it)} onClose={onClose}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontFamily: MONO, fontSize: 11, color: C.mut }}>{it.id}</span>
        {it.vintage && <span style={{ fontFamily: DISP, fontSize: 18, fontWeight: 600 }}>{it.vintage}</span>}
        {a !== null && <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{a} yrs</span>}
        <StatusTag status={it.status} />
      </div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginBottom: 14 }}>{s.hint}</div>

      <Label style={{ marginBottom: 6 }}>Status</Label>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {STATUS_LIST.map((k) => (
          <Chip key={k} on={it.status === k} color={STATUSES[k].color} onClick={() => set("status", k)}>{STATUSES[k].label}</Chip>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
        <Field label="Where"><input style={inputStyle} value={it.location_type || ""} onChange={(e) => set("location_type", e.target.value)} /></Field>
        <Field label="Row"><input inputMode="numeric" style={inputStyle} value={it.location_row ?? ""} onChange={(e) => set("location_row", e.target.value === "" ? null : Number(e.target.value))} /></Field>
        <Field label="Slot"><input inputMode="numeric" style={inputStyle} value={it.location_pos ?? ""} onChange={(e) => set("location_pos", e.target.value === "" ? null : Number(e.target.value))} /></Field>
        <Field label="Opened on"><input type="date" style={inputStyle} value={it.opened || ""} onChange={(e) => set("opened", e.target.value || null)} /></Field>
        <Field label="Notes" span={3}><input style={inputStyle} value={it.notes || ""} onChange={(e) => set("notes", e.target.value)} /></Field>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onSave({ ...it, status: "Opened", opened: it.opened || todayISO(), location_type: "Opened", location_row: null, location_pos: null })}
          style={{ flex: "1 1 180px", minHeight: 44, borderRadius: 10, cursor: "pointer",
            background: "transparent", border: `1px solid ${C.line}`, color: C.sub, fontFamily: "var(--fBody)", fontSize: 15 }}>
          Mark opened — frees the slot
        </button>
        <button onClick={() => onSave(it)}
          style={{ flex: "1 1 180px", minHeight: 44, borderRadius: 10, cursor: "pointer",
            background: C.acc, border: `1px solid ${C.acc}`, color: C.accInk, fontFamily: "var(--fBody)", fontSize: 15, fontWeight: 600 }}>
          Save
        </button>
      </div>
    </Sheet>
  );
}

/* ════════════════════  APP  ════════════════════ */

export default function LifeOSCellar() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");
  const [tab, setTab] = useState("rack");
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(null);
  const [imp, setImp] = useState("");
  const [toast, setToast] = useState(null);

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

  const items = data?.items || [];
  const conflicts = useMemo(() => slotConflicts(items), [items]);

  const counts = useMemo(() => {
    const c = { total: items.length, wine: 0, spirit: 0, urgent: 0, racked: 0 };
    items.forEach((i) => {
      if (i.category === "Wine") c.wine++;
      if (i.category === "Spirit") c.spirit++;
      if ((STATUSES[i.status]?.order ?? 9) <= 1) c.urgent++;
      if (i.location_type === "Rack") c.racked++;
    });
    return c;
  }, [items]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items
      .filter((i) => filter === "all" || i.status === filter)
      .filter((i) => !needle || `${label(i)} ${i.region || ""} ${i.country || ""} ${i.vintage || ""} ${i.id}`.toLowerCase().includes(needle))
      .sort(byDrinkOrder);
  }, [items, filter, q]);

  const saveItem = (next) => {
    persist({ ...data, items: items.map((x) => (x.id === next.id ? next : x)) });
    setOpen(null);
    flash(next.status === "Opened" ? `${label(next)} logged as opened.` : "Saved.");
  };

  const doImport = () => {
    try {
      const inc = JSON.parse(imp);
      const incoming = Array.isArray(inc) ? inc : inc.items;
      if (!Array.isArray(incoming)) throw new Error("No items array found.");
      const m = new Map(items.map((x) => [x.id, x]));
      incoming.forEach((x) => m.set(x.id, { ...m.get(x.id), ...x }));
      const merged = [...m.values()];
      persist({ ...data, items: merged });
      const bad = slotConflicts(merged);
      flash(bad.length
        ? `Merged ${incoming.length} — but ${bad.length} rack slot(s) now double-booked.`
        : `Merged ${incoming.length} bottles.`, !bad.length);
      setImp("");
    } catch (e) { flash("Import failed: " + e.message, false); }
  };

  if (!data) return <div style={{ padding: 40, color: C.sub, fontFamily: "var(--fBody)" }}>Loading cellar…</div>;

  return (
    <div style={{ background: C.bg, color: C.ink, minHeight: "100vh", fontFamily: "var(--fBody)", padding: "18px 16px 60px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
          <div style={{ fontFamily: DISP, fontSize: 26, fontWeight: 600 }}>Cellar</div>
          <div style={{ fontFamily: MONO, fontSize: 10, color: C.mut, textTransform: "uppercase", letterSpacing: "0.08em" }}>{status}</div>
        </div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub, marginBottom: 16 }}>Gau-Bischofsheim basement</div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(118px, 1fr))", gap: 10, marginBottom: 16 }}>
          <Stat label="Bottles" value={counts.total} sub={`${counts.wine} wine · ${counts.spirit} spirits`} />
          <Stat label="On the rack" value={`${counts.racked}/${CELLAR_ROWS * CELLAR_SLOTS}`} sub={`${CELLAR_ROWS * CELLAR_SLOTS - counts.racked} slots free`} />
          <Stat label="Open first" value={counts.urgent} sub="Triage + open soon" tone="bad" />
        </div>

        {conflicts.length > 0 && (
          <div style={{ background: C.card, border: `1px solid var(--bad)`, borderRadius: 10, padding: "11px 12px", marginBottom: 14 }}>
            <Label style={{ color: "var(--bad)" }}>Slot conflict</Label>
            <div style={{ fontSize: 13, color: C.sub, marginTop: 5 }}>
              {conflicts.map((c) => `Row ${c.slot.split(":")[0]} slot ${c.slot.split(":")[1]} — ${c.ids.join(" and ")}`).join("; ")}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {[["rack", "Rack map"], ["list", "Bottles"], ["data", "Data"]].map(([k, l]) => (
            <Chip key={k} on={tab === k} onClick={() => setTab(k)}>{l}</Chip>
          ))}
        </div>

        {tab === "rack" && <RackMap items={items} onPick={(id) => setOpen(items.find((i) => i.id === id))} />}

        {tab === "list" && (
          <>
            <input placeholder="Search producer, region, vintage…" value={q} onChange={(e) => setQ(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              <Chip on={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
              {STATUS_LIST.map((k) => (
                <Chip key={k} on={filter === k} color={STATUSES[k].color} onClick={() => setFilter(k)}>{STATUSES[k].label}</Chip>
              ))}
            </div>
            <div style={{ display: "grid", gap: 7 }}>
              {shown.map((it) => (
                <button key={it.id} onClick={() => setOpen(it)} style={{ textAlign: "left", cursor: "pointer",
                  background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, padding: "11px 12px",
                  display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", color: C.ink }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {label(it)} {it.vintage ? <span style={{ color: C.sub, fontWeight: 400 }}>{it.vintage}</span> : null}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.mut, marginTop: 3 }}>
                      {[it.id, it.subtype, it.region || it.country, sizeTag(it),
                        it.location_type === "Rack" ? `R${it.location_row}·${it.location_pos}` : it.location_type]
                        .filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <StatusTag status={it.status} />
                </button>
              ))}
              {shown.length === 0 && <div style={{ color: C.sub, fontSize: 14, padding: "18px 2px" }}>Nothing matches.</div>}
            </div>
          </>
        )}

        {tab === "data" && (
          <div style={{ display: "grid", gap: 14 }}>
            <div>
              <Label style={{ marginBottom: 6 }}>Import — paste cellar_import.json</Label>
              <textarea value={imp} onChange={(e) => setImp(e.target.value)} rows={7}
                placeholder='{ "v": 1, "items": [ … ] }'
                style={{ ...inputStyle, fontFamily: MONO, fontSize: 12, resize: "vertical" }} />
              <button onClick={doImport} disabled={!imp.trim()}
                style={{ marginTop: 8, minHeight: 44, padding: "0 18px", borderRadius: 10, cursor: imp.trim() ? "pointer" : "default",
                  background: imp.trim() ? C.acc : "transparent", border: `1px solid ${imp.trim() ? C.acc : C.line}`,
                  color: imp.trim() ? C.accInk : C.mut, fontFamily: "var(--fBody)", fontSize: 15, fontWeight: 600 }}>
                Merge by id
              </button>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.mut, marginTop: 6 }}>
                Matching ids are updated in place; new ids are appended. Nothing is deleted.
              </div>
            </div>
            <div>
              <Label style={{ marginBottom: 6 }}>Export</Label>
              <textarea readOnly value={JSON.stringify({ v: 1, exported: todayISO(), items }, null, 2)} rows={9}
                onFocus={(e) => e.target.select()}
                style={{ ...inputStyle, fontFamily: MONO, fontSize: 11, resize: "vertical" }} />
            </div>
          </div>
        )}

        {open && <BottleSheet item={open} onClose={() => setOpen(null)} onSave={saveItem} />}

        {toast && (
          <div style={{ position: "fixed", left: "50%", bottom: 22, transform: "translateX(-50%)", zIndex: 60,
            background: C.card, border: `1px solid var(--${toast.ok ? "good" : "bad"})`, color: C.ink,
            borderRadius: 10, padding: "10px 16px", fontSize: 14, maxWidth: "92vw" }}>{toast.t}</div>
        )}
      </div>
    </div>
  );
}
