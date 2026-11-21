// GTA VI Trophy Guide & Tracker — front-end logic, written fresh for this entry.
// Loads app/data/trophies.json, renders the checklist, roadmap and sources views,
// and keeps earned ticks plus the spoiler shield in localStorage. No network
// requests beyond the local data file; everything else is inline in this file.

(function () {
  "use strict";

  var EARNED_KEY = "gta6-trophy-tracker-earned-v1";
  var SPOILER_KEY = "gta6-trophy-tracker-spoiler-v1";

  var KIND_LABELS = {
    all: "All 55",
    story: "Story",
    missable: "Missable",
    collectibles: "Collectibles",
    activities: "Activities",
    "side-quests": "Side quests",
    partner: "Robberies & partner",
    economy: "Money & garages",
    challenges: "Challenges",
    secrets: "Secrets",
    online: "Online",
    earned: "Earned",
    remaining: "Remaining"
  };

  // Kinds that a kind chip matches, by trophy "kind" field. "online" matches
  // nothing on purpose: every trophy in this game is offline single-player.
  var KIND_MATCH = {
    story: ["story"],
    collectibles: ["collectibles"],
    activities: ["activities"],
    "side-quests": ["side-quests"],
    partner: ["partner"],
    economy: ["economy"],
    challenges: ["challenges"],
    secrets: ["secrets"],
    online: []
  };

  var data = null; // parsed trophies.json
  var earned = loadEarned();
  var spoiler = loadSpoiler();
  var selectedId = 30;
  var view = "checklist";
  var kindFilter = "all";
  var gradeFilter = "all";
  var query = "";

  var els = {};

  function $(id) { return document.getElementById(id); }

  function loadEarned() {
    try {
      var raw = localStorage.getItem(EARNED_KEY);
      if (!raw) return new Set();
      var arr = JSON.parse(raw);
      if (!Array.isArray(arr)) return new Set();
      return new Set(arr.filter(function (n) { return typeof n === "number"; }));
    } catch (e) { return new Set(); }
  }

  function saveEarned() {
    try {
      localStorage.setItem(EARNED_KEY, JSON.stringify(Array.from(earned).sort(function (a, b) { return a - b; })));
    } catch (e) { /* storage unavailable: progress just does not persist */ }
  }

  function loadSpoiler() {
    try { return localStorage.getItem(SPOILER_KEY) === "1"; } catch (e) { return false; }
  }

  function saveSpoiler() {
    try { localStorage.setItem(SPOILER_KEY, spoiler ? "1" : "0"); } catch (e) { /* ignore */ }
  }

  function trophyById(id) {
    if (!data) return null;
    for (var i = 0; i < data.trophies.length; i++) {
      if (data.trophies[i].id === id) return data.trophies[i];
    }
    return null;
  }

  function isEarned(t) { return earned.has(t.id); }

  function isHidden(t) {
    return spoiler && t.kind === "story" && !isEarned(t);
  }

  function displayName(t) {
    return isHidden(t) ? "Hidden story trophy" : t.name;
  }

  function displayDescription(t) {
    return isHidden(t) ? "Hidden until earned — turn the spoiler shield off to reveal it." : t.description;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function gradeCounts() {
    var counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
    data.trophies.forEach(function (t) {
      counts[t.grade][1] += 1;
      if (isEarned(t)) counts[t.grade][0] += 1;
    });
    return counts;
  }

  function renderHeader() {
    var total = data.trophies.length;
    var n = earned.size;
    var pct = Math.round((n / total) * 100);
    els.progressLine.textContent = n + " of " + total + " earned · " + pct + "%";
    els.progressBar.style.width = pct + "%";
    els.progressBar.setAttribute("aria-valuenow", String(pct));
    var c = gradeCounts();
    els.gradeCounts.textContent =
      "platinum " + c.platinum[0] + "/" + c.platinum[1] +
      " · gold " + c.gold[0] + "/" + c.gold[1] +
      " · silver " + c.silver[0] + "/" + c.silver[1] +
      " · bronze " + c.bronze[0] + "/" + c.bronze[1];
  }

  function matchesKind(t) {
    if (kindFilter === "all") return true;
    if (kindFilter === "missable") return !!t.missable;
    if (kindFilter === "earned") return isEarned(t);
    if (kindFilter === "remaining") return !isEarned(t);
    var kinds = KIND_MATCH[kindFilter];
    if (!kinds) return true;
    return kinds.indexOf(t.kind) !== -1;
  }

  function matchesGrade(t) {
    return gradeFilter === "all" || t.grade === gradeFilter;
  }

  function matchesQuery(t) {
    if (!query) return true;
    var hay = (t.name + " " + t.description + " " + t.guide + " " + t.steps.join(" ")).toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function visibleTrophies() {
    return data.trophies.filter(function (t) {
      return matchesKind(t) && matchesGrade(t) && matchesQuery(t);
    });
  }

  function tagHtml(t) {
    var out = '<span class="tag grade-' + t.grade + '">' + escapeHtml(t.grade) + "</span>";
    out += '<span class="tag kind">' + escapeHtml(KIND_LABELS[t.kind] || t.kind) + "</span>";
    if (t.missable) out += '<span class="tag missable">MISSABLE</span>';
    if (isEarned(t)) out += '<span class="tag earned-tag">Earned</span>';
    return out;
  }

  function renderList() {
    var list = visibleTrophies();
    els.metaLine.textContent = "Showing " + list.length + " of " + data.trophies.length +
      " trophies · " + earned.size + " earned";
    if (kindFilter === "online") {
      els.list.innerHTML = '<p class="empty-state">There are no online trophies in GTA VI — all 55 are offline single-player. Nothing to show here.</p>';
      return;
    }
    if (list.length === 0) {
      els.list.innerHTML = '<p class="empty-state">No trophies match these filters. Try clearing the search or choosing a different filter.</p>';
      return;
    }
    var html = "";
    list.forEach(function (t) {
      var cls = "trophy-row" + (t.id === selectedId ? " selected" : "") + (isEarned(t) ? " is-earned" : "");
      html += '<article class="' + cls + '" data-id="' + t.id + '" tabindex="0" role="button" aria-pressed="' + isEarned(t) + '">';
      html += '<label class="tick"><input type="checkbox" data-tick="' + t.id + '"' + (isEarned(t) ? " checked" : "") + ' aria-label="Mark ' + escapeHtml(displayName(t)) + ' as earned"><span class="box" aria-hidden="true"></span></label>';
      html += '<div class="row-body"><h3>' + escapeHtml(displayName(t)) + "</h3>";
      html += '<p class="desc">' + escapeHtml(displayDescription(t)) + "</p>";
      html += '<div class="tags">' + tagHtml(t) + "</div></div></article>";
    });
    els.list.innerHTML = html;
  }

  function renderDetail() {
    var t = trophyById(selectedId) || data.trophies[0];
    if (!t) { els.detail.innerHTML = ""; return; }
    var hidden = isHidden(t);
    var html = "";
    html += '<h2>' + escapeHtml(displayName(t)) + "</h2>";
    html += '<div class="tags">' + tagHtml(t) + "</div>";
    html += '<p class="desc detail-desc"><em>' + escapeHtml(displayDescription(t)) + "</em></p>";
    if (t.missable && t.missable_note) {
      html += '<p class="missable-note">' + escapeHtml(t.missable_note) + "</p>";
    }
    if (hidden) {
      html += '<p class="spoiler-note">The guide for this story trophy stays hidden while the spoiler shield is on. Earn it, or turn the shield off, to reveal the guide.</p>';
    } else {
      html += "<h3>Guide</h3><p>" + escapeHtml(t.guide) + "</p>";
      html += "<h3>Sources</h3><ul class=\"sources\">";
      t.sources.forEach(function (s) { html += "<li>" + escapeHtml(s) + "</li>"; });
      html += "</ul>";
      html += "<h3>Steps</h3><ol class=\"steps\">";
      t.steps.forEach(function (s) { html += "<li>" + escapeHtml(s) + "</li>"; });
      html += "</ol>";
    }
    html += '<p class="fine">Guides are written in our own words; the sources listed are where each fact comes from.</p>';
    html += '<button type="button" class="mark-btn" data-mark="' + t.id + '">' +
      (isEarned(t) ? "Earned — click to unmark" : "Mark as earned") + "</button>";
    els.detail.innerHTML = html;
  }

  function renderChips() {
    var order = ["all", "story", "missable", "collectibles", "activities", "side-quests", "partner", "economy", "challenges", "secrets", "online", "earned", "remaining"];
    var counts = {};
    data.trophies.forEach(function (t) {
      counts[t.kind] = (counts[t.kind] || 0) + 1;
    });
    var chipCounts = {
      all: data.trophies.length,
      story: counts.story || 0,
      missable: data.trophies.filter(function (t) { return t.missable; }).length,
      collectibles: counts.collectibles || 0,
      activities: counts.activities || 0,
      "side-quests": counts["side-quests"] || 0,
      partner: counts.partner || 0,
      economy: counts.economy || 0,
      challenges: counts.challenges || 0,
      secrets: counts.secrets || 0,
      online: 0,
      earned: earned.size,
      remaining: data.trophies.length - earned.size
    };
    var html = "";
    order.forEach(function (k) {
      html += '<button type="button" class="chip' + (kindFilter === k ? " active" : "") + '" data-kind="' + k + '">' +
        escapeHtml(KIND_LABELS[k]) + " (" + chipCounts[k] + ")</button>";
    });
    els.chips.innerHTML = html;
  }

  function stageList(stage) {
    return data.trophies.filter(function (t) { return t.roadmap_stage === stage; });
  }

  function stageListHtml(stage) {
    var html = "<ul class=\"stage-trophies\">";
    stageList(stage).forEach(function (t) {
      html += '<li><a href="#/trophy/' + t.id + '">' + escapeHtml(t.name) + "</a> — " +
        escapeHtml(t.grade) + "</li>";
    });
    return html + "</ul>";
  }

  function renderRoadmap() {
    var html = "<h2>Roadmap to the platinum — Vice Got a Price!</h2>";
    html += "<p>About 200 hours, difficulty 4/10, one playthrough, no online trophies. The story takes 60–80 hours, the 100% checklist about 100 hours, and strangers and cleanup about 10 hours. Keep a manual save at the start and end of each chapter (15 manual save slots) — there is no mission replay. Cheats disable trophies and saving, so keep cheats off.</p>";

    html += "<section><h3>Stage 1 — Story + the one missable moment (60–80 hours)</h3>";
    html += "<p>Play the story through all 5 chapters; the 12 story trophies pop automatically, including the final-mission gold. While playing, scan every new vehicle with the WAiNK app and study animals through binoculars — the 100% checklist needs 200 of 277 vehicles and 100 of 255 animals, and progress already counts before the checklist opens.</p>";
    html += '<p class="alert">Do the Chapter 1 meditation in time — after the mission Down to Earth, talk to Lucia in the kitchen in the morning, follow her to the balcony and choose Accept when she offers to meditate; the only step PowerPyx flags as potentially missable.</p>';
    html += stageListHtml(1) + "</section>";

    html += "<section><h3>Stage 2 — The 100% checklist + challenges (~100 hours)</h3>";
    html += "<p>After the story, open Progress &gt; Stats &gt; 100% Completion. It is closer to 60% true completion: most side quests are not needed and collectibles are only partly needed. Everything required: all robberies, all underwater discoveries, all shooting ranges, all drone races, all of Bret's quests. Partial targets: 200 vehicles, 100 animals, 300 stunts, 100 optional missions, 70 of 80 challenges. Nothing here is missable.</p>";
    html += stageListHtml(2) + "</section>";

    html += "<section><h3>Stage 3 — Strangers &amp; Freaks and cleanup (~10 hours)</h3>";
    html += "<p>Strangers &amp; Freaks are not needed for 100%, so finish the 8 counting strands now, plus the named-character questlines (Andy, Kenton, Billy, Randy, Tyrone, Bret) and any stray miscellaneous trophies. When the last one pops, the platinum follows.</p>";
    html += stageListHtml(3) + "</section>";

    html += "<section><h3>Missable trophies</h3>";
    html += "<p>Only Positive Mental Attitude is flagged as possibly missable (Chapter 1 balcony meditation). Every other trophy and every 100% checklist item can still be earned in post-story free-roam. Some optional missions expire and some fences disappear, but PowerPyx confirms none of that affects trophies or 100%.</p></section>";

    html += "<section><h3>Collectibles &amp; counts at a glance</h3><ul class=\"counts\">";
    var counts = [
      "Stunts 250 for the trophy (397 total), 300 for 100% — 130 jumps, 202 under-bridge, 40 knife flights, 25 base jumps",
      "Shooting ranges: 42 gold medals at 12 locations",
      "Top Fun drone races: 14 locations, 42 races",
      "Races: 40 unique locations; win 20 different ones",
      "Cards: 3 of 18 sets",
      "WAiNK scans: any 100",
      "Meditation spots: 18 at 10 locations (15 for 100%)",
      "Vehicles: 100 discovered for the trophy, 200 of 277 base models for 100%",
      "Animals: 100 of 255 studied",
      "Challenges: 50 for the trophy, 70 of 80 for 100%",
      "Optional missions: 100 for 100%",
      "Robberies: 39 gang operations, 8 bank vaults, 22 bank jobs, 7 payday loan jobs",
      "Garages: 8 purchasable ($160,000)",
      "Marked bills laundered: $250,000",
      "Shops: $100,000 spent"
    ];
    counts.forEach(function (c) { html += "<li>" + escapeHtml(c) + "</li>"; });
    html += "</ul><p>Sources: PowerPyx, KeenGamer and GameMapa.</p></section>";
    els.roadmap.innerHTML = html;
  }

  function renderSources() {
    var html = "<h2>Sources &amp; method</h2>";
    html += "<p>Every guide is written in our own words for this entry; facts come from the sources named beside each guide. Official names and descriptions are shown exactly as PlayStation publishes them (via PSNProfiles and Exophase, whose lists agree on all 55 names, descriptions and grades). Nothing is copied from another guide — a source is cited, never copied.</p>";
    html += "<h3>Main sources</h3><ul>";
    html += "<li>PowerPyx — GTA 6 Trophy Guide &amp; Roadmap (full roadmap, Chapter 1 meditation warning, method for most trophies, including the five it lists as currently unknown)</li>";
    html += "<li>PSNProfiles / Exophase — GTA 6 trophy list (official 55 names, descriptions, grades and counts, cross-checked)</li>";
    html += "<li>KeenGamer — GTA 6 Trophy Guide &amp; Platinum Roadmap (three-stage roadmap and 100% checklist figures)</li>";
    html += "<li>GameMapa — All 55 GTA 6 Trophies (cross-check of the list, counts and the unknown trophies)</li>";
    html += "<li>SixShore — GTA 6 Trophy and Achievement List (cross-check of the list, hidden count 28, single possible missable)</li>";
    html += "</ul>";
    html += "<h3>What is still unconfirmed</h3>";
    html += "<p>Five trophies had no verified unlock when this guide was written (19 November 2026, launch week): In The Beginning…, Capital Offense, Bad Luck, I Guess, The Truth Is Out There and Ten Pin. PowerPyx lists them as currently unknown (with a suspected lead for three of them); this guide says so openly instead of inventing a method.</p>";
    html += "<h3>How this app works</h3><ul>";
    html += "<li>Offline: every file lives under app/, no network requests.</li>";
    html += "<li>Progress saves in localStorage when a trophy is ticked, and can be exported to a file and imported back.</li>";
    html += "<li>The spoiler shield hides story trophy names and descriptions until earned.</li>";
    html += "<li>Filters as listed above, including online (0 — every trophy is offline single-player).</li>";
    html += "</ul>";
    html += '<p class="fine">Grand Theft Auto VI is a game by Rockstar Games; this guide is an independent fan-made tracker using no Rockstar logo, artwork, box art or game screenshots; trophy names and descriptions are quoted as PlayStation publishes them.</p>';
    els.sources.innerHTML = html;
  }

  function showView(v) {
    view = v;
    els.checklistView.hidden = v !== "checklist";
    els.roadmapView.hidden = v !== "roadmap";
    els.sourcesView.hidden = v !== "sources";
    var tabs = document.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.classList.toggle("active", tab.getAttribute("data-view") === v);
      tab.setAttribute("aria-selected", tab.getAttribute("data-view") === v ? "true" : "false");
    });
  }

  function renderAll() {
    renderHeader();
    renderChips();
    renderList();
    renderDetail();
    renderRoadmap();
    renderSources();
    els.spoilerCheckbox.checked = spoiler;
    els.gradeSelect.value = gradeFilter;
    els.searchInput.value = query;
    showView(view);
  }

  function setHash(hash) {
    if (location.hash !== hash) {
      history.pushState(null, "", hash);
    }
  }

  function toggleEarned(id) {
    if (earned.has(id)) earned.delete(id); else earned.add(id);
    saveEarned();
    renderHeader();
    renderChips();
    renderList();
    renderDetail();
  }

  function selectTrophy(id, keepView) {
    var t = trophyById(id);
    if (!t) return;
    selectedId = id;
    if (!keepView) showView("checklist");
    renderList();
    renderDetail();
  }

  function applyFilter(kind) {
    kindFilter = kind;
    showView("checklist");
    renderChips();
    renderList();
  }

  function exportProgress() {
    var payload = {
      game: "Grand Theft Auto VI",
      earned: Array.from(earned).sort(function (a, b) { return a - b; }),
      exportedAt: new Date().toISOString()
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "gta6-trophy-progress.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    els.importError.textContent = "";
  }

  function importProgress(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        var ids = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(ids)) throw new Error("bad file");
        var valid = new Set(data.trophies.map(function (t) { return t.id; }));
        earned = new Set(ids.filter(function (n) { return typeof n === "number" && valid.has(n); }));
        saveEarned();
        els.importError.textContent = "";
        renderAll();
      } catch (e) {
        els.importError.textContent = "Could not import that file — it does not look like a trophy progress export.";
      }
    };
    reader.onerror = function () {
      els.importError.textContent = "Could not read that file.";
    };
    reader.readAsText(file);
  }

  function resetProgress() {
    earned = new Set();
    saveEarned();
    renderAll();
  }

  function handleHash() {
    var h = location.hash || "#/";
    if (h === "#/" || h === "") {
      showView("checklist");
      return;
    }
    if (h === "#/roadmap") { showView("roadmap"); return; }
    if (h === "#/sources") { showView("sources"); return; }
    if (h === "#/spoiler") {
      spoiler = true;
      saveSpoiler();
      showView("checklist");
      renderAll();
      return;
    }
    var m = h.match(/^#\/trophy\/(\d+)$/);
    if (m) {
      var id = parseInt(m[1], 10);
      if (trophyById(id)) { selectTrophy(id); }
      return;
    }
    var f = h.match(/^#\/filter\/(.+)$/);
    if (f) {
      var kind = decodeURIComponent(f[1]);
      if (KIND_LABELS[kind]) { applyFilter(kind); }
      return;
    }
    showView("checklist");
  }

  function bindEvents() {
    document.querySelectorAll(".tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        var v = tab.getAttribute("data-view");
        setHash(v === "checklist" ? "#/" : "#/" + v);
        showView(v);
      });
    });

    els.chips.addEventListener("click", function (e) {
      var chip = e.target.closest("[data-kind]");
      if (!chip) return;
      kindFilter = chip.getAttribute("data-kind");
      setHash("#/filter/" + kindFilter);
      renderChips();
      renderList();
    });

    els.list.addEventListener("click", function (e) {
      var tick = e.target.closest("[data-tick]");
      if (tick) {
        e.stopPropagation();
        toggleEarned(parseInt(tick.getAttribute("data-tick"), 10));
        return;
      }
      var row = e.target.closest("[data-id]");
      if (row) {
        var id = parseInt(row.getAttribute("data-id"), 10);
        selectedId = id;
        setHash("#/trophy/" + id);
        renderList();
        renderDetail();
      }
    });

    els.list.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" && e.key !== " ") return;
      var row = e.target.closest("[data-id]");
      if (!row) return;
      e.preventDefault();
      selectedId = parseInt(row.getAttribute("data-id"), 10);
      setHash("#/trophy/" + selectedId);
      renderList();
      renderDetail();
    });

    els.detail.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-mark]");
      if (!btn) return;
      toggleEarned(parseInt(btn.getAttribute("data-mark"), 10));
    });

    els.searchInput.addEventListener("input", function () {
      query = els.searchInput.value.trim().toLowerCase();
      renderList();
    });

    els.gradeSelect.addEventListener("change", function () {
      gradeFilter = els.gradeSelect.value;
      renderList();
    });

    els.spoilerCheckbox.addEventListener("change", function () {
      spoiler = els.spoilerCheckbox.checked;
      saveSpoiler();
      renderList();
      renderDetail();
    });

    els.exportBtn.addEventListener("click", exportProgress);

    els.importInput.addEventListener("change", function () {
      if (els.importInput.files && els.importInput.files[0]) {
        importProgress(els.importInput.files[0]);
        els.importInput.value = "";
      }
    });

    els.resetBtn.addEventListener("click", resetProgress);

    els.missableJump.addEventListener("click", function () {
      kindFilter = "missable";
      selectedId = 28;
      setHash("#/trophy/28");
      showView("checklist");
      renderAll();
    });

    window.addEventListener("hashchange", handleHash);
  }

  function init() {
    els = {
      progressLine: $("progress-line"),
      progressBar: $("progress-bar"),
      gradeCounts: $("grade-counts"),
      chips: $("kind-chips"),
      list: $("trophy-list"),
      detail: $("trophy-detail"),
      metaLine: $("meta-line"),
      searchInput: $("search"),
      gradeSelect: $("grade-filter"),
      spoilerCheckbox: $("spoiler-shield"),
      exportBtn: $("export-btn"),
      importInput: $("import-input"),
      resetBtn: $("reset-btn"),
      importError: $("import-error"),
      missableJump: $("missable-jump"),
      checklistView: $("view-checklist"),
      roadmapView: $("view-roadmap"),
      sourcesView: $("view-sources"),
      roadmap: $("view-roadmap"),
      sources: $("view-sources")
    };

    fetch("data/trophies.json")
      .then(function (r) {
        if (!r.ok) throw new Error("trophies.json failed to load (" + r.status + ")");
        return r.json();
      })
      .then(function (json) {
        data = json;
        bindEvents();
        renderAll();
        handleHash();
      })
      .catch(function (err) {
        els.list.innerHTML = '<p class="empty-state">Could not load the trophy data. ' + escapeHtml(err.message) + "</p>";
      });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
