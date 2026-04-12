/**
 * Pill 스타일 다중 선택 컴포넌트.
 * 체크박스 대신 시각적으로 더 깔끔한 선택 UX.
 *
 * 사용 예:
 *   const [selected, setSelected] = useState<string[]>([]);
 *   <TagSelector
 *     options={[{ id: "kr", label: "한국" }, ...]}
 *     value={selected}
 *     onChange={setSelected}
 *     multi
 *   />
 */

"use client";

type Option = {
  id: string;
  label: string;
};

type Props = {
  options: Option[];
  value: string[];
  onChange: (next: string[]) => void;
  multi?: boolean;
};

export function TagSelector({ options, value, onChange, multi = true }: Props) {
  function toggle(id: string) {
    if (multi) {
      onChange(
        value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
      );
    } else {
      onChange(value.includes(id) ? [] : [id]);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = value.includes(opt.id);
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => toggle(opt.id)}
            className={`px-4 py-2 text-sm rounded-lg border transition ${
              isSelected
                ? "border-accent bg-accent/20 text-accent-light"
                : "border-border text-muted hover:border-accent-light"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
