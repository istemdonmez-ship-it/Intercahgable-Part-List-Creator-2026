# Interchangeable Parts List Creator 2026

A professional, browser-based tool for generating **DIN 24296 compliant** interchangeable spare parts lists for industrial pump fleets.

---

## 🚀 Features

- 📁 **Multi-file upload** — drag & drop or click-to-select CSV and Excel files for each pump
- 🔄 **Interchangeability analysis** — automatically identifies parts shared across multiple pumps
- 📊 **DIN 24296 Table 32** — applies the official German standard lookup table to calculate optimized stock quantities
- 💰 **Inventory optimization** — shows potential savings when interchangeable parts are consolidated
- 🏷️ **Part categorization** — automatically classifies parts into shafts, impellers, seals, bearings, wear parts, and accessories
- 📤 **Multiple export formats** — Excel (.xlsx), CSV, common spares report, pump comparison matrix, print/PDF
- 🔍 **Search and filter** — full-text search with category and commonality filters
- 📱 **Responsive design** — works on desktop, tablet, and mobile

---

## 📋 DIN 24296 Standard

DIN 24296 is the German standard for **recommended spare parts for pumps, compressors, and armatures**. Section 7.7.2 (Table 32) provides specific quantity recommendations based on:

- **Part type** (shaft, impeller, bearing, seal, etc.)
- **Fleet size** (number of identical or similar pumps)

When multiple pumps share common parts, a single stock pool can serve the entire fleet — reducing inventory costs while maintaining the same service level.

| Fleet Size | Shaft / Impeller | Rolling Bearing | Sealing Elements |
|-----------|:----------------:|:---------------:|:----------------:|
| 2 pumps   | 1 pc | 1 pc | 4 sets |
| 3 pumps   | 1 pc | 1 pc | 6 sets |
| 4 pumps   | 1 pc | 2 pcs | 8 sets |
| 5 pumps   | 2 pcs | 2 pcs | 8 sets |
| 6–7 pumps | 2 pcs | 3 pcs | 12 sets |
| 8–9 pumps | 2 pcs | 3 pcs | 12 sets |
| ≥ 10 pumps | 20% × fleet | 25% × fleet | 150% × fleet |

---

## 🖥️ Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome  | 90+ |
| Firefox | 88+ |
| Safari  | 14+ |
| Edge    | 90+ |

No installation or server is required. Open `Code.html` directly in any modern browser.

---

## 📂 Project Structure

```
/
├── Code.html               — Main application page
├── README.md               — This file
├── LICENSE                 — MIT License
├── .gitignore
│
├── css/
│   ├── main.css            — CSS variables, base styles, layout
│   ├── components.css      — Reusable UI components
│   └── responsive.css      — Media queries (mobile, print)
│
├── js/
│   ├── app.js              — Main application entry point
│   ├── fileHandler.js      — File upload, validation, drag & drop, parsing
│   ├── dinClassifier.js    — DIN 24296 classification & Table 32 lookup
│   ├── dataProcessor.js    — Data analysis, consolidation, filtering
│   ├── exportManager.js    — Excel, CSV, and print export
│   ├── uiController.js     — UI rendering, tabs, notifications
│   └── utils.js            — Sanitization, validation, formatting helpers
│
├── docs/
│   ├── USAGE.md            — Step-by-step user guide
│   ├── DIN_24296_GUIDE.md  — Detailed DIN 24296 standard explanation
│   └── API.md              — JavaScript module documentation
│
└── examples/
    └── sample-data.csv     — Example input file with pump spare parts
```

---

## 🔧 Usage

1. Open `Code.html` in your browser.
2. Upload one or more CSV / Excel files (one file per pump or pump type).
3. (Optional) Label each pump and enter its quantity, model, and location.
4. Toggle **DIN 24296 Table 32 optimization** if you want interchangeable-parts analysis.
5. Click **Analyze Parts**.
6. Review results in the tabs and export in your preferred format.

For detailed instructions, see [docs/USAGE.md](docs/USAGE.md).

---

## 📄 Input File Format

Your input files should contain at minimum a **Part No.** (or `PTT`) column. Recognized column headers:

| Column | Required | Notes |
|--------|:--------:|-------|
| `Part No.` / `PTT` | ✅ | Unique part identifier |
| `Material Number` | — | Internal material code |
| `Designation` | — | Part description (used for classification) |
| `Material` | — | Material composition |
| `Quantity` | — | Quantity per pump |
| `Quantity Unit` | — | e.g. Piece, Set |
| `Weight` | — | Weight per unit |
| `Weight Unit` | — | e.g. kg |
| `Serial No.` | — | Pump serial number |
| `Year` | — | Manufacturing year |

CSV files should use semicolons (`;`) as delimiter. Excel files (.xlsx / .xls) should have the header row within the first 20 rows.

---

## 🔒 Security

- All user inputs are sanitized to prevent XSS attacks.
- File type and size validation is performed before parsing.
- A Content Security Policy (CSP) meta tag restricts script sources.
- Third-party CDN scripts are loaded with `crossorigin="anonymous"`.

---

## 🛠️ Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| [SheetJS (XLSX)](https://sheetjs.com/) | 0.18.5 | Excel parsing and export |
| [PapaParse](https://www.papaparse.com/) | 5.4.1 | CSV parsing |

No build tools, bundlers, or package managers are required. All dependencies are bundled locally in `js/lib/`.

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request.

Please follow the existing code style (ES6+, JSDoc comments, BEM CSS).

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📞 Support

For questions about DIN 24296 compliance or spare parts optimization, refer to [docs/DIN_24296_GUIDE.md](docs/DIN_24296_GUIDE.md).