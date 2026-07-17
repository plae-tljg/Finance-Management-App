const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Web build: replace `expo-sqlite` with a tiny empty stub so the browser
// bundle never tries to `requireNativeModule('ExpoSQLite')` and crash with
// "Cannot find native module 'ExpoSQLite'". The web runtime talks to the
// Android device through the embedded HTTP server, not expo-sqlite.
const expoSqliteWebStub = path.join(__dirname, 'web', 'expo-sqlite.web.stub.js');

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-sqlite') {
    return { type: 'sourceFile', filePath: expoSqliteWebStub };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
