const Eva = require('../Eva.js');
const Environment = require('../Environment');

const tests = [
	require('./self-eval-tests.js'),
	require('./math-tests.js'),
	require('./variables-test.js'),
	require('./block-tests.js'),
	require('./if-test.js'),
	require('./while-test.js'),
	require('./built-in-function-test.js'),
	require('./user-defined-function-tests.js'),
	require('./lambda-function-test.js'),
	require('./switch-test.js'),
	require('./class-test.js'),
	require('./module-test.js'),
	require('./import-test.js'),
];

const eva = new Eva();

tests.forEach(test => test(eva));

console.log('All assertions passed');