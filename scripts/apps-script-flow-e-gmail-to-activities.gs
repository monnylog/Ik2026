// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW E: Gmail → Activities (Optional)
// ════════════════════════════════════════════════════════════════
// Auto-creates Activity records in Notion when known contacts reply
// Requires: Gmail API scope (gmail.readonly)
// Trigger: Time-driven every 15 minutes (optional)
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_CONTACTS_DB: props.getProperty('NOTION_CONTACTS_DB'),
    NOTION_ACTIVITIES_DB: props.getProperty('NOTION_ACTIVITIES_DB'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    MONITORED_EMAIL: 'monica.istorya@gmail.com',
  };
}

// ── Main Sync Function ─────────────────────────────────────────
function syncGmailToActivities() {
  const config = getConfig();
  
  try {
    Logger.log('Checking Gmail for contact replies...');
    
    // Get all known contacts from Notion
    const contacts = getAllContacts(config);
    Logger.log(`Found ${contacts.length} contacts in Notion`);
    
    if (contacts.length === 0) {
      Logger.log('No contacts found — skipping Gmail sync');
      return;
    }
    
    // Build email → contact ID map
    const emailMap = {};
    contacts.forEach(contact => {
      const email = getNotionEmail(contact.properties.Email);
      if (email) {
        emailMap[email.toLowerCase()] = {
          id: contact.id,
          name: getNotionTitle(contact.properties.Name),
          org: getNotionRelation(contact.properties.Organization),
        };
      }
    });
    
    // Get unread emails from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const query = `is:unread after:${Math.floor(oneHourAgo.getTime() / 1000)} from:(-me)`;
    const threads = GmailApp.search(query, 0, 50);
    
    Logger.log(`Found ${threads.length} unread threads`);
    
    let createdCount = 0;
    let skippedCount = 0;
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      const latestMessage = messages[messages.length - 1];
      const fromEmail = extractEmail(latestMessage.getFrom());
      
      if (!fromEmail || !emailMap[fromEmail.toLowerCase()]) {
        skippedCount++;
        return; // Not a known contact
      }
      
      const contact = emailMap[fromEmail.toLowerCase()];
      
      // Check if we already created an activity for this message
      const messageId = latestMessage.getId();
      const existingActivity = checkExistingActivity(config, messageId);
      if (existingActivity) {
        skippedCount++;
        return; // Already logged
      }
      
      // Create activity in Notion
      const subject = thread.getFirstMessageSubject();
      const snippet = latestMessage.getPlainBody().substring(0, 500);
      const receivedDate = latestMessage.getDate();
      
      const success = createActivity(config, {
        name: `Email re: ${subject}`,
        date: receivedDate.toISOString(),
        type: 'Email',
        contactId: contact.id,
        outcome: 'Reply received',
        notes: `From: ${contact.name}\nSubject: ${subject}\n\n${snippet}...`,
        messageId: messageId,
      });
      
      if (success) {
        createdCount++;
        // Optionally mark as read or apply label
        // thread.markRead();
      }
    });
    
    Logger.log(`Gmail sync complete: ${createdCount} activities created, ${skippedCount} skipped`);
    
    if (createdCount > 0) {
      logToNotion(config, 'Flow E: Gmail → Activities', 
        `Created ${createdCount} activities from email replies`, 'Success');
    }
    
  } catch (err) {
    Logger.log('Error in syncGmailToActivities: ' + err);
    logToNotion(config, 'Flow E: Gmail → Activities', err.toString(), 'Failed');
  }
}

// ── Get All Contacts ───────────────────────────────────────────
function getAllContacts(config) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_CONTACTS_DB}/query`;
  
  const payload = { page_size: 100 };
  
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
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.object === 'error') {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  return data.results || [];
}

// ── Check Existing Activity ────────────────────────────────────
function checkExistingActivity(config, messageId) {
  // We could store the Gmail message ID in a Notion property for deduplication
  // For now, this is a simplified check — enhance as needed
  // TODO: Add a "Gmail Message ID" property to Activities DB
  return false;
}

// ── Create Activity in Notion ──────────────────────────────────
function createActivity(config, data) {
  const url = 'https://api.notion.com/v1/pages';
  
  const payload = {
    parent: { database_id: config.NOTION_ACTIVITIES_DB },
    properties: {
      Name: {
        title: [{ text: { content: data.name } }]
      },
      Date: {
        date: { start: data.date }
      },
      Type: {
        select: { name: data.type }
      },
      Outcome: {
        select: { name: data.outcome }
      },
      Notes: {
        rich_text: [{ text: { content: data.notes } }]
      },
    }
  };
  
  // Add contact relation if provided
  if (data.contactId) {
    payload.properties.Contact = {
      relation: [{ id: data.contactId }]
    };
  }
  
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
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.object === 'error') {
      Logger.log(`Error creating activity: ${result.message}`);
      return false;
    }
    
    return true;
  } catch (err) {
    Logger.log(`Exception creating activity: ${err}`);
    return false;
  }
}

// ── Helpers ────────────────────────────────────────────────────
function extractEmail(fromString) {
  const match = fromString.match(/<(.+?)>/);
  return match ? match[1] : fromString;
}

function getNotionTitle(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}

function getNotionEmail(prop) {
  if (!prop || !prop.email) return '';
  return prop.email;
}

function getNotionRelation(prop) {
  if (!prop || !prop.relation || prop.relation.length === 0) return null;
  return prop.relation[0].id;
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
        select: { name: 'Create' }
      },
      Database: {
        select: { name: 'Activities' }
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
function setupFlowETrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncGmailToActivities') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: every 15 minutes
  ScriptApp.newTrigger('syncGmailToActivities')
    .timeBased()
    .everyMinutes(15)
    .create();
  
  Logger.log('Flow E trigger created: runs every 15 minutes');
  Logger.log('⚠️ IMPORTANT: Enable Gmail API in Advanced Google Services for this project');
}
