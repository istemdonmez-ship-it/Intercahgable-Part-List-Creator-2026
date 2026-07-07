/**
 * app.js — Main application entry point
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 *
 * Wires together all modules: fileHandler, dinClassifier,
 * dataProcessor, exportManager, uiController, and utils.
 */

'use strict';

/* ============================================================
   Application state
   ============================================================ */
let uploadedFilesData  = []; // Array of fileData descriptors
let analyzedData       = null; // Result from processAndCategorizeParts()
let interchangeableEnabled = false;

/* ============================================================
   DOM references (cached on DOMContentLoaded)
   ============================================================ */
let fileInput;
let uploadSection;
let interchangeableToggle;
let analyzeButton;
let clearButton;
let loading;
let resultsSection;
let searchInput;
let categoryFilter;
let commonalityFilter;

/* ============================================================
   Initialization
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    fileInput            = document.getElementById('fileInput');
    uploadSection        = document.getElementById('uploadSection');
    interchangeableToggle= document.getElementById('interchangeableToggle');
    analyzeButton        = document.getElementById('analyzeButton');
    clearButton          = document.getElementById('clearButton');
    loading              = document.getElementById('loading');
    resultsSection       = document.getElementById('resultsSection');
    searchInput          = document.getElementById('searchInput');
    categoryFilter       = document.getElementById('categoryFilter');
    commonalityFilter    = document.getElementById('commonalityFilter');

    /* File input */
    fileInput.addEventListener('change', (e) => {
        processFiles(Array.from(e.target.files), uploadedFilesData, onFilesChanged);
    });

    /* Drag and drop */
    initDragAndDrop(uploadSection, uploadedFilesData, onFilesChanged);

    /* Interchangeable toggle */
    interchangeableToggle.addEventListener('click', () => {
        interchangeableEnabled = !interchangeableEnabled;
        interchangeableToggle.classList.toggle('active');
    });

    /* Tab switching */
    document.querySelectorAll('.tab').forEach((tab) => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    /* Search and filter — debounced for performance */
    const debouncedFilter = debounce(handleFilterChange, 250);
    searchInput.addEventListener('input', debouncedFilter);
    categoryFilter.addEventListener('change', handleFilterChange);
    commonalityFilter.addEventListener('change', handleFilterChange);

    /* Action buttons */
    analyzeButton.addEventListener('click', handleAnalyze);
    clearButton.addEventListener('click', handleClear);

    /* Export buttons */
    document.getElementById('exportExcel').addEventListener('click', () =>
        exportToExcel(analyzedData)
    );
    document.getElementById('exportCSV').addEventListener('click', () =>
        exportToCSV(analyzedData)
    );
    document.getElementById('exportCommonReport').addEventListener('click', () =>
        exportCommonSparesReport(analyzedData)
    );
    document.getElementById('exportComparisonReport').addEventListener('click', () =>
        exportComparisonMatrix(analyzedData)
    );
    document.getElementById('exportPDF').addEventListener('click', printReport);
});

/* ============================================================
   File change callback
   ============================================================ */

/**
 * Called whenever files are added or removed.
 */
function onFilesChanged() {
    updateButtons(uploadedFilesData.length);
    showConfigurationSections(uploadedFilesData.length > 0);

    if (uploadedFilesData.length === 0) {
        document.getElementById('dinCategoriesSection').style.display    = 'none';
        document.getElementById('interchangeableSection').style.display  = 'none';
    }
}

/* ============================================================
   Analysis
   ============================================================ */

/**
 * Parse all uploaded files, process the parts, and render the results.
 */
async function handleAnalyze() {
    loading.classList.add('active');
    resultsSection.style.display = 'none';

    try {
        const allParts = [];

        for (const fileData of uploadedFilesData) {
            const parts = await parseFile(fileData.file);

            /* Auto-detect pump model / serial from first row */
            if (parts.length > 0) {
                if (!fileData.pumpModel && parts[0].description) {
                    fileData.pumpModel = parts[0].description;
                }
                if (!fileData.serialNo && parts[0].serialNo) {
                    fileData.serialNo = parts[0].serialNo;
                }
            }

            parts.forEach((part) => {
                part.sourceFile     = fileData.pumpLabel;
                part.sourceFileName = fileData.name;
                part.pumpQuantity   = fileData.pumpQuantity;
                part.pumpModel      = fileData.pumpModel  || part.description || 'N/A';
                part.pumpSerialNo   = fileData.serialNo   || part.serialNo    || 'N/A';
                part.location       = fileData.location;
            });

            allParts.push(...parts);
        }

        const totalPumps = uploadedFilesData.reduce((sum, f) => sum + f.pumpQuantity, 0);

        analyzedData = processAndCategorizeParts(allParts, totalPumps, interchangeableEnabled);

        /* Attach pump list (built from UI state, not raw parts) */
        analyzedData.pumpList = uploadedFilesData.map((f) => ({
            label:    f.pumpLabel,
            file:     f.name,
            quantity: f.pumpQuantity,
            model:    f.pumpModel,
            serial:   f.serialNo,
            location: f.location,
            ksbReferenceNumber: f.ksbReferenceNumber,
            preparedBy: f.preparedBy,
            endUserName: f.endUserName,
            endUserNumber: f.endUserNumber,
            installationPointNumber: f.installationPointNumber,
        }));

        displayResults(analyzedData, interchangeableEnabled);

        loading.classList.remove('active');
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error('Error analyzing parts:', error);
        showNotification('❌ Error analyzing files. Please check the file format and try again.', 'error');
        loading.classList.remove('active');
    }
}

/* ============================================================
   Clear
   ============================================================ */

/**
 * Reset application state and clear all UI.
 */
function handleClear() {
    uploadedFilesData.length = 0; // clear array in place
    document.getElementById('uploadedFiles').innerHTML = '';
    document.getElementById('dinCategoriesSection').style.display    = 'none';
    document.getElementById('interchangeableSection').style.display  = 'none';
    resultsSection.style.display = 'none';
    analyzedData               = null;
    interchangeableEnabled     = false;
    interchangeableToggle.classList.remove('active');
    updateButtons(0);
    fileInput.value = '';
}

/* ============================================================
   Filter handler
   ============================================================ */

/**
 * Apply search/filter to the currently active tab.
 */
function handleFilterChange() {
    if (!analyzedData) return;

    const searchTerm      = searchInput.value.toLowerCase();
    const categoryValue   = categoryFilter.value;
    const commonalityValue= commonalityFilter.value;

    const filteredData = applyDataFilters(analyzedData, searchTerm, categoryValue, commonalityValue);

    const activeTab = document.querySelector('.tab.active');
    if (!activeTab) return;

    const tabName = activeTab.dataset.tab;
    if (tabName !== 'comparison' && tabName !== 'common-only') {
        displayPartsTable(tabName === 'all' ? 'all' : tabName, filteredData);
    }
}
