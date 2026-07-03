import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';
import { createTokenFitServer } from '../server.mjs';

const BIN = fileURLToPath(new URL('../bin/tokenfit.mjs', import.meta.url));

function runCli(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], {
      env: { ...process.env, ...env },
      timeout: 5000
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

describe('tokenfit start on a busy port', () => {
  let server;
  let port;

  before(async () => {
    const dir = await mkdtemp(join(tmpdir(), 'tokenfit-busy-test-'));
    ({ server } = createTokenFitServer({
      dataFile: join(dir, 'tokenfit.json'),
      publicDir: join(process.cwd(), 'public')
    }));
    await new Promise((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        port = server.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  it('says the daemon is already running instead of dumping a stack trace', async () => {
    const result = await runCli(['start'], { TOKENFIT_PORT: String(port), TOKENFIT_URL: '' });

    assert.equal(result.code, 0);
    assert.match(result.stdout, /already running/i);
    assert.doesNotMatch(result.stderr, /EADDRINUSE/);
  });
});
