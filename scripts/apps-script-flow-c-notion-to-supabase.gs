// ════════════════════════════════════════════════════════════════
// IK26 OPS CENTER — FLOW C: Notion → Supabase Upsert
// ════════════════════════════════════════════════════════════════
// Syncs CONFIRMED opportunities to Supabase (ik26_sponsors table)
// and related organizations to ik26_orgs table
// Trigger: Time-driven every 4 hours
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_ORGS_DB: props.getProperty('NOTION_ORGS_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    SUPABASE_URL: props.getProperty('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY: props.getProperty('SUPABASE_SERVICE_KEY'),
  };
}

// ── Main Sync Function ─────────────────────────────────────────
function syncNotionToSupabase() {
  const config = getConfig();
  const startTime = new Date();
  
  try {
    Logger.log('Starting Notion → Supabase sync (Flow C)...');
    
    // Query confirmed opportunities from Notion
    const confirmedOpps = queryConfirmedOpportunities(config);
    Logger.log(`Found ${confirmedOpps.length} confirmed opportunities`);
    
    if (confirmedOpps.length === 0) {
      Logger.log('No confirmed opportunities to sync');
      return { sponsors: 0, orgs: 0 };
    }
    
    // Transform to sponsor records
    const sponsors = confirmedOpps.map(opp => transformToSponsor(opp));
    
    // Upsert sponsors to Supabase
    const sponsorResult = upsertSponsors(config, sponsors);
    Logger.log(`Upserted ${sponsorResult.count} sponsors to Supabase`);
    
    // Get unique organization IDs from confirmed opps
    const orgIds = [...new Set(confirmedOpps
      .map(opp => opp.properties.Organization?.relation?.[0]?.id)
      .filter(id => id))];
    
    Logger.log(`Found ${orgIds.length} unique organizations`);
    
    // Fetch and upsert organizations
    let orgCount = 0;
    if (orgIds.length > 0) {
      const orgs = orgIds.map(id => fetchNotionPage(config.NOTION_API_KEY, id))
        .filter(org => org);
      
      const orgData = orgs.map(org => transformToOrg(org));
      const orgResult = upsertOrgs(config, orgData);
      orgCount = orgResult.count;
      Logger.log(`Upserted ${orgCount} organizations to Supabase`);
    }
    
    const syncResult = {
      timestamp: new Date().toISOString(),
      action: 'Notion → Supabase',
      sponsors: sponsorResult.count,
      orgs: orgCount,
      duration: Math.round((new Date() - startTime) / 1000) + 's',
    };
    
    logToNotion(config, 'Flow C: Notion → Supabase', 
      `Synced ${sponsorResult.count} sponsors, ${orgCount} orgs`, 'Success');
    
    Logger.log(`Supabase sync complete: ${sponsorResult.count} sponsors, ${orgCount} orgs`);
    return syncResult;
    
  } catch (err) {
    Logger.log('Error in syncNotionToSupabase: ' + err);
    logToNotion(config, 'Flow C: Notion → Supabase', err.toString(), 'Failed');
    throw err;
  }
}

// ── Query Confirmed Opportunities ──────────────────────────────
function queryConfirmedOpportunities(config) {
  const url = `https://api.notion.com/v1/databases/${config.NOTION_OPPS_DB}/query`;
  
  const payload = {
    filter: {
      property: 'Stage',
      select: {
        equals: 'Confirmed'
      }
    },
    page_size: 100
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
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.object === 'error') {
    throw new Error(`Notion API error: ${data.message}`);
  }
  
  return data.results || [];
}

// ── Fetch Notion Page ──────────────────────────────────────────
function fetchNotionPage(apiKey, pageId) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;
  
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28'
    },
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    
    if (data.object === 'error') {
      Logger.log(`Error fetching page ${pageId}: ${data.message}`);
      return null;
    }
    
    return data;
  } catch (err) {
    Logger.log(`Exception fetching page ${pageId}: ${err}`);
    return null;
  }
}

// ── Transform to Sponsor Record ────────────────────────────────
function transformToSponsor(opp) {
  return {
    id: opp.id,
    org_name: getNotionRelationName(opp.properties.Organization) || getNotionTitle(opp.properties.Name),
    type: getNotionSelect(opp.properties.Type),
    partner_tier: getNotionSelect(opp.properties['Partner Tier']),
    logo_url: null, // TODO: Extract from Organization page if available
    story_blurb: getNotionRichText(opp.properties['Relationship Story']),
    visibility_score: getNotionSelect(opp.properties['Visibility Score']),
    confirmed_date: new Date().toISOString(),
  };
}

// ── Transform to Org Record ────────────────────────────────────
function transformToOrg(org) {
  return {
    id: org.id,
    name: getNotionTitle(org.properties.Name),
    type: getNotionSelect(org.properties.Type),
    region: getNotionSelect(org.properties['Region / Market']),
    ik_chapter: getNotionSelect(org.properties['IK Chapter']),
    community_impact: getNotionMultiSelect(org.properties['Community Impact']).split(', ').filter(s => s),
  };
}

// ── Upsert to Supabase ─────────────────────────────────────────
function upsertSponsors(config, sponsors) {
  const url = `${config.SUPABASE_URL}/functions/v1/make-server-5ed426e6/ik26/sponsors/upsert`;
  
  const payload = { sponsors };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${config.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.error) {
    throw new Error(`Supabase error: ${data.error}`);
  }
  
  return data;
}

function upsertOrgs(config, orgs) {
  const url = `${config.SUPABASE_URL}/functions/v1/make-server-5ed426e6/ik26/orgs/upsert`;
  
  const payload = { orgs };
  
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${config.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data.error) {
    throw new Error(`Supabase error: ${data.error}`);
  }
  
  return data;
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

function getNotionRelationName(prop) {
  // For relations, we'd need to fetch the related page to get its title
  // Returning empty for now; enhance if needed
  return '';
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
        select: { name: 'Upsert to Supabase' }
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
function setupFlowCTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'syncNotionToSupabase') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger: every 4 hours
  ScriptApp.newTrigger('syncNotionToSupabase')
    .timeBased()
    .everyHours(4)
    .create();
  
  Logger.log('Flow C trigger created: runs every 4 hours');
}
