# API Documentation — Interchangeable Parts List Creator

All JavaScript is organized into seven modules (plain scripts, not ES modules).
Load order in `Code.html`:
`utils.js` → `fileHandler.js` → `dinClassifier.js` → `dataProcessor.js` → `exportManager.js` → `uiController.js` → `app.js`

---

## utils.js

General-purpose helper functions. All other modules depend on this file.

---

### `sanitizeString(str)`

Escapes HTML special characters to prevent XSS attacks.

**Parameters:**
- `str` {any} — Value to sanitize. Non-strings are coerced with `String()`.

**Returns:** {string} — Escaped string safe for insertion into `innerHTML`.

**Example:**
```js
sanitizeString('<script>alert(1)</script>');
// → '&lt;script&gt;alert(1)&lt;/script&gt;'
```

---

### `cleanValue(val)`

Returns `val` as a trimmed string, or `''` if the value is null, undefined, or empty.

**Parameters:**
- `val` {any}

**Returns:** {string}

---

### `isValidFileExtension(filename)`

Returns `true` if the filename ends with `.csv`, `.xlsx`, or `.xls`.

**Parameters:**
- `filename` {string}

**Returns:** {boolean}

---

### `isValidFileSize(file, maxMB = 10)`

Returns `true` if the file size is at or below `maxMB` megabytes.

**Parameters:**
- `file` {File} — A browser `File` object.
- `maxMB` {number} — Maximum allowed size in MB. Default: `10`.

**Returns:** {boolean}

---

### `isValidPumpLabel(label)`

Returns `true` if the label is non-empty and ≤ 100 characters.

**Parameters:**
- `label` {string}

**Returns:** {boolean}

---

### `isValidQuantity(n)`

Returns `true` if `n` is a finite positive number.

**Parameters:**
- `n` {any}

**Returns:** {boolean}

---

### `formatFileSize(bytes)`

Converts a byte count to a human-readable string (B, KB, MB, GB).

**Parameters:**
- `bytes` {number}

**Returns:** {string} e.g. `"1.5 MB"`

---

### `formatDate(isoString)`

Formats an ISO date string to `DD.MM.YYYY`.

**Parameters:**
- `isoString` {string}

**Returns:** {string}

---

### `formatDateISO()`

Returns the current date in `YYYY-MM-DD` format.

**Returns:** {string}

---

### `formatPercent(value, decimals = 1)`

Formats a number as a percentage string.

**Parameters:**
- `value` {number} — Decimal value, e.g. `0.25`.
- `decimals` {number} — Decimal places. Default: `1`.

**Returns:** {string} e.g. `"25.0%"`

---

### `sortByKey(array, key, ascending = true)`

Returns a new array sorted by the given key.

**Parameters:**
- `array` {Array<Object>}
- `key` {string}
- `ascending` {boolean}

**Returns:** {Array<Object>}

---

### `debounce(func, wait)`

Returns a debounced version of `func` that waits `wait` ms after the last call.

**Parameters:**
- `func` {Function}
- `wait` {number} — Milliseconds.

**Returns:** {Function}

---

### `throttle(func, limit)`

Returns a throttled version of `func` that fires at most once per `limit` ms.

**Parameters:**
- `func` {Function}
- `limit` {number} — Milliseconds.

**Returns:** {Function}

---

### `escapeCSV(value)`

Wraps a value in double quotes and escapes internal double quotes for CSV output.

**Parameters:**
- `value` {any}

**Returns:** {string}

---

## fileHandler.js

Handles file upload, validation, parsing (CSV and Excel), and pump data management.

**Global state used:**
- `window.uploadedFiles` — `Array<{file, label, qty, model, serialNo, location}>`

---

### `processFiles(files)`

Validates and registers an array of `File` objects. Shows notifications for invalid files. Calls `renderFileItem()` for each accepted file.

**Parameters:**
- `files` {FileList | Array<File>}

---

### `renderFileItem(index)`

Renders the UI card for the file at `uploadedFiles[index]`.

**Parameters:**
- `index` {number}

---

### `removeFile(index)`

Removes the file at `index` from `uploadedFiles` and re-renders all file items.

**Parameters:**
- `index` {number}

---

### `updatePumpData(index, field, value)`

Updates a field on `uploadedFiles[index]` after sanitizing user input.

**Parameters:**
- `index` {number}
- `field` {string} — One of `'label'`, `'qty'`, `'model'`, `'serialNo'`, `'location'`.
- `value` {any}

---

### `parseFile(entry)`

Parses a single file entry. Returns a `Promise<Array<Object>>` resolving to the normalized rows.

**Parameters:**
- `entry` {Object} — Entry from `uploadedFiles`.

**Returns:** {Promise<Array<Object>>}

---

### `parseCSV(file)`

Uses PapaParse to parse a CSV file (auto-detects delimiter).

**Parameters:**
- `file` {File}

**Returns:** {Promise<Array<Object>>}

---

### `parseExcel(file)`

Uses SheetJS to parse an Excel file. Searches the first 20 rows for a header row containing `Part No.` or `PTT`.

**Parameters:**
- `file` {File}

**Returns:** {Promise<Array<Object>>}

---

### `normalizeRow(row)`

Maps a CSV row (from PapaParse) to the canonical part object format.

**Parameters:**
- `row` {Object} — Raw parsed row.

**Returns:** {Object} — Canonical part object.

---

### `normalizeExcelRow(row)`

Maps a SheetJS row to the canonical part object format.

**Parameters:**
- `row` {Object}

**Returns:** {Object}

---

### `getCellValue(row, ...keys)`

Returns the first non-empty cell value from a row for any of the given keys (case-insensitive).

**Parameters:**
- `row` {Object}
- `...keys` {string}

**Returns:** {string}

---

### `initDragAndDrop(dropZoneEl, fileInputEl)`

Attaches drag-and-drop event listeners to `dropZoneEl`. Falling back to click on `fileInputEl`.

**Parameters:**
- `dropZoneEl` {HTMLElement}
- `fileInputEl` {HTMLInputElement}

---

## dinClassifier.js

DIN 24296 Table 32 lookup and part-type classification.

---

### `DIN_24296_TABLE`

Constant object mapping part types to lookup arrays indexed by fleet size.

Structure:
```js
{
  shaft:    [null, null, 1, 1, 1, 2, null, 2, 2, 20],
  impeller: [null, null, 1, 1, 1, 2, null, 2, 2, 20],
  bearing:  [null, null, 1, 1, 2, 2, null, 3, 3, 25],
  seal:     [null, null, 4, 6, 8, 8, null, 12, 12, 150],
  wearring: [null, null, 2, 2, 2, 3, null, 4, 4, 30],
  coupling: [null, null, 1, 1, 2, 2, null, 3, 3, 20]
}
```
Indices 2–5 are for fleets of exactly 2–5 pumps.
Index 7 is for 6–7 pumps; index 8 for 8–9 pumps.
Index 9 is a decimal multiplier used for 10+ pumps (e.g. 0.20 = 20% of fleet).

---

### `getDIN24296RecommendedQty(partType, numberOfPumps)`

Looks up the DIN 24296 recommended quantity for a given part type and fleet size.

**Parameters:**
- `partType` {string} — One of the keys in `DIN_24296_TABLE`, or `'unknown'`.
- `numberOfPumps` {number} — Fleet size (integer ≥ 2).

**Returns:** {number} — Recommended stock quantity.

---

### `categorizePart(designation)`

Classifies a part designation string into a DIN 24296 part type.

**Parameters:**
- `designation` {string} — Part name or description.

**Returns:** {string} — One of `'shaft'`, `'impeller'`, `'bearing'`, `'seal'`, `'wearring'`, `'coupling'`, `'unknown'`.

---

### `getDINPartType(partType)`

Returns a human-readable label for a DIN part type key.

**Parameters:**
- `partType` {string}

**Returns:** {string}

---

## dataProcessor.js

Data analysis, part consolidation, interchangeability detection, and filtering.

---

### `processAndCategorizeParts(parsedDataArray, pumpLabels, pumpQtys, optimizeEnabled)`

Main processing function. Consolidates rows from multiple pumps into a unified parts list.

**Parameters:**
- `parsedDataArray` {Array<Array<Object>>} — One inner array per pump file.
- `pumpLabels` {Array<string>}
- `pumpQtys` {Array<number>}
- `optimizeEnabled` {boolean}

**Returns:** {Object}
```js
{
  allParts:         Array<Object>,   // consolidated part rows
  pumpSummaries:    Array<Object>,   // per-pump summary
  statistics:       Object,          // computed statistics
  pumpLabels:       Array<string>
}
```

**Part object shape:**
```js
{
  partNo, materialNumber, designation, material,
  quantityPerPump, quantityUnit, weight, weightUnit,
  serialNo, year, description,
  pumpSources,     // Array<string> — labels of pumps containing this part
  numberOfPumps,   // count of pumps with this part
  isCommon,        // true if numberOfPumps >= 2
  dinPartType,     // DIN 24296 category key
  standardQty,     // qty per pump × total pumps
  recommendedQty,  // DIN 24296 Table 32 value (or standardQty if not optimizing)
  savings          // standardQty - recommendedQty
}
```

---

### `applyDataFilters(parts, searchTerm, categoryFilter, commonOnlyFilter)`

Filters a parts array by search term, category, and commonality.

**Parameters:**
- `parts` {Array<Object>}
- `searchTerm` {string}
- `categoryFilter` {string} — `'all'`, `'shafts'`, `'impellers'`, `'bearings'`, `'seals'`, `'wear-parts'`, `'accessories'`
- `commonOnlyFilter` {boolean}

**Returns:** {Array<Object>}

---

### `computeStatistics(allParts, totalPumps)`

Calculates summary statistics from the consolidated parts list.

**Parameters:**
- `allParts` {Array<Object>}
- `totalPumps` {number}

**Returns:** {Object}
```js
{
  totalPumps, uniqueParts, commonParts, commonPercent,
  totalStandardQty, totalRecommendedQty, partsSaved, savingsPercent,
  totalWeight, categoryCounts
}
```

---

## exportManager.js

Excel, CSV, and print export functions. Uses SheetJS for `.xlsx` output.

---

### `exportToExcel(allParts, pumpLabels, stats)`

Exports the full parts list to a formatted Excel file with two sheets: Summary and All Parts.

**Parameters:**
- `allParts` {Array<Object>}
- `pumpLabels` {Array<string>}
- `stats` {Object}

---

### `exportToCSV(allParts)`

Exports all parts to a semicolon-delimited CSV file.

**Parameters:**
- `allParts` {Array<Object>}

---

### `exportCommonSparesReport(allParts, pumpLabels, stats)`

Exports a report focused on interchangeable (common) parts only.

**Parameters:**
- `allParts` {Array<Object>}
- `pumpLabels` {Array<string>}
- `stats` {Object}

---

### `exportComparisonMatrix(allParts, pumpLabels)`

Exports a pump × part matrix showing which pumps contain which parts.

**Parameters:**
- `allParts` {Array<Object>}
- `pumpLabels` {Array<string>}

---

### `printReport()`

Opens the browser print dialog (uses `window.print()`). Print-specific CSS hides UI controls.

---

### `downloadTextFile(content, filename, mimeType)`

Helper that creates a temporary `<a>` element to trigger a file download.

**Parameters:**
- `content` {string}
- `filename` {string}
- `mimeType` {string}

---

## uiController.js

All DOM rendering and UI state management functions.

---

### `showNotification(message, type = 'info', duration = 4000)`

Displays a toast notification.

**Parameters:**
- `message` {string}
- `type` {string} — `'success'`, `'error'`, `'warning'`, `'info'`
- `duration` {number} — Milliseconds before auto-dismiss. Default: `4000`.

---

### `updateButtons()`

Enables or disables the Analyze and Export buttons based on whether files are uploaded.

---

### `showConfigurationSections()`

Shows the pump configuration section after files are uploaded.

---

### `switchTab(tabId)`

Activates the specified tab panel and updates tab button states.

**Parameters:**
- `tabId` {string} — e.g. `'tab-all'`, `'tab-common'`, `'tab-shafts'`

---

### `displayResults(data)`

Main render function. Called after analysis completes. Orchestrates all sub-render calls.

**Parameters:**
- `data` {Object} — Result from `processAndCategorizeParts()`.

---

### `displayPumpSummary(pumpSummaries)`

Renders the pump summary cards.

**Parameters:**
- `pumpSummaries` {Array<Object>}

---

### `displayDINComplianceInfo(stats)`

Renders the DIN 24296 compliance summary box.

**Parameters:**
- `stats` {Object}

---

### `displaySavingsCard(stats)`

Renders the potential savings card.

**Parameters:**
- `stats` {Object}

---

### `displayStatistics(stats)`

Updates the statistics cards (total pumps, unique parts, common parts, etc.).

**Parameters:**
- `stats` {Object}

---

### `displayCommonSparesTab(allParts, pumpLabels)`

Renders the Common Spares tab content.

**Parameters:**
- `allParts` {Array<Object>}
- `pumpLabels` {Array<string>}

---

### `displayCommonSparesMatrix(commonParts, pumpLabels)`

Renders the interchangeability matrix table.

**Parameters:**
- `commonParts` {Array<Object>}
- `pumpLabels` {Array<string>}

---

### `displayPartsTable(parts, tableId)`

Renders the parts list into the table with id `tableId`.

**Parameters:**
- `parts` {Array<Object>}
- `tableId` {string}

---

### `displayComparison(allParts, pumpLabels)`

Renders the pump comparison tab.

**Parameters:**
- `allParts` {Array<Object>}
- `pumpLabels` {Array<string>}

---

### `updateCategoryFilter(allParts)`

Populates the category filter dropdown based on which categories have parts.

**Parameters:**
- `allParts` {Array<Object>}

---

## app.js

Application entry point. Wires all modules together on `DOMContentLoaded`.

---

### `handleAnalyze()`

Main handler for the Analyze button.
1. Validates that files are uploaded.
2. Calls `parseFile()` for each entry in `uploadedFiles`.
3. Calls `processAndCategorizeParts()`.
4. Calls `displayResults()`.
5. Shows success/error notifications.

---

### `handleClear()`

Resets the entire application state: clears `uploadedFiles`, hides results, resets UI.

---

### `handleFilterChange()`

Called on search input and filter dropdown changes (debounced 300 ms).
Re-filters `window.currentAllParts` and re-renders the active tab.

---

### `onFilesChanged()`

Called whenever `uploadedFiles` changes. Updates button states and shows/hides the configuration section.
