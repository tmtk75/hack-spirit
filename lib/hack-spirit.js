'use strict';
//import TeamSpirit from './team-spirit';
var TeamSpirit = require('./team-spirit');

function printWorkStatus(userName, password) {
  var teamSpiritClient = new TeamSpirit(false);
  var loginPromise = teamSpiritClient.login(userName, password);
  loginPromise.then(function(cookies) {
    teamSpiritClient.nightmare.end();
    return teamSpiritClient.fetchWorkStatus();
  }).then(function(workStatus) {
    console.log(workStatus);
    return workStatus;
  });
};
module.exports = {
  printWorkStatus: printWorkStatus
};
