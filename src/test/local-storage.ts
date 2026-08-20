// jsdom under this Node build ships without localStorage, and the persisted
// zustand store reads it while hydrating at import time. Loaded as the first
// vitest setup file so the shim is in place before any module needs it.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

if (
  typeof window !== "undefined" &&
  typeof window.localStorage?.clear !== "function"
) {
  Object.defineProperty(window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
  });
}
