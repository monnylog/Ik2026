// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW D: Daily Digest & Notifications
// ════════════════════════════════════════════════════════════════
// Sends daily action digest email to monica.istorya@gmail.com
// + immediate notifications on stage changes to "Confirmed" or "In negotiation"
// Trigger: Time-driven daily at 8:00 AM PT
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    SHEET_ID: props.getProperty('SHEET_ID'),
    DIGEST_EMAIL: 'monica.istorya@gmail.com',
  };
}

// ── Daily Digest Email ─────────────────────────────────────────
function sendDailyDigest() {
  const config = getConfig();
  
  try {
    Logger.log('Generating daily digest...');
    
    const today = new Date();
    const todayStr = Utilities.formatDate(today, 'America/Los_Angeles', 'yyyy-MM-dd');
    
    // Query opportunities with next action date = today
    const dueToday = queryOpportunitiesByNextAction(config, todayStr);
    
    // Query opportunities with overdue next actions
    const overdue = queryOverdueOpportunities(config, todayStr);
    
    if (dueToday.length === 0 && overdue.length === 0) {
      Logger.log('No action items for today — skipping digest');
      return;
    }
    
    // Build email
    const emailBody = buildDigestEmail(dueToday, overdue, todayStr);
    const subject = `IK26 Ops Digest — ${Utilities.formatDate(today, 'America/Los_Angeles', 'MMM d, yyyy')}`;
    
    GmailApp.sendEmail(config.DIGEST_EMAIL, subject, '', {
      htmlBody: emailBody,
      name: 'IK26 Ops Center'
    });
    
    Logger.log(`Digest sent to ${config.DIGEST_EMAIL}: ${dueToday.length} due today, ${overdue.length} overdue`);
    
    logToNotion(config, 'Flow D: Daily Digest', 
      `Sent digest: ${dueToday.length} due today, ${overdue.length} overdue`, 'Success');
    
  } catch (err) {
    Logger.log('Error sending daily digest: ' + err);
    logToNotion(config, 'Flow D: Daily Digest', err.toString(), 'Failed');
  }
}

// ── Stage Change Notifications ─────────────────────────────────
function checkStageChanges() {
  const config = getConfig();
  
  try {
    Logger.log('Checking for stage changes...');
    
    const spreadsheet = SpreadsheetApp.openById(config.SHEET_ID);
    const sheet = spreadsheet.getSheetByName('Opportunities');
    
    if (!sheet || sheet.getLastRow() <= 1) {
      Logger.log('No opportunities in sheet');
      return;
    }
    
    // Get current Notion data
    const currentOpps = queryAllOpportunities(config);
    
    // Get last snapshot from sheet
    const sheetData = sheet.getDataRange().getValues();
    const headers = sheetData[0];
    const stageCol = headers.indexOf('stage');
    const idCol = headers.indexOf('notion_page_id');
    const nameCol = headers.indexOf('name');
    
    if (stageCol === -1 || idCol === -1) {
      Logger.log('Required columns not found');
      return;
    }
    
    // Build map of previous stages
    const previousStages = {};
    for (let i = 1; i < sheetData.length; i++) {
      const id = sheetData[i][idCol];
      const stage = sheetData[i][stageCol];
      if (id && stage) {
        previousStages[id] = stage;
      }
    }
    
    // Check for stage changes to "Confirmed" or "In negotiation"
    const notifications = [];
    currentOpps.forEach(opp => {
      const currentStage = getNotionSelect(opp.properties.Stage);
      const previousStage = previousStages[opp.id];
      
      if (previousStage && previousStage !== currentStage) {
        if (currentStage === 'Confirmed' || currentStage === 'In negotiation') {
          notifications.push({
            name: getNotionTitle(opp.properties.Name),
            previousStage,
            currentStage,
            url: opp.url
          });
        }
      }
    });
    
    // Send notifications
    if (notifications.length > 0) {
      sendStageChangeEmail(config, notifications);
      Logger.log(`Sent ${notifications.length} stage change notifications`);
    }
    
  } catch (err) {
    Logger.log('Error checking stage changes: ' + err);
  }
}

// ── Query Functions ────────────────────────────────────────────
function queryOpportunitiesByNextAction(config, dateStr) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_OPPS_DB}/query`;
  
  const payload = {
    filter: {
      and: [
        {
          property: 'Next Action Date',
          date: { equals: dateStr }
        },
        {
          property: 'Stage',
          select: { does_not_equal: 'Confirmed' }
        },
        {
          property: 'Stage',
          select: { does_not_equal: 'Declined / Closed' }
        }
      ]
    }
  };
  
  return queryNotion(config.NOTION_API_KEY, url, payload);
}

function queryOverdueOpportunities(config, todayStr) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_OPPS_DB}/query`;
  
  const payload = {
    filter: {
      and: [
        {
          property: 'Next Action Date',
          date: { before: todayStr }
        },
        {
          property: 'Stage',
          select: { does_not_equal: 'Confirmed' }
        },
        {
          property: 'Stage',
          select: { does_not_equal: 'Declined / Closed' }
        }
      ]
    }
  };
  
  return queryNotion(config.NOTION_API_KEY, url, payload);
}

function queryAllOpportunities(config) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_OPPS_DB}/query`;
  const payload = { page_size: 100 };
  return queryNotion(config.NOTION_API_KEY, url, payload);
}

function queryNotion(apiKey, url, payload) {
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

// ── Email Builders ─────────────────────────────────────────────
function buildDigestEmail(dueToday, overdue, dateStr) {
  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #d97706; border-bottom: 3px solid #d97706; padding-bottom: 8px;">
        IK26 Ops Digest — ${dateStr}
      </h2>
  `;
  
  if (dueToday.length > 0) {
    html += `
      <h3 style="color: #059669; margin-top: 24px;">✅ Due Today (${dueToday.length})</h3>
      <ul style="list-style: none; padding: 0;">
    `;
    dueToday.forEach(opp => {
      const name = getNotionTitle(opp.properties.Name);
      const nextAction = getNotionRichText(opp.properties['Next Action']);
      const stage = getNotionSelect(opp.properties.Stage);
      const url = opp.url;
      
      html += `
        <li style="margin: 12px 0; padding: 12px; background: #f0fdf4; border-left: 3px solid #059669; border-radius: 4px;">
          <strong><a href="${url}" style="color: #065f46; text-decoration: none;">${name}</a></strong><br>
          <span style="color: #6b7280; font-size: 0.875rem;">Stage: ${stage}</span><br>
          <span style="color: #374151; margin-top: 4px; display: block;">${nextAction || 'No action specified'}</span>
        </li>
      `;
    });
    html += `</ul>`;
  }
  
  if (overdue.length > 0) {
    html += `
      <h3 style="color: #dc2626; margin-top: 24px;">⚠️ Overdue (${overdue.length})</h3>
      <ul style="list-style: none; padding: 0;">
    `;
    overdue.forEach(opp => {
      const name = getNotionTitle(opp.properties.Name);
      const nextAction = getNotionRichText(opp.properties['Next Action']);
      const actionDate = getNotionDate(opp.properties['Next Action Date']);
      const url = opp.url;
      
      html += `
        <li style="margin: 12px 0; padding: 12px; background: #fef2f2; border-left: 3px solid #dc2626; border-radius: 4px;">
          <strong><a href="${url}" style="color: #991b1b; text-decoration: none;">${name}</a></strong><br>
          <span style="color: #dc2626; font-size: 0.875rem;">Due: ${actionDate}</span><br>
          <span style="color: #374151; margin-top: 4px; display: block;">${nextAction || 'No action specified'}</span>
        </li>
      `;
    });
    html += `</ul>`;
  }
  
  html += `
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
        Automated by IK26 Ops Center • <a href="https://www.notion.so/b60f493a780e4c5ca053f14b3ca5ad23" style="color: #d97706;">View in Notion</a>
      </p>
    </div>
  `;
  
  return html;
}

function sendStageChangeEmail(config, notifications) {
  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669; border-bottom: 3px solid #059669; padding-bottom: 8px;">
        🎉 IK26 Stage Changes
      </h2>
      <p>The following opportunities have moved to a new stage:</p>
      <ul style="list-style: none; padding: 0;">
  `;
  
  notifications.forEach(notif => {
    html += `
      <li style="margin: 12px 0; padding: 12px; background: #f0fdf4; border-left: 3px solid #059669; border-radius: 4px;">
        <strong><a href="${notif.url}" style="color: #065f46; text-decoration: none;">${notif.name}</a></strong><br>
        <span style="color: #6b7280; font-size: 0.875rem;">${notif.previousStage} → <strong>${notif.currentStage}</strong></span>
      </li>
    `;
  });
  
  html += `
      </ul>
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
        Automated by IK26 Ops Center
      </p>
    </div>
  `;
  
  GmailApp.sendEmail(config.DIGEST_EMAIL, 'IK26 Stage Change Alert', '', {
    htmlBody: html,
    name: 'IK26 Ops Center'
  });
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

function getNotionDate(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start || '';
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
        select: { name: 'Notification sent' }
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
function setupFlowDTriggers() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'sendDailyDigest' || 
        trigger.getHandlerFunction() === 'checkStageChanges') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Daily digest at 8:00 AM PT
  ScriptApp.newTrigger('sendDailyDigest')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();
  
  // Stage change check every 4 hours
  ScriptApp.newTrigger('checkStageChanges')
    .timeBased()
    .everyHours(4)
    .create();
  
  Logger.log('Flow D triggers created: daily digest (8AM PT) + stage change checks (every 4h)');
}
