# Changelog

All notable changes to the KSB Interchangeable Parts List Creator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-07-07

### Added
- **KSB Branding Integration**
  - Added KSB company branding to header and footer
  - Updated color palette to use KSB blue (#0066CC, #003D7A, #00A0DC)
  - Added KSB company information to all export formats (Excel, CSV)
  - Prefixed all export file names with "KSB_"
  - Updated page title and metadata with KSB branding

- **Configuration Management**
  - Created `config.js` with centralized configuration constants
  - Extracted all magic numbers to named constants
  - Added feature flags for future functionality
  - Defined company information constants
  - Added keyboard shortcut configurations
  - Created error message templates

- **Error Handling**
  - Added centralized error handling system (`errorHandler.js`)
  - Implemented custom `AppError` class for structured errors
  - Added global error handler for uncaught exceptions
  - Created specific error handlers for file upload, parsing, validation, analysis, and export operations
  - Added error logging with severity levels (LOW, MEDIUM, HIGH, CRITICAL)
  - Implemented error context tracking for better debugging

- **Keyboard Shortcuts**
  - Added keyboard shortcut support (`keyboardShortcuts.js`)
  - Implemented Ctrl+E for Excel export
  - Implemented Ctrl+Shift+C for CSV export
  - Implemented Ctrl+Enter for analyze
  - Implemented Ctrl+Delete for clear all
  - Implemented Ctrl+F for search focus
  - Added F1 or "?" to show keyboard shortcuts help
  - Added Escape key to close modals/dialogs
  - Created keyboard shortcuts help overlay

- **Accessibility Improvements**
  - Added comprehensive ARIA labels throughout the application
  - Implemented proper semantic HTML with `<header>`, `<main>`, `<footer>`, `<section>`
  - Added role attributes (banner, main, contentinfo, tab, tabpanel, etc.)
  - Added keyboard navigation support
  - Implemented focus indicators for all interactive elements
  - Added visually-hidden class for screen reader only content
  - Enhanced table accessibility with proper scope attributes

- **New HTML Structure**
  - Created `index.html` with modular JavaScript structure
  - Separated concerns with external CSS and JS files
  - Improved HTML semantics and structure
  - Added proper meta tags for SEO and accessibility

### Changed
- **CSS Refactoring**
  - Updated color variables to use KSB brand colors
  - Added new CSS variables for transitions, shadows, and spacing
  - Enhanced button styles with KSB branding
  - Improved responsive design
  - Added hover states and transitions throughout

- **Export Enhancements**
  - Updated `buildSummaryAoA()` to include KSB company information
  - Modified all export functions to use configuration constants
  - Improved export file naming convention
  - Enhanced export metadata

- **Security**
  - Strengthened Content Security Policy (CSP) headers
  - Added integrity checks for external libraries (SRI - prepared)
  - Improved input sanitization across all forms

### Improved
- **Code Quality**
  - Extracted magic numbers to constants
  - Improved code documentation
  - Better separation of concerns
  - More consistent code style
  - Added JSDoc comments to new modules

- **User Experience**
  - Faster response to user actions with keyboard shortcuts
  - Better error messages
  - More professional appearance with KSB branding
  - Enhanced visual feedback for interactive elements

## [1.0.0] - Previous Version

### Features
- Multi-file upload support (CSV, Excel)
- DIN 24296 Table 32 compliance
- Interchangeability analysis
- Part categorization (shafts, impellers, seals, bearings, wear parts, accessories)
- Multiple export formats
- Search and filter functionality
- Responsive design

---

## Upgrade Notes

### From 1.x to 2.0

**Breaking Changes:**
- New modular JavaScript structure requires using `index.html` instead of directly using individual JS files
- Configuration constants are now centralized in `config.js`

**New Dependencies:**
- `errorHandler.js` - Required for error handling
- `keyboardShortcuts.js` - Required for keyboard shortcuts feature

**Migration Steps:**
1. Update your HTML to include new script files in the correct order
2. Update any custom configurations to use the new `config.js` structure
3. Test all export functionality to ensure KSB branding appears correctly

**New Features:**
- Keyboard shortcuts are enabled by default (can be disabled via feature flags)
- Enhanced error reporting - check console for detailed error logs
- Press F1 or "?" to see keyboard shortcuts help

---

## Future Roadmap

### Version 2.1 (Planned)
- Dark mode theme
- Local storage for user preferences
- Progress indicators for file parsing
- Undo/redo functionality
- Drag-to-reorder files

### Version 2.2 (Planned)
- Cost calculation fields
- Multi-language support
- Save/load session capability
- Bulk edit for pump metadata

### Version 3.0 (Future)
- TypeScript migration
- Advanced data processing with Web Workers
- Fuzzy matching for part numbers
- Statistical analysis dashboard
- API integration for external systems

---

For questions or support, please contact: support@ksb.com
