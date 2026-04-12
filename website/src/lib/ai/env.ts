/**
 * Anthropic API 키 검증.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `[ai] Missing required env: ${name}. Check .env.local or Vercel environment variables.`
    );
  }
  return value;
}

export function getAnthropicApiKey(): string {
  return required("ANTHROPIC_API_KEY", process.env.ANTHROPIC_API_KEY);
}
