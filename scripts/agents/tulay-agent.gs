// ════════════════════════════════════════════════════════════════
// IK26 AGENT: TULAY (Bridge)
// ════════════════════════════════════════════════════════════════
// Builds and maintains the bridges between Istorya and its partners.
// Drafts contextual follow-up emails for sponsorship & outreach pipeline.
// Creates Gmail drafts (NEVER sends automatically).
// Generates sponsor briefs when Opportunities move to "Confirmed."
//
// Trigger: Daily at 7:30 AM PT (runs before the 8 AM digest)
// Owner: Monica Blanco (monica.istorya@gmail.com)
// Stack: Google Apps Script + Notion API + Gemini API + Gmail
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getTulayConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY: props.getProperty('NOTION_API_KEY'),
    NOTION_OPPS_DB: props.getProperty('NOTION_OPPS_DB'),
    NOTION_CONTACTS_DB: props.getProperty('NOTION_CONTACTS_DB'),
    NOTION_ORGS_DB: props.getProperty('NOTION_ORGS_DB'),
    NOTION_ACTIVITIES_DB: props.getProperty('NOTION_ACTIVITIES_DB'),
    NOTION_SYNCLOG_DB: props.getProperty('NOTION_SYNCLOG_DB'),
    GEMINI_API_KEY: props.getProperty('GEMINI_API_KEY'),
    DIGEST_EMAIL: 'monica.istorya@gmail.com',
    SENDER_NAME: 'Monica Blanco',
    SENDER_TITLE: 'Co-Founder & Creative Director, Istorya',
    EVENT_NAME: 'Isang Kusina 2026',
    EVENT_DATE: 'May 22, 2026',
    EVENT_LOCATION: 'Las Vegas, NV',
  };
}

// ── Main Entry Point ───────────────────────────────────────────
function runTulay() {
  const config = getTulayConfig();
  const startTime = new Date();

  try {
    Logger.log('[Tulay] Starting sponsorship follow-up agent...');

    // 1. Get opportunities that need follow-up
    const dueOpps = getDueOpportunities(config);
    const overdueOpps = getOverdueOpportunities(config);
    const allActionable = [...dueOpps, ...overdueOpps];

    Logger.log(`[Tulay] Found ${dueOpps.length} due today, ${overdueOpps.length} overdue`);

    if (allActionable.length === 0) {
      Logger.log('[Tulay] No actionable opportunities. Checking for new confirmations...');
      checkForNewConfirmations(config);
      logToNotionSyncLog(config, 'Tulay: Follow-up Drafts',
        'No actionable opportunities today. Checked confirmations.', 'Success');
      return;
    }

    // 2. For each opportunity, gather context and draft an email
    let draftsCreated = 0;
    let errors = 0;

    allActionable.forEach(opp => {
      try {
        const context = gatherOppContext(config, opp);
        const draft = generateFollowUpDraft(config, context);

        if (draft && draft.to) {
          createGmailDraft(draft);
          draftsCreated++;
          Logger.log(`[Tulay] Draft created for: ${context.oppName}`);
        } else {
          Logger.log(`[Tulay] Skipped ${context.oppName}: no contact email found`);
        }
      } catch (err) {
        errors++;
        Logger.log(`[Tulay] Error processing ${getNotionTitle_(opp.properties.Name)}: ${err}`);
      }
    });

    // 3. Check for newly confirmed sponsors
    checkForNewConfirmations(config);

    // 4. Log results
    const duration = Math.round((new Date() - startTime) / 1000);
    const summary = `Created ${draftsCreated} Gmail drafts from ${allActionable.length} opportunities (${errors} errors). ${duration}s.`;
    Logger.log(`[Tulay] ${summary}`);
    logToNotionSyncLog(config, 'Tulay: Follow-up Drafts', summary, errors > 0 ? 'Partial' : 'Success');

  } catch (err) {
    Logger.log('[Tulay] Fatal error: ' + err);
    logToNotionSyncLog(config, 'Tulay: Follow-up Drafts', err.toString(), 'Failed');
  }
}

// ── Query Opportunities ────────────────────────────────────────
function getDueOpportunities(config) {
  const today = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  return queryNotionDB_(config.NOTION_API_KEY, config.NOTION_OPPS_DB, {
    filter: {
      and: [
        { property: 'Next Action Date', date: { equals: today } },
        { property: 'Stage', select: { does_not_equal: 'Confirmed' } },
        { property: 'Stage', select: { does_not_equal: 'Declined / Closed' } }
      ]
    }
  });
}

function getOverdueOpportunities(config) {
  const today = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  return queryNotionDB_(config.NOTION_API_KEY, config.NOTION_OPPS_DB, {
    filter: {
      and: [
        { property: 'Next Action Date', date: { before: today } },
        { property: 'Stage', select: { does_not_equal: 'Confirmed' } },
        { property: 'Stage', select: { does_not_equal: 'Declined / Closed' } }
      ]
    }
  });
}

// ── Gather Context for a Single Opportunity ────────────────────
function gatherOppContext(config, opp) {
  const props = opp.properties;

  // Basic opportunity fields
  const context = {
    oppId: opp.id,
    oppUrl: opp.url,
    oppName: getNotionTitle_(props.Name),
    stage: getNotionSelect_(props.Stage),
    type: getNotionSelect_(props.Type),
    nextAction: getNotionRichText_(props['Next Action']),
    nextActionDate: getNotionDate_(props['Next Action Date']),
    potentialValue: getNotionNumber_(props['Potential Value']),
    partnerTier: getNotionSelect_(props['Partner Tier']),
    ikChapter: getNotionSelect_(props['IK Chapter']),
    inKindCash: getNotionSelect_(props['In-Kind vs Cash']),
    relationshipStory: getNotionRichText_(props['Relationship Story']),
    source: getNotionSelect_(props.Source),
    contactName: '',
    contactEmail: '',
    orgName: '',
    orgType: '',
    communityImpact: '',
    recentActivities: [],
  };

  // Resolve primary contact
  const contactRelation = props['Primary Contact'];
  if (contactRelation && contactRelation.relation && contactRelation.relation.length > 0) {
    const contactPage = fetchNotionPage_(config.NOTION_API_KEY, contactRelation.relation[0].id);
    if (contactPage) {
      context.contactName = getNotionTitle_(contactPage.properties.Name);
      context.contactEmail = getNotionEmail_(contactPage.properties.Email);
    }
  }

  // Resolve organization
  const orgRelation = props.Organization;
  if (orgRelation && orgRelation.relation && orgRelation.relation.length > 0) {
    const orgPage = fetchNotionPage_(config.NOTION_API_KEY, orgRelation.relation[0].id);
    if (orgPage) {
      context.orgName = getNotionTitle_(orgPage.properties.Name);
      context.orgType = getNotionSelect_(orgPage.properties.Type);
      context.communityImpact = getNotionMultiSelect_(orgPage.properties['Community Impact']);
    }
  }

  // Get recent activities for this opportunity
  context.recentActivities = getRecentActivities(config, opp.id);

  return context;
}

// ── Get Recent Activities for an Opportunity ───────────────────
function getRecentActivities(config, oppId) {
  try {
    const results = queryNotionDB_(config.NOTION_API_KEY, config.NOTION_ACTIVITIES_DB, {
      filter: {
        property: 'Opportunity',
        relation: { contains: oppId }
      },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 5
    });

    return results.map(a => ({
      name: getNotionTitle_(a.properties.Name),
      date: getNotionDate_(a.properties.Date),
      type: getNotionSelect_(a.properties.Type),
      outcome: getNotionSelect_(a.properties.Outcome),
    }));
  } catch (err) {
    Logger.log(`[Tulay] Could not fetch activities for ${oppId}: ${err}`);
    return [];
  }
}

// ── Generate Follow-Up Email Draft via Gemini ──────────────────
function generateFollowUpDraft(config, ctx) {
  // If no contact email, we can still create a draft but flag it
  const recipientEmail = ctx.contactEmail || '';
  const recipientName = ctx.contactName || ctx.oppName;

  // Build the activity history string
  let activitySummary = 'No previous activities logged.';
  if (ctx.recentActivities.length > 0) {
    activitySummary = ctx.recentActivities.map(a =>
      `- ${a.date}: ${a.name} (${a.type}, outcome: ${a.outcome || 'pending'})`
    ).join('\n');
  }

  // Build the prompt for Gemini
  const prompt = `You are drafting a follow-up email for Monica Blanco, Co-Founder & Creative Director of Istorya, a Filipino-American culinary and creative agency based in Las Vegas. She is organizing Isang Kusina 2026, a collaborative dinner event on May 22, 2026 in Las Vegas featuring five Filipino chefs from five cities.

The tone should be warm, professional, and culturally grounded. Not corporate. Not salesy. Monica writes like someone who values relationships over transactions. Keep it concise (under 200 words for the body). No em dashes. No generic AI filler language.

OPPORTUNITY CONTEXT:
- Organization: ${ctx.orgName || ctx.oppName}
- Contact: ${recipientName}
- Type: ${ctx.type}
- Current Stage: ${ctx.stage}
- Next Action: ${ctx.nextAction}
- Partner Tier: ${ctx.partnerTier || 'Not yet assigned'}
- IK Chapter: ${ctx.ikChapter || 'TBD'}
- In-Kind vs Cash: ${ctx.inKindCash || 'TBD'}
- Potential Value: ${ctx.potentialValue ? '$' + ctx.potentialValue : 'TBD'}
- Relationship Story: ${ctx.relationshipStory || 'No relationship story documented yet.'}
- Community Impact Areas: ${ctx.communityImpact || 'Not specified'}

RECENT ACTIVITY HISTORY:
${activitySummary}

Write ONLY the email body (no subject line, no signature). Start with a greeting using the contact's first name if available. End naturally before the signature. Monica will add her own sign-off.

If the next action is "Send sponsorship deck," write an introductory email that explains Isang Kusina and invites the contact to explore a partnership. Reference the event's mission of celebrating Filipino culinary heritage through collaboration.

If the next action involves following up on a previous conversation, reference the last interaction naturally and move the conversation forward.`;

  // Call Gemini API
  const emailBody = callGemini(config.GEMINI_API_KEY, prompt);

  if (!emailBody) {
    Logger.log(`[Tulay] Gemini returned empty response for ${ctx.oppName}`);
    return null;
  }

  // Build the subject line
  let subject = '';
  if (ctx.stage === 'Not started' || ctx.nextAction.toLowerCase().includes('send sponsorship')) {
    subject = `Isang Kusina 2026 - Partnership Opportunity | ${ctx.orgName || ctx.oppName}`;
  } else {
    subject = `Following up - Isang Kusina 2026 x ${ctx.orgName || ctx.oppName}`;
  }

  // Build signature
  const signature = `\n\nWarmly,\nMonica Blanco\n${config.SENDER_TITLE}\nisangkusina.com | istorya.co`;

  return {
    to: recipientEmail,
    subject: subject,
    body: emailBody + signature,
    oppName: ctx.oppName,
    oppUrl: ctx.oppUrl,
    isOverdue: isOverdue(ctx.nextActionDate),
  };
}

// ── Create Gmail Draft ─────────────────────────────────────────
function createGmailDraft(draft) {
  // Build HTML body for nicer formatting
  const htmlBody = draft.body
    .replace(/\n/g, '<br>')
    .replace(/^/, '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; font-size: 14px; color: #1a1a1a;">')
    + '</div>';

  // Add a note at the top for Monica
  const noteColor = draft.isOverdue ? '#dc2626' : '#d97706';
  const noteLabel = draft.isOverdue ? 'OVERDUE' : 'DUE TODAY';
  const internalNote = `<div style="background: #fef3c7; border-left: 3px solid ${noteColor}; padding: 8px 12px; margin-bottom: 16px; font-size: 12px; color: #92400e; font-family: sans-serif;">
    <strong>[Tulay Agent]</strong> ${noteLabel} follow-up for <a href="${draft.oppUrl}" style="color: #d97706;">${draft.oppName}</a>
    ${!draft.to ? '<br><strong style="color: #dc2626;">No contact email found. Please add the recipient manually.</strong>' : ''}
  </div>`;

  const fullHtml = internalNote + htmlBody;

  GmailApp.createDraft(
    draft.to,
    draft.subject,
    draft.body, // Plain text fallback
    { htmlBody: fullHtml, name: 'Monica Blanco' }
  );
}

// ── Check for New Confirmations (Sponsor Brief) ───────────────
function checkForNewConfirmations(config) {
  try {
    // Query opportunities with Stage = "Confirmed"
    const confirmed = queryNotionDB_(config.NOTION_API_KEY, config.NOTION_OPPS_DB, {
      filter: {
        property: 'Stage',
        select: { equals: 'Confirmed' }
      }
    });

    // Check which ones were confirmed in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    confirmed.forEach(opp => {
      const lastEdited = opp.last_edited_time;
      if (lastEdited > oneDayAgo) {
        // Generate and email a sponsor brief
        const ctx = gatherOppContext(config, opp);
        const brief = generateSponsorBrief(config, ctx);
        if (brief) {
          sendSponsorBriefEmail(config, ctx, brief);
          Logger.log(`[Tulay] Sponsor brief sent for: ${ctx.oppName}`);
        }
      }
    });
  } catch (err) {
    Logger.log(`[Tulay] Error checking confirmations: ${err}`);
  }
}

// ── Generate Sponsor Brief ─────────────────────────────────────
function generateSponsorBrief(config, ctx) {
  const prompt = `Generate a concise one-page sponsor brief for the Isang Kusina 2026 team. This is an internal document, not for the sponsor. Use a clean, scannable format with clear headers. No em dashes.

CONFIRMED PARTNER:
- Organization: ${ctx.orgName || ctx.oppName}
- Contact: ${ctx.contactName}
- Email: ${ctx.contactEmail}
- Partner Tier: ${ctx.partnerTier || 'TBD'}
- IK Chapter: ${ctx.ikChapter || 'TBD'}
- In-Kind vs Cash: ${ctx.inKindCash || 'TBD'}
- Confirmed Value: ${ctx.potentialValue ? '$' + ctx.potentialValue : 'TBD'}
- Community Impact: ${ctx.communityImpact || 'Not specified'}
- Relationship Story: ${ctx.relationshipStory || 'None documented'}
- Type: ${ctx.type}

Format the brief with these sections:
1. PARTNER SNAPSHOT (name, tier, value, type)
2. RELATIONSHIP CONTEXT (why this partner matters to IK/Istorya)
3. DELIVERABLES & COMMITMENTS (what we owe them based on their tier)
4. KEY CONTACT (name, email, preferred channel)
5. NEXT STEPS (what the team needs to do now that this is confirmed)

Keep it under 400 words. Write in a warm but operational tone.`;

  return callGemini(config.GEMINI_API_KEY, prompt);
}

// ── Send Sponsor Brief via Email ───────────────────────────────
function sendSponsorBriefEmail(config, ctx, briefText) {
  const htmlBrief = briefText
    .replace(/\n/g, '<br>')
    .replace(/^/, '<div style="font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', sans-serif; font-size: 14px; color: #1a1a1a; max-width: 600px;">')
    + '</div>';

  const header = `<div style="background: #f0fdf4; border-left: 3px solid #059669; padding: 12px 16px; margin-bottom: 16px; font-family: sans-serif;">
    <h2 style="margin: 0 0 4px 0; color: #065f46; font-size: 16px;">New Confirmed Partner: ${ctx.orgName || ctx.oppName}</h2>
    <p style="margin: 0; font-size: 12px; color: #6b7280;">Generated by Tulay Agent | <a href="${ctx.oppUrl}" style="color: #d97706;">View in Notion</a></p>
  </div>`;

  GmailApp.sendEmail(config.DIGEST_EMAIL, `[IK26] Sponsor Brief: ${ctx.orgName || ctx.oppName}`, briefText, {
    htmlBody: header + htmlBrief,
    name: 'IK26 Tulay Agent'
  });
}

// ── Gemini API Call ────────────────────────────────────────────
function callGemini(apiKey, prompt) {
  if (!apiKey) {
    Logger.log('[Tulay] GEMINI_API_KEY not set. Using fallback template.');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());

    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }

    Logger.log('[Tulay] Gemini response had no candidates: ' + JSON.stringify(data));
    return null;
  } catch (err) {
    Logger.log('[Tulay] Gemini API error: ' + err);
    return null;
  }
}

// ── Notion API Helpers (namespaced to avoid conflicts) ─────────
function queryNotionDB_(apiKey, dbId, params) {
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

function fetchNotionPage_(apiKey, pageId) {
  const url = `https://api.notion.com/v1/pages/${pageId}`;

  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    if (data.object === 'error') return null;
    return data;
  } catch (err) {
    Logger.log(`[Tulay] Error fetching page ${pageId}: ${err}`);
    return null;
  }
}

// ── Property Extractors (namespaced) ───────────────────────────
function getNotionTitle_(prop) {
  if (!prop || !prop.title) return '';
  return prop.title.map(t => t.plain_text).join('');
}

function getNotionRichText_(prop) {
  if (!prop || !prop.rich_text) return '';
  return prop.rich_text.map(t => t.plain_text).join('');
}

function getNotionSelect_(prop) {
  if (!prop || !prop.select) return '';
  return prop.select.name || '';
}

function getNotionMultiSelect_(prop) {
  if (!prop || !prop.multi_select) return '';
  return prop.multi_select.map(s => s.name).join(', ');
}

function getNotionDate_(prop) {
  if (!prop || !prop.date) return '';
  return prop.date.start || '';
}

function getNotionNumber_(prop) {
  if (!prop || prop.number === null || prop.number === undefined) return '';
  return prop.number;
}

function getNotionEmail_(prop) {
  if (!prop || !prop.email) return '';
  return prop.email;
}

// ── Utility ────────────────────────────────────────────────────
function isOverdue(dateStr) {
  if (!dateStr) return false;
  const today = Utilities.formatDate(new Date(), 'America/Los_Angeles', 'yyyy-MM-dd');
  return dateStr < today;
}

// ── Notion Sync Log ────────────────────────────────────────────
function logToNotionSyncLog(config, action, details, result) {
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
        select: { name: 'Tulay Agent' }
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
    Logger.log('[Tulay] Failed to log to Notion Sync Log: ' + err);
  }
}

// ── Trigger Setup (Run once manually) ──────────────────────────
function setupTulayTrigger() {
  // Delete existing Tulay triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'runTulay') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Daily at 7:30 AM PT (before the 8 AM digest)
  ScriptApp.newTrigger('runTulay')
    .timeBased()
    .atHour(7)
    .nearMinute(30)
    .everyDays(1)
    .inTimezone('America/Los_Angeles')
    .create();

  Logger.log('[Tulay] Trigger created: daily at 7:30 AM PT');
  Logger.log('[Tulay] Required Script Properties: GEMINI_API_KEY');
}
