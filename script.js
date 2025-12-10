function parseExpr1Var(expr) {
  return new Function("x", "return " + expr + ";");
}

function parseExpr2Var(expr) {
  return new Function("t", "y", "return " + expr + ";");
}

function formatNumber(value) {
  return Number(value).toFixed(6);
}

function drawGraph(canvasId, xs, seriesList) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!xs || xs.length === 0 || !seriesList || seriesList.length === 0) return;

  var minX = Math.min.apply(null, xs);
  var maxX = Math.max.apply(null, xs);
  var minY = Infinity;
  var maxY = -Infinity;

  for (var s = 0; s < seriesList.length; s++) {
    var ys = seriesList[s].values;
    for (var i = 0; i < ys.length; i++) {
      var y = ys[i];
      if (!isFinite(y)) continue;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  if (!isFinite(minY) || !isFinite(maxY)) return;

  if (minY === maxY) {
    minY -= 1;
    maxY += 1;
  }

  var paddingLeft = 50;
  var paddingRight = 20;
  var paddingTop = 20;
  var paddingBottom = 40;

  var width = canvas.width;
  var height = canvas.height;

  function xToPx(x) {
    return paddingLeft + (x - minX) * (width - paddingLeft - paddingRight) / (maxX - minX);
  }

  function yToPx(y) {
    return height - paddingBottom - (y - minY) * (height - paddingTop - paddingBottom) / (maxY - minY);
  }

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  ctx.strokeRect(paddingLeft, paddingTop, width - paddingLeft - paddingRight, height - paddingTop - paddingBottom);

  if (minY < 0 && maxY > 0) {
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    var y0 = yToPx(0);
    ctx.moveTo(paddingLeft, y0);
    ctx.lineTo(width - paddingRight, y0);
    ctx.stroke();
  }

  if (minX < 0 && maxX > 0) {
    ctx.strokeStyle = "#475569";
    ctx.beginPath();
    var x0 = xToPx(0);
    ctx.moveTo(x0, paddingTop);
    ctx.lineTo(x0, height - paddingBottom);
    ctx.stroke();
  }

  var colors = ["#22c55e", "#3b82f6", "#f97316", "#eab308"];

  for (var k = 0; k < seriesList.length; k++) {
    var serie = seriesList[k];
    var ys2 = serie.values;
    ctx.strokeStyle = colors[k % colors.length];
    ctx.lineWidth = 2;
    ctx.beginPath();
    var started = false;
    for (var j = 0; j < xs.length; j++) {
      var yval = ys2[j];
      if (!isFinite(yval)) continue;
      var px = xToPx(xs[j]);
      var py = yToPx(yval);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  ctx.fillStyle = "#9ca3af";
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(formatNumber(minX), paddingLeft, height - 20);
  ctx.fillText(formatNumber(maxX), width - paddingRight, height - 20);

  ctx.save();
  ctx.translate(20, yToPx(maxY));
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("y", 0, 0);
  ctx.restore();
}

function initNewton() {
  var form = document.getElementById("newton-form");
  if (!form) return;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var fxExpr = document.getElementById("newton-fx").value;
    var dfxExpr = document.getElementById("newton-dfx").value;
    var x0 = parseFloat(document.getElementById("newton-x0").value);
    var tol = parseFloat(document.getElementById("newton-tol").value);
    var maxIter = parseInt(document.getElementById("newton-max").value, 10);

    var f, df;
    try {
      f = parseExpr1Var(fxExpr);
      df = parseExpr1Var(dfxExpr);
    } catch (e) {
      document.getElementById("newton-summary").innerText = "Error al interpretar las funciones.";
      return;
    }

    var data = [];
    var x = x0;
    var root = x0;
    var reached = false;

    for (var k = 0; k < maxIter; k++) {
      var fx = f(x);
      var dfx = df(x);
      if (!isFinite(fx) || !isFinite(dfx) || dfx === 0) break;
      var x1 = x - fx / dfx;
      var err = Math.abs(x1 - x);
      data.push({ iter: k + 1, x: x, fx: fx, error: err });
      x = x1;
      root = x1;
      if (err < tol) {
        reached = true;
        break;
      }
    }

    var summaryDiv = document.getElementById("newton-summary");
    if (data.length === 0) {
      summaryDiv.innerText = "No fue posible realizar iteraciones. Revise las funciones y el valor inicial.";
      document.getElementById("newton-table").innerHTML = "";
      return;
    }

    var msg = "Raiz aproximada: " + formatNumber(root) +
      ". Iteraciones usadas: " + data.length + ".";
    if (!reached) {
      msg += " No se alcanzo la tolerancia indicada.";
    }
    summaryDiv.innerHTML = "<strong>Resultado:</strong> " + msg;

    var html = "<table><thead><tr>" +
      "<th>Iter</th><th>x</th><th>f(x)</th><th>Error</th>" +
      "</tr></thead><tbody>";
    for (var i = 0; i < data.length; i++) {
      html += "<tr><td>" + data[i].iter + "</td><td>" +
        formatNumber(data[i].x) + "</td><td>" +
        formatNumber(data[i].fx) + "</td><td>" +
        formatNumber(data[i].error) + "</td></tr>";
    }
    html += "</tbody></table>";
    document.getElementById("newton-table").innerHTML = html;

    var xs = [];
    var ys = [];
    var center = root;
    var span = 5;
    if (!isFinite(center)) {
      center = x0;
    }
    var left = center - span;
    var right = center + span;
    var steps = 120;
    for (var j = 0; j <= steps; j++) {
      var xv = left + (right - left) * j / steps;
      var yv = f(xv);
      xs.push(xv);
      ys.push(yv);
    }
    drawGraph("newton-canvas", xs, [{ values: ys }]);
  });
}

function initOde() {
  var form = document.getElementById("ode-form");
  if (!form) return;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var fExpr = document.getElementById("ode-f").value;
    var t0 = parseFloat(document.getElementById("ode-t0").value);
    var y0 = parseFloat(document.getElementById("ode-y0").value);
    var h = parseFloat(document.getElementById("ode-h").value);
    var n = parseInt(document.getElementById("ode-n").value, 10);

    var f;
    try {
      f = parseExpr2Var(fExpr);
    } catch (e) {
      document.getElementById("ode-summary").innerText = "Error al interpretar la funcion.";
      return;
    }

    var ts = [];
    var yEuler = [];
    var yHeun = [];

    ts.push(t0);
    yEuler.push(y0);
    yHeun.push(y0);

    var t = t0;
    var ye = y0;
    var yh = y0;

    for (var k = 0; k < n; k++) {
      var k1e = f(t, ye);
      var yeNext = ye + h * k1e;

      var k1h = f(t, yh);
      var pred = yh + h * k1h;
      var k2h = f(t + h, pred);
      var yhNext = yh + (h / 2) * (k1h + k2h);

      t = t + h;
      ye = yeNext;
      yh = yhNext;

      ts.push(t);
      yEuler.push(ye);
      yHeun.push(yh);
    }

    var summary = "Simulacion desde t = " + formatNumber(t0) +
      " hasta t = " + formatNumber(t) +
      " con paso h = " + formatNumber(h) +
      " y " + n + " pasos.";
    document.getElementById("ode-summary").innerHTML =
      "<strong>Resultado:</strong> " + summary;

    var html = "<table><thead><tr>" +
      "<th>i</th><th>t</th><th>Euler</th><th>Heun</th>" +
      "</tr></thead><tbody>";
    for (var i = 0; i < ts.length; i++) {
      html += "<tr><td>" + i + "</td><td>" +
        formatNumber(ts[i]) + "</td><td>" +
        formatNumber(yEuler[i]) + "</td><td>" +
        formatNumber(yHeun[i]) + "</td></tr>";
    }
    html += "</tbody></table>";
    document.getElementById("ode-table").innerHTML = html;

    drawGraph("ode-canvas", ts, [
      { values: yEuler },
      { values: yHeun }
    ]);
  });
}

function initIntegracion() {
  var form = document.getElementById("int-form");
  if (!form) return;

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();

    var fxExpr = document.getElementById("int-fx").value;
    var a = parseFloat(document.getElementById("int-a").value);
    var b = parseFloat(document.getElementById("int-b").value);
    var n = parseInt(document.getElementById("int-n").value, 10);

    if (n <= 0) {
      document.getElementById("int-summary").innerText = "n debe ser positivo.";
      document.getElementById("int-table").innerHTML = "";
      return;
    }

    var f;
    try {
      f = parseExpr1Var(fxExpr);
    } catch (e) {
      document.getElementById("int-summary").innerText = "Error al interpretar la funcion.";
      return;
    }

    var h = (b - a) / n;
    var xs = [];
    var fs = [];

    for (var i = 0; i <= n; i++) {
      var x = a + i * h;
      xs.push(x);
      fs.push(f(x));
    }

    var trap = 0;
    trap += 0.5 * fs[0] + 0.5 * fs[fs.length - 1];
    for (var j = 1; j < fs.length - 1; j++) {
      trap += fs[j];
    }
    trap = trap * h;

    var sim13 = null;
    if (n % 2 === 0) {
      var sumOdd = 0;
      var sumEven = 0;
      for (var k = 1; k < n; k++) {
        if (k % 2 === 1) sumOdd += fs[k];
        else sumEven += fs[k];
      }
      sim13 = (h / 3) * (fs[0] + fs[n] + 4 * sumOdd + 2 * sumEven);
    }

    var sim38 = null;
    if (n % 3 === 0) {
      var sum3 = 0;
      var sumNot3 = 0;
      for (var r = 1; r < n; r++) {
        if (r % 3 === 0) sum3 += fs[r];
        else sumNot3 += fs[r];
      }
      sim38 = (3 * h / 8) * (fs[0] + fs[n] + 3 * sumNot3 + 2 * sum3);
    }

    var text = "Aproximacion por trapecio: " + formatNumber(trap) + ". ";
    if (sim13 !== null) {
      text += "Simpson 1/3: " + formatNumber(sim13) + ". ";
    } else {
      text += "Simpson 1/3 no disponible porque n no es par. ";
    }
    if (sim38 !== null) {
      text += "Simpson 3/8: " + formatNumber(sim38) + ".";
    } else {
      text += "Simpson 3/8 no disponible porque n no es multiplo de 3.";
    }

    document.getElementById("int-summary").innerHTML =
      "<strong>Resultado:</strong> " + text;

    var html = "<table><thead><tr><th>i</th><th>x</th><th>f(x)</th></tr></thead><tbody>";
    for (var t = 0; t < xs.length; t++) {
      html += "<tr><td>" + t + "</td><td>" +
        formatNumber(xs[t]) + "</td><td>" +
        formatNumber(fs[t]) + "</td></tr>";
    }
    html += "</tbody></table>";
    document.getElementById("int-table").innerHTML = html;

    drawGraph("int-canvas", xs, [{ values: fs }]);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  var page = document.body.getAttribute("data-page");
  if (page === "newton") {
    initNewton();
  } else if (page === "ode") {
    initOde();
  } else if (page === "integracion") {
    initIntegracion();
  }
});