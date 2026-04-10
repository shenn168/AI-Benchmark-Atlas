// =============================================
// AI Benchmark Atlas — Update Checker Utility
// All methods use .then() chains only (no async/await)
// for MV3 service worker compatibility.
// =============================================

var UPDATER = {
  DEFAULT_SOURCE_URL: "https://raw.githubusercontent.com/ai-benchmark-atlas/data/main/benchmarks.json",

  /**
   * Normalize a benchmark ID to a canonical hyphenated format.
   * Prevents mismatch between "swebench-verified" and "swe-bench-verified".
   * @param {string} id
   * @returns {string}
   */
  normalizeId: function (id) {
    if (typeof id !== "string") return id;
    return id
      .toLowerCase()
      .trim()
      // Insert hyphen before known compound prefixes if missing
      .replace(/^swebench/, "swe-bench")
      .replace(/^humanitys[-_]?last[-_]?exam/, "hle")
      .replace(/[-_]+/g, "-");
  },

  /**
   * Apply ID normalization to a benchmarks array.
   * Call this on remote benchmarks before diffing to prevent
   * hyphen/format mismatches causing false "new benchmark" detections.
   * @param {Array} benchmarks
   * @returns {Array}
   */
  normalizeBenchmarkIds: function (benchmarks) {
    if (!Array.isArray(benchmarks)) return [];
    return benchmarks.map(function (b) {
      if (!b || !b.id) return b;
      var normalized = UPDATER.normalizeId(b.id);
      if (normalized !== b.id) {
        console.log(
          "AI Benchmark Atlas — Normalized ID: " + b.id + " → " + normalized
        );
      }
      return Object.assign({}, b, { id: normalized });
    });
  },

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
   * Includes full error handling for network and parse failures.
   * @returns {Promise<Object>} Parsed JSON with benchmarks array.
   */
  fetchRemoteBenchmarks: function () {
    return UPDATER.getSourceURL().then(function (url) {
      console.log("AI Benchmark Atlas — Fetching from: " + url);

      return fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-cache"
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("HTTP " + response.status + " from " + url);
          }
          return response.text();
        })
        .then(function (text) {
          try {
            var data = JSON.parse(text);
            console.log("AI Benchmark Atlas — Fetched remote data successfully.");
            return data;
          } catch (e) {
            throw new Error(
              "Invalid JSON in remote benchmarks file: " + e.message
            );
          }
        });
    });
  },

  /**
   * Compare remote benchmarks with local ones.
   * A benchmark is "new" if its id doesn't exist locally.
   * A benchmark is "updated" if its lastUpdated date is newer.
   * Expects remote benchmarks to already be ID-normalized before calling.
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

      // Skip invalid entries
      if (!remote || !remote.id) {
        console.warn(
          "AI Benchmark Atlas — Skipping invalid remote entry at index " + i
        );
        continue;
      }

      var local = localMap[remote.id];

      if (!local) {
        // This is a new benchmark not in local storage
        newBenchmarks.push(remote);
        console.log("AI Benchmark Atlas — New benchmark found: " + remote.id);
      } else {
        // Check if remote version is newer
        var remoteDate = remote.lastUpdated || "1970-01-01";
        var localDate  = local.lastUpdated  || "1970-01-01";

        if (remoteDate > localDate) {
          updatedBenchmarks.push(remote);
          console.log(
            "AI Benchmark Atlas — Updated benchmark found: " +
              remote.id +
              " (remote: " + remoteDate +
              ", local: "  + localDate  + ")"
          );
        }
      }
    }

    console.log(
      "AI Benchmark Atlas — Diff result: " +
        newBenchmarks.length     + " new, " +
        updatedBenchmarks.length + " updated."
    );

    return {
      newBenchmarks:     newBenchmarks,
      updatedBenchmarks: updatedBenchmarks
    };
  },

  /**
   * Check for updates and store pending changes for user approval.
   * This is the main entry point called by background.js.
   * ID normalization is applied to remote benchmarks before diffing
   * to prevent false positives from hyphen/format inconsistencies.
   * @returns {Promise<Object>} { newCount, updatedCount }
   */
  checkForUpdates: function () {
    var remoteResult      = null;
    var localResult       = null;
    var resolvedSourceURL = null;

    return UPDATER.fetchRemoteBenchmarks()
      .then(function (data) {
        remoteResult = data;
        return UPDATER.getLocalBenchmarks();
      })
      .then(function (localBenchmarks) {
        localResult = localBenchmarks;
        return UPDATER.getSourceURL();
      })
      .then(function (url) {
        resolvedSourceURL = url;

        // Extract benchmarks array from remote data
        var remoteBenchmarks = [];
        if (remoteResult && Array.isArray(remoteResult.benchmarks)) {
          remoteBenchmarks = remoteResult.benchmarks;
        } else if (Array.isArray(remoteResult)) {
          // Support flat array format too
          remoteBenchmarks = remoteResult;
        }

        // Validate remote benchmarks
        remoteBenchmarks = UPDATER.filterValidBenchmarks(remoteBenchmarks);

        // ── NEW: Normalize IDs before diffing ──────────────────────────────
        // Prevents format mismatches (e.g. "swebench-verified" vs
        // "swe-bench-verified") from appearing as false new benchmarks.
        remoteBenchmarks = UPDATER.normalizeBenchmarkIds(remoteBenchmarks);
        // ───────────────────────────────────────────────────────────────────

        console.log(
          "AI Benchmark Atlas — Remote benchmarks count: " + remoteBenchmarks.length
        );
        console.log(
          "AI Benchmark Atlas — Local benchmarks count: "  + localResult.length
        );

        var diff = UPDATER.diffBenchmarks(remoteBenchmarks, localResult);

        // Store pending updates for user approval
        return new Promise(function (resolve) {
          chrome.storage.local.set(
            {
              atlas_pending_updates: {
                newBenchmarks:     diff.newBenchmarks,
                updatedBenchmarks: diff.updatedBenchmarks,
                checkedAt:         Date.now(),
                sourceURL:         resolvedSourceURL
              }
            },
            function () {
              var result = {
                newCount:     diff.newBenchmarks.length,
                updatedCount: diff.updatedBenchmarks.length
              };
              console.log(
                "AI Benchmark Atlas — Pending updates stored: " +
                  result.newCount     + " new, " +
                  result.updatedCount + " updated."
              );
              resolve(result);
            }
          );
        });
      })
      .catch(function (error) {
        console.error("AI Benchmark Atlas — Update check failed:", error.message);
        return { newCount: 0, updatedCount: 0, error: error.message };
      });
  },

  /**
   * Get local benchmarks from storage.
   * Falls back to an empty array if nothing is stored yet.
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
      chrome.storage.local.set({ atlas_benchmarks: benchmarks }, function () {
        console.log(
          "AI Benchmark Atlas — Saved " +
            benchmarks.length + " benchmarks to local storage."
        );
        resolve();
      });
    });
  },

  /**
   * Apply approved updates to the local knowledge base.
   * Prevents duplicates at write time as a second line of defence
   * (first line is normalizeBenchmarkIds in checkForUpdates).
   * @param {Array} approvedNewIds     - IDs of new benchmarks user approved to add.
   * @param {Array} approvedUpdateIds  - IDs of updated benchmarks user approved to apply.
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
        // Build index map of local benchmarks by id
        var localMap = {};
        var i;

        for (i = 0; i < localBenchmarks.length; i++) {
          localMap[localBenchmarks[i].id] = i;
        }

        // Add approved new benchmarks
        var newBenchmarks = pendingData.newBenchmarks || [];
        var addedCount    = 0;

        for (i = 0; i < newBenchmarks.length; i++) {
          if (approvedNewIds.indexOf(newBenchmarks[i].id) !== -1) {
            // Prevent duplicates — second line of defence
            if (localMap[newBenchmarks[i].id] === undefined) {
              localBenchmarks.push(newBenchmarks[i]);
              localMap[newBenchmarks[i].id] = localBenchmarks.length - 1;
              addedCount++;
              console.log(
                "AI Benchmark Atlas — Added new benchmark: " + newBenchmarks[i].id
              );
            } else {
              console.warn(
                "AI Benchmark Atlas — Skipped duplicate on add: " +
                  newBenchmarks[i].id
              );
            }
          }
        }

        // Apply approved updates to existing benchmarks
        var updatedBenchmarks = pendingData.updatedBenchmarks || [];
        var updatedCount      = 0;

        for (i = 0; i < updatedBenchmarks.length; i++) {
          if (approvedUpdateIds.indexOf(updatedBenchmarks[i].id) !== -1) {
            var localIndex = localMap[updatedBenchmarks[i].id];
            if (localIndex !== undefined) {
              localBenchmarks[localIndex] = updatedBenchmarks[i];
              updatedCount++;
              console.log(
                "AI Benchmark Atlas — Updated benchmark: " + updatedBenchmarks[i].id
              );
            }
          }
        }

        console.log(
          "AI Benchmark Atlas — Applied " +
            addedCount   + " new, " +
            updatedCount + " updated benchmarks."
        );
        return UPDATER.saveBenchmarks(localBenchmarks);
      })
      .then(function () {
        // Clear pending updates after applying
        return new Promise(function (resolve) {
          chrome.storage.local.set({ atlas_pending_updates: null }, function () {
            console.log("AI Benchmark Atlas — Cleared pending updates.");
            resolve();
          });
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
        var settings      = result.atlas_settings || {};
        settings.lastCheck = Date.now();
        chrome.storage.local.set({ atlas_settings: settings }, resolve);
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
   * Get the count of pending updates without fetching full data.
   * @returns {Promise<number>}
   */
  getPendingCount: function () {
    return new Promise(function (resolve) {
      chrome.storage.local.get("atlas_pending_updates", function (result) {
        var pending    = result.atlas_pending_updates;
        if (!pending) {
          resolve(0);
          return;
        }
        var newCount    = pending.newBenchmarks    ? pending.newBenchmarks.length    : 0;
        var updateCount = pending.updatedBenchmarks? pending.updatedBenchmarks.length: 0;
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
      chrome.storage.local.set({ atlas_pending_updates: null }, function () {
        console.log("AI Benchmark Atlas — Dismissed all pending updates.");
        resolve();
      });
    });
  },

  /**
   * Validate that a benchmark object has all required fields.
   * @param {Object} benchmark
   * @returns {boolean}
   */
  isValidBenchmark: function (benchmark) {
    if (!benchmark) return false;
    if (typeof benchmark.id   !== "string" || benchmark.id.length   === 0) return false;
    if (typeof benchmark.name !== "string" || benchmark.name.length === 0) return false;
    if (typeof benchmark.category !== "string") return false;

    // Check levels exist with content
    if (!benchmark.levels) return false;
    if (
      !benchmark.levels.nonTechnical ||
      typeof benchmark.levels.nonTechnical.content !== "string"
    ) return false;
    if (
      !benchmark.levels.intermediate ||
      typeof benchmark.levels.intermediate.content !== "string"
    ) return false;
    if (
      !benchmark.levels.expert ||
      typeof benchmark.levels.expert.content !== "string"
    ) return false;

    return true;
  },

  /**
   * Filter remote benchmarks to only include valid ones.
   * Logs a warning for every entry that fails validation.
   * @param {Array} benchmarks
   * @returns {Array}
   */
  filterValidBenchmarks: function (benchmarks) {
    if (!Array.isArray(benchmarks)) return [];

    var valid = [];
    for (var i = 0; i < benchmarks.length; i++) {
      if (UPDATER.isValidBenchmark(benchmarks[i])) {
        valid.push(benchmarks[i]);
      } else {
        console.warn(
          "AI Benchmark Atlas — Skipping invalid benchmark:",
          (benchmarks[i] && benchmarks[i].id) || "unknown at index " + i
        );
      }
    }
    return valid;
  }

};