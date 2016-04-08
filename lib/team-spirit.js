'use strict';

require('date-utils');
let Nightmare = require('nightmare');

let loginUrl    = 'https://ap.salesforce.com/';
let statusUrl   = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkComponent';
let workTimeUrl = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkTimeView';

const WaitTimeout         = 5000;
const WaitTimeoutForLogin = 8000;

const WorkStatus = {
  BeforeWorking : 'before_working',
  Working       : 'working',
  AfterWorking  : 'after_working',
  Unknown       : 'unknown',

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


class TeamSpirit {
  constructor(show) {
    this.nightmare = Nightmare({ show: show, waitTimeout: WaitTimeout });
  }
  * login(userName, password) {
    var timer;
    yield this.nightmare.goto(loginUrl)
      .wait(0)
      .on('timeout', console.log)
      .insert('#username', false)
      .insert('#password', false)
      .insert('#username', userName)
      .insert('#password', password)
      .uncheck('#rememberUn')
      .then(() => {
        'use strict';
        let click = this.nightmare.click('#Login').wait('#contentWrapper');
        let wait  = new Promise(function(resolve, reject) {
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
      }).then(function(buttonStatus) {
        return WorkStatus.fromButtonStatus(buttonStatus);
      }, function(e) {
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
            return Promise.resolve(month !== date.toFormat('YYYYMM'));
          });
  }

  gotoWorkTimePageAt(date) {
    return this.nightmare.goto(workTimeUrl)
      .evaluate((month) => {
        var monthSelect = document.getElementById('yearMonthList');
        monthSelect.value = month;
        var changeEvent = new Event('change');
        monthSelect.dispatchEvent(changeEvent);
      }, date.toFormat('YYYYMM')).wait(() => {
        return document.getElementById('shim').style.display === 'none';
      });
  }

  * askForOvertime(date, note) {
    let dateString             = date.toFormat('YYYY-MM-DD');
    let startApplicationButton = '#ttvApply' + dateString;
    let zangyoButton           = '#applyNew_zangyo';
    let endTimeInput           = '.inputimeA';
    let noteTextarea           = '.noteArea';
    var index = 0;
    let applyButton            = `#empApplyDone${index}`;
    yield this.needChangeMonth(date).then((needChangeMonth) => {
      if (needChangeMonth) {
        return this.gotoWorkTimePageAt(date);
      }
      return Promise.resolve();
    }).then(() => {
      return this.nightmare
        .wait(startApplicationButton)
        .click(startApplicationButton)
        .wait(zangyoButton)
        .click(zangyoButton)
        .evaluate(() => {
          'use strict';
          let inputs = document.getElementsByClassName('inputime');
          for (let i = 0; i < inputs.length; i++) {
            if (inputs[i].id.indexOf('dialogApplyEndTime') !== -1) {
              return i;
            }
          }
          return 0;
        })
        .then((i) => {
          if (i === 0) {
            let message = 'Cannot apply the day. ' +
                  'The day may be a holiday';
            return Promise.reject(new Error(message));
          }
          let dstr = date.toFormat('HH24:MI');
          return this.nightmare
            .insert(`#dialogApplyEndTime${i}`, '')
            .insert(`#dialogApplyNote${i}`   , '')
            .insert(`#dialogApplyEndTime${i}`, dstr)
            .insert(`#dialogApplyNote${i}`   , note)
            .wait(`#empApplyDone${i}`)
            .evaluate((i) => {
              'use strict';
              let elem = document.getElementById(`empApplyDone${i}`);
              return elem.style.display;
            }, i)
            .then((display) => {
              if (display === 'none') {
                let message = 'The day seems to be already applied.';
                return Promise.reject(new Error(message));
              }
              return this.nightmare.click(`#empApplyDone${i}`);
            });
        });
    });
  }

  dispose() {
    this.nightmare.end().then();
  }
}

TeamSpirit.WorkStatus = WorkStatus;
module.exports        = TeamSpirit;
