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
- 253 common Thai words with transliteration, meaning, and reading notes
- Local progress saved in the browser
- Search by Thai text, transliteration, or English meaning
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
