/* =========================================================
   ALL-IN-ONE CALCULATOR
   ========================================================= */

const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const toast = document.getElementById("toast");

let expression = "";
let result = "0";
let lastAnswer = 0;

let lastOperand = null;
let lastOperator = null;
let justCalculated = false;

let angleMode = "DEG";

let history =
  JSON.parse(localStorage.getItem("calcHistory") || "[]");


/* =========================================================
   DISPLAY
   ========================================================= */

function updateDisplay() {

  expressionEl.textContent = expression || "0";
  resultEl.textContent = result || "0";

}


/* =========================================================
   SAFE CALCULATION
   ========================================================= */

function calculateExpression(exp) {

  if (!exp) return 0;

  let safe = exp
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/π/g, "Math.PI")
    .replace(/\be\b/g, "Math.E");

  safe = safe.replace(
    /(\d+(?:\.\d+)?)%/g,
    "($1/100)"
  );

  if (!/^[0-9+\-*/().%\sMathPIE]+$/.test(safe)) {
    throw new Error("Invalid expression");
  }

  const value = Function(
    '"use strict"; return (' + safe + ')'
  )();

  if (!Number.isFinite(value)) {
    throw new Error("Invalid result");
  }

  return value;
}


/* =========================================================
   FORMAT NUMBER
   ========================================================= */

function formatNumber(value) {

  if (typeof value !== "number") {
    value = Number(value);
  }

  if (!Number.isFinite(value)) {
    return "Error";
  }

  if (Math.abs(value) >= 1e12 ||
      (Math.abs(value) > 0 && Math.abs(value) < 1e-8)) {

    return value.toExponential(8);
  }

  return Number(
    value.toPrecision(12)
  ).toString();
}


/* =========================================================
   ADD INPUT
   ========================================================= */

function addValue(value) {

  if (justCalculated) {

    if (
      !["+", "-", "*", "/", "%"].includes(value)
    ) {
      expression = "";
    }

    justCalculated = false;
  }

  expression += value;

  updateLiveResult();
}


/* =========================================================
   LIVE RESULT
   ========================================================= */

function updateLiveResult() {

  try {

    const value =
      calculateExpression(expression);

    result = formatNumber(value);

  } catch {

    result = "0";

  }

  updateDisplay();
}


/* =========================================================
   CLEAR
   ========================================================= */

function clearCalculator() {

  expression = "";
  result = "0";

  lastOperand = null;
  lastOperator = null;

  justCalculated = false;

  updateDisplay();
}


/* =========================================================
   DELETE
   ========================================================= */

function deleteLast() {

  if (justCalculated) {
    clearCalculator();
    return;
  }

  expression =
    expression.slice(0, -1);

  updateLiveResult();
}


/* =========================================================
   FIND LAST OPERATOR
   ========================================================= */

function getLastOperation(exp) {

  const match =
    exp.match(
      /(-?\d+(?:\.\d+)?)\s*([+\-*/])\s*(-?\d+(?:\.\d+)?)$/
    );

  if (!match) return null;

  return {
    left: Number(match[1]),
    operator: match[2],
    right: Number(match[3])
  };
}


/* =========================================================
   EQUALS
   IMPORTANT:
   Every press of = creates a history item.
   ========================================================= */

function pressEquals() {

  if (!expression) return;

  try {

    let currentExpression = expression;

    /*
      If the previous action was already equals,
      repeat the previous operation.

      Example:

      4 + 4 =
      8

      =
      12

      =
      16

      etc.
    */

    if (justCalculated &&
        lastOperator !== null &&
        lastOperand !== null) {

      currentExpression =
        `${result}${lastOperator}${lastOperand}`;

    } else {

      const operation =
        getLastOperation(expression);

      if (operation) {

        lastOperator = operation.operator;
        lastOperand = operation.right;

      }

    }

    const value =
      calculateExpression(currentExpression);

    const formatted =
      formatNumber(value);

    /*
      IMPORTANT:
      Add history EVERY SINGLE TIME "=" is pressed.
    */

    addHistory(
      currentExpression,
      formatted
    );

    result = formatted;
    lastAnswer = value;

    expression = formatted;

    justCalculated = true;

    updateDisplay();

  } catch {

    result = "Error";
    updateDisplay();

  }
}


/* =========================================================
   BUTTON EVENTS
   ========================================================= */

document
  .querySelectorAll(".calc-btn")
  .forEach(button => {

    button.addEventListener("click", () => {

      const value =
        button.dataset.value;

      const action =
        button.dataset.action;

      if (action === "clear") {
        clearCalculator();
        return;
      }

      if (action === "delete") {
        deleteLast();
        return;
      }

      if (action === "equals") {
        pressEquals();
        return;
      }

      if (value !== undefined) {

        addValue(value);

      }

    });

  });


/* =========================================================
   KEYBOARD
   ========================================================= */

document.addEventListener("keydown", event => {

  const key = event.key;

  if (
    /^[0-9.]$/.test(key)
  ) {

    addValue(key);
    return;

  }

  if (
    ["+", "-", "*", "/", "%"].includes(key)
  ) {

    addValue(key);
    return;

  }

  if (key === "Enter" || key === "=") {

    event.preventDefault();
    pressEquals();
    return;

  }

  if (key === "Backspace") {

    deleteLast();
    return;

  }

  if (key === "Escape") {

    clearCalculator();

  }

});


/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(exp, answer) {

  const item = {

    expression: exp,
    result: answer,
    time: new Date().toLocaleTimeString()

  };

  /*
    We add a NEW object every time.
    Therefore pressing = 4 times gives
    4 history entries.
  */

  history.unshift(item);

  if (history.length > 100) {

    history =
      history.slice(0, 100);

  }

  localStorage.setItem(
    "calcHistory",
    JSON.stringify(history)
  );

  renderHistory();
}


/* =========================================================
   RENDER HISTORY
   ========================================================= */

function renderHistory() {

  historyCount.textContent =
    `${history.length} calculation${history.length === 1 ? "" : "s"}`;

  if (!history.length) {

    historyList.innerHTML = `
      <div class="empty-history">
        <div class="empty-icon">⌁</div>
        <p>No calculations yet</p>
        <span>Your calculations will appear here.</span>
      </div>
    `;

    return;

  }

  historyList.innerHTML =
    history.map((item, index) => `

      <div class="history-item"
           data-history-index="${index}">

        <div class="history-expression">
          ${escapeHTML(item.expression)} =
        </div>

        <div class="history-result">
          ${escapeHTML(item.result)}
        </div>

        <div class="history-time">
          ${escapeHTML(item.time)}
        </div>

      </div>

    `).join("");

}


/* =========================================================
   ESCAPE HTML
   ========================================================= */

function escapeHTML(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   HISTORY CLICK
   ========================================================= */

historyList.addEventListener(
  "click",
  event => {

    const item =
      event.target.closest(".history-item");

    if (!item) return;

    const index =
      Number(item.dataset.historyIndex);

    const selected =
      history[index];

    if (!selected) return;

    expression =
      selected.result;

    result =
      selected.result;

    justCalculated = true;

    updateDisplay();

  }
);


/* =========================================================
   CLEAR HISTORY
   ========================================================= */

function clearHistory() {

  history = [];

  localStorage.removeItem(
    "calcHistory"
  );

  renderHistory();

}

document
  .getElementById("historyClear")
  .addEventListener(
    "click",
    clearHistory
  );

document
  .getElementById("clearHistoryBtn")
  .addEventListener(
    "click",
    clearHistory
  );


/* =========================================================
   COPY
   ========================================================= */

document
  .getElementById("copyBtn")
  .addEventListener(
    "click",
    async () => {

      try {

        await navigator.clipboard.writeText(
          result
        );

        showToast("Result copied!");

      } catch {

        showToast("Copy failed");

      }

    }
  );


/* =========================================================
   ANS
   ========================================================= */

document
  .getElementById("ansBtn")
  .addEventListener(
    "click",
    () => {

      addValue(
        formatNumber(lastAnswer)
      );

    }
  );


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {

  toast.textContent = message;

  toast.classList.add("show");

  setTimeout(() => {

    toast.classList.remove("show");

  }, 1600);

}


/* =========================================================
   MODE SWITCHING
   ========================================================= */

const modeTabs =
  document.querySelectorAll(".mode-tab");

modeTabs.forEach(tab => {

  tab.addEventListener("click", () => {

    modeTabs.forEach(t =>
      t.classList.remove("active")
    );

    tab.classList.add("active");

    const mode =
      tab.dataset.mode;

    document
      .getElementById("standardMode")
      .classList.toggle(
        "hidden",
        mode !== "standard"
      );

    document
      .getElementById("scientificMode")
      .classList.toggle(
        "hidden",
        mode !== "scientific"
      );

    document
      .getElementById("converterMode")
      .classList.toggle(
        "hidden",
        mode !== "converter"
      );

    document
      .getElementById("toolsMode")
      .classList.toggle(
        "hidden",
        mode !== "tools"
      );

  });

});


/* =========================================================
   THEME
   ========================================================= */

const themeBtn =
  document.getElementById("themeBtn");

themeBtn.addEventListener(
  "click",
  () => {

    document.body.classList.toggle("light");

    const light =
      document.body.classList.contains("light");

    localStorage.setItem(
      "calcTheme",
      light ? "light" : "dark"
    );

    themeBtn.textContent =
      light ? "🌙" : "☀";

  }
);

if (
  localStorage.getItem("calcTheme") === "light"
) {

  document.body.classList.add("light");
  themeBtn.textContent = "🌙";

}


/* =========================================================
   SCIENTIFIC FUNCTIONS
   ========================================================= */

document
  .querySelectorAll("[data-scientific]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const type =
          button.dataset.scientific;

        let value;

        try {

          if (type === "pi") {

            addValue("π");
            return;

          }

          if (type === "e") {

            addValue("e");
            return;

          }

          if (type === "random") {

            value = Math.random();

          } else {

            const current =
              calculateExpression(expression);

            switch (type) {

              case "sin":

                value =
                  Math.sin(
                    angleMode === "DEG"
                      ? current * Math.PI / 180
                      : current
                  );

                break;

              case "cos":

                value =
                  Math.cos(
                    angleMode === "DEG"
                      ? current * Math.PI / 180
                      : current
                  );

                break;

              case "tan":

                value =
                  Math.tan(
                    angleMode === "DEG"
                      ? current * Math.PI / 180
                      : current
                  );

                break;

              case "asin":

                value =
                  Math.asin(current);

                if (angleMode === "DEG") {
                  value =
                    value * 180 / Math.PI;
                }

                break;

              case "acos":

                value =
                  Math.acos(current);

                if (angleMode === "DEG") {
                  value =
                    value * 180 / Math.PI;
                }

                break;

              case "atan":

                value =
                  Math.atan(current);

                if (angleMode === "DEG") {
                  value =
                    value * 180 / Math.PI;
                }

                break;

              case "log":

                value =
                  Math.log10(current);

                break;

              case "ln":

                value =
                  Math.log(current);

                break;

              case "sqrt":

                value =
                  Math.sqrt(current);

                break;

              case "square":

                value =
                  current ** 2;

                break;

              case "cube":

                value =
                  current ** 3;

                break;

              case "factorial":

                value =
                  factorial(current);

                break;

              case "abs":

                value =
                  Math.abs(current);

                break;

              case "floor":

                value =
                  Math.floor(current);

                break;

              case "ceil":

                value =
                  Math.ceil(current);

                break;

              case "negate":

                value =
                  -current;

                break;

              case "inverse":

                value =
                  1 / current;

                break;

            }

          }

          result =
            formatNumber(value);

          expression =
            result;

          lastAnswer =
            value;

          justCalculated =
            true;

          updateDisplay();

          addHistory(
            type + "(" + (result) + ")",
            result
          );

        } catch {

          result = "Error";
          updateDisplay();

        }

      }
    );

  });


/* =========================================================
   FACTORIAL
   ========================================================= */

function factorial(n) {

  n = Number(n);

  if (
    n < 0 ||
    !Number.isInteger(n) ||
    n > 170
  ) {

    throw new Error(
      "Invalid factorial"
    );

  }

  let total = 1;

  for (
    let i = 2;
    i <= n;
    i++
  ) {

    total *= i;

  }

  return total;

}


/* =========================================================
   ANGLE MODE
   ========================================================= */

document
  .querySelectorAll("[data-angle]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll("[data-angle]")
          .forEach(b =>
            b.classList.remove("active")
          );

        button.classList.add("active");

        angleMode =
          button.dataset.angle;

      }
    );

  });


/* =========================================================
   CONVERTER DATA
   ========================================================= */

const units = {

  length: {
    Meter: 1,
    Kilometer: 1000,
    Centimeter: 0.01,
    Millimeter: 0.001,
    Mile: 1609.344,
    Yard: 0.9144,
    Foot: 0.3048,
    Inch: 0.0254
  },

  weight: {
    Kilogram: 1,
    Gram: 0.001,
    Milligram: 0.000001,
    Pound: 0.45359237,
    Ounce: 0.0283495
  },

  area: {
    "Square Meter": 1,
    "Square Kilometer": 1000000,
    "Square Foot": 0.092903,
    "Square Yard": 0.836127,
    "Acre": 4046.856,
    "Hectare": 10000
  },

  volume: {
    Liter: 1,
    Milliliter: 0.001,
    "Cubic Meter": 1000,
    "Gallon": 3.78541,
    "Cup": 0.236588
  },

  time: {
    Second: 1,
    Minute: 60,
    Hour: 3600,
    Day: 86400,
    Week: 604800
  },

  speed: {
    "Meter/Second": 1,
    "Kilometer/Hour": 0.277778,
    "Mile/Hour": 0.44704,
    Knot: 0.514444
  },

  digital: {
    Bit: 1,
    Byte: 8,
    Kilobit: 1000,
    Kilobyte: 8000,
    Megabit: 1000000,
    Megabyte: 8000000,
    Gigabit: 1000000000,
    Gigabyte: 8000000000
  },

  currency: {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    PKR: 280,
    INR: 83,
    AED: 3.67,
    SAR: 3.75,
    CAD: 1.36,
    AUD: 1.52,
    JPY: 150,
    CNY: 7.2,
    TRY: 33,
    QAR: 3.64
  }

};


/* =========================================================
   CONVERTER SELECTS
   ========================================================= */

const categorySelect =
  document.getElementById(
    "converterCategory"
  );

const fromUnit =
  document.getElementById(
    "fromUnit"
  );

const toUnit =
  document.getElementById(
    "toUnit"
  );


function populateUnits() {

  const category =
    categorySelect.value;

  const data =
    units[category];

  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  Object.keys(data).forEach(
    (unit, index) => {

      fromUnit.innerHTML +=
        `<option value="${unit}">
          ${unit}
        </option>`;

      toUnit.innerHTML +=
        `<option value="${unit}">
          ${unit}
        </option>`;

    }
  );

  if (Object.keys(data).length > 1) {
    toUnit.selectedIndex = 1;
  }

  convert();

}


categorySelect.addEventListener(
  "change",
  populateUnits
);


/* =========================================================
   CONVERT
   ========================================================= */

function convert() {

  const category =
    categorySelect.value;

  const value =
    Number(
      document.getElementById(
        "convertInput"
      ).value
    );

  if (Number.isNaN(value)) return;

  const from =
    fromUnit.value;

  const to =
    toUnit.value;

  let answer;

  if (category === "temperature") {

    answer =
      convertTemperature(
        value,
        from,
        to
      );

  } else {

    const data =
      units[category];

    answer =
      value * data[from] / data[to];

  }

  document.getElementById(
    "conversionResult"
  ).textContent =
    `${formatNumber(answer)} ${to}`;

}


function convertTemperature(
  value,
  from,
  to
) {

  let celsius;

  if (from === "Celsius") {

    celsius = value;

  } else if (from === "Fahrenheit") {

    celsius =
      (value - 32) * 5 / 9;

  } else {

    celsius =
      value - 273.15;

  }

  if (to === "Celsius") {

    return celsius;

  }

  if (to === "Fahrenheit") {

    return celsius * 9 / 5 + 32;

  }

  return celsius + 273.15;

}


document
  .getElementById("convertBtn")
  .addEventListener(
    "click",
    convert
  );


document
  .getElementById("convertInput")
  .addEventListener(
    "input",
    convert
  );


document
  .getElementById("swapBtn")
  .addEventListener(
    "click",
    () => {

      const old =
        fromUnit.selectedIndex;

      fromUnit.selectedIndex =
        toUnit.selectedIndex;

      toUnit.selectedIndex =
        old;

      convert();

    }
  );


/* =========================================================
   TEMPERATURE FIX
   ========================================================= */

units.temperature = {
  Celsius: 1,
  Fahrenheit: 1,
  Kelvin: 1
};


/* =========================================================
   TOOLS
   ========================================================= */

document
  .querySelectorAll("[data-tool]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        showTool(
          button.dataset.tool
        );

      }
    );

  });


function showTool(tool) {

  const panel =
    document.getElementById(
      "toolPanel"
    );

  if (tool === "percentage") {

    panel.innerHTML = `
      <h2>Percentage</h2>

      <div class="tool-form">
        <label>Number</label>
        <input id="pNumber" type="number" value="100">

        <label>Percentage</label>
        <input id="pPercent" type="number" value="10">

        <button class="tool-submit" onclick="calcPercentage()">
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "discount") {

    panel.innerHTML = `
      <h2>Discount Calculator</h2>

      <div class="tool-form">
        <label>Original Price</label>
        <input id="dPrice" type="number" value="1000">

        <label>Discount %</label>
        <input id="dPercent" type="number" value="10">

        <button class="tool-submit" onclick="calcDiscount()">
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "tip") {

    panel.innerHTML = `
      <h2>Tip Calculator</h2>

      <div class="tool-form">
        <label>Bill</label>
        <input id="tBill" type="number" value="1000">

        <label>Tip %</label>
        <input id="tPercent" type="number" value="10">

        <button class="tool-submit" onclick="calcTip()">
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "bmi") {

    panel.innerHTML = `
      <h2>BMI Calculator</h2>

      <div class="tool-form">
        <label>Weight (kg)</label>
        <input id="bWeight" type="number" value="60">

        <label>Height (cm)</label>
        <input id="bHeight" type="number" value="170">

        <button class="tool-submit" onclick="calcBMI()">
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "age") {

    panel.innerHTML = `
      <h2>Age Calculator</h2>

      <div class="tool-form">
        <label>Date of Birth</label>

        <input
          id="birthDate"
          type="date"
        >

        <button class="tool-submit" onclick="calcAge()">
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "fraction") {

    panel.innerHTML = `
      <h2>Fraction Simplifier</h2>

      <div class="tool-form">
        <label>Numerator</label>
        <input id="fNum" type="number" value="8">

        <label>Denominator</label>
        <input id="fDen" type="number" value="12">

        <button class="tool-submit" onclick="simplifyFraction()">
          SIMPLIFY
        </button>

        <div id="toolResult" class="tool-result"></div>
      </div>
    `;

  }

  else if (tool === "number") {

    panel.innerHTML = `
      <h2>Number System Converter</h2>

      <div class="tool-form">

        <label>Decimal Number</label>

        <input
          id="numberInput"
          type="number"
          value="255"
        >

        <button
          class="tool-submit"
          onclick="convertNumberSystem()"
        >
          CONVERT
        </button>

        <div id="toolResult" class="tool-result"></div>

      </div>
    `;

  }

  else if (tool === "time") {

    panel.innerHTML = `
      <h2>Time Calculator</h2>

      <div class="tool-form">

        <label>Hours</label>
        <input id="timeHours" type="number" value="2">

        <label>Minutes</label>
        <input id="timeMinutes" type="number" value="30">

        <button
          class="tool-submit"
          onclick="calcTime()"
        >
          CALCULATE
        </button>

        <div id="toolResult" class="tool-result"></div>

      </div>
    `;

  }

}


/* =========================================================
   TOOL FUNCTIONS
   ========================================================= */

function calcPercentage() {

  const n =
    Number(
      document.getElementById("pNumber").value
    );

  const p =
    Number(
      document.getElementById("pPercent").value
    );

  const answer =
    n * p / 100;

  document.getElementById(
    "toolResult"
  ).textContent =
    `${p}% of ${n} = ${formatNumber(answer)}`;

}


function calcDiscount() {

  const price =
    Number(
      document.getElementById("dPrice").value
    );

  const discount =
    Number(
      document.getElementById("dPercent").value
    );

  const saved =
    price * discount / 100;

  const finalPrice =
    price - saved;

  document.getElementById(
    "toolResult"
  ).innerHTML =
    `You save: ${formatNumber(saved)}<br>
     Final price: ${formatNumber(finalPrice)}`;

}


function calcTip() {

  const bill =
    Number(
      document.getElementById("tBill").value
    );

  const percent =
    Number(
      document.getElementById("tPercent").value
    );

  const tip =
    bill * percent / 100;

  const total =
    bill + tip;

  document.getElementById(
    "toolResult"
  ).innerHTML =
    `Tip: ${formatNumber(tip)}<br>
     Total: ${formatNumber(total)}`;

}


function calcBMI() {

  const weight =
    Number(
      document.getElementById("bWeight").value
    );

  const height =
    Number(
      document.getElementById("bHeight").value
    ) / 100;

  if (!height) return;

  const bmi =
    weight / (height * height);

  document.getElementById(
    "toolResult"
  ).textContent =
    `BMI: ${formatNumber(bmi)}`;

}


function calcAge() {

  const date =
    new Date(
      document.getElementById(
        "birthDate"
      ).value
    );

  if (isNaN(date)) return;

  const now =
    new Date();

  let age =
    now.getFullYear() -
    date.getFullYear();

  const month =
    now.getMonth() -
    date.getMonth();

  if (
    month < 0 ||
    (
      month === 0 &&
      now.getDate() < date.getDate()
    )
  ) {

    age--;

  }

  document.getElementById(
    "toolResult"
  ).textContent =
    `Age: ${age} years`;

}


function gcd(a, b) {

  a = Math.abs(a);
  b = Math.abs(b);

  while (b) {

    [a, b] = [
      b,
      a % b
    ];

  }

  return a;

}


function simplifyFraction() {

  const numerator =
    Number(
      document.getElementById("fNum").value
    );

  const denominator =
    Number(
      document.getElementById("fDen").value
    );

  if (!denominator) return;

  const divisor =
    gcd(
      numerator,
      denominator
    );

  document.getElementById(
    "toolResult"
  ).textContent =
    `${numerator / divisor} / ${denominator / divisor}`;

}


function convertNumberSystem() {

  const n =
    Number(
      document.getElementById(
        "numberInput"
      ).value
    );

  if (!Number.isInteger(n)) return;

  document.getElementById(
    "toolResult"
  ).innerHTML =
    `Binary: ${n.toString(2)}<br>
     Octal: ${n.toString(8)}<br>
     Hex: ${n.toString(16).toUpperCase()}`;

}


function calcTime() {

  const hours =
    Number(
      document.getElementById(
        "timeHours"
      ).value
    );

  const minutes =
    Number(
      document.getElementById(
        "timeMinutes"
      ).value
    );

  const total =
    hours * 60 + minutes;

  const finalHours =
    Math.floor(total / 60);

  const finalMinutes =
    total % 60;

  document.getElementById(
    "toolResult"
  ).textContent =
    `${finalHours} hours ${finalMinutes} minutes`;

}


/* =========================================================
   STARTUP
   ========================================================= */

populateUnits();
renderHistory();
updateDisplay();
