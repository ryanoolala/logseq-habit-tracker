# Logseq Habit Tracker Plugin 📊

A beautiful and elegant habit tracking plugin for Logseq that helps you monitor your daily habits with modern month and year views.

## Installation

### Loading the Plugin into Logseq

This plugin can be loaded directly into Logseq without building:

1. **Download or clone this repository** to your local machine
2. **Open Logseq Desktop**
3. Click on the **three dots menu (⋯)** in the top right corner
4. Go to **Settings** → **Advanced** → Enable **Developer mode**
5. Go to **Settings** → **Plugins** 
6. Click **Load unpacked plugin**
7. Navigate to and select the plugin's root directory (the folder containing `package.json`)
8. The plugin will load automatically!
9. Navigate to the **Habits** page to start tracking your habits

**Note:** The plugin is ready to use - all necessary files (including the built `dist/` directory) are included in the repository.

## Features

✨ **Simple Habit Tracking** - Track habits using the `#habit` tag in your daily journal
📅 **Month View** - Beautiful calendar heatmap showing daily habit completion
📊 **Year View** - Simple statistics table with total counts
⏰ **Optional Timestamps** - Add timestamps to your habits, toggleable in the view
🎯 **Dedicated Page** - All your habits displayed on a clean "Habits" page
🎨 **Modern UI** - Clean, elegant design that integrates seamlessly with Logseq

## Usage

### 1. Track Habits in Your Daily Journal

Simply use the `#habit` tag followed by the habit name:

```markdown
- #habit Exercise
- #habit Meditation 7:00 AM
- #habit Reading
- #habit Drink water 2:30 PM
```

Writing down the habit means you performed it. Timestamps are optional and can be added after the habit name.

### 2. View Your Habits

Navigate to the **Habits** page in Logseq to see your habit tracker dashboard. The plugin automatically creates this page on first load.

## Views

### Month View (Default)

The month view displays a calendar heatmap for each habit:
- **Darker green tiles** = More habits completed that day
- **Light gray tiles** = No habits tracked that day
- **Today** is highlighted with a blue border

Each habit card shows:
- Habit name
- Total count for the month
- Calendar grid with day numbers
- List of entries with optional timestamps

### Year View

The year view provides a simple statistics table:
- Habit name
- Total count across all tracked days

Toggle between views using the buttons at the top.

### Timestamp Toggle

Use the "Show timestamps" checkbox to show or hide timestamps in the entry lists. This keeps the view clean when you don't need time details.

## Development

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode

```bash
npm run dev
```

This will watch for changes and rebuild automatically.

### Installing in Logseq

#### Option 1: Load from Repository (Recommended)

If you've cloned or downloaded this repository:

1. Open Logseq Desktop
2. Click on the three dots menu (⋯) in the top right
3. Go to **Settings** → **Advanced** → Enable **Developer mode**
4. Go to **Settings** → **Plugins** 
5. Click **Load unpacked plugin**
6. Navigate to and select this plugin's root directory (containing `package.json`)
7. The plugin will load and you can navigate to the **Habits** page to start tracking!

#### Option 2: Build from Source

If you want to build the plugin yourself:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the plugin
4. Follow the steps in Option 1 to load the plugin

## Tips

- **Keep habit names short**: Use concise names like "Exercise" or "Meditation"
- **Daily tracking**: Add habits to each day's journal for accurate tracking
- **Timestamps are optional**: Add them if you want to track when you completed habits
- **Multiple entries**: You can log the same habit multiple times per day

## License

MIT License - see [LICENSE](LICENSE) file for details

## Author

Ryan

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
