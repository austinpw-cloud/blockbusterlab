/**
 * 신청 폼 — 게임 정보 섹션.
 */

import { FormField } from "@/components/ui/FormField";
import { TextInput } from "@/components/ui/TextInput";
import { Select } from "@/components/ui/Select";
import { TagSelector } from "@/components/ui/TagSelector";
import { GAME_GENRES, TARGET_MARKETS } from "@/lib/aso/constants";

export type GameInfoValues = {
  game_title: string;
  game_genre: string;
  store_url_android: string;
  store_url_apple: string;
  target_markets: string[];
};

type Props = {
  values: GameInfoValues;
  onChange: (changes: Partial<GameInfoValues>) => void;
};

export function GameInfoSection({ values, onChange }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">② 게임 정보</h3>

      <FormField label="게임 제목" required>
        <TextInput
          required
          value={values.game_title}
          onChange={(e) => onChange({ game_title: e.target.value })}
          placeholder="예: 32용사키우기"
        />
      </FormField>

      <FormField
        label="Google Play 스토어 URL"
        helper="이미 출시된 게임이라면 URL만 입력해도 자동으로 자료를 수집합니다. 출시 전이면 비워두세요."
      >
        <TextInput
          type="url"
          value={values.store_url_android}
          onChange={(e) => onChange({ store_url_android: e.target.value })}
          placeholder="https://play.google.com/store/apps/details?id=..."
        />
      </FormField>

      <FormField
        label="Apple App Store URL"
        helper="iOS 에 출시된 경우 입력하시면 메타데이터·스크린샷을 자동 수집합니다. Google Play URL 과 둘 중 하나 또는 둘 다 가능."
      >
        <TextInput
          type="url"
          value={values.store_url_apple}
          onChange={(e) => onChange({ store_url_apple: e.target.value })}
          placeholder="https://apps.apple.com/kr/app/.../id..."
        />
      </FormField>

      <div className="grid sm:grid-cols-2 gap-4">
        <FormField label="장르" required>
          <Select
            required
            value={values.game_genre}
            onChange={(e) => onChange({ game_genre: e.target.value })}
          >
            <option value="">선택해 주세요</option>
            {GAME_GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField
          label="타겟 시장"
          required
          helper="여러 개 선택 가능"
        >
          <TagSelector
            options={[...TARGET_MARKETS]}
            value={values.target_markets}
            onChange={(next) => onChange({ target_markets: next })}
            multi
          />
        </FormField>
      </div>
    </div>
  );
}
