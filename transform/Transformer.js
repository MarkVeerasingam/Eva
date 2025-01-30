/**
 * AST Transformer 
 */
class Transformer {

	/**
	 * Translates 'def'-expression (function decleration)
	 * into a variable decleration with a lambda expression. 
	 */
	transformDefToVarLambda(exp){
		const [_tag, name, params, body] = exp;
		return ['var', name, ['lambda', params, body]];
	}

	/**
	 * Transform 'switch' to nested 'if'-expressions.
	 */
	transformSwitchToIf(switchExp){
		const [_tag, ...cases] = switchExp;
		const ifExp = ['if', null, null, null];

		let current = ifExp;
		for (let i = 0; i < cases.length - 1; i++) {
			const [currentCond, currentBlock] = cases[i];

			current[1] = currentCond;
			current[2] = currentBlock;

			// alternative part for the 'if' should be the nested 'if' expression or if the final else case.
			const next = cases[i + 1];

			const [nextCond, nextBlock] = next;

			current[3] = nextCond === 'else' 
				? nextBlock
				: ['if'];

			current = current[3];
		}

		return ifExp;
	}

	/**
     * Transform 'for' into a 'while' loop.
     */
	transformForToWhile(exp){
		const [_tag, init, condition, modifier, body] = exp;

		// Translate 'for' into a block containing:
        // 1. Initialization
        // 2. A 'while' loop with the condition and body
        // 3. The body includes the loop modifier
        return [
            'begin',
            init,
            ['while', condition, ['begin', body, modifier]]
        ];
	}

	/**
     * Transform '++ foo' into 'set foo (+ foo 1)'.
     */
    transformIncToSet(exp) {
        const [_tag, variable] = exp;

        return ['set', variable, ['+', variable, 1]];
    }

    /**
     * Transform '-- foo' into 'set foo (- foo 1)'.
     */
    transformDecToSet(exp) {
        const [_tag, variable] = exp;

        return ['set', variable, ['-', variable, 1]];
    }
}

module.exports = Transformer;