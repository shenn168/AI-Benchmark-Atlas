// =============================================
// AI Benchmark Atlas — Background Service Worker
// =============================================

importScripts("data/benchmarks.js", "utils/updater.js");

// ---- Installation ----
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
    // Seed the initial offline knowledge base
    chrome.storage.local.set({
      atlas_benchmarks: INITIAL_BENCHMARKS,
      atlas_settings: {
        sourceURL: UPDATER.DEFAULT_SOURCE_URL,
        checkInterval: 24,
        lastCheck: null,
        theme: "dark"
      },
      atlas_pending_updates: null,
      atlas_first_scan_done: false
    });

    console.log("AI Benchmark Atlas installed. Seeded " + INITIAL_BENCHMARKS.length + " benchmarks.");
  }

  // Set up periodic update check alarm
  chrome.alarms.create("atlas-update-check", {
    delayInMinutes: 5,
    periodInMinutes: 1440  // 24 hours
  });
});

// ---- Alarm Handler ----
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "atlas-update-check") {
    performUpdateCheck();
  }
});

// ---- Update Check ----
async function performUpdateCheck() {
  try {
    var result = await UPDATER.checkForUpdates();
    var totalUpdates = result.newCount + result.updatedCount;

    if (totalUpdates > 0) {
      chrome.action.setBadgeText({ text: String(totalUpdates) });
      chrome.action.setBadgeBackgroundColor({ color: "#667eea" });

      // Store check result
      chrome.storage.local.get("atlas_settings", function (data) {
        var settings = data.atlas_settings || {};
        settings.lastCheck = Date.now();
        chrome.storage.local.set({ atlas_settings: settings });
      });

      // Mark first scan done
      chrome.storage.local.set({ atlas_first_scan_done: true });
    } else {
      chrome.action.setBadgeText({ text: "" });
      chrome.storage.local.set({ atlas_first_scan_done: true });
    }
  } catch (error) {
    console.error("Atlas update check error:", error);
  }
}

// ---- Message Handler ----
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

  if (message.action === "get-benchmarks") {
    chrome.storage.local.get("atlas_benchmarks", function (result) {
      sendResponse({ benchmarks: result.atlas_benchmarks || INITIAL_BENCHMARKS });
    });
    return true;
  }

  if (message.action === "get-pending-updates") {
    chrome.storage.local.get("atlas_pending_updates", function (result) {
      sendResponse({ pending: result.atlas_pending_updates });
    });
    return true;
  }

  if (message.action === "check-updates-now") {
    performUpdateCheck().then(function (result) {
      sendResponse({ success: true, result: result });
    }).catch(function (error) {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === "apply-updates") {
    UPDATER.applyApprovedUpdates(
      message.approvedNewIds || [],
      message.approvedUpdateIds || []
    ).then(function () {
      chrome.action.setBadgeText({ text: "" });
      sendResponse({ success: true });
    }).catch(function (error) {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }

  if (message.action === "dismiss-updates") {
    chrome.storage.local.set({ atlas_pending_updates: null });
    chrome.action.setBadgeText({ text: "" });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "get-settings") {
    chrome.storage.local.get("atlas_settings", function (result) {
      sendResponse({ settings: result.atlas_settings || {} });
    });
    return true;
  }

  if (message.action === "save-settings") {
    chrome.storage.local.set({ atlas_settings: message.settings });
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "get-first-scan-status") {
    chrome.storage.local.get("atlas_first_scan_done", function (result) {
      sendResponse({ done: result.atlas_first_scan_done || false });
    });
    return true;
  }
});