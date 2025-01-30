/**
 * Eva programming language
 * 
 * AST Interpreter.
*/

const Environment = require('./Environment');
const Transformer = require('./transform/Transformer');
const evaParser = require('./parser/evaParser');
const fs = require('fs');

/**
 * Eva Interpreter 
 */
class Eva {
	/**
	* Creates an Eva instance with the global Environment.
	*/
	constructor(global = GlobalEnvironment){
		this.global = global;
		this._transformer = new Transformer();

		// Initialize the module cache to store already loaded modules
        this.moduleCache = {}; 
	}

	/**
	* Evaluates global code wrapping into a block.
	*/
	evalGlobal(exp) {
    	return this._evalBody(exp, this.global);
  	}

	/**
 	* Evaluates an expression in the given Environment 
 	*/
	eval(exp, env = this.global){
		// -----------------------------------------------
		// Self-Evaluating Expressions:
		// if we determine the expression is a number, we return that expression
		if (this._isNumber(exp)){
			return exp;
		}

		// if we determine that the expression is a string, we return that expression
		if (this._isString(exp)){
			// return the quotation value that is stripping the quotes.
			return exp.slice(1, -1);
		}

		// -----------------------------------------------
		// Variable Access foo:

		if(this._isVariableName(exp)){
			return env.lookup(exp);
		}

		// -----------------------------------------------
		// Block: sequence of expressions

		if(exp[0] === 'begin'){
			const blockEnv = new Environment({}, env);
			return this._evalBlock(exp, blockEnv);
		}

		// -----------------------------------------------
		// Variable Decleration (var foo 10):

		if(exp[0] === 'var'){
			const [_, name, value] = exp;
			return env.define(name, this.eval(value, env));
		}

		// -----------------------------------------------
		// Variable Update (set foo 10):

		if(exp[0] === 'set'){
			const [_, ref, value] = exp; // extract refernece -- which can be var name or instance property

			// assignment to a property:

			if(ref[0] === 'prop'){
				const [_tag, instance, propName] = ref;
				const instanceEnv = this.eval(instance, env);

				return instanceEnv.define(
					propName,
					this.eval(value, env),
				);
			}

			// simple assignement:

			return env.assign(ref, this.eval(value, env));
		}

		// -----------------------------------------------
		// if-expression:

		if (exp[0] === 'if'){
			const [_tag, condition, consequent, alternate] = exp;
			if(this.eval(condition, env)){
				return this.eval(consequent, env);				
			}
			return this.eval(alternate, env);
		}

		// -----------------------------------------------
		// While-expression:

		if (exp[0] === 'while'){
			const [_tag, condition, body] = exp;
			let result;
			while(this.eval(condition, env)){
				result = this.eval(body, env);
			}
			return result;
		}

		// -----------------------------------------------
		// Function decleration: (def square (x) (* x x))
		//
		// Syntactic Sugar for: (var square (lambda (x) (* x x)))

		if (exp[0] === 'def'){
			// JIT-transpile to a variable decleration
			// create a variable expression node directly at runtime
			const varExp = this._transformer.transformDefToVarLambda(exp);

			// delegate to the variable decleration evaluator - which will create a varaible and install it to the lambda
			return this.eval(varExp, env);
		}

		// -----------------------------------------------
		// Switch-Expression: (switch (cond1, block1) ... )
		//
		// Syntactic Sugar for nested if-expression
		if (exp[0] === 'switch'){
			const ifExp = this._transformer.transformSwitchToIf(exp);
			return this.eval(ifExp, env);
		}

		// -----------------------------------------------
		// For-Loop: (for init conditition modifier body)
		//
		// Syntactic Sugar for: (begin init(while condition (beginit body modifier)))
		if (exp[0] === 'for'){
			const whileExp = this._transformer.transformForToWhile(exp);
			return this.eval(whileExp, env);	
		}

		// -----------------------------------------------
		// Increment: (++ foo)
		//
		// Syntactic Sugar for: (set foo (+ foo 1))
		if (exp[0] === '++'){
			const setExp = this._transformer.transformIncToSet(setExp);
			return this.eval(setExp, env);
		}

		// -----------------------------------------------
		// Increment: (-- foo)
		//
		// Syntactic Sugar for: (set foo (- foo 1))
		if (exp[0] === '--'){
			const setExp = this._transformer.transformDecToSet(setExp);
			return this.eval(setExp, env);
		}


		// -----------------------------------------------
		// Lambda Function: (lambda (x) (* x x))

		/* A Lambda function, basically is a function that doesent have a name - an anonymous function expression.
		*  The interpreter can already define functions - we can just create a function and directly return it without installing
		*  into the enviorment, because a lambda function doesen't have any (anonymous function expression) */

		if(exp[0] === 'lambda'){
			// extract params and body, as we don't need a name for a lambda function
			const [_tag, params, body] = exp;
			// directly return the same closure objects, which encapsulates params, body, env
			return {
				params,
				body,
				env, // Closure!
			};
		}

		// -----------------------------------------------
		// Class decleration: (class <Name> <Parent> <Body>)

		if(exp[0] === 'class'){
			const [_tag, name, parent, body] = exp;

			// A class is an enviornment! -- a storage of methods,
			// and shared properties:

			const parentEnv = this.eval(parent, env) || env;

			const classEnv = new Environment({}, parentEnv);

			// body is evaluated in the class environment.

			this._evalBody(body, classEnv);

			// class is accessible by name.

			return env.define(name, classEnv);
		}

		// -----------------------------------------------
		// Super expression: (super <Classname>)
		if(exp[0] === 'super'){
			const [_tag, className] = exp;
			return this.eval(className, env).parent;
		}

		// -----------------------------------------------
		// Class instantation: (new <Class> <Arguments>...)

		if(exp[0] === 'new'){

			const classEnv = this.eval(exp[1], env);

			// an instance of a class is an environment
			// the 'parent' component of the instance environment
			// is set to its class

			const instanceEnv = new Environment({}, classEnv);	

			const args = exp
				.slice(2)
				.map(arg => this.eval(arg, env));

			this._callUserDefinedFunction(
				classEnv.lookup('constructor'),
				[instanceEnv, ...args],
			);

			return instanceEnv;
		}

		// -----------------------------------------------
		// Property Access: (prop <instance> <name>)
		if(exp[0] === 'prop') {
			const[_tag, instance, name] = exp;

			const instanceEnv = this.eval(instance, env);

			// since our instance are enviorments - we can rely on the lookup method
			return instanceEnv.lookup(name);
		}

		// -----------------------------------------------
		// Module decleration: (module <name> <body>)

		if (exp[0] === 'module') {
		  const [_tag, name, body] = exp;
		  const moduleEnv = new Environment({}, env);

		  this._evalBody(body, moduleEnv);

		  return env.define(name, moduleEnv);
		}

		// -----------------------------------------------
		// Module import: (import <name>)
		// (import (export1, export2, ...) <name>)
		if (exp[0] === 'import') {
			/**
			 * _tag -- 'import'expression
			 * names -- Can be either 
			 * 			- A list (e.g., ['abs', 'square']) for selective imports.
			 * 			- A string (e.g., 'Math') if importing the whole module.
			 * moduleName -- The module name (e.g, 'Math'), but only present in selective imports.
			 * 			
			 * Case 1) --Full Module Import--
			 * Expression: (import Math)
			 * Parsed as: ["_tag", "Math", undefined]
			 * 
			 * Case 2) --Selective Imports--
			 * Expression: (import (abs square) Math)
			 * Parsed as: ["_tag", ["abs", "square"], "Math"]
			 * */
			let [_tag, names, moduleName] = exp;

			// If only module name is provided (full module import)
			if (typeof names === 'string') {
			    moduleName = names;
			    names = null;
			}

			// Check if the module is already cached
		    if (this.moduleCache[moduleName]) {
		        return this.moduleCache[moduleName];
		    }

			const moduleSrc = fs.readFileSync(
				`${__dirname}/modules/${moduleName}.eva`, 
				'utf-8',
			);

			const body = evaParser.parse(`(begin ${moduleSrc})`);
			const moduleExp = ['module', moduleName, body];

			// Evaluate the module and cache it
		    const moduleEnv = this.eval(moduleExp, this.global);
		    this.moduleCache[moduleName] = moduleEnv; // Cache the evaluated module

		    // Handle for named selective imports
		    if (names) {
		        names.forEach(name => {
		            this.global.define(name, moduleEnv.lookup(name));
		        });
		        return null;
		    }

			return moduleEnv;
		}



		// -----------------------------------------------
		// Function-calls:
		//
		// (print "Hello World")
		// (+ x 5)
		// (> foo bar)

		if (Array.isArray(exp)) {

			/*function name is a variable name and calling the eval() on this variable name
			will lookup this variable in the Environment and find the function object in the global Environment*/
			const fn = this.eval(exp[0], env);
			const args = exp
				.slice(1)
				.map(arg => this.eval(arg, env));

			// 1. Native Function:

			if(typeof fn === 'function') {
		        return fn(...args);
		    }

			// 2. User-Defined Function:

			return this._callUserDefinedFunction(fn, args);
		}

		throw `Unimplemented: ${JSON.stringify(exp)}`;
	}

	_callUserDefinedFunction(fn, args){
		const activationRecord = {};

		fn.params.forEach((param, index) => {
			activationRecord[param] = args[index];
		});

		const activationEnv = new Environment(
			activationRecord,
			fn.env, // static scope!
		);

		return this._evalBody(fn.body, activationEnv);
	}

	_evalBody(body, env){
		if(body[0]	=== 'begin') {
			return this._evalBlock(body, env);
		}
		return this.eval(body, env);
	}

	// _evalBlock is a helper function that will go through the sub-expressions and evaluate
	// each of them sequentially.			
	_evalBlock(block, env){
		let result;

		// result of evaluation the last expression in this block.
		const [_tag, ...expressions] = block;

		// track the result variable, which will be updated on each evaluation of each sub-expression.
		expressions.forEach(exp => {
			result = this.eval(exp, env);
		})

		return result;
	}

	_isNumber(exp){
	return typeof exp === 'number';
	}

	_isString(exp){
		return typeof exp === 'string' && exp[0] === '"' && exp.slice(-1) === '"';
	}

	_isVariableName(exp){
		return typeof exp === 'string' && /^[+\-*/<>=a-zA-Z0-9_]*$/.test(exp);
	}
}

/**
 * Default Global Enviornment. 
 */
const GlobalEnvironment = new Environment({
	null: null,
	true: true,
	false: false,
	VERSION: '0.1',

	// Math Operations:

	'+'(op1, op2) {
		return op1 + op2;
	},

	'-'(op1, op2 = null) {
		if(op2 == null){
			return -op1;
		}
		return op1 - op2;
	},

	'*'(op1, op2) {
		return op1 * op2;
	},

	'/'(op1, op2) {
		return op1 / op2;
	},

	// Comparison:

	'>'(op1, op2) {
		return op1 > op2;
	},

	'<'(op1, op2) {
		return op1 < op2;
	},

	'>='(op1, op2) {
		return op1 >= op2;
	},

	'<='(op1, op2) {
		return op1 <= op2;
	},

	'='(op1, op2) {
		return op1 === op2;
	},

	// Console output:

	print(...args) {
		console.log(...args);
	},
});

module.exports = Eva;