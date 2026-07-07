const fs = require("fs");
const path = require("path");

/**
 * Converts Firebase Realtime Database export to comprehensive formats
 * Includes FULL pumpLogs and phReadings data for ML training
 */

// Read the Firebase export JSON
const firebaseExportPath =
  process.argv[2] ||
  "../../../Downloads/eco-sterile-default-rtdb-export (1).json";
const jsonData = JSON.parse(fs.readFileSync(firebaseExportPath, "utf-8"));

// Format 1: Complete Hierarchical (no flattening) - Best for ML
function generateCompleteHierarchical(users) {
  const result = {};
  Object.keys(users).forEach((userId) => {
    result[userId] = users[userId]; // Keep full nested structure
  });
  return result;
}

// Format 2: Flattened with readings array
function generateFlattenedWithReadings(users) {
  const result = [];

  Object.keys(users).forEach((userId) => {
    const userData = users[userId];
    const userRecord = {
      userId: userId,

      // Location data
      location: userData.location || {},

      // Profile data
      profile: userData.profile || {},

      // Device data
      device: userData.device || {},

      // Settings data
      settings: userData.settings || {},

      // PH Readings - FULL DATA
      phReadings: userData.phReadings ? Object.values(userData.phReadings) : [],
      phReadingsCount: userData.phReadings
        ? Object.keys(userData.phReadings).length
        : 0,

      // Pump Logs - FULL DATA
      pumpLogs: userData.pumpLogs ? Object.values(userData.pumpLogs) : [],
      pumpLogsCount: userData.pumpLogs
        ? Object.keys(userData.pumpLogs).length
        : 0,
    };

    result.push(userRecord);
  });

  return result;
}

// Format 3: CSV Friendly (exploded view - one row per reading)
function generateReadingsCSV(users) {
  let csvData = [];

  Object.keys(users).forEach((userId) => {
    const userData = users[userId];
    const profile = userData.profile || {};
    const location = userData.location || {};
    const settings = userData.settings || {};

    // Add PH Readings as individual rows
    if (userData.phReadings && Object.keys(userData.phReadings).length > 0) {
      Object.entries(userData.phReadings).forEach(([readingId, reading]) => {
        csvData.push({
          userId,
          userName: profile.name || "",
          email: profile.email || "",
          provider: profile.provider || "",
          country: location.country || "",
          state: location.state || "",
          district: location.district || "",
          taluka: location.taluka || "",
          dataType: "PHReading",
          dataId: readingId,
          timestamp: reading.timestamp || "",
          value: reading.value || "",
          unit: "pH",
          theme: settings.theme || "",
          autoPump: settings.autoPump !== undefined ? settings.autoPump : "",
          preferredCrop: settings.preferredCrop || "",
        });
      });
    }

    // Add Pump Logs as individual rows
    if (userData.pumpLogs && Object.keys(userData.pumpLogs).length > 0) {
      Object.entries(userData.pumpLogs).forEach(([logId, log]) => {
        csvData.push({
          userId,
          userName: profile.name || "",
          email: profile.email || "",
          provider: profile.provider || "",
          country: location.country || "",
          state: location.state || "",
          district: location.district || "",
          taluka: location.taluka || "",
          dataType: "PumpLog",
          dataId: logId,
          timestamp: log.timestamp || "",
          value: log.status || log.pumpedAmount || "",
          unit: log.pumpedAmount ? "liters" : "status",
          theme: settings.theme || "",
          autoPump: settings.autoPump !== undefined ? settings.autoPump : "",
          preferredCrop: settings.preferredCrop || "",
        });
      });
    }
  });

  if (csvData.length === 0) return "";

  // Generate CSV
  const headers = Object.keys(csvData[0]);
  const headerRow = headers.join(",");
  const dataRows = csvData.map((row) =>
    headers
      .map((header) => {
        const value = row[header] !== undefined ? row[header] : "";
        const stringValue = String(value);
        if (
          stringValue.includes(",") ||
          stringValue.includes('"') ||
          stringValue.includes("\n")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(","),
  );

  return [headerRow, ...dataRows].join("\n");
}

// Format 4: NDJSON (Newline Delimited JSON) - Good for streaming/ML
function generateNDJSON(users) {
  let ndjson = "";

  Object.keys(users).forEach((userId) => {
    const userData = users[userId];
    const record = {
      userId,
      profile: userData.profile || {},
      location: userData.location || {},
      settings: userData.settings || {},
      phReadings: userData.phReadings ? Object.values(userData.phReadings) : [],
      pumpLogs: userData.pumpLogs ? Object.values(userData.pumpLogs) : [],
    };
    ndjson += JSON.stringify(record) + "\n";
  });

  return ndjson;
}

// Process all users
const users = jsonData.users || {};
console.log(`\n📊 Processing ${Object.keys(users).length} users...\n`);

// Calculate statistics
let totalReadings = 0;
let totalLogs = 0;
Object.keys(users).forEach((userId) => {
  if (users[userId].phReadings)
    totalReadings += Object.keys(users[userId].phReadings).length;
  if (users[userId].pumpLogs)
    totalLogs += Object.keys(users[userId].pumpLogs).length;
});

console.log(`📈 Statistics:`);
console.log(`   Total Users: ${Object.keys(users).length}`);
console.log(`   Total PH Readings: ${totalReadings}`);
console.log(`   Total Pump Logs: ${totalLogs}`);
console.log(`   Total Data Points: ${totalReadings + totalLogs}\n`);

// Write outputs
const outputDir = path.dirname(firebaseExportPath);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// 1. Complete Hierarchical JSON (Full structure, best for ML)
const completeJsonPath = path.join(
  outputDir,
  `ecosterile-complete-${timestamp}.json`,
);
const completeData = generateCompleteHierarchical(users);
fs.writeFileSync(
  completeJsonPath,
  JSON.stringify(completeData, null, 2),
  "utf-8",
);
const completeSize = (fs.statSync(completeJsonPath).size / 1024 / 1024).toFixed(
  2,
);
console.log(`✅ Complete JSON (Full nested data): ${completeJsonPath}`);
console.log(`   File size: ${completeSize} MB\n`);

// 2. Flattened with Readings Array
const flattenedJsonPath = path.join(
  outputDir,
  `ecosterile-flattened-${timestamp}.json`,
);
const flattenedData = generateFlattenedWithReadings(users);
fs.writeFileSync(
  flattenedJsonPath,
  JSON.stringify(flattenedData, null, 2),
  "utf-8",
);
const flattenedSize = (
  fs.statSync(flattenedJsonPath).size /
  1024 /
  1024
).toFixed(2);
console.log(`✅ Flattened JSON (With readings array): ${flattenedJsonPath}`);
console.log(`   File size: ${flattenedSize} MB\n`);

// 3. Readings CSV (Exploded view - one row per reading)
const readingsCSVPath = path.join(
  outputDir,
  `ecosterile-readings-${timestamp}.csv`,
);
const readingsCSV = generateReadingsCSV(users);
fs.writeFileSync(readingsCSVPath, readingsCSV, "utf-8");
const readingsCSVSize = (
  fs.statSync(readingsCSVPath).size /
  1024 /
  1024
).toFixed(2);
console.log(`✅ Readings CSV (All readings as rows): ${readingsCSVPath}`);
console.log(`   File size: ${readingsCSVSize} MB`);
console.log(`   Total rows: ${readingsCSV.split("\n").length - 1}\n`);

// 4. NDJSON (Best for streaming/ML frameworks)
const ndjsonPath = path.join(outputDir, `ecosterile-ml-${timestamp}.ndjson`);
const ndjsonData = generateNDJSON(users);
fs.writeFileSync(ndjsonPath, ndjsonData, "utf-8");
const ndjsonSize = (fs.statSync(ndjsonPath).size / 1024 / 1024).toFixed(2);
console.log(`✅ NDJSON (Newline Delimited, ML-ready): ${ndjsonPath}`);
console.log(`   File size: ${ndjsonSize} MB\n`);

// Summary
console.log(`\n📦 Export Summary:`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Total files created: 4`);
console.log(
  `Total data included: ${completeSize + flattenedSize + readingsCSVSize + ndjsonSize} MB`,
);
console.log(`\n✨ Recommended for ML Training:`);
console.log(`   - Use: ecosterile-ml-${timestamp}.ndjson`);
console.log(`   - Or: ecosterile-complete-${timestamp}.json`);
console.log(`\n📋 Recommended for Analysis:`);
console.log(`   - Use: ecosterile-readings-${timestamp}.csv`);
console.log(`\n🎯 All files ready in: ${outputDir}`);
