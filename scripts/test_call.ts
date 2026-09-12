import { askCropAssistant } from "../frontend/src/lib/ai-assistant-service";

async function main() {
  console.log("Testing askCropAssistant with dynamic farm context...");
  const res = await askCropAssistant("Mere wheat ke khet me yellow spots hain", []);
  console.log("\nREPLY:\n", res.reply);
  if (res.diagnosisCard) {
    console.log("\nDIAGNOSIS CARD:\n", res.diagnosisCard.pathogenName);
  }
}

main().catch(console.error);
