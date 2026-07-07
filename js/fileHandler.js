/**
 * fileHandler.js — File upload, validation, drag-and-drop, and parsing
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/** Maximum allowed file size in bytes (10 MB). */
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Process an array of File objects:
 *  - Validates extension and size
 *  - Builds a fileData descriptor
 *  - Appends it to uploadedFilesData
 *  - Renders the file item in the UI
 *
 * @param {File[]} files
 * @param {object[]} uploadedFilesData - Shared state array (mutated in place).
 * @param {Function} onFilesChanged - Callback invoked after processing.
 */
function processFiles(files, uploadedFilesData, onFilesChanged) {
    let anyAdded = false;

    files.forEach((file) => {
        if (!isValidFileExtension(file)) {
            showNotification(
                `❌ "${sanitizeString(file.name)}" is not supported. Please upload CSV or Excel (.xlsx / .xls) files.`,
                'error'
            );
            return;
        }

        if (!isValidFileSize(file, 10)) {
            showNotification(
                `❌ "${sanitizeString(file.name)}" exceeds the 10 MB limit (${formatFileSize(file.size)}).`,
                'error'
            );
            return;
        }

        const fileData = {
            file,
            name: sanitizeString(file.name),
            size: formatFileSize(file.size),
            id: Date.now() + Math.random(),
            pumpLabel: `Pump ${uploadedFilesData.length + 1}`,
            pumpQuantity: 1,
            pumpModel: '',
            serialNo: '',
            location: '',
        };

        uploadedFilesData.push(fileData);
        renderFileItem(fileData, uploadedFilesData);
        anyAdded = true;
    });

    if (anyAdded) {
        onFilesChanged();
    }
}

/**
 * Render a file item card in the upload UI.
 *
 * @param {object} fileData
 * @param {object[]} uploadedFilesData - Reference to shared state (for remove handler).
 */
function renderFileItem(fileData, uploadedFilesData) {
    const uploadedFilesDiv = document.getElementById('uploadedFiles');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.dataset.id = fileData.id;

    const icon = fileData.name.endsWith('.csv') ? '📄' : '📊';

    /* NOTE: all dynamic values are sanitized before insertion */
    fileItem.innerHTML = `
        <div class="file-item-header">
            <div class="file-info">
                <div class="file-icon">${icon}</div>
                <div class="file-details">
                    <h4>${sanitizeString(fileData.name)}</h4>
                    <p>${sanitizeString(fileData.size)}</p>
                </div>
            </div>
            <button class="remove-button" data-remove-id="${fileData.id}" aria-label="Remove ${sanitizeString(fileData.name)}">Remove</button>
        </div>
        <div class="pump-details-grid">
            <div class="detail-item">
                <span class="detail-label">Pump Label</span>
                <input type="text" class="pump-input-small" maxlength="100"
                       value="${sanitizeString(fileData.pumpLabel)}"
                       placeholder="e.g., P-1001"
                       data-field="pumpLabel" data-file-id="${fileData.id}"
                       aria-label="Pump label for ${sanitizeString(fileData.name)}">
            </div>
            <div class="detail-item">
                <span class="detail-label">Quantity</span>
                <input type="number" class="pump-input-small"
                       value="${fileData.pumpQuantity}" min="1" max="10000" placeholder="1"
                       data-field="pumpQuantity" data-file-id="${fileData.id}"
                       aria-label="Pump quantity for ${sanitizeString(fileData.name)}">
            </div>
            <div class="detail-item">
                <span class="detail-label">Model (Auto-detect)</span>
                <input type="text" class="pump-input-small" maxlength="200"
                       value="${sanitizeString(fileData.pumpModel)}"
                       placeholder="Will be detected"
                       data-field="pumpModel" data-file-id="${fileData.id}"
                       aria-label="Pump model for ${sanitizeString(fileData.name)}">
            </div>
            <div class="detail-item">
                <span class="detail-label">Serial No. (Auto-detect)</span>
                <input type="text" class="pump-input-small" maxlength="200"
                       value="${sanitizeString(fileData.serialNo)}"
                       placeholder="Will be detected"
                       data-field="serialNo" data-file-id="${fileData.id}"
                       aria-label="Serial number for ${sanitizeString(fileData.name)}">
            </div>
            <div class="detail-item">
                <span class="detail-label">Location</span>
                <input type="text" class="pump-input-small" maxlength="200"
                       value="${sanitizeString(fileData.location)}"
                       placeholder="e.g., Building A"
                       data-field="location" data-file-id="${fileData.id}"
                       aria-label="Location for ${sanitizeString(fileData.name)}">
            </div>
        </div>
    `;

    /* Delegated event: remove button */
    fileItem.querySelector('[data-remove-id]').addEventListener('click', () => {
        removeFile(fileData.id, uploadedFilesData);
    });

    /* Delegated event: input changes */
    fileItem.querySelectorAll('.pump-input-small').forEach((input) => {
        input.addEventListener('change', () => {
            const field = input.dataset.field;
            const id = parseFloat(input.dataset.fileId);
            let value = sanitizeString(input.value);

            if (field === 'pumpQuantity') {
                const n = parseInt(value, 10);
                value = isValidQuantity(n) ? n : 1;
                input.value = value;
            }

            updatePumpData(id, field, value, uploadedFilesData);
        });
    });

    uploadedFilesDiv.appendChild(fileItem);
}

/**
 * Remove a file entry by id and refresh the UI.
 *
 * @param {number} id
 * @param {object[]} uploadedFilesData
 */
function removeFile(id, uploadedFilesData) {
    const idx = uploadedFilesData.findIndex((f) => f.id === id);
    if (idx !== -1) uploadedFilesData.splice(idx, 1);

    const fileItem = document.querySelector(`[data-id="${id}"]`);
    if (fileItem) fileItem.remove();

    /* Re-number default labels */
    uploadedFilesData.forEach((file, index) => {
        if (file.pumpLabel.startsWith('Pump ')) {
            file.pumpLabel = `Pump ${index + 1}`;
            const input = document.querySelector(
                `[data-id="${file.id}"] [data-field="pumpLabel"]`
            );
            if (input) input.value = file.pumpLabel;
        }
    });
}

/**
 * Update a specific field of a fileData entry.
 *
 * @param {number} id
 * @param {string} field
 * @param {*} value
 * @param {object[]} uploadedFilesData
 */
function updatePumpData(id, field, value, uploadedFilesData) {
    const fileData = uploadedFilesData.find((f) => f.id === id);
    if (fileData) {
        fileData[field] = value;
    }
}

/* ============================================================
   File parsing
   ============================================================ */

/**
 * Parse a File into an array of raw part objects.
 * Dispatches to CSV or Excel parser based on extension.
 *
 * @param {File} file
 * @returns {Promise<object[]>} Array of raw part records.
 */
function parseFile(file) {
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
        return parseCSV(file);
    }
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        return parseExcel(file);
    }
    return Promise.reject(new Error(`Unsupported file type: ${file.name}`));
}

/**
 * Parse a CSV file using PapaParse.
 *
 * @param {File} file
 * @returns {Promise<object[]>}
 */
function parseCSV(file) {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimiter: ';',
            complete: (results) => {
                if (results.errors && results.errors.length > 0) {
                    console.warn('CSV parse warnings:', results.errors);
                }
                try {
                    const parts = results.data
                        .map((row) => normalizeRow(row))
                        .filter((part) => part.partNo !== '');
                    resolve(parts);
                } catch (err) {
                    reject(err);
                }
            },
            error: (err) => reject(err),
        });
    });
}

/**
 * Parse an Excel file (.xlsx/.xls) using SheetJS.
 *
 * @param {File} file
 * @returns {Promise<object[]>}
 */
function parseExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });

                /* Locate the header row — first row containing "Part No" or "PTT" */
                let headerRow = 0;
                for (let i = 0; i < Math.min(jsonData.length, 20); i++) {
                    if (
                        jsonData[i].some(
                            (cell) =>
                                cell &&
                                (String(cell).includes('Part No') ||
                                    String(cell).includes('PTT'))
                        )
                    ) {
                        headerRow = i;
                        break;
                    }
                }

                const headers = jsonData[headerRow];
                const parts = [];

                for (let i = headerRow + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const part = normalizeExcelRow(row, headers);
                    if (part.partNo) {
                        parts.push(part);
                    }
                }

                resolve(parts);
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
        reader.readAsArrayBuffer(file);
    });
}

/* ============================================================
   Row normalization helpers
   ============================================================ */

/**
 * Normalize a CSV row (keyed by header strings) into a part object.
 * @param {object} row
 * @returns {object}
 */
function normalizeRow(row) {
    return {
        partNo: cleanValue(row['Part No.'] || row['Part No'] || row['PTT'] || ''),
        designation: cleanValue(row['Designation'] || row['Name'] || ''),
        materialNumber: cleanValue(row['Material Number'] || row['Material'] || ''),
        material: cleanValue(row['Material'] || ''),
        quantity: parseFloat(cleanValue(row['Quantity'])) || 0,
        quantityUnit: cleanValue(row['Quantity Unit']) || 'Piece',
        weight: parseFloat(cleanValue(row['Weight'])) || 0,
        weightUnit: cleanValue(row['Weight Unit']) || 'kg',
        addToCart: cleanValue(row['Add to Cart']) || '-',
        serialNo: cleanValue(row['Serial No.'] || row['Serial-No.'] || ''),
        year: cleanValue(row['Year'] || ''),
        description: cleanValue(row['Description'] || row['Size'] || ''),
    };
}

/**
 * Normalize an Excel row (positional array with headers) into a part object.
 * @param {Array} row
 * @param {Array} headers
 * @returns {object}
 */
function normalizeExcelRow(row, headers) {
    const get = (col) => cleanValue(getCellValue(row, headers, col));
    return {
        partNo: get('Part No') || get('PTT'),
        designation: get('Designation') || get('Name'),
        materialNumber: get('Material Number') || get('Material'),
        material: get('Material'),
        quantity: parseFloat(get('Quantity')) || 0,
        quantityUnit: get('Quantity Unit') || 'Piece',
        weight: parseFloat(get('Weight')) || 0,
        weightUnit: get('Weight Unit') || 'kg',
        addToCart: get('Add to Cart') || '-',
        serialNo: get('Serial No') || get('Serial-No.'),
        year: get('Year'),
        description: get('Description') || get('Size'),
    };
}

/**
 * Get a cell value from a row array by matching a column name substring.
 * @param {Array} row
 * @param {Array} headers
 * @param {string} columnName
 * @returns {string}
 */
function getCellValue(row, headers, columnName) {
    const index = headers.findIndex(
        (h) => h && String(h).toLowerCase().includes(columnName.toLowerCase())
    );
    return index >= 0 ? String(row[index] ?? '') : '';
}

/* ============================================================
   Drag and drop helpers (called from uiController.js)
   ============================================================ */

/**
 * Attach drag-and-drop handlers to the upload section element.
 * @param {HTMLElement} uploadSection
 * @param {object[]} uploadedFilesData
 * @param {Function} onFilesChanged
 */
function initDragAndDrop(uploadSection, uploadedFilesData, onFilesChanged) {
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
        const files = Array.from(e.dataTransfer.files);
        processFiles(files, uploadedFilesData, onFilesChanged);
    });
}
