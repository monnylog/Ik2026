// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW B: Sheets → Notion Write-back
// ════════════════════════════════════════════════════════════════
// Writes computed fields (Confidence %, Projected Value, Priority Rank)
// from Sheets back to Notion Opportunities
// Trigger: Time-driven every 6 hours (runs AFTER Flow A)
// Owner: Monica Blanco (monica.istorya@gmail.com)
// 
// PROTECTED FIELDS (NEVER written by automation):
// - Name, Notes, Relationship Story, Relations, Stage, Content Needs,
//   Fulfillment Checklist, and all rich_text fields
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    SHEET_ID: props.getProperty('SHEET_ID'),
  };
}

// ── Main Write-back Function ───────────────────────────────────
function syncSheetsToNotion() {
  const config = getConfig();
  const spreadsheet = SpreadsheetApp.openById(config.SHEET_ID);
  const startTime = new Date();
  
  try {
    Logger.log('Starting Sheets → Notion write-back (Flow B)...');
    
    const sheet = spreadsheet.getSheetByName('Opportunities');
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No opportunities to sync');
      return { count: 0 };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices for safe write-back fields
    const colMap = {
      pageId: headers.indexOf('notion_page_id'),
      confidence: headers.indexOf('confidence_pct'),
      projected: headers.indexOf('projected_value'),
      priority: headers.indexOf('priority_rank'),
    };
    
    if (Object.values(colMap).some(i => i === -1)) {
      throw new Error('Required columns not found in Opportunities sheet');
    }
    
    let updateCount = 0;
    
    // Process each row (skip header)
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const pageId = row[colMap.pageId];
      
      if (!pageId) continue;
      
      const updates = {};
      
      // Only include fields that have values
      if (row[colMap.confidence] !== null && row[colMap.confidence] !== '') {
        updates['Confidence %'] = { number: Number(row[colMap.confidence]) };
      }
      
      if (row[colMap.projected] !== null && row[colMap.projected] !== '') {
        updates['Projected Value'] = { number: Number(row[colMap.projected]) };
      }
      
      if (row[colMap.priority] !== null && row[colMap.priority] !== '') {
        updates['Priority Rank'] = { number: Number(row[colMap.priority]) };
      }
      
      // Only update if we have changes
      if (Object.keys(updates).length > 0) {
        const success = updateNotionPage(config.NOTION_API_KEY, pageId, updates);
        if (success) {
          updateCount++;
        }
        
        // Rate limiting: pause between requests
        Utilities.sleep(200);
      }
    }
    
    const syncResult = {
      timestamp: new Date().toISOString(),
      action: 'Sheets → Notion Write-back',
      count: updateCount,
      duration: Math.round((new Date() - startTime) / 1000) + 's',
    };
    
    logToSheet(spreadsheet, 'sync_log', syncResult);
    logToNotion(config, 'Flow B: Sheets → Notion', `Updated ${updateCount} opportunities`, 'Success');
    
    Logger.log(`Write-back complete: ${updateCount} opportunities updated`);
    return syncResult;
    
  } catch (err) {
    Logger.log('Error in syncSheetsToNotion: ' + err);
    logToNotion(config, 'Flow B: Sheets → Notion', err.toString(), 'Failed');
    throw err;
  }
}

// ── Update Notion Page ─────────────────────────────────────────
function updateNotionPage(apiKey, pageId, properties) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  
  const payload = { properties };
  
  const options = {
    method: 'patch',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (data.object === 'error') {
      Logger.log(`Error updating page ${pageId}: ${data.message}`);
      return false;
    }
    
    return true;
  } catch (err) {
    Logger.log(`Exception updating page ${pageId}: ${err}`);
    return false;
  }
}

// ── Sheet Helpers ──────────────────────────────────────────────
function logToSheet(spreadsheet, sheetName, logData) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['timestamp', 'action', 'count', 'duration', 'notes']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');
  }
  
  sheet.appendRow([
    logData.timestamp,
    logData.action,
    logData.count || 0,
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
        select: { name: 'Write-back' }
      },
      Database: {
        select: { name: 'Opportunities' }
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
function setupFlowBTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncSheetsToNotion') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: every 6 hours
  ScriptApp.newTrigger('syncSheetsToNotion')
    .timeBased()
    .everyHours(6)
    .create();
  
  Logger.log('Flow B trigger created: runs every 6 hours');
}
