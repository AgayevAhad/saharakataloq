// Polyfill / mirror localStorage for tests running in happy-dom / Node environment
if (typeof window !== 'undefined' && window.localStorage) {
  if (!globalThis.localStorage) {
    // @ts-ignore
    globalThis.localStorage = window.localStorage;
  }
} else if (!globalThis.localStorage) {
  const store = new Map<string, string>();
  // @ts-ignore
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
  };
}
