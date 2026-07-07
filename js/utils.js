/**
 * utils.js — Helper functions and validation utilities
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/* ============================================================
   Input sanitization
   ============================================================ */

/**
 * Strip HTML tags and trim whitespace from a string to prevent XSS.
 * @param {string} value - Raw input value.
 * @returns {string} Sanitized string.
 */
function sanitizeString(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/[<>"'`]/g, (c) => {
            const map = { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '`': '&#x60;' };
            return map[c];
        })
        .trim();
}

/**
 * Remove leading/trailing quotes and whitespace from spreadsheet cell values.
 * @param {*} value - Raw cell value.
 * @returns {string} Cleaned string.
 */
function cleanValue(value) {
    if (!value && value !== 0) return '';
    return String(value).trim().replace(/^["'\s]+|["'\s]+$/g, '');
}

/* ============================================================
   Validation
   ============================================================ */

/**
 * Validate that a file has an accepted extension.
 * @param {File} file - File object.
 * @returns {boolean}
 */
function isValidFileExtension(file) {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const name = file.name.toLowerCase();
    return allowed.some((ext) => name.endsWith(ext));
}

/**
 * Validate file size against a maximum limit.
 * @param {File} file - File object.
 * @param {number} [maxMB=10] - Maximum allowed size in megabytes.
 * @returns {boolean}
 */
function isValidFileSize(file, maxMB = 10) {
    return file.size <= maxMB * 1024 * 1024;
}

/**
 * Validate a pump label (non-empty, printable characters only).
 * @param {string} label
 * @returns {boolean}
 */
function isValidPumpLabel(label) {
    if (typeof label !== 'string') return false;
    const trimmed = label.trim();
    return trimmed.length > 0 && trimmed.length <= 100;
}

/**
 * Validate a pump quantity value.
 * @param {*} qty
 * @returns {boolean}
 */
function isValidQuantity(qty) {
    const n = Number(qty);
    return Number.isFinite(n) && n >= 1 && n <= 10000;
}

/* ============================================================
   Formatting helpers
   ============================================================ */

/**
 * Format file size in human-readable units.
 * @param {number} bytes
 * @returns {string} e.g. "1.23 MB"
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format a date as a locale-aware string.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function formatDate(date = new Date()) {
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Format a date as an ISO date string (YYYY-MM-DD), suitable for filenames.
 * @param {Date} [date=new Date()]
 * @returns {string}
 */
function formatDateISO(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * Format a number as a percentage string.
 * @param {number} value - Ratio (0–1).
 * @param {number} [decimals=1]
 * @returns {string} e.g. "42.5%"
 */
function formatPercent(value, decimals = 1) {
    return `${(value * 100).toFixed(decimals)}%`;
}

/* ============================================================
   Sorting
   ============================================================ */

/**
 * Generic comparator factory for sorting arrays of objects.
 * @param {string} key - Property key to sort by.
 * @param {'asc'|'desc'} [direction='asc']
 * @returns {Function} Comparator function.
 */
function sortByKey(key, direction = 'asc') {
    return (a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
    };
}

/* ============================================================
   Debounce / Throttle
   ============================================================ */

/**
 * Debounce a function — delays execution until `wait` ms after last call.
 * @param {Function} fn - Function to debounce.
 * @param {number} wait - Delay in milliseconds.
 * @returns {Function}
 */
function debounce(fn, wait) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/**
 * Throttle a function — ensures it fires at most once per `limit` ms.
 * @param {Function} fn
 * @param {number} limit - Minimum interval in milliseconds.
 * @returns {Function}
 */
function throttle(fn, limit) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            return fn.apply(this, args);
        }
    };
}

/**
 * Format a pump header display name with optional serial number.
 * @param {object} pump - Pump object with model, serial, and label properties.
 * @param {boolean} includeSerial - Whether to include serial number in the output.
 * @param {boolean} asHTML - Whether to format as HTML (with <br> tags) or plain text.
 * @returns {string} Formatted pump header.
 */
function formatPumpHeader(pump, includeSerial = true, asHTML = true) {
    const displayName = pump.model && pump.model !== 'N/A' ? pump.model : pump.label;
    const sanitizedName = sanitizeString(displayName);
    
    if (!includeSerial || !pump.serial || pump.serial === 'N/A') {
        return sanitizedName;
    }
    
    const sanitizedSerial = sanitizeString(pump.serial);
    if (asHTML) {
        return `${sanitizedName}<br><small>SN: ${sanitizedSerial}</small>`;
    } else {
        return `${sanitizedName} (SN: ${sanitizedSerial})`;
    }
}

/* ============================================================
   CSV escaping
   ============================================================ */

/**
 * Escape a value for safe inclusion in a CSV cell.
 * Wraps in double-quotes if the value contains commas, quotes, or newlines.
 * @param {*} value
 * @returns {string}
 */
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}
