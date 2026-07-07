// Lightweight logger - debug/log/info are no-ops to keep console clean by default.
// Use `console.warn` and `console.error` for important messages which remain enabled.
export const logger = {
  debug: () => {},
  log: () => {},
  info: () => {},
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
};
