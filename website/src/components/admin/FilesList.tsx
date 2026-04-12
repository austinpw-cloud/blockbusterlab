/**
 * 주문에 업로드된 파일 목록 표시 (서버 컴포넌트).
 * Signed URL로 이미지 미리보기 / 다운로드 링크 제공.
 */

import { createAdminClient } from "@/lib/supabase/admin";

const CATEGORY_LABEL: Record<string, string> = {
  screenshot: "스크린샷",
  logo: "로고/아이콘",
  trailer: "트레일러",
  gameplay_video: "게임플레이 영상",
  character_art: "캐릭터 아트",
  ui_asset: "UI 에셋",
  other: "기타",
};

function formatBytes(bytes: number | null) {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export async function FilesList({ orderId }: { orderId: string }) {
  const admin = createAdminClient();

  const { data: files } = await admin
    .from("order_files")
    .select("id, category, file_name, file_size, mime_type, storage_path, uploaded_at")
    .eq("order_id", orderId)
    .order("category")
    .order("uploaded_at");

  if (!files || files.length === 0) {
    return (
      <div className="text-sm text-muted italic">
        업로드된 파일이 없습니다.
      </div>
    );
  }

  // 각 파일에 대한 signed URL 발급 (1시간 유효)
  const filesWithUrls = await Promise.all(
    files.map(async (f) => {
      const { data } = await admin.storage
        .from("order-materials")
        .createSignedUrl(f.storage_path, 3600);
      return { ...f, signed_url: data?.signedUrl ?? null };
    })
  );

  // 카테고리별 그룹
  const grouped: Record<string, typeof filesWithUrls> = {};
  for (const f of filesWithUrls) {
    if (!grouped[f.category]) grouped[f.category] = [];
    grouped[f.category].push(f);
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([category, catFiles]) => (
        <div key={category}>
          <h3 className="text-sm font-semibold mb-3">
            {CATEGORY_LABEL[category] ?? category}{" "}
            <span className="text-xs text-muted font-normal">
              ({catFiles.length}개)
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {catFiles.map((f) => {
              const isImage = f.mime_type?.startsWith("image/");
              return (
                <div
                  key={f.id}
                  className="border border-border rounded-lg overflow-hidden bg-background"
                >
                  {isImage && f.signed_url ? (
                    <a
                      href={f.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block aspect-square bg-black/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={f.signed_url}
                        alt={f.file_name}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ) : (
                    <div className="aspect-square flex items-center justify-center bg-surface text-xs text-muted">
                      {f.mime_type ?? "파일"}
                    </div>
                  )}
                  <div className="p-2">
                    <div className="text-xs truncate" title={f.file_name}>
                      {f.file_name}
                    </div>
                    <div className="text-[10px] text-muted">
                      {formatBytes(f.file_size)}
                    </div>
                    {f.signed_url && (
                      <a
                        href={f.signed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-accent-light hover:underline"
                      >
                        열기 ↗
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
