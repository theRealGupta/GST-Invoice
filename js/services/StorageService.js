/**
 * Storage Service Module
 * 
 * Provides an abstraction layer for browser local storage.
 * Follows SOLID principles by decoupling data access from business and UI controllers.
 */
export class StorageService {
  /**
   * Retrieves an item from storage.
   * @param {string} key - Storage key
   * @returns {Promise<{value: string} | null>} Object containing the value, or null if not found
   */
  async get(key) {
    try {
      const val = localStorage.getItem(key);
      if (val === null) return null;
      return { value: val };
    } catch (e) {
      console.error(`StorageService: Error getting key "${key}"`, e);
      return null;
    }
  }

  /**
   * Saves an item to storage.
   * @param {string} key - Storage key
   * @param {string} value - Stringified data
   * @returns {Promise<boolean>} True if successful
   */
  async set(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`StorageService: Error setting key "${key}"`, e);
      return false;
    }
  }

  /**
   * Deletes an item from storage.
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} True if successful
   */
  async delete(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`StorageService: Error deleting key "${key}"`, e);
      return false;
    }
  }
}
export const storageService = new StorageService();
