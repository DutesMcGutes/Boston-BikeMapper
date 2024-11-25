import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import css from 'rollup-plugin-css-only';
import terser from '@rollup/plugin-terser'; // Correct import

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/main.js', // Entry point
  output: {
    sourcemap: true,
    format: 'iife',
    name: 'app',
    file: 'public/build/bundle.js', // Ensure the output goes into the public directory
  },
  plugins: [
    svelte({
      compilerOptions: {
        // Enable run-time checks when not in production
        dev: !production,
      },
    }),
    css({ output: 'bundle.css' }),

    // Resolve dependencies from node_modules
    resolve({
      browser: true,
      dedupe: ['svelte'],
    }),
    commonjs(),

    // Minify for production
    production && terser(),

    // Watch the `public` directory and refresh the browser on changes in dev mode
    !production && livereload('public'),
  ],
  watch: {
    clearScreen: false,
  },
};
