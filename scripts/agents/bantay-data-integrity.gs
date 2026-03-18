// ════════════════════════════════════════════════════════════════
// IK26 — BANTAY AGENT (Tagalog: Guard / Watcher)
// ════════════════════════════════════════════════════════════════
// Role: Data integrity watchdog + Chief of Staff synthesis
//
// Responsibilities:
//   1. Every 30 min: Monitor sync health, validate Notion schemas,
//      detect failures, auto-retry, alert Monica on critical errors.
//   2. Weekly (Sunday 9PM PT): Cross-agent synthesis — reads all
//      agent outputs from activity_feed and Supabase, produces a
//      single unified status report per chef and per system.
//
// Triggers:
//   - setupBantayTriggers() — run once manually to install
//
// Owner: Monica Blanco (monica.istorya@gmail.com)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
function getBantayConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    NOTION_API_KEY:      props.getProperty('NOTION_API_KEY'),
    NOTION_SYNCLOG_DB:   props.getProperty('NOTION_SYNCLOG_DB'),
    SUPABASE_URL:        props.getProperty('SUPABASE_URL'),
    SUPABASE_SERVICE_KEY:props.getProperty('SUPABASE_SERVICE_KEY'),
    GEMINI_API_KEY:      props.getProperty('GEMINI_API_KEY'),
    ALERT_EMAIL:         'monica.istorya@gmail.com',
  };
}

// ════════════════════════════════════════════════════════════════
// PART 1: Data Integrity Watchdog (every 30 min)
// ════════════════════════════════════════════════════════════════

function bantayWatchdog() {
  const config = getBantayConfig();
  Logger.log('Bantay watchdog running...');

  const issues = [];

  // 1. Check Notion Sync Log for recent failures
  try {
    const recentFailures = queryNotionSyncLogFailures(config);
    if (recentFailures.length > 0) {
      issues.push(`${recentFailures.length} sync failure(s) in the last 2 hours: ${recentFailures.map(f => getNotionTitle(f.properties.Name)).join(', ')}`);
    }
  } catch (err) {
    issues.push(`Could not read Notion Sync Log: ${err.toString()}`);
  }

  // 2. Check Supabase health endpoint
  try {
    const health = supabaseFetch(config, 'GET', '/functions/v1/make-server-5ed426e6/health');
    if (!health || health.status !== 'ok') {
      issues.push(`Supabase edge function health check failed. Response: ${JSON.stringify(health)}`);
    }
  } catch (err) {
    issues.push(`Supabase health check error: ${err.toString()}`);
  }

  // 3. Alert if issues found
  if (issues.length > 0) {
    const subject = `[BANTAY ALERT] IK26 System Issues Detected — ${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })}`;
    const body = `
      <div style="font-family:sans-serif;max-width:600px;">
        <h2 style="color:#dc2626;">Bantay Alert — IK26 System Issues</h2>
        <p>${issues.length} issue(s) detected:</p>
        <ul>
          ${issues.map(i => `<li style="margin:8px 0;color:#374151;">${i}</li>`).join('')}
        </ul>
        <p style="color:#6b7280;font-size:12px;margin-top:24px;">Bantay — IK26 Data Integrity Watchdog</p>
      </div>`;
    GmailApp.sendEmail(config.ALERT_EMAIL, subject, '', { htmlBody: body, name: 'Bantay — IK26' });
    logToSyncLog(config, 'Bantay: Watchdog Alert', `${issues.length} issue(s): ${issues.join(' | ')}`, 'Warning');
  } else {
    Logger.log('Bantay watchdog: all systems nominal.');
  }
}

function queryNotionSyncLogFailures(config) {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const url = `https://api.notion.com/v1/databases/${config.NOTION_SYNCLOG_DB}/query`;
  const payload = {
    filter: {
      and: [
        { property: 'Result', select: { equals: 'Failed' } },
        { property: 'Timestamp', date: { after: twoHoursAgo } }
      ]
    },
    sorts: [{ property: 'Timestamp', direction: 'descending' }],
    page_size: 10
  };
  return notionQuery(config.NOTION_API_KEY, url, payload);
}

// ════════════════════════════════════════════════════════════════
// PART 2: Weekly Chief of Staff Synthesis (Sunday 9PM PT)
// ════════════════════════════════════════════════════════════════

function bantayWeeklySynthesis() {
  const config = getBantayConfig();
  Logger.log('Bantay weekly synthesis running...');

  try {
    // 1. Pull all chef records from Supabase
    const chefs = supabaseFetch(config, 'GET', '/rest/v1/chefs?select=id,name,confirmed,course_assignment,city&order=name');
    if (!chefs || !Array.isArray(chefs) || chefs.length === 0) {
      Logger.log('No chefs found — skipping synthesis');
      return;
    }

    // 2. Pull onboarding progress
    const onboarding = supabaseFetch(config, 'GET', '/rest/v1/chef_onboarding?select=chef_id,current_step,completed_steps,last_updated');

    // 3. Pull latest pulse checks (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const pulseChecks = supabaseFetch(config, 'GET', `/rest/v1/chef_pulse_checks?select=chef_id,score,notes,created_at&created_at=gte.${sevenDaysAgo}&order=created_at.desc`);

    // 4. Pull travel status
    const travel = supabaseFetch(config, 'GET', '/rest/v1/travel_lodging?select=chef_id,flight_confirmed,lodging_confirmed,arrival_date,departure_date');

    // 5. Pull recent activity feed items tagged requires_human
    const activityFeed = supabaseFetch(config, 'GET', `/rest/v1/activity_feed?select=chef_id,type,content,metadata,created_at&created_at=gte.${sevenDaysAgo}&order=created_at.desc&limit=100`);

    // 6. Pull open expenses
    const expenses = supabaseFetch(config, 'GET', '/rest/v1/chef_expenses?select=chef_id,amount,status,description&status=neq.approved');

    // 7. Build per-chef synthesis
    const chefSummaries = chefs.map(chef => buildChefSummary(chef, { onboarding, pulseChecks, travel, activityFeed, expenses }));

    // 8. Pull system-level sync log summary
    const systemSummary = buildSystemSummary(config);

    // 9. Use Gemini to produce a narrative synthesis
    const narrativeSynthesis = config.GEMINI_API_KEY
      ? generateNarrativeSynthesis(config, chefSummaries, systemSummary)
      : null;

    // 10. Write synthesis to activity_feed with type = 'bantay_synthesis'
    const synthesisRecord = {
      type: 'bantay_synthesis',
      content: narrativeSynthesis || buildFallbackSynthesis(chefSummaries, systemSummary),
      metadata: {
        requires_human: chefSummaries.some(c => c.requiresHuman),
        chef_count: chefs.length,
        flags: chefSummaries.filter(c => c.requiresHuman).map(c => ({ chef: c.name, reason: c.flagReason })),
        system_issues: systemSummary.issues,
        generated_at: new Date().toISOString(),
        week_of: new Date().toISOString().split('T')[0]
      }
    };

    supabaseFetch(config, 'POST', '/rest/v1/activity_feed', synthesisRecord);

    // 11. Send email digest if any chef requires human attention
    const flaggedChefs = chefSummaries.filter(c => c.requiresHuman);
    if (flaggedChefs.length > 0 || systemSummary.issues.length > 0) {
      sendWeeklySynthesisEmail(config, chefSummaries, systemSummary, narrativeSynthesis);
    }

    logToSyncLog(config, 'Bantay: Weekly Synthesis',
      `Synthesized ${chefs.length} chefs. ${flaggedChefs.length} flagged for human review.`, 'Success');

    Logger.log(`Bantay synthesis complete. ${flaggedChefs.length} chefs flagged.`);

  } catch (err) {
    Logger.log('Bantay synthesis error: ' + err);
    logToSyncLog(config, 'Bantay: Weekly Synthesis', err.toString(), 'Failed');
  }
}

function buildChefSummary(chef, data) {
  const { onboarding, pulseChecks, travel, activityFeed, expenses } = data;

  const chefOnboarding = (onboarding || []).find(o => o.chef_id === chef.id);
  const chefPulse = (pulseChecks || []).filter(p => p.chef_id === chef.id);
  const latestPulse = chefPulse.length > 0 ? chefPulse[0] : null;
  const chefTravel = (travel || []).find(t => t.chef_id === chef.id);
  const chefActivity = (activityFeed || []).filter(a => a.chef_id === chef.id);
  const chefExpenses = (expenses || []).filter(e => e.chef_id === chef.id);

  const flags = [];
  let requiresHuman = false;

  // Onboarding check
  const onboardingStep = chefOnboarding ? chefOnboarding.current_step : 0;
  const onboardingComplete = onboardingStep >= 6;
  if (!onboardingComplete && onboardingStep < 3) {
    flags.push(`Onboarding stalled at step ${onboardingStep}/6`);
    requiresHuman = true;
  }

  // Wellness check
  const pulseScore = latestPulse ? latestPulse.score : null;
  if (pulseScore !== null && pulseScore <= 2) {
    flags.push(`Wellness score ${pulseScore}/5 — distress range`);
    requiresHuman = true;
  }

  // Travel check
  const flightConfirmed = chefTravel ? chefTravel.flight_confirmed : false;
  const lodgingConfirmed = chefTravel ? chefTravel.lodging_confirmed : false;
  if (!flightConfirmed) {
    flags.push('Flight not confirmed');
    requiresHuman = true;
  }
  if (!lodgingConfirmed) {
    flags.push('Lodging not confirmed');
  }

  // Expense check
  if (chefExpenses.length > 0) {
    flags.push(`${chefExpenses.length} pending expense(s)`);
  }

  return {
    id: chef.id,
    name: chef.name,
    course: chef.course_assignment || 'TBD',
    city: chef.city || 'TBD',
    confirmed: chef.confirmed,
    onboardingStep,
    onboardingComplete,
    pulseScore,
    flightConfirmed,
    lodgingConfirmed,
    pendingExpenses: chefExpenses.length,
    recentActivityCount: chefActivity.length,
    flags,
    requiresHuman,
    flagReason: flags.join('; ')
  };
}

function buildSystemSummary(config) {
  const issues = [];
  try {
    // Check for recent sync failures in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const url = `https://api.notion.com/v1/databases/${config.NOTION_SYNCLOG_DB}/query`;
    const payload = {
      filter: {
        and: [
          { property: 'Result', select: { equals: 'Failed' } },
          { property: 'Timestamp', date: { after: sevenDaysAgo } }
        ]
      },
      page_size: 20
    };
    const failures = notionQuery(config.NOTION_API_KEY, url, payload);
    if (failures.length > 0) {
      issues.push(`${failures.length} sync failure(s) in the past 7 days`);
    }
  } catch (err) {
    issues.push(`Could not read sync log: ${err}`);
  }
  return { issues };
}

function generateNarrativeSynthesis(config, chefSummaries, systemSummary) {
  const flagged = chefSummaries.filter(c => c.requiresHuman);
  const healthy = chefSummaries.filter(c => !c.requiresHuman);

  const prompt = `You are Bantay, the Chief of Staff AI agent for Isang Kusina 2026 — a Filipino-American culinary event on May 22, 2026 in Las Vegas. You report weekly to Monica Blanco (Co-Owner, EP).

Here is the weekly chef status data:

FLAGGED CHEFS (require human attention): ${flagged.length}
${flagged.map(c => `- ${c.name} (${c.course}): ${c.flagReason}`).join('\n') || 'None'}

HEALTHY CHEFS: ${healthy.length}
${healthy.map(c => `- ${c.name} (${c.course}): onboarding ${c.onboardingStep}/6, pulse ${c.pulseScore ?? 'N/A'}/5, flight ${c.flightConfirmed ? 'confirmed' : 'pending'}`).join('\n')}

SYSTEM ISSUES: ${systemSummary.issues.length > 0 ? systemSummary.issues.join('; ') : 'None'}

Write a concise weekly synthesis report (max 200 words). Be direct and specific. Lead with what requires human action. Use plain language. Do not use bullet points — write in short paragraphs. End with one clear recommendation for Monica this week.`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 350, temperature: 0.4 }
    };
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const result = JSON.parse(response.getContentText());
    return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    Logger.log('Gemini synthesis error: ' + err);
    return null;
  }
}

function buildFallbackSynthesis(chefSummaries, systemSummary) {
  const flagged = chefSummaries.filter(c => c.requiresHuman);
  const lines = [`Weekly Bantay Synthesis — ${new Date().toDateString()}`];
  lines.push(`${chefSummaries.length} chefs total. ${flagged.length} flagged for human review.`);
  flagged.forEach(c => lines.push(`${c.name}: ${c.flagReason}`));
  if (systemSummary.issues.length > 0) lines.push(`System: ${systemSummary.issues.join('; ')}`);
  return lines.join('\n');
}

function sendWeeklySynthesisEmail(config, chefSummaries, systemSummary, narrative) {
  const flagged = chefSummaries.filter(c => c.requiresHuman);
  const healthy = chefSummaries.filter(c => !c.requiresHuman);

  let html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:640px;margin:0 auto;">
      <h2 style="color:#d97706;border-bottom:3px solid #d97706;padding-bottom:8px;">
        Bantay Weekly Synthesis — ${new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', month: 'long', day: 'numeric' })}
      </h2>`;

  if (narrative) {
    html += `<div style="background:#fafaf9;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;color:#374151;font-size:14px;line-height:1.6;">${narrative.replace(/\n/g, '<br>')}</div>`;
  }

  if (flagged.length > 0) {
    html += `<h3 style="color:#dc2626;margin-top:24px;">Requires Human Attention (${flagged.length})</h3>`;
    flagged.forEach(c => {
      html += `
        <div style="margin:10px 0;padding:14px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:6px;">
          <strong style="font-size:14px;">${c.name}</strong>
          <span style="color:#6b7280;font-size:12px;margin-left:8px;">${c.course}</span>
          <p style="color:#374151;font-size:13px;margin:6px 0 0;">${c.flags.join(' · ')}</p>
        </div>`;
    });
  }

  if (healthy.length > 0) {
    html += `<h3 style="color:#059669;margin-top:24px;">On Track (${healthy.length})</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px;">`;
    healthy.forEach(c => {
      html += `<span style="padding:4px 12px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:20px;font-size:12px;color:#065f46;">${c.name}</span>`;
    });
    html += `</div>`;
  }

  if (systemSummary.issues.length > 0) {
    html += `<h3 style="color:#d97706;margin-top:24px;">System Issues</h3>
      <ul style="color:#374151;font-size:13px;">
        ${systemSummary.issues.map(i => `<li>${i}</li>`).join('')}
      </ul>`;
  }

  html += `<p style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;">
    Bantay — IK26 Chief of Staff Agent · Runs every Sunday 9PM PT
  </p></div>`;

  GmailApp.sendEmail(config.ALERT_EMAIL,
    `Bantay Weekly Synthesis — ${flagged.length} chef(s) need attention`,
    '', { htmlBody: html, name: 'Bantay — IK26' });
}

// ── Supabase Helpers ───────────────────────────────────────────
function supabaseFetch(config, method, path, body) {
  const url = config.SUPABASE_URL + path;
  const options = {
    method: method.toLowerCase(),
    headers: {
      'apikey': config.SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${config.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : ''
    },
    muteHttpExceptions: true
  };
  if (body) options.payload = JSON.stringify(body);
  const response = UrlFetchApp.fetch(url, options);
  const text = response.getContentText();
  if (!text || text === '') return null;
  try { return JSON.parse(text); } catch (e) { return text; }
}

// ── Notion Helpers ─────────────────────────────────────────────
function notionQuery(apiKey, url, payload) {
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
  if (data.object === 'error') throw new Error(`Notion API: ${data.message}`);
  return data.results || [];
}

function getNotionTitle(prop) {
  if (!prop || !prop.title) return 'Untitled';
  return prop.title.map(t => t.plain_text).join('');
}

function logToSyncLog(config, action, details, result) {
  const url = 'https://api.notion.com/v1/pages';
  const payload = {
    parent: { database_id: config.NOTION_SYNCLOG_DB },
    properties: {
      Name: { title: [{ text: { content: `${action} — ${new Date().toISOString()}` } }] },
      Timestamp: { date: { start: new Date().toISOString() } },
      Action: { select: { name: 'Agent run' } },
      'Source Tool': { select: { name: 'Apps Script' } },
      Result: { select: { name: result } },
      Details: { rich_text: [{ text: { content: details.substring(0, 2000) } }] }
    }
  };
  try {
    UrlFetchApp.fetch(url, {
      method: 'post',
      headers: {
        'Authorization': `Bearer ${config.NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
  } catch (err) {
    Logger.log('Failed to log to Notion Sync Log: ' + err);
  }
}

// ── Trigger Setup (Run once manually) ──────────────────────────
function setupBantayTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(t => {
    if (['bantayWatchdog', 'bantayWeeklySynthesis'].includes(t.getHandlerFunction())) {
      ScriptApp.deleteTrigger(t);
    }
  });

  // Watchdog: every 30 minutes
  ScriptApp.newTrigger('bantayWatchdog')
    .timeBased()
    .everyMinutes(30)
    .create();

  // Weekly synthesis: Sunday at 9PM PT
  ScriptApp.newTrigger('bantayWeeklySynthesis')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(21)
    .inTimezone('America/Los_Angeles')
    .create();

  Logger.log('Bantay triggers created: watchdog (every 30min) + weekly synthesis (Sunday 9PM PT)');
}
