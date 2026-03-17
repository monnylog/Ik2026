// ════════════════════════════════════════════════════════════════
// IK26 AGENT: MATA — Google Drive Media Management Companion
// ════════════════════════════════════════════════════════════════
// Handles the physical side of media production: creating folder
// structures in Google Drive, auto-tagging uploaded media by chef,
// dish, scene type, and moment, and generating asset manifests.
//
// This is the Apps Script companion to mata-agent.ts (Supabase Edge
// Function). The edge function handles narrative intelligence; this
// script handles file organization.
//
// Deployment: Google Apps Script (Istorya Sync Engine project)
// Trigger: Manual run for setup + time-driven for auto-tagging
// Dependencies: Google Drive API, Google Sheets (for manifest)
// ════════════════════════════════════════════════════════════════

// ── Configuration ──────────────────────────────────────────────
// These are set in Script Properties (Apps Script > Project Settings > Script Properties)
function getMataConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    // Root folder for all IK26 media
    DRIVE_ROOT_FOLDER_ID: props.getProperty("MATA_DRIVE_ROOT_FOLDER_ID") || "",
    // Google Sheet for the media manifest
    MANIFEST_SHEET_ID: props.getProperty("MATA_MANIFEST_SHEET_ID") || "",
    // Supabase connection (reuses existing properties)
    SUPABASE_URL: props.getProperty("SUPABASE_URL") || "",
    SUPABASE_SERVICE_KEY: props.getProperty("SUPABASE_SERVICE_KEY") || "",
    // Notification email
    LEADERSHIP_EMAIL: "monica.istorya@gmail.com",
  };
}

// ── Folder Structure Constants ─────────────────────────────────
const FOLDER_STRUCTURE = {
  root: "IK26 — Take Home Studio",
  children: {
    "01_PRE-PRODUCTION": {
      children: {
        "Shot Lists": {},
        "Interview Guides": {},
        "Narrative Treatment": {},
        "Scene Plans": {},
        "Storyboards": {},
        "Reference Material": {},
        "Contracts & Releases": {},
      },
    },
    "02_PRODUCTION — Day Of": {
      children: {
        "A-Cam": {
          children: {
            "Card_001": {},
            "Card_002": {},
            "Card_003": {},
          },
        },
        "B-Cam": {
          children: {
            "Card_001": {},
            "Card_002": {},
          },
        },
        "Audio": {
          children: {
            "Interviews": {},
            "Ambient": {},
            "Nat Sound": {},
          },
        },
        "Photos": {
          children: {
            "Kitchen": {},
            "Dining Room": {},
            "Portraits": {},
            "Details": {},
            "Behind the Scenes": {},
          },
        },
        "Phone Footage": {
          children: {
            "Stories & Reels": {},
            "BTS Clips": {},
          },
        },
        "Scene Logs": {},
      },
    },
    "03_POST-PRODUCTION": {
      children: {
        "Selects": {
          children: {
            "A-Roll": {},
            "B-Roll": {},
            "Interviews": {},
          },
        },
        "Rough Cuts": {},
        "Fine Cuts": {},
        "Color & Sound": {},
        "Graphics & Titles": {},
        "Music": {},
        "Exports": {
          children: {
            "Documentary": {},
            "Short-Form Clips": {},
            "Trailers": {},
          },
        },
      },
    },
    "04_SOCIAL CONTENT": {
      children: {
        "Instagram": {
          children: {
            "Reels": {},
            "Carousels": {},
            "Stories": {},
            "Posts": {},
          },
        },
        "YouTube": {
          children: {
            "Shorts": {},
            "Full Videos": {},
            "Thumbnails": {},
          },
        },
        "TikTok": {},
        "Substack": {},
        "Captions & Copy": {},
      },
    },
    "05_BY CHEF": {},
    "06_ARCHIVE": {
      children: {
        "Raw Footage Backup": {},
        "Audio Backup": {},
        "Photo Backup": {},
        "Project Files": {},
      },
    },
  },
};


// ════════════════════════════════════════════════════════════════
// SETUP FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Creates the complete folder structure in Google Drive.
 * Run this ONCE during pre-production setup.
 * After running, copy the root folder ID to Script Properties as MATA_DRIVE_ROOT_FOLDER_ID.
 */
function mataSetupFolderStructure() {
  const config = getMataConfig();
  let rootFolder;

  if (config.DRIVE_ROOT_FOLDER_ID) {
    // Use existing root folder
    rootFolder = DriveApp.getFolderById(config.DRIVE_ROOT_FOLDER_ID);
    Logger.log("Using existing root folder: " + rootFolder.getName());
  } else {
    // Create new root folder
    rootFolder = DriveApp.createFolder(FOLDER_STRUCTURE.root);
    Logger.log("Created root folder: " + rootFolder.getName());
    Logger.log("ROOT FOLDER ID: " + rootFolder.getId());
    Logger.log(">>> Add this to Script Properties as MATA_DRIVE_ROOT_FOLDER_ID <<<");

    // Store it automatically
    PropertiesService.getScriptProperties().setProperty(
      "MATA_DRIVE_ROOT_FOLDER_ID",
      rootFolder.getId()
    );
  }

  // Create the full tree
  createFolderTree_(rootFolder, FOLDER_STRUCTURE.children);

  // Create per-chef folders
  createChefFolders_(rootFolder);

  // Create the manifest sheet
  createManifestSheet_(config);

  Logger.log("Mata folder structure complete.");
  Logger.log("Root folder URL: " + rootFolder.getUrl());
}


/**
 * Creates per-chef subfolders under 05_BY CHEF.
 * Pulls confirmed chefs from Supabase.
 */
function createChefFolders_(rootFolder) {
  const config = getMataConfig();
  const byChefFolder = getOrCreateSubfolder_(rootFolder, "05_BY CHEF");

  // Fetch confirmed chefs from Supabase
  const chefs = fetchChefsFromSupabase_(config);

  if (!chefs || chefs.length === 0) {
    Logger.log("No confirmed chefs found. Creating placeholder folders.");
    getOrCreateSubfolder_(byChefFolder, "_Template — Chef Name");
    return;
  }

  for (const chef of chefs) {
    const chefFolderName = chef.name + (chef.city ? " (" + chef.city + ")" : "");
    const chefFolder = getOrCreateSubfolder_(byChefFolder, chefFolderName);

    // Standard subfolders for each chef
    getOrCreateSubfolder_(chefFolder, "Interview");
    getOrCreateSubfolder_(chefFolder, "Cooking");
    getOrCreateSubfolder_(chefFolder, "Portraits");
    getOrCreateSubfolder_(chefFolder, "Dish — " + (chef.dish_name || "TBD"));
    getOrCreateSubfolder_(chefFolder, "B-Roll");
    getOrCreateSubfolder_(chefFolder, "Social Content");
  }

  Logger.log("Created folders for " + chefs.length + " chefs.");
}


// ════════════════════════════════════════════════════════════════
// MEDIA MANIFEST
// ════════════════════════════════════════════════════════════════

/**
 * Creates or updates the media manifest spreadsheet.
 * The manifest tracks every media file with metadata tags.
 */
function createManifestSheet_(config) {
  let sheet;

  if (config.MANIFEST_SHEET_ID) {
    sheet = SpreadsheetApp.openById(config.MANIFEST_SHEET_ID);
  } else {
    sheet = SpreadsheetApp.create("IK26 — Mata Media Manifest");
    PropertiesService.getScriptProperties().setProperty(
      "MATA_MANIFEST_SHEET_ID",
      sheet.getId()
    );
    Logger.log("Created manifest sheet: " + sheet.getUrl());
    Logger.log(">>> Stored as MATA_MANIFEST_SHEET_ID <<<");
  }

  // Setup the main manifest tab
  let manifestTab = sheet.getSheetByName("Media Manifest");
  if (!manifestTab) {
    manifestTab = sheet.getSheets()[0];
    manifestTab.setName("Media Manifest");
  }

  const headers = [
    "file_id",
    "file_name",
    "file_url",
    "folder_path",
    "file_type",
    "size_mb",
    "created_date",
    "chef",
    "dish",
    "scene_type",
    "moment",
    "location",
    "camera",
    "emotion_tag",
    "sensory_tag",
    "narrative_use",
    "reusability",
    "usable_for",
    "notes",
    "tagged_at",
    "tagged_by",
  ];

  const headerRange = manifestTab.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1a1a2e");
  headerRange.setFontColor("#ffffff");

  // Freeze header row
  manifestTab.setFrozenRows(1);

  // Setup the summary tab
  let summaryTab = sheet.getSheetByName("Summary");
  if (!summaryTab) {
    summaryTab = sheet.insertSheet("Summary");
  }

  const summaryHeaders = [
    ["IK26 — Mata Media Summary"],
    [""],
    ["Metric", "Value"],
    ["Total Files", '=COUNTA(\'Media Manifest\'!A:A)-1'],
    ["Video Files", '=COUNTIF(\'Media Manifest\'!E:E,"video/*")'],
    ["Photo Files", '=COUNTIF(\'Media Manifest\'!E:E,"image/*")'],
    ["Audio Files", '=COUNTIF(\'Media Manifest\'!E:E,"audio/*")'],
    ["Tagged Files", '=COUNTA(\'Media Manifest\'!T:T)-1'],
    ["Untagged Files", '=B4-B8'],
    [""],
    ["By Chef", "File Count"],
  ];

  summaryTab.getRange(1, 1, summaryHeaders.length, 2).setValues(summaryHeaders);
  summaryTab.getRange(1, 1).setFontSize(14).setFontWeight("bold");
  summaryTab.getRange(3, 1, 1, 2).setFontWeight("bold").setBackground("#e8e8e8");
  summaryTab.getRange(11, 1, 1, 2).setFontWeight("bold").setBackground("#e8e8e8");

  // Setup the tag reference tab
  let tagRefTab = sheet.getSheetByName("Tag Reference");
  if (!tagRefTab) {
    tagRefTab = sheet.insertSheet("Tag Reference");
  }

  const tagRefData = [
    ["Tag Category", "Valid Values", "Description"],
    ["scene_type", "interview, cooking, prep, arrival, plating, service, reaction, atmosphere, b-roll, behind-scenes, portrait, detail, group, ceremony", "What type of scene this is"],
    ["moment", "pre-event, morning-of, service, post-service, cleanup, celebration, quiet", "When during the event timeline"],
    ["location", "main_kitchen, prep_area, dining_room, exterior, bar, entrance, backstage, offsite", "Where in the venue"],
    ["camera", "a-cam, b-cam, phone, drone, gopro", "Which camera captured this"],
    ["emotion_tag", "joy, focus, tension, relief, pride, nostalgia, anticipation, exhaustion, gratitude, surprise", "The emotional quality of the moment"],
    ["sensory_tag", "visual_texture, sound_rich, movement, stillness, close_up, wide, steam, fire, hands, color", "The sensory quality"],
    ["narrative_use", "opening, transition, montage, closing, chapter_break, title_card, interview_cutaway, establishing", "How this could be used in the edit"],
    ["reusability", "documentary, social_clip, trailer, highlight_reel, press_kit, archive_only", "Where this footage can be used"],
    ["usable_for", "instagram_reel, instagram_post, youtube_short, tiktok, substack, full_doc, trailer, press", "Specific output formats"],
  ];

  tagRefTab.getRange(1, 1, tagRefData.length, 3).setValues(tagRefData);
  tagRefTab.getRange(1, 1, 1, 3).setFontWeight("bold").setBackground("#e8e8e8");
  tagRefTab.setColumnWidth(1, 120);
  tagRefTab.setColumnWidth(2, 500);
  tagRefTab.setColumnWidth(3, 300);

  return sheet;
}


// ════════════════════════════════════════════════════════════════
// AUTO-SCAN & TAG
// ════════════════════════════════════════════════════════════════

/**
 * Scans the Drive folder structure for new media files and adds them
 * to the manifest. Run on a time trigger (every 30 minutes during
 * production, every 4 hours otherwise).
 */
function mataScanAndCatalog() {
  const config = getMataConfig();

  if (!config.DRIVE_ROOT_FOLDER_ID) {
    Logger.log("ERROR: MATA_DRIVE_ROOT_FOLDER_ID not set. Run mataSetupFolderStructure() first.");
    return;
  }

  if (!config.MANIFEST_SHEET_ID) {
    Logger.log("ERROR: MATA_MANIFEST_SHEET_ID not set. Run mataSetupFolderStructure() first.");
    return;
  }

  const rootFolder = DriveApp.getFolderById(config.DRIVE_ROOT_FOLDER_ID);
  const sheet = SpreadsheetApp.openById(config.MANIFEST_SHEET_ID);
  const manifestTab = sheet.getSheetByName("Media Manifest");

  if (!manifestTab) {
    Logger.log("ERROR: Media Manifest tab not found.");
    return;
  }

  // Get existing file IDs to avoid duplicates
  const existingData = manifestTab.getDataRange().getValues();
  const existingIds = new Set(existingData.slice(1).map(function(row) { return row[0]; }));

  // Scan all folders recursively
  const newFiles = [];
  scanFolder_(rootFolder, "", newFiles, existingIds);

  if (newFiles.length === 0) {
    Logger.log("No new media files found.");
    return;
  }

  // Append new files to the manifest
  const lastRow = manifestTab.getLastRow();
  manifestTab.getRange(lastRow + 1, 1, newFiles.length, newFiles[0].length).setValues(newFiles);

  Logger.log("Added " + newFiles.length + " new files to the manifest.");

  // Auto-tag based on folder location
  autoTagByFolder_(manifestTab, lastRow + 1, newFiles.length);
}


/**
 * Recursively scans a folder for media files.
 */
function scanFolder_(folder, path, results, existingIds) {
  var currentPath = path ? path + "/" + folder.getName() : folder.getName();

  // Scan files in this folder
  var files = folder.getFiles();
  while (files.hasNext()) {
    var file = files.next();
    var fileId = file.getId();

    // Skip if already in manifest
    if (existingIds.has(fileId)) continue;

    var mimeType = file.getMimeType();

    // Only catalog media files
    if (isMediaFile_(mimeType)) {
      var sizeMb = (file.getSize() / (1024 * 1024)).toFixed(2);

      results.push([
        fileId,
        file.getName(),
        file.getUrl(),
        currentPath,
        mimeType,
        parseFloat(sizeMb),
        file.getDateCreated().toISOString().split("T")[0],
        "", // chef (auto-tagged later)
        "", // dish
        "", // scene_type
        "", // moment
        "", // location
        "", // camera
        "", // emotion_tag
        "", // sensory_tag
        "", // narrative_use
        "", // reusability
        "", // usable_for
        "", // notes
        "", // tagged_at
        "", // tagged_by
      ]);
    }
  }

  // Recurse into subfolders
  var subfolders = folder.getFolders();
  while (subfolders.hasNext()) {
    scanFolder_(subfolders.next(), currentPath, results, existingIds);
  }
}


/**
 * Auto-tags files based on their folder location.
 * This provides baseline tags that can be refined manually or by AI.
 */
function autoTagByFolder_(manifestTab, startRow, count) {
  var tagged = 0;

  for (var i = 0; i < count; i++) {
    var row = startRow + i;
    var folderPath = manifestTab.getRange(row, 4).getValue(); // folder_path column
    var fileName = manifestTab.getRange(row, 2).getValue(); // file_name column

    var tags = inferTagsFromPath_(folderPath, fileName);

    if (tags.chef) manifestTab.getRange(row, 8).setValue(tags.chef);
    if (tags.scene_type) manifestTab.getRange(row, 10).setValue(tags.scene_type);
    if (tags.moment) manifestTab.getRange(row, 11).setValue(tags.moment);
    if (tags.location) manifestTab.getRange(row, 12).setValue(tags.location);
    if (tags.camera) manifestTab.getRange(row, 13).setValue(tags.camera);
    if (tags.reusability) manifestTab.getRange(row, 17).setValue(tags.reusability);

    if (Object.keys(tags).length > 0) {
      manifestTab.getRange(row, 20).setValue(new Date().toISOString().split("T")[0]); // tagged_at
      manifestTab.getRange(row, 21).setValue("Mata (auto)"); // tagged_by
      tagged++;
    }
  }

  Logger.log("Auto-tagged " + tagged + " files based on folder location.");
}


/**
 * Infers metadata tags from the folder path and file name.
 */
function inferTagsFromPath_(folderPath, fileName) {
  var tags = {};
  var pathLower = folderPath.toLowerCase();
  var nameLower = fileName.toLowerCase();

  // Camera detection
  if (pathLower.includes("a-cam")) tags.camera = "a-cam";
  else if (pathLower.includes("b-cam")) tags.camera = "b-cam";
  else if (pathLower.includes("phone")) tags.camera = "phone";

  // Scene type from folder
  if (pathLower.includes("interview")) tags.scene_type = "interview";
  else if (pathLower.includes("cooking")) tags.scene_type = "cooking";
  else if (pathLower.includes("portrait")) tags.scene_type = "portrait";
  else if (pathLower.includes("detail")) tags.scene_type = "detail";
  else if (pathLower.includes("b-roll") || pathLower.includes("broll")) tags.scene_type = "b-roll";
  else if (pathLower.includes("behind")) tags.scene_type = "behind-scenes";
  else if (pathLower.includes("ambient") || pathLower.includes("nat sound")) tags.scene_type = "atmosphere";

  // Location from folder
  if (pathLower.includes("kitchen")) tags.location = "main_kitchen";
  else if (pathLower.includes("dining")) tags.location = "dining_room";
  else if (pathLower.includes("exterior")) tags.location = "exterior";
  else if (pathLower.includes("prep")) tags.location = "prep_area";
  else if (pathLower.includes("backstage")) tags.location = "backstage";

  // Moment from folder
  if (pathLower.includes("pre-production") || pathLower.includes("pre-event")) tags.moment = "pre-event";
  else if (pathLower.includes("day of") || pathLower.includes("production")) tags.moment = "day-of";
  else if (pathLower.includes("post-production")) tags.moment = "post-service";

  // Reusability from folder
  if (pathLower.includes("social content") || pathLower.includes("instagram") || pathLower.includes("tiktok")) {
    tags.reusability = "social_clip";
  } else if (pathLower.includes("trailer")) {
    tags.reusability = "trailer";
  } else if (pathLower.includes("archive")) {
    tags.reusability = "archive_only";
  } else if (pathLower.includes("export")) {
    tags.reusability = "documentary";
  }

  // Chef detection from "BY CHEF" subfolder path
  if (pathLower.includes("by chef/")) {
    var chefMatch = folderPath.match(/BY CHEF\/([^\/]+)/i);
    if (chefMatch) {
      // Extract chef name (remove city in parentheses)
      var chefName = chefMatch[1].replace(/\s*\(.*?\)\s*/, "").trim();
      tags.chef = chefName;
    }
  }

  // Dish detection from "Dish — " subfolder
  if (pathLower.includes("dish")) {
    var dishMatch = folderPath.match(/Dish\s*[—-]\s*([^\/]+)/i);
    if (dishMatch && dishMatch[1] !== "TBD") {
      tags.dish = dishMatch[1].trim();
    }
  }

  return tags;
}


// ════════════════════════════════════════════════════════════════
// ASSET REPORT
// ════════════════════════════════════════════════════════════════

/**
 * Generates a summary report of all media assets and sends it via email.
 * Useful for production meetings and post-production planning.
 */
function mataSendAssetReport() {
  var config = getMataConfig();

  if (!config.MANIFEST_SHEET_ID) {
    Logger.log("ERROR: No manifest sheet configured.");
    return;
  }

  var sheet = SpreadsheetApp.openById(config.MANIFEST_SHEET_ID);
  var manifestTab = sheet.getSheetByName("Media Manifest");
  var data = manifestTab.getDataRange().getValues();

  if (data.length <= 1) {
    Logger.log("No media files in manifest yet.");
    return;
  }

  var rows = data.slice(1); // Skip header

  // Aggregate stats
  var totalFiles = rows.length;
  var totalSizeMb = rows.reduce(function(sum, row) { return sum + (parseFloat(row[5]) || 0); }, 0);
  var taggedCount = rows.filter(function(row) { return row[19]; }).length; // tagged_at column
  var untaggedCount = totalFiles - taggedCount;

  // By type
  var byType = {};
  rows.forEach(function(row) {
    var type = (row[4] || "unknown").split("/")[0];
    byType[type] = (byType[type] || 0) + 1;
  });

  // By chef
  var byChef = {};
  rows.forEach(function(row) {
    var chef = row[7] || "Unassigned";
    byChef[chef] = (byChef[chef] || 0) + 1;
  });

  // By scene type
  var byScene = {};
  rows.forEach(function(row) {
    var scene = row[9] || "Untagged";
    byScene[scene] = (byScene[scene] || 0) + 1;
  });

  // Build email
  var html = '<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto;">';
  html += '<h2 style="color: #1a1a2e;">Mata Media Report</h2>';
  html += '<p style="color: #666;">IK26 — Take Home Studio</p>';
  html += '<hr style="border: 1px solid #eee;">';

  html += '<h3>Overview</h3>';
  html += '<table style="width: 100%; border-collapse: collapse;">';
  html += '<tr><td style="padding: 4px 8px;">Total Files</td><td style="padding: 4px 8px; font-weight: bold;">' + totalFiles + '</td></tr>';
  html += '<tr><td style="padding: 4px 8px;">Total Size</td><td style="padding: 4px 8px; font-weight: bold;">' + (totalSizeMb / 1024).toFixed(1) + ' GB</td></tr>';
  html += '<tr><td style="padding: 4px 8px;">Tagged</td><td style="padding: 4px 8px; font-weight: bold;">' + taggedCount + '</td></tr>';
  html += '<tr><td style="padding: 4px 8px;">Needs Tagging</td><td style="padding: 4px 8px; font-weight: bold; color: ' + (untaggedCount > 0 ? '#e74c3c' : '#27ae60') + ';">' + untaggedCount + '</td></tr>';
  html += '</table>';

  html += '<h3>By Type</h3>';
  html += '<table style="width: 100%; border-collapse: collapse;">';
  Object.keys(byType).sort().forEach(function(type) {
    html += '<tr><td style="padding: 4px 8px;">' + type + '</td><td style="padding: 4px 8px; font-weight: bold;">' + byType[type] + '</td></tr>';
  });
  html += '</table>';

  html += '<h3>By Chef</h3>';
  html += '<table style="width: 100%; border-collapse: collapse;">';
  Object.keys(byChef).sort().forEach(function(chef) {
    html += '<tr><td style="padding: 4px 8px;">' + chef + '</td><td style="padding: 4px 8px; font-weight: bold;">' + byChef[chef] + '</td></tr>';
  });
  html += '</table>';

  html += '<h3>By Scene Type</h3>';
  html += '<table style="width: 100%; border-collapse: collapse;">';
  Object.keys(byScene).sort().forEach(function(scene) {
    html += '<tr><td style="padding: 4px 8px;">' + scene + '</td><td style="padding: 4px 8px; font-weight: bold;">' + byScene[scene] + '</td></tr>';
  });
  html += '</table>';

  html += '<hr style="border: 1px solid #eee;">';
  html += '<p style="color: #999; font-size: 12px;">Generated by Mata (Eye / To See) — IK26 Production Agent<br>';
  html += '<a href="' + sheet.getUrl() + '">View Full Manifest</a></p>';
  html += '</div>';

  MailApp.sendEmail({
    to: config.LEADERSHIP_EMAIL,
    subject: "[Mata] IK26 Media Asset Report — " + totalFiles + " files, " + (totalSizeMb / 1024).toFixed(1) + " GB",
    htmlBody: html,
  });

  Logger.log("Asset report sent to " + config.LEADERSHIP_EMAIL);
}


// ════════════════════════════════════════════════════════════════
// TRIGGER SETUP
// ════════════════════════════════════════════════════════════════

/**
 * Sets up time-driven triggers for Mata.
 * Run this once after initial setup.
 */
function mataSetupTriggers() {
  // Remove existing Mata triggers
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    var funcName = trigger.getHandlerFunction();
    if (funcName.indexOf("mata") === 0) {
      ScriptApp.deleteTrigger(trigger);
      Logger.log("Deleted existing trigger: " + funcName);
    }
  });

  // Scan & catalog: every 4 hours (increase to 30 min on event day)
  ScriptApp.newTrigger("mataScanAndCatalog")
    .timeBased()
    .everyHours(4)
    .create();
  Logger.log("Created trigger: mataScanAndCatalog (every 4 hours)");

  // Asset report: daily at 9 PM PT
  ScriptApp.newTrigger("mataSendAssetReport")
    .timeBased()
    .atHour(21)
    .everyDays(1)
    .inTimezone("America/Los_Angeles")
    .create();
  Logger.log("Created trigger: mataSendAssetReport (daily 9 PM PT)");

  Logger.log("Mata triggers configured.");
}

/**
 * Increases scan frequency for event day.
 * Run this manually on the morning of May 22.
 */
function mataEventDayMode() {
  // Remove the 4-hour scan trigger
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === "mataScanAndCatalog") {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Replace with 30-minute scan
  ScriptApp.newTrigger("mataScanAndCatalog")
    .timeBased()
    .everyMinutes(30)
    .create();

  Logger.log("EVENT DAY MODE: mataScanAndCatalog now runs every 30 minutes.");

  // Send a confirmation email
  MailApp.sendEmail({
    to: getMataConfig().LEADERSHIP_EMAIL,
    subject: "[Mata] Event Day Mode Activated",
    htmlBody: '<p>Mata is now scanning for new media files every 30 minutes.</p><p>Upload files to the IK26 Drive folder and they will be automatically cataloged and tagged.</p>',
  });
}


// ════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Recursively creates a folder tree.
 */
function createFolderTree_(parentFolder, structure) {
  for (var folderName in structure) {
    var folder = getOrCreateSubfolder_(parentFolder, folderName);
    if (structure[folderName].children) {
      createFolderTree_(folder, structure[folderName].children);
    }
  }
}

/**
 * Gets an existing subfolder or creates a new one.
 */
function getOrCreateSubfolder_(parentFolder, name) {
  var folders = parentFolder.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(name);
}

/**
 * Checks if a MIME type is a media file.
 */
function isMediaFile_(mimeType) {
  return (
    mimeType.indexOf("video/") === 0 ||
    mimeType.indexOf("image/") === 0 ||
    mimeType.indexOf("audio/") === 0 ||
    mimeType === "application/mxf" ||
    mimeType === "application/x-prores"
  );
}

/**
 * Fetches confirmed chefs from Supabase.
 */
function fetchChefsFromSupabase_(config) {
  if (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_KEY) {
    Logger.log("Supabase not configured. Skipping chef fetch.");
    return [];
  }

  try {
    var response = UrlFetchApp.fetch(
      config.SUPABASE_URL + "/rest/v1/chefs?confirmed=eq.true&select=id,name,city,dish_name",
      {
        method: "GET",
        headers: {
          "apikey": config.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + config.SUPABASE_SERVICE_KEY,
          "Content-Type": "application/json",
        },
        muteHttpExceptions: true,
      }
    );

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      Logger.log("Supabase error: " + response.getContentText());
      return [];
    }
  } catch (e) {
    Logger.log("Error fetching chefs: " + e.message);
    return [];
  }
}

/**
 * Syncs the manifest data to Supabase activity_feed for the edge function to access.
 * Run after mataScanAndCatalog to keep the edge function informed.
 */
function mataSyncManifestToSupabase() {
  var config = getMataConfig();

  if (!config.MANIFEST_SHEET_ID || !config.SUPABASE_URL) {
    Logger.log("Missing configuration for manifest sync.");
    return;
  }

  var sheet = SpreadsheetApp.openById(config.MANIFEST_SHEET_ID);
  var manifestTab = sheet.getSheetByName("Media Manifest");
  var data = manifestTab.getDataRange().getValues();
  var rows = data.slice(1);

  var summary = {
    totalFiles: rows.length,
    totalSizeMb: rows.reduce(function(sum, row) { return sum + (parseFloat(row[5]) || 0); }, 0),
    taggedCount: rows.filter(function(row) { return row[19]; }).length,
    byChef: {},
    bySceneType: {},
    byCamera: {},
    lastScan: new Date().toISOString(),
  };

  rows.forEach(function(row) {
    var chef = row[7] || "Unassigned";
    summary.byChef[chef] = (summary.byChef[chef] || 0) + 1;
    var scene = row[9] || "Untagged";
    summary.bySceneType[scene] = (summary.bySceneType[scene] || 0) + 1;
    var camera = row[12] || "Unknown";
    summary.byCamera[camera] = (summary.byCamera[camera] || 0) + 1;
  });

  try {
    var response = UrlFetchApp.fetch(
      config.SUPABASE_URL + "/rest/v1/activity_feed",
      {
        method: "POST",
        headers: {
          "apikey": config.SUPABASE_SERVICE_KEY,
          "Authorization": "Bearer " + config.SUPABASE_SERVICE_KEY,
          "Content-Type": "application/json",
          "Prefer": "return=minimal",
        },
        payload: JSON.stringify({
          message: "[Mata] Media manifest sync: " + rows.length + " files cataloged",
          type: "media_manifest_sync",
          metadata: {
            agent: "mata",
            summary: summary,
            manifestUrl: sheet.getUrl(),
          },
        }),
        muteHttpExceptions: true,
      }
    );

    Logger.log("Manifest synced to Supabase: " + response.getResponseCode());
  } catch (e) {
    Logger.log("Error syncing manifest: " + e.message);
  }
}
