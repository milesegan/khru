import { useEffect, useRef, useState } from "react";
import { getWordAudioSrc } from "../lib/audio";
import type { StudyRating, WordEntry } from "../types";

type StudyCardProps = {
  word: WordEntry;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: StudyRating) => void;
};

/**
 * Displays the active flashcard and the reveal/rating actions for that word.
 */
export function StudyCard({
  word,
  revealed,
  onReveal,
  onRate,
}: StudyCardProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioSrc = getWordAudioSrc(word.id);

  useEffect(() => {
    setAudioUnavailable(false);
    setIsPlaying(false);
    const audioElement = audioRef.current;

    return () => {
      if (audioElement) {
        try {
          audioElement.pause();
        } catch {
          // jsdom does not implement HTMLMediaElement playback controls.
        }
        audioElement.currentTime = 0;
      }
    };
  }, [word.id]);

  async function handlePlayAudio() {
    if (!audioRef.current) {
      return;
    }

    try {
      audioRef.current.currentTime = 0;
      setIsPlaying(true);
      await audioRef.current.play();
    } catch {
      setIsPlaying(false);
      setAudioUnavailable(true);
    }
  }

  return (
    <article className="card-panel">
      <div className="thai-word">{word.thai}</div>
      <div className="card-actions">
        <button
          className="audio-button"
          type="button"
          onClick={handlePlayAudio}
          disabled={audioUnavailable}
          aria-label={`Play pronunciation for ${word.thai}`}
        >
          {audioUnavailable
            ? "Audio unavailable"
            : isPlaying
              ? "Replay audio"
              : "Play audio"}
        </button>
        <audio
          ref={audioRef}
          preload="none"
          src={audioSrc}
          onEnded={() => setIsPlaying(false)}
          onError={() => {
            setIsPlaying(false);
            setAudioUnavailable(true);
          }}
        />
      </div>
      {!revealed ? (
        <button className="reveal-button" onClick={onReveal}>
          Reveal
        </button>
      ) : (
        <div className="card-details" aria-live="polite">
          <p className="transliteration">{word.transliteration}</p>
          <p className="meaning">{word.meaning}</p>
          {word.patternNote && (
            <p className="pattern-note">{word.patternNote}</p>
          )}
          <div className="rating-row">
            <button
              className="rating-button subtle"
              onClick={() => onRate("again")}
            >
              Again
            </button>
            <button className="rating-button" onClick={() => onRate("okay")}>
              Okay
            </button>
            <button
              className="rating-button strong"
              onClick={() => onRate("known")}
            >
              Known
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
