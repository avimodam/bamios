import babel from '@rollup/plugin-babel';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import terser from '@rollup/plugin-terser';

const config = {
  input: 'src/js/bamios.js',
  output: {
    file: 'dist/js/bamios.js',
    format: 'umd',
    name: 'BamiosAudioPlayer',
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
  ],
};

const minifyConfig = {
  input: 'src/js/bamios.js',
  output: {
    file: 'dist/js/bamios.min.js',
    format: 'umd',
    name: 'Bamios',
    sourcemap: true,
  },
  plugins: [
    resolve({
      browser: true,
    }),
    commonjs(),
    babel({ exclude: 'node_modules/**', babelHelpers: 'bundled' }),
    terser({
      ecma: 6,
      mangle: { toplevel: true },
      compress: {
        module: true,
        toplevel: true,
        unsafe_arrows: true,
        drop_console: true,
        drop_debugger: true,
      },
      output: { quote_style: 1 },
    }),
  ],
};

export default [config, minifyConfig];
