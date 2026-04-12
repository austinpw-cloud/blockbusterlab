/**
 * 주문 상태 관련 공통 정의.
 * 관리자 UI에서 상태별 배지/라벨/다음 단계 표시에 사용.
 */

export type OrderStatus =
  | "pending"
  | "processing"
  | "qc"
  | "delivered"
  | "revision"
  | "completed"
  | "cancelled";

export const STATUS_META: Record<
  OrderStatus,
  { label: string; color: string; description: string }
> = {
  pending: {
    label: "접수됨",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    description: "주문이 막 접수되었습니다. 자료 검토 필요.",
  },
  processing: {
    label: "분석/생성 중",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "내부 분석 및 결과물 생성 진행 중.",
  },
  qc: {
    label: "QC 대기",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    description: "결과물 QC 대기 중.",
  },
  delivered: {
    label: "전달 완료",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    description: "고객에게 결과물 전달됨.",
  },
  revision: {
    label: "수정 중",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    description: "고객 수정 요청 처리 중.",
  },
  completed: {
    label: "종결",
    color: "bg-muted/20 text-muted border-border",
    description: "30일 후속 점검까지 완료됨.",
  },
  cancelled: {
    label: "취소",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    description: "취소된 주문.",
  },
};

export const STATUS_ORDER: OrderStatus[] = [
  "pending",
  "processing",
  "qc",
  "delivered",
  "revision",
  "completed",
  "cancelled",
];

/**
 * 다음으로 전환 가능한 상태들.
 */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "cancelled"],
  processing: ["qc", "cancelled"],
  qc: ["delivered", "processing"],
  delivered: ["revision", "completed"],
  revision: ["qc", "delivered"],
  completed: [],
  cancelled: [],
};
