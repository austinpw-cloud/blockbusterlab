/**
 * Composite 렌더러 — 게임 스크린샷 원본(배경) + AI 생성 오버레이(레이어).
 *
 * 핵심 원칙 (feedback_screenshot_architecture):
 *   - 게임 스크린샷은 1080×1920 캔버스 전체 배경으로 배치 (변형/리사이즈/크롭 금지).
 *   - 오버레이는 부분 레이어로만 존재. AI는 오버레이 HTML/CSS만 생성한다.
 *   - 오버레이 없는 슬롯도 허용 (원본이 매력적이면 그대로 노출).
 *
 * 입력:
 *   - background_image_url: 게임 스크린샷 signed URL (또는 공개 URL)
 *   - overlay_html: AI가 생성한 오버레이 루트 div 1개
 *   - overlay_css: 오버레이 스코프 CSS (셀렉터는 .s{slot} 접두사 권장)
 *
 * 출력: 1080×1920 PNG Buffer.
 */

import "server-only";
import { renderHtmlToPng } from "./renderer";

/**
 * 오버레이 HTML 에서 금지 태그를 제거해 "게임 원본 보존" 원칙을 렌더 레벨에서 보장.
 *
 * AI 프롬프트에 '<img> 금지'를 명시해도 가끔 위반하므로 방어적으로 삭제.
 * 금지 대상:
 *   - <img> : 배경 이미지가 이미 composite 루트에 배치됨. 오버레이에 추가 이미지 금지.
 *   - <iframe>, <embed>, <object> : 외부 자원 렌더
 *   - <video>, <audio>, <source>, <track> : 미디어
 *   - <script>, <link> : 외부 스크립트/스타일시트
 */
function sanitizeOverlayHtml(html: string): { html: string; stripped: string[] } {
  if (!html) return { html: "", stripped: [] };
  const stripped: string[] = [];

  // 여는 태그부터 닫는 태그까지 또는 self-closing 모두 제거.
  const forbidden = [
    "img",
    "iframe",
    "embed",
    "object",
    "video",
    "audio",
    "source",
    "track",
    "script",
    "link",
  ];

  let cleaned = html;
  for (const tag of forbidden) {
    // <tag ...>...</tag>  또는 <tag ... />  또는 <tag ...>
    const pairRe = new RegExp(
      `<\\s*${tag}\\b[^>]*>(?:[\\s\\S]*?<\\s*/\\s*${tag}\\s*>)?`,
      "gi"
    );
    const before = cleaned;
    cleaned = cleaned.replace(pairRe, "");
    if (before !== cleaned) stripped.push(tag);

    // self-closing / void
    const voidRe = new RegExp(`<\\s*${tag}\\b[^>]*/?\\s*>`, "gi");
    const before2 = cleaned;
    cleaned = cleaned.replace(voidRe, "");
    if (before2 !== cleaned && !stripped.includes(tag)) stripped.push(tag);
  }

  // CSS 내 url(...) 로 외부 이미지 로드도 차단
  cleaned = cleaned.replace(
    /url\(\s*["']?(https?:|data:image|\/\/)[^)"']*["']?\s*\)/gi,
    () => {
      if (!stripped.includes("css-url")) stripped.push("css-url");
      return "url(none)";
    }
  );

  return { html: cleaned, stripped };
}

export type CompositeSlotInput = {
  slot: number;
  background_image_url: string;
  overlay?: {
    html: string;
    css: string;
  };
};

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;

/**
 * 단일 슬롯 composite HTML 조립.
 *
 * Root 구조:
 *   <html>
 *     <head>… 폰트/리셋 CSS + 오버레이 CSS …</head>
 *     <body>
 *       <div class="canvas">
 *         <img class="bg" src="..." />
 *         <div class="overlay-root">… ai overlay html …</div>
 *       </div>
 *     </body>
 *   </html>
 */
export function buildCompositeHtml(input: CompositeSlotInput): string {
  const { html: overlayHtml, stripped } = sanitizeOverlayHtml(
    input.overlay?.html ?? ""
  );
  const { html: overlayCss } = sanitizeOverlayHtml(input.overlay?.css ?? "");

  if (stripped.length > 0) {
    console.warn(
      `[composite-renderer] slot ${input.slot} — 금지 요소 제거: ${stripped.join(", ")}`
    );
  }

  const baseCss = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${CANVAS_WIDTH}px; height: ${CANVAS_HEIGHT}px; overflow: hidden; }
    body {
      font-family: 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      background: #000;
    }
    .canvas {
      position: relative;
      width: ${CANVAS_WIDTH}px;
      height: ${CANVAS_HEIGHT}px;
      overflow: hidden;
    }
    /* 게임 스크린샷은 변형 없이 전체 캔버스 배경으로. */
    .canvas > img.bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
      z-index: 1;
    }
    /* 오버레이 레이어는 배경 위. absolute positioning 자유. */
    .canvas > .overlay-root {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      pointer-events: none;
    }
  `;

  // Pretendard CDN (웹폰트)
  const fontLink = `
    <link rel="preconnect" href="https://cdn.jsdelivr.net" />
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
    />
  `;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  ${fontLink}
  <style>${baseCss}</style>
  <style>${overlayCss}</style>
</head>
<body>
  <div class="canvas">
    <img class="bg" src="${escapeAttr(input.background_image_url)}" alt="" />
    <div class="overlay-root">${overlayHtml}</div>
  </div>
</body>
</html>`;
}

/**
 * 단일 composite 렌더링.
 */
export async function renderCompositeSlot(
  input: CompositeSlotInput
): Promise<Buffer> {
  const html = buildCompositeHtml(input);
  return renderHtmlToPng(html);
}

/**
 * 여러 composite 슬롯 병렬 렌더링.
 */
export async function renderCompositeBatch(
  inputs: CompositeSlotInput[]
): Promise<Buffer[]> {
  const CONCURRENCY = 3;
  const results: Buffer[] = new Array(inputs.length);

  for (let i = 0; i < inputs.length; i += CONCURRENCY) {
    const batch = inputs.slice(i, i + CONCURRENCY);
    const buffers = await Promise.all(batch.map(renderCompositeSlot));
    for (let j = 0; j < buffers.length; j++) {
      results[i + j] = buffers[j];
    }
  }

  return results;
}

/**
 * HTML attribute 안전 이스케이프 (URL에 " 등이 있을 때 대비).
 */
function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
