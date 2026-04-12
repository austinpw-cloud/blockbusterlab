/**
 * 신청 폼 — 추가 메모 섹션.
 */

import { FormField } from "@/components/ui/FormField";
import { TextArea } from "@/components/ui/TextArea";

export type NotesValues = {
  emphasis_notes: string;
  avoid_notes: string;
};

type Props = {
  values: NotesValues;
  onChange: (changes: Partial<NotesValues>) => void;
};

export function NotesSection({ values, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">⑤ 추가 메모 (선택)</h3>

      <FormField
        label="강조하고 싶은 포인트"
        helper="결과물에 반영되었으면 하는 방향성"
      >
        <TextArea
          rows={3}
          value={values.emphasis_notes}
          onChange={(e) => onChange({ emphasis_notes: e.target.value })}
          placeholder="예: 방치형 RPG의 편의성을 강조하고 싶습니다"
        />
      </FormField>

      <FormField
        label="피하고 싶은 방향"
        helper="결과물에 포함되지 않았으면 하는 요소"
      >
        <TextArea
          rows={3}
          value={values.avoid_notes}
          onChange={(e) => onChange({ avoid_notes: e.target.value })}
          placeholder="예: 과금 유도 문구는 피해 주세요"
        />
      </FormField>
    </div>
  );
}
