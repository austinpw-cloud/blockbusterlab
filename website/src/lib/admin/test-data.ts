/**
 * 테스트 데이터 식별 — 운영 통계에서 자동 제외.
 *
 * 4/12 사이트 폼 검증 + 4/27-28 dev 엔드포인트 테스트로 생성된 고객.
 * 운영 진입 후 실제 고객과 섞이지 않도록 명시 화이트리스트.
 */

export const TEST_CUSTOMER_EMAILS = new Set<string>([
  "dev-test@blockbusterlab.com", // 쓰레기왕 v1/v2/v3 테스트
  "123@123.com", // 4/12 폼 검증
  "test@lunosoft.co.kr", // 4/12 폼 검증
  "test+prod@lunosoft.co.kr", // 4/12 폼 검증
  "andy@lunosoft.co.kr", // 4/12 폼 검증
]);

export function isTestEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return TEST_CUSTOMER_EMAILS.has(email.toLowerCase().trim());
}
