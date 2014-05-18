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

(define DEST #f)
(define SOURCES #f)

(define (reset!)
  (set! DEST (vector 0 0 0))
  (set! SOURCES (list (vector 0 0 0)
		      (vector 0 0 0)
		      (vector 0 0 0))))

(define (D! v) (vector-set! DEST 1 (chop64 v)))
(define (S n) (vector-ref (list-ref SOURCES n) 1))

(define (movq) (D! (S 0)))
(define (addq) (D! (i64+ (S 0) (S 1))))
(define (subq) (D! (i64- (S 0) (S 1))))
(define (muladdq) (D! (i64+ (S 0) (i64* (S 1) (S 2)))))

(define (addqi i) (D! (i64+ (S 0) i)))
(define (subqi i) (D! (i64- (S 0) i)))
(define (muladdqi i) (D! (i64+ (S 0) (i64* (S 1) i))))
(define (shlqi i) (D! (chop64 (arithmetic-shift (S 0) (modulo i 64)))))
(define (sarqi i) (D! (chop64 (arithmetic-shift (S 0) (- (modulo i 64))))))

(define (compute-inputs input-count)
  (if (zero? input-count)
      (list '())
      (let ((tails (compute-inputs (- input-count 1))))
	(append-map (lambda (n) (map (lambda (ts) (cons n ts)) tails))
		    interesting-64))))

(define (apply-input! input)
  (reset!)
  (for [(n (in-naturals)) (i input)]
    (vector-set! (list-ref SOURCES n) 1 (chop64 i))))

(define (only-nonnegative x) (and (not (negative? x)) x))
(define (only-shiftable x) (and (not (negative? x)) (modulo x 32)))

(define cases `(
		(movq ,movq 1 #f)
		(addq ,addq 2 #f)
		(subq ,subq 2 #f)
		(addqi ,addqi 1 ,only-nonnegative)
		(subqi ,subqi 1 ,only-nonnegative)
		(shlqi ,shlqi 1 ,only-shiftable)
		(sarqi ,sarqi 1 ,only-shiftable)
		(muladdq ,muladdq 3 #f)
		(muladdqi ,muladdqi 2 ,values)
		))


(let ((copying? #f))
  (for [(line (in-lines (open-input-file "tweetnacl.js")))]
    (cond
     [(regexp-match #px"-=-=-=- BEGIN int64array -=-=-=-" line) (set! copying? #t)]
     [(regexp-match #px"-=-=-=- END int64array -=-=-=-" line) (set! copying? #f)]
     [copying? (display line) (newline)])))

(printf "var DEST, SOURCES, ok;\n")
(for [(c cases)]
  (match-define (list name proc input-count imm-filter) c)
  (for [(input (compute-inputs input-count))]
    (define (print-test! tail-inputs)
      (printf "\n")
      (printf "DEST = new_int64array(3);\n")
      (printf "SOURCES = [~a];\n"
	      (string-join (make-list input-count "new_int64array(3)") ","))
      (for [(n input-count)]
	(printf "setlo32(SOURCES[~a], 1, ~a);\n" n (chop32 (S n)))
	(printf "sethi32(SOURCES[~a], 1, ~a);\n" n (chop32 (arithmetic-shift (S n) -32))))
      (define args
	(string-join (flatten (list (list "DEST" "1")
				    (for/list [(n input-count)] (list (format "SOURCES[~a]" n) "1"))
				    (map number->string tail-inputs)))
		     ","))
      (define expected (vector-ref DEST 1))
      (define elo (chop32u expected))
      (define ehi (chop32u (arithmetic-shift expected -32)))
      ;; (printf "console.log('~a');\n" name)
      (printf "~a(~a);\n" name args)
      (printf "ok = true;\n")
      (printf "ok = ok && (getlo32(DEST, 0) == 0);\n")
      (printf "ok = ok && (gethi32(DEST, 0) == 0);\n")
      (printf "ok = ok && (getlo32(DEST, 1) == ~a);\n" elo)
      (printf "ok = ok && (gethi32(DEST, 1) == ~a);\n" ehi)
      (printf "ok = ok && (getlo32(DEST, 2) == 0);\n")
      (printf "ok = ok && (gethi32(DEST, 2) == 0);\n")
      (printf "if (!ok) { console.log(~v, ~a, ~a, DEST[2], DEST[3]); }\n"
	      (format "~a: ~a ~a --> ~a" name input tail-inputs expected)
	      elo
	      ehi))
    (if imm-filter
	(for [(imm interesting-32)]
	  (define filtered-imm (imm-filter imm))
	  (when filtered-imm
	    (apply-input! input)
	    (proc filtered-imm)
	    (print-test! (list filtered-imm))))
	(begin
	  (apply-input! input)
	  (proc)
	  (print-test! '())))))
