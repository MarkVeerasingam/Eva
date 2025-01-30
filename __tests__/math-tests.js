const assert = require('assert');

module.exports = eva => {
	assert.strictEqual(eva.eval(['+', 1, 5]), 6)
	assert.strictEqual(eva.eval(['+', ['+', 3, 2], 5]), 10)
	assert.strictEqual(eva.eval(['+', ['*', 3, 2], 5]), 11)

	assert.strictEqual(eva.eval(['*', ['+', 3, 2], 2]), 10)

	assert.strictEqual(eva.eval(['/', ['*', 3, 2], 2]), 3)
	assert.strictEqual(eva.eval(['/', ['*', 9, 2], ['+', 3, 3]]), 3)
	assert.strictEqual(eva.eval(['/', ['*', 9, 2], ['+', 3, ['*', 3, 1]]]), 3)	
}