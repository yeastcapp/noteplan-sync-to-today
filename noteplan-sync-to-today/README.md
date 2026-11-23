# Sync to Today (NotePlan plugin)

Put your cursor on a task in any note, type `/st`, and a **synced copy** of it appears in today's note. The original stays where it is. Tick either copy and both are completed.

Made for keeping tasks in project notes while still seeing them in the body of your daily note.

## How it works

NotePlan's "synced lines" are the same line with the same `^abc123` tag at the end, in two notes. This command:

1. Adds a tag to your task if it doesn't have one.
2. Puts a copy with the same tag in today's note.

It never moves or deletes anything. Running it twice on the same task won't create a duplicate.

## Install

1. Download or clone this repo.
2. Copy the `tim.SyncToToday` folder into NotePlan's Plugins folder (Preferences should have a button to open it; on most installs it lives under `~/Library/Application Support/`, in a `co.noteplan.NotePlan3` folder).
3. Restart NotePlan.

## Use

Cursor on a task, then type `/st` (or `/sync to today`). Select several tasks to sync them all at once.

## Settings

In NotePlan's plugin preferences:

| Setting | Options | Default |
| --- | --- | --- |
| Where to put the copy | Top, Bottom, Under heading, Above heading | Top |
| Heading name | any heading text (not case sensitive) | Done |

- **Top / Bottom:** start or end of today's note.
- **Under heading:** directly below the named heading. If it's missing, it's created at the bottom.
- **Above heading:** just above the named heading, so tasks stay above a "Done" section. If it's missing, the copy goes to the bottom.

The heading name is only used by the last two options. NotePlan can't hide a setting based on another, so it's always visible.

## Keyboard shortcut

NotePlan has no built-in keybinding editor, so use macOS:

1. System Settings > Keyboard > Keyboard Shortcuts... > App Shortcuts.
2. Click +, choose NotePlan.
3. In the menu title field type `/sync to today` (check the exact title in NotePlan's menu).
4. Choose your shortcut.

If the command doesn't show up in the menu, NotePlan can run it by URL, which you can bind with the macOS Shortcuts app or a launcher:

`noteplan://x-callback-url/runPlugin?pluginID=tim.SyncToToday&command=sync%20to%20today`

## Status

Tested against a simulated NotePlan (`test/test_placement.js`), then used in the real app for the basic flow. The URL trigger and the heading-based placement options are less exercised, so report anything odd.

Run the tests with `node test/test_placement.js tim.SyncToToday/script.js`.

## License

MIT
