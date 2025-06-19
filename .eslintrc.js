module.exports = {
  extends: ['next/core-web-vitals'],
  rules: {
    // Completely disable all problematic ESLint rules
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off', 
    '@typescript-eslint/no-require-imports': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'jsx-a11y/alt-text': 'off',
    '@next/next/no-img-element': 'off',
    'prefer-const': 'off',
    'no-unused-vars': 'off',
    'no-undef': 'off'
  },
  // Override all rules to warnings
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        '@typescript-eslint/no-explicit-any': 'warn', 
        '@typescript-eslint/no-require-imports': 'warn',
        'react-hooks/exhaustive-deps': 'warn',
        'jsx-a11y/alt-text': 'warn',
        '@next/next/no-img-element': 'warn',
        'prefer-const': 'warn'
      }
    }
  ]
}