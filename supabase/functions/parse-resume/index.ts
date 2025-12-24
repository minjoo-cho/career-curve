import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileName, resumeId, resumeText, pageImages } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const hasText = typeof resumeText === 'string' && resumeText.trim().length > 0;
    const hasImages = Array.isArray(pageImages) && pageImages.length > 0;

    // 텍스트도 이미지도 없으면 파싱 불가
    if (!hasText && !hasImages) {
      console.log('No resume text or images provided');
      return new Response(
        JSON.stringify({
          success: true,
          experiences: [],
          message: 'No resume content to parse'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert resume parser.

CRITICAL INSTRUCTIONS:
1. ONLY extract information that is ACTUALLY in the resume. Do NOT make up or hallucinate any experiences.
2. If the provided content is unreadable / too small to be confident, return an EMPTY experiences array.
3. Categorize each item as either "work" (employment) or "project" (projects).
4. Extract the actual title, company/organization name (if present), description, and bullet points.

Return a JSON object with:
- experiences: array of objects with:
  - type: "work" or "project"
  - title: actual job title or project name from resume
  - company: actual company name (for work) or organization/team (for project)
  - description: brief description extracted from resume
  - bullets: array of actual achievements/responsibilities from resume

Always respond in Korean if the resume is in Korean, otherwise match the resume language.`;

    // 이미지 기반(OCR)일 때는 비전 성능이 더 좋은 모델을 사용
    const model = hasImages ? 'openai/gpt-5-mini' : 'google/gemini-2.5-flash';

    console.log('Parsing resume with AI', {
      fileName,
      resumeId,
      textLength: hasText ? resumeText.length : 0,
      images: hasImages ? pageImages.length : 0,
      model,
    });

    const userContent = (() => {
      if (hasImages) {
        // OpenAI-compatible multimodal message format
        const parts: any[] = [
          {
            type: 'text',
            text:
              '아래 이력서 PDF 페이지 이미지에서 텍스트를 읽고(필요하면 OCR) 경력/프로젝트를 추출해 주세요.\n\n규칙:\n- 문서에 실제로 있는 내용만 추출하세요(추측/창작 금지).\n- 읽을 수 없는 경우 experiences를 빈 배열로 반환하세요.\n- 가능한 한 원문 표현을 유지하세요(회사명/직함/프로젝트명 등).'
          },
        ];

        for (const img of pageImages.slice(0, 2)) {
          parts.push({ type: 'image_url', image_url: { url: img, detail: 'high' } });
        }

        return parts;
      }

      return `Parse this resume and extract experiences:\n\n${String(resumeText).substring(0, 12000)}`;
    })();

    const body: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_resume_experiences",
            description: "Extract work experiences and projects from resume",
            parameters: {
              type: "object",
              properties: {
                experiences: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["work", "project"] },
                      title: { type: "string" },
                      company: { type: "string" },
                      description: { type: "string" },
                      bullets: { type: "array", items: { type: "string" } }
                    },
                    required: ["type", "title", "description", "bullets"]
                  }
                }
              },
              required: ["experiences"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "extract_resume_experiences" } }
    };

    // openai 계열 모델은 max_completion_tokens 사용
    if (String(model).startsWith('openai/')) {
      body.max_completion_tokens = 1600;
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI gateway error:', aiResponse.status, errorText);
      throw new Error('AI analysis failed');
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    let experiences: any[] = [];
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        experiences = Array.isArray(parsed.experiences) ? parsed.experiences : [];
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // 목데이터/환각 최소화: 흔한 플레이스홀더/신호 없는 항목 제거
    const cleaned = (experiences || []).filter((exp) => {
      const title = String(exp?.title ?? '').trim();
      const company = String(exp?.company ?? '').trim();
      const desc = String(exp?.description ?? '').trim();
      const bullets = Array.isArray(exp?.bullets) ? exp.bullets.filter((b: any) => String(b).trim()) : [];

      const looksLikeMock = /^(예시|샘플|Sample|Dummy|목데이터)/i.test(title) || /목데이터|샘플|example/i.test(`${title} ${company} ${desc}`);
      const hasSignal = title.length >= 2 && (desc.length >= 5 || bullets.length >= 1 || company.length >= 2);
      return !looksLikeMock && hasSignal;
    });

    console.log('Extracted experiences:', cleaned.length);

    return new Response(
      JSON.stringify({ success: true, experiences: cleaned }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error parsing resume:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
