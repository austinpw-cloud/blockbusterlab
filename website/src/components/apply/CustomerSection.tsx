/**
 * 신청 폼 — 고객 정보 섹션.
 */

import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";

export type CustomerSectionValues = {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  studio_name: string;
};

type Props = {
  values: CustomerSectionValues;
  onChange: (changes: Partial<CustomerSectionValues>) => void;
};

export function CustomerSection({ values, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">① 담당자 정보</h3>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="이름" required>
          <TextInput
            required
            value={values.customer_name}
            onChange={(e) => onChange({ customer_name: e.target.value })}
            placeholder="홍길동"
          />
        </FormField>

        <FormField label="이메일" required helper="결과물 전달에 사용됩니다">
          <TextInput
            required
            type="email"
            value={values.customer_email}
            onChange={(e) => onChange({ customer_email: e.target.value })}
            placeholder="you@studio.com"
          />
        </FormField>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="스튜디오/회사명" required>
          <TextInput
            required
            value={values.studio_name}
            onChange={(e) => onChange({ studio_name: e.target.value })}
            placeholder="루노소프트"
          />
        </FormField>

        <FormField label="전화번호 (선택)">
          <TextInput
            type="tel"
            value={values.customer_phone}
            onChange={(e) => onChange({ customer_phone: e.target.value })}
            placeholder="010-0000-0000"
          />
        </FormField>
      </div>
    </div>
  );
}
