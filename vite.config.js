const path = require('path');

module.exports = {
	build: {
		lib: {
			entry: path.resolve(__dirname, 'src/suggestify.ts'),
			formats: ['es', 'umd'],
			name: 'suggestify',
		},
	},
};
