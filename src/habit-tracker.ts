import '@logseq/libs'

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
        <div style="padding: 40px 20px; text-align: center; color: #666; max-width: 600px; margin: 0 auto;">
          <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
          <h3 style="margin: 0 0 12px 0; font-size: 20px; color: #333;">No habits tracked yet!</h3>
          <p style="margin: 0; font-size: 14px; line-height: 1.6;">
            Start tracking habits in your daily journal by using the <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 4px;">#habit</code> tag:
          </p>
          <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: left; font-family: monospace; font-size: 13px;">
            <div style="color: #666; margin-bottom: 4px;">- #habit Exercise</div>
            <div style="color: #666; margin-bottom: 4px;">- #habit Meditation 7:00 AM</div>
            <div style="color: #666;">- #habit Reading</div>
          </div>
          <p style="margin: 16px 0 0 0; font-size: 13px; color: #888;">
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
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      ">
        <div class="habit-tracker-header" style="
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        ">
          <h1 style="
            margin: 0 0 8px 0;
            font-size: 28px;
            font-weight: 600;
            color: #111827;
          ">📊 Habit Tracker</h1>
          <p style="
            margin: 0;
            color: #6b7280;
            font-size: 14px;
          ">Track your daily habits and build consistency</p>
        </div>

        <div class="controls-bar" style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        ">
          <div class="habit-tracker-tabs" style="
            display: flex;
            gap: 8px;
          ">
            <button class="tab-button active" data-tab="month" style="
              padding: 8px 20px;
              background: #4F46E5;
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            ">Month View</button>
            <button class="tab-button" data-tab="year" style="
              padding: 8px 20px;
              background: white;
              color: #6b7280;
              border: 1px solid #d1d5db;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
            ">Year View</button>
          </div>

          <label style="
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
            color: #6b7280;
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
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .habit-tracker-container .tab-button.active {
          background: #4F46E5 !important;
          color: white !important;
          border-color: #4F46E5 !important;
        }
        .habit-tracker-container input[type="checkbox"] {
          width: 16px;
          height: 16px;
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
                b.style.background = 'white';
                b.style.color = '#6b7280';
                b.style.border = '1px solid #d1d5db';
              });
              this.classList.add('active');
              this.style.background = '#4F46E5';
              this.style.color = 'white';
              this.style.border = '1px solid #4F46E5';

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
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
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
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <div class="habit-header" style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
          ">
            <h3 style="
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              color: #111827;
            ">${this.escapeHtml(habit.name)}</h3>
            <div style="
              background: #EEF2FF;
              color: #4F46E5;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 600;
            ">
              ${monthEntries.length} ${monthEntries.length === 1 ? 'time' : 'times'}
            </div>
          </div>
          
          <div class="habit-calendar" style="
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 6px;
            margin-bottom: 16px;
          ">
            ${this.generateCalendarDays(monthEntries, firstDay, lastDay)}
          </div>

          <div class="habit-entries" style="
            max-height: 150px;
            overflow-y: auto;
            padding: 12px;
            background: #f9fafb;
            border-radius: 6px;
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
          font-size: 12px;
          font-weight: 600;
          color: #9ca3af;
          padding: 4px;
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
      
      let bgColor = '#f3f4f6' // No data
      let borderColor = 'transparent'
      let title = 'No habits tracked'
      
      if (count > 0) {
        // Green intensity based on count
        const intensity = Math.min(count / 3, 1)
        const greenValue = Math.floor(186 + (16 - 186) * intensity)
        const blueValue = Math.floor(230 + (129 - 230) * intensity)
        bgColor = `rgb(${16}, ${greenValue}, ${blueValue})`
        title = `${count} habit${count > 1 ? 's' : ''} tracked`
      }
      
      // Highlight today
      const isToday = currentDate.getTime() === today.getTime()
      if (isToday) {
        borderColor = '#4F46E5'
      }
      
      html += `
        <div style="
          aspect-ratio: 1;
          background: ${bgColor};
          border: 2px solid ${borderColor};
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          color: ${count > 0 ? 'white' : '#9ca3af'};
        " title="${title} - ${dateStr}" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          ${currentDate.getDate()}
        </div>
      `
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return html
  }

  private generateEntryList(entries: HabitEntry[]): string {
    if (entries.length === 0) {
      return '<p style="margin: 0; color: #9ca3af; font-size: 13px;">No entries this month</p>'
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 6px;">'
    
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
          color: #374151;
        ">
          <span style="font-weight: 500;">${formattedDate}</span>
          <div style="display: flex; gap: 8px; align-items: center;">
      `

      for (const entry of dateEntries) {
        if (entry.time) {
          html += `
            <span class="habit-timestamp" style="
              color: #6b7280;
              font-size: 12px;
              display: ${this.showTimestamps ? 'inline' : 'none'};
            ">${entry.time}</span>
          `
        }
      }

      html += `
            <span style="
              background: #10B981;
              color: white;
              padding: 2px 8px;
              border-radius: 10px;
              font-size: 11px;
              font-weight: 600;
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
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        ">${year} Statistics</h2>
        
        <div style="
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        ">
          <table style="
            width: 100%;
            border-collapse: collapse;
          ">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="
                  padding: 16px 20px;
                  text-align: left;
                  font-weight: 600;
                  color: #111827;
                  font-size: 14px;
                  border-bottom: 1px solid #e5e7eb;
                ">Habit</th>
                <th style="
                  padding: 16px 20px;
                  text-align: center;
                  font-weight: 600;
                  color: #111827;
                  font-size: 14px;
                  border-bottom: 1px solid #e5e7eb;
                ">Total Count</th>
              </tr>
            </thead>
            <tbody>
    `
    
    for (const habit of habits) {
      html += `
        <tr style="border-bottom: 1px solid #f3f4f6;">
          <td style="
            padding: 16px 20px;
            font-weight: 500;
            color: #111827;
            font-size: 14px;
          ">${this.escapeHtml(habit.name)}</td>
          <td style="
            padding: 16px 20px;
            text-align: center;
          ">
            <span style="
              background: #EEF2FF;
              color: #4F46E5;
              padding: 6px 16px;
              border-radius: 12px;
              font-size: 16px;
              font-weight: 600;
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
