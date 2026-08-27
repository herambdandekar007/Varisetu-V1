export function createStore(initialItems) {
  let items = Array.isArray(initialItems) ? [...initialItems] : initialItems;
  const subscribers = new Set();

  const notify = () => {
    for (const fn of subscribers) {
      try { fn(items); } catch (_err) { /* subscriber must handle */ }
    }
  };

  return {
    getState: () => items,
    setState: (next) => {
      items = typeof next === 'function' ? next(items) : next;
      notify();
      return items;
    },
    subscribe: (fn) => {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
