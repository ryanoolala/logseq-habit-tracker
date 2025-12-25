# Habit Tracker Usage Guide

## Quick Start

1. **Install the plugin** in Logseq (Settings → Plugins → Load unpacked plugin)
2. **Navigate to the "Habits" page** in your Logseq graph
3. **Start tracking habits** in your daily journal

## How to Track Habits

In your daily journal pages, use the `#habit` tag followed by the habit name:

```markdown
- #habit Exercise
- #habit Meditation
- #habit Reading
```

### Adding Timestamps (Optional)

You can optionally include timestamps to track when you performed the habit:

```markdown
- #habit Exercise 6:30 AM
- #habit Lunch break walk 12:15 PM
- #habit Evening meditation 8:00 PM
```

### Multiple Entries Per Day

You can log the same habit multiple times on the same day:

```markdown
- #habit Drink water 9:00 AM
- #habit Drink water 12:00 PM
- #habit Drink water 3:00 PM
- #habit Drink water 6:00 PM
```

## Understanding the Habits Page

### Month View (Default)

The month view shows:
- **Calendar Grid**: Each day of the month with visual indicators
  - Darker green = More habits completed
  - Light gray = No habits tracked
  - Blue border = Today's date
- **Habit Count Badge**: Shows how many times you performed the habit this month
- **Entry List**: Shows all dates when you performed the habit
  - Timestamps can be toggled on/off using the checkbox

### Year View

The year view shows:
- Simple statistics table
- Total count for each habit across all tracked days

### Controls

- **Month View / Year View tabs**: Switch between views
- **Show timestamps checkbox**: Toggle timestamp visibility in the entry lists

## Tips for Success

1. **Keep habit names short and consistent**: Use the same name each time
   - ✅ Good: `#habit Exercise`, `#habit Meditation`
   - ❌ Avoid: `#habit Went to the gym today`, `#habit Meditation session`

2. **Track daily**: Add your habits to each day's journal for accurate tracking

3. **Use the calendar view**: The month view helps you see patterns and identify gaps

4. **Multiple habits**: Track as many habits as you want - each gets its own card

5. **Timestamp flexibility**: Only add timestamps when they matter to you

## Examples

### Morning Routine
```markdown
## Morning
- #habit Wake up early 6:00 AM
- #habit Meditation 6:15 AM
- #habit Exercise 6:45 AM
- #habit Healthy breakfast 7:30 AM
```

### Daily Habits
```markdown
- #habit Reading
- #habit Journal
- #habit Walk
- #habit Gratitude practice
```

### Health Tracking
```markdown
- #habit Drink water 9:00 AM
- #habit Drink water 11:00 AM
- #habit Drink water 2:00 PM
- #habit Take vitamins 8:00 AM
```

## Troubleshooting

**Q: The Habits page is empty or I only see a renderer block**
- This is expected! The plugin creates a block with `{{renderer :habit-tracker}}` that displays the tracker
- If you see the renderer block but no tracker dashboard below it, try refreshing the page
- The plugin needs at least one habit tracked in your journal to display the tracker
- Make sure the plugin is loaded and enabled in Settings → Plugins

**Q: My habits aren't showing up**
- Make sure you're using the exact format: `#habit HabitName`
- Check that you're adding them to journal pages (daily notes)
- Navigate to the "Habits" page to see the tracker
- Try refreshing the Habits page after adding new habits

**Q: How do I know if the plugin is working?**
- Check if the "Habits" page exists in your graph
- On the Habits page, you should see `{{renderer :habit-tracker}}` followed by the tracker UI
- If you haven't tracked any habits yet, you'll see a welcome message with instructions
- Check the browser console (Cmd/Ctrl + Shift + I) for any error messages

**Q: Can I track habits on non-journal pages?**
- Currently, the plugin only tracks habits from daily journal pages

**Q: How do I delete a habit?**
- Simply remove or edit the original journal entry with the habit tag
- The tracker will update automatically

**Q: The timestamps are cluttering my view**
- Use the "Show timestamps" toggle to hide them while keeping the data
