# 로드맵

> **최종 업데이트**: 2026-04-14 (Step 2 Stage 8 Library 통합 코드 완료)

## 전체 Phase 개요

```
Phase 0: 기반 구축           ✅ 완료
Phase 1: ASO 서비스          🔄 진행 중 (핵심 모듈 완성, Library 실측·통합 대기)
Phase 2: 보도자료 서비스     ⬜ 대기
Phase 3: 번역 서비스         ⬜ 대기
Phase 4: 해외 인디 확장      ⬜ 장기
```

---

## Phase 0: 기반 구축 ✅

- 브랜딩 (blockbusterlab) · 인프라 계정 · DB 스키마 001~003 · Storage · `.env` · Vercel
- 고객 신청 폼 `/apply` + 파일 업로드 + Google Play URL 자동 수집
- 주문 접수 API · Google Play 수집 파이프라인 · 웹사이트 콘텐츠 정직화

---

## Phase 1: ASO 서비스 (진행 중)

### ✅ 완료

- **Stage 6 관리자 백오피스** — 매직 링크 인증 · 주문 목록·상세 · 상태 전환
- **Stage 8 ASO 분석 엔진 v2.2** — Opus + Library 주축·유사 게임 + 경쟁작 실시간 + Vision + 글로벌 프레임 + 축별 변주. Library-first 통합·리뷰 제거 반영. `principles.ts` 와 `docs/aso/knowledge.md` 동기화
- **Stage 9 스크린샷 제작 재설계** — 업로드 자료 평가 → 가이드/제작 분기 → 오버레이 composite 구조
- **ASO 지식 체계** (`docs/aso/`) — knowledge.md · sources.md · raw-notes · archived
- **Reference Library 3층 설계** (`docs/12-library-analysis-design.md` v2.7)
  - 3층 구조 (관찰 · 패턴 · 인사이트), 인사이트는 `library_patterns` JSONB 에 내재화
  - 축 (장르 · 시장 · 수익모델 · 스튜디오 규모) 기반 조합 패턴
  - IP·AAA 퍼블리셔 필터 + IP 프랜차이즈 키워드 필터
  - 평점·리뷰는 ASO 분석과 무관 — 사용 안 함
- **마이그레이션 006** 적용 완료
- **L1 모듈** — `analyze-icon` · `analyze-text` · `analyze` (슬롯)
- **L2 모듈** — `analyze-game` (Opus, ASO 수법 해석)
- **L3 모듈** — `synthesize-patterns` (Opus, Tier A 40조합)
- **오케스트레이터** + API 엔드포인트 (`analyze` · `synthesize` · `patterns`)
- **큐레이션 파이프라인** — 3경로 수집 · IP 필터 · 자동 태깅 · execute 실행 완료 (45/45 수집, case_study 5 공석)

### 🔄 남은 것 (우선순위 순)

#### Step 1 — Library 초기 45개 실측 구축 (타겟 50, case_study 5 공석)
- [x] `/api/dev/reference-library/curate?execute=true` 실행 완료 (45/45, 스크래퍼만, Claude API 비용 $0)
- [ ] `/api/dev/reference-library/analyze?levels=1,2,3` L1~L3 파이프라인 실행 (Opus, ~$37~47)
- [ ] `library_patterns` 조회해 초기 합성 결과 품질 검증

**예상 소요**: 1일

#### Step 2 — Stage 8 Library 통합 ✅ **코드 완료 (2026-04-14), 실동작 검증은 Step 1 L1~L3 실행 후**
- [x] 의뢰 처리 플로우에 Library 조회 단계 추가 (`pattern-query.ts`)
- [x] 경쟁작 Vision 재호출 축소 (Library 주축 있을 때 5→3 축소. Library=장르 기준 · 경쟁작=현재 시장 옆자리)
- [x] 축 조합 fallback 규칙 (specific_4axis → genre_market_monetization → genre_market → genre_only)
- [x] 리뷰·평점 의존 제거 (`includeReviews: false`, why_they_top·community_signals 삭제)

**실측 검증**: Step 1 (L1~L3 실행) 완료 후 측정. 의뢰당 비용 효과 $1.77 → $0.30~0.50 는 Library 주축·유사 게임 실제 반영 후 확인.

#### Step 3 — 온디맨드 확장 + 관리자 승인 UI
- [ ] 의뢰 처리 중 4가지 트리거 (T1~T4) 감지 로직
- [ ] 후보 탐색 → 관리자 승인 큐 UI
- [ ] 승인 시 수집·L1~L2 실행 → `commission_driven` 태깅 저장
- [ ] L3 재합성 트리거 (`pending_commission_insights` 5+)

**예상 소요**: 3~4일

#### Step 4 — 의뢰에서 인사이트 추출·누적 루프
- [ ] 의뢰 처리 후 LLM 이 `commission_derived_insights` 추출
- [ ] 해당 축 조합 `library_patterns` 에 누적
- [ ] 관리자 산출물 품질 평가 UI → `confirmed_by_delivery` 플래그

**예상 소요**: 2일

#### Step 5 — end-to-end 검증 (루노소프트)
- [ ] 루노소프트 6개 게임 중 1개로 전체 플로우
- [ ] 편집장 피드백 수렴·프롬프트 튜닝

**예상 소요**: 1주

#### Step 6 — 보조 기능
- [ ] Stage 7 이메일 알림 (Resend)
- [ ] 고객 대시보드 `/dashboard`
- [ ] 결제 시스템 검토

**예상 소요**: 3~4일

#### Step 7 (선택) — case_study 5개 큐레이션
- [ ] Apptweak·Phiture·Storemaven 블로그에서 ASO 작업 사례로 분석된 게임 5개 수동 선별
- [ ] `CASE_STUDY_APP_IDS` 에 등록 후 재수집

**예상 소요**: 반나절 (리서치 시간)

---

## Phase 2: 보도자료 서비스 (대기)

설계 참조: `03-service-design.md` 서비스 A

### 선행 과제
- [ ] 보도자료 분석 DB (인디게임닷컴 기존 기사 + 업계 레퍼런스)
- [ ] 편집장 스타일 시스템 프롬프트 정제
- [ ] 매체 이메일 DB 완성 (`06-media-database.md` 기반)

### 주요 기능
- [ ] AI 보도자료 초안 생성
- [ ] 한→영 편집 번역
- [ ] 편집장 검수 UI
- [ ] 매체 이메일 자동 배포
- [ ] indiegame.com 자동 게시 (WordPress REST API)
- [ ] 배포 성과 트래킹

---

## Phase 3: 번역 서비스 (대기)

설계 참조: `03-service-design.md` 서비스 B

### 선행 과제
- [ ] 게임 번역 용어/표현 DB 구축
- [ ] 장르별 어체 매핑

### 주요 기능
- [ ] Tier 1 언어 번역 (EN/JP/ZH 우선)
- [ ] 스토어 페이지 번역 + ASO 키워드 반영
- [ ] 인게임 텍스트 번역 (XLSX/JSON/PO 지원)
- [ ] LQA 체크리스트

---

## Phase 4: 해외 인디 확장 (장기)

- [ ] 웹사이트 영문화
- [ ] 결제 수단 해외 대응
- [ ] 해외 인디 커뮤니티 채널
- [ ] 영문 블로그·케이스 스터디

---

## 타임라인 (갱신판)

```
2026-04-12 ~ 04-13  ████████████████  Phase 0 + Phase 1 핵심 모듈 완성
                                       (Stage 6·8·9 · Library 설계·구축)
2026-04-14 ~        ░░░░████          Step 1 Library 실측 50개 구축
                        ░░░░░░████    Step 2 Stage 8 Library 통합
                            ░░░░░░████ Step 3 온디맨드 확장 UI
                                ░░░░██ Step 4 인사이트 누적 루프
                                  ░░██ Step 5 루노소프트 검증
2026-05-06 ~                      ░██ Step 6 보조 기능 (이메일·대시보드)
2026-06 ~                           ░░ Phase 2 보도자료 준비
2026-07 ~                              Phase 2 런칭 + Phase 3 시작
```

---

## 우선순위 원칙

1. **Phase 1 Library 실측·통합이 최우선** — 설계 완성 후 실제 돌려봐야 서비스화
2. **의뢰당 비용 절감(Library 통합) + 지식 누적(commission_driven)** 이 서비스 경제성 핵심
3. **관리자 승인 게이트** 유지 — 자동 무한 확장 금지, 비용·품질 보호
4. **ASO 는 게임성 판단이 아닌 부각 기술** — 평점·리뷰 테마 분석 금지 원칙 유지
5. **IP·AAA 퍼블리셔 게임은 Library 수집 대상 아님** — 분석 가치 낮음 (브랜드 파워로 매출)
