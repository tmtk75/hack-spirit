'use strict';

require('date-utils');
let moment          = require('moment');
let Nightmare       = require('nightmare');
let HackSpiritError = require('./error');

let loginUrl    = 'https://ap.salesforce.com/';
let statusUrl   = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkComponent';
let workTimeUrl = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkTimeView';

const yearMonthFormat = 'YYYYMM01';

const WaitTimeout         = 5000;
const WaitTimeoutForLogin = 8000;

const WorkStatus = {
  BeforeWorking: 'before_working',
  Working:       'working',
  AfterWorking:  'after_working',
  Unknown:       'unknown',

  fromButtonStatus: (buttonStatus) => {
    if (buttonStatus.canGoHome && buttonStatus.canGoOffice) {
      return WorkStatus.BeforeWorking;
    } else if (buttonStatus.canGoHome && !buttonStatus.canGoOffice) {
      return WorkStatus.Working;
    } else if (!buttonStatus.canGoHome && !buttonStatus.canGoOffice) {
      return WorkStatus.AfterWorking;
    }
    return WorkStatus.Unknown;
  }
};

Nightmare.prototype.waitForProgressHidden = function() {
  let progressDialog = 'dijit_Dialog_0';
  return this.wait(`#${progressDialog}`)
    .wait((id) => {
      'use strict';
      let progress = document.getElementById(id);
      return progress.style.display === 'none';
    }, progressDialog);
};

const AttendanceApplicationType = {
  Overtime: 'zangyo',
  Delayed:  'lateStart',

  timeInputId: (type) => {
    switch (type) {
    case AttendanceApplicationType.Overtime:
      return 'dialogApplyEndTime';
    case AttendanceApplicationType.BeginDelayed:
      return 'dialogApplyTime';
    default:
      return 'dialogApplyTime';
    }
  },
  noteInputId: () => {
    return 'dialogApplyNote';
  },
  personalReasonCheckBoxId: () => {
    return 'dialogApplyLateEscape';
  }
};


class TeamSpirit {
  constructor(show) {
    this.nightmare = Nightmare({ show: show, waitTimeout: WaitTimeout });
  }
  screenshot(path) {
    return this.nightmare.screenshot(path);
  }
  * login(userName, password) {
    var timer;
    yield this.nightmare.goto(loginUrl)
      .wait(0)
      .insert('#username', false)
      .insert('#password', false)
      .insert('#username', userName)
      .insert('#password', password)
      .uncheck('#rememberUn')
      .then(() => {
        'use strict';
        let click = this.nightmare.click('#Login').wait('#contentWrapper');
        let wait  = new Promise((resolve, reject) => {
          timer = setTimeout(() => { reject('Failed to login'); }, WaitTimeoutForLogin);
        });
        return Promise.race([click, wait]);
      }).then(() => {
        clearTimeout(timer);
      });
  }

  * fetchWorkStatus() {
    let status = yield this.nightmare.goto(statusUrl)
      .wait(() => {
        'use strict';
        let d                 = document;
        let jumpMonthlyButton = d.getElementsByClassName('pw_base pw_jumpmo');
        return jumpMonthlyButton.length > 0;
      })
      .evaluate(() => {
        'use strict';
        let d           = document;
        let canGoOffice = d.getElementsByClassName('pw_btnnst_dis').length === 0;
        let canGoHome   = d.getElementsByClassName('pw_btnnet_dis').length === 0;
        return { canGoOffice: canGoOffice, canGoHome: canGoHome};
      }).then((buttonStatus) => {
        return WorkStatus.fromButtonStatus(buttonStatus);
      }, () => {
        return WorkStatus.Unknown;
      });
    return status;
  }

  * startWork() {
    yield this.nightmare.click('#btnStInput')
      .wait(() => {
        return document.getElementById('busyWaitMessage') !== null;
      })
      .wait(() => {
        'use strict';
        let elem              = document.getElementById('busyWaitMessage');
        let isProgressVisible = elem.offsetWidth  ||
                                elem.offsetHeight ||
                                elem.getClientRects().length;
        return !isProgressVisible;
      });
  }

  * finishWork() {
    yield this.nightmare.click('#btnEtInput')
      .wait(() => {
        return document.getElementById('busyWaitMessage') !== null;
      })
      .wait(() => {
        'use strict';
        let elem              = document.getElementById('busyWaitMessage');
        let isProgressVisible = elem.offsetWidth  ||
                                elem.offsetHeight ||
                                elem.getClientRects().length;
        return !isProgressVisible;
      });
  }

  needChangeMonth(date) {
    return this.nightmare
          .goto(workTimeUrl)
          .wait(() => {
            'use strict';
            let select = document.getElementById('yearMonthList');
            return select !== null && select.value !== 'none';
          })
          .evaluate(() => {
            return document.getElementById('yearMonthList').value;
          }).then((month) => {
            return Promise.resolve(month !== date.toFormat(yearMonthFormat));
          });
  }

  gotoWorkTimePageAt(date) {
    return this.nightmare.goto(workTimeUrl)
      .evaluate((month) => {
        var monthSelect = document.getElementById('yearMonthList');
        monthSelect.value = month;
        var changeEvent = new Event('change');
        monthSelect.dispatchEvent(changeEvent);
      }, date.toFormat(yearMonthFormat)).wait(() => {
        return document.getElementById('shim').style.display === 'none';
      });
  }

  * reportOvertimeWork(date, note) {
    yield this.report(AttendanceApplicationType.Overtime, date, note);
  }

  * reportDelayedArrival(date, note, isPersonalReason) {
    yield this.report(AttendanceApplicationType.Delayed,
                      date, note, isPersonalReason);
  }

  * report(type, date, note, isPersonalReason) {
    let dateString             = date.toFormat('YYYY-MM-DD');
    let applicationMenuTab     = '#empApplyTab_tablist_empApplyContent0';
    let startApplicationButton = '#ttvApply' + dateString;
    let newButton              = `#applyNew_${type}`;
    yield this.needChangeMonth(date).then((needChangeMonth) => {
      if (needChangeMonth) {
        return this.gotoWorkTimePageAt(date);
      }
      return Promise.resolve();
    }).then(() => {
      return this.nightmare
        .wait(startApplicationButton)
        .click(startApplicationButton)
        .wait(applicationMenuTab)
        .click(applicationMenuTab)
        .wait(newButton)
        .click(newButton)
        .evaluate((timeInputId) => {
          'use strict';
          for (let index = 10; index > 0; index--) {
            if (document.getElementById(timeInputId + index)) {
              return index;
            }
          }
          return 0;
        }, AttendanceApplicationType.timeInputId(type));
    }).then((i) => {
      if (i === 0) {
        let message = 'Cannot apply the day. ' +
              'The day may be a holiday';
        return Promise.reject(new HackSpiritError(message));
      }
      this.nightmare
            .insert(`#${AttendanceApplicationType.noteInputId()}${i}`, '')
            .insert(`#${AttendanceApplicationType.noteInputId()}${i}`, note);
      switch (type) {
      case AttendanceApplicationType.Overtime: {
        let dstr = date.toFormat('HH24:MI');
        this.nightmare
          .insert(`#${AttendanceApplicationType.timeInputId(type)}${i}`, '')
          .insert(`#${AttendanceApplicationType.timeInputId(type)}${i}`, dstr);
        break;
      }
      case AttendanceApplicationType.Delayed:
        if (!isPersonalReason) {
          let checkBoxId = AttendanceApplicationType.personalReasonCheckBoxId();
          this.nightmare.click(`#${checkBoxId}${i}`);
        }
        break;
      }
      return this.nightmare.wait(`#empApplyDone${i}`)
        .evaluate((i) => {
          'use strict';
          let elem = document.getElementById(`empApplyDone${i}`);
          return { display: elem.style.display, index: i};
        }, i);
    }).then((result) => {
      if (result.display === 'none') {
        let message = 'The day seems to be already applied.';
        return Promise.reject(new HackSpiritError(message));
      }
      return this.nightmare.waitForProgressHidden();
    });
  }

  * openWorktimeDialog(date) {
    let dateString = date.toFormat('YYYY-MM-DD');
    let buttonId   = 'dailyWorkCell' + dateString;
    yield this.needChangeMonth(date).then((needChangeMonth) => {
      if (needChangeMonth) {
        return this.gotoWorkTimePageAt(date);
      }
      return Promise.resolve();
    }).then(() => {
      return this.nightmare
        .evaluate((buttonId) => {
          return document.getElementById(buttonId).childNodes.length > 0;
        }, buttonId);
    }).then((canApply) => {
      if (!canApply) {
        let message = 'Cannot apply the day. ' +
              'The day may be a holiday';
        return Promise.reject(new HackSpiritError(message));
      }
      return this.nightmare.click(`#${buttonId}`);
    });
  }
  * getProjects() {
    let headerId = 'jobWorks_jobName_head';
    let projects = yield this.nightmare
      .wait(`#${headerId}`)
      .evaluate((headerId) => {
          'use strict';
        let cells = document.getElementsByClassName('name');
        let projects = [];
        for (let i = 0; i < cells.length; i++) {
          if (cells[i].id !== headerId) {
            let index = i - 1;
            let input = document.getElementById(`empInputTime${index}`);
            projects.push({
              name:     cells[i].textContent,
              duration: input ? input.value : ''
            });
          }
        }
        return projects;
      }, headerId);
    return projects;
  }

  * closeWorktimeDialog() {
    yield this.nightmare.click('#empWorkCancel');
  }


  * getTotalWorkDuration() {
    let id = 'empWorkRealTime';
    let totalTime = yield this.nightmare.evaluate((id) => {
      return document.getElementById(id).textContent;
    }, id);
    var results = totalTime.match(/[1-2]?[0-9]:[0-9][0-9]/);
    return moment.duration(results[0]);
  }

  * applyWorkTimeOfProjects(projects) {
    let buttonId       = '#empWorkOk';
    yield this.nightmare
      .evaluate((projects) => {
        'use strict';
        projects.forEach((project, i) => {
          let input = document.getElementById(`empInputTime${i}`);
          input.dispatchEvent(new Event('focus'));
          input.value = project.duration;
          input.dispatchEvent(new Event('blur'));
        });
      }, projects).click(buttonId).waitForProgressHidden();
  }

  showWorkTimeOfDayDialog(date) {
    let dateString             = date.toFormat('YYYY-MM-DD');
    let startTimeTextbox       = `#ttvTimeSt${dateString}`;
    return this.needChangeMonth(date).then((needChangeMonth) => {
      if (needChangeMonth) {
        return this.gotoWorkTimePageAt(date);
      }
      return Promise.resolve();
    }).then(() => {
      return this.nightmare
        .wait(startTimeTextbox)
        .click(startTimeTextbox);
    });
  }

  * recordBreakTime(startDate, endDate) {
    let plusButton     = '.tt_rest_plus .pb_btn_plusL';
    let okButton       = '#dlgInpTimeOk';

    yield this.showWorkTimeOfDayDialog(startDate).then(() => {
      return this.nightmare
        .click(plusButton)
        .evaluate(() => {
          'use strict';
          for (let i = 0; i < 10; i++) {
            let input = document.getElementById('startRest' + i);
            if (input && input.value === '') {
              return i;
            }
          }
          return -1;
        });
    }).then((i) => {
      if (i === -1) {
        let message = 'Cannot apply the day. ' +
              'The day may be a holiday';
        return Promise.reject(new HackSpiritError(message));
      }

      return this.nightmare
        .insert(`#startRest${i}`, startDate.toFormat('HH24:MI'))
        .insert(`#endRest${i}`, endDate.toFormat('HH24:MI'))
        .wait(okButton)
        .click(okButton)
        .evaluate(() => {
          'use strict';
          let error = document.getElementById('dlgInpTimeError');
          let message = '';
          let success = !error || !error.textContent;
          if (error && error.textContent) {
            message = error.textContent;
          }
          return {
             success: success,
             message: message
          };
        });
    }).then((result) => {
      if (!result.success) {
        let message = 'Cannot record the break time. ' +
              'The break times conflicts. ' + result.message;
        return Promise.reject(new HackSpiritError(message));
      }
      return this.nightmare.waitForProgressHidden();
    });
  }

  * breakTimes(date) {
    let breakTimes = yield this.showWorkTimeOfDayDialog(date).then(() => {
      return this.nightmare
        .evaluate(() => {
          'use strict';
          let breakTimes = [];
          for (let i = 0; i < 10; i++) {
            let startInput = document.getElementById('startRest' + i);
            let endInput = document.getElementById('endRest' + i);
            if (startInput && endInput && startInput.value && endInput.value) {
              breakTimes.push({
                index: i,
                start: startInput.value,
                end:   endInput.value
              });
            }
          }
          return breakTimes;
        });
    });
    return breakTimes;
  }

  * removeBreakTime(index) {
    let okButton = '#dlgInpTimeOk';
    yield this.nightmare
      .insert(`#startRest${index}`, '')
      .insert(`#endRest${index}`, '')
      .click(okButton);
  }

  dispose() {
    this.nightmare.end().then();
  }
}

TeamSpirit.WorkStatus = WorkStatus;
module.exports        = TeamSpirit;
