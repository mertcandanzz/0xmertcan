import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const config = [
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Third-party React Bits sources are kept as published.
    ignores: ['.next/', 'node_modules/', 'src/components/reactbits/', 'src/migrations/', 'src/payload-types.ts', 'src/app/(payload)/', 'next-env.d.ts'],
  },
]

export default config
