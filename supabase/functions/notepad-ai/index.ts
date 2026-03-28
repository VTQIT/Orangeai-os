import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action, text, mode, agent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Agent-specific persona prefix
    const agentPersona: Record<string, string> = {
      grok: "You are Grok, a witty and conversational AI assistant. Be direct, insightful, and occasionally humorous.",
      gemini: "You are Gemini, a knowledgeable and analytical AI. Provide thorough, well-structured responses.",
      chatgpt: "You are ChatGPT, a versatile and creative AI assistant. Be helpful, clear, and engaging.",
      deepseek: "You are DeepSeek, a deep-thinking AI specializing in thorough analysis and research.",
      claude: "You are Claude, an expert AI assistant known for precision, safety, and nuanced reasoning.",
      suno: "You are Suno, an AI music assistant. Help with lyrics, melodies, chord progressions, and music theory.",
      jukebox: "You are Jukebox, an AI music generation assistant. Help compose and arrange music.",
      musicful: "You are Musicful.ai, an AI composition assistant. Help create original music and arrangements.",
      jggl: "You are jggl.ai, an AI music creation assistant. Help with beats, melodies, and production.",
    };

    const persona = agent && agentPersona[agent] ? agentPersona[agent] + " " : "";

    let systemPrompt = persona + "You are a helpful AI writing assistant integrated into a notepad app. Be concise and direct.";
    let userPrompt = text;

    switch (action) {
      case "grammar":
        systemPrompt = persona + "You are a grammar and spelling correction assistant. Return ONLY the corrected text without explanations. Preserve the original formatting and structure.";
        userPrompt = `Correct the grammar and spelling in this text:\n\n${text}`;
        break;
      case "suggest":
        systemPrompt = persona + "You are a writing improvement assistant. Provide 2-3 alternative ways to write the given text. Format each alternative on a new line prefixed with a number. Be concise.";
        userPrompt = `Suggest alternative ways to write this:\n\n${text}`;
        break;
      case "compose":
        systemPrompt = persona + `You are an AI writing assistant. The user is working in ${mode || 'general'} mode. Help them compose or expand on their text. Be concise and match the context.`;
        userPrompt = text;
        break;
      case "code_help":
        systemPrompt = persona + "You are a coding assistant. Help with code writing, debugging, and explanations. Use markdown code blocks for code.";
        userPrompt = text;
        break;
      case "math_help":
        systemPrompt = persona + "You are a math assistant. Help solve equations, explain formulas, and provide step-by-step solutions. Use proper mathematical notation.";
        userPrompt = text;
        break;
      case "music_help":
        systemPrompt = persona + "You are a music writing assistant. Help with lyrics, chord progressions, music theory, and composition. Format output clearly.";
        userPrompt = text;
        break;
      case "prompt_help":
        systemPrompt = persona + "You are a prompt engineering expert. Help the user craft effective prompts for AI models like DeepSeek, ChatGPT, Claude, etc. Provide the improved prompt directly.";
        userPrompt = text;
        break;
      default:
        userPrompt = text;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("notepad-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
