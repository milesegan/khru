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
- 281 common Thai words with transliteration, meaning, and reading notes
- Local progress saved in the browser
- Search by Thai text, transliteration, or English meaning
- Static Opus pronunciation audio for each Thai word
- Responsive UI for desktop and mobile

## Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

## Quality Checks

Run these before committing:

```bash
npm run format:check
npm run lint
npm run test:run
npm run build
```

Auto-fix formatting and lint issues:

```bash
npm run format
npm run lint:fix
```

## Audio Generation

Generate static Thai pronunciation assets with ElevenLabs:

```bash
cp .env.example .env
npm run audio:list-voices
npm run audio:generate -- --voice-id=YOUR_THAI_VOICE_ID
```

The generator uses:

- model: `eleven_v3`
- language code: `th`
- format: `opus_48000_96`

Generated files are saved to `public/audio/th/<word-id>.opus`.
