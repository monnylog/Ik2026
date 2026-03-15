// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW F: Calendar ↔ Milestones (Optional)
// ════════════════════════════════════════════════════════════════
// Two-way sync between Google Calendar and Notion Milestones
// Calendar events tagged with [IK26] are synced to Notion
// Notion milestones with dates create calendar events
// Trigger: Time-driven every 30 minutes (optional)
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_MILESTONES_DB: props.getProperty('NOTION_MILESTONES_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    CALENDAR_ID: 'monica.istorya@gmail.com', // Or IK26 shared calendar ID
    IK26_TAG: '[IK26]',
  };
}

// ── Main Sync Function ─────────────────────────────────────────
function syncCalendarMilestones() {
  const config = getConfig();
  
  try {
    Logger.log('Starting Calendar ↔ Milestones sync (Flow F)...');
    
    // Sync Calendar → Notion
    const calToNotion = syncCalendarToNotion(config);
    
    // Sync Notion → Calendar
    const notionToCal = syncNotionToCalendar(config);
    
    const total = calToNotion + notionToCal;
    
    if (total > 0) {
      logToNotion(config, 'Flow F: Calendar ↔ Milestones', 
        `Synced ${calToNotion} from calendar, ${notionToCal} to calendar`, 'Success');
    }
    
    Logger.log(`Sync complete: ${calToNotion} from calendar, ${notionToCal} to calendar`);
    
  } catch (err) {
    Logger.log('Error in syncCalendarMilestones: ' + err);
    logToNotion(config, 'Flow F: Calendar ↔ Milestones', err.toString(), 'Failed');
  }
}

// ── Calendar → Notion ──────────────────────────────────────────
function syncCalendarToNotion(config) {
  const calendar = CalendarApp.getCalendarById(config.CALENDAR_ID);
  if (!calendar) {
    Logger.log('Calendar not found: ' + config.CALENDAR_ID);
    return 0;
  }
  
  // Get events from the next 90 days that contain [IK26] tag
  const now = new Date();
  const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const events = calendar.getEvents(now, futureDate);
  
  const ik26Events = events.filter(event => 
    event.getTitle().includes(config.IK26_TAG)
  );
  
  Logger.log(`Found ${ik26Events.length} IK26 calendar events`);
  
  let syncCount = 0;
  
  ik26Events.forEach(event => {
    const eventId = event.getId();
    
    // Check if milestone already exists in Notion (by calendar event ID)
    const existingMilestone = findMilestoneByEventId(config, eventId);
    
    if (existingMilestone) {
      // Update existing milestone
      const updated = updateMilestone(config, existingMilestone.id, {
        title: event.getTitle().replace(config.IK26_TAG, '').trim(),
        date: event.getStartTime().toISOString(),
        description: event.getDescription() || '',
      });
      if (updated) syncCount++;
    } else {
      // Create new milestone
      const created = createMilestone(config, {
        title: event.getTitle().replace(config.IK26_TAG, '').trim(),
        date: event.getStartTime().toISOString(),
        description: event.getDescription() || '',
        eventId: eventId,
      });
      if (created) syncCount++;
    }
  });
  
  return syncCount;
}

// ── Notion → Calendar ──────────────────────────────────────────
function syncNotionToCalendar(config) {
  const calendar = CalendarApp.getCalendarById(config.CALENDAR_ID);
  if (!calendar) {
    Logger.log('Calendar not found: ' + config.CALENDAR_ID);
    return 0;
  }
  
  // Get all milestones from Notion that have dates
  const milestones = getMilestonesWithDates(config);
  Logger.log(`Found ${milestones.length} Notion milestones with dates`);
  
  let syncCount = 0;
  
  milestones.forEach(milestone => {
    const eventId = getNotionRichText(milestone.properties['Calendar Event ID']); // Custom property
    const title = `${config.IK26_TAG} ${getNotionTitle(milestone.properties.Name)}`;
    const date = getNotionDate(milestone.properties.Date);
    const description = getNotionRichText(milestone.properties.Description);
    
    if (!date) return;
    
    const startTime = new Date(date);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour default
    
    if (eventId) {
      // Update existing calendar event
      try {
        const event = calendar.getEventById(eventId);
        if (event) {
          event.setTitle(title);
          event.setTime(startTime, endTime);
          event.setDescription(description);
          syncCount++;
        }
      } catch (err) {
        Logger.log(`Event ${eventId} not found, will create new one`);
      }
    } else {
      // Create new calendar event
      const newEvent = calendar.createEvent(title, startTime, endTime, {
        description: description
      });
      
      // Store calendar event ID in Notion
      updateMilestone(config, milestone.id, {
        eventId: newEvent.getId()
      });
      
      syncCount++;
    }
  });
  
  return syncCount;
}

// ── Notion Query Functions ─────────────────────────────────────
function getMilestonesWithDates(config) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_MILESTONES_DB}/query`;
  
  const payload = {
    filter: {
      property: 'Date',
      date: { is_not_empty: true }
    },
    page_size: 100
  };
  
  return queryNotion(config.NOTION_API_KEY, url, payload);
}

function findMilestoneByEventId(config, eventId) {
  // This would require a "Calendar Event ID" property in the Milestones database
  // For now, returning null — enhance as needed
  // TODO: Query by Calendar Event ID property
  return null;
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

// ── Create/Update Milestone ────────────────────────────────────
function createMilestone(config, data) {
  const url = 'https://api.notion.com/v1/pages';
  
  const payload = {
    parent: { database_id: config.NOTION_MILESTONES_DB },
    properties: {
      Name: {
        title: [{ text: { content: data.title } }]
      },
      Date: {
        date: { start: data.date }
      },
      Description: {
        rich_text: [{ text: { content: data.description || '' } }]
      },
    }
  };
  
  // Store calendar event ID if provided
  if (data.eventId) {
    payload.properties['Calendar Event ID'] = {
      rich_text: [{ text: { content: data.eventId } }]
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
      Logger.log(`Error creating milestone: ${result.message}`);
      return false;
    }
    
    return true;
  } catch (err) {
    Logger.log(`Exception creating milestone: ${err}`);
    return false;
  }
}

function updateMilestone(config, pageId, data) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  
  const properties = {};
  
  if (data.title) {
    properties.Name = {
      title: [{ text: { content: data.title } }]
    };
  }
  
  if (data.date) {
    properties.Date = {
      date: { start: data.date }
    };
  }
  
  if (data.description) {
    properties.Description = {
      rich_text: [{ text: { content: data.description } }]
    };
  }
  
  if (data.eventId) {
    properties['Calendar Event ID'] = {
      rich_text: [{ text: { content: data.eventId } }]
    };
  }
  
  const payload = { properties };
  
  const options = {
    method: 'patch',
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
      Logger.log(`Error updating milestone: ${result.message}`);
      return false;
    }
    
    return true;
  } catch (err) {
    Logger.log(`Exception updating milestone: ${err}`);
    return false;
  }
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
        select: { name: 'Update' }
      },
      Database: {
        select: { name: 'Milestones' }
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
function setupFlowFTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncCalendarMilestones') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: every 30 minutes
  ScriptApp.newTrigger('syncCalendarMilestones')
    .timeBased()
    .everyMinutes(30)
    .create();
  
  Logger.log('Flow F trigger created: runs every 30 minutes');
  Logger.log('⚠️ IMPORTANT: Ensure "Calendar Event ID" rich_text property exists in Milestones database');
}
