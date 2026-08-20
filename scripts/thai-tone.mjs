// Derives the tone of a Thai syllable from its spelling.
//
// Thai writes tone into the script: the class of the initial consonant, any
// tone mark, the vowel length, and whether the syllable is live or dead
// together determine the tone. This module implements those rules so the
// romanised tone marks in src/data can be generated and checked rather than
// hand-authored.
//
// Covered here: consonant classes, the four tone marks, live/dead syllables,
// initial clusters, ห/อ leading consonants, อักษรนำ class inheritance, and
// karan (์) silencing. Not covered: words whose spoken form departs from the
// spelling (loanwords, และ-style irregulars) — list those in IRREGULARS.

const MID = new Set([..."กจฎฏดตบปอ"]);
const HIGH = new Set([..."ขฃฉฐถผฝศษสห"]);

const TONE_NAMES = { "่": "ek", "้": "tho", "๊": "tri", "๋": "chattawa" };

const SONORANT_FINALS = new Set([..."งญณนมยรลฬว"]);
const STOP_FINALS = new Set([..."กขคฆจชซฌฎฏฐฑฒดตถทธศษสบปพฟภ"]);
const H_LEADABLE = new Set([..."งญนมยรลว"]);
const CLUSTERS = new Set([
  "กร",
  "กล",
  "กว",
  "ขร",
  "ขล",
  "ขว",
  "คร",
  "คล",
  "คว",
  "ตร",
  "ปร",
  "ปล",
  "ผล",
  "พร",
  "พล",
  "บร",
  "บล",
  "ดร",
  "ฟร",
  "ฟล",
  "ทร",
  "จร",
  "ซร",
  "สร",
  "ศร",
]);
const isCluster = (a, b) => CLUSTERS.has(a + b);

// \u0e4c is karan, which silences the consonant it sits on.
const THAI_KARAN_RE =
  /[\u0e01-\u0e2e][\u0e30-\u0e39\u0e47]?[\u0e48-\u0e4b]?\u0e4c/g;
// A syllable takes only one final consonant; a second one is silent.
const THAI_DOUBLE_FINAL_RE =
  /([\u0e30-\u0e39\u0e47])([\u0e01-\u0e2e])([\u0e01-\u0e2e])$/u;

const isConsonant = (c) => c >= "ก" && c <= "ฮ";
export function consonantClass(c) {
  if (MID.has(c)) return "mid";
  if (HIGH.has(c)) return "high";
  return "low";
}

const C = "[ก-ฮ]";
// initial: ห-lead, true cluster, or bare consonant
const INIT = `(?:ห[${[...H_LEADABLE].join("")}]|อย|${[...CLUSTERS].join("|")}|${C})`;
const VALID_FINALS = "กขคฆงจชซฌฎฏฐฑฒดตถทธศษสญณนรลฬมยวบปพฟภ";
const BINDING = "ะาำิีึืุูั็";
// a final must not be followed by a vowel sign that binds it forward as an initial
const CLUSTER_LOOKAHEAD = [...CLUSTERS]
  .map((c) => c[0] + "(?=" + c[1] + ")")
  .join("|");
const F = `(?:(?!${CLUSTER_LOOKAHEAD})[${VALID_FINALS}](?![${BINDING}]))`;

// Ordered longest-first. Each entry: [regex source, {long, live?}]
// `live: null` means "decide from the final consonant".
const PATTERNS = [
  [`เ${INIT}ียะ`, { long: false, live: false }],
  [`เ${INIT}ือะ`, { long: false, live: false }],
  [`เ${INIT}ีย${F}?`, { long: true }],
  [`เ${INIT}ือ${F}?`, { long: true }],
  [`เ${INIT}อะ`, { long: false, live: false }],
  [`เ${INIT}อ${F}?`, { long: true }],
  [`เ${INIT}าะ`, { long: false, live: false }],
  [`เ${INIT}ิ${F}?`, { long: true }],
  [`เ${INIT}็${F}`, { long: false }],
  [`เ${INIT}า`, { long: false, live: true }], // -ao, live
  [`เ${INIT}ะ`, { long: false, live: false }],
  [`เ${INIT}${F}?`, { long: true }],
  [`แ${INIT}็${F}`, { long: false }],
  [`แ${INIT}ะ`, { long: false, live: false }],
  [`แ${INIT}${F}?`, { long: true }],
  [`โ${INIT}ะ`, { long: false, live: false }],
  [`โ${INIT}${F}?`, { long: true }],
  [`ใ${INIT}`, { long: false, live: true }],
  [`ไ${INIT}ย`, { long: false, live: true }],
  [`ไ${INIT}`, { long: false, live: true }],
  [`${INIT}ือ${F}?`, { long: true }],
  [`${INIT}ัวะ`, { long: false, live: false }],
  [`${INIT}ัว${F}?`, { long: true }],
  [`${INIT}ำ`, { long: false, live: true }],
  [`${INIT}ั${F}`, { long: false }],
  [`${INIT}็${F}?`, { long: false }],
  [`${INIT}[ีืานูึิุ]ย${F}`, { long: true }],
  [`${INIT}[ีืู]${F}?`, { long: true }],
  [`${INIT}[ิึุ]${F}?`, { long: false }],
  [`${INIT}า${F}?`, { long: true }],
  [`${INIT}ะ`, { long: false, live: false }],
  [`${INIT}อ${F}?`, { long: true }],
  [`${INIT}ว${F}`, { long: true }],
  [`${INIT}ฤ`, { long: false }],
  [`${INIT}${F}`, { long: false, implied: true }], // implied vowel, e.g. คน ผม
  [`${INIT}`, { long: false, live: false, bare: true }],
];
const COMPILED = PATTERNS.map(([src, meta]) => [
  new RegExp("^" + src),
  meta,
  src.endsWith("?"), // optional final -> also try the parse without it
]);

/**
 * Segment Thai text into syllables. Tone marks are stripped before matching
 * and re-attached afterwards, so patterns stay readable.
 */
export function segmentSyllables(thai) {
  const results = [];
  for (const chunk of thai.split(/[\s\u200b]+/).filter(Boolean)) {
    // ์ (karan) silences the consonant it sits on; if that leaves two bare
    // consonants after the nucleus, the trailing one is silent too (e.g. จันทร์).
    let cleaned = chunk.replace(/[ๆ]/g, "").replace(THAI_KARAN_RE, "");
    cleaned = cleaned.replace(THAI_DOUBLE_FINAL_RE, "$1$2");

    const marks = [];
    let bare = "";
    for (const ch of cleaned) {
      if (TONE_NAMES[ch]) marks.push([bare.length, ch]);
      else bare += ch;
    }

    // Search all parses, preferring those that rely least on implied vowels.
    const memo = new Map();
    function parse(i) {
      if (i >= bare.length) return { spans: [], cost: 0 };
      if (memo.has(i)) return memo.get(i);
      let best = null;
      const consider = (text, meta, extra = 0) => {
        if (!text) return;
        const rest = parse(i + text.length);
        if (!rest) return;
        const own = meta.bare ? 10 : meta.implied ? 3 : 0;
        const cost = own + extra + rest.cost + 1; // +1 mildly prefers fewer syllables
        if (!best || cost < best.cost) {
          best = {
            spans: [
              { start: i, end: i + text.length, text, meta },
              ...rest.spans,
            ],
            cost,
          };
        }
      };
      for (const [re, meta, optFinal] of COMPILED) {
        const m = re.exec(bare.slice(i));
        if (!m || !m[0]) continue;
        consider(m[0], meta);
        // the optional final is matched greedily; also try releasing it
        if (optFinal && isConsonant(m[0][m[0].length - 1])) {
          consider(m[0].slice(0, -1), meta);
        }
      }
      // last resort: consume one character so a hard word degrades locally
      if (!best) consider(bare[i], { bare: true }, 20);
      memo.set(i, best);
      return best;
    }
    const parsed = parse(0);
    const spans = parsed ? parsed.spans : [];

    // re-attach tone marks
    for (const span of spans) {
      span.marks = marks
        .filter(([pos]) => pos > span.start && pos <= span.end)
        .map(([, ch]) => ch);
    }
    // อักษรนำ: a bare high/mid consonant lends its class to the next syllable
    // when that syllable starts with a low-class sonorant (e.g. สวัสดี, ขนม).
    for (let k = 0; k < spans.length - 1; k += 1) {
      const lead = spans[k];
      const next = spans[k + 1];
      const leadChars = [...lead.text].filter(isConsonant);
      if (!lead.meta.bare || leadChars.length !== 1) continue;
      if (lead.marks && lead.marks.length) continue;
      const leadClass = consonantClass(leadChars[0]);
      if (leadClass === "low") continue;
      const nextInitial = [...next.text].filter(isConsonant)[0];
      if (!nextInitial || !H_LEADABLE.has(nextInitial)) continue;
      if (consonantClass(nextInitial) !== "low") continue;
      next.inheritedClass = leadClass;
    }

    results.push(...spans);
  }
  return results;
}

/** Derive the tone of one segmented syllable span. */
export function deriveTone(span) {
  const { text, meta, marks = [], inheritedClass } = span;
  const chars = [...text];
  const consonants = chars.filter(isConsonant);
  if (!consonants.length) return { tone: null };

  // effective class of the initial
  let effClass;
  let initialLen = 1;
  const [c0, c1] = consonants;
  if (c0 === "ห" && c1 && H_LEADABLE.has(c1)) {
    effClass = "high";
    initialLen = 2;
  } else if (c0 === "อ" && c1 === "ย") {
    effClass = "mid";
    initialLen = 2;
  } else if (c1 && isCluster(c0, c1) && !meta.bare) {
    effClass = consonantClass(c0);
    initialLen = 2;
  } else effClass = inheritedClass ?? consonantClass(c0);

  const mark = marks.length ? TONE_NAMES[marks[marks.length - 1]] : null;

  // live / dead
  const finalCons =
    consonants.length > initialLen ? consonants[consonants.length - 1] : null;
  let live;
  if (meta.live !== undefined && meta.live !== null) live = meta.live;
  else if (finalCons && STOP_FINALS.has(finalCons)) live = false;
  else if (finalCons && SONORANT_FINALS.has(finalCons)) live = true;
  else live = meta.long;

  const longVowel = meta.long;

  let tone;
  if (mark === "ek") tone = effClass === "low" ? "falling" : "low";
  else if (mark === "tho") tone = effClass === "low" ? "high" : "falling";
  else if (mark === "tri") tone = "high";
  else if (mark === "chattawa") tone = "rising";
  else if (live) tone = effClass === "high" ? "rising" : "mid";
  else if (effClass === "low") tone = longVowel ? "falling" : "high";
  else tone = "low";

  return { tone, effClass, live, longVowel, mark, final: finalCons };
}

const DIACRITICS = {
  mid: "",
  low: "\u0300",
  falling: "\u0302",
  high: "\u0301",
  rising: "\u030c",
};

/** Syllables whose spoken tone does not follow the written rules. */
export const IRREGULARS = {
  "\u0e01\u0e47": ["falling"], // ก็ — written short/dead, spoken long and falling
};

/** Place a tone diacritic on the first vowel letter of a romanised syllable. */
export function markSyllable(roman, tone) {
  const diacritic = DIACRITICS[tone];
  if (!diacritic) return roman;
  const index = roman.search(/[aeiou]/i);
  if (index === -1) return roman;
  return (
    roman.slice(0, index + 1) +
    diacritic +
    roman.slice(index + 1)
  ).normalize("NFC");
}

/**
 * Add tone diacritics to a romanised reading of `thai`.
 *
 * Any diacritics already on `roman` are stripped first, so this is idempotent
 * and preserves the vowel spelling of hand-authored entries. Returns null when
 * the Thai syllable count does not match the romanised token count, which
 * means the entry needs a human decision rather than a generated answer.
 */
export function markTransliteration(thai, roman) {
  const spans = segmentSyllables(thai);
  const tones = IRREGULARS[thai] ?? spans.map((span) => deriveTone(span).tone);

  const stripped = roman
    .normalize("NFD")
    .replace(/[\u0300\u0301\u0302\u030c]/g, "")
    .normalize("NFC");

  const parts = stripped.split(/(\s+|-)/);
  const tokenIndexes = parts
    .map((part, index) => (part && !/^(\s+|-)$/.test(part) ? index : -1))
    .filter((index) => index !== -1);

  if (tokenIndexes.length !== tones.length) return null;

  const output = [...parts];
  tokenIndexes.forEach((partIndex, toneIndex) => {
    output[partIndex] = markSyllable(parts[partIndex], tones[toneIndex]);
  });
  return output.join("").normalize("NFC");
}
