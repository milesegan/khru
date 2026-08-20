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
      screen.getByRole("button", { name: "Rate as again" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Rate as okay" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mark as mastered" }),
    ).toBeInTheDocument();
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "/audio/th/conversation/conv-sawasdee-khrap.opus",
    );
  });

  it("adds subtle word-boundary dividers for conversation cards", () => {
    render(
      <StudyCard
        item={{
          id: "conv-ton-ni-ki-mong",
          thai: "ตอนนี้กี่โมง",
          transliteration: "ton ni ki mong",
          meaning: "What time is it now?",
          note: "กี่โมง is the standard way to ask the time.",
          difficulty: 1,
          tags: ["time"],
        }}
        mode="conversation"
        revealed={false}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={vi.fn()}
      />,
    );

    const thaiText = screen.getByTestId("study-card-thai");
    const thaiTextContainer = thaiText.parentElement;

    expect(thaiText).toHaveClass("conversation-thai-line");
    expect(thaiTextContainer).toHaveClass("leading-[1.32]");
    expect(thaiText).toHaveTextContent("ตอนนี้กี่โมง");
    expect(thaiText.querySelectorAll(".conversation-thai-word")).toHaveLength(
      3,
    );
  });

  it("shows the full grading actions after the card is revealed", () => {
    const onRate = vi.fn();

    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={true}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={onRate}
      />,
    );

    expect(
      screen.getByRole("button", { name: /rate as again/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /rate as okay/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /mark as mastered/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /reveal/i }),
    ).not.toBeInTheDocument();
  });

  it("emits the again rating when the again action is used", async () => {
    const user = userEvent.setup();
    const onRate = vi.fn();

    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={true}
        onReveal={vi.fn()}
        onPlayRewardAudio={vi.fn()}
        onRate={onRate}
      />,
    );

    await user.click(screen.getByRole("button", { name: /rate as again/i }));

    expect(onRate).toHaveBeenCalledWith("again");
  });

  it("shows the known action before reveal", () => {
    render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chàn",
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

  it("supports keyboard drilling: space reveals, digits self-grade", async () => {
    const user = userEvent.setup();
    const onReveal = vi.fn();
    const onRate = vi.fn();

    const { rerender } = render(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={false}
        onReveal={onReveal}
        onPlayRewardAudio={vi.fn()}
        onRate={onRate}
      />,
    );

    await user.keyboard(" ");
    expect(onReveal).toHaveBeenCalledTimes(1);

    rerender(
      <StudyCard
        item={{
          id: "chan",
          thai: "ฉัน",
          transliteration: "chàn",
          meaning: "I; me",
          note: "The final consonant makes an n ending.",
          difficulty: 1,
          tags: ["pronoun"],
        }}
        mode="words"
        revealed={true}
        onReveal={onReveal}
        onPlayRewardAudio={vi.fn()}
        onRate={onRate}
      />,
    );

    await user.keyboard("1");
    expect(onRate).toHaveBeenLastCalledWith("again");

    await user.keyboard("2");
    expect(onRate).toHaveBeenLastCalledWith("okay");
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
          transliteration: "chàn",
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
