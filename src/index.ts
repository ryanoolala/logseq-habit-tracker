import '@logseq/libs'
import { HabitTracker, HABITS_PAGE_NAME, RENDERER_NAME } from './habit-tracker'

// Declare global logseq for TypeScript
declare const logseq: any

async function main(): Promise<void> {
  console.log('Habit Tracker plugin loaded')

  const habitTracker = new HabitTracker()

  try {
    // Create or get the Habits page with renderer block
    await habitTracker.ensureHabitsPage()

    // Register the macro renderer for the habit tracker
    logseq.App.onMacroRendererSlotted(({ slot, payload }: { slot: string, payload: any }) => {
      // Safety check for payload.arguments
      if (!payload || !payload.arguments || !payload.arguments.length) return

      const [type] = payload.arguments
      if (type !== `:${RENDERER_NAME}`) return

      // Render the habit tracker in the slot
      habitTracker.renderHabitTracker(slot)
    })

    console.log(`Habit Tracker plugin ready! Navigate to the "${HABITS_PAGE_NAME}" page to view your tracker.`)
  } catch (error) {
    console.error('Error initializing Habit Tracker plugin:', error)
  }
}

logseq.ready(main).catch(console.error)
