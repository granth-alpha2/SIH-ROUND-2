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
  console.log("=== Testing Unnati AI with Query: 'give a code for bfs' ===");
  const res = await askCropAssistant(
    "give a code for bfs in python with explanation",
    [],
    "default-farmer",
    undefined,
    "farmer"
  );

  console.log("\n--- Reply from Unnati AI ---");
  console.log(res.reply);
  console.log("\nDiagnosis Card Present?", Boolean(res.diagnosisCard));
}

main().catch(console.error);
