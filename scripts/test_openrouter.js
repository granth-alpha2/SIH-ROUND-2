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

async function testModels() {
  if (!openRouterKey) {
    console.warn("Warning: OPENROUTER_API_KEY environment variable is not set.");
  }

  const models = [
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemini-2.0-flash-exp:free",
    "mistralai/mistral-7b-instruct:free",
    "deepseek/deepseek-chat"
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
          messages: [{ role: "user", content: "Namaste, mere wheat ke patte peele ho rahe hain." }],
          max_tokens: 150,
        }),
      });

      const data = await res.json().catch(() => ({}));
      results.push({
        model,
        status: res.status,
        data,
      });
    } catch (e) {
      results.push({ model, error: e.message });
    }
  }

  fs.writeFileSync(path.join(__dirname, "openrouter_res.json"), JSON.stringify(results, null, 2), "utf8");
}

testModels().catch((e) => {
  fs.writeFileSync(path.join(__dirname, "openrouter_res.json"), JSON.stringify({ fatal: e.message }, null, 2), "utf8");
});
