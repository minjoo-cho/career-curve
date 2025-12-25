import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Experience {
  id: string;
  type: 'work' | 'project';
  title: string;
  company?: string;
  period?: string;
  description: string;
  bullets: string[];
}

interface KeyCompetency {
  title: string;
  description: string;
}

interface RequestBody {
  jobTitle: string;
  companyName: string;
  jobSummary: string;
  keyCompetencies: KeyCompetency[];
  experiences: Experience[];
  language: 'ko' | 'en';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobTitle, companyName, jobSummary, keyCompetencies, experiences, language }: RequestBody = await req.json();
    
    console.log("Generating tailored resume for:", companyName, jobTitle);
    console.log("Language:", language);
    console.log("Experiences count:", experiences.length);
    console.log("Key competencies:", keyCompetencies.map(k => k.title));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = language === 'ko' 
      ? `당신은 전문 이력서 작성 컨설턴트입니다. 주어진 채용 공고의 핵심 역량에 맞춰 지원자의 경험을 최적화하여 이력서를 작성해주세요.

규칙:
1. 각 경험의 핵심 성과를 공고가 요구하는 역량에 맞게 재구성하세요.
2. 수치화된 성과가 있다면 강조하세요.
3. 공고에서 사용하는 키워드를 자연스럽게 포함하세요.
4. 간결하고 임팩트 있게 작성하세요.
5. 결과는 한국어로 작성하세요.`
      : `You are a professional resume consultant. Optimize the candidate's experiences to match the key competencies required by the job posting.

Rules:
1. Restructure each experience's key achievements to align with the required competencies.
2. Emphasize quantified achievements when available.
3. Naturally incorporate keywords used in the job posting.
4. Write concisely with impact.
5. Write the result in English.`;

    const userPrompt = language === 'ko'
      ? `## 채용 공고 정보
회사: ${companyName}
포지션: ${jobTitle}
요약: ${jobSummary}

## 핵심 요구 역량
${keyCompetencies.map((k, i) => `${i + 1}. ${k.title}: ${k.description}`).join('\n')}

## 지원자 경험
${experiences.map((exp, i) => `
### ${exp.type === 'work' ? '경력' : '프로젝트'} ${i + 1}: ${exp.title}${exp.company ? ` @ ${exp.company}` : ''}
기간: ${exp.period || '미정'}
설명: ${exp.description}
주요 성과:
${exp.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

위 경험들을 핵심 요구 역량에 맞게 재구성하여 이력서용 텍스트를 생성해주세요.
각 경험마다 다음 형식으로 작성해주세요:

[경험 제목]
[회사명] | [기간]
• 최적화된 성과 bullet 1
• 최적화된 성과 bullet 2
• 최적화된 성과 bullet 3`
      : `## Job Posting Information
Company: ${companyName}
Position: ${jobTitle}
Summary: ${jobSummary}

## Key Required Competencies
${keyCompetencies.map((k, i) => `${i + 1}. ${k.title}: ${k.description}`).join('\n')}

## Candidate's Experience
${experiences.map((exp, i) => `
### ${exp.type === 'work' ? 'Work Experience' : 'Project'} ${i + 1}: ${exp.title}${exp.company ? ` @ ${exp.company}` : ''}
Period: ${exp.period || 'Not specified'}
Description: ${exp.description}
Key Achievements:
${exp.bullets.map(b => `- ${b}`).join('\n')}
`).join('\n')}

Please restructure the above experiences to match the key required competencies and generate resume text.
For each experience, use the following format:

[Experience Title]
[Company Name] | [Period]
• Optimized achievement bullet 1
• Optimized achievement bullet 2
• Optimized achievement bullet 3`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
    const generatedContent = data.choices?.[0]?.message?.content || "";

    console.log("Resume generated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        content: generatedContent,
        language,
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
