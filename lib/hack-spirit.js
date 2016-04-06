'use strict';
let TeamSpirit = require('./team-spirit');
let Credential = require('./credential');
let co         = require('co');
let WorkStatus = TeamSpirit.WorkStatus;
let moment     = require('moment');

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

  login(userName, password) {
    var self = this;
    if (!userName || !password) {
      self.print('user name or password is invalied');
      self.dispose();
      return;
    }
    co(function *() {
      self.log('logging in... ');
      yield self.teamSpiritClient.login(userName, password);
      self.log('complete logging in... ');
      self.dispose();
      let credential = new Credential();
      yield credential.set(userName, password);
      self.print('Succeeded in saving your credentials!');
    }).catch(self.onerror);
  }

  printWorkStatus(userName, password) {
    var self = this;
    co(function *() {
      if (!userName || !password) {
        let credential = yield new Credential().get();
        if (!userName) userName = credential.userName;
        if (!password) password = credential.password;
      }

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
    this.print(`Sorry, something went wrong. m(-_-)m: ${error}`);
  }

  startWork(userName, password) {
    var self = this;
    co(function *() {
      if (!userName || !password) {
        let credential = yield new Credential().get();
        if (!userName) userName = credential.userName;
        if (!password) password = credential.password;
      }

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
      let auth = yield new Credential().get();
      if (!userName) userName = auth.userName;
      if (!password) password = auth.password;

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
  }

  askForOvertime(userName, password, date, note) {
    var self = this;
    var ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      let cookies    = yield ts.login(userName, password);
      yield ts.askForOvertime(date, note);
      let d = moment(date).format("YYYYMMDDHHmm");
      self.print(`Succeeded in asking for the overtime: ${d} : ${note}`);
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  }

  dispose() {
    this.teamSpiritClient.dispose();
  }
}

module.exports = HackSpirit;
