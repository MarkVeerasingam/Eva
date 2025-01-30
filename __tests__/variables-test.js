const assert = require('assert');

module.exports = eva => {
    // Variable declaration and access
    assert.strictEqual(eva.eval(['var', 'x', 10]), 10);
    assert.strictEqual(eva.eval('x'), 10);

    // Accessing global variable
    assert.strictEqual(eva.eval('VERSION'), '0.1');

    // Boolean variable declaration
    assert.strictEqual(eva.eval(['var', 'isUser', 'true']), true);

    // Complex variable initialization
    assert.strictEqual(eva.eval(['var', 'z', ['*', 2, 2]]), 4);
    assert.strictEqual(eva.eval('z'), 4);

    // Variable update
    assert.strictEqual(eva.eval(
        ['begin',
            ['var', 'data', 10],
            ['set', 'data', 100],
            'data'
        ]
    ), 100);
};
