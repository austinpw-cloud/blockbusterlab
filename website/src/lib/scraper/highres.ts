/**
 * Google Play CDN 이미지 URL을 고해상도로 변환.
 *
 * Google usercontent CDN URL은 경로 마지막 세그먼트에 `=w2400` 같은
 * 파라미터를 붙여 원하는 해상도를 요청할 수 있다. 기본값 없이 오면
 * 저해상도(~512px)를 리턴하기 때문에 스크린샷 품질이 떨어진다.
 *
 * 사용:
 *   toHighResUrl("https://play-lh.googleusercontent.com/ABC")
 *   → "https://play-lh.googleusercontent.com/ABC=w2400"
 *
 *   toHighResUrl("https://play-lh.googleusercontent.com/ABC=h310")
 *   → "https://play-lh.googleusercontent.com/ABC=w2400"
 */

const DEFAULT_WIDTH = 2400;

export function toHighResUrl(url: string, width = DEFAULT_WIDTH): string {
  if (!url) return url;
  if (!url.includes("googleusercontent.com")) return url;

  // 쿼리스트링(?) 및 해시(#) 는 분리 후 path 부분만 처리
  let path = url;
  let search = "";
  let hash = "";

  const hashIdx = path.indexOf("#");
  if (hashIdx >= 0) {
    hash = path.slice(hashIdx);
    path = path.slice(0, hashIdx);
  }
  const queryIdx = path.indexOf("?");
  if (queryIdx >= 0) {
    search = path.slice(queryIdx);
    path = path.slice(0, queryIdx);
  }

  const lastSlash = path.lastIndexOf("/");
  if (lastSlash < 0) return url;

  const prefix = path.slice(0, lastSlash + 1);
  const segment = path.slice(lastSlash + 1);

  // 마지막 path 세그먼트의 "=" 이후는 기존 사이즈 파라미터로 간주하고 제거.
  // 쿼리스트링은 이미 분리됐으므로 오염되지 않음.
  const eqIdx = segment.indexOf("=");
  const cleanSegment = eqIdx >= 0 ? segment.slice(0, eqIdx) : segment;

  return `${prefix}${cleanSegment}=w${width}${search}${hash}`;
}

export function toHighResUrls(urls: string[], width = DEFAULT_WIDTH): string[] {
  return urls.map((u) => toHighResUrl(u, width));
}
