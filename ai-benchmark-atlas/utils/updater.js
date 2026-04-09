// =============================================
// AI Benchmark Atlas — Update Checker Utility
// =============================================

var UPDATER = {
  DEFAULT_SOURCE_URL: "https://raw.githubusercontent.com/ai-benchmark-atlas/data/main/benchmarks.json",

  /**
   * Get the configured source URL from storage.
   * @returns {Promise<string>}
   */
  getSourceURL: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_settings", function (result) {
        var settings = result.atlas_settings || {};
        resolve(settings.sourceURL || UPDATER.DEFAULT_SOURCE_URL);
      });
    });
  },

  /**
   * Fetch remote benchmark data from the configured source.
   * @returns {Promise<Object>} Parsed JSON with benchmarks array.
   */
  fetchRemoteBenchmarks: function () {
    return UPDATER.getSourceURL().then(function (url) {
      return fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-cache"
      }).then(function (response) {
        if (!response.ok) {
          throw new Error("Fetch failed with status " + response.status);
        }
        return response.json();
      });
    });
  },

  /**
   * Compare remote benchmarks with local ones.
   * Returns arrays of new benchmarks and updated benchmarks.
   * @param {Array} remoteBenchmarks
   * @param {Array} localBenchmarks
   * @returns {Object} { newBenchmarks: [], updatedBenchmarks: [] }
   */
  diffBenchmarks: function (remoteBenchmarks, localBenchmarks) {
    var localMap = {};
    var i;

    for (i = 0; i < localBenchmarks.length; i++) {
      localMap[localBenchmarks[i].id] = localBenchmarks[i];
    }

    var newBenchmarks = [];
    var updatedBenchmarks = [];

    for (i = 0; i < remoteBenchmarks.length; i++) {
      var remote = remoteBenchmarks[i];
      var local = localMap[remote.id];

      if (!local) {
        newBenchmarks.push(remote);
      } else if (remote.lastUpdated && local.lastUpdated && remote.lastUpdated > local.lastUpdated) {
        updatedBenchmarks.push(remote);
      }
    }

    return {
      newBenchmarks: newBenchmarks,
      updatedBenchmarks: updatedBenchmarks
    };
  },

  /**
   * Check for updates and store pending changes for user approval.
   * @returns {Promise<Object>} { newCount, updatedCount }
   */
  checkForUpdates: function () {
    var remoteData = null;
    var localData = null;
    var sourceURL = null;

    return UPDATER.fetchRemoteBenchmarks()
      .then(function (data) {
        remoteData = data;
        return UPDATER.getLocalBenchmarks();
      })
      .then(function (local) {
        localData = local;
        return UPDATER.getSourceURL();
      })
      .then(function (url) {
        sourceURL = url;

        var remoteBenchmarks = (remoteData && remoteData.benchmarks) ? remoteData.benchmarks : [];
        var diff = UPDATER.diffBenchmarks(remoteBenchmarks, localData);

        return new Promise(function (resolve) {
          chrome.storage.local.set({
            atlas_pending_updates: {
              newBenchmarks: diff.newBenchmarks,
              updatedBenchmarks: diff.updatedBenchmarks,
              checkedAt: Date.now(),
              sourceURL: sourceURL
            }
          }, function () {
            resolve({
              newCount: diff.newBenchmarks.length,
              updatedCount: diff.updatedBenchmarks.length
            });
          });
        });
      })
      .catch(function (error) {
        console.error("AI Benchmark Atlas — Update check failed:", error.message);
        return { newCount: 0, updatedCount: 0, error: error.message };
      });
  },

  /**
   * Get local benchmarks from storage.
   * @returns {Promise<Array>}
   */
  getLocalBenchmarks: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_benchmarks", function (result) {
        resolve(result.atlas_benchmarks || []);
      });
    });
  },

  /**
   * Save benchmarks to local storage.
   * @param {Array} benchmarks
   * @returns {Promise<void>}
   */
  saveBenchmarks: function (benchmarks) {
    return new Promise(function (resolve) {
      chrome.storage.local.set({ atlas_benchmarks: benchmarks }, resolve);
    });
  },

  /**
   * Apply approved updates to the local knowledge base.
   * @param {Array} approvedNewIds - IDs of new benchmarks user approved to add.
   * @param {Array} approvedUpdateIds - IDs of updated benchmarks user approved to apply.
   * @returns {Promise<void>}
   */
  applyApprovedUpdates: function (approvedNewIds, approvedUpdateIds) {
    var pendingData = null;

    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_pending_updates", function (result) {
        pendingData = result.atlas_pending_updates || {};
        resolve();
      });
    })
      .then(function () {
        return UPDATER.getLocalBenchmarks();
      })
      .then(function (localBenchmarks) {
        // Build a map of local benchmark index by id
        var localMap = {};
        var i;

        for (i = 0; i < localBenchmarks.length; i++) {
          localMap[localBenchmarks[i].id] = i;
        }

        // Add approved new benchmarks
        var newBenchmarks = pendingData.newBenchmarks || [];
        for (i = 0; i < newBenchmarks.length; i++) {
          if (approvedNewIds.indexOf(newBenchmarks[i].id) !== -1) {
            // Prevent duplicates
            if (localMap[newBenchmarks[i].id] === undefined) {
              localBenchmarks.push(newBenchmarks[i]);
            }
          }
        }

        // Apply approved updates to existing benchmarks
        var updatedBenchmarks = pendingData.updatedBenchmarks || [];
        for (i = 0; i < updatedBenchmarks.length; i++) {
          if (approvedUpdateIds.indexOf(updatedBenchmarks[i].id) !== -1) {
            var localIndex = localMap[updatedBenchmarks[i].id];
            if (localIndex !== undefined) {
              localBenchmarks[localIndex] = updatedBenchmarks[i];
            }
          }
        }

        return UPDATER.saveBenchmarks(localBenchmarks);
      })
      .then(function () {
        // Clear pending updates after applying
        return new Promise(function (resolve) {
          chrome.storage.local.set({ atlas_pending_updates: null }, resolve);
        });
      });
  },

  /**
   * Get the timestamp of the last successful update check.
   * @returns {Promise<number|null>}
   */
  getLastCheckTimestamp: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_settings", function (result) {
        var settings = result.atlas_settings || {};
        resolve(settings.lastCheck || null);
      });
    });
  },

  /**
   * Update the last check timestamp to now.
   * @returns {Promise<void>}
   */
  updateLastCheckTimestamp: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_settings", function (result) {
        var settings = result.atlas_settings || {};
        settings.lastCheck = Date.now();
        chrome.storage.local.set({ atlas_settings: settings }, resolve);
      });
    });
  },

  /**
   * Get the count of pending updates without fetching full data.
   * @returns {Promise<number>}
   */
  getPendingCount: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_pending_updates", function (result) {
        var pending = result.atlas_pending_updates;
        if (!pending) {
          resolve(0);
          return;
        }
        var newCount = (pending.newBenchmarks && pending.newBenchmarks.length) ? pending.newBenchmarks.length : 0;
        var updateCount = (pending.updatedBenchmarks && pending.updatedBenchmarks.length) ? pending.updatedBenchmarks.length : 0;
        resolve(newCount + updateCount);
      });
    });
  },

  /**
   * Dismiss all pending updates without applying them.
   * @returns {Promise<void>}
   */
  dismissAllUpdates: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.set({ atlas_pending_updates: null }, resolve);
    });
  },

  /**
   * Validate that a benchmark object has all required fields.
   * @param {Object} benchmark
   * @returns {boolean}
   */
  isValidBenchmark: function (benchmark) {
    if (!benchmark) return false;
    if (typeof benchmark.id !== "string" || benchmark.id.length === 0) return false;
    if (typeof benchmark.name !== "string" || benchmark.name.length === 0) return false;
    if (typeof benchmark.category !== "string") return false;

    // Check levels
    if (!benchmark.levels) return false;
    if (!benchmark.levels.nonTechnical || typeof benchmark.levels.nonTechnical.content !== "string") return false;
    if (!benchmark.levels.intermediate || typeof benchmark.levels.intermediate.content !== "string") return false;
    if (!benchmark.levels.expert || typeof benchmark.levels.expert.content !== "string") return false;

    return true;
  },

  /**
   * Filter remote benchmarks to only include valid ones.
   * @param {Array} benchmarks
   * @returns {Array}
   */
  filterValidBenchmarks: function (benchmarks) {
    var valid = [];
    for (var i = 0; i < benchmarks.length; i++) {
      if (UPDATER.isValidBenchmark(benchmarks[i])) {
        valid.push(benchmarks[i]);
      } else {
        console.warn("AI Benchmark Atlas — Skipping invalid benchmark:", benchmarks[i].id || "unknown");
      }
    }
    return valid;
  }
};