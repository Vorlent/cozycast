#!/usr/bin/env node

const esbuild = require('esbuild');
const alias = require('esbuild-plugin-alias');
const path = require('path');
const isDevelopment = process.env.NODE_ENV === 'development';

esbuild.build({
  entryPoints: ['./src/private/js/index.js'],
  bundle: true,
  minify: !isDevelopment,
  sourcemap: isDevelopment ? 'inline' : false,
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
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
}).catch(err => process.exit(1));
