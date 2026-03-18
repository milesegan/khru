import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StudyControls } from "./StudyControls";

describe("StudyControls", () => {
  it("renders the study mode and category controls with selected values", () => {
    render(
      <StudyControls
        mode="conversation"
        category="greetings"
        categoryOptions={[
          { value: "all", label: "All sentences" },
          { value: "greetings", label: "Greetings" },
        ]}
        onModeChange={vi.fn()}
        onCategoryChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("combobox", { name: "Study mode" })).toHaveValue(
      "conversation",
    );
    expect(
      screen.getByRole("combobox", { name: "Study category" }),
    ).toHaveValue("greetings");
    expect(
      screen.getByRole("option", { name: "Conversation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Greetings" }),
    ).toBeInTheDocument();
  });
});
