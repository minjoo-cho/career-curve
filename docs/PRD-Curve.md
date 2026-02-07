# 커브 (Curve) - Product Requirements Document v2.0

## 1. 제품 개요

### 1.1 제품명
**커브 (Curve)** - 이직 준비 올인원 플랫폼

### 1.2 슬로건
"커브 | 커리어를 쉽고, 효과적으로" (Curve | Careers, easily and effectively)

### 1.3 비전
구직자가 체계적으로 이직을 준비하고, AI 기반 맞춤 이력서를 생성하며, 지원 현황을 효율적으로 관리할 수 있는 모바일 퍼스트 웹 애플리케이션

### 1.4 타겟 사용자
- 경력직 이직 준비생
- 적극적인 구직 활동 중인 직장인
- 다수의 채용공고를 동시에 관리해야 하는 사용자

---

## 2. 핵심 기능

### 2.1 목표 설정 (Goals Tab)
- **이직 목표 수립**: 이직 이유, 커리어 패스, 검색 기간 설정
- **회사 평가 기준 5가지 설정**: 가중치 및 세부 설명 포함한 개인화된 평가 기준
- **목표 기록 관리**: 시작일/종료일, 결과 기록
- **이전 기록 조회**: 과거 이직 시도 이력 보관
- **목표 삭제**: 진행 중인 목표 삭제 가능

### 2.2 채팅 (Chat Tab)
- **공고 URL 분석**: LinkedIn, 채용사이트, 회사 커리어 페이지 URL 입력 시 AI가 자동 파싱
- **공고 정보 추출**: 회사명, 포지션, 경력요건, 근무형태, 위치, 비자지원 여부
- **핵심 역량 5가지 추출**: 채용담당자 관점에서 중요한 역량 AI 분석
- **중복 URL 감지**: 기존 등록된 공고 재등록 방지
- **공고 언어 자동 감지**: 국문/영문 공고 자동 식별

### 2.3 보드 (Board Tab)
- **칸반 보기**: 지원검토 → 서류지원 → 인터뷰 → 오퍼 → 합격-최종
- **상태 선택 순서**: 지원검토 → 서류지원 → 인터뷰 → 오퍼 → 불합격-서류 → 불합격-인터뷰 → 합격-최종 → 공고마감
- **테이블 보기**: 스프레드시트 형태의 공고 리스트
- **드래그앤드롭**: 상태 변경을 위한 직관적 UX
- **스크롤 화살표**: 좌우 스크롤 가능 표시 및 네비게이션
- **필터링**: 최소 경력, 근무 형태, 위치 기준 필터 (localStorage 저장으로 지속성 유지)
- **정렬**: 추천순(상대적 우선순위 기반), 최신순, 회사명순
- **수동 공고 추가**: URL 없이 회사명/포지션만으로 직접 공고 등록
- **사용자 정의 상태**: 보드 내에서 커스텀 상태 추가/관리 가능

### 2.4 공고 상세
- **AI 요약**: 공고 핵심 내용 요약
- **공고 언어 배지**: 🇰🇷 국문 / 🇺🇸 영문 표시
- **최소 경력 조건 검토**: AI가 최소 경력 요건 충족 여부 판단 (충족/미충족/판단 불가)
- **우선순위 관리**: 1~5 순위, 모든 공고 점수의 상대적 비교로 자동 계산
- **회사 평가**: 목표에서 설정한 5가지 기준으로 별점 평가 (0점 가능, 세부 설명 표시)
- **적합도 평가**: AI가 내 경험 기반 핵심 역량별 적합도 분석 (엄격한 평가 기준)
- **맞춤 이력서 생성**: 공고별 최적화된 이력서 AI 생성 (모두 선택/해제 옵션)

### 2.5 경력 (Career Tab)
- **이력서 업로드**: PDF 업로드 → AI 파싱 (OCR 지원) → 경험 자동 추출
- **경력 관리**: 직접 추가/수정/삭제, 기간 정보 포함
- **프로젝트 관리**: Selected Projects 섹션 ("그 외" 카테고리)
- **공고별 이력서**: 생성된 맞춤 이력서 저장/미리보기/편집/다운로드
- **AI 피드백 시각화**: RevisionCards 형태로 원문/수정안/근거 3단 비교
- **이력서 내보내기**: DOCX 형식 추출
- **자동 저장**: 맞춤 이력서 생성 완료 시 자동으로 경력 탭에 저장

### 2.6 설정 (Settings Tab)
- **요약 대시보드**: 이직 여정 일수, 지원/인터뷰 현황
- **언어 설정**: 한국어/영어 전환 (전체 UI 즉시 반영)
- **계정 관리**: 한글명/영문명 수정
- **비밀번호 변경**: 이메일 링크를 통한 재설정
- **계정 삭제**: 완전 삭제 (auth.users 포함)
- **이용약관/개인정보처리방침**: 법적 문서 제공
- **로그아웃**

---

## 3. 다국어 지원 (Localization)

### 3.1 지원 언어
- 한국어 (기본)
- English

### 3.2 번역 범위
- 네비게이션 라벨
- 페이지 헤더 및 서브타이틀
- 상태 라벨 (지원검토 → Reviewing 등)
- 버튼, 플레이스홀더, 에러 메시지
- AI 피드백 (공고 언어에 따름, 단 '종합 의견'은 국문 고정)

---

## 4. 기술 스택

### 4.1 프론트엔드
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS + shadcn/ui
- Zustand (상태관리, localStorage 기반 사용자별 데이터 영속성)
- React Router (라우팅)

### 4.2 백엔드
- Supabase (Lovable Cloud)
  - PostgreSQL Database
  - Edge Functions (Deno)
  - Authentication (이메일 인증)
  - Row Level Security
  - Storage (이력서 파일)

### 4.3 AI 통합
- Lovable AI Gateway
  - google/gemini-2.5-flash (기본 모델)
  - 공고 분석 (analyze-job)
  - 이력서 파싱 (parse-resume)
  - 맞춤 이력서 생성 (generate-resume)
  - 적합도 평가 (evaluate-fit) - 최소 경력 조건 포함

### 4.4 외부 연동
- Firecrawl API (웹 스크래핑)

---

## 5. 데이터 모델

### 5.1 주요 테이블 (Supabase)
| 테이블명 | 설명 |
|---------|------|
| profiles | 사용자 프로필 (user_id, name_ko, name_en) |
| job_postings | 채용공고 (회사명, 포지션, 상태, 우선순위, 핵심역량 등) |
| experiences | 경력/프로젝트 (type, title, company, period, bullets) |
| tailored_resumes | 공고별 맞춤 이력서 (content, aiFeedback, language) |
| career_goals | 이직 목표 (reason, companyEvalCriteria, startDate, endDate) |
| chat_messages | 채팅 기록 |
| custom_statuses | 사용자 정의 상태 (name, color, sortOrder) |
| user_subscriptions | 구독/크레딧 정보 |
| resumes | 업로드된 이력서 파일 메타데이터 |

### 5.2 주요 엔티티 필드
- **JobPosting**: minimumRequirementsCheck (AI 최소 조건 검토), companyCriteriaScores (회사 평가), keyCompetencies (핵심 역량), language (공고 언어)
- **TailoredResume**: content (이력서 본문), aiFeedback (AI 피드백), language (생성 언어)
- **CareerGoal**: companyEvalCriteria (회사 평가 기준 배열), result (목표 결과)

---

## 6. 사용자 플로우

```
1. 회원가입/로그인 (이메일 인증)
     ↓
2. 이직 목표 설정 (Goals)
     ↓
3. 이력서 업로드 (Career)
     ↓
4. 채용공고 URL 입력 (Chat) 또는 수동 추가 (Board)
     ↓
5. 공고 분석 및 보드 등록
     ↓
6. 최소 경력 조건 검토 & 핵심 역량 평가 (Board → Detail)
     ↓
7. 회사 평가 & 상대적 우선순위 자동 계산
     ↓
8. 맞춤 이력서 생성 (공고 언어에 맞게)
     ↓
9. 경력 탭에서 AI 피드백 확인 및 이력서 다운로드
     ↓
10. 지원 및 상태 관리 (드래그앤드롭)
```

---

## 7. 주요 Edge Functions

| 함수명 | 설명 |
|--------|------|
| analyze-job | 공고 URL 분석 및 정보 추출 (언어 감지 포함) |
| parse-resume | 이력서 PDF 파싱 (텍스트/OCR) |
| generate-resume | 공고별 맞춤 이력서 생성 (공고 언어로 생성) |
| evaluate-fit | 핵심 역량 적합도 + 최소 경력 조건 평가 |
| delete-account | 계정 완전 삭제 |
| admin-users | 관리자용 사용자 관리 |

---

## 8. 보안 및 인증

### 8.1 인증 체계
- 이메일/비밀번호 기반 회원가입
- 이메일 인증 필수
- Row Level Security (RLS) 적용으로 사용자별 데이터 격리

### 8.2 어뷰징 방지
- 디바이스 지문(Fingerprinting) 수집
- 관리자용 사용자 관리/크레딧 조정 기능

---

## 9. 향후 로드맵

### Phase 2
- 소셜 로그인 (Google, Apple)
- 실시간 동기화 (Supabase Realtime)
- 푸시 알림 (면접 일정, 마감일)
- 전화번호 인증 (SMS)

### Phase 3
- 팀 협업 기능
- 기업 리뷰 통합 (Glassdoor, Blind)
- 면접 준비 AI 코칭
- 채용 트렌드 분석

---

## 10. 성공 지표 (KPIs)

- DAU/MAU 비율
- 공고 등록 수 / 사용자
- 맞춤 이력서 생성 횟수
- 지원 → 인터뷰 전환율 추적
- 사용자 리텐션율

---

*문서 작성일: 2025-12-25*
*최종 수정일: 2026-02-07*
*버전: 2.0*
