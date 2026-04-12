/**
 * 신청 폼 — 자료 업로드 섹션.
 *
 * 스크린샷 5장 이상 필수.
 * 로고 1장 필수.
 * 기타 자료는 선택.
 */

import { FormField } from "@/components/ui/FormField";
import { FileDropzone } from "@/components/ui/FileDropzone";
import {
  MAX_FILE_SIZE_MB,
  MIN_SCREENSHOT_COUNT,
  MAX_SCREENSHOT_COUNT,
} from "@/lib/aso/schema";

export type FilesValues = {
  screenshots: File[];
  logo: File[];
  other: File[];
};

type Props = {
  values: FilesValues;
  onChange: (changes: Partial<FilesValues>) => void;
  /** 스토어 URL이 입력되면 자동 수집되므로 파일 업로드는 선택으로 전환 */
  storeUrlProvided?: boolean;
};

export function FilesSection({ values, onChange, storeUrlProvided }: Props) {
  return (
    <div className="space-y-5">
      <h3 className="text-lg font-semibold">④ 자료 업로드</h3>
      {storeUrlProvided ? (
        <div className="-mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30 text-sm text-accent-light">
          ✓ 스토어 URL이 입력되어 있어 자료를 <strong>자동으로 수집</strong>합니다.
          <br />
          <span className="text-xs text-muted">
            추가로 제공하고 싶은 자료가 있다면 아래에 업로드해 주세요 (선택).
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted -mt-3">
          스토어 URL이 없는 경우 아래 자료들이 필수입니다. 제공하는 자료가 많을수록
          결과물 품질이 올라갑니다.
        </p>
      )}

      <FormField
        label="원본 스크린샷"
        required={!storeUrlProvided}
        helper={
          storeUrlProvided
            ? "스토어에서 자동 수집됩니다. 추가 제공 가능 (선택)"
            : `최소 ${MIN_SCREENSHOT_COUNT}장, 권장 해상도 1920x1080 이상`
        }
      >
        <FileDropzone
          accept="image/*"
          multiple
          maxFiles={MAX_SCREENSHOT_COUNT}
          maxSizeMB={MAX_FILE_SIZE_MB}
          value={values.screenshots}
          onChange={(files) => onChange({ screenshots: files })}
          hint="게임플레이 캡쳐본"
        />
      </FormField>

      <FormField
        label="게임 로고"
        required={!storeUrlProvided}
        helper={
          storeUrlProvided
            ? "스토어 아이콘이 자동 수집됩니다. 고해상도 원본이 있으면 업로드 (선택)"
            : "고해상도 원본"
        }
      >
        <FileDropzone
          accept="image/*"
          multiple={false}
          maxFiles={1}
          maxSizeMB={MAX_FILE_SIZE_MB}
          value={values.logo}
          onChange={(files) => onChange({ logo: files })}
          hint="PNG/SVG 권장"
        />
      </FormField>

      <FormField
        label="기타 자료 (선택)"
        helper="트레일러, 캐릭터 아트, UI 에셋 등. 많을수록 좋습니다."
      >
        <FileDropzone
          accept="image/*,video/*,application/pdf"
          multiple
          maxFiles={10}
          maxSizeMB={MAX_FILE_SIZE_MB}
          value={values.other}
          onChange={(files) => onChange({ other: files })}
          hint="이미지/영상/PDF"
        />
      </FormField>
    </div>
  );
}
