import { describe, expect, it } from "vitest";
import { getRewardAudioSrc, getStudyAudioSrc } from "./audio";

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

describe("getRewardAudioSrc", () => {
  it("maps the mastered reward effect to the shared UI audio asset", () => {
    expect(getRewardAudioSrc()).toBe("/audio/ui/reward-known.opus");
  });
});
