module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'plugin:prettier/recommended',
  ],
  overrides: [
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  plugins: [
    'unused-imports',
    'prefer-arrow',
    'prettier',
  ],
  rules: {
    'prettier/prettier': ['error'],
    "import/prefer-default-export": "warn",
    "import/extensions": ["error", "never"],
    "no-plusplus": "off",
    "radix": ["error", "as-needed"],
    "no-restricted-syntax": "off",
    "unused-imports/no-unused-imports": "error",
    "prefer-arrow/prefer-arrow-functions": [
      "warn", {
        "disallowPrototype": true,
        "singleReturnOnly": false,
        "classPropertiesAllowed": false,
      }
    ],
    "prefer-arrow-callback": [
      "warn", {
        "allowNamedFunctions": true
      },
    ],
    "func-style": [
      "warn",
      "expression",
      {
        "allowArrowFunctions": true
      },
    ],
  },
};
