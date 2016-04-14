'use strict';

let moment = require('moment');
require("moment-duration-format");

const DurationType = {
  Absolute: 'Absolute',
  Relative: 'Relative'
};

class Project {
  constructor(params) {
    this.name          = params.name;
    this.totalDuration = params.totalDuration;
    if (params.durationStr) {
      var str = params.durationStr;
      let results = str.match(/([1-9]?[0-9]|100)\%/);
      if (results) {
        this.value = parseInt(results[0]);
        this.type = DurationType.Relative;
      } else {
        this.value = moment.duration(str);
        this.type = DurationType.Absolute;
      }
    }
    this.extraMilliSec = 0;
  }
  isRelative() {
    return this.type == DurationType.Relative;
  }
  isAbsolute() {
    return this.type == DurationType.Absolute;
  }
  setExtraDuration(duration) {
    this.extraMilliSec = duration.asMilliseconds();
  }
  getDuration() {
    switch (this.type) {
    case DurationType.Absolute:
      return this.value.add(moment.duration(this.extraMilliSec));
    case DurationType.Relative:
      let milliSec = this.totalDuration.asMilliseconds() * this.value * 0.01;
      return moment.duration(milliSec + this.extraMilliSec);
    default:
      return null;
    }
  }
  toDurationString() {
    var val = this.getDuration();
    if (val) {
      return val.format('h:mm');
    }
    return '';
  }
  toJSON() {
    return {
      name: this.name,
      duration: this.toDurationString()
    };
  }
}

Project.calculateProjects = function(projects, totalDuration) {
  totalDuration = moment.duration(totalDuration);
  let absolutes = projects.filter((p) => { return p.isAbsolute(); });
  let relatives = projects.filter((p) => { return p.isRelative(); });
  totalDuration = absolutes.reduce((t, p) => {
    return t.subtract(p.getDuration());
  }, totalDuration);

  relatives.forEach((p) => {
    p.totalDuration = moment.duration(totalDuration);
  });
  let restDuration = relatives.reduce((t, p) => {
    return t.subtract(p.getDuration());
  }, totalDuration);
  let last = projects[projects.length - 1];
  if (restDuration.asMilliseconds() >= 0) {
    last.setExtraDuration(restDuration);
    return true;
  } else {
    return false;
  }
};

Project.DurationType = DurationType;

module.exports = Project;
