# EcoSterile Data Export Guide

## 📊 Overview

The EcoSterile system now supports comprehensive data export for analysis, reporting, and ML training with **ALL user data** including:

- ✅ User profiles & locations
- ✅ Settings & preferences
- ✅ **ALL PH readings** (5,682 total)
- ✅ **ALL Pump logs** (3,570 total)

---

## 🌐 Admin Portal Export (Recommended)

### Access

- Navigate to **Admin Dashboard** → **📥 Export Data** button
- Or visit: `admin-data-export.html`

### Available Formats

#### 1. **Complete JSON** 📋

- **Best for:** Full data access, archival
- **Format:** Full nested structure
- **Size:** ~1.2 MB
- **Content:** Complete data hierarchy as-is from Firebase
- **Use case:** Complete backup, data migration

#### 2. **ML Training Data (NDJSON)** 🤖

- **Best for:** Machine Learning, TensorFlow, PyTorch
- **Format:** One JSON object per line
- **Size:** ~0.6 MB
- **Content:** User records with phReadings and pumpLogs as arrays
- **Use case:** ML model training, data science

```
{"userId":"...", "profile":{...}, "phReadings":[...], "pumpLogs":[...]}
{"userId":"...", "profile":{...}, "phReadings":[...], "pumpLogs":[...]}
```

#### 3. **Readings CSV** 📊

- **Best for:** Spreadsheet analysis, Excel
- **Format:** One row per reading/log event
- **Size:** ~1.5 MB
- **Rows:** 9,252 (all readings)
- **Columns:** userId, userName, email, dataType, timestamp, value, location, etc.
- **Use case:** Analysis in Excel/Sheets, pivot tables

#### 4. **Flattened JSON** 🔄

- **Best for:** API responses, custom processing
- **Format:** Array of users with readings arrays
- **Size:** ~0.97 MB
- **Content:** User-centric with phReadings/pumpLogs as arrays
- **Use case:** Custom dashboards, reports

---

## 🛠️ Command-Line Export Tool

For batch processing or automation:

```bash
# Convert Firebase export to all formats
node convert-firebase-export-ml.js "path/to/eco-sterile-default-rtdb-export.json"
```

**Outputs:**

- `ecosterile-complete-[timestamp].json` - Full nested data
- `ecosterile-ml-[timestamp].ndjson` - ML-ready format
- `ecosterile-readings-[timestamp].csv` - All readings as rows
- `ecosterile-flattened-[timestamp].json` - User-array format

---

## 📈 Data Statistics (Current)

| Metric             | Count    |
| ------------------ | -------- |
| Total Users        | 26       |
| PH Readings        | 5,682    |
| Pump Logs          | 3,570    |
| Total Data Points  | 9,252    |
| Combined File Size | ~4.27 MB |

---

## 🤖 ML Training Example

### Using NDJSON format with Python:

```python
import json
import pandas as pd

# Read NDJSON
with open('ecosterile-ml-*.ndjson', 'r') as f:
    data = [json.loads(line) for line in f]

# Convert to DataFrame
df = pd.json_normalize(data, record_path='phReadings',
                       meta=['userId', ['profile', 'name']])

# Use for ML
print(f"Records: {len(df)}")
print(f"Columns: {df.columns.tolist()}")
```

### Using CSV format with Pandas:

```python
import pandas as pd

# Read CSV
df = pd.read_csv('ecosterile-readings-*.csv')

# Filter by data type
ph_data = df[df['dataType'] == 'PHReading']
pump_data = df[df['dataType'] == 'PumpLog']

# Analyze
print(f"PH Readings: {len(ph_data)}")
print(f"Pump Logs: {len(pump_data)}")
```

---

## 🔒 Security & Privacy

### Client-Side Processing

- ✅ All exports generated **in your browser**
- ✅ No data sent to external servers
- ✅ No logs on server side
- ✅ Each export timestamped

### Data Compliance

- ✅ GDPR compliant (includes all PII as per structure)
- ✅ All user data included as stored
- ✅ Audit trail via Firebase logs
- ✅ No data filtering on export

---

## 📝 File Specifications

### CSV Columns

```
userId, userName, email, provider, country, state, district, taluka,
dataType, dataId, timestamp, value, unit, theme, autoPump, preferredCrop
```

### NDJSON Structure

```json
{
  "userId": "string",
  "profile": {
    "name": "string",
    "email": "string",
    "provider": "string",
    "completedAt": "ISO timestamp",
    "cropMinPH": "number",
    "cropMaxPH": "number",
    "currentCrop": "string"
  },
  "location": {
    "country": "string",
    "state": "string",
    "district": "string",
    "taluka": "string",
    "updatedAt": "ISO timestamp"
  },
  "settings": {
    "theme": "string",
    "autoPump": "boolean",
    "preferredCrop": "string",
    "notifications": {
      "phAlerts": "boolean",
      "systemUpdates": "boolean",
      "weeklySummary": "boolean"
    }
  },
  "phReadings": [
    {
      "timestamp": "ISO timestamp",
      "value": "number"
    }
  ],
  "pumpLogs": [
    {
      "timestamp": "ISO timestamp",
      "status": "string",
      "pumpedAmount": "number"
    }
  ]
}
```

---

## ❓ FAQ

**Q: Can I export only specific users?**
A: Currently exports all users. Contact admin for custom filtering.

**Q: How often can I export?**
A: Unlimited - exports are client-side only.

**Q: What if the file is too large?**
A: Use CSV format for spreadsheet tools, NDJSON for processing large datasets.

**Q: Is my data secure?**
A: Yes - exports happen in your browser, no server transmission.

**Q: Can I export historical data?**
A: Yes - Firebase exports include all historical records.

---

## 🚀 Next Steps

1. **Admin Portal** → Click "📥 Export Data" button
2. **Select format** based on your use case
3. **Download** automatically starts
4. **Process** with Excel, Python, or your analysis tool

---

**Last Updated:** January 19, 2026
**Version:** 1.0 - Full Data Export
