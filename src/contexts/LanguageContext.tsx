import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'ko' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation dictionary
const translations: Record<Language, Record<string, string>> = {
  ko: {
    // Navigation
    'nav.board': '보드',
    'nav.chat': '채팅',
    'nav.career': '경력',
    'nav.goals': '목표',
    'nav.settings': '설정',
    
    // Chat Tab
    'chat.title': '채팅',
    'chat.subtitle': '공고를 넣는 순간, 정리가 시작됩니다',
    'chat.placeholder': '공고 링크를 붙여넣으세요. 자동으로 공고를 요약해줍니다',
    'chat.analyzing': '공고를 정리하고 있어요…',
    'chat.addedToBoard': '✅ 보드에 추가됨',
    'chat.analysisFailed': '❌ 공고 분석에 실패했습니다. 링크를 확인하거나 공고 내용을 직접 붙여넣어 주세요.',
    'chat.viewOnBoard': '보드에서 보기',
    'chat.defaultReply': '공고 링크를 붙여넣으시면 자동으로 분석해서 보드에 정리해드릴게요.',
    'chat.notJobUrl.title': '공고가 아닌 링크일 수 있습니다',
    'chat.notJobUrl.desc': '이 링크는 채용 공고가 아닌 것으로 보입니다. 계속 공고 등록을 진행하시겠습니까?',
    'chat.duplicate.title': '이전에 공유한 적 있는 링크입니다',
    'chat.duplicate.desc': '이 링크는 이미 보드에 추가된 공고입니다. 다시 추가하시겠습니까?',
    'chat.noContent.title': '공고 내용을 가져올 수 없습니다',
    'chat.noContent.desc': '해당 페이지가 마감되었거나 접근할 수 없는 상태입니다. 그래도 공고를 추가하고 직접 정보를 입력하시겠습니까?',
    'chat.limit.title': '공고 추가 한도 초과',
    'chat.continue': '계속 진행',
    'chat.add': '추가',
    'chat.manualEntry': '직접 입력하기',
    'chat.cancel': '취소',
    'chat.close': '닫기',
    
    // Board Tab
    'board.title': '공고 관리',
    'board.subtitle': '공고를 한눈에 확인하세요',
    'board.empty': '아직 공고가 없습니다',
    'board.emptyDesc': '채팅 탭에서 공고 링크를 붙여넣어 시작하세요',
    'board.summary': '공고 요약',
    'board.status': '지원 상태',
    'board.priority': '우선순위',
    
    // Career Tab
    'career.title': '경력',
    'career.subtitle': '이력서와 경험을 관리하세요',
    'career.resume': '이력서',
    'career.upload': '업로드 (PDF)',
    'career.preview': '미리보기',
    'career.export': '추출 (DOCX)',
    'career.work': '경력',
    'career.other': '그 외',
    'career.otherDesc': '경력과 별개로 자세히 소개하고 싶은 프로젝트 등을 별도로 자세히 서술해주세요',
    'career.addWork': '경력 추가',
    'career.addOther': '추가',
    'career.tailored': '공고별 이력서',
    'career.analyzing': '분석 중',
    'career.success': '완료',
    'career.fail': '실패',
    
    // Goals Tab
    'goals.title': '커리어 목표',
    'goals.subtitle': '목표를 정하고 기록하세요',
    'goals.newGoal': '새 목표',
    'goals.currentGoal': '현재 목표',
    'goals.period': '목표 기간',
    'goals.days': '일째',
    'goals.reason': '이직 이유',
    'goals.reasonEmpty': '아직 입력되지 않았습니다',
    'goals.result': '결과',
    'goals.criteria': '회사 평가 기준 (우선순위)',
    'goals.edit': '수정',
    'goals.archive': '기록으로',
    'goals.noGoal': '현재 목표 없음',
    'goals.noGoalDesc': '새 목표 버튼을 눌러 시작하세요',
    'goals.history': '이전 기록',
    'goals.noHistory': '아직 기록이 없습니다',
    'goals.startDate': '시작일',
    'goals.endDate': '목표 종료일 (선택)',
    'goals.searchPeriod': '이직 탐색 기간(선택)',
    'goals.careerPath': '커리어 패스',
    'goals.criteriaLabel': '회사 평가 기준 (가중치 클릭으로 조절)',
    'goals.criteriaRequired': '최소 1개 이상의 회사 평가 기준을 입력해주세요.',
    'goals.archiveGoal': '목표 종료하기',
    'goals.resultRecord': '결과 기록',
    'goals.resultRequired': '결과를 입력해주세요.',
    'goals.archiveConfirm': '목표 종료 및 기록으로 이동',
    'goals.save': '저장',
    
    // Settings Tab
    'settings.title': '설정',
    'settings.subtitle': '이직 여정을 한 번에 돌아봅니다',
    'settings.daysSince': '이직 목표 수립 후',
    'settings.applied': '지원',
    'settings.interview': '인터뷰',
    'settings.plan': '요금제',
    'settings.aiCredits': 'AI 크레딧',
    'settings.jobLimit': '공고 제한',
    'settings.unlimited': '무제한',
    'settings.account': '계정',
    'settings.terms': '이용약관',
    'settings.privacy': '개인정보처리방침',
    'settings.language': '언어',
    'settings.languageKo': '한국어',
    'settings.languageEn': 'English',
    'settings.customStatus': '사용자 정의 상태',
    'settings.customStatusDescription': '보드에서 사용할 커스텀 상태를 추가하세요. 기본 상태 외에 자유롭게 추가할 수 있습니다.',
    'settings.newStatusPlaceholder': '새 상태 이름',
    'settings.noCustomStatuses': '추가된 사용자 정의 상태가 없습니다',
    'settings.version': '커브',
    
    // Status labels
    'status.reviewing': '지원검토',
    'status.applied': '서류지원',
    'status.interview': '인터뷰',
    'status.rejected-docs': '불합격-서류',
    'status.rejected-interview': '불합격-인터뷰',
    'status.offer': '오퍼',
    'status.accepted': '합격-최종',
    'status.closed': '공고 마감',
    
    // Resume Builder
    'resume.title': '맞춤 이력서 만들기',
    'resume.languageLabel': '생성 언어',
    'resume.korean': '국문',
    'resume.english': '영문',
    'resume.basedOnPosting': '공고 언어 기반',
    'resume.keyCompetencies': '핵심 역량 기준',
    'resume.keyCompetenciesDesc': 'AI가 아래 역량에 맞게 경험을 최적화합니다.',
    'resume.selectAll': '모두 선택',
    'resume.deselectAll': '모두 해제',
    'resume.workExperience': '경력 (자동 선택됨)',
    'resume.projects': '프로젝트',
    'resume.noExperiences': '경력 탭에서 경험을 먼저 추가해주세요.',
    'resume.completed': '맞춤 이력서 생성 완료',
    'resume.optimizedFor': '포지션에 최적화된 이력서입니다.',
    'resume.copy': '복사',
    'resume.save': '공고별 이력서 저장',
    'resume.regenerate': '다시 생성하기',
    'resume.viewInCareer': '경력 탭에서 보기',
    'resume.paidOnly': '맞춤 이력서 생성은 유료 요금제 전용 기능입니다.',
    'resume.noCredits': '이력서 생성 크레딧이 부족합니다. 요금제를 업그레이드해주세요.',
    'resume.generationTime': '20초 정도 소요됩니다. 화면을 나가도 자동 저장됩니다.',
    'resume.generationTimeAutoSave': '20초 정도 소요됩니다. 화면을 나가도 자동 저장됩니다.',
    'resume.generating': '생성 중... 완료 시 자동 저장됩니다.',
    'resume.generatingAutoSave': '생성 중... 완료 시 자동으로 경력 탭에 저장됩니다.',
    'resume.autoSaved': '맞춤 이력서가 생성되어 자동 저장되었습니다',
    'resume.abort': '중단하기',
    'resume.generate': '맞춤 이력서 생성',
    'resume.copied': '클립보드에 복사되었습니다',
    'resume.saved': '공고별 이력서가 저장되었습니다',
    'resume.generated': '맞춤 이력서가 생성되었습니다',
    'resume.selectAtLeastOne': '최소 1개의 경험을 선택해주세요',
    'resume.aborted': '이력서 생성이 중단되었습니다',
    'resume.generateFailed': '이력서 생성 실패',
    
    // Common
    'common.cancel': '취소',
    'common.save': '저장',
    'common.delete': '삭제',
    'common.edit': '수정',
    'common.add': '추가',
    'common.close': '닫기',
    'common.confirm': '확인',
    'common.loading': '로딩 중...',
  },
  en: {
    // Navigation
    'nav.board': 'Board',
    'nav.chat': 'Chat',
    'nav.career': 'Career',
    'nav.goals': 'Goals',
    'nav.settings': 'Settings',
    
    // Chat Tab
    'chat.title': 'Chat',
    'chat.subtitle': 'Start organizing the moment you paste a job link',
    'chat.placeholder': 'Paste a job link. It will be summarized automatically.',
    'chat.analyzing': 'Analyzing the job posting…',
    'chat.addedToBoard': '✅ Added to board',
    'chat.analysisFailed': '❌ Failed to analyze job posting. Please check the link or paste the job description directly.',
    'chat.viewOnBoard': 'View on board',
    'chat.defaultReply': 'Paste a job link and I\'ll analyze and organize it on your board.',
    'chat.notJobUrl.title': 'This might not be a job posting',
    'chat.notJobUrl.desc': 'This link doesn\'t appear to be a job posting. Do you want to continue?',
    'chat.duplicate.title': 'Previously shared link',
    'chat.duplicate.desc': 'This link is already on your board. Add it again?',
    'chat.noContent.title': 'Unable to fetch job content',
    'chat.noContent.desc': 'The page may be closed or inaccessible. Add the job and enter details manually?',
    'chat.limit.title': 'Job limit exceeded',
    'chat.continue': 'Continue',
    'chat.add': 'Add',
    'chat.manualEntry': 'Enter manually',
    'chat.cancel': 'Cancel',
    'chat.close': 'Close',
    
    // Board Tab
    'board.title': 'Job Board',
    'board.subtitle': 'View all your job postings at a glance',
    'board.empty': 'No job postings yet',
    'board.emptyDesc': 'Paste a job link in the Chat tab to get started',
    'board.summary': 'Job Summary',
    'board.status': 'Application Status',
    'board.priority': 'Priority',
    
    // Career Tab
    'career.title': 'Career',
    'career.subtitle': 'Manage your resume and experiences',
    'career.resume': 'Resume',
    'career.upload': 'Upload (PDF)',
    'career.preview': 'Preview',
    'career.export': 'Export (DOCX)',
    'career.work': 'Work Experience',
    'career.other': 'Other',
    'career.otherDesc': 'Add projects or experiences you want to highlight separately from work experience',
    'career.addWork': 'Add Experience',
    'career.addOther': 'Add',
    'career.tailored': 'Tailored Resumes',
    'career.analyzing': 'Analyzing',
    'career.success': 'Complete',
    'career.fail': 'Failed',
    
    // Goals Tab
    'goals.title': 'Career Goals',
    'goals.subtitle': 'Set and track your goals',
    'goals.newGoal': 'New Goal',
    'goals.currentGoal': 'Current Goal',
    'goals.period': 'Goal Period',
    'goals.days': 'days',
    'goals.reason': 'Reason for Job Search',
    'goals.reasonEmpty': 'Not entered yet',
    'goals.result': 'Result',
    'goals.criteria': 'Company Evaluation Criteria (Priority)',
    'goals.edit': 'Edit',
    'goals.archive': 'Archive',
    'goals.noGoal': 'No current goal',
    'goals.noGoalDesc': 'Click New Goal to get started',
    'goals.history': 'History',
    'goals.noHistory': 'No history yet',
    'goals.startDate': 'Start Date',
    'goals.endDate': 'Target End Date (Optional)',
    'goals.searchPeriod': 'Job Search Period (Optional)',
    'goals.careerPath': 'Career Path',
    'goals.criteriaLabel': 'Company Evaluation Criteria (Click to adjust weight)',
    'goals.criteriaRequired': 'Please enter at least one company evaluation criterion.',
    'goals.archiveGoal': 'Complete Goal',
    'goals.resultRecord': 'Record Result',
    'goals.resultRequired': 'Please enter the result.',
    'goals.archiveConfirm': 'Complete and Archive',
    'goals.save': 'Save',
    
    // Settings Tab
    'settings.title': 'Settings',
    'settings.subtitle': 'Review your job search journey',
    'settings.daysSince': 'Since goal started',
    'settings.applied': 'Applied',
    'settings.interview': 'Interview',
    'settings.plan': 'Plan',
    'settings.aiCredits': 'AI Credits',
    'settings.jobLimit': 'Job Limit',
    'settings.unlimited': 'Unlimited',
    'settings.account': 'Account',
    'settings.terms': 'Terms of Service',
    'settings.privacy': 'Privacy Policy',
    'settings.language': 'Language',
    'settings.languageKo': '한국어',
    'settings.languageEn': 'English',
    'settings.customStatus': 'Custom Statuses',
    'settings.customStatusDescription': 'Add custom statuses for your board. You can add any statuses beyond the defaults.',
    'settings.newStatusPlaceholder': 'New status name',
    'settings.noCustomStatuses': 'No custom statuses added',
    'settings.version': 'Curve',
    
    // Status labels
    'status.reviewing': 'Reviewing',
    'status.applied': 'Applied',
    'status.interview': 'Interview',
    'status.rejected-docs': 'Rejected (Docs)',
    'status.rejected-interview': 'Rejected (Interview)',
    'status.offer': 'Offer',
    'status.accepted': 'Accepted',
    'status.closed': 'Closed',
    
    // Resume Builder
    'resume.title': 'Create Tailored Resume',
    'resume.languageLabel': 'Resume Language',
    'resume.korean': 'Korean',
    'resume.english': 'English',
    'resume.basedOnPosting': 'Based on job posting language',
    'resume.keyCompetencies': 'Key Competencies',
    'resume.keyCompetenciesDesc': 'AI will optimize your experience for these competencies.',
    'resume.selectAll': 'Select All',
    'resume.deselectAll': 'Deselect All',
    'resume.workExperience': 'Work Experience (auto-selected)',
    'resume.projects': 'Projects',
    'resume.noExperiences': 'Please add experiences in the Career tab first.',
    'resume.completed': 'Tailored Resume Complete',
    'resume.optimizedFor': 'Resume optimized for this position.',
    'resume.copy': 'Copy',
    'resume.save': 'Save Resume',
    'resume.regenerate': 'Regenerate',
    'resume.viewInCareer': 'View in Career',
    'resume.paidOnly': 'Tailored resume generation is a paid feature.',
    'resume.noCredits': 'Insufficient resume credits. Please upgrade your plan.',
    'resume.generationTime': 'Takes about 20 seconds. Auto-saves when complete.',
    'resume.generationTimeAutoSave': 'Takes about 20 seconds. Auto-saves even if you leave.',
    'resume.generating': 'Generating... Will auto-save when complete.',
    'resume.generatingAutoSave': 'Generating... Will auto-save to Career tab when complete.',
    'resume.autoSaved': 'Tailored resume generated and auto-saved',
    'resume.abort': 'Cancel',
    'resume.generate': 'Generate Tailored Resume',
    'resume.copied': 'Copied to clipboard',
    'resume.saved': 'Resume saved',
    'resume.generated': 'Tailored resume generated',
    'resume.selectAtLeastOne': 'Please select at least one experience',
    'resume.aborted': 'Resume generation cancelled',
    'resume.generateFailed': 'Failed to generate resume',
    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.loading': 'Loading...',
  },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'ko';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
