/**
 * 신청 폼 — 핵심 특징 3가지 섹션.
 */

import { FormField } from "@/components/ui/FormField";
import { TextArea } from "@/components/ui/TextArea";

export type FeaturesValues = {
  feature_1: string;
  feature_2: string;
  feature_3: string;
};

type Props = {
  values: FeaturesValues;
  onChange: (changes: Partial<FeaturesValues>) => void;
  /** 스토어 URL이 있으면 자동 수집된 소개문을 활용하므로 선택 */
  storeUrlProvided?: boolean;
};

export function FeaturesSection({ values, onChange, storeUrlProvided }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">
        ③ 게임의 핵심 특징 {storeUrlProvided ? "(선택)" : "3가지"}
      </h3>
      {storeUrlProvided ? (
        <p className="text-sm text-muted -mt-3">
          스토어 소개문을 자동 참고하므로 선택입니다. 강조하고 싶은 포인트가 있다면
          작성해 주세요.
        </p>
      ) : (
        <p className="text-sm text-muted -mt-3">
          경쟁작과 어떻게 다른지, 어떤 점이 특별한지 간결하게 설명해 주세요.
        </p>
      )}

      <FormField label="특징 1" required={!storeUrlProvided}>
        <TextArea
          required={!storeUrlProvided}
          rows={2}
          value={values.feature_1}
          onChange={(e) => onChange({ feature_1: e.target.value })}
          placeholder="예: 매 판 달라지는 던전 구성과 수집 요소"
        />
      </FormField>

      <FormField label="특징 2" required={!storeUrlProvided}>
        <TextArea
          required={!storeUrlProvided}
          rows={2}
          value={values.feature_2}
          onChange={(e) => onChange({ feature_2: e.target.value })}
          placeholder="예: 방치형 플레이에 최적화된 전투 시스템"
        />
      </FormField>

      <FormField label="특징 3" required={!storeUrlProvided}>
        <TextArea
          required={!storeUrlProvided}
          rows={2}
          value={values.feature_3}
          onChange={(e) => onChange({ feature_3: e.target.value })}
          placeholder="예: 친구와 함께하는 길드 레이드 콘텐츠"
        />
      </FormField>
    </div>
  );
}
