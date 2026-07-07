/**
 * config.js — Application configuration and constants
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 * 
 * This file contains all configuration values, magic numbers,
 * and constants used throughout the application.
 */

'use strict';

/* ============================================================
   Company Information
   ============================================================ */
const COMPANY_INFO = {
    name: 'KSB Pump',
    fullName: 'KSB Pump Solutions',
    website: 'www.ksb.com',
    supportEmail: 'support@ksb.com',
    phone: '+1-XXX-XXX-XXXX',
    address: {
        street: '',
        city: '',
        state: '',
        zip: '',
        country: ''
    }
};

/* ============================================================
   Application Metadata
   ============================================================ */
const APP_INFO = {
    name: 'Interchangeable Parts List Creator',
    version: '2.0.0',
    standard: 'DIN 24296',
    standardSection: 'Section 7.7.2, Table 32',
    description: 'Professional spare parts analysis and optimization tool',
};

/* ============================================================
   File Handling Constants
   ============================================================ */
const FILE_LIMITS = {
    maxSizeBytes: 10 * 1024 * 1024,  // 10 MB
    maxSizeMB: 10,
    allowedExtensions: ['.csv', '.xlsx', '.xls'],
    allowedMimeTypes: [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
};

/* ============================================================
   CSV Parsing Constants
   ============================================================ */
const CSV_CONFIG = {
    delimiter: ';',
    headerRow: 0,
    skipEmptyLines: true,
    encoding: 'UTF-8'
};

/* ============================================================
   Excel Parsing Constants
   ============================================================ */
const EXCEL_CONFIG = {
    maxHeaderSearchRows: 20,
    requiredHeaderKeywords: ['Part No', 'PTT'],
    sheetIndex: 0
};

/* ============================================================
   Input Validation Constants
   ============================================================ */
const VALIDATION = {
    pumpLabel: {
        minLength: 1,
        maxLength: 100,
        pattern: /^[\w\s\-._]+$/
    },
    pumpQuantity: {
        min: 1,
        max: 10000
    },
    pumpModel: {
        maxLength: 200
    },
    serialNo: {
        maxLength: 200
    },
    location: {
        maxLength: 200
    },
    weight: {
        min: 0,
        max: 999999
    }
};

/* ============================================================
   UI Constants
   ============================================================ */
const UI_CONFIG = {
    notificationDuration: 3500,        // ms
    debounceDelay: 250,                // ms for search/filter
    animationDuration: 300,            // ms
    loadingMinDisplay: 500,            // minimum loading spinner display time
    maxTableRowsBeforePagination: 100, // rows
    itemsPerPage: 50,                  // pagination size
    virtualScrollThreshold: 1000       // rows before enabling virtual scroll
};

/* ============================================================
   DIN 24296 Table 32 Constants
   ============================================================ */
const DIN_24296_CONFIG = {
    fleetSizeThresholds: {
        large: 10,     // 10+ pumps use percentage calculation
        medium: 8,     // 8-9 pumps
        small: 6,      // 6-7 pumps
        minimal: 2     // 2-5 pumps
    },
    tableIndexOffset: 2  // Table array starts at index 2 for 2 pumps
};

/* ============================================================
   Export Configuration
   ============================================================ */
const EXPORT_CONFIG = {
    dateFormat: 'YYYY-MM-DD',
    timeFormat: 'HH:mm:ss',
    defaultFilenamePrefix: 'KSB_Parts_Analysis',
    includeTimestamp: true,
    includeCompanyBranding: true,
    excel: {
        summarySheetName: 'Summary',
        partsSheetName: 'All Parts',
        commonSparesSheetName: 'Common Spares',
        comparisonSheetName: 'Comparison Matrix',
        pumpInventorySheetName: 'Pump Inventory'
    },
    csv: {
        delimiter: ',',
        encoding: 'UTF-8',
        includeHeaders: true
    }
};

/* ============================================================
   Color & Theme Constants
   ============================================================ */
const THEME = {
    colors: {
        primary: '#667eea',
        secondary: '#764ba2',
        success: '#28a745',
        danger: '#ee5a6f',
        warning: '#ffc107',
        info: '#17a2b8',
        ksb: {
            primary: '#0066CC',      // KSB Blue
            secondary: '#003D7A',    // KSB Dark Blue
            accent: '#00A0DC'        // KSB Light Blue
        }
    },
    spacing: {
        xs: '5px',
        sm: '10px',
        md: '20px',
        lg: '30px',
        xl: '40px'
    }
};

/* ============================================================
   Feature Flags
   ============================================================ */
const FEATURES = {
    darkMode: false,              // Dark mode theme
    costCalculation: false,       // Cost per part calculation
    fuzzyMatching: false,         // Fuzzy part number matching
    multiLanguage: false,         // Multi-language support
    offlineMode: false,           // Offline caching
    advancedFilters: false,       // Additional filter options
    exportTemplates: false,       // Custom export templates
    qrCodeGeneration: false,      // QR codes for parts
    sessionPersistence: true,     // Save state to localStorage
    keyboardShortcuts: true,      // Keyboard shortcuts enabled
    undoRedo: false,              // Undo/redo functionality
    bulkEdit: false,              // Bulk edit pump metadata
    dragReorder: false            // Drag-to-reorder files
};

/* ============================================================
   Keyboard Shortcuts
   ============================================================ */
const KEYBOARD_SHORTCUTS = {
    exportExcel: { key: 'e', ctrl: true, alt: false },
    exportCSV: { key: 'c', ctrl: true, shift: true },
    analyze: { key: 'Enter', ctrl: true, alt: false },
    clear: { key: 'Delete', ctrl: true, alt: false },
    search: { key: 'f', ctrl: true, alt: false }
};

/* ============================================================
   Error Messages
   ============================================================ */
const ERROR_MESSAGES = {
    fileUpload: {
        invalidExtension: 'Unsupported file type. Please upload CSV or Excel (.xlsx/.xls) files.',
        fileTooLarge: 'File exceeds the maximum size limit of {maxSize} MB.',
        readError: 'Failed to read the file. Please ensure it is not corrupted.',
        parseError: 'Failed to parse the file. Please check the file format.',
        noData: 'No valid data found in the file.'
    },
    validation: {
        requiredField: 'This field is required.',
        invalidFormat: 'Invalid format. Please check your input.',
        outOfRange: 'Value must be between {min} and {max}.',
        invalidPumpLabel: 'Pump label contains invalid characters.',
        invalidQuantity: 'Quantity must be a positive number between 1 and 10,000.'
    },
    analysis: {
        noFiles: 'Please upload at least one file before analyzing.',
        processingError: 'An error occurred during analysis. Please try again.',
        noCommonParts: 'No common parts found across the uploaded files.'
    },
    export: {
        noData: 'No data available to export.',
        exportFailed: 'Export failed. Please try again.',
        browserNotSupported: 'Your browser does not support this export format.'
    }
};

/* ============================================================
   Success Messages
   ============================================================ */
const SUCCESS_MESSAGES = {
    fileUpload: 'File uploaded successfully.',
    analysis: 'Analysis completed successfully.',
    export: {
        excel: 'Excel file exported successfully.',
        csv: 'CSV file exported successfully.',
        pdf: 'PDF report generated successfully.'
    },
    dataSaved: 'Your preferences have been saved.'
};

/* ============================================================
   Column Mappings for File Parsing
   ============================================================ */
const COLUMN_MAPPINGS = {
    partNo: ['Part No.', 'Part No', 'PTT', 'Part Number', 'Item No', 'Item Number'],
    designation: ['Designation', 'Name', 'Description', 'Part Name'],
    materialNumber: ['Material Number', 'Material No', 'Mat. No.', 'Material', 'Mat No'],
    quantity: ['Quantity', 'Qty', 'Qty.', 'Amount'],
    quantityUnit: ['Quantity Unit', 'Unit', 'Qty Unit', 'UoM'],
    weight: ['Weight', 'Wt', 'Mass'],
    weightUnit: ['Weight Unit', 'Wt Unit', 'Weight UoM'],
    serialNo: ['Serial No.', 'Serial No', 'Serial-No.', 'S/N', 'SN'],
    year: ['Year', 'Manufacturing Year', 'Mfg Year'],
    material: ['Material', 'Mat.', 'Material Type']
};

/* ============================================================
   Local Storage Keys
   ============================================================ */
const STORAGE_KEYS = {
    userPreferences: 'ksb_parts_user_preferences',
    lastSession: 'ksb_parts_last_session',
    exportFormat: 'ksb_parts_export_format',
    filterSettings: 'ksb_parts_filter_settings',
    themeMode: 'ksb_parts_theme_mode'
};

/* ============================================================
   Export all constants
   ============================================================ */
if (typeof window !== 'undefined') {
    window.COMPANY_INFO = COMPANY_INFO;
    window.APP_INFO = APP_INFO;
    window.FILE_LIMITS = FILE_LIMITS;
    window.CSV_CONFIG = CSV_CONFIG;
    window.EXCEL_CONFIG = EXCEL_CONFIG;
    window.VALIDATION = VALIDATION;
    window.UI_CONFIG = UI_CONFIG;
    window.DIN_24296_CONFIG = DIN_24296_CONFIG;
    window.EXPORT_CONFIG = EXPORT_CONFIG;
    window.THEME = THEME;
    window.FEATURES = FEATURES;
    window.KEYBOARD_SHORTCUTS = KEYBOARD_SHORTCUTS;
    window.ERROR_MESSAGES = ERROR_MESSAGES;
    window.SUCCESS_MESSAGES = SUCCESS_MESSAGES;
    window.COLUMN_MAPPINGS = COLUMN_MAPPINGS;
    window.STORAGE_KEYS = STORAGE_KEYS;
}
