import { describe, expect, it } from "vitest";
import { getWordAudioSrc } from "./audio";

describe("getWordAudioSrc", () => {
  it("maps a word id to its static opus asset path", () => {
    expect(getWordAudioSrc("chan")).toBe("/audio/th/chan.opus");
  });
});
