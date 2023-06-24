module.exports = {
	env: {
		commonjs: true,
		es2021: true,
		node: true,
		jest: true,
	},
	extends: [
		"airbnb-base",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/errors",
		"plugin:import/warnings",
		"plugin:import/typescript",
		"plugin:prettier/recommended",
	],
	overrides: [],
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: "latest",
	},
	plugins: [
		"@typescript-eslint",
		"unused-imports",
		"prefer-arrow",
		"prettier",
	],
	rules: {
		"prettier/prettier": ["error"],
		"@typescript-eslint/no-unused-vars": ["error"],
		"import/prefer-default-export": "warn",
		"import/extensions": ["error", "never"],
		"no-plusplus": "off",
		radix: ["error", "as-needed"],
		"no-restricted-syntax": "off",
		"@typescript-eslint/explicit-function-return-type": "warn",
		"unused-imports/no-unused-imports": "error",
		"import/no-extraneous-dependencies": [
			"error",
			{
				devDependencies: true,
			},
		],
		"prefer-arrow/prefer-arrow-functions": [
			"warn",
			{
				disallowPrototype: true,
				singleReturnOnly: false,
				classPropertiesAllowed: false,
			},
		],
		"prefer-arrow-callback": [
			"warn",
			{
				allowNamedFunctions: true,
			},
		],
		"func-style": [
			"warn",
			"expression",
			{
				allowArrowFunctions: true,
			},
		],
	},
};
