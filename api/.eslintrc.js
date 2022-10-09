module.exports = {
  "env": {
    "es2021": true,
    "node": true
  },
  "extends": [
    "standard",
    "plugin:prettier/recommended",
    "plugin:node/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 12
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {
    camelcase: "off",
    "node/no-missing-import": "off",
    "node/no-unpublished-import": "off",
    "node/no-unsupported-features/es-syntax": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "next" }]
  },
};
