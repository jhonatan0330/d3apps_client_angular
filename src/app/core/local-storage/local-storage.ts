import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LocalStorage {
  // State
  private storage = new Map<string, string>();

  /**
   * Returns the number of key/value pairs.
   */
  get length(): number {
    return this.storage.size;
  }

  /**
   * Sets the value of the pair identified by key to value,
   * creating a new key/value pair if none existed for key previously.
   */
  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  }

  /**
   * Returns the current value associated with the given key,
   * or null if the given key does not exist in the list associated
   * with the object.
   */
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  }

  /**
   * Removes the key/value pair with the given key,
   * if a key/value pair with the given key exists.
   */
  removeItem(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Removes all key/value pairs, if there are any.
   */
  clear(): void {
    localStorage.clear();
  }

  /**
   * Returns the name of the nth key in the list.
   */
  key(index: number): string | null {
    return localStorage.key(index);
  }
}
