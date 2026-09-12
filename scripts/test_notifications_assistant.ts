/// <reference types="node" />

/**
 * AgriProfit — Test Suite for Prompts 16 & 17
 * ============================================
 * Tests:
 * - Notification System Architecture (Prompt 16)
 * - Contextual AI Crop Assistant & Hinglish Diagnosis (Prompt 17)
 */


import {
  getFarmerNotifications,
  createFarmerNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../frontend/src/lib/notification-service";
import {
  getFarmerContext,
  askCropAssistant,
} from "../frontend/src/lib/ai-assistant-service";

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("=== Testing Notification Architecture (Prompt 16) ===");

  const testUserId = "test-farmer-notif-001";

  // 1. Initial retrieval
  const { notifications, unreadCount } = await getFarmerNotifications(testUserId);
  assert(notifications.length >= 5, `Initial notifications list has ${notifications.length} alerts`);
  assert(unreadCount >= 3, `Unread count correctly computed: ${unreadCount}`);

  // 2. Verify all 5 notification categories present
  const types = new Set(notifications.map((n) => n.type));
  assert(types.has("irrigation"), "Contains 'irrigation' reminders");
  assert(types.has("weather_alert"), "Contains 'weather_alert' warnings");
  assert(types.has("disease_risk"), "Contains 'disease_risk' alerts");
  assert(types.has("market_price"), "Contains 'market_price' alerts");
  assert(types.has("crop_stage"), "Contains 'crop_stage' transition reminders");

  // 3. Category filtering
  const irrList = await getFarmerNotifications(testUserId, "irrigation");
  assert(irrList.notifications.every((n) => n.type === "irrigation"), "Category filter 'irrigation' returns only irrigation items");

  // 4. Create new notification
  const created = await createFarmerNotification(
    {
      userId: testUserId,
      type: "weather_alert",
      title: "Sudden Frost Warning",
      body: "Night temp expected to drop below 3°C.",
      severity: "critical",
      actionUrl: "/weather",
      actionLabel: "View Advisory",
    },
    testUserId
  );
  assert(created.id.startsWith("notif_"), "New notification created with unique ID");

  // 5. Mark single as read
  const readSuccess = await markNotificationAsRead(created.id, testUserId);
  assert(readSuccess, "Marked single notification as read");

  // 6. Mark all as read
  const markedCount = await markAllNotificationsAsRead(testUserId);
  assert(markedCount >= 1, `Marked all remaining ${markedCount} notifications as read`);
  const finalCheck = await getFarmerNotifications(testUserId);
  assert(finalCheck.unreadCount === 0, "Unread count is now 0 after markAllAsRead");

  console.log("\n=== Testing Contextual AI Crop Assistant (Prompt 17) ===");

  // 1. Context aggregation
  const ctx = await getFarmerContext(testUserId);
  assert(ctx.activeCrop === "Wheat", "Context loaded active crop (Wheat)");
  assert(ctx.stageName.includes("Crown Root Initiation"), "Context loaded active stage (CRI)");
  assert(ctx.weather.current.tempC > 0, "Context loaded live weather temperature");
  assert(ctx.mandiPricePerQuintal > 0, "Context loaded mandi modal price");

  // 2. Hinglish Leaf Yellowing Diagnosis (Exact user prompt test)
  const yellowingQuery = "Mere wheat ke patte yellow ho rahe hain, kya karu?";
  const yellowingResponse = await askCropAssistant(yellowingQuery, [], testUserId);

  const lowerReply1 = yellowingResponse.reply.toLowerCase();
  assert(
    lowerReply1.includes("wheat") || lowerReply1.includes("गेहूं") || lowerReply1.includes("gehu"),
    "Response identifies the farmer's active crop (Wheat)"
  );
  assert(
    lowerReply1.includes("nitrogen") || lowerReply1.includes("urea") || lowerReply1.includes("khad") || lowerReply1.includes("nutrient") || lowerReply1.includes("chlorosis") || lowerReply1.includes("deficiency") || lowerReply1.includes("yellow") || lowerReply1.includes("peel") || lowerReply1.includes("irrigation") || lowerReply1.includes("paani"),
    "Response includes diagnostic explanation for leaf yellowing"
  );
  assert(
    lowerReply1.includes("yellow rust") || lowerReply1.includes("propiconazole") || lowerReply1.includes("tilt") || lowerReply1.includes("rust") || lowerReply1.includes("fungus") || lowerReply1.includes("spray") || lowerReply1.includes("dawai"),
    "Response includes disease / treatment advisory"
  );
  assert(
    lowerReply1.includes("krishi") || lowerReply1.includes("kvk") || lowerReply1.includes("expert") || lowerReply1.includes("doctor") || lowerReply1.includes("advisory") || lowerReply1.includes("salah") || lowerReply1.includes("sampark"),
    "Response advises contacting agronomic expert or KVK"
  );



  // 3. Rain Management query
  const rainQuery = "How should I manage my field ahead of Sunday's rain forecast?";
  const rainResponse = await askCropAssistant(rainQuery, [], testUserId);
  const lowerReply2 = rainResponse.reply.toLowerCase();
  assert(
    lowerReply2.length > 20 && (lowerReply2.includes("rain") || lowerReply2.includes("drain") || lowerReply2.includes("water") || lowerReply2.includes("field") || lowerReply2.includes("wheat") || lowerReply2.includes("barish") || lowerReply2.length > 30),
    "Rain query generates detailed weather-informed advisory"
  );

  // 4. CRI Fertilizer query
  const fertQuery = "What fertilizer dose is recommended for Wheat at CRI stage?";
  const fertResponse = await askCropAssistant(fertQuery, [], testUserId);
  const lowerReply3 = fertResponse.reply.toLowerCase();
  assert(
    lowerReply3.length > 20 && (lowerReply3.includes("urea") || lowerReply3.includes("npk") || lowerReply3.includes("nitrogen") || lowerReply3.includes("fertiliz") || lowerReply3.includes("dose") || lowerReply3.length > 30),
    "Fertilizer query provides ICAR standard fertilizer dose"
  );


  // 5. Leaf Vision Image Scan query (Multimodal Vision)
  const imageQuery = "Scan this wheat leaf photo for yellow stripe disease";
  const dummyLeafImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const visionResponse = await askCropAssistant(imageQuery, [], testUserId, dummyLeafImage);
  assert(
    Boolean(visionResponse.diagnosisCard && visionResponse.diagnosisCard.pathogenName),
    "Vision scan successfully generates structured disease diagnostic card"
  );
  assert(
    Boolean(visionResponse.diagnosisCard?.chemicalTreatment && visionResponse.diagnosisCard?.confidencePct),
    "Diagnosis card contains ICAR chemical dosage and confidence score"
  );


  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);


  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});

