const fs = require("fs");
const path = require("path");

async function fetchFreeModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const json = await res.json();
    const freeModels = json.data
      .filter((m) => m.id.endsWith(":free") || (m.pricing?.prompt === "0" && m.pricing?.completion === "0"))
      .map((m) => ({ id: m.id, name: m.name, context_length: m.context_length }));

    fs.writeFileSync(path.join(__dirname, "openrouter_free_list.json"), JSON.stringify(freeModels, null, 2), "utf8");
    console.log(`Found ${freeModels.length} free models on OpenRouter!`);
  } catch (e) {
    console.error(e);
  }
}

fetchFreeModels();

