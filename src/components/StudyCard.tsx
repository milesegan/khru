import { useEffect, useRef, useState } from "react";
import { getStudyAudioSrc } from "../lib/audio";
import type { StudyEntry, StudyMode, StudyRating } from "../types";

type StudyCardProps = {
  item: StudyEntry;
  mode: StudyMode;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: StudyRating) => void;
};

/**
 * Displays the active flashcard and the reveal/rating actions for that item.
 */
export function StudyCard({
  item,
  mode,
  revealed,
  onReveal,
  onRate,
}: StudyCardProps) {
  const ratingButtonClassName =
    "rounded-full border px-6 py-[0.6rem] text-[0.95rem] transition-all duration-200";

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioSrc = getStudyAudioSrc(mode, item.id);

  useEffect(() => {
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
  }, []);

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
    <article className="flex w-full max-w-3xl flex-col items-center gap-6 text-center">
      <div className="text-[clamp(3rem,12vw,8rem)] font-light leading-[1.1] text-ink">
        {item.thai}
      </div>
      <div className="flex flex-col items-center gap-3">
        <button
          className="rounded-full border border-edge bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_82%,_white)] px-[1.15rem] py-[0.55rem] text-[0.95rem] text-ink transition-[border-color,transform,background] duration-200 hover:translate-y-[-1px] hover:border-accent hover:bg-[color-mix(in_srgb,_oklch(83%_0.06_55)_55%,_white)] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,_oklch(94%_0.03_70)_70%,_white)] disabled:text-muted disabled:hover:translate-y-0 disabled:hover:border-edge"
          type="button"
          onClick={handlePlayAudio}
          disabled={audioUnavailable}
          aria-label={`Play pronunciation for ${item.thai}`}
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
        <button
          className="rounded-full border-none bg-ink px-8 py-3 text-base tracking-[0.02em] text-paper transition-[transform,background] duration-200 hover:translate-y-[-2px] hover:bg-black active:translate-y-0"
          onClick={onReveal}
        >
          Reveal
        </button>
      ) : (
        <div
          className="flex animate-fade-in flex-col items-center gap-2"
          aria-live="polite"
        >
          <p className="m-0 text-xl tracking-[0.05em] text-muted">
            {item.transliterationMarked}
          </p>
          <p className="m-0 font-serif text-[1.75rem] font-medium text-ink">
            {item.meaning}
          </p>
          {item.note && (
            <p className="m-0 max-w-[40ch] text-base leading-6 text-muted">
              {item.note}
            </p>
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <button
          className={`${ratingButtonClassName} border-transparent bg-transparent text-muted hover:bg-[color-mix(in_srgb,_oklch(24%_0.03_30)_5%,_transparent)] hover:text-ink`}
          onClick={() => onRate("again")}
        >
          Again
        </button>
        <button
          className={`${ratingButtonClassName} border-edge bg-transparent text-ink hover:border-ink hover:bg-[color-mix(in_srgb,_oklch(24%_0.03_30)_5%,_transparent)]`}
          onClick={() => onRate("okay")}
        >
          Okay
        </button>
        <button
          className={`${ratingButtonClassName} border-ink bg-ink text-paper hover:border-black hover:bg-black hover:text-white`}
          onClick={() => onRate("known")}
        >
          Known
        </button>
      </div>
    </article>
  );
}
