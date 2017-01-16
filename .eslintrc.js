module.exports = {
	env: {
		browser: true,
		commonjs: true,
		es6: true,
		node: true
	},
	extends: [
		'xo'
	],
	parserOptions: {
		ecmaFeatures: {
			experimentalObjectRestSpread: true
		},
		sourceType: 'module'
	},
	plugins: [],
	ext: [
		'.js'
	],
	rules: {
		'quotes': ['error', 'single', {'avoidEscape': true}],
		'operator-linebreak': [
			'error',
			'after',
			{
				overrides: {
					'?': 'before',
					':': 'before'
				}
			}
		],
		'generator-star-spacing': ['error', 'after'],
		'no-floating-decimal': 0,
		'spaced-comment': [
			'error',
			'always',
			{
				"markers": [
				":",
				"?:",
				"::"
				]
			}
		]
	}
}
