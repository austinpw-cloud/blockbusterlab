/**
 * /admin/orders/[orderId] — 주문 상세.
 *
 * - 고객/게임 정보 표시
 * - 업로드된 자료 미리보기
 * - 상태/결제 변경 버튼
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusActions } from "@/components/admin/StatusActions";
import { FilesList } from "@/components/admin/FilesList";
import { OrderStatusBadge } from "@/components/admin/OrderStatusBadge";
import { RunAnalysisButton } from "@/components/admin/RunAnalysisButton";
import { AsoResultView } from "@/components/admin/AsoResultView";
import { GenerateScreenshotsButton } from "@/components/admin/GenerateScreenshotsButton";
import { GeneratedScreenshotsView } from "@/components/admin/GeneratedScreenshotsView";
import { UploadGuideView } from "@/components/admin/UploadGuideView";
import { GAME_GENRES, TARGET_MARKETS } from "@/lib/aso/constants";
import type { OrderStatus } from "@/lib/aso/status";
import type { AsoResult } from "@/lib/ai/aso-analyzer";

const GENRE_LABEL = Object.fromEntries(GAME_GENRES.map((g) => [g.id, g.label]));
const MARKET_LABEL = Object.fromEntries(
  TARGET_MARKETS.map((m) => [m.id, m.label])
);

function formatKRW(krw: number | null) {
  if (krw == null) return "-";
  return new Intl.NumberFormat("ko-KR").format(krw) + "원";
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Customer = {
  id: string;
  name: string;
  email: string;
  studio_name: string;
  phone: string | null;
};

type Order = {
  id: string;
  order_number: string;
  service_type: string;
  package_tier: string | null;
  game_title: string;
  game_genre: string | null;
  store_url_android: string | null;
  target_market: string | null;
  core_features: string | null;
  additional_notes: string | null;
  status: OrderStatus;
  price_krw: number | null;
  payment_status: string | null;
  payment_memo: string | null;
  due_date: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  created_at: string;
  customers: Customer | Customer[] | null;
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const admin = createAdminClient();

  const { data: order, error } = await admin
    .from("orders")
    .select(
      `
      id, order_number, service_type, package_tier, game_title, game_genre,
      store_url_android, target_market, core_features, additional_notes,
      status, price_krw, payment_status, payment_memo,
      due_date, delivered_at, completed_at, created_at,
      customers(id, name, email, studio_name, phone)
    `
    )
    .eq("id", orderId)
    .maybeSingle<Order>();

  if (error) {
    return (
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            주문 조회 실패: {error.message}
          </div>
        </div>
      </section>
    );
  }
  if (!order) notFound();

  // 최신 ASO 분석 결과 조회
  const { data: latestAnalysis } = await admin
    .from("deliverables")
    .select("id, content, generated_at, version")
    .eq("order_id", orderId)
    .eq("type", "aso_analysis_report")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const asoResult = latestAnalysis?.content as AsoResult | undefined;

  // 최신 스크린샷 세트 존재 여부
  const { data: latestScreenshots } = await admin
    .from("deliverables")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "aso_screenshots")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasScreenshots = !!latestScreenshots;

  // 최신 업로드 가이드 존재 여부 (Judge=insufficient 분기 결과물)
  const { data: latestGuide } = await admin
    .from("deliverables")
    .select("id")
    .eq("order_id", orderId)
    .eq("type", "upload_materials_guide")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const hasGuide = !!latestGuide;

  const customer = Array.isArray(order.customers)
    ? order.customers[0]
    : order.customers;
  const markets =
    order.target_market?.split(",").filter(Boolean).map((m) => m.trim()) ?? [];

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 헤더 */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-xs text-muted hover:text-foreground transition"
          >
            ← 주문 목록
          </Link>
          <div className="mt-2 flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono">{order.order_number}</h1>
            <OrderStatusBadge status={order.status} />
            {order.payment_status !== "paid" && (
              <span className="text-xs px-2 py-0.5 rounded border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
                결제: {order.payment_status}
              </span>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 왼쪽 2/3: 상세 정보 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 고객 정보 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">고객 정보</h2>
              <dl className="text-sm space-y-2">
                <div className="flex gap-3">
                  <dt className="w-24 text-muted">스튜디오</dt>
                  <dd>{customer?.studio_name ?? "-"}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted">담당자</dt>
                  <dd>{customer?.name ?? "-"}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted">이메일</dt>
                  <dd>
                    <a
                      href={`mailto:${customer?.email}`}
                      className="text-accent-light hover:underline"
                    >
                      {customer?.email}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted">전화</dt>
                  <dd>{customer?.phone ?? "-"}</dd>
                </div>
              </dl>
            </div>

            {/* 게임 정보 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">게임 정보</h2>
              <dl className="text-sm space-y-2">
                <div className="flex gap-3">
                  <dt className="w-24 text-muted shrink-0">제목</dt>
                  <dd className="font-medium">{order.game_title}</dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted shrink-0">장르</dt>
                  <dd>
                    {GENRE_LABEL[order.game_genre ?? ""] ?? order.game_genre ?? "-"}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted shrink-0">타겟 시장</dt>
                  <dd className="flex flex-wrap gap-1">
                    {markets.length > 0
                      ? markets.map((m) => (
                          <span
                            key={m}
                            className="px-2 py-0.5 rounded bg-accent/10 text-accent-light text-xs"
                          >
                            {MARKET_LABEL[m] ?? m}
                          </span>
                        ))
                      : "-"}
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 text-muted shrink-0">스토어 URL</dt>
                  <dd>
                    {order.store_url_android ? (
                      <a
                        href={order.store_url_android}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent-light hover:underline break-all text-xs"
                      >
                        {order.store_url_android}
                      </a>
                    ) : (
                      <span className="text-muted">-</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* 핵심 특징 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">핵심 특징 / 소개문</h2>
              <pre className="text-sm text-muted whitespace-pre-wrap font-sans leading-relaxed">
                {order.core_features ?? "-"}
              </pre>
            </div>

            {/* 추가 메모 */}
            {order.additional_notes && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-3">추가 메모</h2>
                <pre className="text-sm text-muted whitespace-pre-wrap font-sans leading-relaxed">
                  {order.additional_notes}
                </pre>
              </div>
            )}

            {/* 업로드된 자료 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-4">업로드된 자료</h2>
              <FilesList orderId={order.id} />
            </div>

            {/* AI 분석 결과 */}
            {asoResult && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">ASO 분석 결과</h2>
                <AsoResultView
                  result={asoResult}
                  generatedAt={latestAnalysis!.generated_at}
                  version={latestAnalysis!.version}
                />
              </div>
            )}

            {/* 업로드 자료 보완 가이드 (Judge=insufficient 결과) */}
            {hasGuide && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">
                  업로드 자료 보완 가이드
                </h2>
                <UploadGuideView orderId={order.id} />
              </div>
            )}

            {/* 생성된 스토어 스크린샷 */}
            {hasScreenshots && (
              <div className="bg-surface border border-border rounded-xl p-5">
                <h2 className="font-semibold mb-4">
                  생성된 스토어 스크린샷 (PNG)
                </h2>
                <GeneratedScreenshotsView orderId={order.id} />
              </div>
            )}
          </div>

          {/* 오른쪽 1/3: 상태/결제/타임스탬프 */}
          <div className="space-y-6">
            {/* AI 분석 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-2">ASO 분석</h2>
              <p className="text-xs text-muted mb-4">
                Opus 4.6 + 경쟁작 + Vision
              </p>
              <RunAnalysisButton
                orderId={order.id}
                hasExistingResult={!!asoResult}
              />
            </div>

            {/* 스크린샷 제작 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-2">스크린샷 제작</h2>
              <p className="text-xs text-muted mb-4">
                자료 평가 → 충분하면 PNG 제작, 부족하면 보완 가이드 생성
              </p>
              <GenerateScreenshotsButton
                orderId={order.id}
                hasAnalysis={!!asoResult}
                hasExistingScreenshots={hasScreenshots}
                hasExistingGuide={hasGuide}
              />
            </div>

            {/* 상태 액션 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-4">상태 변경</h2>
              <StatusActions
                orderId={order.id}
                currentStatus={order.status}
                currentPaymentStatus={order.payment_status}
              />
            </div>

            {/* 결제 정보 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">결제</h2>
              <dl className="text-sm space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted">금액</dt>
                  <dd className="font-semibold">{formatKRW(order.price_krw)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">패키지</dt>
                  <dd className="text-xs">{order.package_tier ?? "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">상태</dt>
                  <dd className="text-xs">{order.payment_status ?? "-"}</dd>
                </div>
                {order.payment_memo && (
                  <div className="pt-2 border-t border-border">
                    <dt className="text-xs text-muted mb-1">메모</dt>
                    <dd className="text-xs">{order.payment_memo}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* 타임라인 */}
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="font-semibold mb-3">타임라인</h2>
              <dl className="text-xs space-y-2">
                <div className="flex justify-between">
                  <dt className="text-muted">접수</dt>
                  <dd>{formatDate(order.created_at)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">납기 예정</dt>
                  <dd>{formatDate(order.due_date)}</dd>
                </div>
                {order.delivered_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted">전달</dt>
                    <dd>{formatDate(order.delivered_at)}</dd>
                  </div>
                )}
                {order.completed_at && (
                  <div className="flex justify-between">
                    <dt className="text-muted">종결</dt>
                    <dd>{formatDate(order.completed_at)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
