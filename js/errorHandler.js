/**
 * errorHandler.js — Centralized error handling and logging
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/**
 * Error types enum
 */
const ERROR_TYPES = {
    FILE_UPLOAD: 'FILE_UPLOAD',
    FILE_PARSE: 'FILE_PARSE',
    VALIDATION: 'VALIDATION',
    ANALYSIS: 'ANALYSIS',
    EXPORT: 'EXPORT',
    NETWORK: 'NETWORK',
    UNKNOWN: 'UNKNOWN'
};

/**
 * Error severity levels
 */
const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

/**
 * Custom Application Error class
 */
class AppError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} type - Error type from ERROR_TYPES
     * @param {string} severity - Error severity level
     * @param {Error} [originalError] - Original error object if wrapping
     * @param {object} [context] - Additional context data
     */
    constructor(message, type = ERROR_TYPES.UNKNOWN, severity = ERROR_SEVERITY.MEDIUM, originalError = null, context = {}) {
        super(message);
        this.name = 'AppError';
        this.type = type;
        this.severity = severity;
        this.originalError = originalError;
        this.context = context;
        this.timestamp = new Date().toISOString();
        
        // Capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AppError);
        }
    }
}

/**
 * Global error handler for unhandled errors
 */
function initializeGlobalErrorHandler() {
    window.addEventListener('error', (event) => {
        console.error('Uncaught error:', event.error);
        logError(new AppError(
            'An unexpected error occurred',
            ERROR_TYPES.UNKNOWN,
            ERROR_SEVERITY.HIGH,
            event.error
        ));
        
        // Show user-friendly notification
        if (typeof showNotification === 'function') {
            showNotification(
                'An unexpected error occurred. Please refresh the page and try again.',
                'error'
            );
        }
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        logError(new AppError(
            'An unexpected error occurred',
            ERROR_TYPES.UNKNOWN,
            ERROR_SEVERITY.HIGH,
            event.reason
        ));
    });
}

/**
 * Log error to console and potentially to a logging service
 * @param {AppError|Error} error - Error object to log
 */
function logError(error) {
    const errorInfo = {
        message: error.message,
        type: error.type || ERROR_TYPES.UNKNOWN,
        severity: error.severity || ERROR_SEVERITY.MEDIUM,
        timestamp: error.timestamp || new Date().toISOString(),
        stack: error.stack,
        context: error.context || {}
    };

    // Log to console with appropriate level
    switch (errorInfo.severity) {
        case ERROR_SEVERITY.CRITICAL:
        case ERROR_SEVERITY.HIGH:
            console.error('[ERROR]', errorInfo);
            break;
        case ERROR_SEVERITY.MEDIUM:
            console.warn('[WARNING]', errorInfo);
            break;
        case ERROR_SEVERITY.LOW:
            console.info('[INFO]', errorInfo);
            break;
        default:
            console.log('[LOG]', errorInfo);
    }

    // In a production environment, you might send this to a logging service
    // Example: sendToLoggingService(errorInfo);
}

/**
 * Handle file upload errors
 * @param {Error} error - Original error
 * @param {string} fileName - Name of the file that caused the error
 * @param {string} userMessage - User-friendly error message
 */
function handleFileUploadError(error, fileName, userMessage) {
    const appError = new AppError(
        userMessage || 'Failed to upload file',
        ERROR_TYPES.FILE_UPLOAD,
        ERROR_SEVERITY.MEDIUM,
        error,
        { fileName }
    );
    
    logError(appError);
    
    if (typeof showNotification === 'function') {
        showNotification(`❌ ${userMessage}`, 'error');
    }
    
    return appError;
}

/**
 * Handle file parsing errors
 * @param {Error} error - Original error
 * @param {string} fileName - Name of the file that caused the error
 * @param {string} fileType - Type of file (CSV, Excel, etc.)
 */
function handleFileParseError(error, fileName, fileType) {
    const userMessage = `Failed to parse ${fileType} file: ${fileName}. Please check the file format.`;
    const appError = new AppError(
        userMessage,
        ERROR_TYPES.FILE_PARSE,
        ERROR_SEVERITY.MEDIUM,
        error,
        { fileName, fileType }
    );
    
    logError(appError);
    
    if (typeof showNotification === 'function') {
        showNotification(`❌ ${userMessage}`, 'error');
    }
    
    return appError;
}

/**
 * Handle validation errors
 * @param {string} fieldName - Name of the field that failed validation
 * @param {string} value - Value that failed validation
 * @param {string} validationRule - Rule that was violated
 */
function handleValidationError(fieldName, value, validationRule) {
    const userMessage = ERROR_MESSAGES?.validation?.[validationRule] || `Invalid ${fieldName}: ${validationRule}`;
    const appError = new AppError(
        userMessage,
        ERROR_TYPES.VALIDATION,
        ERROR_SEVERITY.LOW,
        null,
        { fieldName, value, validationRule }
    );
    
    logError(appError);
    
    if (typeof showNotification === 'function') {
        showNotification(`⚠️ ${userMessage}`, 'error');
    }
    
    return appError;
}

/**
 * Handle analysis errors
 * @param {Error} error - Original error
 * @param {string} operation - Description of the operation that failed
 */
function handleAnalysisError(error, operation) {
    const userMessage = `Analysis failed during ${operation}. Please check your data and try again.`;
    const appError = new AppError(
        userMessage,
        ERROR_TYPES.ANALYSIS,
        ERROR_SEVERITY.HIGH,
        error,
        { operation }
    );
    
    logError(appError);
    
    if (typeof showNotification === 'function') {
        showNotification(`❌ ${userMessage}`, 'error');
    }
    
    return appError;
}

/**
 * Handle export errors
 * @param {Error} error - Original error
 * @param {string} exportType - Type of export (Excel, CSV, PDF, etc.)
 */
function handleExportError(error, exportType) {
    const userMessage = `Failed to export ${exportType} file. Please try again.`;
    const appError = new AppError(
        userMessage,
        ERROR_TYPES.EXPORT,
        ERROR_SEVERITY.MEDIUM,
        error,
        { exportType }
    );
    
    logError(appError);
    
    if (typeof showNotification === 'function') {
        showNotification(`❌ ${userMessage}`, 'error');
    }
    
    return appError;
}

/**
 * Wrap an async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} errorType - Type of error for this operation
 * @param {string} errorMessage - User-friendly error message
 * @returns {Function} Wrapped function
 */
function withErrorHandler(fn, errorType, errorMessage) {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            const appError = new AppError(
                errorMessage,
                errorType,
                ERROR_SEVERITY.HIGH,
                error
            );
            logError(appError);
            
            if (typeof showNotification === 'function') {
                showNotification(`❌ ${errorMessage}`, 'error');
            }
            
            throw appError;
        }
    };
}

/**
 * Safely execute a function and handle errors
 * @param {Function} fn - Function to execute
 * @param {*} defaultValue - Default value to return if function fails
 * @param {string} context - Context description for logging
 * @returns {*} Result of function or default value
 */
function safeExecute(fn, defaultValue = null, context = 'unknown operation') {
    try {
        return fn();
    } catch (error) {
        logError(new AppError(
            `Error during ${context}`,
            ERROR_TYPES.UNKNOWN,
            ERROR_SEVERITY.LOW,
            error,
            { context }
        ));
        return defaultValue;
    }
}

/**
 * Export all error handling utilities
 */
if (typeof window !== 'undefined') {
    window.ERROR_TYPES = ERROR_TYPES;
    window.ERROR_SEVERITY = ERROR_SEVERITY;
    window.AppError = AppError;
    window.initializeGlobalErrorHandler = initializeGlobalErrorHandler;
    window.logError = logError;
    window.handleFileUploadError = handleFileUploadError;
    window.handleFileParseError = handleFileParseError;
    window.handleValidationError = handleValidationError;
    window.handleAnalysisError = handleAnalysisError;
    window.handleExportError = handleExportError;
    window.withErrorHandler = withErrorHandler;
    window.safeExecute = safeExecute;
}
