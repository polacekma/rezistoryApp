
var permanentMessage = '';
var transientMessage = '';
var lastMessageShown = '';


function printMessage(msg, isTransient) {
  if (isTransient) {
    transientMessage = msg;
  } else {
    permanentMessage = msg;
  }
  var textToShow = transientMessage != '' ? transientMessage : permanentMessage;
  if (lastMessageShown != textToShow) {
    document.getElementById("statusmsg").innerHTML = textToShow;
  }
  lastMessageShown = textToShow;
}

function printOutput(msg) {
  document.getElementById("leadoutput").innerHTML = msg;
}


function normSquared(dx, dy) {
  return dx * dx + dy * dy;
}


function quadraticMinimum(a, b, c) {

  var x = - b / (2 * a);
  return a * x * x + b * x + c;
}


function min(a, b) {
  return (a < b) ? a : b;
}


function minimumDistanceSquaredToSegment(x, y, x1, y1, x2, y2) {
  var cx = x2 - x1;
  var cy = y2 - y1;
  var dx = x1 - x;
  var dy = y1 - y;
  var alpha = - (cx * dx + cy * dy) / normSquared(cx, cy);
  if (0 < alpha && alpha < 1) {
    return quadraticMinimum(normSquared(cx, cy), 2 * (cx * dx + cy * dy),
                            normSquared(dx, dy));
  } else {
    return min(normSquared(x - x1, y - y1), normSquared(x - x2, y - y2));
  }
}
