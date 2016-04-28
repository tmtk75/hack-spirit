'use strict';
let prompt   = require('prompt');
let colors   = require('colors');
let moment   = require('moment');
let Project  = require('./project');
require("moment-duration-format");



prompt.message   = '';
prompt.delimiter = '';

let w = colors.white;


class Prompt {
  constructor() {
    prompt.start();
  }

  print(message) {
    console.log(message);
  }

  * scanWorkTimeOfProjects(totalDuration, projectObjects) {
    let schema = {
      properties: {}
    };
    projectObjects.forEach((p) => {
      schema.properties[p.name] = {
        required: true,
        description: w(`${p.name}:`)
      };
    });
    this.print('Enter your work time of each project.');
    let workTimeOfProjects = yield this.get(schema);
    return projectObjects.map((p) => {
      return new Project({
        name: p.name,
        durationStr: workTimeOfProjects[p.name],
        totalDuration: totalDuration
      });
    });
  }

  * confirm() {
    let schema = {
      properties: {
        answer: { required: true, description: w('Please input yes or no:') }
      }
    };
    this.print('Is it OK?');
    let result = yield this.get(schema);
    return result.answer === 'yes';
  }

  get(schema) {
    return new Promise((resolve, reject) => {
      prompt.get(schema, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  }

  * scanPeriod() {
    let schema = {
      properties: {
        period: { required: true, description: 'period?' }
      }
    };
    this.print('Enter period (hh:mm)');
    let result = yield this.get(schema);
    return moment.duration(result.period);
  }

}

module.exports = Prompt;
