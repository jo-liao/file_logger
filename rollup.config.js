import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
// import { terser } from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';

export default {
    input: 'src/index.ts',
    output: {
        file: 'build/file_logger.js',
        format: 'iife',
        name: 'FileLogger',
    },
    plugins: [resolve(), commonjs(), typescript() /*terser()*/],
};
