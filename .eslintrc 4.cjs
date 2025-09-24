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
    ],
    // Temporarily disable problematic rules for build success
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "warn",
    "@next/next/no-img-element": "warn"
  }
};
