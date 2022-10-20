// ==UserScript==
// @name         BambooHR Timesheet Fill Day
// @namespace    day.timesheet.bamboohr.sconde.net
// @version      0.9
// @description  Fill BambooHR Timesheet day with templates
// @author       Sergio Conde
// @match        https://*.bamboohr.com/employees/timesheet/?id=*
// @grant        GM.getValue
// @grant        GM.setValue
// @homepageURL  https://github.com/deftdot/bamboohr-timesheet-greasemonkey/
// @supportURL   https://github.com/deftdot/bamboohr-timesheet-greasemonkey/issues
// @updateURL    https://raw.githubusercontent.com/deftdot/bamboohr-timesheet-greasemonkey/master/bamboohr-timesheet.user.js
// @downloadURL  https://raw.githubusercontent.com/deftdot/bamboohr-timesheet-greasemonkey/master/bamboohr-timesheet.user.js
// ==/UserScript==

'use strict';

/*
   Don't touch this, won't persist across updates.

   Load BambooHR for the first time with the script and then open this script Storage preferences and edit there.
 */
const DEFAULT_TEMPLATES = {
  'Full-Day': [{ start: '8:00', end: '17:30' }],
  'Half-Day': [{ start: '8:00', end: '13:00' }]
};

(async function() {
  let TEMPLATES = await GM.getValue('TEMPLATES');

  if (!TEMPLATES) {
    TEMPLATES = DEFAULT_TEMPLATES;
    GM.setValue('TEMPLATES', TEMPLATES);
  }

  for (const template of Object.keys(TEMPLATES).reverse()) {
    let span = document.createElement('span');
    document.querySelector('.TimesheetSummary').prepend(span);

    let container_fill = document.createElement('div');
    container_fill.classList.value = CONTAINER_CLASSLIST;

    let btn_fill = document.createElement('button');
    container_fill.append(btn_fill);

    btn_fill.type = 'button';
    btn_fill.classList.value = 'fab-Button fab-Button--small fab-Button--width100';     
    // btn_fill.classList.value = 'btn btnLarge btnAction TimesheetSummary__clockButton';
    btn_fill.innerText = `Fill Day: ${template}`;

    btn_fill.onclick = function () {
      let now = new Date();
      // Do JS have propper date formatting? :facepalm:
      let date = prompt("Please enter the date", `${now.getFullYear()}-${('0' + (now.getMonth() + 1)).slice(-2)}-${('0' + now.getDate()).slice(-2)}`);

      if (!date) {
        alert("Canceled!");
        return false;
      }

      let entries = [];
      for (const [idx, slot] of TEMPLATES[this.dataset.template].entries()) {
        entries.push({
          id: null,
          trackingId: idx + 1,
          employeeId: SESSION_USER.employeeId,
          date: date,
          start: slot.start,
          end: slot.end,
          note: ''
        });
      }

      fetch(
        `${window.location.origin}/timesheet/clock/entries`,
        {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          referrer: 'client',
          headers: {
            'content-type': 'application/json; charset=UTF-8',
            'x-csrf-token': CSRF_TOKEN
          },
          body: JSON.stringify({ entries: entries })
        }
      ).then(data => {
        if (data.status == 200) {
          alert('Done!');
        } else {
          data.text().then(t => alert(`Request error!\nHTTP Code: ${data.status}\nResponse:\n${t}`));
        }
      }).catch(err => alert(`Fetch error!\n\n${err}`));

      return false;
    };
  }
})();
