/**
 * Anthropic Claude API 클라이언트.
 *
 * 서버 전용. 절대 브라우저 번들에 포함되면 안 됨.
 */

import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { getAnthropicApiKey } from "./env";
import type { ModelId } from "./models";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: getAnthropicApiKey() });
  }
  return _client;
}

/**
 * Vision용 이미지 레퍼런스 (signed URL + label).
 * Anthropic API가 내부적으로 URL에서 이미지 다운로드.
 */
export type ImageRef = {
  url: string;
  label?: string; // 프롬프트에 설명 추가 (예: "업로드된 스크린샷 #3")
};

export type CompletionInput = {
  model: ModelId;
  system?: string;
  userMessage: string;
  images?: ImageRef[];
  maxTokens?: number;
  temperature?: number;
};

export type CompletionResult = {
  text: string;
  input_tokens: number;
  output_tokens: number;
  stop_reason: string | null;
};

/**
 * Messages 생성 호출 (텍스트 + 선택적 이미지).
 *
 * 내부적으로 스트리밍 사용 — Opus 4.6의 긴 응답(최대 32K 토큰, 10분+)은
 * 반드시 스트리밍이 필요함 (Anthropic 정책).
 * 호출부에는 동일한 Promise<CompletionResult> 인터페이스 제공.
 */
export async function complete(input: CompletionInput): Promise<CompletionResult> {
  const client = getClient();

  // content 블록 구성
  const contentBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  if (input.images && input.images.length > 0) {
    for (const img of input.images) {
      if (img.label) {
        contentBlocks.push({ type: "text", text: `[${img.label}]` });
      }
      contentBlocks.push({
        type: "image",
        source: {
          type: "url",
          url: img.url,
        },
      });
    }
  }

  contentBlocks.push({ type: "text", text: input.userMessage });

  // 스트리밍으로 긴 응답 대응
  const stream = client.messages.stream({
    model: input.model,
    max_tokens: input.maxTokens ?? 4096,
    temperature: input.temperature ?? 0.7,
    system: input.system,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const res = await stream.finalMessage();

  const firstBlock = res.content[0];
  const text = firstBlock?.type === "text" ? firstBlock.text : "";

  return {
    text,
    input_tokens: res.usage.input_tokens,
    output_tokens: res.usage.output_tokens,
    stop_reason: res.stop_reason,
  };
}

/**
 * JSON 응답 파싱 — ```json``` 블록 또는 순수 JSON 모두 처리.
 */
export function parseJsonResponse<T>(text: string): T {
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  const raw = codeBlockMatch?.[1] ?? text.trim();

  const jsonStart = raw.search(/[{[]/);
  const jsonText = jsonStart >= 0 ? raw.slice(jsonStart) : raw;

  return JSON.parse(jsonText) as T;
}
