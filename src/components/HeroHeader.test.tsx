import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeroHeader } from "./HeroHeader";

describe("HeroHeader", () => {
  it("renders the app heading copy", () => {
    render(<HeroHeader />);

    expect(screen.getByText("Khru Thai Tutor")).toBeInTheDocument();
  });
});
