const fs = require("fs");
const path = require("path");

async function testAssistantAPI() {
  const testQueries = [
    { query: "Mere wheat ke patte peele ho rahe hain, kya karu?", hasImage: false },
    { query: "What fertilizer should I give at CRI stage?", hasImage: false },
    { query: "Diagnose this diseased wheat leaf photo", hasImage: true, imageUrl: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80" },
  ];

  const results = [];

  for (const item of testQueries) {
    try {
      const res = await fetch("http://127.0.0.1:3000/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: item.query,
          history: [],
          imageUrl: item.imageUrl,
        }),
      });

      const data = await res.json();
      results.push({
        query: item.query,
        status: res.status,
        success: data.success,
        replyPreview: data.reply?.slice(0, 150) + "...",
        hasDiagnosisCard: Boolean(data.diagnosisCard),
      });
    } catch (e) {
      results.push({ query: item.query, error: e.message });
    }
  }

  fs.writeFileSync(path.join(__dirname, "assistant_api_test.json"), JSON.stringify(results, null, 2), "utf8");
}

testAssistantAPI().catch(console.error);

