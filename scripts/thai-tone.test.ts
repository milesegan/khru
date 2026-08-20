import { describe, expect, it } from "vitest";
import { conversation } from "../src/data/conversation";
import { words } from "../src/data/words";
import {
  deriveTone,
  markSyllable,
  markTransliteration,
  segmentSyllables,
} from "./thai-tone.mjs";

/**
 * Tones taken from standard references rather than from this repo's decks, so
 * the rules are checked independently of the deck author's assumptions.
 */
const KNOWN_TONES: [string, string][] = [
  ["น้ำ", "high"],
  ["ข้าว", "falling"],
  ["ไก่", "low"],
  ["หมู", "rising"],
  ["ปลา", "mid"],
  ["เก้า", "falling"],
  ["สิบ", "low"],
  ["ห้า", "falling"],
  ["รัก", "high"],
  ["ดี", "mid"],
  ["ทำ", "mid"],
  ["คน", "mid"],
  ["ใหญ่", "low"],
  ["เล็ก", "high"],
  ["ร้อน", "high"],
  ["เย็น", "mid"],
  ["หนาว", "rising"],
  ["หมา", "rising"],
  ["ม้า", "high"],
  ["มา", "mid"],
  ["ไป", "mid"],
  ["กิน", "mid"],
  ["นอน", "mid"],
  ["ดื่ม", "low"],
  ["เขียน", "rising"],
  ["อ่าน", "low"],
  ["พูด", "falling"],
  ["ฟัง", "mid"],
  ["ซื้อ", "high"],
  ["ขาย", "rising"],
  ["ถูก", "low"],
  ["แพง", "mid"],
  ["ช้า", "high"],
  ["เร็ว", "mid"],
  ["ยาว", "mid"],
  ["สั้น", "falling"],
  ["สูง", "rising"],
  ["ต่ำ", "low"],
  ["หนัก", "low"],
  ["เบา", "mid"],
];

/**
 * Entries the rules cannot align, so they never reach the drift check. All of
 * them still lack tone marks; none is an entry whose marks failed to verify.
 */
const EXEMPT_FROM_DRIFT: Record<string, number> = {
  words: 5,
  conversation: 10,
};

describe("thai-tone", () => {
  it.each(KNOWN_TONES)("derives the tone of %s as %s", (thai, expected) => {
    const spans = segmentSyllables(thai);
    expect(spans).toHaveLength(1);
    expect(deriveTone(spans[0]).tone).toBe(expected);
  });

  it("applies the ห leading-consonant rule", () => {
    // ม is low class, but ห in front makes หมา follow high-class rules.
    expect(deriveTone(segmentSyllables("มา")[0]).tone).toBe("mid");
    expect(deriveTone(segmentSyllables("หมา")[0]).tone).toBe("rising");
  });

  it("applies อักษรนำ class inheritance", () => {
    // ส lends its high class to วัส, so สวัสดี is sà-wàt-dii, not sà-wát-dii.
    const spans = segmentSyllables("สวัสดี");
    expect(spans.map((span) => span.text)).toEqual(["ส", "วัส", "ดี"]);
    expect(spans.map((span) => deriveTone(span).tone)).toEqual([
      "low",
      "low",
      "mid",
    ]);
  });

  it("treats karan-marked consonants as silent", () => {
    expect(segmentSyllables("วันจันทร์").map((span) => span.text)).toEqual([
      "วัน",
      "จัน",
    ]);
  });

  it("places the diacritic on the first vowel letter", () => {
    expect(markSyllable("khrop", "falling")).toBe("khrôp");
    expect(markSyllable("dek", "low")).toBe("dèk");
    expect(markSyllable("maa", "mid")).toBe("maa");
  });

  it("honours the irregulars table", () => {
    // ก็ is written short and dead but spoken long and falling.
    expect(markTransliteration("ก็", "ko")).toBe("kô");
  });

  it("is idempotent", () => {
    const once = markTransliteration("เด็ก", "dek");
    expect(once).toBe("dèk");
    expect(markTransliteration("เด็ก", once!)).toBe("dèk");
  });

  it("returns null when syllable counts disagree", () => {
    // ผลไม้ is phǒn-lá-mái: ล is read twice, so the rules cannot align it.
    expect(markTransliteration("ผลไม้", "phon-la-mai")).toBeNull();
  });

  it.each([
    ["words", words],
    ["conversation", conversation],
  ])("matches every tone mark in the %s deck", (name, deck) => {
    // markTransliteration returns null for readings the rules cannot align,
    // and those entries drop out of the drift check below. Pin how many are
    // exempt: without a floor, a segmentation regression would turn marked
    // entries into nulls and make this test pass by checking less.
    const exempt = deck.filter(
      (entry) =>
        markTransliteration(entry.thai, entry.transliteration) === null,
    );
    expect(exempt.length).toBe(EXEMPT_FROM_DRIFT[name]);

    const drifted = deck
      .map((entry) => ({
        entry,
        derived: markTransliteration(entry.thai, entry.transliteration),
      }))
      .filter(
        ({ entry, derived }) =>
          derived !== null &&
          derived.normalize("NFC") !== entry.transliteration.normalize("NFC"),
      )
      .map(
        ({ entry, derived }) =>
          `${entry.thai}: ${entry.transliteration} != ${derived}`,
      );

    expect(drifted).toEqual([]);
  });
});
