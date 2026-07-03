#!/usr/bin/env node

const endpoint = process.env.TOKENFIT_URL || 'http://127.0.0.1:4317/api/hook';
const timeoutMs = Number(process.env.TOKENFIT_HOOK_TIMEOUT_MS || 450);

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function parsePayload(raw) {
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { raw };
  }
}

const raw = await readStdin();
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), timeoutMs);

try {
  await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      source: 'claude-code-hook',
      receivedAt: new Date().toISOString(),
      payload: parsePayload(raw)
    }),
    signal: controller.signal
  });
} catch {
  // TokenFit should never block or break the coding agent.
} finally {
  clearTimeout(timeout);
}
