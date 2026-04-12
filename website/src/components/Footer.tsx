import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="text-accent-light">blockbuster</span>lab
            </Link>
            <p className="mt-2 text-xs text-accent-light font-medium">
              인디게임닷컴 공식 파트너
            </p>
            <p className="mt-3 text-sm text-muted max-w-sm">
              인디게임의 진실된 파트너.
              보도자료, 번역, ASO까지 한 곳에서.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Services</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/services#press" className="hover:text-foreground transition">
                  보도자료 제작/배포
                </Link>
              </li>
              <li>
                <Link href="/services#translation" className="hover:text-foreground transition">
                  게임 콘텐츠 번역
                </Link>
              </li>
              <li>
                <Link href="/services#aso" className="hover:text-foreground transition">
                  ASO 최적화
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/portfolio" className="hover:text-foreground transition">
                  Portfolio
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/apply" className="hover:text-foreground transition">
                  문의하기
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border text-xs text-muted text-center">
          &copy; 2026 주식회사 블록버스터랩 (BlockbusterLab Inc.). All rights reserved.
        </div>
      </div>
    </footer>
  );
}
