/**
 * Application Controller (Orchestrator)
 * 
 * Manages the application lifecycle, binds DOM events, handles file readers,
 * coordinates data between Models and Services, and renders the layout.
 * Follows SOLID principles (specifically SRP and DIP).
 */
import { storageService } from './services/StorageService.js';
import { LineItem } from './models/LineItem.js';
import { Document } from './models/Document.js';
import * as Formatters from './utils/Formatters.js';

class AppController {
  constructor() {
    // Application state
    this.currentDoc = new Document();
    this.logoData = null;
    this.promoData = null;
    
    // Cache DOM references
    this.dom = {
      // Topbar buttons
      modeQuoteBtn: document.getElementById('modeQuoteBtn'),
      modeInvoiceBtn: document.getElementById('modeInvoiceBtn'),
      convertBtn: document.getElementById('convertBtn'),
      newBtn: document.getElementById('newDocBtn'),
      saveBtn: document.getElementById('saveDocBtn'),
      printBtn: document.getElementById('printDocBtn'),
      
      // Business details
      logoFile: document.getElementById('logoFile'),
      logoPreviewBox: document.getElementById('logoPreviewBox'),
      logoRemoveBtn: document.getElementById('logoRemoveBtn'),
      coName: document.getElementById('coName'),
      coMeta: document.getElementById('coMeta'),
      coMobile: document.getElementById('coMobile'),
      coGSTIN: document.getElementById('coGSTIN'),
      saveCompanyBtn: document.getElementById('saveCompanyBtn'),
      
      // Client details
      clientSelect: document.getElementById('clientSelect'),
      clName: document.getElementById('clName'),
      clMeta: document.getElementById('clMeta'),
      saveClientBtn: document.getElementById('saveClientBtn'),
      
      // Document details
      dateLabel: document.getElementById('dateLabel'),
      dueLabel: document.getElementById('dueLabel'),
      docDate: document.getElementById('docDate'),
      dueDate: document.getElementById('dueDate'),
      docNumber: document.getElementById('docNumber'),
      statusWrap: document.getElementById('statusWrap'),
      docStatus: document.getElementById('docStatus'),
      amountReceived: document.getElementById('amountReceived'),
      
      // Item Editor
      itemsEditor: document.getElementById('itemsEditor'),
      addItemBtn: document.getElementById('addItemBtn'),

      // Taxes & Settings
      discountPct: document.getElementById('discountPct'),
      gstPct: document.getElementById('gstPct'),
      gstTypeRadios: document.getElementsByName('gstType'),

      // Bank & Notes
      bankSection: document.getElementById('bankSection'),
      bankInfo: document.getElementById('bankInfo'),
      notes: document.getElementById('notes'),

      // Promo
      promoFile: document.getElementById('promoFile'),
      promoPreviewBox: document.getElementById('promoPreviewBox'),
      promoRemoveBtn: document.getElementById('promoRemoveBtn'),

      // Saved Document List
      savedList: document.getElementById('savedList'),
      sheet: document.getElementById('sheet')
    };
  }

  /**
   * Initializes the application.
   * Loads configurations, binds listeners, and performs initial render.
   */
  async init() {
    this.setupEventListeners();
    await this.loadCompanyProfile();
    await this.loadClientsList();
    
    // Set initial date and add a sample row
    this.dom.docDate.value = Formatters.todayStr();
    this.currentDoc.docDate = Formatters.todayStr();
    
    this.addItem('Sample service or product', 1, 1000, '');
    await this.prefillDocumentNumber();
    await this.renderSavedList();
    this.render();
  }

  /**
   * Programmatic binding of UI event listeners.
   * Eliminates the need for inline HTML handlers, supporting separation of concerns.
   */
  setupEventListeners() {
    // Mode toggles
    if (this.dom.modeQuoteBtn) this.dom.modeQuoteBtn.addEventListener('click', () => this.setMode('quotation'));
    if (this.dom.modeInvoiceBtn) this.dom.modeInvoiceBtn.addEventListener('click', () => this.setMode('invoice'));
    if (this.dom.convertBtn) this.dom.convertBtn.addEventListener('click', () => this.convertToInvoice());
    
    // Toolbar buttons
    if (this.dom.newBtn) this.dom.newBtn.addEventListener('click', () => this.newDoc());
    if (this.dom.saveBtn) this.dom.saveBtn.addEventListener('click', () => this.saveDoc());
    if (this.dom.printBtn) this.dom.printBtn.addEventListener('click', () => window.print());
 
    // Business info listeners
    this.dom.coName.addEventListener('input', () => {
      this.currentDoc.coName = this.dom.coName.value;
      this.render();
    });
    this.dom.coMeta.addEventListener('input', () => {
      this.currentDoc.coMeta = this.dom.coMeta.value;
      this.render();
    });
    this.dom.coMobile.addEventListener('input', () => this.render());
    this.dom.coGSTIN.addEventListener('input', () => this.render());
    
    if (this.dom.saveCompanyBtn) {
      this.dom.saveCompanyBtn.addEventListener('click', () => this.saveCompanyProfile());
    }
 
    // Client info listeners
    this.dom.clientSelect.addEventListener('change', (e) => this.selectClient(e.target.value));
    this.dom.clName.addEventListener('input', () => {
      this.currentDoc.clName = this.dom.clName.value;
      this.render();
    });
    this.dom.clMeta.addEventListener('input', () => {
      this.currentDoc.clMeta = this.dom.clMeta.value;
      this.render();
    });
 
    if (this.dom.saveClientBtn) {
      this.dom.saveClientBtn.addEventListener('click', () => this.saveClient());
    }
 
    // Document details
    this.dom.docDate.addEventListener('input', () => {
      this.currentDoc.docDate = this.dom.docDate.value;
      this.render();
    });
    this.dom.dueDate.addEventListener('input', () => {
      this.currentDoc.dueDate = this.dom.dueDate.value;
      this.render();
    });
    this.dom.docNumber.addEventListener('input', (e) => {
      this.dom.docNumber.dataset.manual = '1';
      this.currentDoc.docNumber = e.target.value;
      this.render();
    });
    
    this.dom.docStatus.addEventListener('change', () => {
      this.currentDoc.status = this.dom.docStatus.value;
      this.render();
    });
    this.dom.amountReceived.addEventListener('input', () => {
      this.currentDoc.amountReceived = parseFloat(this.dom.amountReceived.value) || 0;
      this.render();
    });
 
    // Add item listener
    if (this.dom.addItemBtn) {
      this.dom.addItemBtn.addEventListener('click', () => this.addItem('', 1, 0, ''));
    }

    // Item editor event delegation (more memory efficient & SOLID)
    this.dom.itemsEditor.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove')) {
        const itemId = e.target.dataset.id;
        this.removeItem(itemId);
      }
    });

    this.dom.itemsEditor.addEventListener('input', (e) => {
      const target = e.target;
      const itemId = target.dataset.itemId;
      const field = target.dataset.field;
      if (itemId && field) {
        this.updateItem(itemId, field, target.value);
      }
    });

    // Settings / Taxes
    this.dom.discountPct.addEventListener('input', () => {
      this.currentDoc.discountPct = parseFloat(this.dom.discountPct.value) || 0;
      this.render();
    });
    this.dom.gstPct.addEventListener('input', () => {
      this.currentDoc.gstPct = parseFloat(this.dom.gstPct.value) || 0;
      this.render();
    });
    this.dom.gstTypeRadios.forEach(radio => {
      radio.onchange = null; // clear legacy inline references
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          this.currentDoc.gstType = e.target.value;
          this.render();
        }
      });
    });

    // Bank & Notes
    this.dom.bankInfo.addEventListener('input', () => {
      this.currentDoc.bankInfo = this.dom.bankInfo.value;
      this.render();
    });
    this.dom.notes.addEventListener('input', () => {
      this.currentDoc.notes = this.dom.notes.value;
      this.render();
    });

    // Logo upload
    this.dom.logoFile.addEventListener('change', (e) => this.handleLogoUpload(e));
    const logoRemoveBtn = document.getElementById('logoRemoveBtn');
    if (logoRemoveBtn) {
      logoRemoveBtn.onclick = null;
      logoRemoveBtn.addEventListener('click', () => this.removeLogo());
    }

    // Promo upload
    this.dom.promoFile.addEventListener('change', (e) => this.handlePromoUpload(e));
    const promoRemoveBtn = document.getElementById('promoRemoveBtn');
    if (promoRemoveBtn) {
      promoRemoveBtn.onclick = null;
      promoRemoveBtn.addEventListener('click', () => this.removePromo());
    }
  }

  // ==========================================
  // DOCUMENT ACTIONS
  // ==========================================

  /**
   * Sets the document mode (Quotation or Invoice) and adjusts form fields visibility.
   * @param {string} mode - 'quotation' or 'invoice'
   */
  setMode(mode) {
    this.currentDoc.mode = mode;
    
    // Toggle active classes on tab buttons
    this.dom.modeQuoteBtn.classList.toggle('active', mode === 'quotation');
    this.dom.modeInvoiceBtn.classList.toggle('active', mode === 'invoice');
    
    // Toggle label texts and fields
    this.dom.dueLabel.textContent = mode === 'invoice' ? 'Due date' : 'Valid until';
    this.dom.statusWrap.style.display = mode === 'invoice' ? 'block' : 'none';
    this.dom.bankSection.style.display = mode === 'invoice' ? 'block' : 'none';
    this.dom.convertBtn.style.display = mode === 'quotation' ? 'flex' : 'none';

    // Auto update prefill number unless manual override was flagged
    if (!this.dom.docNumber.dataset.manual) {
      this.prefillDocumentNumber();
    }
    this.render();
  }

  /**
   * Resets application state and clears form inputs for a brand new document.
   */
  newDoc() {
    this.currentDoc = new Document();
    
    // Reset inputs
    this.dom.clName.value = '';
    this.dom.clMeta.value = '';
    this.dom.clientSelect.value = '';
    this.dom.docDate.value = Formatters.todayStr();
    this.dom.dueDate.value = '';
    this.dom.discountPct.value = 0;
    this.dom.notes.value = '';
    this.dom.docStatus.value = 'Unpaid';
    this.dom.amountReceived.value = 0;
    
    // Reset manual override flags
    this.dom.docNumber.dataset.manual = '';
    
    // Preserve company profile configurations in the new document state
    this.currentDoc.coName = this.dom.coName.value;
    this.currentDoc.coMeta = this.dom.coMeta.value;
    this.currentDoc.bankInfo = this.dom.bankInfo.value;
    
    // Set default item
    this.addItem('', 1, 0, '');
    this.prefillDocumentNumber();
    this.render();
  }

  /**
   * Auto-prefills the invoice or quotation ID number string.
   */
  async prefillDocumentNumber() {
    let counters = { quotation: 0, invoice: 0 };
    try {
      const savedCountersObj = await storageService.get('doc-counter');
      if (savedCountersObj) {
        counters = JSON.parse(savedCountersObj.value);
      }
    } catch (e) {
      console.warn('Failed to retrieve document counters, using default', e);
    }
    
    const count = (counters[this.currentDoc.mode] || 0) + 1;
    const prefix = this.currentDoc.mode === 'invoice' ? 'INV' : 'QT';
    const year = new Date().getFullYear();
    const formattedNum = `${prefix}-${year}-${String(count).padStart(3, '0')}`;
    
    this.dom.docNumber.value = formattedNum;
    this.currentDoc.docNumber = formattedNum;
  }

  /**
   * Converts a quotation to an invoice, creating a new separate document ID.
   */
  async convertToInvoice() {
    this.currentDoc.id = null; // Unlink original document
    this.dom.docNumber.dataset.manual = '';
    
    // Setup defaults for converted invoice
    this.setMode('invoice');
    this.dom.docDate.value = Formatters.todayStr();
    this.currentDoc.docDate = Formatters.todayStr();
    this.dom.dueDate.value = '';
    this.currentDoc.dueDate = '';
    this.dom.docStatus.value = 'Unpaid';
    this.currentDoc.status = 'Unpaid';
    this.dom.amountReceived.value = 0;
    this.currentDoc.amountReceived = 0;
    
    await this.prefillDocumentNumber();
    this.render();
  }

  /**
   * Persists the current document to storage.
   */
  async saveDoc() {
    // Harvest all form input values to keep the document model 100% in sync
    this.currentDoc.coName = this.dom.coName.value;
    this.currentDoc.coMeta = this.dom.coMeta.value;
    this.currentDoc.clName = this.dom.clName.value;
    this.currentDoc.clMeta = this.dom.clMeta.value;
    this.currentDoc.docDate = this.dom.docDate.value;
    this.currentDoc.dueDate = this.dom.dueDate.value;
    this.currentDoc.docNumber = this.dom.docNumber.value;
    this.currentDoc.notes = this.dom.notes.value;
    this.currentDoc.bankInfo = this.dom.bankInfo.value;
    this.currentDoc.status = this.dom.docStatus.value;
    this.currentDoc.amountReceived = parseFloat(this.dom.amountReceived.value) || 0;
    this.currentDoc.discountPct = parseFloat(this.dom.discountPct.value) || 0;
    this.currentDoc.gstPct = parseFloat(this.dom.gstPct.value) || 0;
    
    const totals = this.currentDoc.calculateTotals();
    const isNew = !this.currentDoc.id;
    if (isNew) {
      this.currentDoc.id = Formatters.uid();
    }
    
    const serializedDoc = this.currentDoc.toJSON();
    
    try {
      // Save document payload
      await storageService.set('doc:' + this.currentDoc.id, JSON.stringify(serializedDoc));
      
      // Update Index
      let index = [];
      const savedIndexObj = await storageService.get('doc-index');
      if (savedIndexObj) {
        index = JSON.parse(savedIndexObj.value);
      }
      
      // Filter out existing index entry to avoid duplicates
      index = index.filter(item => item.id !== this.currentDoc.id);
      
      // Insert to front of list
      index.unshift({
        id: this.currentDoc.id,
        mode: this.currentDoc.mode,
        docNumber: this.currentDoc.docNumber,
        clName: this.currentDoc.clName,
        grand: totals.grandTotal,
        savedAt: Date.now()
      });
      
      await storageService.set('doc-index', JSON.stringify(index));
      
      // Increment auto-counter if this was a new prefilled number save
      if (isNew && !this.dom.docNumber.dataset.manual) {
        let counters = { quotation: 0, invoice: 0 };
        const savedCountersObj = await storageService.get('doc-counter');
        if (savedCountersObj) {
          counters = JSON.parse(savedCountersObj.value);
        }
        counters[this.currentDoc.mode] = (counters[this.currentDoc.mode] || 0) + 1;
        await storageService.set('doc-counter', JSON.stringify(counters));
      }
      
      await this.renderSavedList();
      alert('Document saved successfully!');
    } catch (e) {
      console.error('Failed to save document', e);
      alert('Error saving document.');
    }
  }

  /**
   * Loads a document from storage into the active app controller state.
   * @param {string} id - Document storage ID
   */
  async loadDoc(id) {
    try {
      const docPayloadObj = await storageService.get('doc:' + id);
      if (!docPayloadObj) {
        alert('Document not found!');
        return;
      }
      
      const payload = JSON.parse(docPayloadObj.value);
      this.currentDoc = new Document(payload);
      
      // Sync UI elements
      this.dom.coName.value = this.currentDoc.coName || '';
      this.dom.coMeta.value = this.currentDoc.coMeta || '';
      this.dom.clName.value = this.currentDoc.clName || '';
      this.dom.clMeta.value = this.currentDoc.clMeta || '';
      this.dom.docDate.value = this.currentDoc.docDate || '';
      this.dom.dueDate.value = this.currentDoc.dueDate || '';
      this.dom.docNumber.value = this.currentDoc.docNumber || '';
      this.dom.docNumber.dataset.manual = '1';
      this.dom.notes.value = this.currentDoc.notes || '';
      this.dom.bankInfo.value = this.currentDoc.bankInfo || '';
      this.dom.docStatus.value = this.currentDoc.status || 'Unpaid';
      this.dom.amountReceived.value = this.currentDoc.amountReceived || 0;
      this.dom.discountPct.value = this.currentDoc.discountPct || 0;
      this.dom.gstPct.value = this.currentDoc.gstPct || 18;
      
      // Update GST radios
      this.dom.gstTypeRadios.forEach(radio => {
        radio.checked = (radio.value === this.currentDoc.gstType);
      });
      
      // Adjust UI inputs based on quotation vs invoice
      this.setMode(this.currentDoc.mode);
      this.renderItemsEditor();
      this.render();
    } catch (e) {
      console.error('Failed to load document', e);
      alert('Error loading document.');
    }
  }

  /**
   * Deletes a document from index & payloads.
   */
  async deleteDoc(id) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      let index = [];
      const savedIndexObj = await storageService.get('doc-index');
      if (savedIndexObj) {
        index = JSON.parse(savedIndexObj.value);
      }
      index = index.filter(item => item.id !== id);
      
      await storageService.set('doc-index', JSON.stringify(index));
      await storageService.delete('doc:' + id);
      
      // If we deleted the active document, clear current ID
      if (this.currentDoc.id === id) {
        this.currentDoc.id = null;
      }
      
      await this.renderSavedList();
      this.render();
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  }

  // ==========================================
  // LINE ITEMS ACTIONS
  // ==========================================

  /**
   * Adds an item to the document state list and triggers editor update.
   */
  addItem(desc, qty, rate, hsn) {
    const item = new LineItem({ desc, qty, rate, hsn });
    this.currentDoc.items.push(item);
    this.renderItemsEditor();
    this.render();
  }

  /**
   * Removes a line item by ID.
   */
  removeItem(id) {
    this.currentDoc.items = this.currentDoc.items.filter(i => i.id !== id);
    this.renderItemsEditor();
    this.render();
  }

  /**
   * Updates an item's specific field values dynamically.
   */
  updateItem(id, field, val) {
    const item = this.currentDoc.items.find(i => i.id === id);
    if (!item) return;
    
    if (field === 'desc' || field === 'hsn') {
      item[field] = val;
    } else {
      item[field] = parseFloat(val) || 0;
    }
    this.render();
  }

  // ==========================================
  // CLIENT ACTIONS
  // ==========================================

  /**
   * Saves current client inputs to index.
   */
  async saveClient() {
    const name = this.dom.clName.value.trim();
    if (!name) {
      alert('Please fill client name.');
      return;
    }
    const meta = this.dom.clMeta.value;
    
    let list = [];
    try {
      const savedClientsObj = await storageService.get('clients');
      if (savedClientsObj) {
        list = JSON.parse(savedClientsObj.value);
      }
    } catch (e) {
      console.error(e);
    }
    
    const existing = list.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      existing.meta = meta;
    } else {
      list.push({ id: Formatters.uid(), name, meta });
    }
    
    try {
      await storageService.set('clients', JSON.stringify(list));
      await this.loadClientsList();
      alert('Client profile saved!');
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Loads saved client profiles into dropdown select options.
   */
  async loadClientsList() {
    let list = [];
    try {
      const savedClientsObj = await storageService.get('clients');
      if (savedClientsObj) {
        list = JSON.parse(savedClientsObj.value);
      }
    } catch (e) {
      console.error(e);
    }
    
    const select = this.dom.clientSelect;
    const currentSelected = select.value;
    
    select.innerHTML = '<option value="">— Select a saved client —</option>' +
      list.map(c => `<option value="${Formatters.escapeAttr(c.id)}">${Formatters.escapeHtml(c.name)}</option>`).join('');
    
    select.dataset.clients = JSON.stringify(list);
    select.value = currentSelected;
  }

  /**
   * Pulls profile details into client input fields.
   */
  selectClient(id) {
    if (!id) return;
    let list = [];
    try {
      list = JSON.parse(this.dom.clientSelect.dataset.clients || '[]');
    } catch (e) {
      console.error(e);
    }
    
    const client = list.find(x => x.id === id);
    if (!client) return;
    
    this.dom.clName.value = client.name;
    this.dom.clMeta.value = client.meta;
    this.currentDoc.clName = client.name;
    this.currentDoc.clMeta = client.meta;
    this.render();
  }

  // ==========================================
  // PROFILE / COMPANY SETTINGS
  // ==========================================

  /**
   * Persists company input metadata and logo to LocalStorage.
   */
  async saveCompanyProfile() {
    const profile = {
      name: this.dom.coName.value,
      meta: this.dom.coMeta.value,
      mobile: this.dom.coMobile.value,
      gstin: this.dom.coGSTIN.value,
      bank: this.dom.bankInfo.value,
      logo: this.logoData
    };
    try {
      await storageService.set('company-profile', JSON.stringify(profile));
      alert('Business details saved as default!');
    } catch (e) {
      console.error('Failed to save profile defaults', e);
    }
  }

  /**
   * Pulls business default configurations and logo details.
   */
  async loadCompanyProfile() {
    try {
      const savedProfileObj = await storageService.get('company-profile');
      if (savedProfileObj) {
        const p = JSON.parse(savedProfileObj.value);
        this.dom.coName.value = p.name || '';
        this.dom.coMeta.value = p.meta || '';
        this.dom.coMobile.value = p.mobile || '';
        this.dom.coGSTIN.value = p.gstin || '';
        this.dom.bankInfo.value = p.bank || '';
        
        this.currentDoc.coName = p.name || '';
        this.currentDoc.coMeta = p.meta || '';
        this.currentDoc.bankInfo = p.bank || '';
        
        this.logoData = p.logo || null;
        this.updateLogoPreview();
      }
    } catch (e) {
      console.warn('Failed to load company profile defaults', e);
    }
    
    try {
      const bannerObj = await storageService.get('promo-banner');
      if (bannerObj) {
        this.promoData = bannerObj.value;
        this.updatePromoPreview();
      }
    } catch (e) {
      console.warn('Failed to load banner image', e);
    }
  }

  // ==========================================
  // FILES / FILE READERS (LOGO & PROMO)
  // ==========================================

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      this.logoData = await this.readFileAsDataURL(file);
      this.updateLogoPreview();
      await this.saveCompanyProfile();
      this.render();
    } catch (err) {
      console.error('Logo upload error', err);
    }
  }

  async removeLogo() {
    this.logoData = null;
    this.updateLogoPreview();
    await this.saveCompanyProfile();
    this.render();
  }

  updateLogoPreview() {
    if (this.logoData) {
      this.dom.logoPreviewBox.innerHTML = `<img src="${this.logoData}">`;
      this.dom.logoRemoveBtn.style.display = 'inline-block';
    } else {
      this.dom.logoPreviewBox.innerHTML = 'No logo';
      this.dom.logoRemoveBtn.style.display = 'none';
    }
  }

  async handlePromoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      this.promoData = await this.readFileAsDataURL(file);
      this.updatePromoPreview();
      await storageService.set('promo-banner', this.promoData);
      this.render();
    } catch (err) {
      console.error('Banner upload error', err);
    }
  }

  async removePromo() {
    this.promoData = null;
    this.updatePromoPreview();
    try {
      await storageService.delete('promo-banner');
    } catch (e) {}
    this.render();
  }

  updatePromoPreview() {
    if (this.promoData) {
      this.dom.promoPreviewBox.innerHTML = `<img src="${this.promoData}">`;
      this.dom.promoRemoveBtn.style.display = 'inline-block';
    } else {
      this.dom.promoPreviewBox.innerHTML = 'No banner';
      this.dom.promoRemoveBtn.style.display = 'none';
    }
  }

  // ==========================================
  // DYNAMIC COMPONENT RENDERING
  // ==========================================

  /**
   * Renders the dynamic editor inputs list for adding/editing items.
   */
  renderItemsEditor() {
    this.dom.itemsEditor.innerHTML = '';
    this.currentDoc.items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = `
        <button class="remove" data-id="${item.id}">✕</button>
        <div class="item-grid">
          <div>
            <label style="margin-top:0;">Description</label>
            <input type="text" value="${Formatters.escapeAttr(item.desc)}" data-item-id="${item.id}" data-field="desc">
          </div>
        </div>
        <div class="item-grid3">
          <div>
            <label style="margin-top:0;">Qty</label>
            <input type="number" value="${item.qty}" data-item-id="${item.id}" data-field="qty">
          </div>
          <div>
            <label style="margin-top:0;">Rate</label>
            <input type="number" value="${item.rate}" data-item-id="${item.id}" data-field="rate">
          </div>
          <div>
            <label style="margin-top:0;">HSN/SAC</label>
            <input type="text" value="${Formatters.escapeAttr(item.hsn || '')}" data-item-id="${item.id}" data-field="hsn">
          </div>
        </div>`;
      this.dom.itemsEditor.appendChild(row);
    });
  }

  /**
   * Renders the sidebar saved document index files.
   */
  async renderSavedList() {
    let index = [];
    try {
      const indexObj = await storageService.get('doc-index');
      if (indexObj) {
        index = JSON.parse(indexObj.value);
      }
    } catch (e) {
      console.error(e);
    }
    
    // Clear list and bind handlers programmatically via event delegation on list container
    this.dom.savedList.innerHTML = '';
    
    if (index.length === 0) {
      this.dom.savedList.innerHTML = '<div class="empty-note">Nothing saved yet.</div>';
      return;
    }
    
    index.forEach(docInfo => {
      const row = document.createElement('div');
      row.className = 'savedItem';
      
      const docLabel = document.createElement('span');
      docLabel.textContent = `${docInfo.mode === 'invoice' ? '📄' : '📝'} ${docInfo.docNumber || ''} — ${docInfo.clName || 'Untitled'} · ${Formatters.money(docInfo.grand)}`;
      
      const delBtn = document.createElement('span');
      delBtn.className = 'del';
      delBtn.textContent = '✕';
      
      row.appendChild(docLabel);
      row.appendChild(delBtn);
      
      // Listeners
      docLabel.addEventListener('click', () => this.loadDoc(docInfo.id));
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteDoc(docInfo.id);
      });
      
      this.dom.savedList.appendChild(row);
    });
  }

  /**
   * Main sheet rendering function.
   * Compiles data templates dynamically and writes to the preview canvas container.
   */
  render() {
    const t = this.currentDoc.calculateTotals();
    const isInvoice = this.currentDoc.mode === 'invoice';
    
    // Header Info Build
    const businessName = this.dom.coName.value || 'Your Business Name';
    
    // Build Address multi-line
    let metadataList = [];
    if (this.dom.coMeta.value) {
      metadataList.push(this.dom.coMeta.value);
    }
    if (this.dom.coMobile.value) {
      metadataList.push(`Mobile: ${this.dom.coMobile.value}`);
    }
    if (this.dom.coGSTIN.value) {
      metadataList.push(`GSTIN: ${this.dom.coGSTIN.value}`);
    }
    const businessMetadata = metadataList.join('\n');
    
    const clientName = this.dom.clName.value || 'Client Name';
    const clientMeta = this.dom.clMeta.value;
    
    const docDate = this.dom.docDate.value || Formatters.todayStr();
    const dueDate = this.dom.dueDate.value;
    const docNumber = this.dom.docNumber.value;
    const notes = this.dom.notes.value;
    const bankInfo = this.dom.bankInfo.value;
    const status = this.dom.docStatus.value;
    const received = isInvoice ? this.currentDoc.amountReceived : 0;
    
    const documentTitle = isInvoice ? 'INVOICE' : 'QUOTATION';
    const validityLabel = isInvoice ? 'Due' : 'Valid until';
    
    // Compile GST Split Rows
    let gstRows = '';
    if (t.gstPct > 0) {
      if (t.gstType === 'split') {
        const splitPct = (t.gstPct / 2).toFixed(1);
        const splitAmt = t.gstAmt / 2;
        gstRows = `
          <div class="tline"><span>CGST (${splitPct}%)</span><span>${Formatters.money(splitAmt)}</span></div>
          <div class="tline"><span>SGST (${splitPct}%)</span><span>${Formatters.money(splitAmt)}</span></div>`;
      } else {
        gstRows = `<div class="tline"><span>IGST (${t.gstPct}%)</span><span>${Formatters.money(t.gstAmt)}</span></div>`;
      }
    }

    // Stamps
    const stampClass = (isInvoice && status === 'Paid') ? 'stamp paid' : 'stamp';
    const stampText = isInvoice ? status.toUpperCase() : 'ESTIMATE';

    // Compile Line Item Rows
    const itemRowsHtml = this.currentDoc.items.map(item => {
      const description = Formatters.escapeHtml(item.desc) || '—';
      const hsn = Formatters.escapeHtml(item.hsn) || '—';
      return `
        <tr>
          <td>${description}</td>
          <td style="text-align:center;">${hsn}</td>
          <td>${item.qty}</td>
          <td>${Formatters.money(item.rate)}</td>
          <td>${Formatters.money(item.getAmount())}</td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" style="color:#999;">No items added yet</td></tr>';

    // Output template to preview panel DOM canvas
    this.dom.sheet.innerHTML = `
      <div class="sheet-head">
        <div class="coBlock">
          ${this.logoData ? `<img class="co-logo" src="${this.logoData}" alt="Company Logo">` : ''}
          <div>
            <div class="co-name">${Formatters.escapeHtml(businessName)}</div>
            <div class="co-meta">${Formatters.escapeHtml(businessMetadata)}</div>
          </div>
        </div>
        <div>
          <div class="doc-title">${documentTitle}</div>
          <div class="doc-num"># ${Formatters.escapeHtml(docNumber)}</div>
        </div>
      </div>
      <div class="${stampClass}">${stampText}</div>
      <div class="parties">
        <div>
          <h4>Billed to</h4>
          <div class="name">${Formatters.escapeHtml(clientName)}</div>
          <div class="meta">${Formatters.escapeHtml(clientMeta)}</div>
        </div>
        <div style="text-align:right;">
          <div class="datebox"><span>Date: </span>${Formatters.formatDate(docDate)}</div>
          <div class="datebox"><span>${validityLabel}: </span>${dueDate ? Formatters.formatDate(dueDate) : '—'}</div>
        </div>
      </div>
      <table class="items">
        <thead>
          <tr>
            <th>Description</th>
            <th>HSN/SAC</th>
            <th>Qty</th>
            <th>Rate</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemRowsHtml}
        </tbody>
      </table>
      <div class="totals">
        <div class="tline"><span>Subtotal</span><span>${Formatters.money(t.subtotal)}</span></div>
        ${t.discountPct > 0 ? `<div class="tline"><span>Discount (${t.discountPct}%)</span><span>-${Formatters.money(t.discountAmt)}</span></div>` : ''}
        ${gstRows}
        <div class="tline grand"><span>Total</span><span>${Formatters.money(t.grandTotal)}</span></div>
        ${isInvoice && received > 0 ? `
          <div class="tline"><span>Amount received</span><span>-${Formatters.money(received)}</span></div>
          <div class="tline" style="font-weight:600;"><span>Balance due</span><span>${Formatters.money(t.balanceDue)}</span></div>
        ` : ''}
      </div>
      <div class="amountWords">Amount in words: ${Formatters.numberToWords(t.grandTotal)}</div>
      ${isInvoice && bankInfo ? `<div class="bankBlock"><h4>Payment details</h4>${Formatters.escapeHtml(bankInfo)}</div>` : ''}
      ${notes ? `<div class="notesBlock">${Formatters.escapeHtml(notes)}</div>` : ''}
      <div class="footRule">— · —</div>
      ${this.promoData ? `<div class="promoBanner"><img src="${this.promoData}" alt="Promo Banner"></div>` : ''}
    `;
  }
}

// Run application
document.addEventListener('DOMContentLoaded', () => {
  const app = new AppController();
  app.init();
  // Expose app controller on window for debugging if required
  window.app = app;
});
