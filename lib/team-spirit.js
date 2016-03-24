'use strict';

let Nightmare = require('nightmare');

let loginUrl  = 'https://ap.salesforce.com/';
let statusUrl = 'https://teamspirit.ap0.visual.force.com/apex/AtkWorkComponent?autoMapValues=1&inline=1&core.apexpages.framework.ApexViewServlet.getInlinedContentRequest=1&sfdcIFrameOrigin=https://ap.salesforce.com/home/home.jsp&sdfcIFrameOrigin=https://ap.salesforce.com/home/home.jsp';

const WorkStatus = {
  Working    : 'working',
  NotWorking : 'not_working',
  Unknown    : 'unknown'
};

class TeamSpirit {
  constructor(show) {
    this.nightmare = Nightmare({ show: show, waitTimeout: 5000 });
  }
  login(userName, password) {
    return this.nightmare.goto(loginUrl)
                         .wait(0)
                         .insert('#username', userName)
                         .insert('#password', password)
                         .click('#Login')
                         .wait('#contentWrapper')
                         .cookies.get();
  }

  fetchWorkStatus() {
    return this.nightmare.goto(statusUrl)
      .wait(() => {
        'use strict';
        let canGoOffice = $('.pw_btnnst_dis').length === 0;
        let canGoHome   = $('.pw_btnnet_dis').length === 0;
        return canGoOffice || canGoHome;
      })
      .evaluate(() => {
        'use strict';
        let canGoOffice = $('.pw_btnnst_dis').length === 0;
        let canGoHome   = $('.pw_btnnet_dis').length === 0;
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
  }

  dispose() {
    this.nightmare.end().then();
  }
}

module.exports = TeamSpirit;
