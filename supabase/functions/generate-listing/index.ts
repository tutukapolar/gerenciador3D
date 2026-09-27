import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Trata o Preflight do navegador
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GROQ-API-KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Chave GROQ-API-KEY nao encontrada nos Secrets do Supabase." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const productName = body.productName || "Produto 3D";
    const material = body.material || "Impressão 3D";
    const preco = body.preco || "0.00";

    const prompt = `
      Atua como especialista em e-commerce e SEO para marketplaces.
      Cria um anúncio persuasivo para um produto impresso em 3D com estes dados:
      - Nome do Produto: ${productName}
      - Material/Tipo: ${material}
      - Preço Base: R$ ${preco}

      Retorna ESTRITAMENTE um JSON válido neste formato:
      {
        "titulo": "Título com palavras-chave e até 60 caracteres",
        "descricao": "Texto da descrição completo com introdução, especificações e envio rápido",
        "tags": ["tag1", "tag2", "tag3"]
      }
    `;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data.error?.message || "Erro retornado pela Groq" }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textResult = data.choices[0].message.content;

    return new Response(JSON.stringify({ text: textResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno no servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});