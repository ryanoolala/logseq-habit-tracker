import '@logseq/libs'
import { HabitTracker } from './habit-tracker'

// Declare global logseq for TypeScript
declare const logseq: any

async function main() {
  console.log('Habit Tracker plugin loaded')

  const habitTracker = new HabitTracker()

  // Create or get the Habits page
  await habitTracker.ensureHabitsPage()

  // Listen for page navigation to render the tracker
  logseq.App.onRouteChanged(async ({ path }: any) => {
    if (path.includes('Habits')) {
      await habitTracker.renderOnHabitsPage()
    }
  })

  // Initial render if we're already on the Habits page
  const currentPage = await logseq.Editor.getCurrentPage()
  if (currentPage && currentPage.name === 'Habits') {
    await habitTracker.renderOnHabitsPage()
  }

  console.log('Habit Tracker plugin ready! Navigate to the "Habits" page to view your tracker.')
}

logseq.ready(main).catch(console.error)
