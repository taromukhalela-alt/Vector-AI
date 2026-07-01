import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from '@react-pdf/renderer';
import { marked } from 'marked';

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  emerald:     '#10b981',
  darkEmerald: '#065f46',
  midEmerald:  '#047857',
  tealLight:   '#6ee7b7',
  bgGreen:     '#f0fdf4',
  bgGreenSoft: '#f7fef9',
  borderGreen: '#a7f3d0',
  borderGreen2:'#bbf7d0',
  bodyText:    '#1e2a23',
  headText:    '#0a1a12',
  mutedText:   '#64748b',
  codeText:    '#065f46',
  codeBg:      '#ecfdf5',
  quoteText:   '#334155',
  white:       '#ffffff',
};

// ── StyleSheet ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Page
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.65,
    color: C.bodyText,
    paddingTop: 48,
    paddingBottom: 62,
    paddingHorizontal: 44,
    backgroundColor: C.white,
  },
  pageTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: C.emerald,
  },

  // ── Header ─────────────────────────────────────────────
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: C.borderGreen2,
    borderRadius: 10,
    backgroundColor: C.bgGreenSoft,
  },
  headerLeft:  { flex: 1, paddingRight: 18, justifyContent: 'space-between' },
  kicker: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.emerald,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    marginBottom: 5,
  },
  headerTitle: {
    fontSize: 19,
    fontFamily: 'Helvetica-Bold',
    color: C.headText,
    lineHeight: 1.15,
  },
  headerRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 104,
    maxWidth: 146,
  },
  badge: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.darkEmerald,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: C.emerald,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  headerDate: { fontSize: 8, color: C.mutedText, textAlign: 'right' },

  // ── Footer (fixed, absolute) ────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 44,
    right: 44,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
    paddingTop: 8,
  },
  footerBrand: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: C.emerald,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  footerInfo: { fontSize: 7, color: C.mutedText },
  pageNumber: { minWidth: 74, textAlign: 'right' },

  // ── Headings ────────────────────────────────────────────
  h1: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.headText,
    marginTop: 20,
    marginBottom: 8,
    paddingBottom: 7,
    borderBottomWidth: 1.5,
    borderBottomColor: C.borderGreen2,
  },
  h2Wrapper: { flexDirection: 'row', marginTop: 16, marginBottom: 8 },
  h2Bar:  { width: 4, backgroundColor: C.emerald, borderRadius: 1 },
  h2Text: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: 'Helvetica-Bold',
    color: C.headText,
    backgroundColor: C.bgGreen,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  h3Wrapper: { flexDirection: 'row', marginTop: 13, marginBottom: 6 },
  h3Bar:  { width: 2.5, backgroundColor: C.tealLight, borderRadius: 1 },
  h3Text: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.darkEmerald,
    paddingLeft: 9,
    paddingVertical: 2,
  },
  h4: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: C.midEmerald,
    marginTop: 10,
    marginBottom: 5,
  },

  // ── Inline / paragraph ─────────────────────────────────
  inlineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 9,
  },
  span:       { fontSize: 10.5, color: C.bodyText },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: C.codeText,
    backgroundColor: C.codeBg,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },

  // ── Lists ──────────────────────────────────────────────
  listContainer: { marginBottom: 9 },
  listItem: { flexDirection: 'row', marginBottom: 4, paddingLeft: 8 },
  listBullet: {
    width: 14,
    fontSize: 10.5,
    color: C.emerald,
    fontFamily: 'Helvetica-Bold',
    flexShrink: 0,
  },
  listBody: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },

  // ── Blockquote ─────────────────────────────────────────
  bqWrapper: { flexDirection: 'row', marginTop: 10, marginBottom: 14 },
  bqBar: { width: 3.5, backgroundColor: C.emerald, borderRadius: 1 },
  bqBody: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: C.borderGreen,
    borderBottomColor: C.borderGreen,
    borderRightColor: C.borderGreen,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: C.bgGreenSoft,
  },

  // ── Code block ─────────────────────────────────────────
  codeWrapper: { flexDirection: 'row', marginTop: 10, marginBottom: 14 },
  codeBar: { width: 3.5, backgroundColor: C.emerald, borderRadius: 1 },
  codeBody: {
    flex: 1,
    padding: 11,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: C.borderGreen,
    borderBottomColor: C.borderGreen,
    borderRightColor: C.borderGreen,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: '#f8fafc',
  },
  codeBodyText: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: '#0f172a',
    lineHeight: 1.55,
  },

  // ── HR ─────────────────────────────────────────────────
  hr: {
    marginTop: 16,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: C.borderGreen2,
  },

  // ── Table ──────────────────────────────────────────────
  tableWrapper: {
    marginTop: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.borderGreen,
    borderRadius: 6,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#065f46',
    borderBottomWidth: 2,
    borderBottomColor: C.emerald,
  },
  tableBodyRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#d1fae5',
  },
  tableBodyRowEven:    { backgroundColor: C.bgGreenSoft },
  tableCell:           { flex: 1, padding: 7, borderRightWidth: 1, borderRightColor: '#d1fae5' },
  tableCellLast:       { borderRightWidth: 0 },
  tableHeaderCellText: { fontFamily: 'Helvetica-Bold', fontSize: 9, color: '#ecfdf5', letterSpacing: 0.3 },
  tableBodyCellText:   { fontSize: 9.5, color: C.bodyText },

  // ── Display math ───────────────────────────────────────
  mathDisplayWrapper: { flexDirection: 'row', marginTop: 12, marginBottom: 16 },
  mathDisplayBar: { width: 3.5, backgroundColor: C.emerald, borderRadius: 1 },
  mathDisplayBody: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderTopColor: C.borderGreen,
    borderBottomColor: C.borderGreen,
    borderRightColor: C.borderGreen,
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: C.bgGreenSoft,
  },
  mathFallback: {
    fontFamily: 'Courier',
    fontSize: 10,
    color: C.codeText,
    paddingHorizontal: 4,
    paddingVertical: 3,
    backgroundColor: C.codeBg,
  },
});

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Extracts raw plain text from a marked inline token array (strips math tokens). */
function getPlainText(tokens = []) {
  return tokens
    .map((t) => {
      if (t.tokens) return getPlainText(t.tokens);
      const raw = t.text || t.raw || '';
      return raw.replace(/@@MATH_\d+@@/g, '');
    })
    .join('');
}

/**
 * Splits a raw text string by @@MATH_N@@ markers, returning an array of
 * { kind: 'text' | 'math', value } segments.
 */
function splitMath(raw = '') {
  const parts = raw.split(/(@@MATH_\d+@@)/);
  return parts
    .filter(Boolean)
    .map((p) => (/^@@MATH_\d+@@$/.test(p) ? { kind: 'math', value: p } : { kind: 'text', value: p }));
}

/**
 * Converts inline marked tokens → flat array of <Text> / <Image> React PDF elements.
 * Intended as children of a <View style={{ flexDirection:'row', flexWrap:'wrap' }}.
 */
function getInlineElements(tokens = [], mathImages = {}, textStyle = {}, keyPrefix = 'il') {
  const elems = [];
  let k = 0;
  const key = () => `${keyPrefix}-${k++}`;

  for (const token of tokens) {
    switch (token.type) {
      case 'text':
      case 'escape': {
        const segs = splitMath(token.text || token.raw || '');
        for (const seg of segs) {
          if (seg.kind === 'math') {
            const img = mathImages[seg.value];
            if (img?.dataUrl) {
              const scale = img.display ? 0.78 : 0.56;
              elems.push(
                <Image
                  key={key()}
                  src={img.dataUrl}
                  style={{
                    width:  Math.min(img.width  * scale, img.display ? 350 : 90),
                    height: img.height * scale,
                    objectFit: 'contain',
                  }}
                />,
              );
            } else {
              elems.push(
                <Text key={key()} style={{ ...textStyle, fontFamily: 'Courier', fontSize: 9, color: C.codeText }}>
                  {img?.latex ? `[${img.latex}]` : seg.value}
                </Text>,
              );
            }
          } else {
            if (seg.value) {
              elems.push(<Text key={key()} style={textStyle}>{seg.value}</Text>);
            }
          }
        }
        break;
      }

      case 'strong': {
        const boldStyle = {
          ...textStyle,
          fontFamily:
            textStyle.fontFamily === 'Helvetica-Oblique'
              ? 'Helvetica-BoldOblique'
              : 'Helvetica-Bold',
          color: textStyle.color || C.headText,
        };
        elems.push(
          ...getInlineElements(
            token.tokens || [{ type: 'text', text: token.text || '' }],
            mathImages, boldStyle, key(),
          ),
        );
        break;
      }

      case 'em': {
        const emStyle = {
          ...textStyle,
          fontFamily:
            textStyle.fontFamily === 'Helvetica-Bold'
              ? 'Helvetica-BoldOblique'
              : 'Helvetica-Oblique',
        };
        elems.push(
          ...getInlineElements(
            token.tokens || [{ type: 'text', text: token.text || '' }],
            mathImages, emStyle, key(),
          ),
        );
        break;
      }

      case 'codespan':
        elems.push(<Text key={key()} style={S.inlineCode}>{token.text || ''}</Text>);
        break;

      case 'link':
        elems.push(
          ...getInlineElements(
            token.tokens || [{ type: 'text', text: token.text || '' }],
            mathImages,
            { ...textStyle, color: C.midEmerald },
            key(),
          ),
        );
        break;

      case 'br':
        elems.push(<Text key={key()} style={textStyle}>{'\n'}</Text>);
        break;

      default:
        if (token.text) elems.push(<Text key={key()} style={textStyle}>{token.text}</Text>);
    }
  }

  return elems;
}

// ── Block renderers ──
function renderHeading(token, key) {
  const text = getPlainText(token.tokens || [{ type: 'text', text: token.text || '' }]);
  if (token.depth === 1) return <Text key={key} style={S.h1}>{text}</Text>;
  if (token.depth === 2)
    return (
      <View key={key} style={S.h2Wrapper}>
        <View style={S.h2Bar} /><Text style={S.h2Text}>{text}</Text>
      </View>
    );
  if (token.depth === 3)
    return (
      <View key={key} style={S.h3Wrapper}>
        <View style={S.h3Bar} /><Text style={S.h3Text}>{text}</Text>
      </View>
    );
  return <Text key={key} style={S.h4}>{text}</Text>;
}

/** Returns the math key if a paragraph contains only a single display math token. */
function extractDisplayMath(token) {
  if (token.type !== 'paragraph') return null;
  const toks = token.tokens || [];
  if (toks.length === 1 && toks[0].type === 'text') {
    const trimmed = (toks[0].text || '').trim();
    if (/^@@MATH_\d+@@$/.test(trimmed)) return trimmed;
  }
  return null;
}

function renderDisplayMath(mathKey, mathImages, key) {
  const img = mathImages[mathKey];
  return (
    <View key={key} style={S.mathDisplayWrapper}>
      <View style={S.mathDisplayBar} />
      <View style={S.mathDisplayBody}>
        {img?.dataUrl ? (
          <Image
            src={img.dataUrl}
            style={{
              width:  Math.min(img.width * 0.78, 350),
              height: img.height * 0.78,
              objectFit: 'contain',
            }}
          />
        ) : (
          <Text style={S.mathFallback}>{img?.latex || mathKey}</Text>
        )}
      </View>
    </View>
  );
}

function renderParagraph(token, mathImages, key) {
  const toks = token.tokens || [{ type: 'text', text: token.text || '' }];
  return (
    <View key={key} style={S.inlineRow}>
      {getInlineElements(toks, mathImages, S.span, key)}
    </View>
  );
}

/** Gets the inline + nested-list tokens from a list item. */
function getListItemParts(item) {
  const toks = item.tokens || [];
  const para  = toks.find((t) => t.type === 'paragraph');
  if (para) {
    return {
      inline: para.tokens || [],
      nested: toks.filter((t) => t.type === 'list'),
    };
  }
  return {
    inline: toks.filter((t) => t.type !== 'list' && t.type !== 'space'),
    nested: toks.filter((t) => t.type === 'list'),
  };
}

function renderList(token, mathImages, key) {
  return (
    <View key={key} style={S.listContainer}>
      {(token.items || []).map((item, i) => {
        const { inline, nested } = getListItemParts(item);
        const bullet = token.ordered ? `${(token.start || 1) + i}.` : '•';
        return (
          <View key={`${key}-${i}`}>
            <View style={S.listItem}>
              <Text style={S.listBullet}>{bullet} </Text>
              <View style={S.listBody}>
                {getInlineElements(inline, mathImages, S.span, `${key}-li${i}`)}
              </View>
            </View>
            {nested.map((nl, j) => (
              <View key={`${key}-${i}-n${j}`} style={{ paddingLeft: 18 }}>
                {renderList(nl, mathImages, `${key}-${i}-n${j}`)}
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function renderCode(token, key) {
  return (
    <View key={key} style={S.codeWrapper}>
      <View style={S.codeBar} />
      <View style={S.codeBody}>
        <Text style={S.codeBodyText}>{token.text || ''}</Text>
      </View>
    </View>
  );
}

function renderBlockquote(token, mathImages, key) {
  return (
    <View key={key} style={S.bqWrapper}>
      <View style={S.bqBar} />
      <View style={S.bqBody}>
        {(token.tokens || []).map((t, i) => {
          if (t.type !== 'paragraph') return null;
          return (
            <View key={i} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
              {getInlineElements(
                t.tokens || [{ type: 'text', text: t.text || '' }],
                mathImages,
                { ...S.span, fontFamily: 'Helvetica-Oblique', color: C.quoteText },
                `${key}-bq${i}`,
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function renderTable(token, mathImages, key) {
  const header = token.header || [];
  const rows   = token.rows   || [];
  return (
    <View key={key} style={S.tableWrapper}>
      <View style={S.tableHeaderRow}>
        {header.map((cell, j) => (
          <View key={j} style={[S.tableCell, j === header.length - 1 && S.tableCellLast]}>
            <Text style={S.tableHeaderCellText}>
              {getPlainText(cell.tokens || [{ type: 'text', text: cell.text || '' }])}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row, i) => (
        <View key={i} style={[S.tableBodyRow, i % 2 === 1 && S.tableBodyRowEven]}>
          {row.map((cell, j) => (
            <View key={j} style={[S.tableCell, j === row.length - 1 && S.tableCellLast]}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
                {getInlineElements(
                  cell.tokens || [{ type: 'text', text: cell.text || '' }],
                  mathImages,
                  S.tableBodyCellText,
                  `${key}-r${i}c${j}`,
                )}
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Routes a marked block token to its renderer. */
function renderBlock(token, mathImages, index) {
  const key = `blk-${index}`;
  switch (token.type) {
    case 'heading':    return renderHeading(token, key);
    case 'paragraph': {
      const mk = extractDisplayMath(token);
      return mk
        ? renderDisplayMath(mk, mathImages, key)
        : renderParagraph(token, mathImages, key);
    }
    case 'list':       return renderList(token, mathImages, key);
    case 'code':       return renderCode(token, key);
    case 'blockquote': return renderBlockquote(token, mathImages, key);
    case 'table':      return renderTable(token, mathImages, key);
    case 'hr':         return <View key={key} style={S.hr} />;
    case 'space':      return <View key={key} style={{ height: 5 }} />;
    default:           return null;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function NotesPdfDocument({ note, mathImages = {} }) {
  const { title = 'Study Note', topic = 'General', content = '' } = note || {};

  const tokens = React.useMemo(() => {
    try {
      return marked.lexer(content, { gfm: true });
    } catch {
      return [];
    }
  }, [content]);

  const dateStr = new Date().toLocaleDateString('en-ZA', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <Document
      title={title}
      author="Vector AI"
      subject={topic}
      keywords={`physical science, study notes, ${topic}`}
    >
      <Page size="A4" style={S.page}>
        <View fixed style={S.pageTopAccent} />

        {/* ── Page header (first page only) ── */}
        <View style={S.headerRow}>
          <View style={S.headerLeft}>
            <Text style={S.kicker}>Vector AI · Physical Science</Text>
            <Text style={S.headerTitle}>{title}</Text>
          </View>
          <View style={S.headerRight}>
            <Text style={S.badge}>{topic}</Text>
            <Text style={S.headerDate}>{dateStr}</Text>
          </View>
        </View>

        {/* ── Body ── */}
        {tokens.map((token, i) => renderBlock(token, mathImages, i))}

        {/* ── Footer (repeats on every page) ── */}
        <View fixed style={S.footer}>
          <Text style={S.footerInfo}>By Taro Mukhalela</Text>
          <Text style={S.footerBrand}>Vector AI</Text>
          <Text
            style={[S.footerInfo, S.pageNumber]}
            render={({ pageNumber, totalPages }) => `${topic} · ${pageNumber}/${totalPages}`}
          />
        </View>

      </Page>
    </Document>
  );
}
