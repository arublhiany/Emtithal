// =============================================================================
// Phase 4 tests — server-only enforcement (static source scan).
//
// Proves:
//  - @anthropic-ai/sdk and @google/genai are each imported by exactly ONE
//    source file (their transports).
//  - no "use client" component imports either provider SDK or the AI client
//    entrypoint / a transport.
//  - the AI env vars are never NEXT_PUBLIC_* and never referenced from client code.
//  - .env.example lists exactly AI_PROVIDER / AI_PROVIDER_API_KEY / AI_MODEL, all blank.
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
const importsPkg = (t: string, pkg: string) => {
  const p = pkg.replace(/[/\\^$.*+?()[\]{}|]/g, "\\$&");
  return new RegExp(`from\\s+["']${p}["']|require\\(["']${p}["']\\)`).test(t);
};

const PROVIDER_SDKS: Record<string, string> = {
  "@anthropic-ai/sdk": "src/lib/ai/client/anthropicTransport.ts",
  "@google/genai": "src/lib/ai/client/geminiTransport.ts",
};

/** Server-only third-party parsers (Phase 6). Each confined to its one module. */
const SERVER_ONLY_LIBS: Record<string, string> = {
  unpdf: "src/lib/evidence/parsePdf.ts",
  "read-excel-file": "src/lib/evidence/parseXlsx.ts",
};

/** Like `importsPkg` but also matches a subpath import (`pkg/node`). */
const importsPkgOrSubpath = (t: string, pkg: string) => {
  const p = pkg.replace(/[/\\^$.*+?()[\]{}|]/g, "\\$&");
  return new RegExp(`from\\s+["']${p}(?:/[\\w./-]+)?["']|require\\(["']${p}(?:/[\\w./-]+)?["']\\)`).test(t);
};

test("each provider SDK is imported by exactly one source file — its transport", () => {
  for (const [pkg, expected] of Object.entries(PROVIDER_SDKS)) {
    const importers = FILES.filter((f) => importsPkg(f.text, pkg)).map((f) => f.path);
    assert.deepEqual(importers, [expected], `${pkg} importers`);
  }
});

test("each server-only parser lib is imported by exactly one source file", () => {
  for (const [pkg, expected] of Object.entries(SERVER_ONLY_LIBS)) {
    const importers = FILES.filter((f) => importsPkgOrSubpath(f.text, pkg)).map((f) => f.path);
    assert.deepEqual(importers, [expected], `${pkg} importers`);
  }
});

test('no "use client" component imports a server-only parser lib or the evidence entrypoint', () => {
  for (const f of FILES.filter(isClientComponent)) {
    for (const pkg of Object.keys(SERVER_ONLY_LIBS)) {
      assert.equal(importsPkgOrSubpath(f.text, pkg), false, `${f.path} imports ${pkg}`);
    }
    assert.equal(
      /from\s+["']@\/lib\/evidence(["'/]|\/index)/.test(f.text),
      false,
      `${f.path} imports the server-only evidence layer`,
    );
    assert.equal(
      /from\s+["']@\/lib\/research(["'/]|\/ingestResearch)/.test(f.text),
      false,
      `${f.path} imports the server-only research layer`,
    );
  }
});

test("the evidence parsers + ingest + research ingest carry a runtime browser guard", () => {
  for (const rel of [
    "src/lib/evidence/parsePdf.ts",
    "src/lib/evidence/parseXlsx.ts",
    "src/lib/evidence/ingestEvidence.ts",
    "src/lib/research/ingestResearch.ts",
    "src/lib/research/verifyWebSnapshot.ts",
  ]) {
    const f = FILES.find((x) => x.path === rel)!;
    assert.match(f.text, /typeof window !== ["']undefined["']/);
  }
});

test('no "use client" component imports a provider SDK or the AI client entrypoint / a transport', () => {
  for (const f of FILES.filter(isClientComponent)) {
    for (const pkg of Object.keys(PROVIDER_SDKS)) {
      assert.equal(importsPkg(f.text, pkg), false, `${f.path} imports ${pkg}`);
    }
    assert.equal(
      /from\s+["']@\/lib\/ai\/client(["'/]|\/index)/.test(f.text),
      false,
      `${f.path} imports the server-only AI client`,
    );
    assert.equal(
      /from\s+["']@\/lib\/ai\/client\/(anthropic|gemini)Transport["']/.test(f.text),
      false,
      `${f.path} imports a provider transport`,
    );
  }
});

test("the transports and client entrypoint carry a runtime browser guard", () => {
  for (const rel of [
    "src/lib/ai/client/anthropicTransport.ts",
    "src/lib/ai/client/geminiTransport.ts",
    "src/lib/ai/client/index.ts",
  ]) {
    const f = FILES.find((x) => x.path === rel)!;
    assert.match(f.text, /typeof window !== ["']undefined["']/);
  }
});

test("AI env vars are server-side only: no NEXT_PUBLIC_*, never in client components", () => {
  for (const f of FILES) {
    assert.equal(
      /NEXT_PUBLIC_[A-Z_]*(AI_PROVIDER_API_KEY|AI_MODEL|AI_PROVIDER|ANTHROPIC|GEMINI|GOOGLE)/.test(f.text),
      false,
      `${f.path} exposes an AI var via NEXT_PUBLIC_*`,
    );
    if (isClientComponent(f)) {
      assert.equal(
        /AI_PROVIDER(_API_KEY)?|AI_MODEL/.test(f.text),
        false,
        `${f.path} (client) references an AI env var`,
      );
    }
  }
  // Only server-side modules mention the vars at all.
  const mentioners = FILES.filter((f) =>
    /process\.env\.(AI_PROVIDER|AI_PROVIDER_API_KEY|AI_MODEL)/.test(f.text),
  ).map((f) => f.path);
  for (const m of mentioners) {
    assert.ok(m.startsWith("src/lib/ai/"), `${m} reads an AI env var but is not under src/lib/ai/`);
  }
});

test(".env.example lists exactly the three AI vars, all blank, no NEXT_PUBLIC_ / no real key", () => {
  const env = readFileSync(path.join(ROOT, ".env.example"), "utf8");
  assert.match(env, /^AI_PROVIDER=\s*$/m);
  assert.match(env, /^AI_PROVIDER_API_KEY=\s*$/m);
  assert.match(env, /^AI_MODEL=\s*$/m);
  assert.equal(/NEXT_PUBLIC_/.test(env), false);
  // no assignment carries a value (only blank `KEY=` lines)
  const assignments = env.split("\n").filter((l) => /^[A-Z_]+=/.test(l));
  assert.deepEqual(
    assignments.sort(),
    ["AI_MODEL=", "AI_PROVIDER=", "AI_PROVIDER_API_KEY="],
  );
});
