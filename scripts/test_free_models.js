const fs = require("fs");
const path = require("path");

// Load .env / .env.local if not already in process.env
function loadEnv() {
  const envPaths = [
    path.resolve(__dirname, "..", ".env"),
    path.resolve(__dirname, "..", "frontend", ".env.local"),
    path.resolve(__dirname, "..", ".env.local"),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const openRouterKey = process.env.OPENROUTER_API_KEY || "";

async function testFreeModels() {
  if (!openRouterKey) {
    console.warn("Warning: OPENROUTER_API_KEY environment variable is not set.");
  }

  const models = [
    "google/gemini-2.0-flash-lite-preview-02-05:free",
    "deepseek/deepseek-r1:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "qwen/qwen-2.5-coder-32b-instruct:free",
    "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
    "google/gemini-2.0-pro-exp-02-05:free"
  ];

  const results = [];

  for (const model of models) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://agriprofit.in",
          "X-Title": "AgriProfit AI Agronomist",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Mere wheat me yellow leaf ho raha hai. 2 line me upay bataye." }],
          max_tokens: 150,
        }),
      });

      const data = await res.json().catch(() => ({}));
      results.push({
        model,
        status: res.status,
        content: data.choices?.[0]?.message?.content || null,
        data: data.error ? data.error : undefined,
      });
    } catch (e) {
      results.push({ model, error: e.message });
    }
  }

  fs.writeFileSync(path.join(__dirname, "free_models_res.json"), JSON.stringify(results, null, 2), "utf8");
}

testFreeModels().catch((e) => {
  fs.writeFileSync(path.join(__dirname, "free_models_res.json"), JSON.stringify({ fatal: e.message }, null, 2), "utf8");
});
