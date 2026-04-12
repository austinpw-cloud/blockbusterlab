/**
 * 드래그앤드롭 파일 업로드 컴포넌트.
 *
 * - 이미지 미리보기 지원
 * - 파일 개수 / 크기 제한
 * - 삭제 가능
 *
 * 파일 자체는 선택만 하고, 실제 업로드는 폼 제출 시 처리.
 *
 * 사용 예:
 *   const [files, setFiles] = useState<File[]>([]);
 *   <FileDropzone
 *     label="스크린샷"
 *     accept="image/*"
 *     multiple
 *     maxFiles={10}
 *     maxSizeMB={20}
 *     value={files}
 *     onChange={setFiles}
 *   />
 */

"use client";

import { useRef, useState } from "react";

type Props = {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  value: File[];
  onChange: (files: File[]) => void;
  hint?: string;
};

export function FileDropzone({
  accept = "image/*",
  multiple = true,
  maxFiles = 10,
  maxSizeMB = 20,
  value,
  onChange,
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);

  function handleFiles(incoming: FileList | File[]) {
    setSizeError(null);
    const files = Array.from(incoming);
    const maxBytes = maxSizeMB * 1024 * 1024;

    const oversize = files.find((f) => f.size > maxBytes);
    if (oversize) {
      setSizeError(
        `${oversize.name}: ${maxSizeMB}MB 이하 파일만 업로드 가능합니다.`
      );
      return;
    }

    const merged = multiple ? [...value, ...files] : files.slice(0, 1);
    const final = merged.slice(0, maxFiles);
    onChange(final);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function isImage(file: File) {
    return file.type.startsWith("image/");
  }

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={`
          cursor-pointer border-2 border-dashed rounded-lg
          px-6 py-8 text-center transition
          ${isDragging
            ? "border-accent-light bg-accent/10"
            : "border-border hover:border-accent-light"}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = ""; // 같은 파일 재선택 가능하도록
          }}
        />
        <p className="text-sm text-muted">
          <span className="text-accent-light font-medium">클릭</span>하거나 파일을 드래그해서 업로드
        </p>
        {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
        <p className="text-xs text-muted mt-1">
          최대 {maxFiles}개 · 파일당 {maxSizeMB}MB 이하
        </p>
      </div>

      {sizeError && (
        <p className="mt-2 text-xs text-red-400">{sizeError}</p>
      )}

      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 px-3 py-2 bg-background border border-border rounded-lg"
            >
              {isImage(file) && (
                <img
                  src={URL.createObjectURL(file)}
                  alt=""
                  className="w-10 h-10 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{file.name}</p>
                <p className="text-xs text-muted">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="text-muted hover:text-red-400 transition text-sm"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
