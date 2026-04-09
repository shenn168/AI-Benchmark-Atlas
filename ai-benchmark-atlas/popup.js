// =============================================
// AI Benchmark Atlas — Popup Script
// =============================================

(function () {
  "use strict";

  var benchmarks = [];
  var activeCategory = "all";
  var searchQuery = "";
  var expandedCardId = null;
  var activeDepths = {};

  // ---- Init ----
  document.addEventListener("DOMContentLoaded", function () {
    loadBenchmarks();
    renderCategories();
    bindEvents();
    checkConnection();
    checkPendingUpdates();
  });

  // ---- Load Benchmarks ----
  function loadBenchmarks() {
    chrome.runtime.sendMessage({ action: "get-benchmarks" }, function (response) {
      benchmarks = response.benchmarks || INITIAL_BENCHMARKS;
      renderBenchmarkList();
      updateFooter();
    });
  }

  // ---- Check Connection ----
  function checkConnection() {
    var dot = document.getElementById("connection-dot");
    var text = document.getElementById("connection-text");

    if (navigator.onLine) {
      dot.className = "atlas-dot atlas-dot-online";
      text.textContent = "Online — Updates available";
    } else {
      dot.className = "atlas-dot atlas-dot-offline";
      text.textContent = "Offline — Using local knowledge base";
    }

    window.addEventListener("online", function () {
      dot.className = "atlas-dot atlas-dot-online";
      text.textContent = "Online — Updates available";
    });

    window.addEventListener("offline", function () {
      dot.className = "atlas-dot atlas-dot-offline";
      text.textContent = "Offline — Using local knowledge base";
    });
  }

  // ---- Check Pending Updates ----
  function checkPendingUpdates() {
    chrome.runtime.sendMessage({ action: "get-pending-updates" }, function (response) {
      var pending = response.pending;
      var banner = document.getElementById("update-banner");
      var bannerText = document.getElementById("update-banner-text");

      if (pending && (pending.newBenchmarks.length > 0 || pending.updatedBenchmarks.length > 0)) {
        var newCount = pending.newBenchmarks.length;
        var updateCount = pending.updatedBenchmarks.length;
        var parts = [];

        if (newCount > 0) parts.push(newCount + " new benchmark" + (newCount > 1 ? "s" : ""));
        if (updateCount > 0) parts.push(updateCount + " update" + (updateCount > 1 ? "s" : ""));

        bannerText.textContent = "🔔 " + parts.join(" and ") + " available";
        banner.style.display = "flex";
      } else {
        banner.style.display = "none";
      }
    });
  }

  // ---- Render Categories ----
  function renderCategories() {
    var container = document.getElementById("category-filters");
    var html = "";

    for (var i = 0; i < BENCHMARK_CATEGORIES.length; i++) {
      var cat = BENCHMARK_CATEGORIES[i];
      var isActive = cat.id === activeCategory;
      html += '<button class="atlas-cat-btn' + (isActive ? " active" : "") + '" data-cat="' + cat.id + '">';
      html += cat.icon + " " + cat.label;
      html += "</button>";
    }

    container.innerHTML = html;

    // Bind category click events
    var buttons = container.querySelectorAll(".atlas-cat-btn");
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener("click", function () {
        activeCategory = this.getAttribute("data-cat");
        var allBtns = container.querySelectorAll(".atlas-cat-btn");
        for (var k = 0; k < allBtns.length; k++) {
          allBtns[k].classList.remove("active");
        }
        this.classList.add("active");
        renderBenchmarkList();
      });
    }
  }

  // ---- Filter Benchmarks ----
  function getFilteredBenchmarks() {
    var filtered = [];

    for (var i = 0; i < benchmarks.length; i++) {
      var b = benchmarks[i];
      var matchesCategory = activeCategory === "all" || b.category === activeCategory;
      var matchesSearch = true;

      if (searchQuery.length > 0) {
        var q = searchQuery.toLowerCase();
        matchesSearch = (
          b.name.toLowerCase().indexOf(q) !== -1 ||
          b.shortDescription.toLowerCase().indexOf(q) !== -1 ||
          b.category.toLowerCase().indexOf(q) !== -1 ||
          b.levels.nonTechnical.content.toLowerCase().indexOf(q) !== -1 ||
          b.levels.intermediate.content.toLowerCase().indexOf(q) !== -1 ||
          b.levels.expert.content.toLowerCase().indexOf(q) !== -1
        );
      }

      if (matchesCategory && matchesSearch) {
        filtered.push(b);
      }
    }

    return filtered;
  }

  // ---- Render Benchmark List ----
  function renderBenchmarkList() {
    var container = document.getElementById("benchmark-list");
    var filtered = getFilteredBenchmarks();

    if (filtered.length === 0) {
      container.innerHTML =
        '<div class="atlas-empty">' +
        '<div class="atlas-empty-icon">🔎</div>' +
        "<p>No benchmarks match your search.</p>" +
        "</div>";
      return;
    }

    var html = "";

    for (var i = 0; i < filtered.length; i++) {
      var b = filtered[i];
      var isExpanded = expandedCardId === b.id;
      var depthLevel = activeDepths[b.id] || "nonTechnical";

      html += '<div class="atlas-card' + (isExpanded ? " expanded" : "") + '" data-id="' + b.id + '">';

      // Card Header
      html += '<div class="atlas-card-header" data-id="' + b.id + '">';
      html += '<span class="atlas-card-icon">' + b.icon + "</span>";
      html += '<div class="atlas-card-info">';
      html += '<div class="atlas-card-name">' + escapeHtml(b.name);
      html += ' <span class="atlas-card-category">' + escapeHtml(b.category) + "</span>";
      html += "</div>";
      html += '<div class="atlas-card-short">' + escapeHtml(b.shortDescription) + "</div>";
      html += "</div>";
      html += '<span class="atlas-card-chevron">▼</span>';
      html += "</div>";

      // Card Body
      html += '<div class="atlas-card-body">';

      // Depth Tabs
      html += '<div class="atlas-depth-tabs">';
      html += '<button class="atlas-depth-tab' + (depthLevel === "nonTechnical" ? " active" : "") + '" data-id="' + b.id + '" data-depth="nonTechnical">🟢 Plain English</button>';
      html += '<button class="atlas-depth-tab' + (depthLevel === "intermediate" ? " active" : "") + '" data-id="' + b.id + '" data-depth="intermediate">🟡 Intermediate</button>';
      html += '<button class="atlas-depth-tab' + (depthLevel === "expert" ? " active" : "") + '" data-id="' + b.id + '" data-depth="expert">🔴 Expert</button>';
      html += "</div>";

      // Depth Content
      html += '<div class="atlas-depth-content">' + escapeHtml(b.levels[depthLevel].content) + "</div>";

      // Scores
      if (b.scores && b.scores.length > 0) {
        html += '<div class="atlas-scores-label">Model Scores</div>';
        html += '<table class="atlas-score-table">';
        html += "<thead><tr><th>Model</th><th>Score</th><th class=\"atlas-score-bar-cell\"></th><th></th></tr></thead>";
        html += "<tbody>";

        var sortedScores = b.scores.slice().sort(function (a, bItem) {
          return bItem.score - a.score;
        });

        for (var s = 0; s < sortedScores.length; s++) {
          var sc = sortedScores[s];
          html += "<tr>";
          html += "<td>" + escapeHtml(sc.model) + "</td>";
          html += '<td class="atlas-score-val">' + sc.score + "%</td>";
          html += '<td class="atlas-score-bar-cell"><div class="atlas-score-bar-wrap"><div class="atlas-score-bar" style="width:' + sc.score + '%"></div></div></td>';
          html += "<td>" + (sc.note ? '<span class="atlas-score-note">' + escapeHtml(sc.note) + "</span>" : "") + "</td>";
          html += "</tr>";
        }

        html += "</tbody></table>";
      }

      // Sources
      if (b.sources && b.sources.length > 0) {
        html += '<div class="atlas-sources">';
        for (var sr = 0; sr < b.sources.length; sr++) {
          var domain = b.sources[sr].replace(/https?:\/\//, "").replace(/\/.*/, "");
          html += '<a href="' + escapeHtml(b.sources[sr]) + '" target="_blank" rel="noopener" class="atlas-source-link">📎 ' + escapeHtml(domain) + "</a>";
        }
        html += "</div>";
      }

      html += "</div>"; // card-body
      html += "</div>"; // card

    }

    container.innerHTML = html;
    bindCardEvents();
  }

  // ---- Bind Card Events ----
  function bindCardEvents() {
    // Card header click to expand/collapse
    var headers = document.querySelectorAll(".atlas-card-header");
    for (var i = 0; i < headers.length; i++) {
      headers[i].addEventListener("click", function () {
        var id = this.getAttribute("data-id");
        if (expandedCardId === id) {
          expandedCardId = null;
        } else {
          expandedCardId = id;
        }
        renderBenchmarkList();
      });
    }

    // Depth tab clicks
    var tabs = document.querySelectorAll(".atlas-depth-tab");
    for (var j = 0; j < tabs.length; j++) {
      tabs[j].addEventListener("click", function (e) {
        e.stopPropagation();
        var id = this.getAttribute("data-id");
        var depth = this.getAttribute("data-depth");
        activeDepths[id] = depth;
        renderBenchmarkList();
      });
    }
  }

  // ---- Bind Global Events ----
  function bindEvents() {
    // Search
    document.getElementById("search-input").addEventListener("input", function () {
      searchQuery = this.value.trim();
      expandedCardId = null;
      renderBenchmarkList();
    });

    // Check updates button
    document.getElementById("btn-check-updates").addEventListener("click", function () {
      if (!navigator.onLine) {
        alert("You are offline. Please connect to the internet to check for updates.");
        return;
      }

      var dot = document.getElementById("connection-dot");
      dot.className = "atlas-dot atlas-dot-checking";

      chrome.runtime.sendMessage({ action: "check-updates-now" }, function () {
        dot.className = "atlas-dot atlas-dot-online";
        checkPendingUpdates();
      });
    });

    // Open full reference
    document.getElementById("btn-open-full").addEventListener("click", function () {
      chrome.tabs.create({ url: chrome.runtime.getURL("reference.html") });
    });

    // Review updates
    document.getElementById("btn-review-updates").addEventListener("click", function () {
      chrome.tabs.create({ url: chrome.runtime.getURL("reference.html") + "#updates" });
    });
  }

  // ---- Update Footer ----
  function updateFooter() {
    document.getElementById("benchmark-count").textContent = benchmarks.length + " benchmarks";

    chrome.runtime.sendMessage({ action: "get-settings" }, function (response) {
      var settings = response.settings || {};
      if (settings.lastCheck) {
        var d = new Date(settings.lastCheck);
        document.getElementById("last-updated").textContent = "Last checked: " + d.toLocaleDateString();
      } else {
        document.getElementById("last-updated").textContent = "Local only";
      }
    });
  }

  // ---- Utilities ----
  function escapeHtml(str) {
    if (!str) return "";
    var div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

})();