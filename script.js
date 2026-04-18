let teamAScore = 0;
let teamBScore = 0;
const storageKey = "score-keeper-scores";
const defaultTeamAName = "Unicorns 🦄";
const defaultTeamBName = "Bats 🦇";
const confettiColors = ["#F7B5CD", "#E895B0", "#FF5252", "#000000", "#FFFFFF", "#3D3538"];
const confettiPieceCount = 18;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const playedAtFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const teamAScoreElement = document.getElementById("team-a-score");
const teamBScoreElement = document.getElementById("team-b-score");
const teamACardElement = document.getElementById("team-a");
const teamBCardElement = document.getElementById("team-b");
const teamAConfettiLayer = document.querySelector("#team-a .confetti-layer");
const teamBConfettiLayer = document.querySelector("#team-b .confetti-layer");

const teamAIncrementButton = document.getElementById("team-a-increment");
const teamADecrementButton = document.getElementById("team-a-decrement");
const teamBIncrementButton = document.getElementById("team-b-increment");
const teamBDecrementButton = document.getElementById("team-b-decrement");
const startOrResetButton = document.getElementById("start-or-reset");
const finishMatchButton = document.getElementById("finish-match");
const currentMatchTitleElement = document.getElementById("current-match-title");
const teamANameInput = document.getElementById("team-a-name");
const teamBNameInput = document.getElementById("team-b-name");
const matchHistoryList = document.getElementById("match-history-list");
const matchHistoryEmpty = document.getElementById("match-history-empty");
const clearMatchHistoryButton = document.getElementById("clear-match-history");
const aggregateSummaryLead = document.getElementById("aggregate-summary-lead");

/** @type {{ version: number, matchSessionActive: boolean, currentMatch: object, completedMatches: object[] }} */
let appState = createDefaultState();

function createMatchId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDefaultState() {
  const now = new Date().toISOString();
  return {
    version: 2,
    matchSessionActive: false,
    currentMatch: {
      id: createMatchId(),
      startedAt: now,
      teamAScore: 0,
      teamBScore: 0,
      teamAName: defaultTeamAName,
      teamBName: defaultTeamBName,
    },
    completedMatches: [],
  };
}

function migrateLegacyToV2(legacy) {
  const teamAName =
    typeof legacy.teamAName === "string" && legacy.teamAName.trim()
      ? legacy.teamAName.trim()
      : defaultTeamAName;
  const teamBName =
    typeof legacy.teamBName === "string" && legacy.teamBName.trim()
      ? legacy.teamBName.trim()
      : defaultTeamBName;
  return {
    version: 2,
    matchSessionActive: true,
    currentMatch: {
      id: createMatchId(),
      startedAt: new Date().toISOString(),
      teamAScore: Math.max(0, legacy.teamAScore),
      teamBScore: Math.max(0, legacy.teamBScore),
      teamAName,
      teamBName,
    },
    completedMatches: [],
  };
}

function normalizeCurrentMatch(cm) {
  const now = new Date().toISOString();
  return {
    id: typeof cm.id === "string" && cm.id ? cm.id : createMatchId(),
    startedAt: typeof cm.startedAt === "string" ? cm.startedAt : now,
    teamAScore: Number.isFinite(cm.teamAScore) ? Math.max(0, cm.teamAScore) : 0,
    teamBScore: Number.isFinite(cm.teamBScore) ? Math.max(0, cm.teamBScore) : 0,
    teamAName:
      typeof cm.teamAName === "string" && cm.teamAName.trim()
        ? cm.teamAName.trim()
        : defaultTeamAName,
    teamBName:
      typeof cm.teamBName === "string" && cm.teamBName.trim()
        ? cm.teamBName.trim()
        : defaultTeamBName,
  };
}

function normalizeCompletedMatch(entry) {
  return {
    id: typeof entry.id === "string" && entry.id ? entry.id : createMatchId(),
    playedAt: typeof entry.playedAt === "string" ? entry.playedAt : new Date().toISOString(),
    teamAScore: Number.isFinite(entry.teamAScore) ? Math.max(0, entry.teamAScore) : 0,
    teamBScore: Number.isFinite(entry.teamBScore) ? Math.max(0, entry.teamBScore) : 0,
    teamAName:
      typeof entry.teamAName === "string" && entry.teamAName.trim()
        ? entry.teamAName.trim()
        : defaultTeamAName,
    teamBName:
      typeof entry.teamBName === "string" && entry.teamBName.trim()
        ? entry.teamBName.trim()
        : defaultTeamBName,
  };
}

function isValidCompletedMatchEntry(entry) {
  if (!entry || typeof entry !== "object") return false;
  if (typeof entry.playedAt !== "string" || !entry.playedAt) return false;
  return Number.isFinite(entry.teamAScore) && Number.isFinite(entry.teamBScore);
}

function normalizeV2(parsed) {
  const base = createDefaultState();
  if (parsed.currentMatch && typeof parsed.currentMatch === "object") {
    base.currentMatch = normalizeCurrentMatch(parsed.currentMatch);
  }
  if (Array.isArray(parsed.completedMatches)) {
    base.completedMatches = parsed.completedMatches
      .filter(isValidCompletedMatchEntry)
      .map(normalizeCompletedMatch);
  }
  if (typeof parsed.matchSessionActive === "boolean") {
    base.matchSessionActive = parsed.matchSessionActive;
  } else {
    base.matchSessionActive = true;
  }
  return base;
}

function loadState() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) {
    appState = createDefaultState();
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    appState = createDefaultState();
    return;
  }

  if (!parsed || typeof parsed !== "object") {
    appState = createDefaultState();
    return;
  }

  if (parsed.version === 2 && parsed.currentMatch && Array.isArray(parsed.completedMatches)) {
    appState = normalizeV2(parsed);
    return;
  }

  const hasValidTeamAScore = Number.isFinite(parsed.teamAScore);
  const hasValidTeamBScore = Number.isFinite(parsed.teamBScore);
  if (hasValidTeamAScore && hasValidTeamBScore) {
    appState = migrateLegacyToV2(parsed);
    return;
  }

  appState = createDefaultState();
}

function syncDomIntoCurrentMatch() {
  appState.currentMatch.teamAScore = teamAScore;
  appState.currentMatch.teamBScore = teamBScore;
  appState.currentMatch.teamAName = resolvedTeamAName();
  appState.currentMatch.teamBName = resolvedTeamBName();
}

function saveState() {
  syncDomIntoCurrentMatch();
  localStorage.setItem(storageKey, JSON.stringify(appState));
}

function renderMatchToolbar() {
  const active = appState.matchSessionActive;
  if (currentMatchTitleElement) {
    currentMatchTitleElement.textContent = active ? "Ongoing match" : "No ongoing match";
  }
  if (startOrResetButton) {
    startOrResetButton.textContent = active ? "Reset" : "Start";
    startOrResetButton.setAttribute(
      "aria-label",
      active ? "Reset scores for current match to zero" : "Start a new match",
    );
    startOrResetButton.classList.toggle("toolbar-button-primary", !active);
    startOrResetButton.classList.toggle("toolbar-button-secondary", active);
  }
  if (finishMatchButton) {
    finishMatchButton.disabled = !active;
  }
  const disableScores = !active;
  teamAIncrementButton.disabled = disableScores;
  teamADecrementButton.disabled = disableScores;
  teamBIncrementButton.disabled = disableScores;
  teamBDecrementButton.disabled = disableScores;
}

function applyCurrentMatchToDom() {
  const m = appState.currentMatch;
  teamAScore = m.teamAScore;
  teamBScore = m.teamBScore;
  teamANameInput.value = m.teamAName;
  teamBNameInput.value = m.teamBName;
  renderScores();
  renderLeadingTeam(getLeadingTeam());
  renderMatchToolbar();
  renderAggregateSummary();
}

function resolvedTeamAName() {
  const trimmed = teamANameInput.value.trim();
  return trimmed || defaultTeamAName;
}

function resolvedTeamBName() {
  const trimmed = teamBNameInput.value.trim();
  return trimmed || defaultTeamBName;
}

function renderScores() {
  teamAScoreElement.textContent = String(teamAScore);
  teamBScoreElement.textContent = String(teamBScore);
}

function getLeadingTeam() {
  if (teamAScore === teamBScore) return null;
  return teamAScore > teamBScore ? "team-a" : "team-b";
}

function getCompletedMatchOutcome(match) {
  if (match.teamAScore === match.teamBScore) return "draw";
  return match.teamAScore > match.teamBScore ? "team-a" : "team-b";
}

function getAggregateTotals() {
  const nameA = resolvedTeamAName();
  const nameB = resolvedTeamBName();
  let totalA = appState.currentMatch.teamAScore;
  let totalB = appState.currentMatch.teamBScore;
  for (const match of appState.completedMatches) {
    if (match.teamAName === nameA) totalA += match.teamAScore;
    if (match.teamBName === nameB) totalB += match.teamBScore;
  }
  return { totalA, totalB };
}

function renderAggregateSummary() {
  if (!aggregateSummaryLead) return;
  syncDomIntoCurrentMatch();
  const { totalA, totalB } = getAggregateTotals();
  const nameA = resolvedTeamAName();
  const nameB = resolvedTeamBName();
  const hasHistory = appState.completedMatches.length > 0;

  if (totalA > totalB) {
    aggregateSummaryLead.textContent = `${nameA} leads with ${totalA} points overall.`;
    return;
  }
  if (totalB > totalA) {
    aggregateSummaryLead.textContent = `${nameB} leads with ${totalB} points overall.`;
    return;
  }
  if (totalA === 0 && totalB === 0 && !hasHistory) {
    aggregateSummaryLead.textContent =
      "No winners yet. Start a match \uD83D\uDC47\uD83C\uDFFC";
    return;
  }
  aggregateSummaryLead.textContent = `Tied at ${totalA} overall.`;
}

function formatPlayedAt(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return playedAtFormatter.format(date);
}

function renderMatchHistory() {
  const items = appState.completedMatches;
  if (clearMatchHistoryButton) {
    clearMatchHistoryButton.disabled = items.length === 0;
  }
  matchHistoryList.innerHTML = "";

  if (items.length === 0) {
    matchHistoryEmpty.hidden = false;
    matchHistoryList.hidden = true;
  } else {
    matchHistoryEmpty.hidden = true;
    matchHistoryList.hidden = false;

    for (const match of items) {
      const outcome = getCompletedMatchOutcome(match);
      const row = document.createElement("li");
      row.className = "match-history-row";
      if (outcome === "team-a") row.classList.add("is-win-team-a");
      else if (outcome === "team-b") row.classList.add("is-win-team-b");
      else row.classList.add("is-draw");

      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "match-history-row-dismiss";
      dismiss.textContent = "\u00d7";
      const playedLabel = formatPlayedAt(match.playedAt);
      dismiss.setAttribute(
        "aria-label",
        playedLabel ? `Remove match from ${playedLabel}` : "Remove match from history",
      );
      dismiss.dataset.matchId = match.id;

      const meta = document.createElement("div");
      meta.className = "match-history-meta";
      meta.textContent = formatPlayedAt(match.playedAt);

      const sides = document.createElement("div");
      sides.className = "match-history-sides";

      const sideA = document.createElement("div");
      sideA.className = "match-history-side match-history-side-a";
      if (outcome === "team-a") sideA.classList.add("is-winner");
      const nameA = document.createElement("span");
      nameA.className = "match-history-name";
      nameA.textContent = match.teamAName;
      const scoreA = document.createElement("span");
      scoreA.className = "match-history-score";
      scoreA.textContent = String(match.teamAScore);
      sideA.append(nameA, scoreA);

      const sideB = document.createElement("div");
      sideB.className = "match-history-side match-history-side-b";
      if (outcome === "team-b") sideB.classList.add("is-winner");
      const nameB = document.createElement("span");
      nameB.className = "match-history-name";
      nameB.textContent = match.teamBName;
      const scoreB = document.createElement("span");
      scoreB.className = "match-history-score";
      scoreB.textContent = String(match.teamBScore);
      sideB.append(nameB, scoreB);

      sides.append(sideA, sideB);
      row.append(dismiss, meta, sides);
      matchHistoryList.append(row);
    }
  }

  renderAggregateSummary();
}

function handleMatchHistoryListClick(event) {
  const dismiss = event.target.closest(".match-history-row-dismiss");
  if (!dismiss || !matchHistoryList.contains(dismiss)) return;
  const matchId = dismiss.dataset.matchId;
  if (!matchId) return;
  appState.completedMatches = appState.completedMatches.filter((entry) => entry.id !== matchId);
  saveState();
  renderMatchHistory();
}

function clearAllMatchHistory() {
  if (appState.completedMatches.length === 0) return;
  appState.completedMatches = [];
  saveState();
  renderMatchHistory();
}

function createConfettiPiece(layer) {
  const confettiPiece = document.createElement("span");
  const driftX = `${Math.random() * 8 - 4}rem`;
  const spinRotation = `${Math.random() * 420 - 210}deg`;
  confettiPiece.className = "confetti-piece";
  confettiPiece.style.left = `${Math.random() * 100}%`;
  confettiPiece.style.backgroundColor =
    confettiColors[Math.floor(Math.random() * confettiColors.length)];
  confettiPiece.style.animationDelay = `${Math.random() * 180}ms`;
  confettiPiece.style.animationDuration = `${900 + Math.random() * 500}ms`;
  confettiPiece.style.setProperty("--drift-x", driftX);
  confettiPiece.style.setProperty("--spin-rotation", spinRotation);
  layer.append(confettiPiece);

  window.setTimeout(() => {
    confettiPiece.remove();
  }, 1600);
}

function triggerConfetti(teamId) {
  if (prefersReducedMotion()) return;
  const layer = teamId === "team-a" ? teamAConfettiLayer : teamBConfettiLayer;
  if (!layer) return;

  for (let index = 0; index < confettiPieceCount; index += 1) {
    createConfettiPiece(layer);
  }
}

function renderLeadingTeam(teamId) {
  teamACardElement.classList.toggle("is-winning", teamId === "team-a");
  teamBCardElement.classList.toggle("is-winning", teamId === "team-b");
}

function updateScores() {
  renderScores();
  saveState();

  const leadingTeam = getLeadingTeam();
  renderLeadingTeam(leadingTeam);
  if (leadingTeam) triggerConfetti(leadingTeam);
  renderAggregateSummary();
}

function commitTeamAName() {
  teamANameInput.value = resolvedTeamAName();
  saveState();
  renderAggregateSummary();
}

function commitTeamBName() {
  teamBNameInput.value = resolvedTeamBName();
  saveState();
  renderAggregateSummary();
}

function handleTeamNameKeydown(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  event.currentTarget.blur();
}

function incrementTeamAScore() {
  teamAScore += 1;
  updateScores();
}

function decrementTeamAScore() {
  if (teamAScore === 0) return;
  teamAScore -= 1;
  updateScores();
}

function incrementTeamBScore() {
  teamBScore += 1;
  updateScores();
}

function decrementTeamBScore() {
  if (teamBScore === 0) return;
  teamBScore -= 1;
  updateScores();
}

function resetScores() {
  teamAScore = 0;
  teamBScore = 0;
  updateScores();
}

function beginFreshCurrentMatch() {
  syncDomIntoCurrentMatch();
  const cm = appState.currentMatch;
  appState.currentMatch = {
    id: createMatchId(),
    startedAt: new Date().toISOString(),
    teamAScore: 0,
    teamBScore: 0,
    teamAName: cm.teamAName,
    teamBName: cm.teamBName,
  };
  applyCurrentMatchToDom();
  saveState();
  renderMatchHistory();
}

function handleStartOrReset() {
  if (!appState.matchSessionActive) {
    beginFreshCurrentMatch();
    appState.matchSessionActive = true;
    saveState();
    renderMatchToolbar();
    return;
  }
  resetScores();
}

function finishMatch() {
  syncDomIntoCurrentMatch();
  const cm = appState.currentMatch;
  appState.completedMatches.unshift({
    id: createMatchId(),
    playedAt: new Date().toISOString(),
    teamAScore: cm.teamAScore,
    teamBScore: cm.teamBScore,
    teamAName: cm.teamAName,
    teamBName: cm.teamBName,
  });
  appState.currentMatch = {
    id: createMatchId(),
    startedAt: new Date().toISOString(),
    teamAScore: 0,
    teamBScore: 0,
    teamAName: cm.teamAName,
    teamBName: cm.teamBName,
  };
  appState.matchSessionActive = false;
  applyCurrentMatchToDom();
  saveState();
  renderMatchHistory();
}

teamAIncrementButton.addEventListener("click", incrementTeamAScore);
teamADecrementButton.addEventListener("click", decrementTeamAScore);
teamBIncrementButton.addEventListener("click", incrementTeamBScore);
teamBDecrementButton.addEventListener("click", decrementTeamBScore);
startOrResetButton.addEventListener("click", handleStartOrReset);
finishMatchButton.addEventListener("click", finishMatch);
teamANameInput.addEventListener("blur", commitTeamAName);
teamBNameInput.addEventListener("blur", commitTeamBName);
teamANameInput.addEventListener("input", renderAggregateSummary);
teamBNameInput.addEventListener("input", renderAggregateSummary);
teamANameInput.addEventListener("keydown", handleTeamNameKeydown);
teamBNameInput.addEventListener("keydown", handleTeamNameKeydown);
matchHistoryList.addEventListener("click", handleMatchHistoryListClick);
clearMatchHistoryButton?.addEventListener("click", clearAllMatchHistory);

loadState();
applyCurrentMatchToDom();
saveState();
renderMatchHistory();
