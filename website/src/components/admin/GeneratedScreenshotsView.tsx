/**
 * 생성된 스토어 스크린샷 PNG 미리보기.
 * deliverables 에서 type='aso_screenshots' 레코드 조회 + signed URL.
 */

import { createAdminClient } from "@/lib/supabase/admin";

type ScreenshotEntry = {
  slot: number;
  storage_path: string;
  file_size: number;
};

export async function GeneratedScreenshotsView({
  orderId,
}: {
  orderId: string;
}) {
  const admin = createAdminClient();

  const { data: latest } = await admin
    .from("deliverables")
    .select("id, content, generated_at, version")
    .eq("order_id", orderId)
    .eq("type", "aso_screenshots")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest) {
    return (
      <div className="text-sm text-muted italic">
        아직 생성된 스크린샷이 없습니다.
      </div>
    );
  }

  const content = latest.content as { screenshots: ScreenshotEntry[] } | null;
  const entries = content?.screenshots ?? [];

  if (entries.length === 0) {
    return (
      <div className="text-sm text-muted italic">
        생성된 스크린샷 메타데이터가 비어 있습니다.
      </div>
    );
  }

  const withUrls = await Promise.all(
    entries.map(async (e) => {
      const { data } = await admin.storage
        .from("deliverables")
        .createSignedUrl(e.storage_path, 3600);
      return { ...e, signed_url: data?.signedUrl ?? null };
    })
  );

  return (
    <div>
      <div className="mb-3 text-xs text-muted flex items-center justify-between">
        <span>
          생성 일시: {new Date(latest.generated_at).toLocaleString("ko-KR")}
        </span>
        <span>v{latest.version}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {withUrls.map((e) => (
          <div
            key={e.slot}
            className="border border-border rounded-lg overflow-hidden bg-background"
          >
            {e.signed_url ? (
              <a
                href={e.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-black/20"
                style={{ aspectRatio: "1080 / 1920" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.signed_url}
                  alt={`Slot ${e.slot}`}
                  className="w-full h-full object-cover"
                />
              </a>
            ) : (
              <div className="aspect-[1080/1920] flex items-center justify-center text-xs text-muted">
                (URL 발급 실패)
              </div>
            )}
            <div className="p-2">
              <div className="text-xs font-medium">슬롯 {e.slot}</div>
              <div className="text-[10px] text-muted">
                {(e.file_size / 1024).toFixed(0)} KB
              </div>
              {e.signed_url && (
                <a
                  href={e.signed_url}
                  download={`slot-${e.slot}.png`}
                  className="text-[10px] text-accent-light hover:underline"
                >
                  다운로드
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
