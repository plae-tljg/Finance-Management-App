const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 添加必要的配置
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config; 