import { google } from "googleapis";
import fs from "fs";
import path from "path";

/**
 * GOOGLE INDEXING API BULK SUBMISSION SCRIPT
 * Submits ALL 40 pages of AtoZ Works to Google Search Index.
 */

const KEY_FILE = path.join(process.cwd(), "scripts", "service-account.json");

// Full list of ALL 40 website pages (Static pages + All 37 Services)
const URLS_TO_INDEX = [
  // Static Core Pages
  "https://www.atozworks.co",
  "https://www.atozworks.co/bookings",
  "https://www.atozworks.co/partner/register",

  // Category 1: Home Maintenance & Repairs
  "https://www.atozworks.co/services/plumbing",
  "https://www.atozworks.co/services/electrical",
  "https://www.atozworks.co/services/painting",
  "https://www.atozworks.co/services/tiles-work",
  "https://www.atozworks.co/services/flower-works",
  "https://www.atozworks.co/services/wood-works",
  "https://www.atozworks.co/services/tv-mechanic",
  "https://www.atozworks.co/services/ac-repair",
  "https://www.atozworks.co/services/fridge-mechanic",
  "https://www.atozworks.co/services/ro-mechanic",
  "https://www.atozworks.co/services/system-service",

  // Category 2: Vehicles & Personal Care
  "https://www.atozworks.co/services/mobile-service",
  "https://www.atozworks.co/services/bike-mechanic",
  "https://www.atozworks.co/services/car-mechanic",
  "https://www.atozworks.co/services/bike-washing",
  "https://www.atozworks.co/services/car-washing",
  "https://www.atozworks.co/services/hair-cut-beautician",
  "https://www.atozworks.co/services/food-delivery",
  "https://www.atozworks.co/services/medicine-delivery",
  "https://www.atozworks.co/services/vegetable-delivery",
  "https://www.atozworks.co/services/photo-shoot",
  "https://www.atozworks.co/services/welding-works",

  // Category 3: Logistics & Business
  "https://www.atozworks.co/services/house-shifting",
  "https://www.atozworks.co/services/home-cleaning",
  "https://www.atozworks.co/services/office-cleaning",
  "https://www.atozworks.co/services/loading",
  "https://www.atozworks.co/services/unloading",
  "https://www.atozworks.co/services/govt-document-broker",
  "https://www.atozworks.co/services/real-estate-mediator",
  "https://www.atozworks.co/services/tailor",
  "https://www.atozworks.co/services/marriage-works",
  "https://www.atozworks.co/services/mall-booking",
  "https://www.atozworks.co/services/flower-design",

  // Category 4: Events & Supplies
  "https://www.atozworks.co/services/catering-department",
  "https://www.atozworks.co/services/car-booking",
  "https://www.atozworks.co/services/auto-booking",
  "https://www.atozworks.co/services/vegetables-wholesale",
  "https://www.atozworks.co/services/grocery-wholesale",
  "https://www.atozworks.co/services/drums",
  "https://www.atozworks.co/services/dress-rental",
  "https://www.atozworks.co/services/welcome-givers",
  "https://www.atozworks.co/services/dj-service",
  "https://www.atozworks.co/services/dance-program",
  "https://www.atozworks.co/services/singers-vocalists"
];

async function submitUrlsForIndexing() {
  console.log(`🚀 Starting Google Indexing API Bulk Submission for ALL ${URLS_TO_INDEX.length} Pages...\n`);

  if (!fs.existsSync(KEY_FILE)) {
    console.error("❌ ERROR: 'service-account.json' not found!");
    console.log(`Please place your Google Cloud Service Account JSON key at:\n   ${KEY_FILE}\n`);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });

  const authClient = await auth.getClient();
  const indexing = google.indexing({
    version: "v3",
    auth: authClient,
  });

  let successCount = 0;
  let failCount = 0;

  for (const url of URLS_TO_INDEX) {
    try {
      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: "URL_UPDATED",
        },
      });

      if (response.status === 200) {
        console.log(`✅ Submitting: ${url} -> SUCCESS`);
        successCount++;
      } else {
        console.log(`⚠️ Submitting: ${url} -> Status ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Submitting: ${url} -> FAILED (${error.message})`);
      failCount++;
    }
  }

  console.log("\n------------------------------------------------");
  console.log(`📊 Summary: ${successCount} Submitted | ${failCount} Failed | Total: ${URLS_TO_INDEX.length}`);
  console.log("------------------------------------------------\n");
}

submitUrlsForIndexing();
