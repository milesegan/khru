import type { StudyMode } from "../types";

export function getStudyAudioSrc(mode: StudyMode, itemId: string) {
  return `/audio/th/${mode}/${itemId}.opus`;
}
