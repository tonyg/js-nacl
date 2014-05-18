#lang racket
;; Generate test cases for signed 64-bit arithmetic in Javascript

;; Signed 4-bit arithmetic: (- (expt 2 4) 1) = #b1111 = -1, (expt 2 3) = #b1000 = -8, #b0111 = 7

(define i64 (expt 2 64))
(define i64-mask (- i64 1))
(define i63 (expt 2 63))

(define i32 (expt 2 32))
(define i32-mask (- i32 1))
(define i31 (expt 2 31))

(define (chop64 x)
  (define v (bitwise-and x i64-mask))
  (if (>= v i63)
      (- v i64)
      v))

(define (chop32 x)
  (define v (bitwise-and x i32-mask))
  (if (>= v i31)
      (- v i32)
      v))

(define (chop32u x)
  (define v (chop32 x))
  (if (negative? v) (+ v i32) v))

(define (i64+ x y) (chop64 (+ x y)))
(define (i64- x y) (chop64 (- x y)))
(define (i64* x y) (chop64 (* x y)))
(define (i64<< x i) (chop64 (arithmetic-shift x i)))
(define (i64>> x i) (chop64 (arithmetic-shift x (- i))))

;; Interesting non-negative edge-case 64-bit numbers
(define interesting-non-negative-64
  (map chop64 (list 0
		    1
		    3
		    6
		    10
		    1000000000
		    (expt 2 31)
		    (- (expt 2 32) 1)
		    (expt 2 32)
		    (+ (expt 2 32) 1)
		    (- (expt 2 62) 1)
		    (expt 2 62)
		    (+ (expt 2 62) 1)
		    (- (expt 2 63) 1)
		    (expt 2 63)
		    (+ (expt 2 63) 1)
		    (- (expt 2 64) 1)
		    (expt 2 64)
		    )))

;; Interesting edge-case 64-bit numbers
(define interesting-64
  (sort (set->list (list->set (map chop64
				   (append interesting-non-negative-64
					   (map - interesting-non-negative-64)))))
	(lambda (x y)
	  (< (abs x) (abs y)))))

;; Interesting edge-case 32-bit numbers
(define interesting-32 (filter (lambda (n) (< (abs n) (expt 2 32))) interesting-64))

(define (compute-inputs input-count)
  (if (zero? input-count)
      (list '())
      (let ((tails (compute-inputs (- input-count 1))))
	(append-map (lambda (n) (map (lambda (ts) (cons n ts)) tails))
		    interesting-64))))

(define (only-nonnegative x) (and (not (negative? x)) x))
(define (only-shiftable x) (and (not (negative? x)) (modulo x 32)))

(define cases `(
		(add ,i64+ 2 #f)
		(sub ,i64- 2 #f)
		(mul ,i64* 2 #f)
		(addi ,i64+ 1 ,only-nonnegative)
		(subi ,i64- 1 ,only-nonnegative)
		(muli ,i64* 1 ,values)
		(shli ,i64<< 1 ,only-shiftable)
		(sari ,i64>> 1 ,only-shiftable)
		))

(let ((copying? #f))
  (for [(line (in-lines (open-input-file "tweetnacl.js")))]
    (cond
     [(regexp-match #px"-=-=-=- BEGIN int64array -=-=-=-" line) (set! copying? #t)]
     [(regexp-match #px"-=-=-=- END int64array -=-=-=-" line) (set! copying? #f)]
     [copying? (display line) (newline)])))

(printf "var DEST, ok;\n")
(for [(c cases)]
  (match-define (list method-name proc input-count imm-filter) c)
  (for [(input (compute-inputs input-count))]
    (define (word-exp v)
      (define lo (chop32 v))
      (define hi (chop32 (arithmetic-shift v -32)))
      (format "new Word(~a, ~a)" lo hi))
    (define (print-test! expected tail-inputs)
      (printf "\n")
      (printf "DEST = ~a;\n" (word-exp (car input)))
      (printf "DEST.~a(~a);\n"
	      method-name
	      (string-join
	       (append (for/list [(i (cdr input))] (word-exp i))
		       (map number->string tail-inputs))
	       ","))
      (define elo (chop32u expected))
      (define ehi (chop32u (arithmetic-shift expected -32)))
      (printf "ok = true;\n")
      (printf "ok = ok && DEST.lo === ~a;\n" elo)
      (printf "ok = ok && DEST.hi === ~a;\n" ehi)
      (printf "if (!ok) { console.log(~v, ~a, ~a, DEST.lo, DEST.hi); }\n"
	      (format "~a: ~a ~a --> ~a" method-name input tail-inputs expected)
	      elo
	      ehi))
    (if imm-filter
	(for [(imm interesting-32)]
	  (define filtered-imm (imm-filter imm))
	  (when filtered-imm
	    (print-test! (apply proc (append input (list filtered-imm)))
			 (list filtered-imm))))
	(print-test! (apply proc input) '()))))
