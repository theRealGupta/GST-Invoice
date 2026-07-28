/**
 * Formatters and Helper Utilities Module
 * 
 * Provides utility functions for date formatting, Indian currency formatting,
 * HTML safety/escaping, and number-to-words translation.
 */

/**
 * Generates a unique string identifier.
 * Uses Date.now() combined with a random alphanumeric block for collision safety.
 * @returns {string} Unique ID
 */
export function uid() {
  return 'd' + Date.now() + Math.random().toString(36).slice(2, 7);
}

/**
 * Formats a numeric value into the Indian currency format (e.g., ₹1,23,456.78).
 * Handles rounding and ensures two decimal places.
 * @param {number} amount - The numeric amount to format
 * @returns {string} Formatted currency string
 */
export function money(amount) {
  const roundedAmount = Math.round((amount || 0) * 100) / 100;
  return '₹' + roundedAmount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Returns today's date in ISO YYYY-MM-DD format.
 * Safe for pre-filling date input fields.
 * @returns {string} YYYY-MM-DD date string
 */
export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Escapes double quotes inside a string so it can be safely used inside an HTML attribute value.
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
export function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

/**
 * Escapes special characters inside a string to prevent HTML injection / XSS.
 * @param {string} str - Input string
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Formats a YYYY-MM-DD date string into a reader-friendly Indian standard date format (e.g., 28 Jul 2026).
 * Handles timezone issues by using the T00:00:00 ISO timestamp format.
 * @param {string} dateString - YYYY-MM-DD formatted date string
 * @returns {string} Formatted date string (e.g., "28-Jul-2026")
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  // Parse with local timezone to prevent off-by-one errors from UTC conversion
  const dateObj = new Date(dateString + 'T00:00:00');
  return dateObj.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Indian numbering system names for numbers
const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

/**
 * Helper to convert double digit numbers (< 100) to words.
 * @private
 */
function twoDigits(num) {
  if (num < 20) return ONES[num];
  return TENS[Math.floor(num / 10)] + (num % 10 ? ' ' + ONES[num % 10] : '');
}

/**
 * Helper to convert triple digit numbers (< 1000) to words.
 * @private
 */
function threeDigits(num) {
  if (num < 100) return twoDigits(num);
  return ONES[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + twoDigits(num % 100) : '');
}

/**
 * Converts a positive integer/float to its words equivalent in Indian Rupees format.
 * Follows the Indian system (Crore, Lakh, Thousand).
 * @param {number} amount - The numeric amount
 * @returns {string} Amount in words (e.g., "Rupees One Lakh Only")
 */
export function numberToWords(amount) {
  const roundedAmount = Math.round(amount);
  if (roundedAmount === 0) return 'Rupees Zero Only';
  if (roundedAmount < 0) return '';

  let workingVal = roundedAmount;
  
  const crore = Math.floor(workingVal / 10000000); 
  workingVal %= 10000000;
  
  const lakh = Math.floor(workingVal / 100000); 
  workingVal %= 100000;
  
  const thousand = Math.floor(workingVal / 1000); 
  workingVal %= 1000;
  
  const rest = workingVal;
  const parts = [];

  if (crore) parts.push(threeDigits(crore) + ' Crore');
  if (lakh) parts.push(threeDigits(lakh) + ' Lakh');
  if (thousand) parts.push(threeDigits(thousand) + ' Thousand');
  if (rest) parts.push(threeDigits(rest));

  return 'Rupees ' + parts.join(' ') + ' Only';
}

/**
 * Resizes and compresses an image (Data URL) on the client side using a canvas.
 * Resolves to a smaller base64 JPEG data URL.
 * @param {string} dataUrl - The input base64 data URL
 * @param {number} maxWidth - Maximum target width
 * @param {number} maxHeight - Maximum target height
 * @param {number} [quality=0.8] - JPEG quality (0 to 1)
 * @returns {Promise<string>} Resized and compressed image base64 data URL
 */
export function compressImage(dataUrl, maxWidth, maxHeight, quality = 0.8) {
  return new Promise((resolve) => {
    // If it's not a data URL (e.g. empty or invalid), return immediately
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions while preserving aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = Math.round((width * maxHeight) / height);
        height = maxHeight;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as compressed JPEG
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(dataUrl); // Fallback to original if loading fails
    };
    img.src = dataUrl;
  });
}
