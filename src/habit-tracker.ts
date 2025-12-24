import '@logseq/libs'

// Declare global logseq for TypeScript
declare const logseq: any

export interface HabitEntry {
  name: string
  date: string
  time?: string
  page: string
  blockUuid: string
}

export interface HabitStats {
  name: string
  totalCount: number
  entries: HabitEntry[]
}

export class HabitTracker {
  private showTimestamps: boolean = false

  async ensureHabitsPage(): Promise<void> {
    // Check if Habits page exists
    const page = await logseq.Editor.getPage('Habits')
    if (!page) {
      // Create the Habits page
      await logseq.Editor.createPage('Habits', {}, { redirect: false })
      console.log('Created Habits page')
    }
  }

  async renderOnHabitsPage(): Promise<void> {
    const page = await logseq.Editor.getPage('Habits')
    if (!page) return

    const pageBlocks = await logseq.Editor.getPageBlocksTree('Habits')
    
    // Clear existing content and add the tracker
    if (!pageBlocks || pageBlocks.length === 0) {
      await logseq.Editor.appendBlockInPage('Habits', '')
    }

    // Render the habit tracker UI
    const habitData = await this.getHabitData()
    const html = this.generateHabitTrackerHTML(habitData)

    logseq.provideUI({
      key: 'habit-tracker-main',
      slot: 'Habits',
      reset: true,
      template: html,
    })
  }

  async getHabitData(startDate?: Date, endDate?: Date): Promise<Map<string, HabitStats>> {
    const allPages = await logseq.Editor.getAllPages()
    if (!allPages) return new Map()

    const habitMap = new Map<string, HabitEntry[]>()
    const journalPages = allPages.filter((page: any) => 
      page.journalDay && this.isDateInRange(page.journalDay, startDate, endDate)
    )

    // Parse each journal page for habits with #habit tag
    for (const page of journalPages) {
      const pageBlocks = await logseq.Editor.getPageBlocksTree(page.name)
      if (!pageBlocks || !page.journalDay) continue

      const date = this.formatJournalDate(page.journalDay)
      this.extractHabitsFromBlocks(pageBlocks, date, page.name, habitMap)
    }

    // Calculate statistics for each habit
    return this.calculateHabitStats(habitMap)
  }

  private isDateInRange(journalDay: number, startDate?: Date, endDate?: Date): boolean {
    const date = this.journalDayToDate(journalDay)
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    return true
  }

  private journalDayToDate(journalDay: number): Date {
    const year = Math.floor(journalDay / 10000)
    const month = Math.floor((journalDay % 10000) / 100) - 1
    const day = journalDay % 100
    return new Date(year, month, day)
  }

  private formatJournalDate(journalDay: number): string {
    const date = this.journalDayToDate(journalDay)
    return date.toISOString().split('T')[0]
  }

  private extractHabitsFromBlocks(
    blocks: any[],
    date: string,
    pageName: string,
    habitMap: Map<string, HabitEntry[]>
  ): void {
    for (const block of blocks) {
      if (block.content) {
        // Match #habit tag pattern - capture until timestamp or end of line
        const habitMatch = block.content.match(/#habit\s+([^#\n\r]*?)(?=\s+\d{1,2}:\d{2}|$)/i)
        if (habitMatch) {
          const habitName = habitMatch[1].trim()
          
          // Try to extract time from the habit entry with proper validation
          let time: string | undefined
          const timeMatch = block.content.match(/\b((?:1[0-2]|0?[1-9]):[0-5][0-9]\s*(?:[AaPp][Mm])|(?:2[0-3]|[01]?[0-9]):[0-5][0-9])\b/)
          if (timeMatch) {
            time = timeMatch[1]
          }
          
          const entry: HabitEntry = {
            name: habitName,
            date,
            time,
            page: pageName,
            blockUuid: block.uuid,
          }

          if (!habitMap.has(habitName)) {
            habitMap.set(habitName, [])
          }
          habitMap.get(habitName)!.push(entry)
        }
      }

      // Recursively check child blocks
      if (block.children && block.children.length > 0) {
        this.extractHabitsFromBlocks(block.children, date, pageName, habitMap)
      }
    }
  }

  private calculateHabitStats(habitMap: Map<string, HabitEntry[]>): Map<string, HabitStats> {
    const statsMap = new Map<string, HabitStats>()

    for (const [habitName, entries] of habitMap) {
      // Sort entries by date and time
      const sortedEntries = entries.sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date)
        if (dateCompare !== 0) return dateCompare
        if (a.time && b.time) return a.time.localeCompare(b.time)
        return 0
      })

      statsMap.set(habitName, {
        name: habitName,
        totalCount: sortedEntries.length,
        entries: sortedEntries,
      })
    }

    return statsMap
  }

  private generateHabitTrackerHTML(habitData: Map<string, HabitStats>): string {
    const habits = Array.from(habitData.values()).sort((a, b) => 
      b.totalCount - a.totalCount
    )

    if (habits.length === 0) {
      return `
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
      `
    }

    const now = new Date()
    const monthView = this.generateMonthView(habits, now)
    const yearView = this.generateYearView(habits, now)

    return `
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
          justify-content: space-between;
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

          <label style="
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            font-size: 13px;
            color: #787774;
          ">
            <input type="checkbox" id="toggle-timestamps" ${this.showTimestamps ? 'checked' : ''} style="
              cursor: pointer;
            "/>
            <span>Show timestamps</span>
          </label>
        </div>

        <div class="tab-content month-view">
          ${monthView}
        </div>

        <div class="tab-content year-view" style="display: none;">
          ${yearView}
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
          const timestampToggle = document.getElementById('toggle-timestamps');
          
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

          // Timestamp toggle
          if (timestampToggle) {
            timestampToggle.addEventListener('change', function() {
              const timestamps = document.querySelectorAll('.habit-timestamp');
              timestamps.forEach(ts => {
                ts.style.display = this.checked ? 'inline' : 'none';
              });
            });
          }
        })();
      </script>
    `
  }

  private generateMonthView(habits: HabitStats[], date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get first and last day of month
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    let html = `
      <div class="month-view-container">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        ">${monthName}</h2>
    `
    
    for (const habit of habits) {
      // Filter entries for this month
      const monthEntries = habit.entries.filter(entry => {
        const entryDate = new Date(entry.date)
        return entryDate.getMonth() === month && entryDate.getFullYear() === year
      })

      if (monthEntries.length === 0) continue

      html += `
        <div class="habit-card" style="
          background: #ffffff;
          border: 1px solid #e3e3e1;
          border-radius: 8px;
          padding: 24px;
          margin-bottom: 24px;
        ">
          <div class="habit-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          ">
            <h3 style="
              margin: 0;
              font-size: 16px;
              font-weight: 600;
              color: #000000;
            ">${this.escapeHtml(habit.name)}</h3>
            <div style="
              background: #E8E7FF;
              color: #5B57EB;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
            ">
              ${monthEntries.length} ${monthEntries.length === 1 ? 'time' : 'times'}
            </div>
          </div>
          
          <div class="habit-calendar" style="
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 4px;
            margin-bottom: 16px;
          ">
            ${this.generateCalendarDays(monthEntries, firstDay, lastDay)}
          </div>

          <div class="habit-entries" style="
            max-height: 120px;
            overflow-y: auto;
            padding: 12px;
            background: #fafafa;
            border-radius: 4px;
          ">
            ${this.generateEntryList(monthEntries)}
          </div>
        </div>
      `
    }
    
    html += '</div>'
    return html
  }

  private generateCalendarDays(entries: HabitEntry[], firstDay: Date, lastDay: Date): string {
    let html = ''
    
    // Add day labels
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    for (const label of dayLabels) {
      html += `
        <div style="
          text-align: center;
          font-size: 11px;
          font-weight: 500;
          color: #9B9A97;
          padding: 8px 4px;
        ">${label}</div>
      `
    }
    
    // Add empty cells for days before month starts
    const startDay = firstDay.getDay()
    for (let i = 0; i < startDay; i++) {
      html += '<div></div>'
    }
    
    // Create a map of dates to entry counts
    const dateCountMap = new Map<string, number>()
    for (const entry of entries) {
      const count = dateCountMap.get(entry.date) || 0
      dateCountMap.set(entry.date, count + 1)
    }
    
    // Add calendar days
    const currentDate = new Date(firstDay)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    while (currentDate <= lastDay) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const count = dateCountMap.get(dateStr) || 0
      
      let bgColor = '#f7f7f5' // No data - very light gray
      let borderColor = 'transparent'
      let borderWidth = '1px'
      let title = 'No habits tracked'
      let textColor = '#9B9A97'
      
      if (count > 0) {
        // Bright green color like in the reference
        bgColor = '#B4EC51' // Bright lime green
        title = `${count} habit${count > 1 ? 's' : ''} tracked`
        textColor = '#37352F'
      }
      
      // Highlight today
      const isToday = currentDate.getTime() === today.getTime()
      if (isToday) {
        borderColor = '#5B57EB'
        borderWidth = '2px'
      }
      
      html += `
        <div style="
          aspect-ratio: 1;
          background: ${bgColor};
          border: ${borderWidth} solid ${borderColor};
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 400;
          color: ${textColor};
          min-height: 50px;
        " title="${title} - ${dateStr}" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
          ${currentDate.getDate()}
        </div>
      `
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return html
  }

  private generateEntryList(entries: HabitEntry[]): string {
    if (entries.length === 0) {
      return '<p style="margin: 0; color: #9B9A97; font-size: 12px;">No entries this month</p>'
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 4px;">'
    
    // Group by date
    const dateGroups = new Map<string, HabitEntry[]>()
    for (const entry of entries) {
      if (!dateGroups.has(entry.date)) {
        dateGroups.set(entry.date, [])
      }
      dateGroups.get(entry.date)!.push(entry)
    }

    // Sort dates in descending order
    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => b.localeCompare(a))

    for (const date of sortedDates) {
      const dateEntries = dateGroups.get(date)!
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })

      html += `
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #37352F;
          padding: 4px 0;
        ">
          <span style="font-weight: 400;">${formattedDate}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
      `

      for (const entry of dateEntries) {
        if (entry.time) {
          html += `
            <span class="habit-timestamp" style="
              color: #787774;
              font-size: 12px;
              display: ${this.showTimestamps ? 'inline' : 'none'};
            ">${entry.time}</span>
          `
        }
      }

      html += `
            <span style="
              background: #35D0BA;
              color: white;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 500;
            ">${dateEntries.length}×</span>
          </div>
        </div>
      `
    }

    html += '</div>'
    return html
  }

  private generateYearView(habits: HabitStats[], date: Date): string {
    const year = date.getFullYear()
    
    let html = `
      <div class="year-view-container">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        ">${year} Statistics</h2>
        
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
    `
    
    for (const habit of habits) {
      html += `
        <tr style="border-bottom: 1px solid #f7f7f5;">
          <td style="
            padding: 14px 20px;
            font-weight: 400;
            color: #37352F;
            font-size: 14px;
          ">${this.escapeHtml(habit.name)}</td>
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
            ">${habit.totalCount}</span>
          </td>
        </tr>
      `
    }
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `
    
    return html
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }
    return text.replace(/[&<>"']/g, m => map[m])
  }
}
