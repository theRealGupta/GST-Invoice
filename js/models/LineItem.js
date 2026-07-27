/**
 * LineItem Model Class
 * 
 * Represents a single line item/row in a Quotation or Invoice.
 * Follows Single Responsibility Principle (SRP) by managing item properties and single item calculations.
 */
import { uid } from '../utils/Formatters.js';

export class LineItem {
  /**
   * Constructs a new LineItem instance.
   * @param {Object} [params] - Initialization parameters
   * @param {string} [params.id] - Optional ID. If not provided, a unique ID is generated
   * @param {string} [params.desc] - Description of the service or product
   * @param {number} [params.qty] - Quantity
   * @param {number} [params.rate] - Rate per unit
   * @param {string} [params.hsn] - HSN/SAC code
   */
  constructor({ id, desc, qty, rate, hsn } = {}) {
    this.id = id || uid();
    this.desc = desc || '';
    this.qty = qty !== undefined ? parseFloat(qty) || 0 : 1;
    this.rate = rate !== undefined ? parseFloat(rate) || 0 : 0;
    this.hsn = hsn || '';
  }

  /**
   * Calculates the subtotal for this item.
   * @returns {number} Subtotal (quantity * rate)
   */
  getAmount() {
    return this.qty * this.rate;
  }
}
