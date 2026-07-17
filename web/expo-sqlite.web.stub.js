// Web stub for `expo-sqlite` — never invoked at runtime in this project.
// The web bundle talks to the on-device HTTP server via WebDatabase, so
// this stub just throws a clear error if anything accidentally tries to
// use it. Metro substitutes this for `expo-sqlite` on web builds; see
// metro.config.js.
module.exports = {
  default: {
    openDatabaseAsync: () => {
      throw new Error('expo-sqlite is unavailable on web. Use WebDatabase instead.');
    },
    openDatabaseSync: () => {
      throw new Error('expo-sqlite is unavailable on web. Use WebDatabase instead.');
    },
    SQLiteProvider: ({ children }) => children,
  },
  openDatabaseAsync: () => {
    throw new Error('expo-sqlite is unavailable on web. Use WebDatabase instead.');
  },
  openDatabaseSync: () => {
    throw new Error('expo-sqlite is unavailable on web. Use WebDatabase instead.');
  },
  SQLiteProvider: ({ children }) => children,
  addListener: () => ({ remove: () => {} }),
  removeListeners: () => {},
};
