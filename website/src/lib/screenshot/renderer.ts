/**
 * Puppeteer 기반 HTML → PNG 렌더러.
 *
 * 로컬 개발 전용 (puppeteer 사용).
 * 나중에 Vercel로 옮기면 @sparticuz/chromium 으로 교체 필요.
 */

import "server-only";
import puppeteer, { type Browser } from "puppeteer";

const VIEWPORT = { width: 1080, height: 1920 };

let _browser: Browser | null = null;

/**
 * 브라우저 인스턴스 재사용 (여러 슬롯을 동시에 렌더링 시 효율적).
 * 프로세스 종료 시까지 유지.
 */
async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) return _browser;
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });
  return _browser;
}

/**
 * 임의 HTML 문자열을 1080×1920 PNG로 렌더링.
 * composite-renderer 가 조립한 완성 HTML을 입력 받음.
 */
export async function renderHtmlToPng(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setViewport({
      width: VIEWPORT.width,
      height: VIEWPORT.height,
      deviceScaleFactor: 1,
    });

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 이미지 모두 로드 대기 (10초 최대)
    await page.evaluate(async () => {
      const imgs = Array.from(document.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise<void>((resolve) => {
            const done = () => resolve();
            img.addEventListener("load", done, { once: true });
            img.addEventListener("error", done, { once: true });
            setTimeout(done, 10000);
          });
        })
      );
    });

    // 폰트 로딩 대기 (Pretendard CDN)
    await page.evaluate(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (document as any).fonts?.ready ?? Promise.resolve()
    );

    // 렌더 안정화
    await new Promise((r) => setTimeout(r, 200));

    const buffer = (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    })) as Buffer;

    return buffer;
  } finally {
    await page.close();
  }
}

/**
 * 여러 완성 HTML을 병렬 렌더링.
 */
export async function renderHtmlBatch(htmls: string[]): Promise<Buffer[]> {
  const CONCURRENCY = 3;
  const results: Buffer[] = new Array(htmls.length);

  for (let i = 0; i < htmls.length; i += CONCURRENCY) {
    const batch = htmls.slice(i, i + CONCURRENCY);
    const buffers = await Promise.all(batch.map(renderHtmlToPng));
    for (let j = 0; j < buffers.length; j++) {
      results[i + j] = buffers[j];
    }
  }

  return results;
}

/**
 * 프로세스 종료 전 브라우저 정리.
 * Next.js dev 서버에서는 자연스럽게 GC됨.
 */
export async function closeBrowser(): Promise<void> {
  if (_browser) {
    await _browser.close();
    _browser = null;
  }
}
