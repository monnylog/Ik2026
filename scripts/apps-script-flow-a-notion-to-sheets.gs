// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW A: Notion → Sheets Mirror
// ════════════════════════════════════════════════════════════════
// Syncs Opportunities and Activities from Notion to Google Sheets
// Trigger: Time-driven every 4 hours
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_ORGS_DB: props.getProperty('NOTION_ORGS_DB'),
    NOTION_CONTACTS_DB: props.getProperty('NOTION_CONTACTS_DB'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_ACTIVITIES_DB: props.getProperty('NOTION_ACTIVITIES_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    SHEET_ID: props.getProperty('SHEET_ID'),
  };
}

// ── Main Sync Function ─────────────────────────────────────────
function syncNotionToSheets() {
  const config = getConfig();
  const spreadsheet = SpreadsheetApp.openById(config.SHEET_ID);
  const startTime = new Date();
  
  try {
    Logger.log('Starting Notion → Sheets sync (Flow A)...');
    
    // Get last sync timestamp
    const lastSync = getLastSyncTimestamp(spreadsheet, 'sync_log');
    
    // Sync Opportunities
    const oppsCount = syncOpportunities(config, spreadsheet, lastSync);
    
    // Sync Activities
    const activitiesCount = syncActivities(config, spreadsheet, lastSync);
    
    // Log sync to Sheets and Notion
    const syncResult = {
      timestamp: new Date().toISOString(),
      action: 'Notion → Sheets Mirror',
      oppsCount,
      activitiesCount,
      duration: Math.round((new Date() - startTime) / 1000) + 's',
    };
    
    logToSheet(spreadsheet, 'sync_log', syncResult);
    logToNotion(config, 'Flow A: Notion → Sheets', `Synced ${oppsCount} opportunities, ${activitiesCount} activities`, 'Success');
    
    Logger.log(`Sync complete: ${oppsCount} opportunities, ${activitiesCount} activities`);
    return syncResult;
    
  } catch (err) {
    Logger.log('Error in syncNotionToSheets: ' + err);
    logToNotion(config, 'Flow A: Notion → Sheets', err.toString(), 'Failed');
    throw err;
  }
}

// ── Sync Opportunities ─────────────────────────────────────────
function syncOpportunities(config, spreadsheet, lastSync) {
  const opps = queryNotionDatabase(config.NOTION_API_KEY, config.NOTION_OPPS_DB, lastSync);
  const sheet = getOrCreateSheet(spreadsheet, 'Opportunities');
  
  // Set up headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'notion_page_id', 'name', 'org_name', 'primary_contact', 'type', 'stage',
      'potential_value', 'expected_close', 'confidence_pct', 'projected_value',
      'priority_rank', 'next_action', 'next_action_date', 'source', 'ik_chapter',
      'partner_tier', 'in_kind_cash', 'visibility_score', 'fulfillment_status', 'last_synced'
    ]);
    sheet.getRange(1, 1, 1, 20).setFontWeight('bold').setBackground('#f3f3f3');
  }
  
  // Build lookup map of existing rows by notion_page_id
  const existingData = sheet.getDataRange().getValues();
  const rowMap = {};
  for (let i = 1; i < existingData.length; i++) {
    rowMap[existingData[i][0]] = i + 1; // Row number (1-indexed)
  }
  
  let count = 0;
  const now = new Date().toISOString();
  
  opps.forEach(opp => {
    const rowData = [
      opp.id,
      getNotionTitle(opp.properties.Name),
      getNotionRelationName(opp.properties.Organization),
      getNotionRelationName(opp.properties['Primary Contact']),
      getNotionSelect(opp.properties.Type),
      getNotionSelect(opp.properties.Stage),
      getNotionNumber(opp.properties['Potential Value']),
      getNotionDate(opp.properties['Expected Close Date']),
      getNotionNumber(opp.properties['Confidence %']),
      getNotionNumber(opp.properties['Projected Value']),
      getNotionNumber(opp.properties['Priority Rank']),
      getNotionRichText(opp.properties['Next Action']),
      getNotionDate(opp.properties['Next Action Date']),
      getNotionSelect(opp.properties.Source),
      getNotionSelect(opp.properties['IK Chapter']),
      getNotionSelect(opp.properties['Partner Tier']),
      getNotionSelect(opp.properties['In-Kind vs Cash']),
      getNotionSelect(opp.properties['Visibility Score']),
      getNotionMultiSelect(opp.properties['Fulfillment Checklist']),
      now
    ];
    
    if (rowMap[opp.id]) {
      // Update existing row
      sheet.getRange(rowMap[opp.id], 1, 1, 20).setValues([rowData]);
    } else {
      // Append new row
      sheet.appendRow(rowData);
    }
    count++;
  });
  
  return count;
}

// ── Sync Activities ────────────────────────────────────────────
function syncActivities(config, spreadsheet, lastSync) {
  const activities = queryNotionDatabase(config.NOTION_API_KEY, config.NOTION_ACTIVITIES_DB, lastSync);
  const sheet = getOrCreateSheet(spreadsheet, 'Activities');
  
  // Set up headers if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'notion_page_id', 'name', 'date', 'type', 'opp_name', 'contact_name',
      'outcome', 'next_followup', 'last_synced'
    ]);
    sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f3f3f3');
  }
  
  const existingData = sheet.getDataRange().getValues();
  const rowMap = {};
  for (let i = 1; i < existingData.length; i++) {
    rowMap[existingData[i][0]] = i + 1;
  }
  
  let count = 0;
  const now = new Date().toISOString();
  
  activities.forEach(activity => {
    const rowData = [
      activity.id,
      getNotionTitle(activity.properties.Name),
      getNotionDate(activity.properties.Date),
      getNotionSelect(activity.properties.Type),
      getNotionRelationName(activity.properties.Opportunity),
      getNotionRelationName(activity.properties.Contact),
      getNotionSelect(activity.properties.Outcome),
      getNotionDate(activity.properties['Next Follow-up Date']),
      now
    ];
    
    if (rowMap[activity.id]) {
      sheet.getRange(rowMap[activity.id], 1, 1, 9).setValues([rowData]);
    } else {
      sheet.appendRow(rowData);
    }
    count++;
  });
  
  return count;
}

// ── Notion API Helpers ─────────────────────────────────────────
function queryNotionDatabase(apiKey, databaseId, lastSync) {
  const url = `https://api.notion.com/v1/databases/${databaseId}/query`;
  
  const payload = {
    page_size: 100,
  };
  
  // Filter by last_edited_time if lastSync is provided
  if (lastSync) {
    payload.filter = {
      timestamp: 'last_edited_time',
      last_edited_time: {
        after: lastSync
      }
    };
  }
  
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

// ── Property Extractors ────────────────────────────────────────
function getNotionTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}

function getNotionRichText(prop) {
  if (!prop || !prop.rich_text) return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

function getNotionSelect(prop) {
  if (!prop || !prop.select) return '';
  return prop.select.name || '';
}

function getNotionMultiSelect(prop) {
  if (!prop || !prop.multi_select) return '';
  return prop.multi_select.map(s => s.name).join(', ');
}

function getNotionDate(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start || '';
}

function getNotionNumber(prop) {
  if (!prop || prop.number === null || prop.number === undefined) return '';
  return prop.number;
}

function getNotionRelationName(prop) {
  // For relations, we'd need to fetch the related page to get its title
  // For now, return the relation count or first ID
  if (!prop || !prop.relation || prop.relation.length === 0) return '';
  return `(${prop.relation.length} linked)`;
  // TODO: Optionally fetch related page titles for better UX
}

// ── Sheet Helpers ──────────────────────────────────────────────
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  return sheet;
}

function getLastSyncTimestamp(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return null;
  
  const data = sheet.getDataRange().getValues();
  // Assuming first column has timestamps
  const timestamps = data.slice(1).map(row => row[0]).filter(t => t);
  if (timestamps.length === 0) return null;
  
  return timestamps.sort().reverse()[0]; // Most recent
}

function logToSheet(spreadsheet, sheetName, logData) {
  const sheet = getOrCreateSheet(spreadsheet, sheetName);
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'action', 'opps_count', 'activities_count', 'duration', 'notes']);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f3f3f3');
  }
  
  sheet.appendRow([
    logData.timestamp,
    logData.action,
    logData.oppsCount || 0,
    logData.activitiesCount || 0,
    logData.duration || '',
    logData.notes || ''
  ]);
}

// ── Notion Sync Log ────────────────────────────────────────────
function logToNotion(config, action, details, result) {
  const url = 'https://api.notion.com/v1/pages';
  
  const payload = {
    parent: { database_id: config.NOTION_SYNCLOG_DB },
    properties: {
      Name: {
        title: [{ text: { content: `${action} — ${new Date().toISOString()}` } }]
      },
      Timestamp: {
        date: { start: new Date().toISOString() }
      },
      Action: {
        select: { name: action }
      },
      Database: {
        select: { name: 'Opportunities, Activities' }
      },
      'Source Tool': {
        select: { name: 'Apps Script' }
      },
      Result: {
        select: { name: result }
      },
      Details: {
        rich_text: [{ text: { content: details } }]
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
    Logger.log('Failed to log to Notion Sync Log: ' + err);
  }
}

// ── Trigger Setup (Run once manually) ──────────────────────────
function setupFlowATrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncNotionToSheets') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: every 4 hours
  ScriptApp.newTrigger('syncNotionToSheets')
    .timeBased()
    .everyHours(4)
    .create();
  
  Logger.log('Flow A trigger created: runs every 4 hours');
}
