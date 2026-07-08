/**
 * pumpListApp.js — Pump List Creator
 * Parses CSV/Excel pump data files and generates a standardized
 * interchangeable pump list table (Pump No | Model | Serial No).
 *
 * KSB Pump Solutions
 */

'use strict';

/* ============================================================
   Application state
   ============================================================ */

/** @type {File[]} Raw File objects staged for processing. */
let stagedFiles = [];

/** @type {Array<{model: string, serialNo: string, sourceFile: string}>} Master pump list. */
let allPumps = [];

/* ============================================================
   Column-name normalisation
   Maps common header spelling variations → canonical field name.
   ============================================================ */

/**
 * Accepted header aliases for the "Model" column (case-insensitive, substring match).
 * @type {string[]}
 */
const MODEL_ALIASES = ['model', 'pump model', 'pump type', 'type', 'description'];

/**
 * Accepted header aliases for the "Serial No" column (case-insensitive, substring match).
 * @type {string[]}
 */
const SERIAL_ALIASES = ['serial no', 's/n', 'serial number', 'serial-no', 'sn'];

/**
 * Identify which column index corresponds to 'model' and which to 'serialNo'
 * from an array of raw header strings.
 *
 * @param {string[]} headers - Row of header strings (any casing).
 * @returns {{ modelIdx: number, serialIdx: number }}
 *          Index values are -1 when the column is not found.
 */
function resolveColumnIndices(headers) {
    let modelIdx  = -1;
    let serialIdx = -1;

    headers.forEach((h, i) => {
        if (!h) return;
        const norm = String(h).toLowerCase().trim();

        if (modelIdx === -1 && MODEL_ALIASES.some((alias) => norm.includes(alias))) {
            modelIdx = i;
        }
        if (serialIdx === -1 && SERIAL_ALIASES.some((alias) => norm.includes(alias))) {
            serialIdx = i;
        }
    });

    return { modelIdx, serialIdx };
}

/* ============================================================
   File parsing
   ============================================================ */

/**
 * Parse a File (CSV or Excel) into an array of pump records.
 *
 * @param {File} file
 * @returns {Promise<Array<{model: string, serialNo: string, sourceFile: string}>>}
 */
function parsePumpFile(file) {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) return parsePumpCSV(file);
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) return parsePumpExcel(file);
    return Promise.reject(new Error(`Unsupported file type: ${file.name}`));
}

/**
 * Parse a CSV file using PapaParse.
 * Tries semicolon delimiter first; falls back to auto-detect if no columns found.
 *
 * @param {File} file
 * @returns {Promise<Array<{model: string, serialNo: string, sourceFile: string}>>}
 */
function parsePumpCSV(file) {
    return new Promise((resolve, reject) => {
        /* First attempt: semicolon-delimited (KSB export default) */
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            delimiter: ';',
            complete: (results) => {
                try {
                    const pumps = extractPumpsFromRows(results.data, file.name);
                    if (pumps !== null) {
                        resolve(pumps);
                        return;
                    }

                    /* Fallback: auto-detect delimiter */
                    Papa.parse(file, {
                        header: false,
                        skipEmptyLines: true,
                        complete: (r2) => {
                            try {
                                const fallbackPumps = extractPumpsFromRows(r2.data, file.name);
                                if (fallbackPumps !== null) {
                                    resolve(fallbackPumps);
                                } else {
                                    reject(new Error(
                                        `"${file.name}": Required columns (Model, Serial No) not found. ` +
                                        'Check that your file has the correct headers.'
                                    ));
                                }
                            } catch (err) {
                                reject(err);
                            }
                        },
                        error: (err) => reject(new Error(`Failed to parse "${file.name}": ${err.message}`)),
                    });
                } catch (err) {
                    reject(err);
                }
            },
            error: (err) => reject(new Error(`Failed to parse "${file.name}": ${err.message}`)),
        });
    });
}

/**
 * Parse an Excel file (.xlsx / .xls) using SheetJS.
 * Searches the first 20 rows for a header row containing Model/Serial aliases.
 *
 * @param {File} file
 * @returns {Promise<Array<{model: string, serialNo: string, sourceFile: string}>>}
 */
function parsePumpExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data     = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet    = workbook.Sheets[workbook.SheetNames[0]];
                const rows     = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                const pumps = extractPumpsFromRows(rows, file.name);
                if (pumps !== null) {
                    resolve(pumps);
                } else {
                    reject(new Error(
                        `"${file.name}": Required columns (Model, Serial No) not found. ` +
                        'Check that your file has the correct headers.'
                    ));
                }
            } catch (err) {
                reject(new Error(`Failed to read "${file.name}": ${err.message}`));
            }
        };

        reader.onerror = () => reject(new Error(`Cannot read file: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Given a 2-D array of rows (first row may or may not be headers),
 * locate the header row (within the first 20 rows), resolve column indices,
 * then extract pump records.
 *
 * Returns null when required columns cannot be found.
 *
 * @param {Array<Array<*>>} rows
 * @param {string} fileName
 * @returns {Array<{model: string, serialNo: string, sourceFile: string}>|null}
 */
function extractPumpsFromRows(rows, fileName) {
    if (!rows || rows.length < 2) return null;

    /* Scan up to the first 20 rows for a header row */
    let headerRowIdx = -1;
    let modelIdx     = -1;
    let serialIdx    = -1;

    for (let i = 0; i < Math.min(rows.length, 20); i++) {
        const { modelIdx: mi, serialIdx: si } = resolveColumnIndices(
            rows[i].map(String)
        );
        if (mi !== -1 || si !== -1) {
            headerRowIdx = i;
            modelIdx     = mi;
            serialIdx    = si;
            break;
        }
    }

    if (headerRowIdx === -1 || (modelIdx === -1 && serialIdx === -1)) {
        return null;
    }

    const pumps = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
        const row     = rows[i];
        const model   = modelIdx  !== -1 ? cleanValue(row[modelIdx])  : '';
        const serial  = serialIdx !== -1 ? cleanValue(row[serialIdx]) : '';

        /* Skip completely empty rows */
        if (!model && !serial) continue;

        pumps.push({ model, serialNo: serial, sourceFile: fileName });
    }

    return pumps;
}

/* ============================================================
   File lifecycle helpers
   ============================================================ */

/**
 * Validate a file's extension and size, add it to the staged list,
 * and render its card in the UI.
 *
 * @param {File[]} files
 */
function stageFiles(files) {
    let anyAdded = false;

    files.forEach((file) => {
        /* Extension check */
        if (!isValidFileExtension(file)) {
            showPumpListNotification(
                `❌ "${sanitizeString(file.name)}" is not supported. Please upload CSV or Excel (.xlsx / .xls) files.`,
                'error'
            );
            return;
        }

        /* Size check (10 MB) */
        if (!isValidFileSize(file, 10)) {
            showPumpListNotification(
                `❌ "${sanitizeString(file.name)}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`,
                'error'
            );
            return;
        }

        /* Duplicate check */
        if (stagedFiles.some((f) => f.name === file.name && f.size === file.size)) {
            showPumpListNotification(
                `ℹ️ "${sanitizeString(file.name)}" is already in the list.`,
                'info'
            );
            return;
        }

        stagedFiles.push(file);
        renderStagedFileCard(file);
        anyAdded = true;
    });

    if (anyAdded) {
        updateActionButtons();
    }
}

/**
 * Remove a file from the staged list by its name.
 *
 * @param {string} fileName
 */
function removeStagedFile(fileName) {
    stagedFiles = stagedFiles.filter((f) => f.name !== fileName);
    const card = document.querySelector(`[data-file-name="${CSS.escape(fileName)}"]`);
    if (card) card.remove();
    updateActionButtons();

    /* If pumps from this file are already in the list, re-generate */
    if (allPumps.some((p) => p.sourceFile === fileName)) {
        allPumps = allPumps.filter((p) => p.sourceFile !== fileName);
        renderPumpTable();
    }
}

/**
 * Render a file card in the staged-files list.
 *
 * @param {File} file
 */
function renderStagedFileCard(file) {
    const list = document.getElementById('stagedFilesList');
    const card = document.createElement('div');
    card.className = 'file-item';
    card.dataset.fileName = file.name;

    const icon = file.name.toLowerCase().endsWith('.csv') ? '📄' : '📊';

    card.innerHTML = `
        <div class="file-item-header">
            <div class="file-info">
                <div class="file-icon">${icon}</div>
                <div class="file-details">
                    <h4>${sanitizeString(file.name)}</h4>
                    <p>${sanitizeString(formatFileSize(file.size))}</p>
                </div>
            </div>
            <button class="remove-button"
                    data-remove-name="${sanitizeString(file.name)}"
                    aria-label="Remove ${sanitizeString(file.name)}">Remove</button>
        </div>`;

    card.querySelector('[data-remove-name]').addEventListener('click', () => {
        removeStagedFile(file.name);
    });

    list.appendChild(card);
}

/* ============================================================
   Generate pump list
   ============================================================ */

/**
 * Parse all staged files, combine results, and render the table.
 * Called when the user clicks "Generate List".
 */
async function generatePumpList() {
    if (stagedFiles.length === 0) return;

    const loadingEl  = document.getElementById('pumpListLoading');
    const resultsEl  = document.getElementById('pumpListResults');
    const generateBtn = document.getElementById('generateButton');

    loadingEl.classList.add('active');
    resultsEl.style.display = 'none';
    generateBtn.disabled    = true;

    allPumps = [];
    let errors = [];

    for (const file of stagedFiles) {
        try {
            const pumps = await parsePumpFile(file);
            allPumps.push(...pumps);
        } catch (err) {
            errors.push(err.message);
        }
    }

    loadingEl.classList.remove('active');
    generateBtn.disabled = false;

    if (errors.length > 0) {
        errors.forEach((msg) => showPumpListNotification(msg, 'error', 6000));
    }

    if (allPumps.length === 0) {
        showPumpListNotification(
            '⚠️ No pump records were found. Please verify the file format and column headers.',
            'error'
        );
        return;
    }

    renderPumpTable();

    resultsEl.style.display = 'block';
    resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    showPumpListNotification(
        `✅ ${allPumps.length} pump${allPumps.length !== 1 ? 's' : ''} loaded from ${stagedFiles.length} file${stagedFiles.length !== 1 ? 's' : ''}.`,
        'success'
    );
}

/* ============================================================
   Table rendering
   ============================================================ */

/**
 * Render (or re-render) the pump list table from the current `allPumps` array.
 * Assigns sequential Pump No starting at 1.
 */
function renderPumpTable() {
    const tbody     = document.querySelector('#pumpListTable tbody');
    const countEl   = document.getElementById('pumpCount');
    const exportBtns = document.getElementById('exportButtons');

    tbody.innerHTML = '';

    if (allPumps.length === 0) {
        const tr  = tbody.insertRow();
        const td  = tr.insertCell();
        td.colSpan = 3;
        td.style.cssText = 'text-align:center;padding:40px;color:#666';
        td.textContent = 'No pump records to display.';
        if (countEl) countEl.textContent = '0 pumps';
        if (exportBtns) exportBtns.style.display = 'none';
        return;
    }

    allPumps.forEach((pump, index) => {
        const tr = tbody.insertRow();
        tr.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${sanitizeString(pump.model)  || '<em style="color:#999">—</em>'}</td>
            <td>${sanitizeString(pump.serialNo) || '<em style="color:#999">—</em>'}</td>`;
    });

    if (countEl) {
        countEl.textContent = `${allPumps.length} pump${allPumps.length !== 1 ? 's' : ''}`;
    }
    if (exportBtns) exportBtns.style.display = 'flex';
}

/* ============================================================
   Export
   ============================================================ */

/**
 * Export the current pump list as a CSV file.
 */
function exportPumpListCSV() {
    if (allPumps.length === 0) return;

    const lines = ['Pump No,Model,Serial No (S/N)'];
    allPumps.forEach((pump, i) => {
        lines.push(
            [i + 1, escapeCSV(pump.model), escapeCSV(pump.serialNo)].join(',')
        );
    });

    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `pump-list-${formatDateISO()}.csv`);
}

/**
 * Export the current pump list as an Excel (.xlsx) file.
 */
function exportPumpListExcel() {
    if (allPumps.length === 0) return;

    const rows = [['Pump No', 'Model', 'Serial No (S/N)']];
    allPumps.forEach((pump, i) => {
        rows.push([i + 1, pump.model, pump.serialNo]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);

    /* Auto-width columns */
    ws['!cols'] = [{ wch: 10 }, { wch: 40 }, { wch: 25 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Pump List');
    XLSX.writeFile(wb, `pump-list-${formatDateISO()}.xlsx`);
}

/**
 * Print the current pump list via the browser's print dialog.
 */
function printPumpList() {
    window.print();
}

/**
 * Trigger a file download for a given Blob.
 *
 * @param {Blob} blob
 * @param {string} filename
 */
function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/* ============================================================
   Notification
   ============================================================ */

/**
 * Display a toast notification.
 *
 * @param {string} message
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [durationMs=4000]
 */
function showPumpListNotification(message, type = 'info', durationMs = 4000) {
    const existing = document.querySelector('.pl-notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `notification pl-notification ${type}`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message;

    document.body.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.remove();
    }, durationMs);
}

/* ============================================================
   Button state
   ============================================================ */

/**
 * Enable or disable the Generate and Clear buttons based on state.
 */
function updateActionButtons() {
    const generateBtn = document.getElementById('generateButton');
    const clearBtn    = document.getElementById('clearButton');
    const hasFiles    = stagedFiles.length > 0;

    generateBtn.disabled = !hasFiles;
    clearBtn.disabled    = !hasFiles;
}

/* ============================================================
   Clear
   ============================================================ */

/**
 * Reset all application state and clear the UI.
 */
function clearAll() {
    stagedFiles = [];
    allPumps    = [];

    document.getElementById('stagedFilesList').innerHTML    = '';
    document.getElementById('pumpListResults').style.display = 'none';
    document.getElementById('pumpListFileInput').value       = '';

    const tbody = document.querySelector('#pumpListTable tbody');
    if (tbody) tbody.innerHTML = '';

    const exportBtns = document.getElementById('exportButtons');
    if (exportBtns) exportBtns.style.display = 'none';

    updateActionButtons();
}

/* ============================================================
   Drag and drop
   ============================================================ */

/**
 * Wire drag-and-drop events onto the upload section element.
 *
 * @param {HTMLElement} uploadSection
 */
function initPumpListDragDrop(uploadSection) {
    uploadSection.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        stageFiles(Array.from(e.dataTransfer.files));
    });
}

/* ============================================================
   Initialisation
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    const fileInput   = document.getElementById('pumpListFileInput');
    const uploadSect  = document.getElementById('pumpListUploadSection');
    const generateBtn = document.getElementById('generateButton');
    const clearBtn    = document.getElementById('clearButton');

    /* File input change */
    fileInput.addEventListener('change', (e) => {
        stageFiles(Array.from(e.target.files));
        /* Reset value so same file can be re-added after removal */
        e.target.value = '';
    });

    /* Drag and drop */
    initPumpListDragDrop(uploadSect);

    /* Action buttons */
    generateBtn.addEventListener('click', generatePumpList);
    clearBtn.addEventListener('click', clearAll);

    /* Export buttons */
    document.getElementById('exportCSVBtn').addEventListener('click', exportPumpListCSV);
    document.getElementById('exportExcelBtn').addEventListener('click', exportPumpListExcel);
    document.getElementById('exportPrintBtn').addEventListener('click', printPumpList);
});
