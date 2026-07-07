/**
 * exportManager.js — Excel, CSV, and PDF (print) export functionality
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/* ============================================================
   Excel export helpers
   ============================================================ */

/**
 * Build a generic DIN 24296 header block for Excel workbooks.
 * @param {object} analyzedData
 * @returns {Array[]} AoA rows for the summary sheet.
 */
function buildSummaryAoA(analyzedData) {
    return [
        ['INTERCHANGEABLE PARTS LIST — DIN 24296 TABLE 32 COMPLIANT'],
        ['Generated:', new Date().toLocaleString()],
        ['Standard:', 'DIN 24296 Section 7.7.2, Table 32'],
        ['Method:', 'Official lookup table by fleet size'],
        [''],
        ['FLEET SUMMARY'],
        ['Total Pumps:', analyzedData.totalPumps],
        ['Total Unique Parts:', analyzedData.all.length],
        ['Common Parts:', analyzedData.common.length],
        ['DIN 24296 Optimization:', analyzedData.din24296Enabled ? 'Enabled' : 'Disabled'],
    ];
}

/**
 * Export all parts to an Excel (.xlsx) workbook with multiple sheets.
 *
 * Sheets:
 *   1. Summary   — header info
 *   2. All Parts — complete parts list
 *
 * @param {object} analyzedData - Result from processAndCategorizeParts().
 */
function exportToExcel(analyzedData) {
    if (!analyzedData) {
        showNotification('No data available to export.', 'error');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();

        /* Sheet 1 — Summary */
        const summarySheet = XLSX.utils.aoa_to_sheet(buildSummaryAoA(analyzedData));
        XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

        /* Sheet 2 — All Parts */
        const headers = [
            'Part No.', 'Material No.', 'Designation', 'Category',
            'Qty/Pump', 'Standard Qty', 'DIN 24296 Qty', 'Savings',
            'Found In', 'Calculation',
        ];
        const rows = analyzedData.all.map((part) => [
            part.partNo,
            part.materialNumber,
            part.designation,
            part.category,
            part.quantityPerPump,
            part.standardQty,
            part.recommendedQty,
            part.savings,
            `${part.sourceFiles.length} pumps`,
            part.calculation,
        ]);
        const allPartsSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        XLSX.utils.book_append_sheet(wb, allPartsSheet, 'All Parts');

        const filename = `Interchangeable_Parts_DIN24296_${analyzedData.totalPumps}pumps_${formatDateISO()}.xlsx`;
        XLSX.writeFile(wb, filename);
        showNotification(`✅ Exported to ${filename}`, 'success');
    } catch (err) {
        console.error('Excel export error:', err);
        showNotification('❌ Failed to export Excel file.', 'error');
    }
}

/**
 * Export all parts to a CSV file.
 *
 * @param {object} analyzedData
 */
function exportToCSV(analyzedData) {
    if (!analyzedData) {
        showNotification('No data available to export.', 'error');
        return;
    }

    try {
        const headerRow = [
            'Part No.', 'Material No.', 'Designation', 'Category',
            'Qty/Pump', 'Standard Qty', 'DIN 24296 Qty', 'Savings',
            'Found In', 'Calculation',
        ].map(escapeCSV).join(',');

        const rows = analyzedData.all.map((part) =>
            [
                part.partNo,
                part.materialNumber,
                part.designation,
                part.category,
                part.quantityPerPump,
                part.standardQty,
                part.recommendedQty,
                part.savings,
                `${part.sourceFiles.length} pumps`,
                part.calculation,
            ]
                .map(escapeCSV)
                .join(',')
        );

        const csv = [headerRow, ...rows].join('\n');
        downloadTextFile(
            csv,
            `Interchangeable_Parts_DIN24296_${analyzedData.totalPumps}pumps_${formatDateISO()}.csv`,
            'text/csv'
        );
        showNotification('✅ CSV exported successfully.', 'success');
    } catch (err) {
        console.error('CSV export error:', err);
        showNotification('❌ Failed to export CSV file.', 'error');
    }
}

/**
 * Export common spares only to an Excel workbook.
 *
 * Sheets:
 *   1. Summary         — header + aggregate stats
 *   2. Common Spares   — detail rows for parts found in 2+ pumps
 *
 * @param {object} analyzedData
 */
function exportCommonSparesReport(analyzedData) {
    if (!analyzedData || !analyzedData.common || analyzedData.common.length === 0) {
        showNotification('No common spares found to export.', 'error');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const commonParts = analyzedData.common;

        /* Sheet 1 — Summary */
        const summaryAoA = [
            ['COMMON SPARES ONLY — DIN 24296 TABLE 32 REPORT'],
            ['Generated:', new Date().toLocaleString()],
            ['Standard:', 'DIN 24296 Section 7.7.2, Table 32'],
            ['Fleet Size:', `${analyzedData.totalPumps} pumps`],
            [''],
            ['SUMMARY'],
            ['Common Parts (Used in 2+ Pumps):', commonParts.length],
            ['Total Standard Quantity:', commonParts.reduce((s, p) => s + p.standardQty, 0)],
            ['Total DIN 24296 Quantity:', commonParts.reduce((s, p) => s + p.recommendedQty, 0)],
            ['Total Savings:', commonParts.reduce((s, p) => s + p.savings, 0)],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryAoA), 'Summary');

        /* Sheet 2 — Common Spares Detail */
        const detailHeaders = [
            '#', 'Part No.', 'Material No.', 'Designation', 'Category',
            'Qty Per Pump', 'Used In (Pumps)', 'Standard Qty',
            'DIN 24296 Qty', 'Savings', 'Calculation',
        ];
        const detailRows = commonParts.map((part, index) => [
            index + 1,
            part.partNo,
            part.materialNumber,
            part.designation,
            part.category,
            part.quantityPerPump,
            part.sourceFiles.length,
            part.standardQty,
            part.recommendedQty,
            part.savings,
            part.calculation,
        ]);
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]),
            'Common Spares List'
        );

        const filename = `Common_Spares_DIN24296_${analyzedData.totalPumps}pumps_${formatDateISO()}.xlsx`;
        XLSX.writeFile(wb, filename);
        showNotification(`✅ Common spares report exported to ${filename}`, 'success');
    } catch (err) {
        console.error('Common spares export error:', err);
        showNotification('❌ Failed to export common spares report.', 'error');
    }
}

/**
 * Export the full pump comparison matrix to an Excel workbook.
 *
 * Sheets:
 *   1. Overview               — header info
 *   2. Full Comparison Matrix — parts × pumps cross-reference
 *
 * @param {object} analyzedData
 */
function exportComparisonMatrix(analyzedData) {
    if (!analyzedData) {
        showNotification('No data available to export.', 'error');
        return;
    }

    try {
        const wb = XLSX.utils.book_new();
        const { pumpList, all: allParts } = analyzedData;

        /* Sheet 1 — Overview */
        const overviewAoA = [
            ['PUMP COMPARISON MATRIX — DIN 24296 TABLE 32 CROSS-REFERENCE'],
            ['Generated:', new Date().toLocaleString()],
            ['Total Pumps:', analyzedData.totalPumps],
            ['Total Unique Parts:', allParts.length],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overviewAoA), 'Overview');

        /* Sheet 2 — Matrix */
        const matrixHeaders = [
            'Material No.', 'Part No.', 'Designation', 'Part Name', 'Category',
            'Standard Qty', 'DIN 24296 Qty', 'Savings',
            ...pumpList.map((p) => p.label),
            ...pumpList.map((p) => `${p.label} Model`),
        ];
        const matrixRows = allParts.map((part) => {
            const pumpCols = pumpList.map((pump) =>
                part.sourceFiles.includes(pump.label) ? '✓' : '-'
            );
            const pumpModelCols = pumpList.map((pump) =>
                part.sourceFiles.includes(pump.label) ? (pump.model || 'N/A') : '-'
            );
            // Extract part name from designation (first word before space or special chars)
            const partName = extractPartName(part.designation);
            return [
                part.materialNumber,
                part.partNo,
                part.designation,
                partName,
                part.category,
                part.standardQty,
                part.recommendedQty,
                part.savings,
                ...pumpCols,
                ...pumpModelCols,
            ];
        });
        XLSX.utils.book_append_sheet(
            wb,
            XLSX.utils.aoa_to_sheet([matrixHeaders, ...matrixRows]),
            'Full Comparison Matrix'
        );

        const filename = `Pump_Comparison_DIN24296_${analyzedData.totalPumps}pumps_${formatDateISO()}.xlsx`;
        XLSX.writeFile(wb, filename);
        showNotification(`✅ Comparison matrix exported to ${filename}`, 'success');
    } catch (err) {
        console.error('Comparison matrix export error:', err);
        showNotification('❌ Failed to export comparison matrix.', 'error');
    }
}

/**
 * Trigger the browser's native print dialog for a PDF-friendly print view.
 */
function printReport() {
    window.print();
}

/* ============================================================
   Internal helpers
   ============================================================ */

/**
 * Create a downloadable text file and trigger a browser download.
 * @param {string} content  - Text content.
 * @param {string} filename - Desired file name.
 * @param {string} mimeType - MIME type string.
 */
function downloadTextFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Extract the part name from a designation string.
 * Returns the first word/token before any space, number, or special character.
 * Example: "SHAFT 65X 588 C45+N WS55-Standard" → "SHAFT"
 * 
 * @param {string} designation - The full designation string
 * @returns {string} The extracted part name
 */
function extractPartName(designation) {
    if (!designation || typeof designation !== 'string') {
        return '';
    }
    
    // Trim and get the first word before space or special characters
    const trimmed = designation.trim();
    const match = trimmed.match(/^([A-Za-z]+)/);
    
    if (match && match[1]) {
        return match[1].toUpperCase();
    }
    
    // Fallback: just get the first token before space
    const firstWord = trimmed.split(/[\s\d\-\+]+/)[0];
    return firstWord ? firstWord.toUpperCase() : '';
}
