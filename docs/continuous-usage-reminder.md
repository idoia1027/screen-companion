# Continuous Screen Usage Reminder Requirement

## 1. Feature Goal

Upgrade the current reminder feature from a simple fixed countdown into a configurable continuous screen-usage reminder.

The companion should remind the user after they have actively used the computer for a configurable duration. The default is 50 minutes.

This feature should remain lightweight. The companion character is still the center of the experience. The reminder is only a secondary functional layer.

## 2. Product Definition

This is not a productivity dashboard.

This is not a focus analytics tool.

This is not a pomodoro app.

This is a screen companion that can gently remind the user to take a break after continuous computer usage.

The reminder should feel like a soft companion message, not a strict productivity alarm.

## 3. User-facing Settings

The settings panel must support the following reminder settings:

### 3.1 Continuous Usage Reminder Toggle

Label:

`Continuous screen reminder`

Behavior:

* When enabled:

  * The app tracks active computer usage.
  * When the active usage duration reaches the configured threshold, the companion shows a reminder bubble.
  * The existing reminder animation may be triggered.

* When disabled:

  * Do not show reminder bubbles.
  * Do not trigger reminder animations.
  * The companion character must remain visible on screen in idle mode.
  * Disabling reminders must not hide the companion.
  * Disabling reminders must not close or quit the app.

Important distinction:

`reminderEnabled = false` only disables reminder messages.
It does not hide the companion and does not exit the app.

### 3.2 Reminder Trigger Duration

Label:

`Reminder interval`

User-facing copy:

`Remind after [50] minutes of active screen use`

Requirements:

* User can input a custom number of minutes.
* Default value: `50`.
* Recommended valid range: 5-240 minutes.
* If user input is invalid, show a clear validation message or fallback safely to default.

### 3.3 Idle Break Threshold

Label:

`Break detection`

User-facing copy:

`Treat [3] idle minutes as a break`

Requirements:

* User can input a custom number of minutes.
* Default value: `3`.
* Recommended valid range: 1-30 minutes.
* If the system is idle for this duration, treat it as a break.
* After a break, the active usage timer should pause or reset according to the existing app behavior. Prefer reset for a clearer user experience.

### 3.4 Reminder Message

Label:

`Reminder message`

Default message:

`休息一下，站起来走两步。`

Requirements:

* User must be able to type custom reminder text.
* The text input is the primary customization method.
* Provide 2-3 preset suggestion buttons only as quick-fill helpers.
* Preset buttons should fill the input field; they must not replace free typing.

Suggested quick-fill buttons:

* `喝口水`
* `眼睛休息一下`
* `起来走走`

### 3.5 Restore Defaults

Label:

`Restore defaults`

Restores:

```ts
reminderEnabled = true
reminderTriggerMinutes = 50
idleBreakThresholdMinutes = 3
reminderMessage = "休息一下，站起来走两步。"
```

## 4. Recommended Settings UI

The settings panel should remain lightweight and secondary to the companion character.

Suggested layout:

```text
Continuous screen reminder   [ On ]

Reminder interval
Remind after [ 50 ] minutes of active screen use

Break detection
Treat [ 3 ] idle minutes as a break

Reminder message
[ 休息一下，站起来走两步。 ]

Quick fill:
[ 喝口水 ] [ 眼睛休息一下 ] [ 起来走走 ]

[ Save ] [ Restore defaults ]
```

Do not add charts, usage history, analytics, reports, or productivity scoring.

## 5. System Activity Detection

Use Electron `powerMonitor` in the main process to detect system idle time.

Recommended behavior:

* Poll system idle time every 15 seconds.
* If idle time is below `idleBreakThresholdMinutes`, count the interval as active usage.
* If idle time reaches or exceeds `idleBreakThresholdMinutes`, treat it as a break and reset active usage duration.
* If the system is locked, suspended, or unavailable, pause or reset tracking safely.
* When active usage duration reaches `reminderTriggerMinutes`, show the reminder bubble using the configured reminder message.

Important limitation:

This detects system activity / idle state.
It does not detect actual eye gaze or whether the user is physically looking at the screen.

The README should clearly document this limitation.

## 6. Data Model

Use or adapt the existing local settings storage.

Recommended model:

```ts
type ReminderSettings = {
  reminderEnabled: boolean;
  reminderTriggerMinutes: number;
  idleBreakThresholdMinutes: number;
  reminderMessage: string;
};
```

Default values:

```ts
const DEFAULT_REMINDER_SETTINGS: ReminderSettings = {
  reminderEnabled: true,
  reminderTriggerMinutes: 50,
  idleBreakThresholdMinutes: 3,
  reminderMessage: "休息一下，站起来走两步。",
};
```

Settings must persist after app restart.

## 7. Reminder Behavior

When reminders are enabled:

1. Track active usage.
2. Show current active usage progress only if the existing UI already has a lightweight place for it.
3. Do not turn the app into a timer dashboard.
4. When active usage reaches the configured trigger duration:

   * Show speech bubble.
   * Use configured reminder message.
   * Trigger existing reminder animation if available.
   * Allow user to dismiss or reset reminder.

When reminders are disabled:

1. Do not show reminder bubble.
2. Do not trigger reminder animation.
3. Keep companion visible.
4. Keep idle animation if it already exists.
5. Do not exit the app.

## 8. Separate Companion Visibility Controls

Do not confuse reminder toggle with companion visibility.

Reminder toggle:

* Controls reminder messages only.
* Does not hide the character.

Companion visibility should be handled separately, such as through right-click menu items:

```text
Settings
Hide companion
Quit app
```

Do not implement companion hiding in this goal unless it already exists and only needs to remain unaffected.

## 9. Constraints

Do not add:

* AI chat
* LLM integration
* image background removal
* backend
* cloud sync
* analytics dashboard
* user account system
* productivity scoring
* charts
* report pages

Keep the feature local and lightweight.

## 10. Acceptance Criteria

The feature is complete only when:

1. `npm run dev` still launches the app.
2. The companion still floats transparently above other windows.
3. The companion remains visible when reminders are disabled.
4. User can enable/disable continuous usage reminders.
5. User can customize reminder trigger duration.
6. User can customize idle break threshold.
7. User can type custom reminder text.
8. Quick-fill buttons fill the reminder text input.
9. Restore defaults works.
10. Reminder settings persist after app restart.
11. Reminder bubble uses the customized message.
12. Disabled reminders do not show bubbles or reminder animations.
13. README documents:

    * how active usage detection works
    * default settings
    * known limitation: system activity detection is not eye-gaze detection

## 11. Manual Test Cases

### Test 1: Default Reminder Settings

* Launch app.
* Open settings.
* Confirm defaults:

  * reminder enabled
  * 50 minutes trigger
  * 3 minutes idle threshold
  * default reminder message

### Test 2: Custom Reminder Message

* Change reminder text.
* Save.
* Trigger reminder using a short test interval.
* Confirm bubble uses custom text.

### Test 3: Reminder Disabled

* Disable continuous usage reminder.
* Save.
* Confirm companion remains visible.
* Confirm no reminder bubble appears.

### Test 4: Persistence

* Change settings.
* Restart app.
* Confirm settings are restored.

### Test 5: Active Usage Detection

* Set reminder trigger to a short interval, such as 1 minute.
* Keep system active.
* Confirm reminder appears.
* Stay idle longer than idle threshold.
* Confirm active usage resets or pauses safely.
