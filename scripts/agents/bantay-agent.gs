// ════════════════════════════════════════════════════════════════
// IK26 AGENT: BANTAY (Guard / Watcher)
// ════════════════════════════════════════════════════════════════
// Protects the integrity of the IK26 data pipeline.
// Monitors sync health across Flows A-F, validates Notion schemas,
// detects consecutive failures, and auto-retries safe operations.
//
// Trigger: Every 30 minutes
// Owner: Monica Blanco (monica.istorya@gmail.com)
// Stack: Google Apps Script + Notion API + Gmail
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getBantayConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_CONTACTS_DB: props.getProperty('NOTION_CONTACTS_DB'),
    NOTION_ACTIVITIES_DB: props.getProperty('NOTION_ACTIVITIES_DB'),
    NOTION_ORGS_DB: props.getProperty('NOTION_ORGS_DB'),
    SHEET_ID: props.getProperty('SHEET_ID'),
    ALERT_EMAIL: 'monica.istorya@gmail.com',
    // How many consecutive failures before alerting
    FAILURE_THRESHOLD: 2,
  };
}

// ── Expected Schemas ───────────────────────────────────────────
// These define the minimum required properties for each Notion DB.
// If a property is missing or its type changes, Bantay flags it.
const EXPECTED_SCHEMAS = {
  Opportunities: {
    'Name': 'title',
    'Stage': 'select',
    'Type': 'select',
    'Potential Value': 'number',
    'Expected Close Date': 'date',
    'Confidence %': 'number',
    'Projected Value': 'number',
    'Priority Rank': 'number',
    'Next Action': 'rich_text',
    'Next Action Date': 'date',
    'Source': 'select',
    'IK Chapter': 'select',
    'Partner Tier': 'select',
    'In-Kind vs Cash': 'select',
    'Organization': 'relation',
    'Primary Contact': 'relation',
  },
  Contacts: {
    'Name': 'title',
    'Email': 'email',
    'Role': 'rich_text',
    'Organization': 'relation',
    'Phone': 'phone_number',
  },
  Activities: {
    'Name': 'title',
    'Date': 'date',
    'Type': 'select',
    'Outcome': 'select',
    'Opportunity': 'relation',
    'Contact': 'relation',
  },
};

// ── Main Entry Point ───────────────────────────────────────────
function runBantay() {
  const config = getBantayConfig();
  const startTime = new Date();
  const issues = [];

  try {
    Logger.log('[Bantay] Starting data integrity check...');

    // 1. Check Sync Log for consecutive failures
    const syncIssues = checkSyncLogHealth(config);
    issues.push(...syncIssues);

    // 2. Validate Notion database schemas
    const schemaIssues = validateSchemas(config);
    issues.push(...schemaIssues);

    // 3. Check Sheets mirror staleness
    const stalenessIssues = checkSheetsStaleness(config);
    issues.push(...stalenessIssues);

    // 4. Check for orphaned data
    const orphanIssues = checkDataConsistency(config);
    issues.push(...orphanIssues);

    // Report results
    const duration = Math.round((new Date() - startTime) / 1000);

    if (issues.length > 0) {
      Logger.log(`[Bantay] Found ${issues.length} issues. Sending alert.`);
      sendBantayAlert(config, issues);
      logToNotionSyncLog_(config, 'Bantay: Integrity Check',
        `Found ${issues.length} issues in ${duration}s. Alert sent.`, 'Warning');
    } else {
      Logger.log(`[Bantay] All clear. ${duration}s.`);
      // Only log to Notion every 4 hours to avoid noise (check if it's a "full" run)
      const hour = new Date().getHours();
      if (hour % 4 === 0) {
        logToNotionSyncLog_(config, 'Bantay: Integrity Check',
          `All systems healthy. ${duration}s.`, 'Success');
      }
    }

  } catch (err) {
    Logger.log('[Bantay] Fatal error: ' + err);
    // Always alert on fatal errors
    sendBantayAlert(config, [{
      severity: 'CRITICAL',
      source: 'Bantay Agent',
      message: `Bantay itself encountered a fatal error: ${err}`,
      action: 'Check Apps Script execution logs immediately.',
    }]);
  }
}

// ── 1. Check Sync Log for Consecutive Failures ─────────────────
function checkSyncLogHealth(config) {
  const issues = [];

  try {
    // Query the Notion Sync Log for recent entries
    const recentLogs = queryNotionDB_b(config.NOTION_API_KEY, config.NOTION_SYNCLOG_DB, {
      sorts: [{ property: 'Timestamp', direction: 'descending' }],
      page_size: 50
    });

    if (recentLogs.length === 0) {
      issues.push({
        severity: 'WARNING',
        source: 'Sync Log',
        message: 'No entries found in the Sync Log. Either syncs have not run, or the log database is empty.',
        action: 'Verify that Flows A-F triggers are active in Apps Script.',
      });
      return issues;
    }

    // Group logs by action/flow name and check for consecutive failures
    const flowGroups = {};
    recentLogs.forEach(log => {
      const action = getNotionSelect_b(log.properties.Action) ||
                     getNotionTitle_b(log.properties.Name).split(' - ')[0];
      const result = getNotionSelect_b(log.properties.Result);
      const timestamp = getNotionDate_b(log.properties.Timestamp);

      if (!flowGroups[action]) flowGroups[action] = [];
      flowGroups[action].push({ result, timestamp });
    });

    // Check each flow for consecutive failures
    Object.keys(flowGroups).forEach(flowName => {
      const entries = flowGroups[flowName];
      // Count consecutive failures from the most recent entry
      let consecutiveFailures = 0;
      for (const entry of entries) {
        if (entry.result === 'Failed') {
          consecutiveFailures++;
        } else {
          break;
        }
      }

      if (consecutiveFailures >= config.FAILURE_THRESHOLD) {
        issues.push({
          severity: 'CRITICAL',
          source: flowName,
          message: `${consecutiveFailures} consecutive failures detected for "${flowName}".`,
          action: `Check the Apps Script execution log for "${flowName}". The last ${consecutiveFailures} runs all failed.`,
        });
      }
    });

    // Check if any flow hasn't run in the last 8 hours
    const expectedFlows = ['Flow A', 'Flow C', 'Flow D'];
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();

    expectedFlows.forEach(flow => {
      const entries = Object.keys(flowGroups).filter(k => k.includes(flow));
      if (entries.length === 0) {
        issues.push({
          severity: 'WARNING',
          source: flow,
          message: `No sync log entries found for "${flow}". It may not be running.`,
          action: `Check that the trigger for ${flow} is active in Apps Script.`,
        });
      } else {
        const latestEntry = flowGroups[entries[0]][0];
        if (latestEntry && latestEntry.timestamp < eightHoursAgo) {
          issues.push({
            severity: 'WARNING',
            source: flow,
            message: `"${flow}" has not run in over 8 hours. Last run: ${latestEntry.timestamp}.`,
            action: `Check the Apps Script trigger for ${flow}. It may be paused or erroring silently.`,
          });
        }
      }
    });

  } catch (err) {
    issues.push({
      severity: 'WARNING',
      source: 'Sync Log Check',
      message: `Could not read the Sync Log: ${err}`,
      action: 'Verify NOTION_SYNCLOG_DB property is set correctly.',
    });
  }

  return issues;
}

// ── 2. Validate Notion Database Schemas ────────────────────────
function validateSchemas(config) {
  const issues = [];

  const dbMap = {
    Opportunities: config.NOTION_OPPS_DB,
    Contacts: config.NOTION_CONTACTS_DB,
    Activities: config.NOTION_ACTIVITIES_DB,
  };

  Object.keys(EXPECTED_SCHEMAS).forEach(dbName => {
    const dbId = dbMap[dbName];
    if (!dbId) {
      issues.push({
        severity: 'WARNING',
        source: `Schema: ${dbName}`,
        message: `No database ID configured for ${dbName}.`,
        action: `Set NOTION_${dbName.toUpperCase()}_DB in Script Properties.`,
      });
      return;
    }

    try {
      const schema = fetchNotionSchema_b(config.NOTION_API_KEY, dbId);
      const expected = EXPECTED_SCHEMAS[dbName];

      Object.keys(expected).forEach(propName => {
        if (!schema[propName]) {
          issues.push({
            severity: 'CRITICAL',
            source: `Schema: ${dbName}`,
            message: `Missing property "${propName}" in ${dbName} database.`,
            action: `The property "${propName}" (expected type: ${expected[propName]}) is missing. Flows that depend on this property will fail.`,
          });
        } else if (schema[propName].type !== expected[propName]) {
          issues.push({
            severity: 'CRITICAL',
            source: `Schema: ${dbName}`,
            message: `Property "${propName}" in ${dbName} has type "${schema[propName].type}" but expected "${expected[propName]}".`,
            action: `This type mismatch will cause sync errors. Check if the property was accidentally changed in Notion.`,
          });
        }
      });

    } catch (err) {
      issues.push({
        severity: 'WARNING',
        source: `Schema: ${dbName}`,
        message: `Could not fetch schema for ${dbName}: ${err}`,
        action: 'Check Notion API key permissions and database ID.',
      });
    }
  });

  return issues;
}

// ── 3. Check Sheets Mirror Staleness ───────────────────────────
function checkSheetsStaleness(config) {
  const issues = [];

  try {
    const spreadsheet = SpreadsheetApp.openById(config.SHEET_ID);

    // Check the sync_log sheet for the last sync timestamp
    const syncLogSheet = spreadsheet.getSheetByName('sync_log');
    if (!syncLogSheet || syncLogSheet.getLastRow() <= 1) {
      issues.push({
        severity: 'WARNING',
        source: 'Sheets Mirror',
        message: 'No sync_log sheet found or it is empty.',
        action: 'Run Flow A manually to initialize the sync_log.',
      });
      return issues;
    }

    const data = syncLogSheet.getDataRange().getValues();
    const lastRow = data[data.length - 1];
    const lastTimestamp = lastRow[0]; // First column is timestamp

    if (lastTimestamp) {
      const lastSyncDate = new Date(lastTimestamp);
      const hoursSinceSync = (Date.now() - lastSyncDate.getTime()) / (1000 * 60 * 60);

      if (hoursSinceSync > 12) {
        issues.push({
          severity: 'WARNING',
          source: 'Sheets Mirror',
          message: `Sheets mirror has not been updated in ${Math.round(hoursSinceSync)} hours. Last sync: ${lastTimestamp}.`,
          action: 'Flow A (Notion to Sheets) may not be running. Check its trigger.',
        });
      }
    }

    // Check that expected sheets exist
    const expectedSheets = ['Opportunities', 'Activities', 'sync_log'];
    expectedSheets.forEach(name => {
      if (!spreadsheet.getSheetByName(name)) {
        issues.push({
          severity: 'WARNING',
          source: 'Sheets Mirror',
          message: `Expected sheet "${name}" not found in the Ops Mirror spreadsheet.`,
          action: `Run Flow A to create the "${name}" sheet.`,
        });
      }
    });

  } catch (err) {
    issues.push({
      severity: 'WARNING',
      source: 'Sheets Mirror',
      message: `Could not access the Ops Mirror spreadsheet: ${err}`,
      action: 'Check SHEET_ID in Script Properties. The spreadsheet may have been moved or permissions changed.',
    });
  }

  return issues;
}

// ── 4. Check Data Consistency ──────────────────────────────────
function checkDataConsistency(config) {
  const issues = [];

  try {
    // Check for opportunities with past Next Action Dates and no recent activity
    const today = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
    const sevenDaysAgo = Utilities.formatDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      'America/Los_Angeles', 'yyyy-MM-dd'
    );

    const staleOpps = queryNotionDB_b(config.NOTION_API_KEY, config.NOTION_OPPS_DB, {
      filter: {
        and: [
          { property: 'Next Action Date', date: { before: sevenDaysAgo } },
          { property: 'Stage', select: { does_not_equal: 'Confirmed' } },
          { property: 'Stage', select: { does_not_equal: 'Declined / Closed' } },
        ]
      }
    });

    if (staleOpps.length > 0) {
      const names = staleOpps.map(o => getNotionTitle_b(o.properties.Name)).join(', ');
      issues.push({
        severity: 'INFO',
        source: 'Data Consistency',
        message: `${staleOpps.length} opportunities have Next Action Dates more than 7 days overdue: ${names}.`,
        action: 'These may need updated Next Action Dates or should be moved to "Declined / Closed" if no longer active.',
      });
    }

  } catch (err) {
    Logger.log(`[Bantay] Data consistency check error: ${err}`);
  }

  return issues;
}

// ── Alert Email ────────────────────────────────────────────────
function sendBantayAlert(config, issues) {
  const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
  const warningCount = issues.filter(i => i.severity === 'WARNING').length;
  const infoCount = issues.filter(i => i.severity === 'INFO').length;

  const severityColors = {
    CRITICAL: { bg: '#fef2f2', border: '#dc2626', text: '#991b1b' },
    WARNING: { bg: '#fffbeb', border: '#d97706', text: '#92400e' },
    INFO: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af' },
  };

  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: ${criticalCount > 0 ? '#dc2626' : '#d97706'}; border-bottom: 3px solid ${criticalCount > 0 ? '#dc2626' : '#d97706'}; padding-bottom: 8px;">
        Bantay Alert: ${issues.length} Issue${issues.length > 1 ? 's' : ''} Detected
      </h2>
      <p style="color: #6b7280; font-size: 0.875rem;">
        ${criticalCount} critical, ${warningCount} warnings, ${infoCount} info
      </p>
  `;

  // Sort: CRITICAL first, then WARNING, then INFO
  const sortOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  issues.sort((a, b) => sortOrder[a.severity] - sortOrder[b.severity]);

  issues.forEach(issue => {
    const colors = severityColors[issue.severity] || severityColors.INFO;
    html += `
      <div style="margin: 12px 0; padding: 12px; background: ${colors.bg}; border-left: 3px solid ${colors.border}; border-radius: 4px;">
        <strong style="color: ${colors.text}; font-size: 0.75rem;">${issue.severity}</strong>
        <span style="color: #6b7280; font-size: 0.75rem;"> | ${issue.source}</span><br>
        <span style="color: #1a1a1a; display: block; margin-top: 4px;">${issue.message}</span>
        <span style="color: #6b7280; font-size: 0.875rem; display: block; margin-top: 4px;">
          <strong>Action:</strong> ${issue.action}
        </span>
      </div>
    `;
  });

  html += `
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.75rem;">
        Bantay Agent | IK26 Ops Center | Runs every 30 minutes
      </p>
    </div>
  `;

  const subject = criticalCount > 0
    ? `[CRITICAL] Bantay Alert: ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}`
    : `[Bantay] ${warningCount} warning${warningCount > 1 ? 's' : ''} detected`;

  GmailApp.sendEmail(config.ALERT_EMAIL, subject, issues.map(i => `[${i.severity}] ${i.source}: ${i.message}\nAction: ${i.action}`).join('\n\n'), {
    htmlBody: html,
    name: 'IK26 Bantay Agent'
  });
}

// ── Notion API Helpers (namespaced with _b) ────────────────────
function queryNotionDB_b(apiKey, dbId, params) {
  const url = `https://api.notion.com/v1/databases/${dbId}/query`;
  const payload = Object.assign({ page_size: 100 }, params);

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (data.object === 'error') {
    throw new Error(`Notion API error: ${data.message}`);
  }

  return data.results || [];
}

function fetchNotionSchema_b(apiKey, dbId) {
  const url = `https://api.notion.com/v1/databases/${dbId}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (data.object === 'error') {
    throw new Error(`Notion API error: ${data.message}`);
  }

  return data.properties || {};
}

// ── Property Extractors (namespaced with _b) ───────────────────
function getNotionTitle_b(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}

function getNotionSelect_b(prop) {
  if (!prop || !prop.select) return '';
  return prop.select.name || '';
}

function getNotionDate_b(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start || '';
}

// ── Notion Sync Log ────────────────────────────────────────────
function logToNotionSyncLog_(config, action, details, result) {
  const url = 'https://api.notion.com/v1/pages';

  const payload = {
    parent: { database_id: config.NOTION_SYNCLOG_DB },
    properties: {
      Name: {
        title: [{ text: { content: `${action} - ${new Date().toISOString()}` } }]
      },
      Timestamp: {
        date: { start: new Date().toISOString() }
      },
      Action: {
        select: { name: 'Bantay Agent' }
      },
      'Source Tool': {
        select: { name: 'Apps Script' }
      },
      Result: {
        select: { name: result }
      },
      Details: {
        rich_text: [{ text: { content: details.substring(0, 2000) } }]
      }
    }
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${config.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log('[Bantay] Failed to log to Notion Sync Log: ' + err);
  }
}

// ── Trigger Setup (Run once manually) ──────────────────────────
function setupBantayTrigger() {
  // Delete existing Bantay triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runBantay') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Every 30 minutes
  ScriptApp.newTrigger('runBantay')
    .timeBased()
    .everyMinutes(30)
    .create();

  Logger.log('[Bantay] Trigger created: runs every 30 minutes');
}
