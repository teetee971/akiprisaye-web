/** ESLint v8 config (CommonJS) */
module.exports = {
  root: true,
  env: { node: true, es6: true },
  extends: ["eslint:recommended"],
  rules: {
    "max-len": "off",
    "object-curly-spacing": "off",
    "comma-dangle": "off"
  }
};
