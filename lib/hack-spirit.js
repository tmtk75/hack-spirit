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

function printError(error) {
  console.log(`Sorry, somthing went wrong. m(-_-)m: ${error}`);
}

function startWork(userName, password) {
  var teamSpiritClient = new TeamSpirit(true);
  var loginPromise = teamSpiritClient.login(userName, password);
  loginPromise.then(function(cookies) {
    return teamSpiritClient.fetchWorkStatus();
  }).then(function(workStatus) {
    if (workStatus !== 'not_working') {
      return Promise.reject(`you are already working. (status=${workStatus})`);
    }
    return teamSpiritClient.startWork();
  }).then(function() {
    console.log("Succeeded in starting work!! Let's working!! (9｀･ω･)9");
    teamSpiritClient.dispose();
  }).catch(function(error) {
    printError(error);
    teamSpiritClient.dispose();
  });
}

function finishWork(userName, password) {
  var teamSpiritClient = new TeamSpirit(true);
  var loginPromise = teamSpiritClient.login(userName, password);
  loginPromise.then(function(cookies) {
    return teamSpiritClient.fetchWorkStatus();
  }).then(function(workStatus) {
    if (workStatus !== 'working') {
      return Promise.reject(`you are not working. (status=${workStatus})`);
    }
    return teamSpiritClient.finishWork();
  }).then(function() {
    console.log('Succeeded in finishing work!! Good bye!! ＼(^o^)／');
    teamSpiritClient.dispose();
  }).catch(function(error) {
    printError(error);
    teamSpiritClient.dispose();
  });
};

module.exports = {
  printWorkStatus: printWorkStatus,
  startWork      : startWork,
  finishWork     : finishWork
};
