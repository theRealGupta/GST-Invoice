/**
 * Document Model Class
 * 
 * Represents a Quotation or Invoice document.
 * Centralizes calculations (subtotals, discounts, taxes, balances) and serialization.
 * Follows the Single Responsibility Principle.
 */
import { LineItem } from './LineItem.js';
import { todayStr } from '../utils/Formatters.js';

export class Document {
  /**
   * Constructs a new Document instance.
   * @param {Object} [data] - JSON/Object payload to load data from
   */
  constructor(data = {}) {
    this.id = data.id || null;
    this.mode = data.mode || 'quotation'; // 'quotation' or 'invoice'
    
    // Business Profile Information
    this.coName = data.coName || '';
    this.coMeta = data.coMeta || '';
    
    // Client Information
    this.clName = data.clName || '';
    this.clMeta = data.clMeta || '';
    
    // Dates & Identity
    this.docDate = data.docDate || todayStr();
    this.dueDate = data.dueDate || '';
    this.docNumber = data.docNumber || '';
    
    // Financial Terms & Payments
    this.notes = data.notes || '';
    this.bankInfo = data.bankInfo || '';
    this.status = data.status || 'Unpaid'; // 'Unpaid', 'Partially Paid', 'Paid'
    this.amountReceived = parseFloat(data.amountReceived) || 0;
    this.discountPct = parseFloat(data.discountPct) || 0;
    
    // Tax Info
    this.gstPct = parseFloat(data.gstPct) !== undefined ? parseFloat(data.gstPct) : 18;
    this.gstType = data.gstType || 'split'; // 'split' (CGST/SGST) or 'igst'
    
    // Line Items
    this.items = Array.isArray(data.items) 
      ? data.items.map(item => new LineItem(item)) 
      : [];
  }

  /**
   * Calculates financial totals for this document.
   * @returns {Object} Structured totals object
   */
  calculateTotals() {
    const subtotal = this.items.reduce((sum, item) => sum + item.getAmount(), 0);
    const discountAmt = subtotal * (this.discountPct / 100);
    const afterDiscount = subtotal - discountAmt;
    const gstAmt = afterDiscount * (this.gstPct / 100);
    const grandTotal = afterDiscount + gstAmt;
    
    const received = this.mode === 'invoice' ? this.amountReceived : 0;
    const balanceDue = grandTotal - received;

    return {
      subtotal,
      discountPct: this.discountPct,
      discountAmt,
      afterDiscount,
      gstPct: this.gstPct,
      gstType: this.gstType,
      gstAmt,
      grandTotal,
      received,
      balanceDue
    };
  }

  /**
   * serializes document to plain object for local storage persistence.
   * @returns {Object} JSON-serializable document object
   */
  toJSON() {
    return {
      id: this.id,
      mode: this.mode,
      coName: this.coName,
      coMeta: this.coMeta,
      clName: this.clName,
      clMeta: this.clMeta,
      docDate: this.docDate,
      dueDate: this.dueDate,
      docNumber: this.docNumber,
      notes: this.notes,
      bankInfo: this.bankInfo,
      status: this.status,
      amountReceived: this.amountReceived,
      discountPct: this.discountPct,
      gstPct: this.gstPct,
      gstType: this.gstType,
      items: this.items.map(item => ({
        id: item.id,
        desc: item.desc,
        qty: item.qty,
        rate: item.rate,
        hsn: item.hsn
      }))
    };
  }
}
