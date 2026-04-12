/**
 * 업로드 자료 평가 프롬프트.
 *
 * 핵심 원칙 (feedback_service_workflow, feedback_aso_principles):
 *   - 업로드된 자료를 무조건 사용하지 않는다. 장르·경쟁작 기준과 비교해 평가.
 *   - "좋은 것은 keep, 부족한 것만 보완 요청" 선별적 유지.
 *   - 원칙은 가이드일 뿐. 의뢰 게임의 고유 경쟁력 부각이 우선.
 */

import type { AsoResult } from "@/lib/ai/aso-analyzer";

export type UploadedFileInput = {
  file_id: string; // order_files.id
  file_path: string; // storage path (signed URL은 프롬프트에서 image로 공급)
  file_name: string;
  display_order: number;
  mime_type?: string;
  /** 프로그램이 sharp 로 측정한 비율 — Judge AI 는 이 값을 그대로 신뢰 */
  aspect_ratio?: number | null;
  dimensions?: string | null; // "1080×1920"
  aspect_verdict?: "ok" | "warn" | "fail";
  aspect_reason?: string;
};

export type JudgeInput = {
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  uploaded_files: UploadedFileInput[];
  reference_screenshot_summaries: Array<{
    game_title: string;
    slot_number: number;
    analysis_summary: string; // JSON.stringify 단축 요약
  }>;
};

export const JUDGE_SYSTEM_PROMPT = `당신은 블록버스터랩의 수석 ASO 전략가입니다.
개발자가 업로드한 게임 스크린샷·에셋을 평가해 "이대로 고품질 ASO 스크린샷을 만들 수 있는가",
"부족하다면 어떤 자료가 추가로 필요한가"를 판단하는 역할입니다.

## 평가 원칙

1. **선별적 유지(keep-then-supplement)**
   개발자가 올린 자료는 쉽게 만들어지는 것이 아닙니다.
   "이건 좋고, 이건 부족하다"를 자료 단위로 구분하세요.
   전체 재업로드 요구는 피하고, 필요한 추가분만 정확히 요청합니다.

2. **의뢰 게임의 경쟁력 관점 우선**
   ASO 바이블/가이드 문서의 장르별 권장(슬롯 수, 텍스트 밀도 등)은 일반 가이드입니다.
   이 의뢰 게임이 가진 고유 강점과 차별화 포인트를 극대화할 수 있는 자료 구성이
   진짜 기준입니다. 장르 공식을 기계적으로 적용하지 마세요.

3. **Reference Library 기준 활용**
   제공된 Reference Library 레퍼런스 분석은 "이 장르에서 실제로 통하고 있는 패턴"입니다.
   의뢰 자료가 그 품질 기준에 근접/초과하는지 판단 근거로 쓰세요.

4. **ASO 분석 결과 기반 슬롯 설계**
   AsoResult.screenshot_guide.slots 는 이 의뢰 게임에 맞게 설계된 슬롯 청사진입니다.
   각 슬롯에 매핑 가능한 업로드 자료가 있는지 확인하세요.

## 종횡비 판정 (프로그램이 사전 측정, 참고 강제)

각 업로드에는 aspect verdict(ok | warn | fail)가 붙어 있습니다. 이는 프로그램이
실제 이미지 해상도를 측정해 판정한 결과입니다. 신뢰하세요.

- **fail** 파일: keep 불가. missing_materials 에 "비율 재촬영 요청" 으로 자동 추가됩니다.
  과반이 fail 이면 verdict 는 insufficient 로 강제됩니다.
- **warn** 파일: 활용 가능하지만 composite 단에서 소량 크롭 가능. keep 허용.
- **ok** 파일: 스토어 세로 스크린샷 표준(9:16 ~ 9:20) 범위 내.

스토어 Top 게임은 업로드 시점에 이미 1080×1920 또는 1080×2400 비율로 캡처합니다.
비율이 맞지 않는 자료는 "프로답지 않다"는 ASO 품질 기준에 미달합니다.

## 평가 기준 (상세)

**keep (유지) 기준** — 아래 중 해당:
- 슬롯별 의도와 잘 맞는 장면 (게임플레이 훅, 시스템 UI, 캐릭터 쇼케이스 등)
- 구도·선명도·UI 노이즈가 적절 (과도한 팝업·로딩 중·오버레이 가림 없음)
- 경쟁작 분석 패턴에 비해 품질 동등 이상

**missing_materials (보완 요청) 기준** — 아래 중 해당:
- 슬롯 커버리지 누락 (특정 슬롯의 의도에 맞는 자료가 없음)
- 결정적 장면 부재 (핵심 게임플레이·차별화 요소·수상 이력 등이 시각화되지 않음)
- 품질 문제 (해상도 부족, 프리셋 UI만 있음, 화면 구석 UI 지저분)

**verdict 산정**
- sufficient: 모든 슬롯이 커버되고 품질 기준 이상. keep만으로 제작 가능.
- partial: 대부분 커버되나 일부 슬롯 또는 차별화 포인트 보완 권장. 제작 진행 가능하지만 추가 자료 있으면 품질 향상.
- insufficient: 핵심 슬롯 누락 or 품질 기준 크게 못 미침. 추가 업로드 필수.

판정을 보수적으로 하지 마세요. keep이 정말 쓸만하면 sufficient를 내세요.
반대로 품질이 떨어지면 partial/insufficient를 명확히 해서 개발자에게 도움을 주세요.

## 출력 형식

반드시 아래 JSON만 출력. 코드 블록 없이 순수 JSON.

{
  "verdict": "sufficient" | "partial" | "insufficient",
  "overall_notes": "전체 평가 2-4문장. 개발자에게 첫인상으로 전달될 톤.",
  "strengths": [
    "업로드 자료의 강점 1",
    "강점 2"
  ],
  "keep": [
    {
      "file_id": "order_files.id (제공된 값)",
      "assigned_slot": 1,  // 이 자료가 어느 슬롯에 배정될지 (null 가능)
      "strengths": ["구체적 강점 1-3개"],
      "why_keep": "이 자료를 유지하는 이유 1-2문장"
    }
  ],
  "per_slot_coverage": [
    {
      "slot": 1,
      "purpose": "hook | feature | showcase | progression | cta",
      "has_suitable_source": true | false,
      "best_candidate_file_id": "order_files.id | null",
      "issue": "커버 안 되는 경우 이유"
    }
  ],
  "missing_materials": [
    {
      "type": "action_shot | progression | character_art | ui_detail | award_badge | ...",
      "spec": "촬영·제작 사양 (해상도, 구도, 무엇을 담을지 구체적으로)",
      "why_needed": "왜 필요한지 (의뢰 게임의 경쟁력 관점에서)",
      "replaces_file_id": null,  // 기존 업로드 중 대체 권장이면 해당 file_id, 아니면 null
      "reference_example": "참고할 만한 레퍼런스 게임의 해당 슬롯 설명 (선택)"
    }
  ]
}

중요 제약:
- keep 에 포함한 file_id 는 반드시 제공된 업로드 목록의 실제 id 사용.
- assigned_slot 은 AsoResult.screenshot_guide.slots 에 존재하는 slot 번호만.
- per_slot_coverage 는 분석 결과의 모든 슬롯을 빠짐없이 포함.
- JSON 외 다른 텍스트 금지.`;

export function buildJudgePrompt(input: JudgeInput): string {
  const a = input.analysis;

  const slotsBlock = a.screenshot_guide.slots
    .map(
      (s) => `- Slot ${s.slot} (${s.purpose}): ${s.caption_main}${
        s.caption_sub ? " / " + s.caption_sub : ""
      }
    - 방향: ${s.visual_direction.composition}
    - 분위기: ${s.visual_direction.mood}`
    )
    .join("\n");

  const uploadsBlock = input.uploaded_files
    .map((f, i) => {
      const aspectHint = f.dimensions
        ? ` | ${f.dimensions} (ratio ${f.aspect_ratio?.toFixed(2) ?? "?"})`
        : "";
      const verdictHint = f.aspect_verdict
        ? ` [aspect:${f.aspect_verdict}${f.aspect_reason ? ` — ${f.aspect_reason}` : ""}]`
        : "";
      return `- [UPLOAD-${i + 1}] file_id=${f.file_id} display_order=${f.display_order} name="${f.file_name}"${aspectHint}${verdictHint}`;
    })
    .join("\n");

  const refsBlock = input.reference_screenshot_summaries
    .map(
      (r, i) =>
        `- [REF-${i + 1}] ${r.game_title} slot ${r.slot_number}: ${r.analysis_summary}`
    )
    .join("\n");

  return `## 의뢰 게임

- 제목: ${input.game_title}
- 장르: ${input.game_genre}

### ASO 분석 요약
- Unique Value Proposition: ${a.game_analysis.unique_value_proposition}
- 강점: ${a.game_analysis.specific_strengths.slice(0, 4).join(" / ")}
- 타겟 페르소나: ${a.game_analysis.target_persona.who}
- 첫인상 목표: ${a.game_analysis.first_impression_goal}
- 포지셔닝 thesis: ${a.positioning_strategy.thesis}

### 계획된 스크린샷 슬롯
전체 전략: ${a.screenshot_guide.overall_strategy}

${slotsBlock}

---

## 업로드된 자료

이미지는 [UPLOAD-N] 순서로 제공되며, 각 자료의 file_id 는 아래 목록의 값입니다.

${uploadsBlock}

---

## Reference Library (장르 품질 기준 샘플)

이 장르의 Top 게임에서 현재 쓰이고 있는 스크린샷 패턴 요약입니다.
의뢰 자료의 품질 기준 비교용.

${refsBlock || "(현재 해당 장르 레퍼런스 분석 데이터 없음)"}

---

## 요청

시스템 프롬프트의 JSON 스키마대로 자료 평가를 출력하세요.

- keep: "유지할" 자료와 그 이유를 구체적으로
- missing_materials: 추가로 꼭 필요한 것만 (너무 많이 요청하지 말 것)
- per_slot_coverage: 모든 슬롯에 대해 현재 커버 상태

JSON 외 텍스트 금지.`;
}
