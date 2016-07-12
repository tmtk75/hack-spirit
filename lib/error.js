'use strict';

var HackSpiritError = function(message) {
    this.name = "HackSpirit";
    this.message = message || "Unexpect";
};

HackSpiritError.prototype = new Error();
HackSpiritError.prototype.constructor = HackSpiritError;

module.exports = HackSpiritError;
