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
    meaning: "I; me",
    patternNote: "The final consonant makes an n ending.",
    difficulty: 1,
    tags: ["pronoun"],
  },
  {
    id: "baan",
    thai: "บ้าน",
    transliteration: "baan",
    meaning: "house",
    patternNote: "Mai tho marks the falling tone here.",
    difficulty: 1,
    tags: ["place"],
  },
  {
    id: "poet",
    thai: "เปิด",
    transliteration: "poet",
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

    await user.click(screen.getByRole("button", { name: /reveal/i }));

    expect(screen.getByText("chan")).toBeInTheDocument();
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

    await user.click(screen.getByRole("button", { name: /reveal/i }));
    await user.click(screen.getByRole("button", { name: /known/i }));

    expect(screen.queryByText("ฉัน")).not.toBeInTheDocument();
    expect(screen.getByText("Known")).toBeInTheDocument();
    expect(screen.getByTestId("known-count")).toHaveTextContent("1");
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
});
