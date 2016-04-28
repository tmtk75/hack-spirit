'use strict';
let TeamSpirit = require('./team-spirit');
let Credential = require('./credential');
let co         = require('co');
let WorkStatus = TeamSpirit.WorkStatus;
let moment     = require('moment');
let Prompt     = require('./prompt');
let Project    = require('./project');
require("moment-duration-format");

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
    let self = this;
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
    let self = this;
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
      let workStatus = yield self.teamSpiritClient.fetchWorkStatus();
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
    let self = this;
    co(function *() {
      if (!userName || !password) {
        let credential = yield new Credential().get();
        if (!userName) userName = credential.userName;
        if (!password) password = credential.password;
      }

      let cookies    = yield self.teamSpiritClient.login(userName, password);
      let workStatus = yield self.teamSpiritClient.fetchWorkStatus();
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
    let self = this;
    co(function *() {
      let auth = yield new Credential().get();
      if (!userName) userName = auth.userName;
      if (!password) password = auth.password;

      let cookies    = yield self.teamSpiritClient.login(userName, password);
      let workStatus = yield self.teamSpiritClient.fetchWorkStatus();
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
    let self = this;
    let ts = self.teamSpiritClient;
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

  recordWorkTime(userName, password, date) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      let cookies            = yield ts.login(userName, password);
      let projectObjects     = yield ts.getProjects(date);
      let totalDuration      = yield ts.getTotalWorkDuration();

      self.print(`Total time is ${totalDuration.format("h:mm")}`);
      self.print('Current your projects:');
      projectObjects.forEach((p) => {
        self.print(`${p.name}: ${p.duration}`);
      });
      let projects = yield self.inputWorkTimeOfProjects(totalDuration,
                                                        projectObjects);

      yield ts.applyWorkTimeOfProjects(projects.map((p) => {
        return p.toJSON();
      }));

      self.print('Succeeded in recording your worktimes!!!');

      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  }

  recordBreakTime(userName, password, date, period) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);
      if (period == null) {
        self.print('Please input a period of a break time:');
        let prompt = new Prompt();
        period = yield prompt.scanPeriod();
      }
      let endDate = moment(date).add(period).toDate();
      let start   = date.toFormat('HH24:MI');
      let end     = endDate.toFormat('HH24:MI');
      self.print('Recording break time: ' + `${start} - ${end}`);
      yield self.teamSpiritClient.recordBreakTime(date, endDate);
      self.print('Succeeded in recording break time: ' + `${start} - ${end}`);
      self.teamSpiritClient.dispose();
      return Promise.resolve();
    }).catch(self.onerror);
  }

  * inputWorkTimeOfProjects(totalDuration, projectObjects) {
    let prompt = new Prompt();
    while (true) {
      let projects = yield prompt.scanWorkTimeOfProjects(totalDuration,
                                                         projectObjects);
      if (!Project.calculateProjects(projects, totalDuration)) {
        this.print('Project total worktimes exceeds your worktimes!');
        continue;
      }
      this.print('----------------');
      projects.forEach((p) => {
        this.print(`${p.name} ${p.toDurationString()}`);
      });
      this.print('----------------');
      let ok = yield prompt.confirm();
      if (ok) {
        return projects;
      }
    }
  }

  dispose() {
    this.teamSpiritClient.dispose();
  }
}

module.exports = HackSpirit;
