'use strict';

let Nightmare = require('nightmare');

let loginUrl  = 'https://ap.salesforce.com/';
let statusUrl = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkComponent?autoMapValues=1&inline=1&core.apexpages.framework.ApexViewServlet.getInlinedContentRequest=1&sfdcIFrameOrigin=https://ap.salesforce.com/home/home.jsp&sdfcIFrameOrigin=https://ap.salesforce.com/home/home.jsp';

const WaitTimeout         = 10000;
const WaitTimeoutForLogin = 12000;

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
        return $('#busyWaitMessage').length > 0;
      })
      .wait(() => {
        return !$('#busyWaitMessage').is(':visible');
      });
  }

  * finishWork() {
    yield this.nightmare.click('#btnEtInput')
      .wait(() => {
        return document.getElementById('busyWaitMessage') !== null;
      })
      .wait(() => {
        'use strict';
        let elem      = document.getElementById('busyWaitMessage');
        let isVisible = !(elem.offsetWidth ||
                          elem.offsetHeight ||
                          elem.getClientRects().length);
        return isVisible;
      });
  }

  dispose() {
    this.nightmare.end().then();
  }
}

TeamSpirit.WorkStatus = WorkStatus;
module.exports        = TeamSpirit;
