// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW D: Daily Digest & Notifications
// ════════════════════════════════════════════════════════════════
// Sends daily action digest email to monica.istorya@gmail.com
// + immediate notifications on stage changes to "Confirmed" or "In negotiation"
// Trigger: Time-driven daily at 8:00 AM PT
// Owner: Monica Blanco (monica.istorya@gmail.com)
//
// v2.0 — Actionable Digest: each item includes numbered decision options
//   1 = Have Tulay draft a follow-up email
//   2 = Push deadline 7 days
//   3 = Mark declined/closed
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    GEMINI_API_KEY: props.getProperty('GEMINI_API_KEY'),
    SHEET_ID: props.getProperty('SHEET_ID'),
    DIGEST_EMAIL: 'monica.istorya@gmail.com',
    // Webapp URL for reply actions — set after deploying as a web app
    WEBAPP_URL: props.getProperty('FLOW_D_WEBAPP_URL') || '',
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
    
    // Enrich each item with a Gemini-generated suggested action
    const enrichedDueToday = dueToday.map(opp => enrichWithSuggestedAction(config, opp));
    const enrichedOverdue = overdue.map(opp => enrichWithSuggestedAction(config, opp));
    
    // Build email
    const emailBody = buildDigestEmail(enrichedDueToday, enrichedOverdue, todayStr, config);
    const subject = `IK26 Ops Digest — ${Utilities.formatDate(today, 'America/Los_Angeles', 'MMM d, yyyy')} (${dueToday.length + overdue.length} items)`;
    
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

// ── Gemini: Enrich opportunity with suggested action ───────────
function enrichWithSuggestedAction(config, opp) {
  if (!config.GEMINI_API_KEY) return { ...opp, suggestedAction: null };
  
  try {
    const name = getNotionTitle(opp.properties.Name);
    const stage = getNotionSelect(opp.properties.Stage);
    const nextAction = getNotionRichText(opp.properties['Next Action']);
    const type = getNotionSelect(opp.properties.Type);
    const actionDate = getNotionDate(opp.properties['Next Action Date']);
    
    const prompt = `You are the IK26 Ops assistant for Isang Kusina 2026, a Filipino-American culinary event in Las Vegas on May 22, 2026.

Opportunity: "${name}"
Type: ${type || 'Sponsorship/Partnership'}
Stage: ${stage}
Last noted action: ${nextAction || 'None'}
Action was due: ${actionDate}

In one short sentence (max 15 words), what is the single most useful next action for this opportunity? Be specific and direct. Do not start with "You should" or "Consider". Just state the action.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 60, temperature: 0.3 }
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    const suggestion = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    
    Utilities.sleep(200); // Rate limit buffer
    return { ...opp, suggestedAction: suggestion };
    
  } catch (err) {
    Logger.log('Gemini enrichment failed for opp: ' + err);
    return { ...opp, suggestedAction: null };
  }
}

// ── Web App: Handle Reply Actions ─────────────────────────────
// Deploy this file as a Web App (Execute as: Me, Access: Anyone with link)
// Then set FLOW_D_WEBAPP_URL in Script Properties
function doGet(e) {
  const action = e.parameter.action;   // 'tulay', 'push', 'decline'
  const oppId = e.parameter.id;
  const oppName = decodeURIComponent(e.parameter.name || '');
  
  if (!action || !oppId) {
    return HtmlService.createHtmlOutput('<p>Missing parameters.</p>');
  }
  
  const config = getConfig();
  
  try {
    if (action === 'tulay') {
      // Trigger Tulay to draft a follow-up for this opportunity
      triggerTulayDraft(config, oppId, oppName);
      return HtmlService.createHtmlOutput(`<p style="font-family:sans-serif;padding:20px;">
        <strong>Done.</strong> Tulay is drafting a follow-up for <em>${oppName}</em>. 
        Check your Gmail drafts in a few minutes.
      </p>`);
    }
    
    if (action === 'push') {
      // Push the Next Action Date 7 days forward
      pushDeadline(config, oppId, oppName);
      return HtmlService.createHtmlOutput(`<p style="font-family:sans-serif;padding:20px;">
        <strong>Done.</strong> Deadline for <em>${oppName}</em> pushed 7 days.
      </p>`);
    }
    
    if (action === 'decline') {
      // Mark the opportunity as Declined / Closed
      // NOTE: Stage is a protected field — this is an explicit human-initiated action
      markDeclined(config, oppId, oppName);
      return HtmlService.createHtmlOutput(`<p style="font-family:sans-serif;padding:20px;">
        <strong>Done.</strong> <em>${oppName}</em> marked as Declined / Closed.
      </p>`);
    }
    
    return HtmlService.createHtmlOutput('<p>Unknown action.</p>');
    
  } catch (err) {
    Logger.log('doGet error: ' + err);
    return HtmlService.createHtmlOutput(`<p style="font-family:sans-serif;padding:20px;color:red;">
      Error: ${err.toString()}
    </p>`);
  }
}

function triggerTulayDraft(config, oppId, oppName) {
  // Fetch the full opportunity from Notion
  const url = `https://api.notion.com/v1/pages/${oppId}`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${config.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(url, options);
  const opp = JSON.parse(response.getContentText());
  
  // Use Gemini to draft the follow-up (mirrors Tulay's logic)
  if (!config.GEMINI_API_KEY) {
    Logger.log('No GEMINI_API_KEY — cannot draft follow-up');
    return;
  }
  
  const name = getNotionTitle(opp.properties.Name);
  const stage = getNotionSelect(opp.properties.Stage);
  const nextAction = getNotionRichText(opp.properties['Next Action']);
  const type = getNotionSelect(opp.properties.Type);
  
  const prompt = `You are writing a follow-up email on behalf of Monica Blanco (monica.istorya@gmail.com), Co-Owner and EP of Istorya, a Filipino-American culinary and creative agency in Las Vegas.

The event is Isang Kusina 2026 — a Filipino-American culinary dinner on May 22, 2026 in Las Vegas, bringing together Filipino and Filipino-American chefs to tell the story of Filipino migration through food.

Opportunity: "${name}"
Type: ${type || 'Sponsorship/Partnership'}
Current Stage: ${stage}
Last noted action: ${nextAction || 'None'}

Write a warm, professional follow-up email. Keep it under 150 words. Do not use generic filler phrases. Be specific to the opportunity type. End with a clear, single ask.

Output format:
Subject: [subject line]
---
[email body]`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 300, temperature: 0.5 }
  };
  
  const geminiResponse = UrlFetchApp.fetch(geminiUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  
  const result = JSON.parse(geminiResponse.getContentText());
  const draft = result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!draft) {
    Logger.log('Gemini returned no draft');
    return;
  }
  
  // Parse subject and body
  const lines = draft.split('\n');
  const subjectLine = lines.find(l => l.startsWith('Subject:'));
  const subject = subjectLine ? subjectLine.replace('Subject:', '').trim() : `Follow-up: ${name}`;
  const bodyStart = lines.findIndex(l => l === '---') + 1;
  const body = lines.slice(bodyStart).join('\n').trim();
  
  // Create Gmail draft
  GmailApp.createDraft(config.DIGEST_EMAIL, subject, body, {
    name: 'Monica Blanco — Istorya'
  });
  
  logToNotion(config, 'Flow D: Tulay Draft', `Draft created for: ${name}`, 'Success');
  Logger.log(`Tulay draft created for: ${name}`);
}

function pushDeadline(config, oppId, oppName) {
  // Get current Next Action Date
  const pageUrl = `https://api.notion.com/v1/pages/${oppId}`;
  const getOptions = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${config.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28'
    },
    muteHttpExceptions: true
  };
  const response = UrlFetchApp.fetch(pageUrl, getOptions);
  const opp = JSON.parse(response.getContentText());
  
  const currentDateStr = getNotionDate(opp.properties['Next Action Date']);
  const currentDate = currentDateStr ? new Date(currentDateStr) : new Date();
  const newDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const newDateStr = Utilities.formatDate(newDate, 'UTC', 'yyyy-MM-dd');
  
  // Update the date in Notion
  const patchOptions = {
    method: 'patch',
    headers: {
      'Authorization': `Bearer ${config.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      properties: {
        'Next Action Date': { date: { start: newDateStr } }
      }
    }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(pageUrl, patchOptions);
  
  logToNotion(config, 'Flow D: Push Deadline', `${oppName} pushed to ${newDateStr}`, 'Success');
  Logger.log(`Pushed deadline for ${oppName} to ${newDateStr}`);
}

function markDeclined(config, oppId, oppName) {
  // Stage is a protected field — this action is explicitly human-initiated via the digest link
  const pageUrl = `https://api.notion.com/v1/pages/${oppId}`;
  const options = {
    method: 'patch',
    headers: {
      'Authorization': `Bearer ${config.NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      properties: {
        Stage: { select: { name: 'Declined / Closed' } }
      }
    }),
    muteHttpExceptions: true
  };
  UrlFetchApp.fetch(pageUrl, options);
  
  logToNotion(config, 'Flow D: Mark Declined', `${oppName} marked Declined / Closed`, 'Success');
  Logger.log(`Marked declined: ${oppName}`);
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
function buildDigestEmail(dueToday, overdue, dateStr, config) {
  const hasWebApp = !!config.WEBAPP_URL;
  
  function buildActionButtons(opp) {
    const name = getNotionTitle(opp.properties.Name);
    const encodedName = encodeURIComponent(name);
    const id = opp.id;
    
    if (hasWebApp) {
      const tulayUrl = `${config.WEBAPP_URL}?action=tulay&id=${id}&name=${encodedName}`;
      const pushUrl  = `${config.WEBAPP_URL}?action=push&id=${id}&name=${encodedName}`;
      const dropUrl  = `${config.WEBAPP_URL}?action=decline&id=${id}&name=${encodedName}`;
      
      return `
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <a href="${tulayUrl}" style="display:inline-block;padding:6px 14px;background:#d97706;color:#fff;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;">1 — Have Tulay draft follow-up</a>
          <a href="${pushUrl}"  style="display:inline-block;padding:6px 14px;background:#6b7280;color:#fff;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;">2 — Push deadline 7 days</a>
          <a href="${dropUrl}"  style="display:inline-block;padding:6px 14px;background:#dc2626;color:#fff;border-radius:4px;text-decoration:none;font-size:12px;font-weight:600;">3 — Mark declined</a>
        </div>`;
    } else {
      // Fallback: text instructions when web app is not deployed
      return `<p style="margin-top:8px;font-size:12px;color:#6b7280;font-style:italic;">
        Reply to this email with: <strong>1</strong> (Tulay draft) | <strong>2</strong> (push 7 days) | <strong>3</strong> (decline)<br>
        Include the opportunity name in your reply.
      </p>`;
    }
  }
  
  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 620px; margin: 0 auto;">
      <h2 style="color: #d97706; border-bottom: 3px solid #d97706; padding-bottom: 8px;">
        IK26 Ops Digest — ${dateStr}
      </h2>
      <p style="color:#6b7280;font-size:13px;margin-bottom:24px;">
        ${dueToday.length + overdue.length} item${dueToday.length + overdue.length !== 1 ? 's' : ''} need your attention. 
        Each item has three options — click a button or reply with the number.
      </p>
  `;
  
  if (dueToday.length > 0) {
    html += `<h3 style="color: #059669; margin-top: 24px;">Due Today (${dueToday.length})</h3>`;
    dueToday.forEach(opp => {
      const name = getNotionTitle(opp.properties.Name);
      const stage = getNotionSelect(opp.properties.Stage);
      const suggestion = opp.suggestedAction;
      const url = opp.url;
      
      html += `
        <div style="margin: 12px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 6px;">
          <strong><a href="${url}" style="color: #065f46; text-decoration: none; font-size:15px;">${name}</a></strong>
          <span style="color: #6b7280; font-size: 12px; margin-left:8px;">Stage: ${stage}</span>
          ${suggestion ? `<p style="color:#374151;font-size:13px;margin:8px 0 0;">${suggestion}</p>` : ''}
          ${buildActionButtons(opp)}
        </div>`;
    });
  }
  
  if (overdue.length > 0) {
    html += `<h3 style="color: #dc2626; margin-top: 28px;">Overdue (${overdue.length})</h3>`;
    overdue.forEach(opp => {
      const name = getNotionTitle(opp.properties.Name);
      const actionDate = getNotionDate(opp.properties['Next Action Date']);
      const suggestion = opp.suggestedAction;
      const url = opp.url;
      
      html += `
        <div style="margin: 12px 0; padding: 16px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 6px;">
          <strong><a href="${url}" style="color: #991b1b; text-decoration: none; font-size:15px;">${name}</a></strong>
          <span style="color: #dc2626; font-size: 12px; margin-left:8px;">Due: ${actionDate}</span>
          ${suggestion ? `<p style="color:#374151;font-size:13px;margin:8px 0 0;">${suggestion}</p>` : ''}
          ${buildActionButtons(opp)}
        </div>`;
    });
  }
  
  html += `
      <p style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 0.875rem;">
        Automated by IK26 Ops Center • <a href="https://www.notion.so" style="color: #d97706;">View in Notion</a>
      </p>
    </div>`;
  
  return html;
}

function sendStageChangeEmail(config, notifications) {
  let html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #059669; border-bottom: 3px solid #059669; padding-bottom: 8px;">
        IK26 Stage Changes
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
