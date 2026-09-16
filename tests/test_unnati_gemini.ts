import fs from "fs";
import path from "path";

// Load frontend/.env.local manually
const envPath = path.resolve(__dirname, "../frontend/.env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const idx = trimmed.indexOf("=");
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

import { askCropAssistant } from "../frontend/src/lib/ai-assistant-service";

async function main() {
  console.log("=== Testing Unnati AI with Gemini Key ===");
  console.log("GEMINI_KEY present:", Boolean(process.env.GEMINI_API_KEY));
  console.log("GEMINI_MODEL:", process.env.GEMINI_MODEL);

  const res = await askCropAssistant(
    "गेहूं की फसल में पीला रतुआ (Yellow Rust) के नियंत्रण के लिए ICAR द्वारा कौन सी दवा और खुराक बताई गई है?",
    [],
    "default-farmer",
    undefined,
    "farmer"
  );

  console.log("\n--- Reply from Unnati AI (powered by Gemini) ---");
  console.log(res.reply);
  console.log("\nContext Farm:", res.context?.farmName);
  console.log("Active Crop:", res.context?.activeCrop);
}

main().catch(console.error);
