import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: true,
    },
    external: [
      'assert',
      'aws-cdk-lib',
      'constructs',
      'fs',
      'openapi3-ts'
    ],
    plugins: [typescript()],
  },
];
