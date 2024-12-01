// Define a mapping of arithmetic operators to their corresponding functions.
const infixToFunction = {
  "+": (x, y) => x + y,   // Addition
  "-": (x, y) => x - y,   // Subtraction
  "*": (x, y) => x * y,   // Multiplication
  "/": (x, y) => x / y,   // Division
};

// Evaluate an infix expression (e.g., "3+4") using regex and operator mapping.
const infixEval = (str, regex) => str.replace(regex, (_match, arg1, operator, arg2) => 
  infixToFunction[operator](parseFloat(arg1), parseFloat(arg2))
);

// Handle operators with high precedence (* and /).
const highPrecedence = str => {
  const regex = /([\d.]+)([*\/])([\d.]+)/; // Match a number, operator, and another number.
  const str2 = infixEval(str, regex);
  // Recursively evaluate if there are still high-precedence operators left.
  return str === str2 ? str : highPrecedence(str2);
};

// Utility functions for numerical operations.
const isEven = num => num % 2 === 0;                 // Check if a number is even.
const sum = nums => nums.reduce((acc, el) => acc + el, 0); // Sum of an array.
const average = nums => sum(nums) / nums.length;    // Average of an array.

// Calculate the median of an array of numbers.
const median = nums => {
  const sorted = nums.slice().sort((a, b) => a - b); // Sort the array.
  const length = sorted.length;
  const middle = length / 2 - 1;                     // Find the middle index.
  return isEven(length)
    ? average([sorted[middle], sorted[middle + 1]])  // Average the two middle numbers.
    : sorted[Math.ceil(middle)];                     // Return the single middle number.
};

// Define custom spreadsheet functions.
const spreadsheetFunctions = {
  sum,
  average,
  median,
  even: nums => nums.filter(isEven),                // Filter even numbers.
  someeven: nums => nums.some(isEven),              // Check if any number is even.
  everyeven: nums => nums.every(isEven),            // Check if all numbers are even.
  firsttwo: nums => nums.slice(0, 2),               // Get the first two numbers.
  lasttwo: nums => nums.slice(-2),                  // Get the last two numbers.
  has2: nums => nums.includes(2),                   // Check if the number 2 exists.
  increment: nums => nums.map(num => num + 1),      // Increment all numbers by 1.
  random: ([x, y]) => Math.floor(Math.random() * y + x), // Generate a random number between x and y.
  range: nums => range(...nums),                    // Create a range of numbers.
  nodupes: nums => [...new Set(nums).values()],     // Remove duplicate numbers.
};

// Apply spreadsheet functions to expressions.
const applyFunction = str => {
  const noHigh = highPrecedence(str);               // Resolve high-precedence operators.
  const infix = /([\d.]+)([+-])([\d.]+)/;           // Match addition or subtraction.
  const str2 = infixEval(noHigh, infix);            // Evaluate the low-precedence operators.
  const functionCall = /([a-z0-9]*)\(([0-9., ]*)\)(?!.*\()/i; // Match custom function calls.
  const toNumberList = args => args.split(",").map(parseFloat); // Convert arguments to numbers.
  const apply = (fn, args) => spreadsheetFunctions[fn.toLowerCase()](toNumberList(args)); // Apply the function.
  return str2.replace(functionCall, (match, fn, args) => 
    spreadsheetFunctions.hasOwnProperty(fn.toLowerCase()) ? apply(fn, args) : match
  );
};

// Create a range of numbers between start and end.
const range = (start, end) => Array(end - start + 1).fill(start).map((element, index) => element + index);

// Create a range of characters between start and end.
const charRange = (start, end) => range(start.charCodeAt(0), end.charCodeAt(0)).map(code => String.fromCharCode(code));

// Evaluate formulas inside spreadsheet cells.
const evalFormula = (x, cells) => {
  const idToText = id => cells.find(cell => cell.id === id).value; // Find cell by ID and get its value.
  const rangeRegex = /([A-J])([1-9][0-9]?):([A-J])([1-9][0-9]?)/gi; // Match ranges like A1:B5.
  const rangeFromString = (num1, num2) => range(parseInt(num1), parseInt(num2)); // Parse numeric ranges.
  const elemValue = num => character => idToText(character + num); // Get cell value from ID.
  const addCharacters = character1 => character2 => num => charRange(character1, character2).map(elemValue(num)); // Expand character ranges.
  const rangeExpanded = x.replace(rangeRegex, (_match, char1, num1, char2, num2) => rangeFromString(num1, num2).map(addCharacters(char1)(char2)));
  const cellRegex = /[A-J][1-9][0-9]?/gi; // Match individual cell references like A1.
  const cellExpanded = rangeExpanded.replace(cellRegex, match => idToText(match.toUpperCase())); // Replace references with values.
  const functionExpanded = applyFunction(cellExpanded); // Apply spreadsheet functions.
  return functionExpanded === x ? functionExpanded : evalFormula(functionExpanded, cells); // Recursively evaluate nested formulas.
};

// Initialize the spreadsheet on page load.
window.onload = () => {
  const container = document.getElementById("container"); // Main container for the spreadsheet.

  // Create row/column labels.
  const createLabel = (name) => {
    const label = document.createElement("div");
    label.className = "label";            // Style labels.
    label.textContent = name;             // Set label text.
    container.appendChild(label);         // Add label to the container.
  };

  const letters = charRange("A", "J");    // Column letters A-J.
  letters.forEach(createLabel);           // Add column labels.

  range(1, 99).forEach(number => {
    createLabel(number);                  // Add row labels.
    letters.forEach(letter => {
      const input = document.createElement("input"); // Create input fields for cells.
      input.type = "text";                          // Input type is text.
      input.id = letter + number;                   // ID corresponds to the cell reference.
      input.ariaLabel = letter + number;            // Accessibility label.
      input.onchange = update;                      // Trigger `update` on change.
      container.appendChild(input);                 // Add input to the container.
    });
  });
};

// Update cell values when changed.
const update = event => {
  const element = event.target;                     // Get the changed cell.
  const value = element.value.replace(/\s/g, "");   // Remove whitespace from input.
  if (!value.includes(element.id) && value.startsWith('=')) {
    element.value = evalFormula(value.slice(1), Array.from(document.getElementById("container").children)); // Evaluate formula if input starts with '='.
  }
};

//new comment for git