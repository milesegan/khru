import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import type { WordEntry } from "./types";

const words: WordEntry[] = [
  {
    id: "chan",
    thai: "ฉัน",
    transliteration: "chan",
    transliterationMarked: "chàn",
    meaning: "I; me",
    patternNote: "The final consonant makes an n ending.",
    difficulty: 1,
    tags: ["pronoun"],
  },
  {
    id: "baan",
    thai: "บ้าน",
    transliteration: "baan",
    transliterationMarked: "bâan",
    meaning: "house",
    patternNote: "Mai tho marks the falling tone here.",
    difficulty: 1,
    tags: ["place"],
  },
  {
    id: "poet",
    thai: "เปิด",
    transliteration: "poet",
    transliterationMarked: "pòet",
    meaning: "open",
    patternNote: "A common sign word with a final t stop.",
    difficulty: 1,
    tags: ["sign"],
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

  it("reveals transliteration, meaning, and reading clue", async () => {
    const user = userEvent.setup();
    render(<App words={words} />);

    expect(screen.getByText("ฉัน")).toBeInTheDocument();
    expect(screen.queryByText("I; me")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^known$/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /reveal/i }));

    expect(screen.getByText("chàn")).toBeInTheDocument();
    expect(screen.getByText("I; me")).toBeInTheDocument();
    expect(
      screen.getByText(/final consonant makes an n ending/i),
    ).toBeInTheDocument();
  });

  it("plays pronunciation audio from the static opus asset path", async () => {
    const user = userEvent.setup();
    render(<App words={words} />);

    const playButton = screen.getByRole("button", {
      name: /play pronunciation for ฉัน/i,
    });
    const audio = document.querySelector("audio");

    expect(audio).not.toBeNull();
    expect(audio).toHaveAttribute("src", "/audio/th/chan.opus");

    await user.click(playButton);

    expect(vi.mocked(HTMLMediaElement.prototype.play)).toHaveBeenCalledTimes(1);
  });

  it("rates the current card and advances to the next one", async () => {
    const user = userEvent.setup();
    render(<App words={words} />);

    await user.click(screen.getByRole("button", { name: /^known$/i }));

    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
    expect(screen.getByText("บ้าน")).toBeInTheDocument();
    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("2");
  });

  it("loops back to the remaining study words instead of stopping at the end", async () => {
    const user = userEvent.setup();
    render(<App words={words.slice(0, 2)} />);

    expect(screen.getByText("ฉัน")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^okay$/i }));

    expect(screen.getByText("บ้าน")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^okay$/i }));

    expect(screen.getByText("ฉัน")).toBeInTheDocument();
    expect(screen.getByTestId("known-count")).toHaveTextContent("0");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("2");
  });

  it("filters the deck by search query", async () => {
    const user = userEvent.setup();
    render(<App words={words} />);

    await user.type(
      screen.getByRole("textbox", { name: /search the deck/i }),
      "house",
    );

    expect(screen.getByText("บ้าน")).toBeInTheDocument();
    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
  });

  it("defaults to all words and lets the user pick a category", async () => {
    const user = userEvent.setup();
    render(<App words={words} />);

    expect(screen.getByTestId("total-count")).toHaveTextContent("3");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "signs",
    );

    expect(screen.getByTestId("total-count")).toHaveTextContent("1");
    expect(screen.getByText("เปิด")).toBeInTheDocument();
    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
  });

  it("keeps progress when clearing known words is canceled", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<App words={words} />);

    await user.click(screen.getByRole("button", { name: /^known$/i }));

    const resetButton = screen.getByRole("button", {
      name: /clear known words and reset study progress/i,
    });

    await user.click(resetButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Clear all known words and reset study progress?",
    );
    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.getByText("บ้าน")).toBeInTheDocument();
  });

  it("clears study progress after confirmation", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App words={words} />);

    await user.click(screen.getByRole("button", { name: /^known$/i }));

    const resetButton = screen.getByRole("button", {
      name: /clear known words and reset study progress/i,
    });

    await user.click(resetButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Clear all known words and reset study progress?",
    );
    expect(screen.getByTestId("known-count")).toHaveTextContent("0");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("3");
    expect(screen.getByText("ฉัน")).toBeInTheDocument();
    expect(screen.queryByText("บ้าน")).not.toBeInTheDocument();
  });

  it("persists study progress across remounts", async () => {
    const user = userEvent.setup();
    const firstRender = render(<App words={words} />);

    await user.click(screen.getByRole("button", { name: /^known$/i }));

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");

    firstRender.unmount();
    render(<App words={words} />);

    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
    expect(screen.getByText("บ้าน")).toBeInTheDocument();
  });

  it("only clears known words from the selected category", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<App words={words} />);

    await user.click(screen.getByRole("button", { name: /^known$/i }));
    await user.click(screen.getByRole("button", { name: /^known$/i }));

    expect(screen.getByTestId("known-count")).toHaveTextContent("2");

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "places",
    );

    const resetButton = screen.getByRole("button", {
      name: /clear known words and reset study progress/i,
    });

    await user.click(resetButton);

    expect(confirmSpy).toHaveBeenCalledWith(
      "Clear known words and reset study progress for Places & travel?",
    );
    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
    expect(screen.getByTestId("ready-count")).toHaveTextContent("1");
    expect(screen.getByText("บ้าน")).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /study category/i }),
      "all",
    );

    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
    expect(screen.getByText("บ้าน")).toBeInTheDocument();
  });
});
