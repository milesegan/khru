#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const dataFile = path.join(repoRoot, "src/data/words.ts");
const outputDir = path.join(repoRoot, "public/audio/th");
const envFile = path.join(repoRoot, ".env");
const modelId = "eleven_v3";
const outputFormat = "opus_48000_96";
const languageCode = "th";
const apiBaseUrl = "https://api.elevenlabs.io/v1";

function loadEnvFile(filePath) {
  return fs
    .readFile(filePath, "utf8")
    .then((contents) => {
      for (const line of contents.split(/\r?\n/u)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        const separatorIndex = trimmed.indexOf("=");
        if (separatorIndex === -1) {
          continue;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (key && !(key in process.env)) {
          process.env[key] = value;
        }
      }
    })
    .catch((error) => {
      if (error.code !== "ENOENT") {
        throw error;
      }
    });
}

function parseArguments(argv) {
  const options = {
    dryRun: false,
    force: false,
    listVoices: false,
    only: [],
    voiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  };

  for (const argument of argv) {
    if (argument === "--dry-run") {
      options.dryRun = true;
      continue;
    }

    if (argument === "--force") {
      options.force = true;
      continue;
    }

    if (argument === "--list-voices") {
      options.listVoices = true;
      continue;
    }

    if (argument.startsWith("--only=")) {
      options.only = argument
        .slice("--only=".length)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      continue;
    }

    if (argument.startsWith("--voice-id=")) {
      options.voiceId = argument.slice("--voice-id=".length).trim();
      continue;
    }

    if (argument === "--help") {
      printHelp();
      process.exit(0);
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return options;
}

function printHelp() {
  console.log(`Generate Thai pronunciation audio with ElevenLabs.

Usage:
  npm run audio:generate
  npm run audio:generate -- --dry-run
  npm run audio:generate -- --only=chan,baan
  npm run audio:generate -- --voice-id=VOICE_ID
  npm run audio:list-voices

Options:
  --dry-run       Show the work without calling the API
  --force         Regenerate files even when they already exist
  --only=<ids>    Comma-separated list of word ids to generate
  --voice-id=<id> Override ELEVENLABS_VOICE_ID for this run
  --list-voices   Print the available voices on the account
  --help          Show this help message
`);
}

async function readWords() {
  const sourceText = await fs.readFile(dataFile, "utf8");
  const sourceFile = ts.createSourceFile(
    dataFile,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const words = [];

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "word"
    ) {
      const [idNode, thaiNode] = node.arguments;
      if (
        idNode &&
        thaiNode &&
        ts.isStringLiteralLike(idNode) &&
        ts.isStringLiteralLike(thaiNode)
      ) {
        words.push({
          id: idNode.text,
          thai: thaiNode.text,
          charCount: [...thaiNode.text].length,
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return words;
}

function getOutputPath(wordId) {
  return path.join(outputDir, `${wordId}.opus`);
}

async function listVoices(apiKey) {
  const response = await fetch(`${apiBaseUrl}/voices`, {
    headers: {
      "xi-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const payload = await response.json();
  const voices = Array.isArray(payload.voices) ? payload.voices : [];
  for (const voice of voices) {
    const labels =
      voice.labels && typeof voice.labels === "object"
        ? Object.entries(voice.labels)
            .map(([key, value]) => `${key}=${value}`)
            .join(", ")
        : "";
    console.log(
      `${voice.voice_id}\t${voice.name}\t${voice.category ?? "unknown"}${
        labels ? `\t${labels}` : ""
      }`,
    );
  }
}

async function getErrorMessage(response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = await response.json().catch(() => null);
    const detail =
      payload?.detail?.message ??
      payload?.detail?.status ??
      payload?.detail ??
      payload?.message;
    if (detail) {
      return `${response.status} ${response.statusText}: ${detail}`;
    }
  }

  const text = await response.text();
  if (text) {
    return `${response.status} ${response.statusText}: ${text}`;
  }

  return `${response.status} ${response.statusText}`;
}

async function generateAudio({ apiKey, voiceId, word }) {
  const response = await fetch(
    `${apiBaseUrl}/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/ogg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text: word.thai,
        model_id: modelId,
        language_code: languageCode,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(getOutputPath(word.id), audioBuffer);
}

async function main() {
  await loadEnvFile(envFile);
  const options = parseArguments(process.argv.slice(2));
  const apiKey = process.env.ELEVENLABS_API_KEY ?? "";

  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is required in .env or the shell.");
  }

  if (options.listVoices) {
    await listVoices(apiKey);
    return;
  }

  const voiceId = options.voiceId || process.env.ELEVENLABS_VOICE_ID || "";
  if (!voiceId) {
    throw new Error(
      "ELEVENLABS_VOICE_ID is required. Set it in .env or pass --voice-id=<id>. Use npm run audio:list-voices to inspect your account voices.",
    );
  }

  const words = await readWords();
  const onlySet =
    options.only.length > 0
      ? new Set(options.only.map((id) => id.trim()))
      : null;
  const filteredWords = onlySet
    ? words.filter((word) => onlySet.has(word.id))
    : words;
  const missingIds = onlySet
    ? [...onlySet].filter((id) => !filteredWords.some((word) => word.id === id))
    : [];

  if (missingIds.length > 0) {
    throw new Error(`Unknown word ids: ${missingIds.join(", ")}`);
  }

  await fs.mkdir(outputDir, { recursive: true });

  const summary = {
    total: filteredWords.length,
    totalChars: filteredWords.reduce((sum, word) => sum + word.charCount, 0),
    generated: 0,
    skipped: 0,
    failed: 0,
  };

  if (options.dryRun) {
    console.log(
      `Dry run: ${summary.total} files, ${summary.totalChars} Thai characters, model ${modelId}, format ${outputFormat}`,
    );
    return;
  }

  for (const word of filteredWords) {
    const outputPath = getOutputPath(word.id);
    const alreadyExists = await fs
      .access(outputPath)
      .then(() => true)
      .catch(() => false);

    if (alreadyExists && !options.force) {
      summary.skipped += 1;
      console.log(`skip ${word.id}`);
      continue;
    }

    try {
      console.log(
        `generate ${word.id} -> ${path.relative(repoRoot, outputPath)}`,
      );
      await generateAudio({ apiKey, voiceId, word });
      summary.generated += 1;
    } catch (error) {
      summary.failed += 1;
      console.error(
        `failed ${word.id}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  console.log(
    `Summary: generated=${summary.generated} skipped=${summary.skipped} failed=${summary.failed} total=${summary.total} chars=${summary.totalChars}`,
  );

  if (summary.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
