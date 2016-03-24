'use strict';
//import TeamSpirit from './team-spirit';
var TeamSpirit = require('./team-spirit');

function printWorkStatus(userName, password) {
  var teamSpiritClient = new TeamSpirit(false);
  var loginPromise = teamSpiritClient.login(userName, password);
  loginPromise.then(function(cookies) {
    return teamSpiritClient.fetchWorkStatus();
  }).then(function(workStatus) {
    console.log(workStatus);
    teamSpiritClient.dispose();
    return workStatus;
  }).catch(function(error) {
    console.log('Sorry, somthing went wrong. m(-_-)m : ' + error);
  });
};
module.exports = {
  printWorkStatus: printWorkStatus
};
