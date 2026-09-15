/* =========================================================
   ALL-IN-ONE CALCULATOR
   ========================================================= */

/* -----------------------------
   GLOBAL VARIABLES
----------------------------- */

let currentExpression = "";
let lastAnswer = 0;

const expressionDisplay = document.getElementById("expression");
const resultDisplay = document.getElementById("result");

let history = JSON.parse(localStorage.getItem("calculatorHistory") || "[]");

/* -----------------------------
   PAGE NAVIGATION
----------------------------- */

document.querySelectorAll(".tab").forEach(tab => {

  tab.addEventListener("click", () => {

    document.querySelectorAll(".tab").forEach(t => {
      t.classList.remove("active");
    });

    document.querySelectorAll(".page").forEach(page => {
      page.classList.remove("active-page");
    });

    tab.classList.add("active");

    const page = document.getElementById(tab.dataset.page);

    if (page) {
      page.classList.add("active-page");
    }

  });

});

/* -----------------------------
   THEME
----------------------------- */

const themeBtn = document.getElementById("themeBtn");

themeBtn.addEventListener("click", () => {

  document.body.classList.toggle("light");

  themeBtn.textContent =
    document.body.classList.contains("light")
      ? "🌙"
      : "☀️";

});

/* -----------------------------
   BASIC CALCULATOR
----------------------------- */

document.querySelectorAll(".calc-grid button").forEach(button => {

  button.addEventListener("click", () => {

    const value = button.dataset.value;
    const action = button.dataset.action;

    if (value !== undefined) {
      addToExpression(value);
    }

    if (action === "clear") {
      clearCalculator();
    }

    if (action === "delete") {
      deleteLast();
    }

    if (action === "calculate") {
      calculateBasic();
    }

  });

});

function addToExpression(value) {

  if (currentExpression === "0") {
    currentExpression = "";
  }

  currentExpression += value;

  expressionDisplay.textContent = currentExpression;

  previewCalculation();

}

function clearCalculator() {

  currentExpression = "";
  expressionDisplay.textContent = "0";
  resultDisplay.textContent = "0";

}

function deleteLast() {

  currentExpression =
    currentExpression.slice(0, -1);

  expressionDisplay.textContent =
    currentExpression || "0";

  previewCalculation();

}

function sanitizeExpression(expression) {

  return expression
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")
    .replace(/%/g, "/100");

}

function evaluateExpression(expression) {

  const safe = sanitizeExpression(expression);

  if (!/^[0-9+\-*/().\s]+$/.test(safe)) {
    throw new Error("Invalid expression");
  }

  return Function(
    `"use strict"; return (${safe})`
  )();

}

function previewCalculation() {

  if (!currentExpression) {
    resultDisplay.textContent = "0";
    return;
  }

  try {

    const answer = evaluateExpression(currentExpression);

    if (Number.isFinite(answer)) {
      resultDisplay.textContent = formatNumber(answer);
    }

  } catch {
    // Ignore incomplete expressions
  }

}

function calculateBasic() {

  if (!currentExpression) return;

  try {

    const answer =
      evaluateExpression(currentExpression);

    if (!Number.isFinite(answer)) {
      throw new Error();
    }

    lastAnswer = answer;

    resultDisplay.textContent =
      formatNumber(answer);

    addHistory(
      currentExpression,
      formatNumber(answer)
    );

  } catch {

    resultDisplay.textContent = "Error";

  }

}

function formatNumber(number) {

  if (!Number.isFinite(number)) {
    return "Error";
  }

  return Number(
    number.toPrecision(12)
  ).toString();

}

/* -----------------------------
   COPY RESULT
----------------------------- */

document.getElementById("copyBtn").addEventListener("click", async () => {

  const text = resultDisplay.textContent;

  try {

    await navigator.clipboard.writeText(text);

  } catch {

    const temp = document.createElement("textarea");

    temp.value = text;

    document.body.appendChild(temp);

    temp.select();

    document.execCommand("copy");

    temp.remove();

  }

});

document.getElementById("ansBtn").addEventListener("click", () => {

  addToExpression(String(lastAnswer));

});

/* -----------------------------
   KEYBOARD
----------------------------- */

document.addEventListener("keydown", event => {

  const allowed =
    "0123456789+-*/().%";

  if (allowed.includes(event.key)) {

    addToExpression(event.key);

  }

  if (event.key === "Enter") {

    event.preventDefault();

    calculateBasic();

  }

  if (event.key === "Backspace") {

    deleteLast();

  }

  if (event.key === "Escape") {

    clearCalculator();

  }

});

/* =========================================================
   SCIENTIFIC CALCULATOR
   ========================================================= */

const sciInput =
  document.getElementById("sciInput");

const sciExpression =
  document.getElementById("sciExpression");

const sciResult =
  document.getElementById("sciResult");

let selectedScientificOperation = null;

document.querySelectorAll("[data-sci]").forEach(button => {

  button.addEventListener("click", () => {

    const operation =
      button.dataset.sci;

    if (operation === "pi") {
      sciInput.value = Math.PI;
      calculateScientificDirect();
      return;
    }

    if (operation === "e") {
      sciInput.value = Math.E;
      calculateScientificDirect();
      return;
    }

    if (operation === "random") {
      sciInput.value = Math.random();
      sciExpression.textContent = "Random";
      sciResult.textContent =
        formatNumber(Number(sciInput.value));
      return;
    }

    selectedScientificOperation = operation;

    sciExpression.textContent =
      operation;

  });

});

document
  .getElementById("sciCalculate")
  .addEventListener("click", calculateScientificDirect);

function angleValue(value) {

  const mode =
    document.getElementById("angleMode").value;

  return mode === "deg"
    ? value * Math.PI / 180
    : value;

}

function inverseAngle(value) {

  const mode =
    document.getElementById("angleMode").value;

  return mode === "deg"
    ? value * 180 / Math.PI
    : value;

}

function factorial(n) {

  if (n < 0 || !Number.isInteger(n)) {
    throw new Error();
  }

  if (n > 170) {
    throw new Error();
  }

  let answer = 1;

  for (let i = 2; i <= n; i++) {
    answer *= i;
  }

  return answer;

}

function calculateScientificDirect() {

  const value =
    Number(sciInput.value);

  if (!Number.isFinite(value)) {

    sciResult.textContent = "Enter a number";

    return;

  }

  let answer;

  try {

    switch (selectedScientificOperation) {

      case "sin":
        answer = Math.sin(angleValue(value));
        break;

      case "cos":
        answer = Math.cos(angleValue(value));
        break;

      case "tan":
        answer = Math.tan(angleValue(value));
        break;

      case "asin":
        answer = inverseAngle(Math.asin(value));
        break;

      case "acos":
        answer = inverseAngle(Math.acos(value));
        break;

      case "atan":
        answer = inverseAngle(Math.atan(value));
        break;

      case "log":
        answer = Math.log10(value);
        break;

      case "ln":
        answer = Math.log(value);
        break;

      case "sqrt":
        answer = Math.sqrt(value);
        break;

      case "square":
        answer = value ** 2;
        break;

      case "cube":
        answer = value ** 3;
        break;

      case "factorial":
        answer = factorial(value);
        break;

      case "inverse":
        answer = 1 / value;
        break;

      case "abs":
        answer = Math.abs(value);
        break;

      case "floor":
        answer = Math.floor(value);
        break;

      case "ceil":
        answer = Math.ceil(value);
        break;

      case "negate":
        answer = -value;
        break;

      default:
        answer = value;

    }

    if (!Number.isFinite(answer)) {
      throw new Error();
    }

    sciResult.textContent =
      formatNumber(answer);

    addHistory(
      `${selectedScientificOperation || "value"}(${value})`,
      formatNumber(answer)
    );

  } catch {

    sciResult.textContent = "Error";

  }

}

/* =========================================================
   CONVERTER
   ========================================================= */

const units = {

  length: {
    meter: 1,
    kilometer: 1000,
    centimeter: 0.01,
    millimeter: 0.001,
    mile: 1609.344,
    yard: 0.9144,
    foot: 0.3048,
    inch: 0.0254
  },

  weight: {
    kilogram: 1,
    gram: 0.001,
    milligram: 0.000001,
    pound: 0.45359237,
    ounce: 0.0283495231,
    ton: 1000
  },

  area: {
    "square meter": 1,
    "square kilometer": 1000000,
    "square foot": 0.09290304,
    "square yard": 0.83612736,
    "square mile": 2589988.11,
    acre: 4046.8564224,
    hectare: 10000
  },

  volume: {
    liter: 1,
    milliliter: 0.001,
    "cubic meter": 1000,
    "cubic centimeter": 0.001,
    gallon: 3.785411784,
    quart: 0.946352946,
    pint: 0.473176473,
    cup: 0.2365882365
  },

  time: {
    second: 1,
    minute: 60,
    hour: 3600,
    day: 86400,
    week: 604800,
    month: 2629800,
    year: 31557600
  },

  speed: {
    "meter/second": 1,
    "kilometer/hour": 0.2777777778,
    "mile/hour": 0.44704,
    knot: 0.5144444444
  },

  data: {
    bit: 1,
    byte: 8,
    kilobyte: 8192,
    megabyte: 8388608,
    gigabyte: 8589934592,
    terabyte: 8796093022208
  }

};

const currencies = {

  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  PKR: 278,
  INR: 83.5,
  AED: 3.67,
  SAR: 3.75,
  CAD: 1.36,
  AUD: 1.52,
  JPY: 157,
  CNY: 7.2,
  TRY: 34,
  QAR: 3.64

};

const categorySelect =
  document.getElementById("category");

const fromUnit =
  document.getElementById("fromUnit");

const toUnit =
  document.getElementById("toUnit");

const fromValue =
  document.getElementById("fromValue");

const toValue =
  document.getElementById("toValue");

function populateUnits() {

  const category =
    categorySelect.value;

  fromUnit.innerHTML = "";
  toUnit.innerHTML = "";

  let data;

  if (category === "currency") {
    data = currencies;
  } else if (category === "temperature") {

    data = {
      Celsius: 1,
      Fahrenheit: 1,
      Kelvin: 1
    };

  } else {
    data = units[category];
  }

  Object.keys(data).forEach(unit => {

    const option1 =
      document.createElement("option");

    option1.value = unit;
    option1.textContent = unit;

    const option2 =
      document.createElement("option");

    option2.value = unit;
    option2.textContent = unit;

    fromUnit.appendChild(option1);
    toUnit.appendChild(option2);

  });

  if (toUnit.options.length > 1) {
    toUnit.selectedIndex = 1;
  }

  convert();

}

categorySelect.addEventListener(
  "change",
  populateUnits
);

fromUnit.addEventListener(
  "change",
  convert
);

toUnit.addEventListener(
  "change",
  convert
);

fromValue.addEventListener(
  "input",
  convert
);

function convertTemperature(value, from, to) {

  let celsius;

  if (from === "Celsius") {
    celsius = value;
  }

  if (from === "Fahrenheit") {
    celsius = (value - 32) * 5 / 9;
  }

  if (from === "Kelvin") {
    celsius = value - 273.15;
  }

  if (to === "Celsius") {
    return celsius;
  }

  if (to === "Fahrenheit") {
    return celsius * 9 / 5 + 32;
  }

  if (to === "Kelvin") {
    return celsius + 273.15;
  }

}

function convertCurrency(value, from, to) {

  const usd =
    value / currencies[from];

  return usd * currencies[to];

}

function convert() {

  const value =
    Number(fromValue.value);

  if (!Number.isFinite(value)) {

    toValue.value = "";

    return;

  }

  const category =
    categorySelect.value;

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

  } else if (category === "currency") {

    answer =
      convertCurrency(
        value,
        from,
        to
      );

  } else {

    const data =
      units[category];

    const baseValue =
      value * data[from];

    answer =
      baseValue / data[to];

  }

  toValue.value =
    formatNumber(answer);

  document.getElementById(
    "conversionText"
  ).textContent =
    `${value} ${from} = ${formatNumber(answer)} ${to}`;

}

document
  .getElementById("swapBtn")
  .addEventListener("click", () => {

    const oldFrom =
      fromUnit.value;

    fromUnit.value =
      toUnit.value;

    toUnit.value =
      oldFrom;

    convert();

  });

populateUnits();

/* =========================================================
   PERCENTAGE
   ========================================================= */

document
  .getElementById("percentBtn")
  .addEventListener("click", () => {

    const x =
      Number(document.getElementById("percentX").value);

    const y =
      Number(document.getElementById("percentY").value);

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return;
    }

    const answer =
      x / 100 * y;

    document.getElementById(
      "percentResult"
    ).textContent =
      `Result: ${formatNumber(answer)}`;

  });

/* =========================================================
   DISCOUNT
   ========================================================= */

document
  .getElementById("discountBtn")
  .addEventListener("click", () => {

    const price =
      Number(document.getElementById("priceInput").value);

    const discount =
      Number(document.getElementById("discountInput").value);

    if (!Number.isFinite(price) ||
        !Number.isFinite(discount)) {
      return;
    }

    const saved =
      price * discount / 100;

    const finalPrice =
      price - saved;

    document.getElementById(
      "discountResult"
    ).textContent =
      `You save ${formatNumber(saved)} — Final price: ${formatNumber(finalPrice)}`;

  });

/* =========================================================
   TIP
   ========================================================= */

document
  .getElementById("tipBtn")
  .addEventListener("click", () => {

    const bill =
      Number(document.getElementById("billInput").value);

    const tip =
      Number(document.getElementById("tipInput").value);

    if (!Number.isFinite(bill) ||
        !Number.isFinite(tip)) {
      return;
    }

    const tipAmount =
      bill * tip / 100;

    const total =
      bill + tipAmount;

    document.getElementById(
      "tipResult"
    ).textContent =
      `Tip: ${formatNumber(tipAmount)} — Total: ${formatNumber(total)}`;

  });

/* =========================================================
   BMI
   ========================================================= */

document
  .getElementById("bmiBtn")
  .addEventListener("click", () => {

    const height =
      Number(document.getElementById("heightInput").value);

    const weight =
      Number(document.getElementById("weightInput").value);

    if (height <= 0 || weight <= 0) {
      return;
    }

    const meters =
      height / 100;

    const bmi =
      weight / (meters * meters);

    let category;

    if (bmi < 18.5) {
      category = "Underweight";
    } else if (bmi < 25) {
      category = "Normal range";
    } else if (bmi < 30) {
      category = "Overweight";
    } else {
      category = "Obesity range";
    }

    document.getElementById(
      "bmiResult"
    ).textContent =
      `BMI: ${formatNumber(bmi)} — ${category}`;

  });

/* =========================================================
   NUMBER SYSTEM
   ========================================================= */

document
  .getElementById("numberBtn")
  .addEventListener("click", () => {

    const input =
      document.getElementById("numberInput").value.trim();

    const base =
      Number(document.getElementById("numberBase").value);

    try {

      const decimal =
        parseInt(input, base);

      if (Number.isNaN(decimal)) {
        throw new Error();
      }

      document.getElementById(
        "decimalResult"
      ).textContent =
        decimal;

      document.getElementById(
        "binaryResult"
      ).textContent =
        decimal.toString(2);

      document.getElementById(
        "octalResult"
      ).textContent =
        decimal.toString(8);

      document.getElementById(
        "hexResult"
      ).textContent =
        decimal.toString(16).toUpperCase();

    } catch {

      document.getElementById(
        "decimalResult"
      ).textContent = "Invalid";

      document.getElementById(
        "binaryResult"
      ).textContent = "Invalid";

      document.getElementById(
        "octalResult"
      ).textContent = "Invalid";

      document.getElementById(
        "hexResult"
      ).textContent = "Invalid";

    }

  });

/* =========================================================
   AGE CALCULATOR
   ========================================================= */

document
  .getElementById("ageBtn")
  .addEventListener("click", () => {

    const value =
      document.getElementById("birthDate").value;

    if (!value) return;

    const birth =
      new Date(value);

    const today =
      new Date();

    let years =
      today.getFullYear() -
      birth.getFullYear();

    let months =
      today.getMonth() -
      birth.getMonth();

    let days =
      today.getDate() -
      birth.getDate();

    if (days < 0) {
      months--;
      days += new Date(
        today.getFullYear(),
        today.getMonth(),
        0
      ).getDate();
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    document.getElementById(
      "ageResult"
    ).textContent =
      `Age: ${years} years, ${months} months, ${days} days`;

  });

/* =========================================================
   FRACTION
   ========================================================= */

function gcd(a, b) {

  a = Math.abs(a);
  b = Math.abs(b);

  while (b !== 0) {

    const temp = b;

    b = a % b;

    a = temp;

  }

  return a;

}

document
  .getElementById("fractionBtn")
  .addEventListener("click", () => {

    let numerator =
      Number(document.getElementById("numerator").value);

    let denominator =
      Number(document.getElementById("denominator").value);

    if (!Number.isInteger(numerator) ||
        !Number.isInteger(denominator) ||
        denominator === 0) {

      document.getElementById(
        "fractionResult"
      ).textContent =
        "Result: Invalid fraction";

      return;

    }

    const divisor =
      gcd(numerator, denominator);

    numerator /= divisor;
    denominator /= divisor;

    if (denominator < 0) {
      numerator *= -1;
      denominator *= -1;
    }

    document.getElementById(
      "fractionResult"
    ).textContent =
      `Result: ${numerator}/${denominator}`;

  });

/* =========================================================
   TIME
   ========================================================= */

document
  .getElementById("timeBtn")
  .addEventListener("click", () => {

    const hours =
      Number(document.getElementById("hoursInput").value) || 0;

    const minutes =
      Number(document.getElementById("minutesInput").value) || 0;

    const seconds =
      Number(document.getElementById("secondsInput").value) || 0;

    const total =
      hours * 3600 +
      minutes * 60 +
      seconds;

    document.getElementById(
      "timeResult"
    ).textContent =
      `Total seconds: ${total.toLocaleString()}`;

  });

/* =========================================================
   HISTORY
   ========================================================= */

function addHistory(expression, result) {

  history.unshift({
    expression,
    result,
    time: new Date().toLocaleString()
  });

  history =
    history.slice(0, 50);

  localStorage.setItem(
    "calculatorHistory",
    JSON.stringify(history)
  );

  renderHistory();

}

function renderHistory() {

  const list =
    document.getElementById("historyList");

  if (!history.length) {

    list.innerHTML =
      `<p class="empty">No calculations yet.</p>`;

    return;

  }

  list.innerHTML = "";

  history.forEach(item => {

    const div =
      document.createElement("div");

    div.className =
      "history-item";

    div.innerHTML = `
      <div>
        <div class="history-expression">
          ${escapeHTML(item.expression)}
        </div>
        <small>${escapeHTML(item.time)}</small>
      </div>

      <div class="history-result">
        ${escapeHTML(item.result)}
      </div>
    `;

    list.appendChild(div);

  });

}

function escapeHTML(text) {

  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}

document
  .getElementById("clearHistory")
  .addEventListener("click", () => {

    history = [];

    localStorage.removeItem(
      "calculatorHistory"
    );

    renderHistory();

  });

renderHistory();s
