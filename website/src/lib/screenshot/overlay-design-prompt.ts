/**
 * 오버레이 디자인 프롬프트 — 게임 스크린샷 원본은 건드리지 않고,
 * 오버레이 레이어(카피 + 장식 + 그라디언트) 부분만 AI가 생성.
 *
 * 설계 원칙 (feedback_screenshot_architecture, feedback_aso_principles):
 *   - 게임 스크린샷은 1080×1920 전체 배경, 변형/리사이즈/크롭 금지.
 *   - 오버레이는 position absolute로 부분 영역만. 전체를 덮지 않음.
 *   - ASO 바이블의 장르별 권장(카피 밀도, 슬롯 수 등)은 가이드일 뿐.
 *     의뢰 게임의 경쟁력을 돋보이게 하는 설계가 진짜 기준.
 *   - Reference Library 분석을 참조해 "이 장르에서 실제 통하는 패턴"을 따르되,
 *     의뢰 게임의 고유 성격에 맞춰 해석.
 */

import type { AsoResult } from "@/lib/ai/aso-analyzer";

export type OverlayDesignSlotInput = {
  slot: number;
  /**
   * Judge가 배정한 소스 이미지 (keep 또는 추후 업로드된 자료 중 고른 것).
   * file_id + signed_url 제공. AI는 이 이미지를 Vision으로 본다.
   */
  source: {
    file_id: string;
    signed_url: string;
    file_name: string;
  };
};

export type OverlayDesignInput = {
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  slots: OverlayDesignSlotInput[];
  reference_screenshot_summaries: Array<{
    game_title: string;
    slot_number: number;
    analysis_summary: string;
  }>;
};

export const OVERLAY_DESIGN_SYSTEM_PROMPT = `당신은 블록버스터랩의 수석 ASO 비주얼 디자이너입니다.
Google Play Top 게임들이 스크린샷에 얹는 오버레이(카피 + 장식 + 그라디언트)의 품질 기준을
Reference Library 분석을 통해 숙지하고 있으며, 의뢰 인디 게임을 그 기준에 맞춰 돋보이게 합니다.

## 핵심 제약 (절대 위반 금지)

1. **게임 스크린샷 원본 보존**
   - 게임 스크린샷(제공된 [GAME-SLOT-N] 이미지)은 1080×1920 캔버스 전체 배경으로 배치됩니다.
   - 당신은 이 이미지를 리사이즈·크롭·필터·변형할 수 없습니다.
   - 당신이 <img> 태그를 추가하지도 않습니다 (이미 composite 렌더러가 배치함).

2. **오버레이 레이어만 생성**
   - 출력하는 html 은 오버레이 루트 <div> 한 개 (.s{slot}).
   - 오버레이는 position: absolute 로 부분 영역만 차지해야 합니다.
   - 전체 캔버스를 가리는 불투명 배경 금지 (단, 필요 최소 영역에 반투명 그라디언트는 OK).

3. **오버레이가 불필요한 슬롯**
   - 게임 스크린샷 자체가 이미 강력한 메시지를 주면 needs_overlay=false 로 두고,
     오버레이 없이 원본 그대로 사용합니다 (시뮬레이션 비주얼 우선 장르 등).

## ASO 품질 원칙 (가이드 — 절대 규칙 아님)

- 장르별 권장 (ASO 바이블): 퍼즐 5-8장, 전략 8-10장, 시뮬레이션 텍스트 최소 등.
- 첫 3장은 검색 결과에서 먼저 노출 — hook 강도가 중요.
- 캡션 텍스트 가독성(섀도우/아웃라인) 확보, 무음 상태에서도 메시지 전달.
- K-인디: 감성·예술적 차별화, 수상 이력 강조.

⚠️ 이 원칙들은 일반 가이드입니다. 의뢰 게임의 경쟁력이 다른 방향을 요구하면
    그쪽을 우선하세요. 장르 공식의 기계적 적용 금지.

## Reference Library 활용

제공된 Reference 분석 요약은 "이 장르에서 현재 통하고 있는 패턴" 입니다.
슬롯별 레이아웃·타이포·장식 요소를 참조하되, 의뢰 게임 성격에 맞춰 해석하세요.
Reference를 모방하지 말고, "왜 그 패턴이 통하는지"를 추출해 이 게임에 적용합니다.

## 출력 형식

반드시 아래 JSON만 출력. 코드 블록 없이 순수 JSON.

{
  "reference_analysis": {
    "selected_references": [
      {
        "competitor_name": "Reference 게임명",
        "why_matched": "이 의뢰 게임과 매칭되는 이유 1-2문장",
        "quality_elements_extracted": ["추출한 시각 요소 2-4개"]
      }
    ],
    "quality_bar_summary": "이 게임 스크린샷 오버레이가 지켜야 할 품질 요약 2-3문장"
  },
  "slots": [
    {
      "slot": 1,
      "source_file_id": "제공된 file_id 그대로",
      "purpose": "hook | feature | showcase | progression | cta",
      "needs_overlay": true | false,
      "overlay": {
        // needs_overlay=true 일 때만 포함
        "position_hint": "top | bottom | center | top_left | bottom_left | ...",
        "html": "<div class='s1'>...오버레이 루트 div 1개...</div>",
        "css": ".s1 { position: absolute; ... } .s1 .headline { ... }"
      },
      "design_notes": "왜 이 슬롯에 이런 오버레이(또는 미오버레이)를 선택했는지 2-3문장"
    }
  ]
}

## HTML/CSS 제약

- html은 .s{slot} 루트 <div> 한 개. 그 안에 자유 구조.
- CSS 셀렉터는 모두 .s{slot} 접두사로 네임스페이스.
- position: absolute 기준. top/bottom/left/right 직접 지정.
- 오버레이가 차지하는 영역은 캔버스의 일부만 (전체를 가리지 마세요).
- <img> 태그 금지 (게임 이미지는 composite 렌더러가 배치함).
- 아이콘·장식은 인라인 SVG 로 그립니다.
- 폰트: Pretendard Variable (이미 로드됨), 또는 system-ui.
- 애니메이션·@keyframes 금지 (정적 PNG 렌더).
- backdrop-filter, gradient, box-shadow, text-shadow, filter, mask 는 자유 사용.

## 자기 검증 (출력 전 필수)

- 각 슬롯 HTML+CSS가 게임 이미지 위에 얹혔을 때 시각적으로 조화로운가?
- 오버레이가 게임 장면 핵심을 가리지 않는가?
- 카피 텍스트가 배경과 대비돼 또렷이 보이는가 (shadow/outline)?
- Reference 패턴에서 뽑은 요소를 실제 반영했는가?
- 이 게임의 경쟁력·첫인상 목표가 오버레이로 강화되었는가?`;

export function buildOverlayDesignPrompt(input: OverlayDesignInput): string {
  const { analysis } = input;

  const slotDefs = analysis.screenshot_guide.slots
    .map((s, idx) => {
      const mapped = input.slots.find((x) => x.slot === s.slot);
      const sourceLabel = mapped
        ? `[GAME-SLOT-${idx + 1}] file_id=${mapped.source.file_id}`
        : "(배정된 소스 없음)";
      return `
### 슬롯 ${s.slot}
- 목적: ${s.purpose}
- 메인 카피: "${s.caption_main}"${s.caption_sub ? `\n- 서브 카피: "${s.caption_sub}"` : ""}
- 카피 근거: ${s.caption_rationale}
- 시각 방향: ${s.visual_direction.composition}
- 권장 색상: ${s.visual_direction.dominant_colors.join(", ")}
- 분위기: ${s.visual_direction.mood}
- 타이포 힌트: ${s.visual_direction.typography_hint}
- 경쟁작과의 차별화: ${s.differentiation_from_competitor}
- 할당된 게임 이미지: ${sourceLabel}
`;
    })
    .join("\n");

  const refBlock =
    input.reference_screenshot_summaries
      .slice(0, 20)
      .map(
        (r, i) =>
          `- [REF-${i + 1}] ${r.game_title} slot ${r.slot_number}: ${r.analysis_summary}`
      )
      .join("\n") || "(해당 장르 레퍼런스 분석 데이터 없음)";

  return `## 의뢰 게임

- 제목: ${input.game_title}
- 장르: ${input.game_genre}

### ASO 분석 요약 (의뢰 게임의 경쟁력·성격)
- Unique Value Proposition: ${analysis.game_analysis.unique_value_proposition}
- 강점: ${analysis.game_analysis.specific_strengths.slice(0, 4).join(" / ")}
- 타겟 페르소나: ${analysis.game_analysis.target_persona.who} — ${analysis.game_analysis.target_persona.why}
- 첫인상 목표: ${analysis.game_analysis.first_impression_goal}
- 포지셔닝 thesis: ${analysis.positioning_strategy.thesis}

### 전체 스크린샷 구성 전략
${analysis.screenshot_guide.overall_strategy}

---

## Reference Library (장르 품질 기준 샘플)

${refBlock}

---

## 슬롯별 설계

제공된 [GAME-SLOT-N] 이미지는 각 슬롯의 배경으로 이미 배치됩니다.
이미지 자체는 건드리지 말고, 그 위에 얹을 오버레이만 설계하세요.

${slotDefs}

---

## 요청

JSON 스키마대로만 출력. 각 슬롯에 대해:
1. source_file_id 를 그대로 반환
2. needs_overlay 판단
3. overlay 가 필요하면 .s{slot} 루트 div + CSS 로 오버레이 레이어 작성
4. design_notes 에 선택 근거

JSON 외 텍스트 금지.`;
}
