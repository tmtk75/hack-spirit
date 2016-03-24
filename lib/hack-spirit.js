'use strict';
//import TeamSpirit from './team-spirit';
var TeamSpirit = require('./team-spirit');
var co         = require('co');

let teamSpiritClient = new TeamSpirit(false);

function printWorkStatus(userName, password) {
  co(function *() {
    var cookies    = yield teamSpiritClient.login(userName, password);
    var workStatus = yield teamSpiritClient.fetchWorkStatus();
    console.log(workStatus);
    teamSpiritClient.dispose();
  }).catch(onerror);
};

function onerror(error) {
  teamSpiritClient.dispose();
  console.log(`Sorry, somthing went wrong. m(-_-)m: ${error}`);
}

function startWork(userName, password) {
  co(function *() {
    var cookies    = yield teamSpiritClient.login(userName, password);
    var workStatus = yield teamSpiritClient.fetchWorkStatus();
    if (workStatus !== 'not_working') {
      return Promise.reject(`you are already working. (status=${workStatus})`);
    }
    yield teamSpiritClient.startWork();
    console.log("Succeeded in starting work!! Let's working!! (9｀･ω･)9");
    teamSpiritClient.dispose();
    return Promise.resolve();
  }).catch(onerror);
};

function finishWork(userName, password) {
  co(function *() {
    var cookies    = yield teamSpiritClient.login(userName, password);
    var workStatus = yield teamSpiritClient.fetchWorkStatus();
    if (workStatus !== 'working') {
      return Promise.reject(`you are not working. (status=${workStatus})`);
    }
    yield teamSpiritClient.finishWork();
    console.log('Succeeded in finishing work!! Good bye!! ＼(^o^)／');
    teamSpiritClient.dispose();
    return Promise.resolve();
  }).catch(onerror);
};

module.exports = {
  printWorkStatus: printWorkStatus,
  startWork      : startWork,
  finishWork     : finishWork
};
