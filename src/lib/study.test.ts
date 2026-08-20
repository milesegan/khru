import { describe, expect, it } from "vitest";
import {
  applyRating,
  countKnownItems,
  createInitialProgress,
  getDueStudyItems,
  getStudyItems,
  isKnownItem,
  matchesCategory,
  resetProgressForItemIds,
} from "./study";
import type { StudyDecks, StudyEntry } from "../types";

const decks: StudyDecks = {
  words: [
    {
      id: "chan",
      thai: "ฉัน",
      transliteration: "chàn",
      meaning: "I; me",
      note: "Test note",
      difficulty: 1,
      tags: ["pronoun"],
    },
    {
      id: "baan",
      thai: "บ้าน",
      transliteration: "bâan",
      meaning: "house",
      note: "Test note",
      difficulty: 1,
      tags: ["place"],
    },
    {
      id: "poet",
      thai: "เปิด",
      transliteration: "pòet",
      meaning: "open",
      note: "Test note",
      difficulty: 1,
      tags: ["sign"],
    },
  ],
  conversation: [
    {
      id: "conv-sawasdee",
      thai: "สวัสดีครับ",
      transliteration: "sawatdi khrap",
      meaning: "Hello.",
      note: "Test note",
      difficulty: 1,
      tags: ["greetings"],
    },
    {
      id: "conv-ton-ni-ki-mong",
      thai: "ตอนนี้กี่โมง",
      transliteration: "ton ni ki mong",
      meaning: "What time is it now?",
      note: "Test note",
      difficulty: 1,
      tags: ["time"],
    },
  ],
};

describe("study helpers", () => {
  it("creates progress for every item in both modes", () => {
    const progress = createInitialProgress(decks);

    expect(Object.keys(progress.words)).toEqual(["chan", "baan", "poet"]);
    expect(Object.keys(progress.conversation)).toEqual([
      "conv-sawasdee",
      "conv-ton-ni-ki-mong",
    ]);
    expect(progress.words.chan.familiarity).toBe(0);
    expect(progress.conversation["conv-sawasdee"].familiarity).toBe(0);
  });

  it("keeps failed word cards due sooner than known word cards", () => {
    const start = createInitialProgress(decks);
    const now = new Date("2026-03-11T10:00:00.000Z");

    const afterKnown = applyRating(start, "words", "chan", "known", now);
    const afterAgain = applyRating(afterKnown, "words", "baan", "again", now);
    const queue = getDueStudyItems(
      decks.words,
      afterAgain,
      "words",
      new Date("2026-03-11T10:06:00.000Z"),
    );

    expect(queue.map((item) => item.id)).toEqual(["poet", "baan"]);
  });

  it("searches across Thai, transliteration, and meaning", () => {
    const progress = createInitialProgress(decks);

    expect(
      getDueStudyItems(
        decks.conversation,
        progress,
        "conversation",
        new Date(),
        "Hello",
      ).map((item) => item.id),
    ).toEqual(["conv-sawasdee"]);
    expect(
      getDueStudyItems(
        decks.conversation,
        progress,
        "conversation",
        new Date(),
        "ton ni",
      ).map((item) => item.id),
    ).toEqual(["conv-ton-ni-ki-mong"]);
    expect(
      getDueStudyItems(decks.words, progress, "words", new Date(), "chàn").map(
        (item) => item.id,
      ),
    ).toEqual(["chan"]);
    // The stored reading carries tone marks, so an unaccented query has to
    // match it: that is what lets a single marked field serve search too.
    expect(
      getDueStudyItems(decks.words, progress, "words", new Date(), "chan").map(
        (item) => item.id,
      ),
    ).toEqual(["chan"]);
    expect(
      getDueStudyItems(decks.words, progress, "words", new Date(), "ฉัน").map(
        (item) => item.id,
      ),
    ).toEqual(["chan"]);
  });

  it("matches conversation categories against the active mode config", () => {
    const greeting = decks.conversation[0] as StudyEntry;
    const timeQuestion = decks.conversation[1] as StudyEntry;

    expect(matchesCategory(greeting, "conversation", "greetings")).toBe(true);
    expect(matchesCategory(greeting, "conversation", "time")).toBe(false);
    expect(matchesCategory(timeQuestion, "conversation", "time")).toBe(true);
    expect(matchesCategory(timeQuestion, "conversation", "signs")).toBe(false);
  });

  it("randomizes cards that share the same priority", () => {
    const progress = createInitialProgress({
      ...decks,
      words: decks.words.slice(0, 2),
    });
    const randomValues = [0.0];
    let index = 0;

    const queue = getDueStudyItems(
      decks.words.slice(0, 2),
      progress,
      "words",
      new Date(),
      "",
      "all",
      () => randomValues[index++] ?? 0,
    );

    expect(queue.map((item) => item.id)).toEqual(["baan", "chan"]);
  });

  it("keeps future unknown cards in the rotation after due cards run out", () => {
    const now = new Date("2026-03-11T10:00:00.000Z");
    const progress = applyRating(
      createInitialProgress({
        ...decks,
        words: decks.words.slice(0, 2),
      }),
      "words",
      "chan",
      "okay",
      now,
    );

    const queue = getStudyItems(
      decks.words.slice(0, 2),
      progress,
      "words",
      now,
      "",
      "all",
      () => 0.999,
    );

    expect(queue.map((item) => item.id)).toEqual(["baan", "chan"]);
  });

  it("does not treat repeated okay ratings as known", () => {
    const now = new Date("2026-03-11T10:00:00.000Z");
    const afterFirstOkay = applyRating(
      createInitialProgress(decks),
      "words",
      "chan",
      "okay",
      now,
    );
    const afterSecondOkay = applyRating(
      afterFirstOkay,
      "words",
      "chan",
      "okay",
      new Date("2026-03-11T22:00:00.000Z"),
    );

    expect(isKnownItem(afterSecondOkay, "words", "chan")).toBe(false);
    expect(countKnownItems(afterSecondOkay, "words")).toBe(0);
  });

  it("resets only the selected mode slice", () => {
    const now = new Date("2026-03-11T10:00:00.000Z");
    const afterWordKnown = applyRating(
      createInitialProgress(decks),
      "words",
      "chan",
      "known",
      now,
    );
    const afterConversationKnown = applyRating(
      afterWordKnown,
      "conversation",
      "conv-sawasdee",
      "known",
      now,
    );

    const resetConversation = resetProgressForItemIds(
      afterConversationKnown,
      "conversation",
      ["conv-sawasdee"],
    );

    expect(resetConversation.words.chan.lastRating).toBe("known");
    expect(
      resetConversation.conversation["conv-sawasdee"].lastRating,
    ).toBeNull();
  });
});
