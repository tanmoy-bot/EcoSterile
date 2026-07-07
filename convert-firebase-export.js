const fs = require("fs");
const path = require("path");

/**
 * Converts Firebase Realtime Database export to CSV and JSON formats
 * Flattens nested user data for better readability
 */

// Read the Firebase export JSON
const firebaseExportPath =
  process.argv[2] ||
  "../../../Downloads/eco-sterile-default-rtdb-export (1).json";
const jsonData = JSON.parse(fs.readFileSync(firebaseExportPath, "utf-8"));

// Flatten user data function
function flattenUser(userId, userData) {
  const flattened = {
    userId: userId,
  };

  // Flatten location
  if (userData.location) {
    Object.keys(userData.location).forEach((key) => {
      flattened[`location_${key}`] = userData.location[key];
    });
  }

  // Flatten profile
  if (userData.profile) {
    Object.keys(userData.profile).forEach((key) => {
      flattened[`profile_${key}`] = userData.profile[key];
    });
  }

  // Flatten device info
  if (userData.device) {
    Object.keys(userData.device).forEach((key) => {
      flattened[`device_${key}`] = userData.device[key];
    });
  }

  // Flatten settings
  if (userData.settings) {
    const settings = userData.settings;
    if (typeof settings === "object" && settings !== null) {
      Object.keys(settings).forEach((key) => {
        if (typeof settings[key] === "object") {
          Object.keys(settings[key]).forEach((subKey) => {
            flattened[`settings_${key}_${subKey}`] = settings[key][subKey];
          });
        } else {
          flattened[`settings_${key}`] = settings[key];
        }
      });
    }
  }

  // Count readings and logs
  flattened["phReadings_count"] = userData.phReadings
    ? Object.keys(userData.phReadings).length
    : 0;
  flattened["pumpLogs_count"] = userData.pumpLogs
    ? Object.keys(userData.pumpLogs).length
    : 0;

  return flattened;
}

// Process all users
const users = jsonData.users || {};
const flattenedUsers = [];
const allKeys = new Set();

// First pass: flatten all users and collect all keys
Object.keys(users).forEach((userId) => {
  const flatUser = flattenUser(userId, users[userId]);
  flattenedUsers.push(flatUser);
  Object.keys(flatUser).forEach((key) => allKeys.add(key));
});

// Sort keys for consistent CSV column order
const sortedKeys = Array.from(allKeys).sort();

// Generate CSV
function generateCSV(data, keys) {
  const headers = keys.join(",");
  const rows = data.map((item) =>
    keys
      .map((key) => {
        const value = item[key] !== undefined ? item[key] : "";
        // Escape quotes and wrap in quotes if contains comma
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
  return [headers, ...rows].join("\n");
}

// Generate hierarchical JSON format (more readable)
function generateHierarchicalJSON(users) {
  const result = {};
  Object.keys(users).forEach((userId) => {
    result[userId] = {
      location: users[userId].location || {},
      profile: users[userId].profile || {},
      device: users[userId].device || {},
      settings: users[userId].settings || {},
      phReadings_count: users[userId].phReadings
        ? Object.keys(users[userId].phReadings).length
        : 0,
      pumpLogs_count: users[userId].pumpLogs
        ? Object.keys(users[userId].pumpLogs).length
        : 0,
    };
  });
  return result;
}

// Write outputs
const outputDir = path.dirname(firebaseExportPath);
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

// CSV output
const csvContent = generateCSV(flattenedUsers, sortedKeys);
const csvPath = path.join(
  outputDir,
  `ecosterile-users-export-${timestamp}.csv`,
);
fs.writeFileSync(csvPath, csvContent, "utf-8");
console.log(`✅ CSV exported: ${csvPath}`);

// Flattened JSON output
const flattenedJsonPath = path.join(
  outputDir,
  `ecosterile-users-flat-${timestamp}.json`,
);
fs.writeFileSync(
  flattenedJsonPath,
  JSON.stringify(flattenedUsers, null, 2),
  "utf-8",
);
console.log(`✅ Flattened JSON exported: ${flattenedJsonPath}`);

// Hierarchical JSON output
const hierarchicalJsonPath = path.join(
  outputDir,
  `ecosterile-users-hierarchical-${timestamp}.json`,
);
const hierarchicalData = generateHierarchicalJSON(users);
fs.writeFileSync(
  hierarchicalJsonPath,
  JSON.stringify(hierarchicalData, null, 2),
  "utf-8",
);
console.log(`✅ Hierarchical JSON exported: ${hierarchicalJsonPath}`);

// Summary
console.log(`\n📊 Summary:`);
console.log(`   Total users: ${flattenedUsers.length}`);
console.log(`   Total columns/fields: ${sortedKeys.length}`);
console.log(`   Files created: 3`);
