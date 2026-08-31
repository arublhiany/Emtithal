// =============================================================================
// Phase 4 tests — server-only enforcement (static source scan).
//
// Proves:
//  - @anthropic-ai/sdk is imported by exactly ONE source file (the transport).
//  - no "use client" component imports the AI client entrypoint or the SDK.
//  - the AI env vars are never NEXT_PUBLIC_* and never referenced from client code.
//  - .env.example keeps the key blank.
// =============================================================================

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "../../../../..");
const SRC = path.join(ROOT, "src");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry) && !/__tests__/.test(full)) out.push(full);
  }
  return out;
}

const FILES = walk(SRC).map((f) => ({ path: path.relative(ROOT, f), text: readFileSync(f, "utf8") }));
const isClientComponent = (f: { text: string }) => /^\s*["']use client["'];/m.test(f.text);
const importsAnthropicSdk = (t: string) => /from\s+["']@anthropic-ai\/sdk["']|require\(["']@anthropic-ai\/sdk["']\)/.test(t);

test("@anthropic-ai/sdk is imported by exactly one source file — the transport", () => {
  const importers = FILES.filter((f) => importsAnthropicSdk(f.text)).map((f) => f.path);
  assert.deepEqual(importers, ["src/lib/ai/client/anthropicTransport.ts"]);
});

test('no "use client" component imports the SDK or the AI client entrypoint', () => {
  for (const f of FILES.filter(isClientComponent)) {
    assert.equal(importsAnthropicSdk(f.text), false, `${f.path} imports @anthropic-ai/sdk`);
    assert.equal(
      /from\s+["']@\/lib\/ai\/client(["'/]|\/index)/.test(f.text),
      false,
      `${f.path} imports the server-only AI client`,
    );
    assert.equal(
      /from\s+["']@\/lib\/ai\/client\/anthropicTransport["']/.test(f.text),
      false,
      `${f.path} imports the Anthropic transport`,
    );
  }
});

test("the transport and client entrypoint carry a runtime browser guard", () => {
  for (const rel of ["src/lib/ai/client/anthropicTransport.ts", "src/lib/ai/client/index.ts"]) {
    const f = FILES.find((x) => x.path === rel)!;
    assert.match(f.text, /typeof window !== ["']undefined["']/);
  }
});

test("AI env vars are server-side only: no NEXT_PUBLIC_*, never in client components", () => {
  for (const f of FILES) {
    assert.equal(
      /NEXT_PUBLIC_[A-Z_]*(AI_PROVIDER_API_KEY|AI_MODEL|AI_PROVIDER|ANTHROPIC)/.test(f.text),
      false,
      `${f.path} exposes an AI var via NEXT_PUBLIC_*`,
    );
    if (isClientComponent(f)) {
      assert.equal(
        /AI_PROVIDER_API_KEY|AI_MODEL/.test(f.text),
        false,
        `${f.path} (client) references an AI env var`,
      );
    }
  }
  // Only server-side modules mention the vars at all.
  const mentioners = FILES.filter((f) => /process\.env\.(AI_PROVIDER_API_KEY|AI_MODEL)/.test(f.text)).map(
    (f) => f.path,
  );
  for (const m of mentioners) {
    assert.ok(m.startsWith("src/lib/ai/"), `${m} reads an AI env var but is not under src/lib/ai/`);
  }
});

test(".env.example keeps the API key blank and uses no NEXT_PUBLIC_ prefix", () => {
  const env = readFileSync(path.join(ROOT, ".env.example"), "utf8");
  assert.match(env, /^AI_PROVIDER_API_KEY=\s*$/m);
  assert.match(env, /^AI_MODEL=\s*$/m);
  assert.equal(/NEXT_PUBLIC_/.test(env), false);
});
