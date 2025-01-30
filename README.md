eva -e "(print ((lambda (x) (* x x)) 2))"

eva -e "(var x 10) (print x)"

eva -e "(var x 10)(var y 20)(print (+ (* x y) 30))"

eva -e "(print \"Hello World\")"
