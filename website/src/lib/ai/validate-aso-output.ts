/**
 * Stage 8 Opus 출력 서버 검증 레이어.
 *
 * 배경 (ChatGPT Q1 피드백): Opus 한 번 호출로 제목·서브·설명·키워드·스크린샷 가이드 등
 * 많은 결과물을 동시에 생성하므로, 내부 일관성·필드별 하드 룰이 어긋날 수 있음.
 * `aso-analyzer.ts` 는 JSON 파싱만 하고 필드별 검증은 거의 없었음.
 *
 * 이 모듈은 `AsoResult` 를 받아 **스토어 하드 룰** 기준으로 violations 배열을 반환.
 * 치명 위반은 `severity: "error"`, 경미한 위반은 `"warning"`, 정보성 관찰은 `"info"`.
 *
 * 반환된 violations 는:
 *  - warning 이상: 로그에 찍힘
 *  - 관리자 UI 에 노출 (deliverables 저장 시 메타 필드에 포함)
 *  - error 라도 전체 플로우 중단하지 않음 (운영자가 수동 편집 가능)
 *
 * 하드 룰 출처: `docs/aso/knowledge.md` + Apple/Google 공식 개발자 가이드
 */

import type { AsoResult } from "./aso-analyzer";

export type ViolationSeverity = "error" | "warning" | "info";

export type Violation = {
  field: string; // 예: "title_candidates[0].title" · "store_specific.apple_app_store.subtitle_30"
  severity: ViolationSeverity;
  rule: string; // 예: "max_length_30"
  actual: string | number;
  expected: string | number;
  message: string;
};

export type ValidationResult = {
  violations: Violation[];
  error_count: number;
  warning_count: number;
  info_count: number;
};

/**
 * 스토어 필드 하드 룰 상수.
 */
const LIMITS = {
  // 제목 — Google Play / Apple App Store 모두 30자
  title_max: 30,
  // Apple subtitle 정확히 30자 이내
  apple_subtitle_max: 30,
  // Google Play short description 80자
  gplay_short_description_max: 80,
  // Google Play full description 첫 250자 노출
  gplay_first_250_max: 250,
  // Google Play full description 4000자
  gplay_full_description_max: 4000,
  // Apple promotional text 170자
  apple_promo_max: 170,
  // Apple description 4000자
  apple_description_max: 4000,
  // Apple keywords field 100자 (콤마 구분, 공백 없이 권장)
  apple_keywords_field_max: 100,
  // 스크린샷 슬롯 권장 5~8
  screenshot_min: 5,
  screenshot_max: 8,
  // 키워드 개수 권장 20~30
  keywords_min: 20,
  keywords_max: 30,
  // ASO 점수 0~100
  score_min: 0,
  score_max: 100,
} as const;

function push(
  vs: Violation[],
  field: string,
  severity: ViolationSeverity,
  rule: string,
  actual: string | number,
  expected: string | number,
  message: string
): void {
  vs.push({ field, severity, rule, actual, expected, message });
}

function validateTitleCandidates(result: AsoResult, vs: Violation[]): void {
  const titles = result.title_candidates ?? [];
  for (let i = 0; i < titles.length; i++) {
    const t = titles[i];
    if (typeof t.title !== "string") continue;
    const len = [...t.title].length; // 한글·이모지 포함 graphemes 근사치로 code points
    if (len > LIMITS.title_max) {
      push(
        vs,
        `title_candidates[${i}].title`,
        "error",
        `max_length_${LIMITS.title_max}`,
        len,
        LIMITS.title_max,
        `제목 후보 ${i + 1} 이 ${LIMITS.title_max}자 초과 (${len}자): "${t.title}"`
      );
    }
  }
  // recommended 플래그가 정확히 1개여야 함
  const recCount = titles.filter((t) => t.recommended).length;
  if (recCount !== 1) {
    push(
      vs,
      "title_candidates",
      "warning",
      "exactly_one_recommended",
      recCount,
      1,
      `title_candidates 의 recommended:true 가 ${recCount}개 (1개여야 함)`
    );
  }
}

function validateSubtitleCandidates(result: AsoResult, vs: Violation[]): void {
  const subs = result.subtitle_candidates ?? [];
  for (let i = 0; i < subs.length; i++) {
    const s = subs[i];
    if (typeof s.subtitle !== "string") continue;
    const len = [...s.subtitle].length;
    if (len > LIMITS.apple_subtitle_max) {
      push(
        vs,
        `subtitle_candidates[${i}].subtitle`,
        "error",
        `max_length_${LIMITS.apple_subtitle_max}`,
        len,
        LIMITS.apple_subtitle_max,
        `서브 후보 ${i + 1} 이 ${LIMITS.apple_subtitle_max}자 초과 (${len}자): "${s.subtitle}"`
      );
    }
  }
}

function validateDescription(result: AsoResult, vs: Violation[]): void {
  const d = result.description;
  if (!d) return;
  if (typeof d.first_252_chars === "string") {
    const len = [...d.first_252_chars].length;
    // first_252_chars 는 이름 그대로 252자 안전 범위
    if (len > 252) {
      push(
        vs,
        "description.first_252_chars",
        "warning",
        "max_length_252",
        len,
        252,
        `first_252_chars 가 252자 초과 (${len}자)`
      );
    }
  }
}

function validateGooglePlay(result: AsoResult, vs: Violation[]): void {
  const g = result.store_specific?.google_play;
  if (!g) return;

  if (typeof g.short_description_80 === "string") {
    const len = [...g.short_description_80].length;
    if (len > LIMITS.gplay_short_description_max) {
      push(
        vs,
        "store_specific.google_play.short_description_80",
        "error",
        `max_length_${LIMITS.gplay_short_description_max}`,
        len,
        LIMITS.gplay_short_description_max,
        `Google Play short description 이 ${LIMITS.gplay_short_description_max}자 초과 (${len}자)`
      );
    }
  }

  if (typeof g.full_description_first_250 === "string") {
    const len = [...g.full_description_first_250].length;
    if (len > LIMITS.gplay_first_250_max) {
      push(
        vs,
        "store_specific.google_play.full_description_first_250",
        "warning",
        `max_length_${LIMITS.gplay_first_250_max}`,
        len,
        LIMITS.gplay_first_250_max,
        `Google Play '더보기' 전 노출 영역이 ${LIMITS.gplay_first_250_max}자 초과 (${len}자)`
      );
    }
  }

  if (typeof g.full_description === "string") {
    const len = [...g.full_description].length;
    if (len > LIMITS.gplay_full_description_max) {
      push(
        vs,
        "store_specific.google_play.full_description",
        "error",
        `max_length_${LIMITS.gplay_full_description_max}`,
        len,
        LIMITS.gplay_full_description_max,
        `Google Play full description 이 ${LIMITS.gplay_full_description_max}자 초과 (${len}자)`
      );
    }
  }
}

function validateAppleAppStore(result: AsoResult, vs: Violation[]): void {
  const a = result.store_specific?.apple_app_store;
  if (!a) return;

  if (typeof a.subtitle_30 === "string") {
    const len = [...a.subtitle_30].length;
    if (len > LIMITS.apple_subtitle_max) {
      push(
        vs,
        "store_specific.apple_app_store.subtitle_30",
        "error",
        `max_length_${LIMITS.apple_subtitle_max}`,
        len,
        LIMITS.apple_subtitle_max,
        `Apple subtitle 이 ${LIMITS.apple_subtitle_max}자 초과 (${len}자)`
      );
    }
  }

  if (typeof a.promotional_text_170 === "string") {
    const len = [...a.promotional_text_170].length;
    if (len > LIMITS.apple_promo_max) {
      push(
        vs,
        "store_specific.apple_app_store.promotional_text_170",
        "error",
        `max_length_${LIMITS.apple_promo_max}`,
        len,
        LIMITS.apple_promo_max,
        `Apple promotional text 가 ${LIMITS.apple_promo_max}자 초과 (${len}자)`
      );
    }
  }

  if (typeof a.description === "string") {
    const len = [...a.description].length;
    if (len > LIMITS.apple_description_max) {
      push(
        vs,
        "store_specific.apple_app_store.description",
        "error",
        `max_length_${LIMITS.apple_description_max}`,
        len,
        LIMITS.apple_description_max,
        `Apple description 이 ${LIMITS.apple_description_max}자 초과 (${len}자)`
      );
    }
  }

  if (typeof a.keywords_field_100 === "string") {
    const kw = a.keywords_field_100;
    const len = [...kw].length;
    if (len > LIMITS.apple_keywords_field_max) {
      push(
        vs,
        "store_specific.apple_app_store.keywords_field_100",
        "error",
        `max_length_${LIMITS.apple_keywords_field_max}`,
        len,
        LIMITS.apple_keywords_field_max,
        `Apple keywords field 가 ${LIMITS.apple_keywords_field_max}자 초과 (${len}자)`
      );
    }
    // 공백 들어있으면 토큰 낭비 — warning
    if (/,\s/.test(kw) || /\s,/.test(kw)) {
      push(
        vs,
        "store_specific.apple_app_store.keywords_field_100",
        "warning",
        "comma_no_space",
        kw,
        "'키워드1,키워드2' 형식",
        `Apple keywords field 에 콤마 주변 공백 존재 — 토큰 낭비. 공백 없이 '키워드1,키워드2' 형식 권장`
      );
    }
  }
}

function validateKeywords(result: AsoResult, vs: Violation[]): void {
  const kws = result.keywords ?? [];
  if (kws.length < LIMITS.keywords_min) {
    push(
      vs,
      "keywords",
      "warning",
      `min_count_${LIMITS.keywords_min}`,
      kws.length,
      LIMITS.keywords_min,
      `키워드 개수 ${kws.length} — 권장 최소 ${LIMITS.keywords_min}개`
    );
  } else if (kws.length > LIMITS.keywords_max) {
    push(
      vs,
      "keywords",
      "info",
      `max_count_${LIMITS.keywords_max}`,
      kws.length,
      LIMITS.keywords_max,
      `키워드 개수 ${kws.length} — 권장 최대 ${LIMITS.keywords_max}개 (초과는 품질 저하 가능)`
    );
  }
  // 중복 키워드 체크
  const seen = new Map<string, number>();
  for (const k of kws) {
    const norm = k.keyword?.trim().toLowerCase();
    if (!norm) continue;
    seen.set(norm, (seen.get(norm) ?? 0) + 1);
  }
  const dups = [...seen.entries()].filter(([, n]) => n > 1);
  if (dups.length > 0) {
    push(
      vs,
      "keywords",
      "warning",
      "duplicates",
      dups.map(([k, n]) => `${k}×${n}`).join(", "),
      "unique",
      `중복 키워드 ${dups.length}개: ${dups
        .slice(0, 5)
        .map(([k, n]) => `${k}×${n}`)
        .join(", ")}`
    );
  }
}

function validateScreenshotSlots(result: AsoResult, vs: Violation[]): void {
  const slots = result.screenshot_guide?.slots ?? [];
  if (slots.length < LIMITS.screenshot_min) {
    push(
      vs,
      "screenshot_guide.slots",
      "warning",
      `min_count_${LIMITS.screenshot_min}`,
      slots.length,
      LIMITS.screenshot_min,
      `스크린샷 슬롯 ${slots.length}개 — 권장 최소 ${LIMITS.screenshot_min}개`
    );
  } else if (slots.length > LIMITS.screenshot_max) {
    push(
      vs,
      "screenshot_guide.slots",
      "info",
      `max_count_${LIMITS.screenshot_max}`,
      slots.length,
      LIMITS.screenshot_max,
      `스크린샷 슬롯 ${slots.length}개 — 권장 최대 ${LIMITS.screenshot_max}개`
    );
  }
  // slot 번호 중복 체크
  const slotNums = slots.map((s) => s.slot).filter((n) => typeof n === "number");
  const uniq = new Set(slotNums);
  if (uniq.size !== slotNums.length) {
    push(
      vs,
      "screenshot_guide.slots",
      "warning",
      "duplicate_slot_number",
      slotNums.join(","),
      "unique",
      `slot 번호 중복 존재`
    );
  }
}

function validateAsoScore(result: AsoResult, vs: Violation[]): void {
  const s = result.aso_score;
  if (!s) return;
  const checks: Array<[string, number | undefined]> = [
    ["aso_score.overall", s.overall],
    ["aso_score.breakdown.title", s.breakdown?.title],
    ["aso_score.breakdown.subtitle", s.breakdown?.subtitle],
    ["aso_score.breakdown.description", s.breakdown?.description],
    ["aso_score.breakdown.keywords", s.breakdown?.keywords],
    ["aso_score.breakdown.visual", s.breakdown?.visual],
  ];
  for (const [field, v] of checks) {
    if (typeof v !== "number") continue;
    if (v < LIMITS.score_min || v > LIMITS.score_max) {
      push(
        vs,
        field,
        "error",
        "range_0_100",
        v,
        "0~100",
        `${field} 점수가 0~100 범위 벗어남 (${v})`
      );
    }
  }
}

/**
 * 공개 API — AsoResult 검증.
 */
export function validateAsoOutput(result: AsoResult): ValidationResult {
  const violations: Violation[] = [];

  validateTitleCandidates(result, violations);
  validateSubtitleCandidates(result, violations);
  validateDescription(result, violations);
  validateGooglePlay(result, violations);
  validateAppleAppStore(result, violations);
  validateKeywords(result, violations);
  validateScreenshotSlots(result, violations);
  validateAsoScore(result, violations);

  return {
    violations,
    error_count: violations.filter((v) => v.severity === "error").length,
    warning_count: violations.filter((v) => v.severity === "warning").length,
    info_count: violations.filter((v) => v.severity === "info").length,
  };
}
