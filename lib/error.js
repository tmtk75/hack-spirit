'use strict';

var HackSpiritError = function(message) {
  this.name = "HackSpirit";
  this.message = message || "Unexpect";
  Error.captureStackTrace(this, this.constructor);
};

HackSpiritError.prototype = new Error();
HackSpiritError.prototype.constructor = HackSpiritError;

module.exports = HackSpiritError;
