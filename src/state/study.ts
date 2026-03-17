import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import {
  createInitialProgress,
  normalizeProgress,
  STORAGE_KEY,
} from "../lib/study";
import type {
  StudyCategory,
  StudyDecks,
  StudyMode,
  StudyProgress,
} from "../types";

type ProgressUpdate =
  | StudyProgress
  | ((currentProgress: StudyProgress) => StudyProgress);

const progressStorage = createJSONStorage<StudyProgress | null>(
  () => window.localStorage,
);

export const studyDecksAtom = atom<StudyDecks>({
  words: [],
  conversation: [],
});
export const modeAtom = atom<StudyMode>("words");
export const queryAtom = atom("");
export const categoryAtom = atom<StudyCategory>("all");
export const currentItemIdAtom = atom("");
export const revealedCardKeyAtom = atom("");

const storedProgressAtom = atomWithStorage<StudyProgress | null>(
  STORAGE_KEY,
  null,
  progressStorage,
  { getOnInit: true },
);

export const progressAtom = atom(
  (get) => normalizeProgress(get(studyDecksAtom), get(storedProgressAtom)),
  (get, set, update: ProgressUpdate) => {
    const decks = get(studyDecksAtom);
    const currentProgress = normalizeProgress(decks, get(storedProgressAtom));
    const nextProgress =
      typeof update === "function" ? update(currentProgress) : update;

    set(storedProgressAtom, normalizeProgress(decks, nextProgress));
  },
);

export function getInitialProgress(decks: StudyDecks) {
  return createInitialProgress(decks);
}
