'use strict';

let Nightmare = require('nightmare');

let loginUrl  = 'https://ap.salesforce.com/';
let statusUrl = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkComponent?autoMapValues=1&inline=1&core.apexpages.framework.ApexViewServlet.getInlinedContentRequest=1&sfdcIFrameOrigin=https://ap.salesforce.com/home/home.jsp&sdfcIFrameOrigin=https://ap.salesforce.com/home/home.jsp';

const WaitTimeout = 3000;
const WaitTimeoutForLogin = 5000;

const WorkStatus = {
  Working    : 'working',
  NotWorking : 'not_working',
  Unknown    : 'unknown'
};


class TeamSpirit {
  constructor(show) {
    this.nightmare = Nightmare({ show: show, waitTimeout: WaitTimeout });
  }
  * login(userName, password) {
    yield this.nightmare.goto(loginUrl)
      .wait(0)
      .on('timeout', console.log)
      .insert('#username', false)
      .insert('#password', false)
      .insert('#username', userName)
      .insert('#password', password)
      .uncheck('#rememberUn')
      .then(() => {
        var click = this.nightmare.click('#Login').wait('#contentWrapper');
        var wait  = new Promise(function(resolve, reject) {
          setTimeout(() => { reject('Failed to login'); }, WaitTimeoutForLogin);
        });
        return Promise.race([click, wait]);
      });
  }

  * fetchWorkStatus() {
    var status = yield this.nightmare.goto(statusUrl)
      .wait(() => {
        'use strict';
        let d           = document;
        let canGoOffice = d.getElementsByClassName('pw_btnnst_dis').length === 0;
        let canGoHome   = d.getElementsByClassName('pw_btnnet_dis').length === 0;
        return canGoOffice || canGoHome;
      })
      .evaluate(() => {
        'use strict';
        let d           = document;
        let canGoOffice = d.getElementsByClassName('pw_btnnst_dis').length === 0;
        let canGoHome   = d.getElementsByClassName('pw_btnnet_dis').length === 0;
        if (canGoOffice) {
          return 'not working';
        } else if (canGoHome) {
          return 'working';
        }
        return 'unknown';
      }).then(function(status) {
        return status;
      }, function(e) {
        return 'unknown';
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

module.exports = TeamSpirit;
