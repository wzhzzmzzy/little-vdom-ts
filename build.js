/** Generate By LLM */

import esbuild from 'esbuild';

/** Readable */
esbuild
  .build({
    entryPoints: ['little-vdom.ts'], // 入口文件
    bundle: true, // 打包依赖
    format: 'esm', // 输出格式为 ESM
    outfile: 'dist/little-vdom.js', // 输出目录
    target: 'esnext', // 目标 JavaScript 版本
    platform: 'neutral', // 不绑定到浏览器或 Node.js
    minify: false, // 压缩代码（可选）
    sourcemap: false, // 生成 SourceMap（可选）
  })
  .catch(() => process.exit(1));

/** Minify */
esbuild
  .build({
    entryPoints: ['little-vdom.ts'], // 入口文件
    bundle: true, // 打包依赖
    format: 'esm', // 输出格式为 ESM
    outfile: 'dist/little-vdom.mini.js', // 输出目录
    target: 'esnext', // 目标 JavaScript 版本
    platform: 'neutral', // 不绑定到浏览器或 Node.js
    minify: true, // 压缩代码（可选）
    sourcemap: false, // 生成 SourceMap（可选）
  })
  .catch(() => process.exit(1));
