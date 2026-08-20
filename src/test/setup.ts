import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { createInitialStudyState, useStudyStore } from "../state/study";

Object.defineProperty(HTMLMediaElement.prototype, "play", {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
});

Object.defineProperty(HTMLMediaElement.prototype, "pause", {
  configurable: true,
  writable: true,
  value: vi.fn(),
});

afterEach(() => {
  vi.useRealTimers();
  vi.mocked(HTMLMediaElement.prototype.play).mockClear();
  vi.mocked(HTMLMediaElement.prototype.pause).mockClear();
  cleanup();
  // The zustand store is a module singleton, so drop both its in-memory and
  // persisted state once components are unmounted to keep cases isolated.
  useStudyStore.setState(createInitialStudyState());
  useStudyStore.persist.clearStorage();
});
