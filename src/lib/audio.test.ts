import { describe, expect, it } from "vitest";
import { getStudyAudioSrc } from "./audio";

describe("getStudyAudioSrc", () => {
  it("maps a word id to its deck-specific static opus asset path", () => {
    expect(getStudyAudioSrc("words", "chan")).toBe("/audio/th/words/chan.opus");
  });

  it("maps a conversation id to its deck-specific static opus asset path", () => {
    expect(getStudyAudioSrc("conversation", "conv-sawasdee-khrap")).toBe(
      "/audio/th/conversation/conv-sawasdee-khrap.opus",
    );
  });
});
