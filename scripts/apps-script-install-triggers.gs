// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — TRIGGER INSTALLER
// Run this function ONCE to install all time-driven triggers
// ════════════════════════════════════════════════════════════════
function installAllTriggers() {
  // Remove all existing triggers first (clean slate)
  const existingTriggers = ScriptApp.getProjectTriggers();
  existingTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  Logger.log('Cleared ' + existingTriggers.length + ' existing triggers');

  // Flow A: Notion → Sheets (every 4 hours)
  ScriptApp.newTrigger('syncNotionToSheets')
    .timeBased()
    .everyHours(4)
    .create();
  Logger.log('Flow A trigger installed (every 4h)');

  // Flow B: Sheets → Notion (every 6 hours)
  ScriptApp.newTrigger('syncSheetsToNotion')
    .timeBased()
    .everyHours(6)
    .create();
  Logger.log('Flow B trigger installed (every 6h)');

  // Flow C: Opportunities → Supabase (every 4 hours)
  ScriptApp.newTrigger('syncOpportunitiesToSupabase')
    .timeBased()
    .everyHours(4)
    .create();
  Logger.log('Flow C trigger installed (every 4h)');

  // Flow D: Follow-up reminders (daily at 9am PT)
  ScriptApp.newTrigger('sendFollowUpReminders')
    .timeBased()
    .atHour(9)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
  Logger.log('Flow D trigger installed (daily 9am PT)');

  // Flow E: Gmail → Activities (every 1 hour)
  ScriptApp.newTrigger('syncGmailToActivities')
    .timeBased()
    .everyHours(1)
    .create();
  Logger.log('Flow E trigger installed (every 1h)');

  // Flow F: Calendar <-> Milestones (every 30 minutes)
  ScriptApp.newTrigger('syncCalendarMilestones')
    .timeBased()
    .everyMinutes(30)
    .create();
  Logger.log('Flow F trigger installed (every 30min)');

  Logger.log('All 6 triggers installed successfully!');
  Logger.log('Check Triggers panel to confirm.');
}

// Verify all triggers are installed
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('Total triggers: ' + triggers.length);
  triggers.forEach(function(t) {
    Logger.log('- ' + t.getHandlerFunction() + ' | ' + t.getEventType() + ' | ' + t.getTriggerSource());
  });
}
