import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  getModesForOption,
  getOutputPath,
  parseArguments,
} from "./generate-thai-audio.mjs";

describe("generate-thai-audio", () => {
  it("defaults to generating audio for all modes", () => {
    expect(parseArguments([]).mode).toBe("all");
    expect(getModesForOption("all")).toEqual(["words", "conversation"]);
  });

  it("supports selecting conversation-only generation", () => {
    expect(parseArguments(["--mode=conversation"]).mode).toBe("conversation");
    expect(getModesForOption("conversation")).toEqual(["conversation"]);
  });

  it("writes files into deck-specific output folders", () => {
    expect(getOutputPath("words", "chan")).toBe(
      path.join(process.cwd(), "public/audio/th/words/chan.opus"),
    );
    expect(getOutputPath("conversation", "conv-sawasdee-khrap")).toBe(
      path.join(
        process.cwd(),
        "public/audio/th/conversation/conv-sawasdee-khrap.opus",
      ),
    );
  });
});
