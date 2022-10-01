#!/usr/bin/env node

const alias = require('esbuild-plugin-alias');

require('esbuild').build({
    entryPoints: ['./src/private/js/index.js'],
    bundle: true,
    minify: true,
    outfile: 'build/js/cozy.js',
    loader: { '.js': 'jsx' },
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    logLevel: "info",
    plugins: [
      alias({
          "react": require.resolve("preact/compat"),
          "react-dom": require.resolve("preact/compat")
      }),
    ],
}).catch(err => process.exit(1));
