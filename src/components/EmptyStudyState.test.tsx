import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyStudyState } from "./EmptyStudyState";

describe("EmptyStudyState", () => {
  it("renders a category-empty message for word study", () => {
    render(<EmptyStudyState hasMatches={false} mode="words" />);

    expect(
      screen.getByText("No words in this category yet."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Try another category or study mode to keep going."),
    ).toBeInTheDocument();
  });
});
