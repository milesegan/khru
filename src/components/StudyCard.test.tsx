import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudyCard } from "./StudyCard";

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
    expect(screen.getByRole("button", { name: "Known" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    expect(document.querySelector("audio")).toHaveAttribute(
      "src",
      "/audio/th/conversation/conv-sawasdee-khrap.opus",
    );
  });
});
