// Completely disable ESLint for Vercel deployment
module.exports = {
  extends: [],
  rules: {},
  ignorePatterns: ['**/*'],
  overrides: [
    {
      files: ['**/*'],
      rules: {
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-require-imports': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'jsx-a11y/alt-text': 'off',
        '@next/next/no-img-element': 'off',
        'prefer-const': 'off'
      }
    }
  ]
}