#!/usr/bin/env node

import { handlePromptSubmit } from '../lib/tf.mjs';

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function parsePayload(raw) {
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

try {
  const output = await handlePromptSubmit(parsePayload(await readStdin()));
  if (output) {
    console.log(JSON.stringify(output));
  }
} catch {
  // TokenFit should never block or break the coding agent.
}
