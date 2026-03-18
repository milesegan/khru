import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { KNOWN_FEEDBACK_DURATION_MS } from "./components/StudyCard";
import type { StudyEntry } from "./types";

const words: StudyEntry[] = [
  {
    id: "chan",
    thai: "ฉัน",
    transliteration: "chan",
    transliterationMarked: "chàn",
    meaning: "I; me",
    note: "The final consonant makes an n ending.",
    difficulty: 1,
    tags: ["pronoun"],
  },
  {
    id: "baan",
    thai: "บ้าน",
    transliteration: "baan",
    transliterationMarked: "bâan",
    meaning: "house",
    note: "Mai tho marks the falling tone here.",
    difficulty: 1,
    tags: ["place"],
  },
  {
    id: "poet",
    thai: "เปิด",
    transliteration: "poet",
    transliterationMarked: "pòet",
    meaning: "open",
    note: "A common sign word with a final t stop.",
    difficulty: 1,
    tags: ["sign"],
  },
];

const conversation: StudyEntry[] = [
  {
    id: "conv-sawasdee-khrap",
    thai: "สวัสดีครับ",
    transliteration: "sawatdi khrap",
    transliterationMarked: "sawatdi khrap",
    meaning: "Hello. (male speaker)",
    note: "ครับ is the polite particle commonly used by male speakers.",
    difficulty: 1,
    tags: ["greetings"],
  },
  {
    id: "conv-hong-nam-yu-thi-nai",
    thai: "ห้องน้ำอยู่ที่ไหน",
    transliteration: "hong nam yu thi nai",
    transliterationMarked: "hong nam yu thi nai",
    meaning: "Where is the bathroom?",
    note: "อยู่ที่ไหน is the common pattern for asking where something is.",
    difficulty: 1,
    tags: ["directions"],
  },
  {
    id: "conv-ton-ni-ki-mong",
    thai: "ตอนนี้กี่โมง",
    transliteration: "ton ni ki mong",
    transliterationMarked: "ton ni ki mong",
    meaning: "What time is it now?",
    note: "กี่โมง is the standard way to ask the time.",
    difficulty: 1,
    tags: ["time"],
  },
];

describe("App", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(Math, "random").mockReturnValue(0.999);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reveals transliteration, meaning, and note for the active card", async () => {
    const user = userEvent.setup();
    render(<App words={words} conversation={conversation} />);

    expect(screen.getByText("ฉัน")).toBeInTheDocument();
    expect(screen.queryByText("I; me")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reveal/i }));

    expect(screen.getByText("chàn")).toBeInTheDocument();
    expect(screen.getByText("I; me")).toBeInTheDocument();
    expect(
      screen.getByText(/final consonant makes an n ending/i),
    ).toBeInTheDocument();
  });

  it("uses deck-specific audio paths for words and conversation cards", async () => {
    const user = userEvent.setup();
    render(<App words={words} conversation={conversation} />);

    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "/audio/th/words/chan.opus",
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "greetings",
    );

    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "/audio/th/conversation/conv-sawasdee-khrap.opus",
    );

    await user.click(
      screen.getByRole("button", {
        name: /play pronunciation for สวัสดีครับ/i,
      }),
    );

    expect(vi.mocked(HTMLMediaElement.prototype.play)).toHaveBeenCalledTimes(1);
  });

  it("resets category, reveal state, and current card when switching modes", async () => {
    const user = userEvent.setup();
    render(<App words={words} conversation={conversation} />);

    await user.click(screen.getByRole("button", { name: /reveal/i }));
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "signs",
    );

    expect(screen.getByText("เปิด")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );

    expect(
      screen.getByRole("combobox", { name: /study category/i }),
    ).toHaveValue("all");
    expect(screen.queryByText("เปิด")).not.toBeInTheDocument();
    expect(
      screen.getByText(/สวัสดีครับ|ห้องน้ำอยู่ที่ไหน|ตอนนี้กี่โมง/),
    ).toBeInTheDocument();
    expect(screen.queryByText("Hello. (male speaker)")).not.toBeInTheDocument();
  });

  it("filters conversation cards by category", async () => {
    const user = userEvent.setup();
    render(<App words={words} conversation={conversation} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "directions",
    );

    expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    expect(screen.getByText("ห้องน้ำอยู่ที่ไหน")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "all",
    );

    expect(screen.getByTestId("total-count")).toHaveTextContent("3");
    expect(
      screen.getByText(/สวัสดีครับ|ห้องน้ำอยู่ที่ไหน|ตอนนี้กี่โมง/),
    ).toBeInTheDocument();
  });

  it("keeps progress isolated between study modes", async () => {
    const user = userEvent.setup();
    render(<App words={words} conversation={conversation} />);

    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );

    expect(screen.getByTestId("known-count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "words",
    );

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.getByText("บ้าน")).toBeInTheDocument();
  });

  it("resets only the active mode and active category counts", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App words={words} conversation={conversation} />);

    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "directions",
    );
    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );

    const resetButton = screen.getByRole("button", {
      name: /clear known words and reset study progress/i,
    });

    await user.click(resetButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Clear known sentences and reset study progress for Directions?",
    );
    expect(screen.getByTestId("known-count")).toHaveTextContent("0");
    expect(screen.getByText("ห้องน้ำอยู่ที่ไหน")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "words",
    );

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
  });

  it("persists per-mode progress across remounts", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <App words={words} conversation={conversation} />,
    );

    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );
    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));
    await waitFor(
      () => expect(screen.getByTestId("known-count")).toHaveTextContent("1"),
      { timeout: KNOWN_FEEDBACK_DURATION_MS + 300 },
    );

    firstRender.unmount();
    render(<App words={words} conversation={conversation} />);

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.getByText("สวัสดีครับ")).toBeInTheDocument();
  });

  it("persists the selected mode and category across remounts", async () => {
    const user = userEvent.setup();
    const firstRender = render(
      <App words={words} conversation={conversation} />,
    );

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study mode/i }),
      "conversation",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "directions",
    );

    firstRender.unmount();
    render(<App words={words} conversation={conversation} />);

    expect(screen.getByRole("combobox", { name: /study mode/i })).toHaveValue(
      "conversation",
    );
    expect(
      screen.getByRole("combobox", { name: /study category/i }),
    ).toHaveValue("directions");
    expect(screen.getByText("ห้องน้ำอยู่ที่ไหน")).toBeInTheDocument();
  });
});
