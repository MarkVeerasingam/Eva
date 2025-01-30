const { test } = require('./test-util');

module.exports = (eva) => {
  test(
    eva,
    `(import Math)
    
    ((prop Math abs) (- 10))
	`,
    10,
  );

  test(
    eva,
    `
      (import (abs square) Math)

      (var abs (- 10))
    `,
    -10,
  );

  test(eva, `(prop Math MAX_VALUE)`, 1000);
};