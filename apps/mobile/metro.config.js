const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite ships its web implementation as WebAssembly. Metro must copy the
// binary as an asset instead of trying to parse it as JavaScript source.
config.resolver.assetExts.push('wasm');

// SQLite's web worker uses SharedArrayBuffer, which browsers only expose in a
// cross-origin-isolated page. These headers apply to the local Expo dev server.
config.server.enhanceMiddleware = (middleware) => (request, response, next) => {
  response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(request, response, next);
};

module.exports = config;
