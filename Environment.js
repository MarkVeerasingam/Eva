/**
 * Environment: names storage. 
 */
class Environment {
	/**
	 * Creates an enviorment with the given record.
	 */ 
	constructor(record = {}, parent = null){
		this.record = record;
		this.parent = parent;
	}

	/**
	 * Creates a variable with the given name and value
	 */ 
	define(name, value){
		this.record[name] = value;
		return value;
	}

	/**
	 * Updates an existing variable
	 */ 
	assign(name, value){
		this.resolve(name).record[name] = value;
		return value;
	}

	/**
	 * Returns the value of a defined variable, or throwss
	 * if the variable is not defined
	 */
	lookup(name){
		return this.resolve(name).record[name];
	}

	/**
	 * Returns specific enviorment in which a variable is defined, or 
	 * throws if a variable is not defined.
	 */
	resolve(name){
		// check if the variable name is already in our record. if so directly return our enviorment
		if (this.record.hasOwnProperty(name)){	
			return this;
		}

		// if it's not defined, we see if don't have any parent - which is we are in the global scope.
		if(this.parent == null){
			throw new ReferenceError(`Variable "${name}" is not defined.`);
		}

		// if we have the parent we just recursilvey go to the result of the parent
		return this.parent.resolve(name);
	}
}

module.exports = Environment;