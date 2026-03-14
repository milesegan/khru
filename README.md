# Khru Thai Reader

A minimal responsive web app for native English speakers learning to read common Thai words.

## Stack

- Vite
- React
- TypeScript
- Vitest
- ESLint
- Prettier

## Features

- Flashcard-based Thai reading practice
- 343 common Thai words with transliteration, meaning, and reading notes
- Local progress saved in the browser
- Search by Thai text, transliteration, or English meaning
- Static Opus pronunciation audio support in the study card
- Responsive UI for desktop and mobile

## Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

## Quality Checks

Run these before committing:

```bash
pnpm format:check
pnpm lint
pnpm test:run
pnpm build
```

Auto-fix formatting and lint issues:

```bash
pnpm format
pnpm lint:fix
```

## Audio Generation

Generate static Thai pronunciation assets with ElevenLabs:

```bash
cp .env.example .env
pnpm audio:list-voices
pnpm audio:generate -- --voice-id=YOUR_THAI_VOICE_ID
```

The generator uses:

- model: `eleven_v3`
- language code: `th`
- format: `opus_48000_96`

Generated files are saved to `public/audio/th/<word-id>.opus`.
