/**
 * keyboardShortcuts.js — Keyboard shortcuts handler
 * Interchangeable Parts List Creator - DIN 24296 Compliant
 */

'use strict';

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    if (!FEATURES || !FEATURES.keyboardShortcuts) {
        return;
    }

    document.addEventListener('keydown', handleKeyboardShortcut);
    
    // Show keyboard shortcuts help when user presses '?' or F1
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' || e.key === 'F1') {
            e.preventDefault();
            showKeyboardShortcutsHelp();
        }
    });
}

/**
 * Handle keyboard shortcut
 * @param {KeyboardEvent} event - Keyboard event
 */
function handleKeyboardShortcut(event) {
    const shortcuts = KEYBOARD_SHORTCUTS || {
        exportExcel: { key: 'e', ctrl: true, alt: false },
        exportCSV: { key: 'c', ctrl: true, shift: true },
        analyze: { key: 'Enter', ctrl: true, alt: false },
        clear: { key: 'Delete', ctrl: true, alt: false },
        search: { key: 'f', ctrl: true, alt: false }
    };

    // Check for Export to Excel (Ctrl+E)
    if (matches(event, shortcuts.exportExcel)) {
        event.preventDefault();
        const exportBtn = document.getElementById('exportExcel');
        if (exportBtn && !exportBtn.disabled) {
            exportBtn.click();
        }
        return;
    }

    // Check for Export to CSV (Ctrl+Shift+C)
    if (matches(event, shortcuts.exportCSV)) {
        event.preventDefault();
        const exportBtn = document.getElementById('exportCSV');
        if (exportBtn && !exportBtn.disabled) {
            exportBtn.click();
        }
        return;
    }

    // Check for Analyze (Ctrl+Enter)
    if (matches(event, shortcuts.analyze)) {
        event.preventDefault();
        const analyzeBtn = document.getElementById('analyzeButton');
        if (analyzeBtn && !analyzeBtn.disabled) {
            analyzeBtn.click();
        }
        return;
    }

    // Check for Clear (Ctrl+Delete)
    if (matches(event, shortcuts.clear)) {
        event.preventDefault();
        const clearBtn = document.getElementById('clearButton');
        if (clearBtn && !clearBtn.disabled) {
            if (confirm('Are you sure you want to clear all data?')) {
                clearBtn.click();
            }
        }
        return;
    }

    // Check for Search focus (Ctrl+F)
    if (matches(event, shortcuts.search)) {
        event.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
        return;
    }

    // Escape key to close modals/dialogs
    if (event.key === 'Escape') {
        closeAllModals();
        return;
    }
}

/**
 * Check if keyboard event matches a shortcut definition
 * @param {KeyboardEvent} event - Keyboard event
 * @param {object} shortcut - Shortcut definition
 * @returns {boolean} True if event matches shortcut
 */
function matches(event, shortcut) {
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
    const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
    const altMatch = shortcut.alt ? event.altKey : !event.altKey;
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
    
    return keyMatch && ctrlMatch && altMatch && shiftMatch;
}

/**
 * Close all modals and dialogs
 */
function closeAllModals() {
    // Close any open modals
    const modals = document.querySelectorAll('.modal.active, .dialog.active');
    modals.forEach(modal => modal.classList.remove('active'));
    
    // Clear search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput && document.activeElement === searchInput) {
        searchInput.blur();
    }
}

/**
 * Show keyboard shortcuts help overlay
 */
function showKeyboardShortcutsHelp() {
    const shortcuts = KEYBOARD_SHORTCUTS || {};
    const helpContent = `
        <div class="keyboard-shortcuts-help">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <table class="shortcuts-table">
                <thead>
                    <tr>
                        <th>Action</th>
                        <th>Shortcut</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Export to Excel</td>
                        <td><kbd>Ctrl</kbd> + <kbd>E</kbd></td>
                    </tr>
                    <tr>
                        <td>Export to CSV</td>
                        <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd></td>
                    </tr>
                    <tr>
                        <td>Analyze Parts</td>
                        <td><kbd>Ctrl</kbd> + <kbd>Enter</kbd></td>
                    </tr>
                    <tr>
                        <td>Clear All</td>
                        <td><kbd>Ctrl</kbd> + <kbd>Delete</kbd></td>
                    </tr>
                    <tr>
                        <td>Focus Search</td>
                        <td><kbd>Ctrl</kbd> + <kbd>F</kbd></td>
                    </tr>
                    <tr>
                        <td>Show This Help</td>
                        <td><kbd>?</kbd> or <kbd>F1</kbd></td>
                    </tr>
                    <tr>
                        <td>Close Dialogs</td>
                        <td><kbd>Esc</kbd></td>
                    </tr>
                </tbody>
            </table>
            <p class="shortcuts-note">
                <em>Note: Use <kbd>Cmd</kbd> instead of <kbd>Ctrl</kbd> on Mac</em>
            </p>
            <button class="btn btn-primary" onclick="closeKeyboardShortcutsHelp()">
                Got it!
            </button>
        </div>
    `;

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'keyboardShortcutsOverlay';
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = helpContent;
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeKeyboardShortcutsHelp();
        }
    };

    document.body.appendChild(overlay);
}

/**
 * Close keyboard shortcuts help overlay
 */
function closeKeyboardShortcutsHelp() {
    const overlay = document.getElementById('keyboardShortcutsOverlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Export keyboard shortcuts utilities
 */
if (typeof window !== 'undefined') {
    window.initializeKeyboardShortcuts = initializeKeyboardShortcuts;
    window.showKeyboardShortcutsHelp = showKeyboardShortcutsHelp;
    window.closeKeyboardShortcutsHelp = closeKeyboardShortcutsHelp;
}
