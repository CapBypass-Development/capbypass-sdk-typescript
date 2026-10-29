const { defineConfig } = require('tsup');
const { version } = require('./package.json');

// The publish workflow writes the release version into package.json before
// `npm run build`, so the bundle carries the version that is published.
module.exports = defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  define: { __SDK_VERSION__: JSON.stringify(version) },
});
