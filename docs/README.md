# indiegame.com 프로젝트 문서

인디게임닷컴의 인디게임 개발자 지원 자동화 서비스(blockbusterlab) 프로젝트 문서.

## 프로젝트 기획·상태

| 문서 | 설명 |
|------|------|
| [01-프로젝트 개요](./01-project-overview.md) | 비전, 서비스 구성, 타겟, 비즈니스 모델 |
| [02-현재 상태](./02-current-state.md) | 구현 현황, 기술 스택, Stage 완료 상황 |
| [03-Phase 2·3 서비스 설계](./03-service-design.md) | 보도자료·번역 서비스 (Phase 2·3 대기) |
| [04-기술 아키텍처](./04-technical-architecture.md) | 시스템 구성·API·데이터 흐름 |
| [05-로드맵](./05-roadmap.md) | Phase별 구현 계획 |
| [06-매체 DB](./06-media-database.md) | 보도자료 배포용 매체 리스트 (Phase 2 용) |

## Phase 1 ASO 서비스

| 문서 | 설명 |
|------|------|
| [07-ASO 서비스 스펙 (마스터)](./07-aso-service-spec.md) | Phase 1 ASO 서비스 전체 스펙 (입력·결과물·플로우·운영·가격) |
| [09-DB 스키마](./09-database-schema.md) | DB 개요. 실제 스키마는 `website/supabase/migrations/` 가 Source of Truth |
| [12-Library 분석 설계](./12-library-analysis-design.md) | Reference Library 3층 구조 (관찰·패턴·인사이트) 설계 v2.7 |

## ASO 지식 체계 (`docs/aso/`)

| 문서 | 설명 |
|------|------|
| [aso/README](./aso/README.md) | 폴더 가이드 |
| [aso/knowledge](./aso/knowledge.md) | ASO 지식 본체 — 원리·하드룰·축별 변주·의뢰 적용 |
| [aso/sources](./aso/sources.md) | 인용 외부 자료 인덱스 |
| [aso/raw-notes/](./aso/raw-notes/) | Apple·Google·업계·시장·수익모델 조사 원자료 |
| [aso/99-archived/](./aso/99-archived/) | 기존 ASO 바이블·가이드 (2026-04-13 이전, 참고용) |

## 운영 기록

| 문서 | 설명 |
|------|------|
| [10-진행 로그](./10-progress-log.md) | 실제 개발 진행 기록 (일자별) |
| [11-다음 세션 재개 가이드](./11-next-session-resume.md) | **★ 새 세션 시작 시 여기부터 읽기 ★** |

## 아카이브 (`docs/archived/`)

| 문서 | 설명 |
|------|------|
| [08-개발 착수 마스터 (historical)](./archived/08-pre-development-master.md) | 2026-04-12 개발 착수 전 기준. 최신은 07 참조 |

---

## 참조 관계

```
01 (비전)
 └─ 05 (로드맵)
     ├─ Phase 1 → 07 (ASO 스펙) ──────────┐
     │                                    ├─ 12 (Library 설계)
     │                                    ├─ aso/ (지식 체계)
     │                                    └─ 09 (DB 개요)
     ├─ Phase 2 → 03 (보도자료 설계)
     │             └─ 06 (매체 DB)
     └─ Phase 3 → 03 (번역 설계)

02 (현재 상태) ← 10 (진행 로그) ← 11 (재개 가이드)
04 (기술 아키텍처) — 전체 참조
```
