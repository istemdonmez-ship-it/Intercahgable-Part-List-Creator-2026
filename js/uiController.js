/**
 * uiController.js — UI interactions, state management, and table rendering
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/* ============================================================
   Notification system
   ============================================================ */

/**
 * Show a brief toast notification at the bottom-right of the viewport.
 *
 * @param {string} message           - Message text (plain text, not HTML).
 * @param {'success'|'error'|'info'} [type='info']
 * @param {number} [durationMs=3500] - Auto-dismiss delay.
 */
function showNotification(message, type = 'info', durationMs = 3500) {
    /* Remove any existing notification */
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'polite');
    el.textContent = message; // textContent — safe against XSS

    document.body.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) el.remove();
    }, durationMs);
}

/* ============================================================
   Button state
   ============================================================ */

/**
 * Enable or disable the Analyze and Clear buttons based on file count.
 * @param {number} fileCount
 */
function updateButtons(fileCount) {
    const analyzeButton = document.getElementById('analyzeButton');
    const clearButton   = document.getElementById('clearButton');
    const hasFiles = fileCount > 0;
    analyzeButton.disabled = !hasFiles;
    clearButton.disabled   = !hasFiles;
}

/**
 * Show/hide the configuration sections (DIN categories, toggle) based on file presence.
 * @param {boolean} show
 */
function showConfigurationSections(show) {
    const dinCategoriesSection    = document.getElementById('dinCategoriesSection');
    const interchangeableSection  = document.getElementById('interchangeableSection');
    dinCategoriesSection.style.display   = show ? 'block' : 'none';
    interchangeableSection.style.display = show ? 'block' : 'none';
}

/* ============================================================
   Tab switching
   ============================================================ */

/**
 * Activate a named tab and show its associated content panel.
 * @param {string} tabName - data-tab value.
 */
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach((tc) => tc.classList.remove('active'));

    const tabBtn     = document.querySelector(`[data-tab="${tabName}"]`);
    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabBtn)     tabBtn.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

/* ============================================================
   Results rendering
   ============================================================ */

/**
 * Render all results sections from the analyzed data object.
 *
 * @param {object} data            - Result from processAndCategorizeParts().
 * @param {boolean} din24296Enabled
 */
function displayResults(data, din24296Enabled) {
    displayPumpSummary(data.pumpList, data.totalPumps);

    if (din24296Enabled) {
        displayDINComplianceInfo(data);
        displaySavingsCard(data);
    } else {
        document.getElementById('dinComplianceInfo').style.display = 'none';
        document.getElementById('savingsCard').style.display       = 'none';
    }

    displayStatistics(data);
    displayPartsTable('all',        data.all);
    displayCommonSparesTab(data);
    displayPartsTable('shafts',     data.shafts);
    displayPartsTable('impellers',  data.impellers);
    displayPartsTable('seals',      data.seals);
    displayPartsTable('bearings',   data.bearings);
    displayPartsTable('wear-parts', data.wearParts);
    displayPartsTable('accessories',data.accessories);
    displayComparison(data);
    updateCategoryFilter(data);
}

/* ---- Pump summary ---- */
function displayPumpSummary(pumpList, totalPumps) {
    const summaryDiv = document.getElementById('pumpSummary');
    let html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">';
    html += '<h4 style="margin:0">🏭 Pump Inventory Summary</h4>';
    html += '<button class="btn-export btn-excel" id="exportPumpInventory" style="font-size:0.9em;padding:6px 12px">📊 Export to Excel</button>';
    html += '</div>';
    html += `<p style="margin-bottom:15px"><strong>Total Pumps: ${totalPumps}</strong> (Fleet size for DIN 24296 Table 32)</p>`;
    html += '<div class="pump-list">';

    pumpList.forEach((pump) => {
        html += `
            <div class="pump-list-item">
                <strong>${sanitizeString(pump.label)}${pump.quantity > 1 ? ` (× ${pump.quantity})` : ''}</strong>
                <div class="pump-meta">
                    ${pump.model    ? `<span>📋 Model: ${sanitizeString(pump.model)}</span>`      : ''}
                    ${pump.serial   ? `<span>🔢 S/N: ${sanitizeString(pump.serial)}</span>`       : ''}
                    ${pump.location ? `<span>📍 Location: ${sanitizeString(pump.location)}</span>`: ''}
                    <span>📄 File: ${sanitizeString(pump.file)}</span>
                </div>
            </div>`;
    });

    html += '</div>';
    summaryDiv.innerHTML = html;
    
    /* Attach event listener to the export button */
    setTimeout(() => {
        const exportBtn = document.getElementById('exportPumpInventory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = window.analyzedData || analyzedData;
                if (typeof exportPumpInventorySummary === 'function') {
                    exportPumpInventorySummary(data);
                }
            });
        }
    }, 0);
}

/* ---- DIN compliance info ---- */
function displayDINComplianceInfo(data) {
    const infoDiv = document.getElementById('dinComplianceInfo');
    infoDiv.style.display = 'block';

    const interchangeableParts = data.all.filter((p) => p.isInterchangeable);
    const tp = data.totalPumps;
    let fleetCategory;
    if      (tp >= 10) fleetCategory = '10+ pumps (percentage-based calculation)';
    else if (tp >= 8)  fleetCategory = '8–9 pumps';
    else if (tp >= 6)  fleetCategory = '6–7 pumps';
    else               fleetCategory = `${tp} pumps`;

    infoDiv.innerHTML = `
        <h4>📋 DIN 24296 Table 32 Applied</h4>
        <p style="margin-bottom:15px"><strong>Fleet Size Category:</strong> ${sanitizeString(fleetCategory)}</p>
        <ul>
            <li>Common parts identified: ${data.common.length}</li>
            <li>Parts optimized with Table 32: ${interchangeableParts.length}</li>
            <li>Calculation method: Official DIN 24296 lookup table</li>
            <li>Standard reference: DIN 24296 Section 7.7.2, Table 32</li>
        </ul>`;
}

/* ---- Savings card ---- */
function displaySavingsCard(data) {
    const savingsDiv    = document.getElementById('savingsCard');
    const totalStandard = data.all.reduce((s, p) => s + p.standardQty,    0);
    const totalOptimized= data.all.reduce((s, p) => s + p.recommendedQty, 0);
    const totalSavings  = totalStandard - totalOptimized;
    const savingsPercent= totalStandard > 0
        ? ((totalSavings / totalStandard) * 100).toFixed(1)
        : '0.0';

    savingsDiv.style.display = 'block';
    savingsDiv.innerHTML = `
        <h4>💰 DIN 24296 Table 32 Inventory Optimization</h4>
        <div class="savings-grid">
            <div class="savings-item">
                <h5>${totalStandard}</h5>
                <p>Standard Qty<br>(1:1 per pump)</p>
            </div>
            <div class="savings-item">
                <h5>${totalOptimized}</h5>
                <p>Table 32 Optimized<br>(Official DIN standard)</p>
            </div>
            <div class="savings-item">
                <h5>${totalSavings}</h5>
                <p>Parts Saved<br>(${savingsPercent}% reduction)</p>
            </div>
        </div>`;
}

/* ---- Statistics cards ---- */
function displayStatistics(data) {
    const totalRecommendedQty = data.all.reduce((s, p) => s + p.recommendedQty, 0);
    const standardQty         = data.all.reduce((s, p) => s + p.standardQty,    0);
    const totalWeight         = data.all.reduce((s, p) => s + p.totalWeight,     0);
    const savings             = standardQty - totalRecommendedQty;

    const statisticsDiv = document.getElementById('statistics');
    let html = `
        <div class="stat-card highlight">
            <h3>${data.totalPumps}</h3>
            <p>Total Pumps</p>
        </div>
        <div class="stat-card">
            <h3>${data.all.length}</h3>
            <p>Unique Parts</p>
        </div>
        <div class="stat-card success">
            <h3>${data.common.length}</h3>
            <p>Common Parts ⭐</p>
        </div>`;

    if (data.din24296Enabled && savings > 0) {
        html += `
            <div class="stat-card success">
                <h3>${savings}</h3>
                <p>Parts Saved 💰</p>
            </div>`;
    }

    html += `
        <div class="stat-card highlight">
            <h3>${totalRecommendedQty}</h3>
            <p>Recommended Qty</p>
        </div>
        <div class="stat-card">
            <h3>${totalWeight.toFixed(2)}</h3>
            <p>Total Weight (kg)</p>
        </div>`;

    statisticsDiv.innerHTML = html;
}

/* ---- Common spares tab ---- */
function displayCommonSparesTab(data) {
    const commonParts  = data.common;
    const highlightDiv = document.getElementById('commonSparesHighlight');

    const totalCommonStandard  = commonParts.reduce((s, p) => s + p.standardQty,    0);
    const totalCommonOptimized = commonParts.reduce((s, p) => s + p.recommendedQty, 0);
    const totalCommonSavings   = totalCommonStandard - totalCommonOptimized;
    const avgUsage = commonParts.length > 0
        ? (commonParts.reduce((s, p) => s + p.sourceFiles.length, 0) / commonParts.length).toFixed(1)
        : '0';

    highlightDiv.innerHTML = `
        <h4>⭐ Common Spares Identified (DIN 24296 Table 32)</h4>
        <p style="margin-bottom:15px">Parts shared across multiple pumps, optimized using official DIN 24296 Table 32 lookup.</p>
        <div class="common-spares-summary">
            <div class="common-stat"><h5>${commonParts.length}</h5><p>Common Parts</p></div>
            <div class="common-stat"><h5>${avgUsage}</h5><p>Avg Pumps/Part</p></div>
            <div class="common-stat"><h5>${totalCommonOptimized}</h5><p>Table 32 Qty</p></div>
            <div class="common-stat"><h5>${totalCommonSavings}</h5><p>Parts Saved</p></div>
        </div>`;

    /* Common parts table */
    const tbody = document.querySelector('#commonOnlyTable tbody');
    tbody.innerHTML = '';

    if (commonParts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;padding:40px">No common parts found. All parts are unique to individual pumps.</td></tr>';
    } else {
        commonParts.forEach((part, index) => {
            const row      = tbody.insertRow();
            const qtyClass = part.isInterchangeable ? 'quantity-optimized' : 'quantity-highlight';
            row.innerHTML  = `
                <td><strong>${index + 1}</strong></td>
                <td><strong>${sanitizeString(part.partNo)}</strong></td>
                <td>${sanitizeString(part.materialNumber)}</td>
                <td>${sanitizeString(part.designation)}</td>
                <td><span class="badge badge-common">${sanitizeString(part.category)}</span></td>
                <td>${part.quantityPerPump}</td>
                <td><strong>${part.sourceFiles.length}</strong> pumps</td>
                <td>${part.standardQty}</td>
                <td><span class="${qtyClass}">${part.recommendedQty}</span></td>
                <td><strong style="color:#28a745">${part.savings > 0 ? '-' + part.savings : '0'}</strong></td>
                <td><small>${sanitizeString(part.calculation)}</small></td>`;
        });
    }

    displayCommonSparesMatrix(data);
}

/* ---- Common spares matrix ---- */
function displayCommonSparesMatrix(data) {
    const matrixDiv  = document.getElementById('commonSparesMatrix');
    const commonParts = data.common;
    const pumps       = data.pumpList;

    if (commonParts.length === 0) {
        matrixDiv.innerHTML = '<p style="text-align:center;padding:40px;color:#666">No common parts to display in matrix.</p>';
        return;
    }

    let html = '<table class="parts-table"><thead><tr>';
    html += '<th style="min-width:150px">Part No.</th>';
    html += '<th style="min-width:150px">Material No.</th>';
    html += '<th style="min-width:250px">Designation</th>';
    html += '<th>DIN 24296 Qty</th>';
    pumps.forEach((pump) => {
        html += `<th style="min-width:80px;text-align:center">${sanitizeString(pump.label)}</th>`;
    });
    html += '</tr></thead><tbody>';

    commonParts.forEach((part) => {
        const qtyClass = part.isInterchangeable ? 'quantity-optimized' : 'quantity-highlight';
        html += '<tr>';
        html += `<td><strong>${sanitizeString(part.partNo)}</strong></td>`;
        html += `<td>${sanitizeString(part.materialNumber)}</td>`;
        html += `<td>${sanitizeString(part.designation)}</td>`;
        html += `<td><span class="${qtyClass}">${part.recommendedQty}</span></td>`;
        pumps.forEach((pump) => {
            const has = part.sourceFiles.includes(pump.label);
            html += `<td style="text-align:center;font-size:1.2em${has ? ';background:#d4edda' : ''}">${has ? '✓' : '-'}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    matrixDiv.innerHTML = html;
}

/* ---- Generic parts table ---- */
function displayPartsTable(category, parts) {
    let tableId;
    if      (category === 'all')        tableId = 'allPartsTable';
    else if (category === 'wear-parts') tableId = 'wearPartsTable';
    else                                tableId = `${category}PartsTable`;

    const table = document.getElementById(tableId);
    if (!table) return;

    const tbody  = table.querySelector('tbody');
    tbody.innerHTML = '';

    if (parts.length === 0) {
        const colspan = table.querySelectorAll('thead th').length;
        tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align:center;padding:40px">No parts in this category</td></tr>`;
        return;
    }

    parts.forEach((part) => {
        const row      = tbody.insertRow();
        const qtyClass = part.isInterchangeable ? 'quantity-optimized' : 'quantity-highlight';

        if (category === 'all') {
            row.innerHTML = `
                <td><strong>${sanitizeString(part.partNo)}</strong></td>
                <td>${sanitizeString(part.materialNumber)}</td>
                <td>${sanitizeString(part.designation)}</td>
                <td><small>${sanitizeString(part.material)}</small></td>
                <td><small>${sanitizeString(part.displayModel)}</small></td>
                <td>${part.quantityPerPump}</td>
                <td>${part.standardQty}</td>
                <td><span class="${qtyClass}">${part.recommendedQty}</span></td>
                <td><strong>${part.savings > 0 ? '-' + part.savings : '0'}</strong></td>
                <td><small>${part.sourceFiles.length} pump(s)</small></td>
                <td><span class="badge badge-common">${sanitizeString(part.category)}</span></td>
                <td><small>${sanitizeString(part.calculation)}</small></td>`;
        } else {
            row.innerHTML = `
                <td><strong>${sanitizeString(part.partNo)}</strong></td>
                <td>${sanitizeString(part.materialNumber)}</td>
                <td>${sanitizeString(part.designation)}</td>
                <td><small>${sanitizeString(part.material)}</small></td>
                <td>${part.quantityPerPump}</td>
                <td>${part.standardQty}</td>
                <td><span class="${qtyClass}">${part.recommendedQty}</span></td>
                <td><strong>${part.savings > 0 ? '-' + part.savings : '0'}</strong></td>
                <td><small>${part.sourceFiles.length} pump(s)</small></td>`;
        }
    });
}

/* ---- Comparison view ---- */
function displayComparison(data) {
    const comparisonDiv = document.getElementById('comparisonView');
    const pumps = data.pumpList;

    let html = '<h3>🔄 Pump Comparison Matrix — Part Availability Across Fleet</h3>';
    html += '<p style="margin-bottom:20px;color:#666">✓ = Part present | DIN 24296 Table 32 quantities shown | <strong>Export this matrix using the button above</strong></p>';
    html += '<table class="parts-table"><thead><tr>';
    html += '<th>Material No.</th><th>Part No.</th><th>Designation</th><th>Category</th><th>Standard Qty</th><th>DIN 24296 Qty</th>';
    pumps.forEach((pump) => {
        html += `<th style="min-width:100px">${sanitizeString(pump.label)}${pump.quantity > 1 ? ` (×${pump.quantity})` : ''}</th>`;
    });
    html += '</tr></thead><tbody>';

    data.all.forEach((part) => {
        const qtyClass = part.isInterchangeable ? 'quantity-optimized' : 'quantity-highlight';
        html += '<tr>';
        html += `<td><strong>${sanitizeString(part.materialNumber)}</strong></td>`;
        html += `<td>${sanitizeString(part.partNo)}</td>`;
        html += `<td>${sanitizeString(part.designation)}</td>`;
        html += `<td><span class="badge badge-common">${sanitizeString(part.category)}</span></td>`;
        html += `<td>${part.standardQty}</td>`;
        html += `<td><span class="${qtyClass}">${part.recommendedQty}</span></td>`;
        pumps.forEach((pump) => {
            const has = part.sourceFiles.includes(pump.label);
            html += `<td style="text-align:center;font-size:1.2em${has ? ';background:#d4edda' : ''}">${has ? '✓' : '-'}</td>`;
        });
        html += '</tr>';
    });

    html += '</tbody></table>';
    comparisonDiv.innerHTML = html;
}

/* ---- Category filter dropdown ---- */
function updateCategoryFilter(data) {
    const categoryFilter = document.getElementById('categoryFilter');
    const categories = [
        { value: 'all',        label: 'All Categories',   count: data.all.length },
        { value: 'shafts',     label: 'Shafts',           count: data.shafts.length },
        { value: 'impellers',  label: 'Impellers',        count: data.impellers.length },
        { value: 'seals',      label: 'Seals & Gaskets',  count: data.seals.length },
        { value: 'bearings',   label: 'Bearings',         count: data.bearings.length },
        { value: 'wear-parts', label: 'Wear Parts',       count: data.wearParts.length },
        { value: 'accessories',label: 'Accessories',      count: data.accessories.length },
    ];

    categoryFilter.innerHTML = categories
        .map((c) => `<option value="${c.value}">${c.label} (${c.count})</option>`)
        .join('');
}
