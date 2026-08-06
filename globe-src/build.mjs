/**
 * Compila el globo a un unico archivo IIFE en ../assets/.
 * Shopify solo sirve lo que esta en assets/, y no corre npm, asi que el
 * bundle se commitea junto al codigo fuente.
 */
import { build } from 'esbuild';
import { writeFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';

const out = '../assets/gn-globe3d.js';

await build({
  entryPoints: ['src/index.jsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2019'],
  jsx: 'automatic',
  outfile: out,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.js': 'jsx' }
});

const raw = readFileSync(out);
const gz = gzipSync(raw).length;
console.log(
  'bundle:', (statSync(out).size / 1024).toFixed(0) + ' KB',
  '| gzip:', (gz / 1024).toFixed(0) + ' KB'
);
