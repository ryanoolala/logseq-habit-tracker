import '@logseq/libs'

// Declare global logseq for TypeScript
declare const logseq: any

// Constants
export const HABITS_PAGE_NAME = 'Habits' as const
export const RENDERER_NAME = 'habit-tracker' as const

// Regex patterns
const TIMESTAMP_PATTERN = /((?:1[0-2]|0?[1-9]):[0-5][0-9]\s*(?:[AaPp][Mm])|(?:2[0-3]|[01]?[0-9]):[0-5][0-9])/

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
  async ensureHabitsPage(): Promise<void> {
    try {
      // Check if Habits page exists
      let page = await logseq.Editor.getPage(HABITS_PAGE_NAME)
      if (!page) {
        // Create the Habits page
        await logseq.Editor.createPage(HABITS_PAGE_NAME, {}, { redirect: false })
        console.log(`Created ${HABITS_PAGE_NAME} page`)
        page = await logseq.Editor.getPage(HABITS_PAGE_NAME)
      }

      // Check if the page has the renderer block
      const pageBlocks = await logseq.Editor.getPageBlocksTree(HABITS_PAGE_NAME)
      const rendererContent = `{{renderer :${RENDERER_NAME}}}`
      const hasRenderer = pageBlocks && pageBlocks.some((block: any) => 
        block.content && typeof block.content === 'string' && block.content.trim() === rendererContent
      )

      if (!hasRenderer) {
        // Add the renderer block to the page
        await logseq.Editor.appendBlockInPage(
          HABITS_PAGE_NAME, 
          `{{renderer :${RENDERER_NAME}}}`
        )
        console.log(`Added habit tracker renderer to ${HABITS_PAGE_NAME} page`)
      }
    } catch (error) {
      console.error('Error ensuring Habits page:', error)
    }
  }

  async renderHabitTracker(slotId: string): Promise<void> {
    try {
      // Get habit data and generate HTML
      const habitData = await this.getHabitData()
      const html = this.generateHabitTrackerHTML(habitData)

      // Render the UI in the slot
      logseq.provideUI({
        key: `${RENDERER_NAME}-${slotId}`,
        slot: slotId,
        reset: true,
        template: html,
      })
    } catch (error) {
      console.error('Error rendering habit tracker:', error)
    }
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
          
          // Skip empty habit names
          if (!habitName) continue
          
          // Try to extract time from the habit entry with proper validation
          let time: string | undefined
          const timeMatch = block.content.match(TIMESTAMP_PATTERN)
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
      </script>
    `
  }

  private generateMonthView(habits: HabitStats[], date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    // Get last day of month to determine number of days
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    
    const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    
    // Create a map of date strings to habit completion
    const habitCompletionMap = new Map<string, Map<string, boolean>>()
    
    for (const habit of habits) {
      const dateMap = new Map<string, boolean>()
      for (const entry of habit.entries) {
        const entryDate = new Date(entry.date)
        if (entryDate.getMonth() === month && entryDate.getFullYear() === year) {
          dateMap.set(entry.date, true)
        }
      }
      habitCompletionMap.set(habit.name, dateMap)
    }
    
    let html = `
      <div class="month-view-container">
        <h2 style="
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #000000;
        ">${monthName}</h2>
        
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
    `
    
    // Add date headers
    for (let day = 1; day <= daysInMonth; day++) {
      html += `
                <th style="
                  padding: 8px 4px;
                  text-align: center;
                  font-weight: 500;
                  color: #787774;
                  font-size: 12px;
                  min-width: 32px;
                ">${day}</th>
      `
    }
    
    html += `
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
    `
    
    // Add habit rows
    for (const habit of habits) {
      const dateMap = habitCompletionMap.get(habit.name) || new Map()
      let totalCount = 0
      
      html += `
              <tr style="border-bottom: 1px solid #f7f7f5;">
                <td style="
                  padding: 12px 16px;
                  font-weight: 500;
                  color: #37352F;
                  position: sticky;
                  left: 0;
                  background: #ffffff;
                ">${this.escapeHtml(habit.name)}</td>
      `
      
      // Add cells for each day
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const hasHabit = dateMap.has(dateStr)
        
        if (hasHabit) totalCount++
        
        // Check if this is today
        const today = new Date()
        const isToday = today.getDate() === day && 
                       today.getMonth() === month && 
                       today.getFullYear() === year
        
        html += `
                <td style="
                  padding: 8px 4px;
                  text-align: center;
                  background: ${isToday ? '#EEF2FF' : 'transparent'};
                  font-size: 16px;
                ">${hasHabit ? '✓' : ''}</td>
        `
      }
      
      html += `
                <td style="
                  padding: 12px 16px;
                  text-align: center;
                  font-weight: 600;
                  color: #5B57EB;
                ">${totalCount}</td>
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
