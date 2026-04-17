import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.ts',
  output: {
    file: 'data/modules/main.js',
    format: 'cjs', // CommonJS is flatter and more compatible with Nakama's Goja
    exports: 'named',
  },
  treeshake: false,
  plugins: [
    typescript({ noEmitOnError: false }),
    resolve(),
    commonjs(),
  ],
};