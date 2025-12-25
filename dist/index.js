(function(){"use strict";const d="Habits",x="habit-tracker-main",m=/((?:1[0-2]|0?[1-9]):[0-5][0-9]\s*(?:[AaPp][Mm])|(?:2[0-3]|[01]?[0-9]):[0-5][0-9])/;class w{async ensureHabitsPage(){try{await logseq.Editor.getPage(d)||(await logseq.Editor.createPage(d,{},{redirect:!1}),console.log(`Created ${d} page`))}catch(t){console.error("Error ensuring Habits page:",t)}}async renderOnHabitsPage(){try{if(!await logseq.Editor.getPage(d))return;const e=await logseq.Editor.getPageBlocksTree(d);(!e||e.length===0)&&await logseq.Editor.appendBlockInPage(d,"");const o=await this.getHabitData(),a=this.generateHabitTrackerHTML(o);logseq.provideUI({key:x,slot:d,reset:!0,template:a})}catch(t){console.error("Error rendering on Habits page:",t)}}async getHabitData(t,e){const o=await logseq.Editor.getAllPages();if(!o)return new Map;const a=new Map,r=o.filter(n=>n.journalDay&&this.isDateInRange(n.journalDay,t,e));for(const n of r){const i=await logseq.Editor.getPageBlocksTree(n.name);if(!i||!n.journalDay)continue;const l=this.formatJournalDate(n.journalDay);this.extractHabitsFromBlocks(i,l,n.name,a)}return this.calculateHabitStats(a)}isDateInRange(t,e,o){const a=this.journalDayToDate(t);return!(e&&a<e||o&&a>o)}journalDayToDate(t){const e=Math.floor(t/1e4),o=Math.floor(t%1e4/100)-1,a=t%100;return new Date(e,o,a)}formatJournalDate(t){return this.journalDayToDate(t).toISOString().split("T")[0]}extractHabitsFromBlocks(t,e,o,a){for(const r of t){if(r.content){const n=r.content.match(/#habit\s+([^#\n\r]*?)(?=\s+\d{1,2}:\d{2}|$)/i);if(n){const i=n[1].trim();if(!i)continue;let l;const c=r.content.match(m);c&&(l=c[1]);const s={name:i,date:e,time:l,page:o,blockUuid:r.uuid};a.has(i)||a.set(i,[]),a.get(i).push(s)}}r.children&&r.children.length>0&&this.extractHabitsFromBlocks(r.children,e,o,a)}}calculateHabitStats(t){const e=new Map;for(const[o,a]of t){const r=a.sort((n,i)=>{const l=n.date.localeCompare(i.date);return l!==0?l:n.time&&i.time?n.time.localeCompare(i.time):0});e.set(o,{name:o,totalCount:r.length,entries:r})}return e}generateHabitTrackerHTML(t){const e=Array.from(t.values()).sort((n,i)=>i.totalCount-n.totalCount);if(e.length===0)return`
        <div style="padding: 60px 20px; text-align: center; color: #787774; max-width: 600px; margin: 0 auto;">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #37352F; font-weight: 600;">No habits tracked yet!</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #787774;">
            Start tracking habits in your daily journal by using the <code style="background: #f7f7f5; padding: 2px 6px; border-radius: 3px; font-size: 13px;">#habit</code> tag:
          </p>
          <div style="background: #fafafa; border-radius: 6px; padding: 16px; margin: 20px 0; text-align: left; font-family: monospace; font-size: 13px; border: 1px solid #e3e3e1;">
            <div style="color: #787774; margin-bottom: 4px;">- #habit Exercise</div>
            <div style="color: #787774; margin-bottom: 4px;">- #habit Meditation 7:00 AM</div>
            <div style="color: #787774;">- #habit Reading</div>
          </div>
          <p style="margin: 16px 0 0 0; font-size: 13px; color: #9B9A97;">
            The timestamp is optional. If provided, it will be shown in the tracker.
          </p>
        </div>
      `;const o=new Date,a=this.generateMonthView(e,o),r=this.generateYearView(e,o);return`
      <div class="habit-tracker-container" style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
        max-width: 1000px;
        margin: 0 auto;
        padding: 32px 24px;
        background: #fafafa;
      ">
        <div class="habit-tracker-header" style="
          margin-bottom: 32px;
          padding-bottom: 0;
        ">
          <h1 style="
            margin: 0 0 4px 0;
            font-size: 24px;
            font-weight: 600;
            color: #000000;
            display: flex;
            align-items: center;
            gap: 8px;
          ">📊 Habit Tracker</h1>
          <p style="
            margin: 0;
            color: #787774;
            font-size: 14px;
          ">Track your daily habits and build consistency</p>
        </div>

        <div class="controls-bar" style="
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin-bottom: 24px;
        ">
          <div class="habit-tracker-tabs" style="
            display: flex;
            gap: 4px;
          ">
            <button class="tab-button active" data-tab="month" style="
              padding: 6px 12px;
              background: #5B57EB;
              color: white;
              border: none;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s;
            ">Month View</button>
            <button class="tab-button" data-tab="year" style="
              padding: 6px 12px;
              background: transparent;
              color: #787774;
              border: none;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.15s;
            ">Year View</button>
          </div>
        </div>

        <div class="tab-content month-view">
          ${a}
        </div>

        <div class="tab-content year-view" style="display: none;">
          ${r}
        </div>
      </div>

      <style>
        .habit-tracker-container .tab-button:hover {
          background: #ededec;
        }
        .habit-tracker-container .tab-button.active {
          background: #5B57EB !important;
          color: white !important;
        }
        .habit-tracker-container .tab-button.active:hover {
          background: #4c48d9 !important;
        }
        .habit-tracker-container input[type="checkbox"] {
          width: 14px;
          height: 14px;
        }
      </style>

      <script>
        (function() {
          const buttons = document.querySelectorAll('.habit-tracker-container .tab-button');
          
          // Tab switching
          buttons.forEach(button => {
            button.addEventListener('click', function() {
              const tab = this.getAttribute('data-tab');
              
              // Update button states
              buttons.forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = '#787774';
                b.style.border = 'none';
              });
              this.classList.add('active');
              this.style.background = '#5B57EB';
              this.style.color = 'white';
              this.style.border = 'none';

              // Show/hide content
              const container = this.closest('.habit-tracker-container');
              container.querySelectorAll('.tab-content').forEach(content => {
                content.style.display = 'none';
              });
              container.querySelector('.' + tab + '-view').style.display = 'block';
            });
          });
        })();
      <\/script>
    `}generateMonthView(t,e){const o=e.getFullYear(),a=e.getMonth(),n=new Date(o,a+1,0).getDate(),i=e.toLocaleDateString("en-US",{month:"long",year:"numeric"}),l=new Map;for(const s of t){const h=new Map;for(const g of s.entries){const p=new Date(g.date);p.getMonth()===a&&p.getFullYear()===o&&h.set(g.date,!0)}l.set(s.name,h)}let c=`
      <div class="month-view-container">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        ">${i}</h2>
        
        <div style="
          background: #ffffff;
          border: 1px solid #e3e3e1;
          border-radius: 8px;
          overflow-x: auto;
          padding: 16px;
        ">
          <table style="
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
          ">
            <thead>
              <tr style="border-bottom: 2px solid #e3e3e1;">
                <th style="
                  padding: 12px 16px;
                  text-align: left;
                  font-weight: 600;
                  color: #000000;
                  position: sticky;
                  left: 0;
                  background: #ffffff;
                  min-width: 120px;
                ">Habit</th>
    `;for(let s=1;s<=n;s++)c+=`
                <th style="
                  padding: 8px 4px;
                  text-align: center;
                  font-weight: 500;
                  color: #787774;
                  font-size: 12px;
                  min-width: 32px;
                ">${s}</th>
      `;c+=`
                <th style="
                  padding: 12px 16px;
                  text-align: center;
                  font-weight: 600;
                  color: #000000;
                  min-width: 60px;
                ">Total</th>
              </tr>
            </thead>
            <tbody>
    `;for(const s of t){const h=l.get(s.name)||new Map;let g=0;c+=`
              <tr style="border-bottom: 1px solid #f7f7f5;">
                <td style="
                  padding: 12px 16px;
                  font-weight: 500;
                  color: #37352F;
                  position: sticky;
                  left: 0;
                  background: #ffffff;
                ">${this.escapeHtml(s.name)}</td>
      `;for(let p=1;p<=n;p++){const v=`${o}-${String(a+1).padStart(2,"0")}-${String(p).padStart(2,"0")}`,y=h.has(v);y&&g++;const u=new Date,E=u.getDate()===p&&u.getMonth()===a&&u.getFullYear()===o;c+=`
                <td style="
                  padding: 8px 4px;
                  text-align: center;
                  background: ${E?"#EEF2FF":"transparent"};
                  font-size: 16px;
                ">${y?"✓":""}</td>
        `}c+=`
                <td style="
                  padding: 12px 16px;
                  text-align: center;
                  font-weight: 600;
                  color: #5B57EB;
                ">${g}</td>
              </tr>
      `}return c+=`
            </tbody>
          </table>
        </div>
      </div>
    `,c}generateYearView(t,e){let a=`
      <div class="year-view-container">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        ">${e.getFullYear()} Statistics</h2>
        
        <div style="
          background: #ffffff;
          border: 1px solid #e3e3e1;
          border-radius: 8px;
          overflow: hidden;
        ">
          <table style="
            width: 100%;
            border-collapse: collapse;
          ">
            <thead>
              <tr style="background: #fafafa;">
                <th style="
                  padding: 12px 20px;
                  text-align: left;
                  font-weight: 600;
                  color: #000000;
                  font-size: 13px;
                  border-bottom: 1px solid #e3e3e1;
                ">Habit</th>
                <th style="
                  padding: 12px 20px;
                  text-align: center;
                  font-weight: 600;
                  color: #000000;
                  font-size: 13px;
                  border-bottom: 1px solid #e3e3e1;
                ">Total Count</th>
              </tr>
            </thead>
            <tbody>
    `;for(const r of t)a+=`
        <tr style="border-bottom: 1px solid #f7f7f5;">
          <td style="
            padding: 14px 20px;
            font-weight: 400;
            color: #37352F;
            font-size: 14px;
          ">${this.escapeHtml(r.name)}</td>
          <td style="
            padding: 14px 20px;
            text-align: center;
          ">
            <span style="
              background: #E8E7FF;
              color: #5B57EB;
              padding: 4px 12px;
              border-radius: 4px;
              font-size: 15px;
              font-weight: 500;
              display: inline-block;
            ">${r.totalCount}</span>
          </td>
        </tr>
      `;return a+=`
            </tbody>
          </table>
        </div>
      </div>
    `,a}escapeHtml(t){const e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return t.replace(/[&<>"']/g,o=>e[o])}}const f="Habits";async function k(){console.log("Habit Tracker plugin loaded");const b=new w;try{await b.ensureHabitsPage(),logseq.App.onRouteChanged(async({path:e})=>{e.includes(f)&&await b.renderOnHabitsPage()});const t=await logseq.Editor.getCurrentPage();t&&t.name===f&&await b.renderOnHabitsPage(),console.log(`Habit Tracker plugin ready! Navigate to the "${f}" page to view your tracker.`)}catch(t){console.error("Error initializing Habit Tracker plugin:",t)}}logseq.ready(k).catch(console.error)})();
//# sourceMappingURL=index.js.map
