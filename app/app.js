// GTA VI trophy guide + tracker: checklist with localStorage progress, kind/grade/search
// filters, a spoiler shield for story trophies, export/import, a platinum roadmap view
// and a per-trophy guide panel that always names its sources. All data is local.
const KEY = 'gta6-trophy-checklist-v1';
const SPOILER_KEY = 'gta6-trophy-spoiler-v1';
const KIND_LABELS = {
  all: 'All', story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', 'side-quests': 'Side quests', partner: 'Robberies & partner',
  economy: 'Money & garages', challenges: 'Challenges', secrets: 'Secrets',
  online: 'Online', earned: 'Earned', remaining: 'Remaining',
};
const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

const rowsEl = document.getElementById('rows');
const detailEl = document.getElementById('detail');
const listMeta = document.getElementById('listMeta');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const spoilerEl = document.getElementById('spoiler');
const kindBar = document.getElementById('kindFilters');

let earned = new Set(readJson(KEY, []));
let spoilerOn = localStorage.getItem(SPOILER_KEY) === '1';
let kind = 'all';
let selectedId = 30; // Don't Touch My Deck: a short guide, so its guide and sources both fit beside the checklist in one screen.
let view = 'checklist';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));
const missables = trophies.filter((t) => t.missable);

function readJson(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) ?? 'null');
    return Array.isArray(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function isStory(t) {
  return t.kind === 'story';
}

function hiddenBySpoiler(t) {
  return spoilerOn && isStory(t) && !earned.has(t.id);
}

function displayName(t) {
  return hiddenBySpoiler(t) ? 'Hidden story trophy' : t.name;
}

function displayDesc(t) {
  return hiddenBySpoiler(t) ? 'Hidden until earned — turn the spoiler shield off to reveal it.' : t.description;
}

function matches(t) {
  if (kind === 'missable' && !t.missable) return false;
  if (kind === 'online') return false; // No online trophies: all 55 are offline single-player.
  if (kind === 'earned' && !earned.has(t.id)) return false;
  if (kind === 'remaining' && earned.has(t.id)) return false;
  if (kind !== 'all' && kind !== 'missable' && kind !== 'earned' && kind !== 'remaining' && kind !== 'online' && t.kind !== kind) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${(t.steps || []).join(' ')}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function gradeBadge(t) {
  const span = document.createElement('span');
  span.className = `grade grade-${t.grade}`;
  span.textContent = t.grade;
  return span;
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  document.getElementById('progressText').textContent = `${n} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${Math.round((n / total) * 100)}%`;
  document.getElementById('progressBar').style.width = `${(n / total) * 100}%`;
  const counts = GRADE_ORDER.map((g) => {
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const all = trophies.filter((t) => t.grade === g).length;
    return `${g} ${got}/${all}`;
  }).join(' · ');
  document.getElementById('gradeCounts').textContent = counts;
}

function renderList() {
  rowsEl.replaceChildren();
  const shown = trophies.filter(matches);
  listMeta.textContent = kind === 'online'
    ? 'Online trophies: none. All 55 trophies are offline single-player (PowerPyx).'
    : `Showing ${shown.length} of ${trophies.length} trophies — ${earned.size} earned. Click a trophy to read its guide.`;
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (t.id === selectedId ? ' selected' : '') + (earned.has(t.id) ? ' earned' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${t.name} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      save();
      renderAll();
    });
    const main = document.createElement('button');
    main.type = 'button';
    main.className = 'row-main';
    main.addEventListener('click', () => {
      selectedId = t.id;
      history.replaceState(null, '', `#/trophy/${t.id}`);
      renderAll();
    });
    const name = document.createElement('span');
    name.className = 'row-name';
    name.textContent = displayName(t);
    const desc = document.createElement('span');
    desc.className = 'row-desc';
    desc.textContent = displayDesc(t);
    const tags = document.createElement('span');
    tags.className = 'row-tags';
    tags.append(gradeBadge(t));
    const kindTag = document.createElement('span');
    kindTag.className = 'kind-tag';
    kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
    tags.append(kindTag);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'missable-tag';
      m.textContent = '⚠ MISSABLE';
      tags.append(m);
    }
    if (earned.has(t.id)) {
      const e = document.createElement('span');
      e.className = 'earned-tag';
      e.textContent = '✓ Earned';
      tags.append(e);
    }
    main.append(name, desc, tags);
    li.append(box, main);
    rowsEl.append(li);
  }
  if (shown.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty';
    li.textContent = kind === 'online'
      ? 'No online trophies — every trophy in GTA VI is earned offline in single-player.'
      : 'No trophies match these filters. Try clearing the search or choosing another filter.';
    rowsEl.append(li);
  }
}

function renderDetail() {
  const t = byId.get(selectedId) || trophies[0];
  detailEl.replaceChildren();
  const card = document.createElement('article');
  card.className = 'guide-card';
  const head = document.createElement('h2');
  head.textContent = displayName(t);
  const meta = document.createElement('p');
  meta.className = 'guide-meta';
  meta.append(gradeBadge(t));
  const kindTag = document.createElement('span');
  kindTag.className = 'kind-tag';
  kindTag.textContent = KIND_LABELS[t.kind] || t.kind;
  meta.append(kindTag);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'missable-tag';
    m.textContent = '⚠ POSSIBLY MISSABLE';
    meta.append(m);
  }
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = `Official description: “${displayDesc(t)}”`;
  card.append(head, meta, off);
  if (t.missable && t.missable_note) {
    const warn = document.createElement('p');
    warn.className = 'missable-note';
    warn.textContent = t.missable_note;
    card.append(warn);
  }
  if (hiddenBySpoiler(t)) {
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'Spoiler shield is on: this story trophy stays hidden until you tick it as earned. Tick its box in the list, or turn the shield off above.';
    card.append(note);
  } else {
    const guideTitle = document.createElement('h3');
    guideTitle.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.className = 'guide-text';
    guide.textContent = t.guide;
    card.append(guideTitle, guide);
    // Sources sit directly under the guide (before the steps) so a reader
    // sees where each fact comes from at a glance.
    const srcTitle = document.createElement('h3');
    srcTitle.textContent = 'Sources';
    const src = document.createElement('ul');
    src.className = 'guide-sources';
    for (const s of t.sources || ['PSNProfiles / Exophase — GTA 6 trophy list']) {
      const li = document.createElement('li');
      li.textContent = s;
      src.append(li);
    }
    card.append(srcTitle, src);
    if (t.steps && t.steps.length) {
      const stepsTitle = document.createElement('h3');
      stepsTitle.textContent = 'Steps';
      const ol = document.createElement('ol');
      ol.className = 'steps';
      for (const s of t.steps) {
        const li = document.createElement('li');
        li.textContent = s;
        ol.append(li);
      }
      card.append(stepsTitle, ol);
    }
  }
  const srcNote = document.createElement('p');
  srcNote.className = 'src-note';
  srcNote.textContent = 'Guides here are written in our own words for this entry; the sources above are where each fact comes from. Official names and descriptions are quoted as PlayStation publishes them.';
  card.append(srcNote);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'earned-toggle';
  toggle.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  toggle.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id);
    else earned.add(t.id);
    save();
    renderAll();
  });
  card.append(toggle);
  detailEl.append(card);
}

function renderRoadmap() {
  for (const p of document.querySelectorAll('.stage-trophies')) {
    const stage = Number(p.dataset.stage);
    const list = trophies.filter((t) => t.roadmap_stage === stage);
    p.textContent = `Trophies in this stage (${list.length}): ` + list.map((t) => t.name).join(' · ');
  }
}

function setView(v) {
  view = v;
  document.getElementById('viewChecklist').classList.toggle('hidden', v !== 'checklist');
  document.getElementById('viewRoadmap').classList.toggle('hidden', v !== 'roadmap');
  document.getElementById('viewSources').classList.toggle('hidden', v !== 'sources');
  for (const b of document.querySelectorAll('.tab')) {
    b.classList.toggle('active', b.dataset.view === v);
  }
}

function setKind(k) {
  kind = KIND_LABELS[k] ? k : 'all';
  for (const b of kindBar.querySelectorAll('.chip')) {
    b.classList.toggle('active', b.dataset.kind === kind);
  }
}

function renderAll() {
  renderProgress();
  renderList();
  renderDetail();
  renderRoadmap();
}

function applyHash() {
  const h = location.hash || '#/';
  const parts = h.replace(/^#\/?/, '').split('/');
  if (parts[0] === 'roadmap') {
    setView('roadmap');
  } else if (parts[0] === 'sources') {
    setView('sources');
  } else if (parts[0] === 'trophy' && byId.has(Number(parts[1]))) {
    setView('checklist');
    selectedId = Number(parts[1]);
  } else if (parts[0] === 'filter' && KIND_LABELS[parts[1]]) {
    setView('checklist');
    setKind(parts[1]);
  } else if (parts[0] === 'spoiler') {
    setView('checklist');
    spoilerOn = true;
    spoilerEl.checked = true;
    saveSpoiler();
  } else {
    setView('checklist');
  }
  renderAll();
}

for (const b of document.querySelectorAll('.tab')) {
  b.addEventListener('click', () => {
    history.replaceState(null, '', `#/${b.dataset.view === 'checklist' ? '' : b.dataset.view}`);
    applyHash();
  });
}
for (const b of kindBar.querySelectorAll('.chip')) {
  b.addEventListener('click', () => {
    setKind(b.dataset.kind);
    history.replaceState(null, '', b.dataset.kind === 'all' ? '#/' : `#/filter/${b.dataset.kind}`);
    renderAll();
  });
}
searchEl.addEventListener('input', renderAll);
gradeEl.addEventListener('change', renderAll);
spoilerEl.checked = spoilerOn;
spoilerEl.addEventListener('change', () => {
  spoilerOn = spoilerEl.checked;
  saveSpoiler();
  renderAll();
});
document.getElementById('missableJump').addEventListener('click', () => {
  selectedId = missables[0].id;
  setKind('missable');
  history.replaceState(null, '', `#/filter/missable`);
  setView('checklist');
  renderAll();
});
document.getElementById('export').addEventListener('click', () => {
  const data = { game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b), exported: new Date().toISOString() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    if (!Array.isArray(ids)) throw new Error('bad file');
    earned = new Set(ids.filter((id) => byId.has(Number(id))).map(Number));
    save();
    renderAll();
  } catch {
    listMeta.textContent = 'That file could not be imported — it must be a progress file exported from this guide.';
  }
  e.target.value = '';
});
document.getElementById('reset').addEventListener('click', () => {
  earned = new Set();
  save();
  renderAll();
});

window.addEventListener('hashchange', applyHash);
applyHash();
