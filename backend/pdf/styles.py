"""Print-first CSS design system for Vector AI educational PDFs.

The stylesheet targets WeasyPrint's paged-media engine:

* A4 sheets with generous margins and a running footer (brand + page number).
* A full-bleed cover page as a named page (``@page cover``) without footer.
* Emerald accent palette with dark charcoal body text and white paper.
* Serif body + sans heading stack (DejaVu ships full Greek/math coverage).
* Print-safe breaks: headings stick to content, equations and callout boxes
  are never split, table header rows repeat across pages.
* Unobtrusive, textbook-like surfaces -- flat panels with hairline rules and
  accent borders rather than cards/neon/gradients.

No external fonts, images or CDN references: every family is a system font
(``fonts-dejavu`` on the production image; bundled DejaVu in matplotlib is
used for math glyph paths, which are font-independent).
"""

# ---------------------------------------------------------------------------
# Theme palettes -------------------------------------------------------------
# ---------------------------------------------------------------------------

ACCENTS = {
    "default": {
        "accent": "#0f766e",        # emerald-700
        "accent-strong": "#0b5c56",
        "accent-soft": "#e8f4f0",
        "accent-line": "#bfddd4",
        "heading": "#16302a",
    },
    "academic": {
        "accent": "#1e3a8a",        # navy-800
        "accent-strong": "#17295e",
        "accent-soft": "#eaf0fb",
        "accent-line": "#c3d1ec",
        "heading": "#1b2a4a",
    },
    "dark": {
        "accent": "#334155",        # graphite slate
        "accent-strong": "#1f2937",
        "accent-soft": "#eef1f4",
        "accent-line": "#cbd5e1",
        "heading": "#111827",
    },
}

# ---------------------------------------------------------------------------
# Base stylesheet ------------------------------------------------------------
# ---------------------------------------------------------------------------
# The variables ``--accent``, ``--accent-strong``, ``--accent-soft``,
# ``--accent-line``, and ``--heading`` are injected by ``build_css()`` before
# this block.  The ``:root`` block below adds theme-independent tokens.

_BASE = """

/* ===================================================================
   DESIGN TOKENS
   =================================================================== */

:root {
  --ink: #20262d;
  --ink-soft: #3d4750;
  --muted: #667079;
  --paper: #ffffff;
  --panel: #f7faf9;
  --rule: #dde5e2;
  --serif: "DejaVu Serif", Georgia, "Times New Roman", serif;
  --sans: "DejaVu Sans", "Segoe UI", Arial, sans-serif;
  --mono: "DejaVu Sans Mono", Consolas, monospace;

  /* Callout-specific accent colours */
  --clr-definition: #0f766e;
  --clr-formula:    #7c3aed;
  --clr-example:    #0369a1;
  --clr-note:       #4b5563;
  --clr-tip:        #16a34a;
  --clr-warning:    #d97706;
  --clr-question:   #2563eb;
  --clr-answer:     #059669;

  --bg-definition: #ecfdf5;
  --bg-formula:    #f5f3ff;
  --bg-example:    #eff6ff;
  --bg-note:       #f3f4f6;
  --bg-tip:        #f0fdf4;
  --bg-warning:    #fffbeb;
  --bg-question:   #eff6ff;
  --bg-answer:     #ecfdf5;
}


/* ===================================================================
   PAGE SETUP
   =================================================================== */

@page {
  size: A4;
  margin: 16mm 16mm 19mm 16mm;

  @bottom-left {
    content: string(docfooter);
    font-family: var(--sans);
    font-size: 7.5pt;
    color: var(--muted);
  }
  @bottom-right {
    content: "Page " counter(page) " of " counter(pages);
    font-family: var(--sans);
    font-size: 7.5pt;
    color: var(--muted);
  }
  @top-right {
    content: string(doctitle);
    font-family: var(--sans);
    font-size: 7.5pt;
    color: var(--muted);
  }
}

@page cover {
  margin: 0;
  @bottom-left  { content: none; }
  @bottom-right { content: none; }
  @top-right    { content: none; }
}


/* ===================================================================
   BASE TYPOGRAPHY
   =================================================================== */

html, body {
  font-family: var(--serif);
  font-size: 10.5pt;
  line-height: 1.55;
  color: var(--ink);
  background: var(--paper);
  orphans: 3;
  widows: 3;
  hyphens: auto;
}

/* Named-string carrier (hidden; sets running header / footer text) */
.str-carrier {
  string-set: doctitle content(), docfooter content();
  position: absolute;
  left: -1000pt;
  width: 0;
  height: 0;
  overflow: hidden;
}


/* ===================================================================
   COVER PAGE
   =================================================================== */

.cover {
  page: cover;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  min-height: 297mm;       /* A4 height */
  padding: 30mm 24mm 28mm;
  box-sizing: border-box;
  background: var(--paper);
  break-after: page;
}

.cover-rule {
  width: 52mm;
  height: 3.5pt;
  background: var(--accent);
  border-radius: 2pt;
  margin-bottom: 14mm;
}

.cover-brand {
  font-family: var(--sans);
  font-size: 10pt;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent);
  margin-bottom: 6mm;
}

.cover-title-block {
  margin-bottom: 16mm;
}

.cover-subject {
  font-family: var(--sans);
  font-size: 9.5pt;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 3mm;
}

.cover-title {
  font-family: var(--sans);
  font-size: 28pt;
  font-weight: 700;
  line-height: 1.15;
  color: var(--heading);
  margin: 0 0 4mm;
}

.cover-subtitle {
  font-family: var(--serif);
  font-size: 12pt;
  line-height: 1.45;
  color: var(--ink-soft);
  margin: 0 0 2mm;
}

.cover-meta {
  display: flex;
  gap: 12mm;
  border-top: 0.5pt solid var(--rule);
  padding-top: 5mm;
  margin-top: 2mm;
}

.cover-meta-item {
  font-family: var(--sans);
  font-size: 8.5pt;
  color: var(--ink-soft);
  line-height: 1.6;
}

.cover-meta-label {
  display: block;
  font-size: 7pt;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 1mm;
}


/* ===================================================================
   SECTION HEADERS
   =================================================================== */

.section-header {
  display: flex;
  align-items: baseline;
  gap: 3mm;
  margin: 10mm 0 5mm;
  padding-bottom: 2.5mm;
  border-bottom: 1.5pt solid var(--accent);
  break-after: avoid;
}

.section-number {
  font-family: var(--sans);
  font-size: 22pt;
  font-weight: 700;
  color: var(--accent);
  line-height: 1;
}

.section-name {
  font-family: var(--sans);
  font-size: 10pt;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--heading);
}


/* ===================================================================
   HEADINGS
   =================================================================== */

h1 {
  font-family: var(--sans);
  font-size: 18pt;
  font-weight: 700;
  line-height: 1.2;
  color: var(--heading);
  letter-spacing: 0.01em;
  margin: 8mm 0 3mm;
  break-after: avoid;
}

h2 {
  font-family: var(--sans);
  font-size: 14pt;
  font-weight: 600;
  line-height: 1.25;
  color: var(--heading);
  margin: 6mm 0 2.5mm;
  break-after: avoid;
}

h3 {
  font-family: var(--sans);
  font-size: 11.5pt;
  font-weight: 600;
  line-height: 1.3;
  color: var(--accent-strong);
  margin: 5mm 0 2mm;
  break-after: avoid;
}

h4, h5, h6 {
  font-family: var(--sans);
  font-size: 10.5pt;
  font-weight: 600;
  line-height: 1.35;
  color: var(--ink);
  margin: 4mm 0 1.5mm;
  break-after: avoid;
}


/* ===================================================================
   PARAGRAPHS
   =================================================================== */

p {
  margin: 0 0 2.5mm;
  text-align: justify;
  text-indent: 0;
}


/* ===================================================================
   INLINE EMPHASIS
   =================================================================== */

strong, b {
  font-weight: 700;
  color: var(--ink);
}

em, i {
  font-style: italic;
}

code {
  font-family: var(--mono);
  font-size: 9pt;
  background: var(--panel);
  padding: 0.5pt 2pt;
  border-radius: 2pt;
  color: var(--ink);
}


/* ===================================================================
   MATH RENDERING
   =================================================================== */

/* Inline math: <span class="math"><img .../></span> */
.math {
  display: inline;
  vertical-align: middle;
  line-height: 1;
}

.math-img {
  display: inline;
  vertical-align: middle;
  margin: 0 0.5pt;
}

/* Display (block-level) equations */
.equation {
  text-align: center;
  margin: 4mm 0;
  break-inside: avoid;
}

.equation-display {
  padding: 3mm 0;
}

.equation-display .math-img {
  display: inline-block;
  vertical-align: middle;
}

/* Fallback for equations that couldn't be rendered to SVG */
.math-fallback {
  font-family: var(--mono);
  font-size: 9.5pt;
  color: #64748b;
  background: #f8fafc;
  padding: 1pt 4pt;
  border: 0.5pt dashed #cbd5e1;
  border-radius: 2pt;
}


/* ===================================================================
   CALLOUT PANELS
   =================================================================== */

.callout {
  margin: 4mm 0;
  padding: 3.5mm 4mm;
  border-left: 3pt solid var(--accent-line);
  background: var(--panel);
  border-radius: 0 3pt 3pt 0;
  break-inside: avoid;
}

.callout-title {
  font-family: var(--sans);
  font-size: 9.5pt;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2mm;
  color: var(--accent-strong);
}

.callout-body {
  font-size: 10pt;
  line-height: 1.5;
}

.callout-body p {
  margin: 0 0 1.5mm;
}

.callout-body p:last-child {
  margin-bottom: 0;
}

/* --- Variant colours -------------------------------------------------- */

.callout.definition {
  border-left-color: var(--clr-definition);
  background: var(--bg-definition);
}
.callout.definition .callout-title { color: var(--clr-definition); }

.callout.formula {
  border-left-color: var(--clr-formula);
  background: var(--bg-formula);
}
.callout.formula .callout-title { color: var(--clr-formula); }

.callout.example {
  border-left-color: var(--clr-example);
  background: var(--bg-example);
}
.callout.example .callout-title { color: var(--clr-example); }

.callout.note {
  border-left-color: var(--clr-note);
  background: var(--bg-note);
}
.callout.note .callout-title { color: var(--clr-note); }

.callout.tip {
  border-left-color: var(--clr-tip);
  background: var(--bg-tip);
}
.callout.tip .callout-title { color: var(--clr-tip); }

.callout.warning {
  border-left-color: var(--clr-warning);
  background: var(--bg-warning);
}
.callout.warning .callout-title { color: var(--clr-warning); }

.callout.question {
  border-left-color: var(--clr-question);
  background: var(--bg-question);
}
.callout.question .callout-title { color: var(--clr-question); }

.callout.answer {
  border-left-color: var(--clr-answer);
  background: var(--bg-answer);
}
.callout.answer .callout-title { color: var(--clr-answer); }


/* ===================================================================
   FORMULA BOX (centred equation inside a callout)
   =================================================================== */

.formula-equation {
  text-align: center;
  padding: 3mm 0 1mm;
}


/* ===================================================================
   TABLES
   =================================================================== */

table {
  width: 100%;
  border-collapse: collapse;
  margin: 4mm 0;
  font-size: 9.5pt;
  line-height: 1.45;
  break-inside: auto;
}

thead {
  display: table-header-group;     /* repeat header on page break */
}

thead tr {
  background: var(--accent);
}

th {
  font-family: var(--sans);
  font-weight: 600;
  color: var(--paper);
  text-align: left;
  padding: 2.5mm 3mm;
  border-bottom: 1.5pt solid var(--accent-strong);
}

tbody tr {
  border-bottom: 0.5pt solid var(--rule);
}

tbody tr:nth-child(even) {
  background: var(--panel);
}

td {
  padding: 2mm 3mm;
  vertical-align: top;
  color: var(--ink);
}


/* ===================================================================
   CODE BLOCKS
   =================================================================== */

pre {
  font-family: var(--mono);
  font-size: 8.5pt;
  line-height: 1.5;
  background: #1e293b;
  color: #e2e8f0;
  padding: 3.5mm 4mm;
  border-radius: 3pt;
  margin: 3mm 0;
  white-space: pre-wrap;
  word-wrap: break-word;
  break-inside: avoid;
  overflow: hidden;
}


/* ===================================================================
   LISTS
   =================================================================== */

ul, ol {
  margin: 2mm 0 3mm;
  padding-left: 6mm;
}

ul {
  list-style-type: disc;
}

ol {
  list-style-type: decimal;
}

li {
  margin-bottom: 1.5mm;
  line-height: 1.5;
}

li p {
  display: inline;
  margin: 0;
}


/* ===================================================================
   FIGURES & DIAGRAMS
   =================================================================== */

.figure {
  margin: 4mm 0;
  text-align: center;
  break-inside: avoid;
}

.figure-caption {
  font-family: var(--sans);
  font-size: 8.5pt;
  font-style: italic;
  color: var(--muted);
  margin-top: 2mm;
  text-align: center;
}


/* ===================================================================
   HORIZONTAL RULES & PAGE BREAKS
   =================================================================== */

hr, .rule {
  border: none;
  border-top: 0.75pt solid var(--rule);
  margin: 5mm 0;
}

.page-break {
  break-before: page;
}


/* ===================================================================
   QUESTION & ANSWER BLOCKS
   =================================================================== */

.question {
  margin: 4mm 0;
  padding: 3.5mm 4mm;
  border-left: 3pt solid var(--clr-question);
  background: var(--bg-question);
  border-radius: 0 3pt 3pt 0;
  break-inside: avoid;
}

.question .callout-title {
  color: var(--clr-question);
}

.answer {
  margin: 4mm 0;
  padding: 3.5mm 4mm;
  border-left: 3pt solid var(--clr-answer);
  background: var(--bg-answer);
  border-radius: 0 3pt 3pt 0;
  break-inside: avoid;
}

.answer .callout-title {
  color: var(--clr-answer);
}
"""