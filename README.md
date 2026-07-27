# GST Invoice — Quotation & Invoice Maker

A beautiful, lightweight, privacy-focused, and open-source billing tool. Generate professional estimates and tax invoices directly in your web browser. 

No signup, no tracking, and no external servers. **100% of your data remains inside your browser.**

---

## ✨ Features

- **Double-Duty Modes**: Easily toggle between **Quotation** (estimates) and **Invoice** modes, or convert an active quotation to an invoice with a single click.
- **Indian GST Support**: Supports localized tax settings. Choose between CGST + SGST (Intrastate) or IGST (Interstate) calculations.
- **Auto Currency in Words**: Built-in translation converts calculated grand totals into words (supports the Indian numbering system: Crore, Lakh, Thousand, Rupees).
- **Custom Branding**: Upload your business logo and custom footer promo banner (for payment QR codes, ads, or terms).
- **Persistence Layer**: Saves default company settings, client lists, and document indices locally in your browser.
- **Print & PDF Ready**: Tailored print stylesheet guarantees high-fidelity, high-contrast A4 paper sheets when printing or exporting to PDF.

---

## 🏗️ Architecture & SOLID Principles

This application has been refactored from a single monolithic file into a modular project. It adheres strictly to modern web development standards and **SOLID principles**:

```
├── index.html          # Clean HTML presentation layer (no inline scripts/styles)
├── css/
│   └── styles.css      # Core grid layout, sheet design, and print media queries
└── js/
    ├── app.js          # Controller orchestrating DOM queries and program event listeners
    ├── models/
    │   ├── Document.js # Document entity managing totals calculations & serialization
    │   └── LineItem.js # Individual line items structure & amounts calculation
    ├── services/
    │   └── StorageService.js # Decoupled local storage persistence interface (DIP)
    └── utils/
        └── Formatters.js     # Helpers for currency, date parsing, and number-to-words
```

### Applied Guidelines
- **Single Responsibility Principle (SRP)**: Each class/module handles exactly one aspect of the application (e.g. `StorageService` only manages local storage, `Document` handles tax/total math, `Formatters` handles transformations).
- **Dependency Inversion (DIP)**: The application logic interacts with a decoupled storage abstraction class. If you choose to host this on a server or connect to a database (e.g., Firebase, PostgreSQL) in the future, you only need to modify `StorageService.js` without touching the views or models.
- **Separation of Concerns**: Markup, styling, and JavaScript logic are completely decoupled. HTML tags contain no inline `onclick` or `oninput` JavaScript attributes, which are bound programmatically in `app.js` instead.

---

## 🚀 Getting Started

Since GST Invoice is written in pure vanilla HTML, CSS, and modern JavaScript modules, it requires **no build step** or dependency installation.

### Method 1: Double-Click (Simple)
Simply open the `index.html` file in any modern web browser.

### Method 2: Local HTTP Server (Recommended)
Because the codebase uses modern ES6 modules (`type="module"`), some browsers restrict loading files directly from the local file system (`file://`) due to CORS policies. Running a local server resolves this:

**Using Python:**
```bash
python3 -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

**Using Node.js:**
```bash
npx http-server -p 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

---

## 🔒 Privacy First

No network requests are ever made by GST Invoice. Your company details, client contact list, items list, logos, and invoices are saved exclusively in your browser's `localStorage`. You can run this app entirely offline.

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).
