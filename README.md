# Khru Thai Reader

A minimal responsive web app for native English speakers learning to read common Thai words and short everyday Thai sentences.

## Stack

- Vite
- React
- TypeScript
- Vitest
- ESLint
- Prettier

## Features

- Flashcard-based Thai reading practice with `words` and `conversation` study modes
- 343 common Thai words plus 100 short everyday Thai sentences
- Local progress saved in the browser
- Search by Thai text, transliteration, or English meaning
- Static Opus pronunciation audio support in the study card with per-mode asset folders
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
pnpm audio:generate --voice-id=YOUR_THAI_VOICE_ID
pnpm audio:generate --mode=conversation --voice-id=YOUR_THAI_VOICE_ID
```

The generator uses:

- model: `eleven_v3`
- language code: `th`
- format: `opus_48000_96`

Options:

- `--mode=words|conversation|all` selects which deck to generate. The default is `all`.
- `--only=<id,id>` limits generation to specific study item ids.
- `--force` regenerates files even if they already exist.

Generated files are saved to:

- `public/audio/th/words/<word-id>.opus`
- `public/audio/th/conversation/<conversation-id>.opus`
