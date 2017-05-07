const getFunctionName = require('./getFunctionName');

const replacer = (key, value) => 
  (typeof value === 'function') ?
    getFunctionName(value) :
    value

module.exports = function stringify(x) {
  try { // handle "Converting circular structure to JSON" error
    return JSON.stringify(x, replacer, 2);
  }
  catch (e) {
    return String(x);
  }
};