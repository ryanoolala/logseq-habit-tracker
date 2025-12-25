import '@logseq/libs'
import { HabitTracker } from './habit-tracker'

// Declare global logseq for TypeScript
declare const logseq: any

const HABITS_PAGE_NAME = 'Habits' as const

async function main(): Promise<void> {
  console.log('Habit Tracker plugin loaded')

  const habitTracker = new HabitTracker()

  try {
    // Create or get the Habits page
    await habitTracker.ensureHabitsPage()

    // Listen for page navigation to render the tracker
    logseq.App.onRouteChanged(async ({ path }: { path: string }) => {
      if (path.includes(HABITS_PAGE_NAME)) {
        await habitTracker.renderOnHabitsPage()
      }
    })

    // Initial render if we're already on the Habits page
    const currentPage = await logseq.Editor.getCurrentPage()
    if (currentPage && currentPage.name === HABITS_PAGE_NAME) {
      await habitTracker.renderOnHabitsPage()
    }

    console.log(`Habit Tracker plugin ready! Navigate to the "${HABITS_PAGE_NAME}" page to view your tracker.`)
  } catch (error) {
    console.error('Error initializing Habit Tracker plugin:', error)
  }
}

logseq.ready(main).catch(console.error)
