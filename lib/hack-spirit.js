'use strict';
//import TeamSpirit from './team-spirit';
var TeamSpirit = require('./team-spirit');
var co         = require('co');

class HackSpirit {
  constructor(showBrowser, showLog) {
    this.teamSpiritClient = new TeamSpirit(showBrowser);
    this.showLog          = showLog;
  }
  log(message) {
    if (this.showLog) {
      console.log(`[hack-spirit] ${message}`);
    }
  }
  printWorkStatus(userName, password) {
    var self = this;
    co(function *() {
      var cookies    = yield self.teamSpiritClient.login(userName, password);
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      console.log(workStatus);
      self.teamSpiritClient.dispose();
    }).catch(self.onerror);
  };

  onerror(error) {
    this.teamSpiritClient.dispose();
    console.log(`Sorry, somthing went wrong. m(-_-)m: ${error}`);
  }

  startWork(userName, password) {
    var self = this;
    co(function *() {
      var cookies    = yield self.teamSpiritClient.login(userName, password);
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== 'not_working') {
        return Promise.reject(`you are already working. (status=${workStatus})`);
      }
      yield self.teamSpiritClient.startWork();
      console.log("Succeeded in starting work!! Let's working!! (9｀･ω･)9");
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  }

  finishWork(userName, password) {
    var self = this;
    co(function *() {
      var cookies    = yield self.teamSpiritClient.login(userName, password);
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== 'working') {
        return Promise.reject(`you are not working. (status=${workStatus})`);
      }
      yield this.teamSpiritClient.finishWork();
      console.log('Succeeded in finishing work!! Good bye!! ＼(^o^)／');
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  };
}

module.exports = HackSpirit;
