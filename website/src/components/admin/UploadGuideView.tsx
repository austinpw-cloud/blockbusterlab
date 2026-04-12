/**
 * 업로드 자료 보완 가이드 표시 — type='upload_materials_guide' deliverable 렌더.
 *
 * Judge 판정 요약 + 마크다운 가이드 본문.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import type { JudgeResult } from "@/lib/screenshot/judge-materials";

type GuideContent = {
  guide_markdown: string;
  judgment: JudgeResult;
};

export async function UploadGuideView({ orderId }: { orderId: string }) {
  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("deliverables")
    .select("id, content, generated_at, version")
    .eq("order_id", orderId)
    .eq("type", "upload_materials_guide")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) return null;

  const content = latest.content as unknown as GuideContent | null;
  if (!content?.guide_markdown) {
    return (
      <div className="text-sm text-muted italic">
        가이드 본문이 비어 있습니다.
      </div>
    );
  }

  const { judgment, guide_markdown } = content;

  const verdictColor =
    judgment.verdict === "sufficient"
      ? "text-green-400 border-green-500/40 bg-green-500/10"
      : judgment.verdict === "partial"
        ? "text-yellow-400 border-yellow-500/40 bg-yellow-500/10"
        : "text-red-400 border-red-500/40 bg-red-500/10";

  const verdictLabel =
    judgment.verdict === "sufficient"
      ? "충분 (제작 가능)"
      : judgment.verdict === "partial"
        ? "부분 (보완 권장)"
        : "부족 (재업로드 필요)";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap text-xs text-muted">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded border text-[11px] font-medium ${verdictColor}`}
          >
            {verdictLabel}
          </span>
          <span>유지 {judgment.keep.length}개</span>
          <span>· 추가 요청 {judgment.missing_materials.length}개</span>
        </div>
        <div className="flex items-center gap-2">
          <span>생성: {new Date(latest.generated_at).toLocaleString("ko-KR")}</span>
          <span>v{latest.version}</span>
        </div>
      </div>

      <details className="rounded-lg border border-border bg-background/50">
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted hover:text-foreground">
          판정 상세 JSON 보기
        </summary>
        <pre className="px-3 pb-3 pt-1 text-[10px] leading-relaxed overflow-x-auto text-muted">
          {JSON.stringify(judgment, null, 2)}
        </pre>
      </details>

      <div className="rounded-lg border border-border bg-background/30 p-4">
        <h3 className="text-xs font-medium text-muted mb-2">개발자용 가이드 (마크다운)</h3>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed font-sans text-foreground/90">
          {guide_markdown}
        </pre>
      </div>
    </div>
  );
}
