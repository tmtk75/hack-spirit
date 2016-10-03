/* eslint no-console: "off" */
'use strict';
let TeamSpirit = require('./team-spirit');
let Credential = require('./credential');
let co         = require('co');
let WorkStatus = TeamSpirit.WorkStatus;
let moment     = require('moment');
let Prompt     = require('./prompt');
let Project    = require('./project');
let _          = require('lodash');
let HackSpiritError = require('./error');
require("moment-duration-format");

const supportUrl = 'https://github.com/aHirokiKumamoto/hack-spirit/issues/new';
const ExitStatus = {
  Success: 0,
  Failure: 1,
};

class HackSpirit {
  constructor(showBrowser, showLog) {
    this.teamSpiritClient = new TeamSpirit(showBrowser);
    this.showLog          = showLog;
    this.onSuccess        = this.onSuccess.bind(this);
    this.onError          = this.onError.bind(this);
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
      let credential = new Credential();
      yield credential.set(userName, password);
      self.print('Succeeded in saving your credentials!');
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
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
      if (workStatus !== WorkStatus.Working) {
        return Promise.resolve(ExitStatus.Failure);
      } else {
        return Promise.resolve(ExitStatus.Success);
      }
    }).then(self.onSuccess, self.onError);
  }

  onSuccess(exitStatus) {
    this.teamSpiritClient.dispose();
    process.exit(exitStatus);
  }

  onError(error) {
    if (error.message === 'canceled') {
      // do nothing
    } else if (error instanceof HackSpiritError) {
      this.print(error.message);
      if (error.stack) {
        this.print(error.stack);
      }
    } else {
      var fileName = `hack-spirit_${moment().format("YYYYMMDDHHmm")}.png`;
      this.teamSpiritClient.screenshot('./' + fileName);
      this.print(`Sorry, something went wrong. m(-_-)m: ${error}` +
                 `\nSorry for bother you, if you don't mind, ` +
                 `please report error with the capture : ${fileName}` +
                 '\nsupport site: ' + supportUrl);
      if (error.stack) {
        this.print(error.stack);
      }
    }
    this.teamSpiritClient.dispose();
    process.exit(ExitStatus.Failure);
  }

  startWork(userName, password) {
    let self = this;
    co(function *() {
      if (!userName || !password) {
        let credential = yield new Credential().get();
        if (!userName) userName = credential.userName;
        if (!password) password = credential.password;
      }

      yield self.teamSpiritClient.login(userName, password);
      let workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== WorkStatus.BeforeWorking) {
        self.print(`you are already working. (status=${workStatus})`);
        return Promise.resolve(ExitStatus.Failure);
      }
      yield self.teamSpiritClient.startWork();
      self.print("Succeeded in starting work!! Let's working!! (9｀･ω･)9");
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  finishWork(userName, password) {
    let self = this;
    co(function *() {
      let auth = yield new Credential().get();
      if (!userName) userName = auth.userName;
      if (!password) password = auth.password;

      yield self.teamSpiritClient.login(userName, password);
      let workStatus = yield self.teamSpiritClient.fetchWorkStatus();
      if (workStatus !== WorkStatus.Working) {
        self.print(`you are not working. (status=${workStatus})`);
        return Promise.resolve(ExitStatus.Failure);
      }
      yield self.teamSpiritClient.finishWork();
      self.print('Succeeded in finishing work!! Good bye!! ＼(^o^)／');
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  reportOvertimeWork(userName, password, date, note) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);
      yield ts.reportOvertimeWork(date, note);
      let d = moment(date).format("YYYYMMDDHHmm");
      self.print(`Succeeded in reporing the overtime work: ${d} : ${note}`);
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  reportDelayedArrival(userName, password, date, note, isPersonal) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);
      yield ts.reportDelayedArrival(date, note, isPersonal);
      let d = moment(date).format("YYYYMMDDHHmm");
      self.print(`Succeeded in reporting delayed arrival: ${d} : ${note}.` +
                 `The reason is ${isPersonal ? '' : 'not'} personal'`);
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }


  recordWorkTime(userName, password, date, worktimes) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);
      yield ts.openWorktimeDialog(date);
      let projectObjects     = yield ts.getProjects();
      yield ts.closeWorktimeDialog();
      let totalDuration      = yield ts.getTotalWorkDuration();

      self.print(`Total time is ${totalDuration.format("h:mm")}`);
      self.print('Current your projects:');
      projectObjects.forEach((p) => {
        self.print(`${p.name}: ${p.duration}`);
      });
      let projects;
      if (worktimes) {
        projects = projectObjects.map((p) => {
          self.print(`Set ${p.name} to ${worktimes[p.name]}`);
          let durationStr = worktimes[p.name] ? worktimes[p.name] : '0';
          return new Project({
            name:          p.name,
            durationStr:   durationStr,
            totalDuration: totalDuration
          });
        });
      } else {
        projects = yield self.inputWorkTimeOfProjects(totalDuration,
                                                      projectObjects);
      }

      yield ts.applyWorkTimeOfProjects(projects.map((p) => {
        return p.toJSON();
      }));

      self.print('Succeeded in recording your worktimes!!!');

      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  recordBreakTime(userName, password, date, period, reverse) {
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
      let startDate = reverse ? moment(date).subtract(period).toDate() : date;
      let endDate   = reverse ? date : moment(date).add(period).toDate();
      let start     = startDate.toFormat('HH24:MI');
      let end       = endDate.toFormat('HH24:MI');
      self.print('Recording break time: ' + `${start} - ${end}`);
      yield self.teamSpiritClient.recordBreakTime(startDate, endDate);
      self.print('Succeeded in recording break time: ' + `${start} - ${end}`);
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  recordBreakedTime(userName, password, date, period) {
    this.recordBreakTime(userName, password, date, period, true);
  }

  breakTimes(userName, password, date) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);
      let breakTimes = yield self.teamSpiritClient.breakTimes(date);
      self.print('Do you remove a break time?');
      self.print('0: Nothing');
      breakTimes.forEach((bt, i) => {
        self.print(`${i + 1}: ${bt.start} - ${bt.end}`);
      });
      let prompt = new Prompt();
      let number = yield prompt.scanNumber(0, breakTimes.length);
      if (number >= 1 && number <= breakTimes.length) {
        let bt = breakTimes[number - 1];
        yield ts.removeBreakTime(bt.index);
        self.print('Succeeded in removing a break time: ' +
                   `${number}: ${bt.start} - ${bt.end}`);
      }
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  weeklyReport(userName, password, date) {
    let to   = moment(date);
    let from = to.clone().subtract(7, 'days');
    this.generateReport(userName, password, from, to);
  }

  monthlyReport(userName, password, date) {
    let to   = moment(date);
    let from = to.clone().date(1);
    this.generateReport(userName, password, from, to);
  }

  timeReport(userName, password, fromDate, toDate) {
    let from = moment(fromDate);
    let to   = moment(toDate);
    this.generateReport(userName, password, from, to);
  }

  generateReport(userName, password, from, to) {
    let self = this;
    let ts = self.teamSpiritClient;
    co(function *() {
      if (!userName || !password) {
        let auth = yield new Credential().get();
        if (!userName) userName = auth.userName;
        if (!password) password = auth.password;
      }

      yield ts.login(userName, password);

      const totalDuration = moment.duration(0);
      const projectDurations = {};
      for (let m = from; m.isBefore(to, 'days'); m = m.clone().add(1, 'days')) {
        try {
          yield ts.openWorktimeDialog(m.toDate());
          let projectObjects = yield ts.getProjects();
          yield ts.closeWorktimeDialog();
          let duration      = yield ts.getTotalWorkDuration();
          totalDuration.add(duration);
          projectObjects.forEach((p) => {
            if (projectDurations[p.name] === undefined) {
              projectDurations[p.name] = moment.duration(0);
            }
            projectDurations[p.name].add(moment.duration(p.duration));
          });
        } catch (err) {
          // it seems to be holiday
        }
      }
      const options = { trim: false };
      self.print('Worktime report ' +
                 ` ${from.format('YYYYMMDD')} ~ ${to.format('YYYYMMDD')}:`);
      self.print('total:' + totalDuration.format('h:mm', options));
      _.keys(projectDurations).forEach((k) => {
        self.print(`${k} ${projectDurations[k].format('h:mm', options)}`);
      });
      return Promise.resolve(ExitStatus.Success);
    }).then(self.onSuccess, self.onError);
  }

  * inputWorkTimeOfProjects(totalDuration, projectObjects) {
    let prompt = new Prompt();
    for (;;) {
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
