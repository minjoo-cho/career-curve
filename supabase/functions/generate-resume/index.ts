import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schemas
const experienceSchema = z.object({
  id: z.string().max(100),
  type: z.enum(["work", "project"]),
  title: z.string().min(1).max(300),
  company: z.string().max(200).optional(),
  period: z.string().max(100).optional(),
  description: z.string().max(5000),
  bullets: z.array(z.string().max(1000)).max(20),
});

const keyCompetencySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000),
  score: z.number().min(1).max(5).optional(),
  evaluation: z.string().max(2000).optional(),
});

const minimumRequirementsCheckSchema = z.object({
  experienceMet: z.enum(['충족', '미충족', '판단 불가']),
  reason: z.string().max(500),
});

const requestSchema = z.object({
  jobTitle: z.string().min(1).max(300),
  companyName: z.string().min(1).max(200),
  jobSummary: z.string().max(5000),
  keyCompetencies: z.array(keyCompetencySchema).min(1).max(10),
  experiences: z.array(experienceSchema).min(1).max(50),
  language: z.enum(["ko", "en"]),
  format: z.enum(["consulting", "narrative"]).optional(),
  minimumRequirementsCheck: minimumRequirementsCheckSchema.optional(),
});

type Experience = z.infer<typeof experienceSchema>;
type KeyCompetency = z.infer<typeof keyCompetencySchema>;
type MinimumRequirementsCheck = z.infer<typeof minimumRequirementsCheckSchema>;
type ResumeFormat = "consulting" | "narrative";

function splitAiFeedback(raw: string) {
  // Preferred markers
  const FEEDBACK = "===AI_FEEDBACK===";
  const RESUME = "===RESUME===";

  const feedbackIdx = raw.indexOf(FEEDBACK);
  const resumeIdx = raw.indexOf(RESUME);

  if (feedbackIdx !== -1 && resumeIdx !== -1 && resumeIdx > feedbackIdx) {
    const aiFeedback = raw.slice(feedbackIdx + FEEDBACK.length, resumeIdx).trim();
    const content = raw.slice(resumeIdx + RESUME.length).trim();
    return { aiFeedback, content };
  }

  // Fallback: split by localized headers
  const fallbacks = ["[AI 피드백]", "[AI Feedback]"];
  for (const header of fallbacks) {
    const idx = raw.indexOf(header);
    if (idx !== -1) {
      const after = raw.slice(idx + header.length).trim();
      // Try to find first experience header line after feedback
      const experienceHeaderRegex = /\n\s*\[(경험 제목|Experience Title)\]\s*\n/;
      const m = after.match(experienceHeaderRegex);
      if (m && m.index !== undefined) {
        const aiFeedback = after.slice(0, m.index).trim();
        const content = after.slice(m.index).trim();
        return { aiFeedback, content };
      }
      return { aiFeedback: after.trim(), content: raw.slice(0, idx).trim() };
    }
  }

  return { aiFeedback: "", content: raw.trim() };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    // Check subscription (optional - no limits enforced)
    const { data: subscription, error: subError } = await supabaseClient
      .from('user_subscriptions')
      .select('resume_credits_remaining, resume_credits_used')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error('Subscription fetch error (non-blocking):', subError);
    }

    // Log usage but don't block - no credit limits
    if (subscription) {
      await supabaseClient
        .from('user_subscriptions')
        .update({
          resume_credits_used: (subscription.resume_credits_used || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
      console.log('Resume usage logged');
    } else {
      console.log('No subscription found, proceeding without usage tracking');
    }

    // Parse and validate input
    const rawBody = await req.json();
    const validationResult = requestSchema.safeParse(rawBody);
    
    if (!validationResult.success) {
      console.error('Validation error:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid input data',
          details: validationResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      jobTitle,
      companyName,
      jobSummary,
      keyCompetencies,
      experiences,
      language,
      format = language === "en" ? "consulting" : "narrative",
      minimumRequirementsCheck,
    } = validationResult.data;

    console.log("Generating tailored resume for:", companyName, jobTitle);
    console.log("Language:", language, "Format:", format);
    console.log("Experiences count:", experiences.length);
    console.log("Key competencies:", keyCompetencies.map((k) => k.title));
    console.log("Minimum requirements check:", minimumRequirementsCheck);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build competency evaluation section for prompt
    const competencyEvaluationSection = keyCompetencies
      .map((k, i) => {
        const scoreText = k.score !== undefined ? `(본인 평가: ${k.score}점/5점)` : '';
        const evalText = k.evaluation ? `\n   - AI 분석: ${k.evaluation}` : '';
        return `${i + 1}. ${k.title}: ${k.description} ${scoreText}${evalText}`;
      })
      .join("\n");

    // Build minimum requirements section
    const minReqSection = minimumRequirementsCheck
      ? `## 최소 자격 요건 검토 결과
- 경력 요건: ${minimumRequirementsCheck.experienceMet}
- 사유: ${minimumRequirementsCheck.reason}
`
      : '';

    // Identify weak and strong competencies
    const weakCompetencies = keyCompetencies.filter(k => k.score !== undefined && k.score <= 2);
    const strongCompetencies = keyCompetencies.filter(k => k.score !== undefined && k.score >= 4);

    const systemPrompt =
      language === "ko"
        ? `당신은 ${companyName}의 ${jobTitle} 포지션 채용 담당자입니다. 지원자의 이력서를 검토하고, 해당 공고의 핵심 역량에 맞춰 최적화된 이력서를 작성합니다.

## 역할 및 관점 (매우 중요!)
당신은 실제 채용 담당자처럼 생각해야 합니다:
- 이 포지션에서 필요한 역량을 정확히 파악하고
- 지원자의 경험에서 해당 역량과 관련된 부분을 찾아내고
- **부족한 부분은 냉정하게 지적**하면서도 보완 전략을 제시합니다
- 무조건 긍정적인 피드백은 금지! 채용 담당자는 약점도 봅니다.

## AI 적합도 평가 결과 (철저히 반영할 것)
아래는 AI가 채용 담당자 관점에서 평가한 핵심 역량 적합도입니다:
${keyCompetencies.map((k, i) => `${i + 1}. ${k.title} (${k.score || '미평가'}점/5점): ${k.evaluation || '평가 없음'}`).join("\n")}

${weakCompetencies.length > 0 ? `### ⚠️ 보완 필요 역량 (1-2점)
${weakCompetencies.map(k => `- **${k.title}**: ${k.evaluation || '관련 경험 부족'}`).join("\n")}

이 역량들은 솔직히 부족함을 인정하되, 다음 전략으로 보완하세요:
- 유사 경험에서 **전이 가능한 스킬**을 명시적으로 언급
- 예: "프로젝트 관리 경험은 없지만, 팀 리드로서 5명의 일정과 업무를 조율한 경험"
- 완전히 부족한 경우, **학습 의지나 관련 활동** 언급` : ''}

${strongCompetencies.length > 0 ? `### ✓ 강점 역량 (4-5점)
${strongCompetencies.map(k => `- **${k.title}**: ${k.evaluation || '관련 경험 풍부'}`).join("\n")}

이 역량들은 **구체적인 숫자와 성과**로 극대화하세요.` : ''}

## 핵심 지시사항

### 1. 표현 및 구성 변경 (가장 중요!)
- 원본 bullet point를 **절대 그대로 복사하지 말 것**
- 공고에서 사용된 키워드와 표현을 자연스럽게 반영
- 성과를 정량화 (%, 건수, 금액, 기간 등)
- 예: "프로젝트 진행" → "5명 규모 팀을 리드하여 3개월 내 프로덕트 출시, 사용자 만족도 4.5/5.0 달성"

### 2. 프로젝트 순서 조정
- 경력(Work Experience): 시간순 유지 (최근→과거)
- 프로젝트(그 외): **공고 관련도 순으로 재배치**
- 변경 시 반드시 "원래 순서 → 변경된 순서" 및 이유 명시

### 3. 약한 역량은 솔직하게, 하지만 보완 전략 제시
- 직접 경험이 없다면 유사 경험의 전이 가능 스킬 언급
- 완전히 부족하면 솔직히 인정 + 학습/관련 활동 언급

## 출력 형식 (엄수)
===AI_FEEDBACK===
(여기에 피드백만)
===RESUME===
(여기에 이력서 본문만)

## AI_FEEDBACK 작성 규칙

### 1) ## 종합 의견 (한국어, 한 번만 작성)
**채용 담당자 관점**에서:
- 이 지원자의 전반적인 적합도 평가
- **부족한 역량과 그것이 채용에 미칠 수 있는 영향** (솔직하게!)
- 강조할 핵심 포인트와 약점 보완 전략
- ⚠️ 이 섹션을 중복 출력하지 말 것

### 2) ## 역량 분석
각 핵심 역량별로:
- 지원자의 강점/약점 (AI 평가 점수 반영)
- 어떻게 보완했는지 (또는 보완이 어려운 경우 그 한계)
- 이력서에서 해당 역량이 어떻게 드러나는지

### 3) ## 프로젝트 순서 조정
- 변경했다면: "원래 순서: A, B, C → 변경된 순서: B, A, C"
- 각 배치 이유: "프로젝트 B를 1순위로 배치 - [핵심 역량 X]와 직접 연관"
- 변경 없다면: "기존 순서 유지 - 이유: [설명]"

### 4) ## 세부 수정 내용
- **"원문 → 수정본"** 형태로 구체적 변경 사항 나열
- 왜 변경했는지 간단히 설명
- 예: "'데이터 분석 업무 수행' → '50K+ 사용자 행동 데이터 분석으로 이탈률 15% 감소' (성과 정량화)"

## RESUME 작성 규칙
- 결과는 한국어로 작성
- 이력서 본문에 AI 피드백/조언 문구 포함 금지
- 이모지 사용 금지 (⚠, ✓, ★ 등)
- 형식: ${format === "consulting" ? "컨설팅형(간결, 성과 중심)" : "서술형(국문형, 섹션 구분 명확)"}`
        : `You are the hiring manager for the ${jobTitle} position at ${companyName}. Review the candidate's resume and optimize it to match the key competencies required for this role.

## Role & Perspective (CRITICAL!)
Think like an actual hiring manager:
- Precisely identify what competencies are needed for this position
- Find experiences in the candidate's background that relate to these competencies
- **Candidly point out gaps** while providing compensation strategies
- No unconditional positive feedback! Recruiters look at weaknesses too.

## AI Fit Evaluation Results (Must Thoroughly Reflect)
Below are the AI-evaluated key competency scores from a recruiter's perspective:
${keyCompetencies.map((k, i) => `${i + 1}. ${k.title} (${k.score || 'Not evaluated'}/5): ${k.evaluation || 'No evaluation'}`).join("\n")}

${weakCompetencies.length > 0 ? `### ⚠️ Competencies Needing Improvement (1-2 points)
${weakCompetencies.map(k => `- **${k.title}**: ${k.evaluation || 'Lacking related experience'}`).join("\n")}

Honestly acknowledge these gaps, but compensate using:
- Explicitly mention **transferable skills** from related experiences
- Example: "No project management experience, but coordinated schedules for a team of 5 as lead"
- If completely lacking, mention **learning attitude or related activities**` : ''}

${strongCompetencies.length > 0 ? `### ✓ Strong Competencies (4-5 points)
${strongCompetencies.map(k => `- **${k.title}**: ${k.evaluation || 'Rich related experience'}`).join("\n")}

Maximize these with **specific numbers and achievements**.` : ''}

## CRITICAL INSTRUCTIONS

### 1. Expression & Structure Changes (MOST IMPORTANT!)
- **NEVER copy original bullet points verbatim**
- Naturally incorporate keywords from the job posting
- Quantify achievements (%, count, amount, duration)
- Example: "Worked on projects" → "Led 5-person team to launch product in 3 months, achieving 4.5/5.0 user satisfaction"

### 2. Project Order Adjustment
- Work Experience: Keep chronological order (most recent first)
- Selected Projects: **Reorder by job relevance**
- If changed, state "Original order → New order" and reasons

### 3. Be Honest About Weak Competencies, But Provide Compensation
- If no direct experience, mention transferable skills from similar experiences
- If completely lacking, honestly acknowledge + mention learning/related activities

## Output Format (STRICT)
===AI_FEEDBACK===
(feedback only)
===RESUME===
(resume body only)

## AI_FEEDBACK Rules

### 1) ## 종합 의견 (IN KOREAN, write only once)
**From recruiter's perspective**:
- Overall fit assessment for this candidate
- **Gaps and their potential impact on hiring** (be honest!)
- Key points to highlight and gap compensation strategy
- ⚠️ Do NOT duplicate this section

### 2) ## Competency Analysis
For each key competency:
- Candidate's strengths/weaknesses (reflect AI scores)
- How it was compensated (or limitations)
- How this competency shows in the resume

### 3) ## Project Order Adjustments
- If changed: "Original order: A, B, C → New order: B, A, C"
- Reason: "Project B placed first - directly relevant to [competency X]"
- If unchanged: "Original order maintained - Reason: [explanation]"

### 4) ## Detailed Revisions
- Show **"Original → Revised"** format for each change
- Brief explanation of why
- Example: "'Performed data analysis' → 'Analyzed 50K+ user data to reduce churn by 15%' (quantified impact)"

## RESUME Rules
- Write in native-level English
- No AI feedback/advice in resume body
- No emojis
- Use strong action verbs (Led, Drove, Spearheaded, etc.)
- Format: ${format === "consulting" ? "consulting-style (concise, results-driven)" : "narrative-style"}`;

    const userPrompt =
      language === "ko"
        ? `## 채용 공고 정보
회사: ${companyName}
포지션: ${jobTitle}
요약: ${jobSummary}

${minReqSection}
## 핵심 요구 역량 (AI 적합도 평가 포함)
${competencyEvaluationSection}

${weakCompetencies.length > 0 ? `## 보완이 필요한 역량 (낮은 점수)
${weakCompetencies.map(k => `- ${k.title} (${k.score}점): ${k.evaluation || '관련 경험 부족'}`).join("\n")}
` : ''}
${strongCompetencies.length > 0 ? `## 강점 역량 (높은 점수)
${strongCompetencies.map(k => `- ${k.title} (${k.score}점): ${k.evaluation || '관련 경험 풍부'}`).join("\n")}
` : ''}
## 지원자 경험
${experiences
  .map(
    (exp, i) => `
### ${exp.type === "work" ? "경력" : "프로젝트"} ${i + 1}: ${exp.title}${exp.company ? ` @ ${exp.company}` : ""}
기간: ${exp.period || "미정"}
설명: ${exp.description}
주요 성과:
${exp.bullets.map((b) => `- ${b}`).join("\n")}
`
  )
  .join("\n")}

요청:
1) ===AI_FEEDBACK===에는:
- 약한 역량을 어떻게 보완했는지
- 강한 역량을 어떻게 부각했는지
- **프로젝트 순서를 어떻게 조정했는지와 그 이유** (필수! "원래 순서 → 변경된 순서" 및 각 배치 이유 명시)
2) ===RESUME===에는 이력서 본문만 작성.

## 표준 이력서 형식 (반드시 따를 것)
아래 형식을 정확히 따라 작성하세요:

---
[지원자 이름]

## 경력 요약
(2-3문장으로 핵심 역량과 경력 요약)

## 경력 사항
각 경력은 아래 형식:
**[직책/역할]**
[회사명] | [기간]
• 성과/업무 1
• 성과/업무 2
• 성과/업무 3

## 프로젝트 (해당 시)
**[프로젝트명]**
[기간]
• 주요 성과 1
• 주요 성과 2

## 기술 및 역량
• 기술1, 기술2, 기술3
---

중요: 이력서 본문에 이모지를 절대 사용하지 마세요.`
        : `## Job Posting Information
Company: ${companyName}
Position: ${jobTitle}
Summary: ${jobSummary}

${minReqSection}
## Key Required Competencies (with AI Fit Evaluation)
${competencyEvaluationSection}

${weakCompetencies.length > 0 ? `## Competencies Needing Improvement (Low Scores)
${weakCompetencies.map(k => `- ${k.title} (${k.score}/5): ${k.evaluation || 'Lacking related experience'}`).join("\n")}
` : ''}
${strongCompetencies.length > 0 ? `## Strong Competencies (High Scores)
${strongCompetencies.map(k => `- ${k.title} (${k.score}/5): ${k.evaluation || 'Rich related experience'}`).join("\n")}
` : ''}
## Candidate's Experience
${experiences
  .map(
    (exp, i) => `
### ${exp.type === "work" ? "Work Experience" : "Project"} ${i + 1}: ${exp.title}${exp.company ? ` @ ${exp.company}` : ""}
Period: ${exp.period || "Not specified"}
Description: ${exp.description}
Key Achievements:
${exp.bullets.map((b) => `- ${b}`).join("\n")}
`
  )
  .join("\n")}

Request:
1) In ===AI_FEEDBACK===:
- How you compensated for weak competencies
- How you highlighted strong competencies
- **How you adjusted project order and WHY** (REQUIRED! Show "Original order → New order" and reason for each placement)
2) In ===RESUME===, write ONLY the resume body.

## STANDARD RESUME FORMAT (Must Follow)
Use this exact structure:

---
[Candidate Name]

## Professional Summary
(2-3 sentences summarizing core competencies and experience)

## Work Experience
For each position use:
**[Job Title]**
[Company Name] | [Period]
• Achievement/responsibility 1
• Achievement/responsibility 2
• Achievement/responsibility 3

## Projects (if applicable)
**[Project Name]**
[Period]
• Key achievement 1
• Key achievement 2

## Skills & Competencies
• Skill1, Skill2, Skill3
---

IMPORTANT: Do NOT use emojis in the resume body.`;

    const model = language === "en" ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content || "";
    const { aiFeedback, content } = splitAiFeedback(rawContent);

    console.log("Resume generated successfully (split):", {
      aiFeedbackLength: aiFeedback.length,
      contentLength: content.length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        content,
        aiFeedback: aiFeedback || null,
        rawContent,
        language,
        format,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error generating resume:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
