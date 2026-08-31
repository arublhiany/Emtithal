// =============================================================================
// StructuredAIClient — provider-agnostic call logic (Phase 4).
//
// Pure: it holds an `AITransport` (the only Anthropic seam) and implements the
// retry / guardrail / schema / logging pipeline. No SDK import here, so it is
// fully unit-testable with a fake transport.
//
//   generateStructured:
//     call → parse JSON → GUARDRAIL scan (reject, no retry) → schema validate
//     (retry once on malformed/invalid) → ok | SCHEMA_VALIDATION_FAILED
//   any transport throw → PROVIDER_ERROR
//   no credentials      → UnavailableAIClient → AI_UNAVAILABLE
//   nothing is ever fabricated on failure.
// =============================================================================

import { randomUUID } from "node:crypto";
import type {
  AICallMeta,
  AICallResult,
  AIClient,
  AITransport,
  GenerateStructuredOptions,
  GenerateTextOptions,
} from "./types";
import { logAICall } from "./logging";
import {
  scanForForbiddenContent,
  scanTextForForbiddenContent,
  withSharedGuardrails,
} from "@/lib/ai/guardrails/sharedGuardrails";

const DEFAULT_MAX_TOKENS = 1024;

function extractJson(text: string): unknown {
  let s = text.trim();
  // strip ```json ... ``` / ``` ... ``` fences
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) s = fence[1].trim();
  // fall back to the outermost { ... }
  if (!s.startsWith("{")) {
    const first = s.indexOf("{");
    const last = s.lastIndexOf("}");
    if (first !== -1 && last > first) s = s.slice(first, last + 1);
  }
  return JSON.parse(s) as unknown;
}

function readConfidence(data: unknown): AICallMeta["confidence"] {
  if (data && typeof data === "object" && "confidence" in data) {
    const c = (data as { confidence?: unknown }).confidence;
    if (c === "HIGH" || c === "MEDIUM" || c === "LOW") return c;
  }
  return null;
}

export class StructuredAIClient implements AIClient {
  constructor(private readonly transport: AITransport) {}

  private baseMeta(purpose: string): AICallMeta {
    return {
      requestId: randomUUID(),
      purpose,
      provider: this.transport.provider,
      model: this.transport.model,
      durationMs: 0,
      success: false,
      schemaValid: false,
      failureCode: null,
      confidence: null,
      attempts: 0,
    };
  }

  async generateStructured<TData>(
    opts: GenerateStructuredOptions<TData>,
  ): Promise<AICallResult<TData>> {
    const meta = this.baseMeta(opts.purpose);
    const started = Date.now();
    const system = withSharedGuardrails(opts.system);
    const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;

    let user = opts.input;
    // At most one retry (attempts 1 and 2).
    for (let attempt = 1; attempt <= 2; attempt++) {
      meta.attempts = attempt;

      let text: string;
      try {
        ({ text } = await this.transport.complete({ system, user, maxTokens }));
      } catch (err) {
        return this.finish(meta, started, {
          ok: false,
          failureCode: "PROVIDER_ERROR",
          message: `Provider call failed: ${errText(err)}`,
          meta,
        });
      }

      let json: unknown;
      try {
        json = extractJson(text);
      } catch {
        user = `${opts.input}\n\nYour previous response was not valid JSON. Return ONLY the corrected JSON object.`;
        continue; // retry once
      }

      // Guardrail scan on the raw parsed object — reject, never strip, no retry.
      const scan = scanForForbiddenContent(json, opts.guardrail);
      if (!scan.ok) {
        return this.finish(meta, started, {
          ok: false,
          failureCode: "GUARDRAIL_REJECTED",
          message: "AI output attempted a forbidden regulatory-authority field.",
          violations: scan.violations,
          meta,
        });
      }

      const parsed = opts.schema.safeParse(json);
      if (!parsed.success) {
        user = `${opts.input}\n\nYour previous response did not match the required schema (${parsed.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 5)
          .join("; ")}). Return ONLY the corrected JSON object.`;
        continue; // retry once
      }

      meta.schemaValid = true;
      meta.success = true;
      meta.confidence = readConfidence(parsed.data);
      return this.finish(meta, started, { ok: true, data: parsed.data as TData, meta });
    }

    return this.finish(meta, started, {
      ok: false,
      failureCode: "SCHEMA_VALIDATION_FAILED",
      message: "Provider output was malformed or schema-invalid after one retry.",
      meta,
    });
  }

  async generateText(opts: GenerateTextOptions): Promise<AICallResult<string>> {
    const meta = this.baseMeta(opts.purpose);
    const started = Date.now();
    const system = withSharedGuardrails(opts.system);

    let text: string;
    try {
      ({ text } = await this.transport.complete({
        system,
        user: opts.input,
        maxTokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      }));
    } catch (err) {
      meta.attempts = 1;
      return this.finish(meta, started, {
        ok: false,
        failureCode: "PROVIDER_ERROR",
        message: `Provider call failed: ${errText(err)}`,
        meta,
      });
    }
    meta.attempts = 1;

    const scan = scanTextForForbiddenContent(text);
    if (!scan.ok) {
      return this.finish(meta, started, {
        ok: false,
        failureCode: "GUARDRAIL_REJECTED",
        message: "AI text output asserted a forbidden regulatory-authority field.",
        violations: scan.violations,
        meta,
      });
    }

    meta.success = true;
    meta.schemaValid = true; // n/a for text
    return this.finish(meta, started, { ok: true, data: text, meta });
  }

  private finish<TData>(
    meta: AICallMeta,
    started: number,
    result: AICallResult<TData>,
  ): AICallResult<TData> {
    meta.durationMs = Date.now() - started;
    if (!result.ok) {
      meta.success = false;
      meta.failureCode = result.failureCode;
    }
    logAICall(meta);
    return result;
  }
}

/** Returned by `getAIClient()` when credentials are not configured. Never throws, never fakes. */
export class UnavailableAIClient implements AIClient {
  constructor(private readonly reason: string) {}

  private unavailable<TData>(purpose: string): AICallResult<TData> {
    const meta: AICallMeta = {
      requestId: randomUUID(),
      purpose,
      provider: "none",
      model: "none",
      durationMs: 0,
      success: false,
      schemaValid: false,
      failureCode: "AI_UNAVAILABLE",
      confidence: null,
      attempts: 0,
    };
    logAICall(meta);
    return { ok: false, failureCode: "AI_UNAVAILABLE", message: this.reason, meta };
  }

  async generateStructured<TData>(
    opts: GenerateStructuredOptions<TData>,
  ): Promise<AICallResult<TData>> {
    return this.unavailable<TData>(opts.purpose);
  }
  async generateText(opts: GenerateTextOptions): Promise<AICallResult<string>> {
    return this.unavailable<string>(opts.purpose);
  }
}

function errText(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
