import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudyStats } from "./StudyStats";

describe("StudyStats", () => {
  it("renders deck counts and the reset control", () => {
    render(
      <StudyStats
        totalWords={24}
        knownWords={9}
        resetLabel="Reset progress for this deck?"
        onResetProgress={vi.fn()}
      />,
    );

    expect(screen.getByTestId("total-count")).toHaveTextContent("24");
    expect(screen.getByTestId("known-count")).toHaveTextContent("9");
    expect(
      screen.getByRole("button", {
        name: "Clear known words and reset study progress",
      }),
    ).toBeInTheDocument();
  });
});
