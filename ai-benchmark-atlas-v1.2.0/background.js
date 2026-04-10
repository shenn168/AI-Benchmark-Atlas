// =============================================
// AI Benchmark Atlas — Background Service Worker
// =============================================

importScripts("data/benchmarks.js", "utils/updater.js");

// ---- Installation ----
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === "install") {
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
    }, function () {
      console.log("AI Benchmark Atlas installed. Seeded " + INITIAL_BENCHMARKS.length + " benchmarks.");
    });
  }

  // Set up periodic update check alarm
  chrome.alarms.create("atlas-update-check", {
    delayInMinutes: 5,
    periodInMinutes: 1440
  });
});

// ---- Alarm Handler ----
chrome.alarms.onAlarm.addListener(function (alarm) {
  if (alarm.name === "atlas-update-check") {
    performUpdateCheck();
  }
});

// ---- Update Check ----
function performUpdateCheck() {
  return UPDATER.checkForUpdates()
    .then(function (result) {
      var totalUpdates = (result.newCount || 0) + (result.updatedCount || 0);

      // Update badge
      if (totalUpdates > 0) {
        chrome.action.setBadgeText({ text: String(totalUpdates) });
        chrome.action.setBadgeBackgroundColor({ color: "#667eea" });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }

      // Update lastCheck timestamp
      return UPDATER.updateLastCheckTimestamp().then(function () {
        chrome.storage.local.set({ atlas_first_scan_done: true });
        console.log("AI Benchmark Atlas — Update check complete. New: " + result.newCount + ", Updated: " + result.updatedCount);
        return result;
      });
    })
    .catch(function (error) {
      console.error("AI Benchmark Atlas — Update check error:", error);
      return { newCount: 0, updatedCount: 0, error: error.message };
    });
}

// ---- Message Handler ----
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

  if (message.action === "get-benchmarks") {
    chrome.storage.local.get("atlas_benchmarks", function (result) {
      var benchmarks = result.atlas_benchmarks;
      if (!benchmarks || benchmarks.length === 0) {
        benchmarks = INITIAL_BENCHMARKS;
      }
      sendResponse({ benchmarks: benchmarks });
    });
    return true;
  }

  if (message.action === "get-pending-updates") {
    chrome.storage.local.get("atlas_pending_updates", function (result) {
      sendResponse({ pending: result.atlas_pending_updates || null });
    });
    return true;
  }

  if (message.action === "check-updates-now") {
    performUpdateCheck()
      .then(function (result) {
        sendResponse({ success: true, result: result });
      })
      .catch(function (error) {
        sendResponse({ success: false, error: error.message || "Unknown error" });
      });
    return true;
  }

  if (message.action === "apply-updates") {
    UPDATER.applyApprovedUpdates(
      message.approvedNewIds || [],
      message.approvedUpdateIds || []
    )
      .then(function () {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      })
      .catch(function (error) {
        sendResponse({ success: false, error: error.message || "Apply failed" });
      });
    return true;
  }

  if (message.action === "dismiss-updates") {
    UPDATER.dismissAllUpdates()
      .then(function () {
        chrome.action.setBadgeText({ text: "" });
        sendResponse({ success: true });
      });
    return true;
  }

  if (message.action === "get-settings") {
    chrome.storage.local.get("atlas_settings", function (result) {
      sendResponse({ settings: result.atlas_settings || {} });
    });
    return true;
  }

  if (message.action === "save-settings") {
    chrome.storage.local.set({ atlas_settings: message.settings }, function () {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === "get-first-scan-status") {
    chrome.storage.local.get("atlas_first_scan_done", function (result) {
      sendResponse({ done: result.atlas_first_scan_done || false });
    });
    return true;
  }

  if (message.action === "reset-benchmarks") {
    chrome.storage.local.set({
      atlas_benchmarks: INITIAL_BENCHMARKS,
      atlas_pending_updates: null
    }, function () {
      chrome.action.setBadgeText({ text: "" });
      sendResponse({ success: true, count: INITIAL_BENCHMARKS.length });
    });
    return true;
  }
});