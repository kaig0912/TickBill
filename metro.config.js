// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add .mjs to the list of source extensions for iconoir-react-native
config.resolver.sourceExts.push('mjs');

module.exports = config;
