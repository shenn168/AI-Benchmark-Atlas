// =============================================
// AI Benchmark Atlas — Full Reference Page Script
// =============================================

(function () {
  "use strict";

  var benchmarks = [];
  var activeCategory = "all";
  var searchQuery = "";
  var activeDepths = {};
  var currentSection = "benchmarks";
  var pendingUpdateData = null;
  var approvalState = {};

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", function () {
    loadBenchmarks();
    renderCategories();
    bindNavigation();
    bindSearch();
    bindSettings();
    bindUpdateActions();
    checkConnection();
    checkPendingUpdates();

    // Handle hash navigation
    if (window.location.hash === "#updates") {
      switchSection("updates");
    }
  });

  // ---- Load Benchmarks ----
  function loadBenchmarks() {
    chrome.runtime.sendMessage({ action: "get-benchmarks" }, function (response) {
      benchmarks = response.benchmarks || INITIAL_BENCHMARKS;
      renderGrid();
      updateStats();
    });
  }

  // ---- Connection ----
  function checkConnection() {
    updateConnectionUI();
    window.addEventListener("online", updateConnectionUI);
    window.addEventListener("offline", updateConnectionUI);
  }

  function updateConnectionUI() {
    var dot = document.getElementById("ref-conn-dot");
    var text = document.getElementById("ref-conn-text");
    if (navigator.onLine) {
      dot.className = "atlas-dot atlas-dot-online";
      text.textContent = "Online";
    } else {
      dot.className = "atlas-dot atlas-dot-offline";
      text.textContent = "Offline";
    }
  }

  // ---- Navigation ----
  function bindNavigation() {
    var navBtns = document.querySelectorAll(".ref-nav-btn");
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].addEventListener("click", function () {
        var section = this.getAttribute("data-section");
        switchSection(section);
      });
    }
  }

  function switchSection(section) {
    currentSection = section;

    // Update nav buttons
    var navBtns = document.querySelectorAll(".ref-nav-btn");
    for (var i = 0; i < navBtns.length; i++) {
      navBtns[i].classList.toggle("active", navBtns[i].getAttribute("data-section") === section);
    }

    // Show/hide sections
    var sections = ["benchmarks", "updates", "settings"];
    for (var j = 0; j < sections.length; j++) {
      var el = document.getElementById("section-" + sections[j]);
      if (el) {
        el.style.display = sections[j] === section ? "block" : "none";
      }
    }

    if (section === "updates") {
      renderUpdatesSection();
    }
    if (section === "settings") {
      loadSettingsUI();
    }
  }

  // ---- Categories ----
  function renderCategories() {
    var container = document.getElementById("ref-categories");
    var html = "";
    for (var i = 0; i < BENCHMARK_CATEGORIES.length; i++) {
      var cat = BENCHMARK_CATEGORIES[i];
      html += '<button class="ref-cat-btn' + (cat.id === activeCategory ? " active" : "") + '" data-cat="' + cat.id + '">';
      html += cat.icon + " " + cat.label + "</button>";
    }
    container.innerHTML = html;

    var btns = container.querySelectorAll(".ref-cat-btn");
    for (var j = 0; j < btns.length; j++) {
      btns[j].addEventListener("click", function () {
        activeCategory = this.getAttribute("data-cat");
        var allBtns = container.querySelectorAll(".ref-cat-btn");
        for (var k = 0; k < allBtns.length; k++) {
          allBtns[k].classList.remove("active");
        }
        this.classList.add("active");
        renderGrid();
      });
    }
  }

  // ---- Search ----
  function bindSearch() {
    document.getElementById("ref-search").addEventListener("input", function () {
      searchQuery = this.value.trim();
      renderGrid();
    });
  }

  // ---- Filter ----
  function getFiltered() {
    var result = [];
    for (var i = 0; i < benchmarks.length; i++) {
      var b = benchmarks[i];
      var catMatch = activeCategory === "all" || b.category === activeCategory;
      var searchMatch = true;

      if (searchQuery.length > 0) {
        var q = searchQuery.toLowerCase();
        searchMatch = (
          b.name.toLowerCase().indexOf(q) !== -1 ||
          b.shortDescription.toLowerCase().indexOf(q) !== -1 ||
          b.category.toLowerCase().indexOf(q) !== -1 ||
          b.levels.nonTechnical.content.toLowerCase().indexOf(q) !== -1 ||
          b.levels.intermediate.content.toLowerCase().indexOf(q) !== -1 ||
          b.levels.expert.content.toLowerCase().indexOf(q) !== -1
        );
      }

      if (catMatch && searchMatch) {
        result.push(b);
      }
    }
    return result;
  }

  // ---- Render Benchmark Grid ----
  function renderGrid() {
    var container = document.getElementById("ref-benchmark-grid");
    var filtered = getFiltered();

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="ref-empty-state"><div class="ref-empty-icon">🔎</div>' +
        "<h3>No benchmarks found</h3><p>Try a different search term or category.</p></div>";
      return;
    }

    var html = "";
    for (var i = 0; i < filtered.length; i++) {
      var b = filtered[i];
      var depth = activeDepths[b.id] || "nonTechnical";

      html += '<div class="ref-full-card" data-id="' + b.id + '">';

      // Header
      html += '<div class="ref-full-card-header">';
      html += '<span class="ref-full-card-icon">' + b.icon + "</span>";
      html += "<div>";
      html += '<div class="ref-full-card-title">' + esc(b.name);
      html += '<span class="ref-full-card-cat">' + esc(b.category) + "</span></div>";
      html += '<div class="ref-full-card-desc">' + esc(b.shortDescription) + "</div>";
      html += "</div></div>";

      // Body
      html += '<div class="ref-full-card-body">';

      // Depth tabs
      html += '<div class="ref-full-depth-tabs">';
      html += '<button class="ref-full-depth-tab' + (depth === "nonTechnical" ? " active" : "") + '" data-id="' + b.id + '" data-depth="nonTechnical">🟢 Plain English</button>';
      html += '<button class="ref-full-depth-tab' + (depth === "intermediate" ? " active" : "") + '" data-id="' + b.id + '" data-depth="intermediate">🟡 Intermediate</button>';
      html += '<button class="ref-full-depth-tab' + (depth === "expert" ? " active" : "") + '" data-id="' + b.id + '" data-depth="expert">🔴 Expert</button>';
      html += "</div>";

      // Content
      html += '<div class="ref-full-depth-content">' + esc(b.levels[depth].content) + "</div>";

      // Scores
      if (b.scores && b.scores.length > 0) {
        html += '<div class="ref-scores-header">Model Scores</div>';
        html += '<table class="ref-score-table">';
        html += '<thead><tr><th>Model</th><th>Score</th><th class="ref-bar-cell"></th><th>Date</th><th></th></tr></thead><tbody>';

        var sorted = b.scores.slice().sort(function (a, bItem) {
          return bItem.score - a.score;
        });

        for (var s = 0; s < sorted.length; s++) {
          var sc = sorted[s];
          html += "<tr>";
          html += "<td>" + esc(sc.model) + "</td>";
          html += '<td class="ref-score-val">' + sc.score + "%</td>";
          html += '<td class="ref-bar-cell"><div class="ref-bar-wrap"><div class="ref-bar-fill" style="width:' + sc.score + '%"></div></div></td>';
          html += "<td>" + esc(sc.date || "") + "</td>";
          html += "<td>" + (sc.note ? '<span class="ref-score-note-text">' + esc(sc.note) + "</span>" : "") + "</td>";
          html += "</tr>";
        }
        html += "</tbody></table>";
      }

      // Sources
      if (b.sources && b.sources.length > 0) {
        html += '<div class="ref-sources">';
        for (var sr = 0; sr < b.sources.length; sr++) {
          var domain = b.sources[sr].replace(/https?:\/\//, "").replace(/\/.*/, "");
          html += '<a href="' + esc(b.sources[sr]) + '" target="_blank" class="ref-source-chip">📎 ' + esc(domain) + "</a>";
        }
        html += "</div>";
      }

      html += "</div>"; // body
      html += "</div>"; // card
    }

    container.innerHTML = html;

    // Bind depth tab clicks
    var tabs = container.querySelectorAll(".ref-full-depth-tab");
    for (var t = 0; t < tabs.length; t++) {
      tabs[t].addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        var dp = this.getAttribute("data-depth");
        activeDepths[id] = dp;
        renderGrid();
      });
    }
  }

  // ---- Update Stats ----
  function updateStats() {
    var el = document.getElementById("ref-total-benchmarks");
    if (el) {
      el.textContent = benchmarks.length;
    }
  }

  // ---- Pending Updates Badge ----
  function checkPendingUpdates() {
    chrome.runtime.sendMessage({ action: "get-pending-updates" }, function (response) {
      var pending = response.pending;
      var badge = document.getElementById("nav-update-badge");

      if (pending && (pending.newBenchmarks.length > 0 || pending.updatedBenchmarks.length > 0)) {
        var total = pending.newBenchmarks.length + pending.updatedBenchmarks.length;
        badge.textContent = total;
        badge.style.display = "inline";
        pendingUpdateData = pending;
      } else {
        badge.style.display = "none";
        pendingUpdateData = null;
      }
    });
  }

  // ---- Render Updates Section ----
  function renderUpdatesSection() {
    var content = document.getElementById("ref-updates-content");

    chrome.runtime.sendMessage({ action: "get-pending-updates" }, function (response) {
      var pending = response.pending;
      pendingUpdateData = pending;

      if (!pending || (pending.newBenchmarks.length === 0 && pending.updatedBenchmarks.length === 0)) {
        content.innerHTML =
          '<div class="ref-empty-state">' +
          '<div class="ref-empty-icon">✅</div>' +
          "<h3>All up to date</h3>" +
          '<p>Your local knowledge base is current. Click "Check Now" to scan for new benchmarks.</p>' +
          "</div>";
        return;
      }

      var html = "";

      // Bulk action bar
      var totalItems = pending.newBenchmarks.length + pending.updatedBenchmarks.length;
      html += '<div class="ref-update-bulk-bar">';
      html += '<span class="ref-update-bulk-text">' + totalItems + " pending item" + (totalItems > 1 ? "s" : "") + "</span>";
      html += '<div class="ref-update-bulk-actions">';
      html += '<button id="btn-approve-all" class="ref-btn ref-btn-success">✅ Approve All</button>';
      html += '<button id="btn-dismiss-all" class="ref-btn ref-btn-outline">✕ Dismiss All</button>';
      html += "</div></div>";

      // New benchmarks
      if (pending.newBenchmarks.length > 0) {
        html += '<h3 class="ref-update-group-title">🆕 New Benchmarks (' + pending.newBenchmarks.length + ")</h3>";

        for (var i = 0; i < pending.newBenchmarks.length; i++) {
          var nb = pending.newBenchmarks[i];
          var isApproved = approvalState[nb.id] === "approved";
          var isDismissed = approvalState[nb.id] === "dismissed";

          html += '<div class="ref-update-card' + (isDismissed ? " ref-update-dismissed" : "") + '" data-id="' + nb.id + '" data-type="new">';
          html += '<span class="ref-update-card-icon">' + (nb.icon || "📊") + "</span>";
          html += '<div class="ref-update-card-info">';
          html += '<div class="ref-update-card-name">' + esc(nb.name);
          html += '<span class="ref-update-card-type ref-update-type-new">NEW</span></div>';
          html += '<div class="ref-update-card-desc">' + esc(nb.shortDescription || "") + "</div>";

          // Preview: show plain english explanation
          if (nb.levels && nb.levels.nonTechnical) {
            html += '<div class="ref-update-preview">' + esc(nb.levels.nonTechnical.content) + "</div>";
          }

          // Category and score count
          html += '<div class="ref-update-meta">';
          html += '<span class="ref-update-meta-item">📂 ' + esc(nb.category || "Unknown") + "</span>";
          if (nb.scores) {
            html += '<span class="ref-update-meta-item">📊 ' + nb.scores.length + " model score" + (nb.scores.length > 1 ? "s" : "") + "</span>";
          }
          html += "</div>";

          html += "</div>"; // info

          // Action buttons
          html += '<div class="ref-update-card-actions">';
          if (isApproved) {
            html += '<span class="ref-update-status ref-update-status-approved">✅ Approved</span>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-undo-btn" data-id="' + nb.id + '">Undo</button>';
          } else if (isDismissed) {
            html += '<span class="ref-update-status ref-update-status-dismissed">✕ Dismissed</span>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-undo-btn" data-id="' + nb.id + '">Undo</button>';
          } else {
            html += '<button class="ref-btn ref-btn-success ref-btn-sm ref-approve-btn" data-id="' + nb.id + '">✅ Add</button>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-dismiss-btn" data-id="' + nb.id + '">✕ Skip</button>';
          }
          html += "</div>";

          html += "</div>"; // card
        }
      }

      // Updated benchmarks
      if (pending.updatedBenchmarks.length > 0) {
        html += '<h3 class="ref-update-group-title">🔄 Updated Benchmarks (' + pending.updatedBenchmarks.length + ")</h3>";

        for (var u = 0; u < pending.updatedBenchmarks.length; u++) {
          var ub = pending.updatedBenchmarks[u];
          var isUApproved = approvalState[ub.id] === "approved";
          var isUDismissed = approvalState[ub.id] === "dismissed";

          html += '<div class="ref-update-card' + (isUDismissed ? " ref-update-dismissed" : "") + '" data-id="' + ub.id + '" data-type="update">';
          html += '<span class="ref-update-card-icon">' + (ub.icon || "📊") + "</span>";
          html += '<div class="ref-update-card-info">';
          html += '<div class="ref-update-card-name">' + esc(ub.name);
          html += '<span class="ref-update-card-type ref-update-type-update">UPDATED</span></div>';
          html += '<div class="ref-update-card-desc">' + esc(ub.shortDescription || "") + "</div>";

          html += '<div class="ref-update-meta">';
          html += '<span class="ref-update-meta-item">📅 Updated: ' + esc(ub.lastUpdated || "Unknown") + "</span>";
          if (ub.scores) {
            html += '<span class="ref-update-meta-item">📊 ' + ub.scores.length + " model score" + (ub.scores.length > 1 ? "s" : "") + "</span>";
          }
          html += "</div>";

          html += "</div>"; // info

          // Action buttons
          html += '<div class="ref-update-card-actions">';
          if (isUApproved) {
            html += '<span class="ref-update-status ref-update-status-approved">✅ Approved</span>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-undo-btn" data-id="' + ub.id + '">Undo</button>';
          } else if (isUDismissed) {
            html += '<span class="ref-update-status ref-update-status-dismissed">✕ Dismissed</span>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-undo-btn" data-id="' + ub.id + '">Undo</button>';
          } else {
            html += '<button class="ref-btn ref-btn-success ref-btn-sm ref-approve-btn" data-id="' + ub.id + '">✅ Apply</button>';
            html += '<button class="ref-btn ref-btn-outline ref-btn-sm ref-dismiss-btn" data-id="' + ub.id + '">✕ Skip</button>';
          }
          html += "</div>";

          html += "</div>"; // card
        }
      }

      // Apply approved button
      html += '<div class="ref-update-apply-bar">';
      html += '<button id="btn-apply-approved" class="ref-btn ref-btn-primary ref-btn-lg">Apply Approved Changes</button>';
      html += "</div>";

      content.innerHTML = html;

      // Bind update card action buttons
      bindUpdateCardActions();
    });
  }

  // ---- Bind Update Card Actions ----
  function bindUpdateCardActions() {
    // Individual approve buttons
    var approveBtns = document.querySelectorAll(".ref-approve-btn");
    for (var i = 0; i < approveBtns.length; i++) {
      approveBtns[i].addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        approvalState[id] = "approved";
        renderUpdatesSection();
      });
    }

    // Individual dismiss buttons
    var dismissBtns = document.querySelectorAll(".ref-dismiss-btn");
    for (var j = 0; j < dismissBtns.length; j++) {
      dismissBtns[j].addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        approvalState[id] = "dismissed";
        renderUpdatesSection();
      });
    }

    // Undo buttons
    var undoBtns = document.querySelectorAll(".ref-undo-btn");
    for (var k = 0; k < undoBtns.length; k++) {
      undoBtns[k].addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        delete approvalState[id];
        renderUpdatesSection();
      });
    }

    // Approve All
    var approveAllBtn = document.getElementById("btn-approve-all");
    if (approveAllBtn) {
      approveAllBtn.addEventListener("click", function () {
        if (!pendingUpdateData) return;

        for (var a = 0; a < pendingUpdateData.newBenchmarks.length; a++) {
          approvalState[pendingUpdateData.newBenchmarks[a].id] = "approved";
        }
        for (var b = 0; b < pendingUpdateData.updatedBenchmarks.length; b++) {
          approvalState[pendingUpdateData.updatedBenchmarks[b].id] = "approved";
        }
        renderUpdatesSection();
      });
    }

    // Dismiss All
    var dismissAllBtn = document.getElementById("btn-dismiss-all");
    if (dismissAllBtn) {
      dismissAllBtn.addEventListener("click", function () {
        if (!pendingUpdateData) return;

        for (var a = 0; a < pendingUpdateData.newBenchmarks.length; a++) {
          approvalState[pendingUpdateData.newBenchmarks[a].id] = "dismissed";
        }
        for (var b = 0; b < pendingUpdateData.updatedBenchmarks.length; b++) {
          approvalState[pendingUpdateData.updatedBenchmarks[b].id] = "dismissed";
        }
        renderUpdatesSection();
      });
    }

    // Apply Approved
    var applyBtn = document.getElementById("btn-apply-approved");
    if (applyBtn) {
      applyBtn.addEventListener("click", function () {
        applyApprovedChanges();
      });
    }
  }

  // ---- Apply Approved Changes ----
  function applyApprovedChanges() {
    var approvedNewIds = [];
    var approvedUpdateIds = [];

    for (var id in approvalState) {
      if (approvalState.hasOwnProperty(id) && approvalState[id] === "approved") {
        // Determine if this is a new or updated benchmark
        if (pendingUpdateData) {
          var isNew = false;
          for (var i = 0; i < pendingUpdateData.newBenchmarks.length; i++) {
            if (pendingUpdateData.newBenchmarks[i].id === id) {
              isNew = true;
              break;
            }
          }

          if (isNew) {
            approvedNewIds.push(id);
          } else {
            approvedUpdateIds.push(id);
          }
        }
      }
    }

    if (approvedNewIds.length === 0 && approvedUpdateIds.length === 0) {
      showToast("No items approved. Please approve at least one item first.", "warning");
      return;
    }

    // Disable button to prevent double-clicks
    var applyBtn = document.getElementById("btn-apply-approved");
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = "Applying...";
    }

    chrome.runtime.sendMessage({
      action: "apply-updates",
      approvedNewIds: approvedNewIds,
      approvedUpdateIds: approvedUpdateIds
    }, function (response) {
      if (response && response.success) {
        showToast("✅ " + (approvedNewIds.length + approvedUpdateIds.length) + " changes applied successfully!", "success");

        // Reset state
        approvalState = {};
        pendingUpdateData = null;

        // Reload benchmarks
        loadBenchmarks();
        checkPendingUpdates();

        // Re-render updates section
        setTimeout(function () {
          renderUpdatesSection();
        }, 300);
      } else {
        showToast("❌ Failed to apply changes: " + (response.error || "Unknown error"), "error");
        if (applyBtn) {
          applyBtn.disabled = false;
          applyBtn.textContent = "Apply Approved Changes";
        }
      }
    });
  }

  // ---- Bind Update Check Button ----
  function bindUpdateActions() {
    var checkBtn = document.getElementById("btn-ref-check");
    if (checkBtn) {
      checkBtn.addEventListener("click", function () {
        if (!navigator.onLine) {
          showToast("You are offline. Connect to the internet to check for updates.", "warning");
          return;
        }

        checkBtn.disabled = true;
        checkBtn.textContent = "Checking...";

        var dot = document.getElementById("ref-conn-dot");
        dot.className = "atlas-dot atlas-dot-checking";

        chrome.runtime.sendMessage({ action: "check-updates-now" }, function (response) {
          dot.className = "atlas-dot atlas-dot-online";
          checkBtn.disabled = false;
          checkBtn.textContent = "Check Now";

          if (response && response.success) {
            var result = response.result || {};
            var total = (result.newCount || 0) + (result.updatedCount || 0);

            if (total > 0) {
              showToast("🔔 Found " + total + " update" + (total > 1 ? "s" : "") + "!", "success");
            } else {
              showToast("✅ Your knowledge base is up to date.", "success");
            }

            checkPendingUpdates();
            renderUpdatesSection();
          } else {
            var errorMsg = (response && response.error) ? response.error : "Check failed";
            showToast("❌ Update check failed: " + errorMsg, "error");
          }
        });
      });
    }
  }

  // ---- Settings ----
  function loadSettingsUI() {
    chrome.runtime.sendMessage({ action: "get-settings" }, function (response) {
      var settings = response.settings || {};

      var sourceUrlInput = document.getElementById("ref-source-url");
      var intervalSelect = document.getElementById("ref-check-interval");
      var defaultHint = document.getElementById("ref-default-url-hint");

      if (sourceUrlInput) {
        sourceUrlInput.value = settings.sourceURL || UPDATER.DEFAULT_SOURCE_URL;
      }

      if (intervalSelect) {
        intervalSelect.value = String(settings.checkInterval || 24);
      }

      if (defaultHint) {
        defaultHint.textContent = "Default: " + UPDATER.DEFAULT_SOURCE_URL;
      }

      updateStats();
    });
  }

  function bindSettings() {
    // Save settings
    var saveBtn = document.getElementById("btn-save-settings");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        var sourceURL = document.getElementById("ref-source-url").value.trim();
        var checkInterval = parseInt(document.getElementById("ref-check-interval").value, 10);

        // Validate URL
        if (sourceURL && !isValidURL(sourceURL)) {
          showToast("Please enter a valid URL for the update source.", "warning");
          return;
        }

        chrome.runtime.sendMessage({ action: "get-settings" }, function (response) {
          var settings = response.settings || {};
          settings.sourceURL = sourceURL || UPDATER.DEFAULT_SOURCE_URL;
          settings.checkInterval = checkInterval || 24;

          chrome.runtime.sendMessage({
            action: "save-settings",
            settings: settings
          }, function () {
            showToast("✅ Settings saved successfully!", "success");

            // Update alarm interval
            chrome.alarms.clear("atlas-update-check", function () {
              chrome.alarms.create("atlas-update-check", {
                delayInMinutes: 1,
                periodInMinutes: checkInterval * 60
              });
            });
          });
        });
      });
    }

    // Reset knowledge base
    var resetBtn = document.getElementById("btn-reset-kb");
    if (resetBtn) {
      resetBtn.addEventListener("click", function () {
        if (confirm("Are you sure you want to reset the knowledge base to the default 12 benchmarks? This will remove any added benchmarks.")) {
          chrome.storage.local.set({
            atlas_benchmarks: INITIAL_BENCHMARKS,
            atlas_pending_updates: null
          }, function () {
            benchmarks = INITIAL_BENCHMARKS;
            approvalState = {};
            pendingUpdateData = null;
            renderGrid();
            updateStats();
            checkPendingUpdates();
            showToast("✅ Knowledge base reset to defaults.", "success");
          });
        }
      });
    }
  }

  // ---- Toast Notifications ----
  function showToast(message, type) {
    // Remove existing toast
    var existing = document.getElementById("ref-toast");
    if (existing) {
      existing.remove();
    }

    var bgColor;
    switch (type) {
      case "success":
        bgColor = "rgba(74, 222, 128, 0.15)";
        break;
      case "warning":
        bgColor = "rgba(251, 191, 36, 0.15)";
        break;
      case "error":
        bgColor = "rgba(248, 113, 113, 0.15)";
        break;
      default:
        bgColor = "rgba(102, 126, 234, 0.15)";
    }

    var toast = document.createElement("div");
    toast.id = "ref-toast";
    toast.style.cssText =
      "position:fixed;bottom:24px;right:24px;z-index:10000;" +
      "background:" + bgColor + ";backdrop-filter:blur(12px);" +
      "border:1px solid rgba(255,255,255,0.1);" +
      "color:#e4e4f0;padding:12px 20px;border-radius:10px;" +
      "font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;" +
      "box-shadow:0 8px 32px rgba(0,0,0,0.4);" +
      "animation:refToastIn 0.3s ease-out;max-width:400px;";
    toast.textContent = message;

    // Add animation keyframes if not present
    if (!document.getElementById("ref-toast-styles")) {
      var style = document.createElement("style");
      style.id = "ref-toast-styles";
      style.textContent =
        "@keyframes refToastIn{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}" +
        "@keyframes refToastOut{from{transform:translateY(0);opacity:1}to{transform:translateY(20px);opacity:0}}";
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.animation = "refToastOut 0.3s ease-in forwards";
      setTimeout(function () {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }, 3500);
  }

  // ---- Utilities ----
  function esc(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function isValidURL(str) {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  }

})();