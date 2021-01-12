

var inconsistentSystemError = new Error('inconsistent');

function nearZero(a) {
  return Math.abs(a) < 1e-9;
}

// Představuje lineární kombinaci několika proměnných a konstanty.
// coeffs: seznam koeficientů pro proměnné ve vars.
// vars: seznam řetězců pojmenujících proměnné.
// c: konstantní člen
function AffineExpression(coeffs, vars, c) {
  this.coeffs = [];
  this.empty = true;
  for (var i in vars) {
    if (!nearZero(coeffs[i])) {
      this.coeffs[vars[i]] = coeffs[i];
      this.empty = false;
    }
  }
  this.constant = c;
}

// vrácení coef s prefixem v.
function AE_getCoefficient(v) {
  if (v in this.coeffs) {
    return this.coeffs[v];
  } else {
    return 0;
  }
}


function AE_getLargestPivot() {
  // For numerical stability, choose the largest pivot.
  var maxPivot = 0;
  var pivotVar = null;
  for (var v in this.coeffs) {
    if (Math.abs(this.coeffs[v]) >= maxPivot) {
      maxPivot = Math.abs(this.coeffs[v]);
      pivotVar = v;
    }
  }
  return pivotVar;
}

function AE_getScalarValue() {
  return this.constant;
}


function AE_isScalar() {
  return this.empty;
}


function AE_solveFor(v) {
  var newCoeffs = [];
  var newVars = [];
  var vCoeff = this.coeffs[v];
  for (var w in this.coeffs) {
    if (w != v) {
      newVars.push(w);
      newCoeffs.push(-this.coeffs[w] / vCoeff);
    }
  }
  return new AffineExpression(newCoeffs, newVars, -this.constant / vCoeff);
}


function AE_substitute(v, expr) {
  var newCoeffs = [];
  var newConstant = 0;
  var oldVCoeff = 0;

  for (var w in this.coeffs) {
    if (w == v) {
      oldVCoeff = this.coeffs[w];
    } else {
      newCoeffs[w] = this.coeffs[w];
    }
  }
  newConstant = this.constant;

  for (var x in expr.coeffs) {
    if (x in newCoeffs) {
      newCoeffs[x] += expr.coeffs[x] * oldVCoeff;
    } else {
      newCoeffs[x] = expr.coeffs[x] * oldVCoeff;
    }
  }
  newConstant += expr.constant * oldVCoeff;
  // Construct a new expression.
  var coeffs = [];
  var vars = [];
  for (var y in newCoeffs) {
    vars.push(y);
    coeffs.push(newCoeffs[y]);
  }
  return new AffineExpression(coeffs, vars, newConstant);
}

function AE_toString() {
  var s = '';
  for (var v in this.coeffs) {
    var coeff = this.coeffs[v];
    s += coeff + "*" + v + " + ";
  }
  s += this.constant;
  return s;
}

AffineExpression.prototype.getCoefficient = AE_getCoefficient;
AffineExpression.prototype.getLargestPivot = AE_getLargestPivot;
AffineExpression.prototype.getScalarValue = AE_getScalarValue;
AffineExpression.prototype.isScalar = AE_isScalar;
AffineExpression.prototype.solveFor = AE_solveFor;
AffineExpression.prototype.substitute = AE_substitute;
AffineExpression.prototype.toString = AE_toString;

// Řeší systém simultánních lineárních rovnic. Rovnice jsou dány vztahem
// X == 0 pro každé X v SYSTÉMU (seznam AffineExpressions).
//
// Vyhodit inconsistentSystemError, pokud je systém nekonzistentní.
//
// V opačném případě vraťte pole s klíčem pro každou proměnnou. Pokud proměnná má
// jedinečné řešení S, pak přidružená hodnota je S. Jinak, pokud
// proměnná je nedostatečně omezená, přidružená hodnota je pak NaN.
function solveLinearSystem(system) {
  var backVars = [];
  var backExprs = [];

  // zpětná kontrola
  for (var i = 0; i < system.length; i++) {
    var e = system[i];
    var pivotVar = e.getLargestPivot();
    if (pivotVar !== null && !nearZero(e.getCoefficient(pivotVar))) {
      //
      var subExpr = e.solveFor(pivotVar);
      //
      backVars.push(pivotVar);
      backExprs.push(subExpr);
      //
      for (var j = i + 1; j < system.length; j++) {
        system[j] = system[j].substitute(pivotVar, subExpr);
      }
    } else {
      //  žádný pivot.  rovnice ve tvaru c == 0,
      // pro nějakou konstantu c. Tou rovnicí je buď tautologie, nebo error
      if (nearZero(e.constant)) {

      } else {

        throw inconsistentSystemError;
      }
    }
  }

  for (var m = backVars.length - 1; m >= 0; m--) {
    for (var n = m + 1; n < backVars.length; n++) {
      backExprs[m] = backExprs[m].substitute(backVars[n], backExprs[n]);
    }
  }
  // Zkopírujte výstup do nového pole a vrati jej.
  var soln = [];
  for (var v in backVars) {
    if (backExprs[v].isScalar()) {
      soln[backVars[v]] = backExprs[v].getScalarValue();
    } else {

      soln[backVars[v]] = NaN;
    }
  }

  return soln;
}
