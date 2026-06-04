# Usage Guide — Interchangeable Parts List Creator

## Table of Contents

1. [Getting Started](#getting-started)
2. [Input File Format](#input-file-format)
3. [Uploading Files](#uploading-files)
4. [Understanding DIN Classifications](#understanding-din-classifications)
5. [Analyzing Parts](#analyzing-parts)
6. [Reading the Results](#reading-the-results)
7. [Export Options](#export-options)
8. [Troubleshooting](#troubleshooting)

---

## Getting Started

Open `Code.html` in any modern web browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).

No installation, server, or internet connection is required after loading the page.

---

## Input File Format

### CSV Files

- Delimiter: **semicolons** (`;`)
- First row: column headers (see below)
- Encoding: UTF-8 recommended

Example (`pump_a.csv`):
```csv
Part No.;Designation;Material Number;Quantity;Quantity Unit;Weight;Weight Unit;Serial No.
100.01;Pump casing;MA-100-01;1;Piece;45.2;kg;SN-20241001
210.01;Impeller;MA-210-01;1;Piece;3.5;kg;SN-20241001
321.00;Rolling bearing;MA-321-00;2;Piece;0.8;kg;SN-20241001
433.01;Mechanical seal;MA-433-01;1;Set;0.5;kg;SN-20241001
411.00;O-ring set;MA-411-00;1;Set;0.1;kg;SN-20241001
```

### Excel Files (.xlsx / .xls)

- The tool automatically detects the header row (scans the first 20 rows for `Part No.` or `PTT`).
- Multiple sheets: only the **first sheet** is read.

### Required Columns

| Column Name | Aliases | Description |
|-------------|---------|-------------|
| `Part No.` | `PTT` | Unique part identifier — **required** |
| `Designation` | `Name` | Part name / description |
| `Material Number` | `Material` | Internal stock/material number |
| `Quantity` | — | Number of this part per pump |
| `Quantity Unit` | — | Unit (Piece, Set, etc.) |
| `Weight` | — | Weight per unit |
| `Weight Unit` | — | kg, lbs, etc. |
| `Serial No.` | `Serial-No.` | Pump serial number (auto-detected) |
| `Year` | — | Manufacturing year |
| `Description` | `Size` | Additional description / size info |

---

## Uploading Files

1. **Click "Choose Files"** or **drag and drop** files onto the upload area.
2. Accepted formats: `.csv`, `.xlsx`, `.xls`
3. Maximum file size: **10 MB** per file
4. Each file represents **one pump** (or pump type).
5. After uploading, fill in:
   - **Pump Label** — e.g., P-1001, P-1002 (used in the comparison matrix)
   - **Quantity** — how many identical pumps this file represents
   - **Model** — auto-detected from the file, or enter manually
   - **Serial No.** — auto-detected from the file, or enter manually
   - **Location** — optional, e.g., "Building A – Cooling Circuit"

---

## Understanding DIN Classifications

Parts are automatically classified based on their designation and part number:

| Category | Examples | DIN Stock Rule |
|----------|---------|----------------|
| **Shafts** | Pump shaft, shaft sleeve | 1–2 pcs based on fleet size |
| **Impellers** | Single/multi-stage impeller | 1–2 pcs based on fleet size |
| **Bearings** | Ball bearing, rolling bearing | 1–3 pcs based on fleet size |
| **Seals** | Mechanical seal, O-ring, gasket | 4–12 sets based on fleet size |
| **Wear Parts** | Wear ring, protection sleeve | 2–4 pcs based on fleet size |
| **Accessories** | Coupling, miscellaneous | Standard per pump |

---

## Analyzing Parts

1. Upload at least one file.
2. (Optional) Enable **DIN 24296 Table 32 optimization** with the toggle switch.
   - When enabled, common parts found in multiple pumps use the official Table 32 quantities.
   - When disabled, quantities are calculated as `qty per pump × number of pumps`.
3. Click **Analyze Parts**.
4. The tool will parse all files, consolidate common parts, and display results.

---

## Reading the Results

### Statistics Cards
- **Total Pumps** — fleet size used for Table 32 calculations
- **Unique Parts** — total distinct parts across all pumps
- **Common Parts** — parts found in 2+ pumps (interchangeable candidates)
- **Parts Saved** — quantity reduction achieved by DIN 24296 optimization
- **Recommended Qty** — total stock recommended by DIN 24296
- **Total Weight** — estimated total weight of recommended stock

### Quantity Columns
| Column | Meaning |
|--------|---------|
| **Qty/Pump** | Quantity of this part installed in one pump |
| **Standard Qty** | `Qty/Pump × Total Pumps` (no optimization) |
| **DIN 24296 Qty** | Table 32 recommended quantity |
| **Savings** | `Standard Qty − DIN 24296 Qty` |

### Color Coding
- 🟡 **Yellow background** (`quantity-highlight`) — standard quantity without optimization
- 🟢 **Green background** (`quantity-optimized`) — optimized quantity per DIN 24296 Table 32

### Tabs
| Tab | Content |
|-----|---------|
| **All Parts** | Complete parts list from all pumps |
| **⭐ Common Spares** | Parts shared by 2+ pumps + availability matrix |
| **Shafts / Impellers / etc.** | Parts filtered by category |
| **Pump Comparison** | Cross-reference matrix: which parts are in which pump |

---

## Export Options

| Button | Format | Contents |
|--------|--------|---------|
| **Export Excel (All Parts)** | .xlsx | Summary sheet + all parts list |
| **Export CSV** | .csv | All parts, all columns |
| **Common Spares Report** | .xlsx | Summary + common parts detail |
| **Comparison Matrix** | .xlsx | Overview + full pump × part matrix |
| **Print / PDF** | Browser print | Print-optimized view (hides UI controls) |

All Excel exports use ISO date stamps in the filename, e.g.:
`Interchangeable_Parts_DIN24296_3pumps_2025-06-01.xlsx`

---

## Troubleshooting

### "File not supported"
- Ensure the file extension is `.csv`, `.xlsx`, or `.xls`.
- Rename files if the extension is missing.

### "File exceeds 10 MB limit"
- Split large files or remove unused columns before uploading.

### No parts appear after analysis
- Check that your file has a `Part No.` or `PTT` column with non-empty values.
- Verify the CSV uses semicolons (`;`) as delimiter.
- For Excel files, ensure the header row is within the first 20 rows.

### DIN 24296 Qty equals Standard Qty
- The optimization only applies to **common parts** (found in 2+ pumps).
- Ensure the toggle switch is enabled before clicking Analyze.
- Verify that multiple files are uploaded with matching `Material Number` values.

### Parts are not classified correctly
- The classifier uses the **Designation** column to detect part types.
- Ensure designations include keywords like `shaft`, `impeller`, `bearing`, `seal`, `wear ring`.
- Parts not matching any keyword are classified as **Accessories**.
