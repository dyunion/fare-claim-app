const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type OcrRequest = {
  base64Data?: string;
  mimeType?: string;
  filename?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
  const geminiModel = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  if (!geminiApiKey) {
    return jsonResponse({ error: "Gemini API key is not configured." }, 500);
  }

  let payload: OcrRequest;
  try {
    payload = await req.json();
  } catch (_err) {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const { base64Data, mimeType = "image/png", filename = "uploaded-file" } = payload;
  if (!base64Data || typeof base64Data !== "string") {
    return jsonResponse({ error: "base64Data is required." }, 400);
  }

  const today = new Date().toISOString().split("T")[0];
  const prompt = `You are an expert Japanese receipt and transit route OCR assistant.
Analyze this image or PDF file named "${filename}" from a transit route search app, receipt, ticket, or travel proof. Extract route details for a Japanese transportation expense claim.
Respond ONLY with a JSON object. Do not include markdown formatting or backticks.

Expected JSON output structure:
{
  "date": "YYYY-MM-DD",
  "title": "A short summary in Japanese of the travel route or purpose. If unclear, summarize the visible route.",
  "category": "jr | subway | private_rail | shinkansen | bus | taxi | private_car | rental_car | highway | flight",
  "amount": 1230,
  "applicantName": "",
  "purpose": "",
  "legs": [
    {
      "type": "jr | subway | private_rail | shinkansen | bus | taxi | private_car | rental_car | highway | flight",
      "from": "Origin station/place name in Japanese",
      "to": "Destination station/place name in Japanese",
      "amount": 280,
      "remark": "Train line, transit info, or note in Japanese"
    }
  ]
}

If a date is not visible or unclear, use "${today}". If an amount is not visible, use 0.`;

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const errBody = await geminiResponse.json().catch(() => ({}));
    const message = errBody?.error?.message || `Status ${geminiResponse.status}`;
    return jsonResponse({ error: `Gemini API Error: ${message}` }, geminiResponse.status);
  }

  const geminiResult = await geminiResponse.json();
  const text = geminiResult?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || typeof text !== "string") {
    return jsonResponse({ error: "No candidates returned from Gemini." }, 502);
  }

  try {
    return jsonResponse(normalizeParsedData(JSON.parse(extractJson(text))));
  } catch (_err) {
    return jsonResponse({ error: "No valid JSON structure found in Gemini response." }, 502);
  }
});

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("JSON object not found");
  }
  return text.substring(start, end + 1);
}

function normalizeParsedData(data: Record<string, unknown>) {
  const allowedTypes = new Set([
    "jr",
    "subway",
    "private_rail",
    "shinkansen",
    "bus",
    "taxi",
    "private_car",
    "rental_car",
    "highway",
    "flight",
  ]);

  const legs = Array.isArray(data.legs)
    ? data.legs.map((leg) => {
      const item = leg as Record<string, unknown>;
      const type = typeof item.type === "string" && allowedTypes.has(item.type) ? item.type : "jr";
      return {
        type,
        from: stringify(item.from),
        to: stringify(item.to),
        amount: toInteger(item.amount),
        remark: stringify(item.remark),
      };
    })
    : [];

  const category = typeof data.category === "string" && allowedTypes.has(data.category)
    ? data.category
    : legs[0]?.type || "jr";

  return {
    date: typeof data.date === "string" ? data.date : new Date().toISOString().split("T")[0],
    title: stringify(data.title) || "交通費精算",
    category,
    amount: toInteger(data.amount),
    applicantName: stringify(data.applicantName),
    purpose: stringify(data.purpose),
    legs,
  };
}

function stringify(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toInteger(value: unknown): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numberValue) ? Math.max(0, Math.round(numberValue)) : 0;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
