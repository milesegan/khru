import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { KNOWN_FEEDBACK_DURATION_MS, StudyCard } from "./StudyCard";

describe("StudyCard", () => {
  it("renders the active card details and primary actions", () => {
    render(
      <StudyCard
        item={{
          id: "conv-sawasdee-khrap",
          thai: "สวัสดีครับ",
          transliteration: "sawatdi khrap",
          transliterationMarked: "sawatdi khrap",
          meaning: "Hello. (male speaker)",
          note: "ครับ is the polite particle used by male speakers.",
          difficulty: 1,
          tags: ["greetings"],
        }}
        mode="conversation"
        revealed={true}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={vi.fn()}
      />,
    );

    expect(screen.getByText("สวัสดีครับ")).toBeInTheDocument();
    expect(screen.getByText("Hello. (male speaker)")).toBeInTheDocument();
    expect(
      screen.getByText(/polite particle used by male speakers/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Play pronunciation for สวัสดีครับ",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Mark as mastered" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "/audio/th/conversation/conv-sawasdee-khrap.opus",
    );
  });

  it("hides the known action after the card is revealed", () => {
    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chan",
          transliterationMarked: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={true}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /mark as mastered/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the known action before reveal", () => {
    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chan",
          transliterationMarked: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={false}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /reveal/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark as mastered/i }),
    ).toBeInTheDocument();
  });

  it("celebrates known ratings before advancing", async () => {
    const user = userEvent.setup();
    const onRate = vi.fn();
    const onPlayRewardAudio = vi.fn();

    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chan",
          transliterationMarked: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={false}
        onReveal={vi.fn()}
        onPlayRewardAudio={onPlayRewardAudio}
        onRate={onRate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /mark as mastered/i }));

    expect(onPlayRewardAudio).toHaveBeenCalledTimes(1);
    expect(onRate).not.toHaveBeenCalled();
    expect(screen.getByTestId("study-card-thai")).toHaveClass(
      "animate-known-word-pulse",
    );
    expect(screen.getByText("ฉัน").parentElement).toHaveClass(
      "text-emerald-600",
    );

    await waitFor(() => expect(onRate).toHaveBeenCalledWith("known"), {
      timeout: KNOWN_FEEDBACK_DURATION_MS + 300,
    });
  });
});
