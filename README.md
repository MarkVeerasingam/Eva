# EVA Programming Language

EVA is a minimalist, Lisp-inspired, s-expressive, interpreted object-oriented programming language that supports dynamic binding, arithmetic operations, conditional statements, and more.

## Features
- **Lisp-inspired syntax** with S-expressions.
- **Dynamic variable binding** with `var`.
- **Support for defining and calling functions** with `lambda` and `def`.
- **Basic arithmetic operations**: `+`, `-`, `*`, `/`.
- **Control flow** with `if`, `while`, `for`, `switch`.
- **Class and Object-Oriented programming** with `class`, `new`, `prop`.
- **Module system** with `module` and `import`.

## Installation

1. Clone the EVA repository.
2. Navigate to the project directory and run the following command to install dependencies:
    ```bash
    npm install
    ```

## Usage

You can run EVA from the command line with the following syntax:

```bash
eva -e "(expression)"
```

# Examples

### 1. Performing an Operation with a Lambda Function
This example calculates the square of `2` using a lambda function:

```bash
eva -e "(print ((lambda (x) (* x x)) 2))"
```

### 2. Defining a Variable and Printing It
This example creates a variable `x` with the value `10` and prints it:
```bash
eva -e "(var x 10) (print x)"
```

### 3. Performing an Arithmetic Operation with Variables
This example defines two variables `x` and `y`, performs an arithmetic operation, and prints the result:
```bash
eva -e "(var x 10)(var y 20)(print (+ (* x y) 30))"
```

### 5. Conditional Statements: if
This example uses an `if` expression to check if `x` is greater than `5` and prints the appropriate result:
```bash
eva -e "(var x 10) (print (if (> x 5) \"Greater than 5\" \"Less than or equal to 5\"))"
```

### 6. For Loop
This example uses a for loop to print the numbers from 1 to 5:
```bash
eva -e "(for (var x 1) (< x 6) (set x (+ x 1)) (print x))"
```

### 7. 9. Reading a File
To evaluate a script from a file, use the -f flag followed by the file path:
```bash
eva -f "path/to/your/file.eva"
```
