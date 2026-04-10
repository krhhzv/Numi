const sheet = document.getElementById("calculator");
const handle = document.getElementById("dragHandle");
const display = document.getElementById("display");
const keypad = document.getElementById("keypad");
const historyDiv = document.getElementById("history");
const tablesDiv = document.getElementById("tables");

let value = "";
let memory = 0;
let history = JSON.parse(localStorage.getItem("numi_history") || "[]");

/* PARSER */
function safeEval(expr) {
  try {
    expr = expr
      .replace(/×/g, "*")
      .replace(/÷/g, "/")
      .replace(/(\d+)%/g, "($1/100)");
    return Function("return " + expr)();
  } catch {
    return "Error";
  }
}

/* DISPLAY */
function update() {
  display.innerText = value || "0";
}

/* HISTORY */
function renderHistory() {
  historyDiv.innerHTML = history
    .map(h => `<div onclick="setVal('${h.exp}')">${h.exp} = ${h.res}</div>`)
    .join("");
}

function setVal(v) {
  value = v;
  update();
}

/* INPUT */
function input(v) {
  if (navigator.vibrate) navigator.vibrate(10);

  if (v === "C") value = "";
  else if (v === "⌫") value = value.slice(0, -1);
  else if (v === "=") {
    let res = safeEval(value);
    history.unshift({ exp: value, res });
    localStorage.setItem("numi_history", JSON.stringify(history));
    value = String(res);
    renderHistory();
  } else if (v === "M+") memory += Number(value || 0);
  else if (v === "M-") memory -= Number(value || 0);
  else if (v === "MR") value = String(memory);
  else if (v === "MC") memory = 0;
  else value += v;

  update();
  renderTables();
}

/* KEYS */
const keys = [
  "7","8","9","÷",
  "4","5","6","×",
  "1","2","3","-",
  "0",".","%","+",
  "M+","M-","MR","MC",
  "⌫","C","=",
];

keys.forEach(k => {
  const btn = document.createElement("button");
  btn.innerText = k;

  if ("+-×÷".includes(k)) btn.className = "op";
  else if (k === "=") btn.className = "eq";
  else if (["C","⌫","M+","M-","MR","MC"].includes(k)) btn.className = "act";
  else btn.className = "num";

  btn.onclick = () => input(k);
  keypad.appendChild(btn);
});

/* TABLES */
function renderTables() {
  const n = Number(value) || 1;
  tablesDiv.innerHTML = "";
  for (let i = 1; i <= 12; i++) {
    tablesDiv.innerHTML += `<div>${n} × ${i} <span>${n*i}</span></div>`;
  }
}

/* MODE */
document.querySelectorAll(".segmented button").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".segmented button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    keypad.classList.toggle("hidden", btn.dataset.mode === "tables");
    tablesDiv.classList.toggle("hidden", btn.dataset.mode !== "tables");
  };
});

/* PHYSICS */
const SNAP = {
  CLOSED: window.innerHeight * 0.92,
  PEEK: window.innerHeight * 0.7,
  HALF: window.innerHeight * 0.45,
  FULL: window.innerHeight * 0.08,
};

let currentY = SNAP.PEEK;
let lastY = 0;
let velocity = 0;
let dragging = false;

function setY(y) {
  sheet.style.transform = `translateY(${y}px)`;
}

function rubberBand(y) {
  if (y < SNAP.FULL) return SNAP.FULL - (SNAP.FULL - y) * 0.3;
  if (y > SNAP.CLOSED) return SNAP.CLOSED + (y - SNAP.CLOSED) * 0.3;
  return y;
}

function springTo(target) {
  let y = currentY;
  let v = velocity;

  function animate() {
    const force = (target - y) * 0.08;
    v = v * 0.85 + force;
    y += v;

    setY(y);

    if (Math.abs(v) > 0.1) requestAnimationFrame(animate);
    else currentY = target;
  }
  animate();
}

function startDrag(y) {
  dragging = true;
  lastY = y;
}

function moveDrag(y) {
  if (!dragging) return;

  const delta = y - lastY;
  lastY = y;
  velocity = delta;

  let next = currentY + delta;
  setY(rubberBand(next));
}

function endDrag() {
  dragging = false;

  const target = Object.values(SNAP).reduce((a,b)=>
    Math.abs(b-currentY)<Math.abs(a-currentY)?b:a
  );

  if (navigator.vibrate) navigator.vibrate(15);

  springTo(target);
}

/* EVENTS */
handle.addEventListener("touchstart", e => startDrag(e.touches[0].clientY));
handle.addEventListener("touchmove", e => moveDrag(e.touches[0].clientY));
handle.addEventListener("touchend", endDrag);

handle.addEventListener("mousedown", e => startDrag(e.clientY));
window.addEventListener("mousemove", e => moveDrag(e.clientY));
window.addEventListener("mouseup", endDrag);

/* VOICE */
document.getElementById("voice").onclick = () => {
  const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  rec.start();
  rec.onresult = e => {
    value = e.results[0][0].transcript;
    update();
  };
};

/* THEME */
document.getElementById("theme").onclick = () => {
  sheet.classList.toggle("dark");
};

/* INIT */
update();
renderHistory();
renderTables();
setY(currentY);