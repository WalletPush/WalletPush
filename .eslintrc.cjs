/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ["next/core-web-vitals"],
  rules: {
    "import/no-dynamic-require": "error",
    "no-restricted-syntax": [
      "error",
      { 
        "selector": "CallExpression[callee.name='import'] Literal[value=/\\$\\{/]", 
        "message": "Do not use variable dynamic imports. Use the registry." 
      }
    ]
  }
};
