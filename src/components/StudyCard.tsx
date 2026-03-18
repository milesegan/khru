import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  LuArrowRight,
  LuCheck,
  LuEye,
  LuRefreshCw,
  LuVolume2,
  LuVolumeX,
} from "react-icons/lu";
import { getStudyAudioSrc } from "../lib/audio";
import type { StudyEntry, StudyMode, StudyRating } from "../types";

type StudyCardProps = {
  item: StudyEntry;
  mode: StudyMode;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: StudyRating) => void;
};

type ActionIconButtonProps = {
  ariaLabel: string;
  className: string;
  icon: ReactNode;
  tooltip: string;
  disabled?: boolean;
  onClick: () => void;
};

function ActionIconButton({
  ariaLabel,
  className,
  icon,
  tooltip,
  disabled = false,
  onClick,
}: ActionIconButtonProps) {
  return (
    <div className="group relative">
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-3 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-edge bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_92%,_white)] px-3 py-1 text-[0.72rem] font-medium tracking-[0.08em] text-ink opacity-0 shadow-[0_10px_30px_rgba(90,70,30,0.08)] transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 md:block">
        {tooltip}
      </span>
    </div>
  );
}

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
  const actionButtonClassName =
    "inline-grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border text-ink transition-all duration-200 md:h-[4.85rem] md:w-[4.85rem]";
  const lightActionButtonClassName = `${actionButtonClassName} border-edge bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_82%,_white)] hover:border-accent hover:bg-[color-mix(in_srgb,_oklch(83%_0.06_55)_55%,_white)]`;
  const darkActionButtonClassName = `${actionButtonClassName} border-ink bg-ink text-paper hover:border-black hover:bg-black hover:text-white`;
  const thaiTextClassName =
    mode === "conversation"
      ? "text-[clamp(2.9rem,11vw,5.4rem)] md:text-[clamp(3.75rem,12vw,8.5rem)]"
      : "text-[clamp(4rem,15vw,9rem)]";

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
    <article className="flex w-full max-w-3xl flex-col items-center gap-4 text-center md:gap-5">
      <div className={`${thaiTextClassName} font-light leading-[1.1] text-ink`}>
        {item.thai}
      </div>
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
      {revealed && (
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
      <div className="grid grid-flow-col justify-center gap-3 pt-2 md:gap-4 md:pt-3">
        <ActionIconButton
          ariaLabel={
            audioUnavailable
              ? `Audio unavailable for ${item.thai}`
              : isPlaying
                ? `Replay pronunciation for ${item.thai}`
                : `Play pronunciation for ${item.thai}`
          }
          tooltip={
            audioUnavailable
              ? "Audio unavailable"
              : isPlaying
                ? "Replay audio"
                : "Play audio"
          }
          className={`${lightActionButtonClassName} text-[1.5rem] transition-[border-color,transform,background] hover:translate-y-[-2px] disabled:cursor-not-allowed disabled:bg-[color-mix(in_srgb,_oklch(94%_0.03_70)_70%,_white)] disabled:text-muted disabled:hover:translate-y-0 disabled:hover:border-edge md:text-[1.65rem]`}
          icon={
            audioUnavailable ? (
              <LuVolumeX aria-hidden="true" />
            ) : isPlaying ? (
              <LuRefreshCw aria-hidden="true" />
            ) : (
              <LuVolume2 aria-hidden="true" />
            )
          }
          onClick={handlePlayAudio}
          disabled={audioUnavailable}
        />
        {!revealed && (
          <ActionIconButton
            ariaLabel="Reveal"
            tooltip="Reveal"
            className={`${lightActionButtonClassName} text-[1.5rem] hover:translate-y-[-2px] active:translate-y-0 md:text-[1.65rem]`}
            icon={<LuEye aria-hidden="true" />}
            onClick={onReveal}
          />
        )}
        <ActionIconButton
          ariaLabel="Known"
          tooltip="Known"
          className={`${lightActionButtonClassName} text-[1.55rem] md:text-[1.7rem]`}
          icon={<LuCheck aria-hidden="true" />}
          onClick={() => onRate("known")}
        />
        <ActionIconButton
          ariaLabel="Next"
          tooltip="Next"
          className={`${darkActionButtonClassName} text-[1.6rem] md:text-[1.75rem]`}
          icon={<LuArrowRight aria-hidden="true" />}
          onClick={() => onRate("okay")}
        />
      </div>
    </article>
  );
}
