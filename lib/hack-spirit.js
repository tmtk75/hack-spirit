'use strict';
let TeamSpirit = require('./team-spirit');
let co         = require('co');
let WorkStatus = TeamSpirit.WorkStatus;

class HackSpirit {
  constructor(showBrowser, showLog) {
    this.teamSpiritClient = new TeamSpirit(showBrowser);
    this.showLog          = showLog;
    this.onerror          = this.onerror.bind(this);
  }
  log(message) {
    if (this.showLog) {
      console.log(`[hack-spirit] ${message}`);
    }
  }
  print(message) {
    console.log(message);
  }
  printWorkStatus(userName, password) {
    var self = this;
    co(function *() {
      self.log('logging in... ');
      yield self.teamSpiritClient.login(userName, password);
      self.log('complete logging in... ');
      self.log('fetching work status');
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      self.log('complete fetching work status');
      self.print(workStatus);
      self.teamSpiritClient.dispose();
    }).catch(self.onerror);
  };

  onerror(error) {
    this.teamSpiritClient.dispose();
    this.print(`Sorry, somthing went wrong. m(-_-)m: ${error}`);
  }

  startWork(userName, password) {
    var self = this;
    co(function *() {
      var cookies    = yield self.teamSpiritClient.login(userName, password);
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== WorkStatus.BeforeWorking) {
        return Promise.reject(`you are already working. (status=${workStatus})`);
      }
      yield self.teamSpiritClient.startWork();
      self.print("Succeeded in starting work!! Let's working!! (9｀･ω･)9");
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  }

  finishWork(userName, password) {
    var self = this;
    co(function *() {
      var cookies    = yield self.teamSpiritClient.login(userName, password);
      var workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== WorkStatus.Working) {
        return Promise.reject(`you are not working. (status=${workStatus})`);
      }
      yield self.teamSpiritClient.finishWork();
      self.print('Succeeded in finishing work!! Good bye!! ＼(^o^)／');
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  };
}

module.exports = HackSpirit;
