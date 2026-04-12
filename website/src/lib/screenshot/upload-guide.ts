/**
 * 업로드 자료 보완 가이드 — 개발자용 한국어 마크다운 문서.
 *
 * 어조 원칙:
 *   - "업로드한 자료 중 이건 훌륭하니 그대로 사용합니다" (keep 인정 먼저)
 *   - "다음만 추가로 부탁드립니다" (missing 최소한만 요청)
 *   - 전문 용어는 쉬운 설명과 함께 (예: "오버레이 = 이미지 위에 얹는 카피 텍스트 레이어")
 *   - AI·자동화 언급 금지 (feedback_no_ai_mention)
 *   - 개발자가 즉시 촬영에 들어갈 수 있도록 구체적 사양과 체크리스트
 *
 * 결과물은 deliverables.content.guide_markdown 에 저장되고 백오피스에서 렌더링됨.
 */

import "server-only";
import type { AsoResult } from "@/lib/ai/aso-analyzer";
import type { JudgeResult } from "./judge-materials";

export type UploadGuideInput = {
  game_title: string;
  game_genre: string;
  analysis: AsoResult;
  judgment: JudgeResult;
  uploaded_files_map: Record<string, { file_name: string; display_order: number }>;
};

/**
 * Judge 결과에서 가이드 마크다운을 결정적으로 조립.
 *
 * AI 호출 없이 템플릿 기반 — judgment 자체가 이미 AI 산출물이므로
 * 여기서 또 생성 프롬프트를 돌리면 중복. 대신 구조 좋은 문서로 포맷팅.
 */
export function buildUploadGuideMarkdown(input: UploadGuideInput): string {
  const { game_title, analysis, judgment, uploaded_files_map } = input;

  const sections: string[] = [];

  // 헤더
  sections.push(`# ${game_title} — 스크린샷 자료 보완 안내`);
  sections.push("");
  sections.push(
    "블록버스터랩에서 업로드하신 자료를 검토했습니다. 아래 내용을 참고해 보완 자료를 제공해 주시면, 이어서 스토어 스크린샷 제작을 진행하겠습니다."
  );
  sections.push("");

  // 1. 전체 평가 요약
  sections.push(`## 1. 전체 평가`);
  sections.push("");
  sections.push(judgment.overall_notes);
  sections.push("");

  if (judgment.strengths.length > 0) {
    sections.push(`### 현재 자료의 강점`);
    for (const s of judgment.strengths) {
      sections.push(`- ${s}`);
    }
    sections.push("");
  }

  // 2. 유지할 자료 (Keep)
  if (judgment.keep.length > 0) {
    sections.push(`## 2. 그대로 사용할 자료`);
    sections.push("");
    sections.push(
      "다음 자료는 스토어 스크린샷 제작에 그대로 사용할 계획입니다. 다시 업로드하실 필요가 없습니다."
    );
    sections.push("");

    for (const k of judgment.keep) {
      const meta = uploaded_files_map[k.file_id];
      const name = meta?.file_name ?? `파일 ID ${k.file_id.slice(0, 8)}`;
      const slotHint = k.assigned_slot
        ? ` → 슬롯 ${k.assigned_slot} 배정 예정`
        : "";
      sections.push(`### ✅ ${name}${slotHint}`);
      sections.push(`- **활용 이유**: ${k.why_keep}`);
      if (k.strengths.length > 0) {
        sections.push(`- **강점**:`);
        for (const s of k.strengths) {
          sections.push(`  - ${s}`);
        }
      }
      sections.push("");
    }
  }

  // 3. 슬롯 커버리지
  sections.push(`## 3. 스토어 슬롯별 현재 상태`);
  sections.push("");
  sections.push(
    `스토어에 노출될 ${analysis.screenshot_guide.slots.length}개 슬롯의 목적과 현재 자료 커버리지입니다.`
  );
  sections.push("");

  for (const coverage of judgment.per_slot_coverage) {
    const slotDef = analysis.screenshot_guide.slots.find(
      (s) => s.slot === coverage.slot
    );
    const status = coverage.has_suitable_source ? "✅ 자료 있음" : "⚠️ 보완 필요";

    sections.push(
      `### 슬롯 ${coverage.slot} (${coverage.purpose}) — ${status}`
    );
    if (slotDef) {
      sections.push(`- 목적: ${slotDef.caption_main}`);
      if (slotDef.caption_sub) sections.push(`- 서브 메시지: ${slotDef.caption_sub}`);
      sections.push(`- 시각 방향: ${slotDef.visual_direction.composition}`);
    }
    if (coverage.issue) {
      sections.push(`- 이슈: ${coverage.issue}`);
    }
    sections.push("");
  }

  // 4. 추가 필요 자료
  if (judgment.missing_materials.length > 0) {
    sections.push(`## 4. 추가로 부탁드리는 자료`);
    sections.push("");
    sections.push(
      "아래 항목만 준비해 주시면 됩니다. 각 항목에 촬영·제작 사양을 구체적으로 정리했습니다."
    );
    sections.push("");

    judgment.missing_materials.forEach((m, i) => {
      sections.push(`### ${i + 1}. ${m.type}`);
      sections.push("");
      sections.push(`**왜 필요한가?**`);
      sections.push(m.why_needed);
      sections.push("");
      sections.push(`**촬영·제작 사양**`);
      sections.push(m.spec);
      sections.push("");

      if (m.replaces_file_id) {
        const replaced = uploaded_files_map[m.replaces_file_id];
        if (replaced) {
          sections.push(
            `> 참고: 기존 업로드 \`${replaced.file_name}\` 의 대체 권장 항목입니다.`
          );
          sections.push("");
        }
      }

      if (m.reference_example) {
        sections.push(`**참고 사례**`);
        sections.push(m.reference_example);
        sections.push("");
      }
    });
  }

  // 5. 촬영 일반 가이드
  sections.push(`## 5. 촬영 일반 가이드`);
  sections.push("");
  sections.push(`- **해상도**: 세로 슬롯은 최소 1080×1920 이상 권장.`);
  sections.push(
    `- **UI 정리**: 일시정지·디버그·광고 배너 등 스토어 노출에 부적합한 UI는 제외한 상태로 캡처.`
  );
  sections.push(
    `- **핵심 장면**: 각 슬롯이 전달하려는 메시지(게임 훅, 성장 시스템, 차별화 기능 등)가 한눈에 보여야 합니다.`
  );
  sections.push(
    `- **파일 형식**: PNG 권장(불가피한 경우 JPEG). 파일명은 슬롯 번호나 장면 설명을 포함해 주시면 식별이 쉽습니다.`
  );
  sections.push("");

  // 6. 다음 단계
  sections.push(`## 6. 다음 단계`);
  sections.push("");
  sections.push(
    `1. 위 "4. 추가로 부탁드리는 자료"를 준비해 업로드해 주세요.`
  );
  sections.push(
    `2. 보완 자료가 업로드되면 블록버스터랩 측에서 재검토 후 스토어 스크린샷 제작을 진행합니다.`
  );
  sections.push(
    `3. 추가 문의는 bbl@blockbusterlab.com 으로 보내주시면 빠르게 회신드립니다.`
  );
  sections.push("");
  sections.push("---");
  sections.push("블록버스터랩 — 인디게임닷컴 공식 파트너");

  return sections.join("\n");
}
