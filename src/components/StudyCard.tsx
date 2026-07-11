import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  LuCheck,
  LuEye,
  LuRotateCcw,
  LuStar,
  LuVolume2,
  LuVolumeX,
} from "react-icons/lu";
import { getStudyAudioSrc } from "../lib/audio";
import type { StudyEntry, StudyMode, StudyRating } from "../types";

export const KNOWN_FEEDBACK_DURATION_MS = 460;

type StudyCardProps = {
  item: StudyEntry;
  mode: StudyMode;
  revealed: boolean;
  onReveal: () => void;
  onPlayRewardAudio: () => void;
  onRate: (rating: StudyRating) => void;
};

type ActionIconButtonProps = {
  ariaLabel: string;
  label: string;
  className: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
};

type IntlSegmenter = new (
  locale: string,
  options: { granularity: "word" },
) => {
  segment: (
    input: string,
  ) => Iterable<{ segment: string; isWordLike?: boolean }>;
};

function getThaiWordParts(text: string) {
  const Segmenter = (Intl as typeof Intl & { Segmenter?: IntlSegmenter })
    .Segmenter;

  if (!Segmenter) {
    return [text];
  }

  const words = Array.from(
    new Segmenter("th", { granularity: "word" }).segment(text),
  )
    .filter((segment) => segment.isWordLike !== false)
    .map((segment) => segment.segment.trim())
    .filter(Boolean);

  return words.length > 0 ? words : [text];
}

function ActionIconButton({
  ariaLabel,
  label,
  className,
  icon,
  disabled = false,
  onClick,
}: ActionIconButtonProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        className={className}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
      >
        {icon}
      </button>
      <span
        aria-hidden="true"
        className="text-[0.6rem] font-medium uppercase tracking-[0.16em] text-muted"
      >
        {label}
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
  onPlayRewardAudio,
  onRate,
}: StudyCardProps) {
  const actionButtonClassName =
    "inline-grid h-[4.25rem] w-[4.25rem] place-items-center rounded-full border text-ink transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 md:h-[4.6rem] md:w-[4.6rem]";
  const lightActionButtonClassName = `${actionButtonClassName} border-edge bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_82%,_white)] hover:-translate-y-0.5 hover:border-accent hover:bg-[color-mix(in_srgb,_oklch(83%_0.06_55)_55%,_white)]`;
  const darkActionButtonClassName = `${actionButtonClassName} border-ink bg-ink text-paper hover:-translate-y-0.5 hover:border-black hover:bg-black hover:text-white`;
  const thaiTextClassName =
    mode === "conversation"
      ? "text-[clamp(2.9rem,11vw,5.4rem)] md:text-[clamp(3.75rem,12vw,8.5rem)]"
      : "text-[clamp(4rem,15vw,9rem)]";
  const thaiTextLeadingClassName =
    mode === "conversation" ? "leading-[1.32]" : "leading-[1.1]";
  const thaiWordParts =
    mode === "conversation" ? getThaiWordParts(item.thai) : [item.thai];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const knownTimeoutRef = useRef<number | null>(null);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isKnownCelebrating, setIsKnownCelebrating] = useState(false);
  const audioSrc = getStudyAudioSrc(mode, item.id);

  useEffect(() => {
    const audioElement = audioRef.current;

    return () => {
      if (knownTimeoutRef.current !== null) {
        window.clearTimeout(knownTimeoutRef.current);
      }

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
    if (!audioRef.current || audioUnavailable) {
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

  function handleKnown() {
    if (isKnownCelebrating) {
      return;
    }

    setIsKnownCelebrating(true);
    onPlayRewardAudio();
    knownTimeoutRef.current = window.setTimeout(() => {
      knownTimeoutRef.current = null;
      onRate("known");
    }, KNOWN_FEEDBACK_DURATION_MS);
  }

  // Keyboard drill shortcuts: space reveals, then 1/2/3 self-grade the card.
  // A ref holds the latest closure so the window listener subscribes only once.
  const keyHandlerRef = useRef<(event: KeyboardEvent) => void>(() => {});

  useEffect(() => {
    keyHandlerRef.current = (event: KeyboardEvent) => {
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isKnownCelebrating
      ) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["SELECT", "INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === "p") {
        event.preventDefault();
        void handlePlayAudio();
        return;
      }

      if (!revealed) {
        if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          onReveal();
        }
        return;
      }

      if (key === "1") {
        event.preventDefault();
        onRate("again");
      } else if (key === "2" || event.key === " " || event.key === "Enter") {
        event.preventDefault();
        onRate("okay");
      } else if (key === "3") {
        event.preventDefault();
        handleKnown();
      }
    };
  });

  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandlerRef.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  const audioAriaLabel = audioUnavailable
    ? `Audio unavailable for ${item.thai}`
    : isPlaying
      ? `Replay pronunciation for ${item.thai}`
      : `Play pronunciation for ${item.thai}`;
  const audioLabel = audioUnavailable
    ? "No audio"
    : isPlaying
      ? "Replay"
      : "Listen";
  const audioIcon = audioUnavailable ? (
    <LuVolumeX aria-hidden="true" />
  ) : (
    <LuVolume2 aria-hidden="true" />
  );

  const audioButton = (
    <ActionIconButton
      ariaLabel={audioAriaLabel}
      label={audioLabel}
      className={`${lightActionButtonClassName} text-[1.5rem] disabled:bg-[color-mix(in_srgb,_oklch(94%_0.03_70)_70%,_white)] disabled:text-muted disabled:hover:translate-y-0 disabled:hover:border-edge md:text-[1.6rem]`}
      icon={audioIcon}
      onClick={() => void handlePlayAudio()}
      disabled={audioUnavailable || isKnownCelebrating}
    />
  );

  const knownButton = (
    <ActionIconButton
      ariaLabel="Mark as mastered"
      label="Known"
      className={`${lightActionButtonClassName} text-[1.45rem] md:text-[1.55rem] ${
        isKnownCelebrating
          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
          : ""
      }`}
      icon={<LuStar aria-hidden="true" />}
      onClick={handleKnown}
      disabled={isKnownCelebrating}
    />
  );

  return (
    <article className="flex w-full max-w-3xl flex-col items-center gap-4 text-center md:gap-5">
      <div
        className={`${thaiTextClassName} ${thaiTextLeadingClassName} font-light ${
          isKnownCelebrating ? "text-emerald-600" : "text-ink"
        }`}
      >
        {mode === "conversation" && (
          <span className="sr-only">{item.thai}</span>
        )}
        <span
          data-testid="study-card-thai"
          className={`origin-center will-change-transform ${
            mode === "conversation" ? "conversation-thai-line" : "inline-block"
          } ${
            isKnownCelebrating
              ? "animate-known-word-pulse motion-reduce:animate-none"
              : ""
          }`}
          aria-hidden={mode === "conversation" ? "true" : undefined}
        >
          {mode === "conversation"
            ? thaiWordParts.map((wordPart, index) => (
                <span
                  key={`${wordPart}-${index}`}
                  className={index > 0 ? "conversation-thai-word" : undefined}
                >
                  {wordPart}
                </span>
              ))
            : item.thai}
        </span>
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
          className={`flex flex-col items-center gap-2 ${
            isKnownCelebrating
              ? "animate-known-support-pulse text-emerald-700 motion-reduce:animate-none"
              : "animate-fade-in"
          }`}
          aria-live="polite"
        >
          <p
            className={`m-0 text-xl tracking-[0.05em] ${
              isKnownCelebrating ? "text-emerald-700" : "text-muted"
            }`}
          >
            {item.transliterationMarked}
          </p>
          <p
            className={`m-0 font-serif text-[1.75rem] font-medium ${
              isKnownCelebrating ? "text-emerald-800" : "text-ink"
            }`}
          >
            {item.meaning}
          </p>
          {item.note && (
            <p
              className={`m-0 max-w-[40ch] text-base leading-6 ${
                isKnownCelebrating ? "text-emerald-700" : "text-muted"
              }`}
            >
              {item.note}
            </p>
          )}
        </div>
      )}
      <div className="grid grid-flow-col justify-center gap-3 pt-2 md:gap-4 md:pt-3">
        {revealed ? (
          <>
            {audioButton}
            <ActionIconButton
              ariaLabel="Rate as again"
              label="Again"
              className={`${lightActionButtonClassName} text-[1.45rem] md:text-[1.55rem]`}
              icon={<LuRotateCcw aria-hidden="true" />}
              onClick={() => onRate("again")}
              disabled={isKnownCelebrating}
            />
            <ActionIconButton
              ariaLabel="Rate as okay"
              label="Got it"
              className={`${darkActionButtonClassName} text-[1.6rem] md:text-[1.7rem]`}
              icon={<LuCheck aria-hidden="true" />}
              onClick={() => onRate("okay")}
              disabled={isKnownCelebrating}
            />
            {knownButton}
          </>
        ) : (
          <>
            {audioButton}
            <ActionIconButton
              ariaLabel="Reveal"
              label="Reveal"
              className={`${darkActionButtonClassName} text-[1.6rem] md:text-[1.7rem]`}
              icon={<LuEye aria-hidden="true" />}
              onClick={onReveal}
              disabled={isKnownCelebrating}
            />
            {knownButton}
          </>
        )}
      </div>
    </article>
  );
}
