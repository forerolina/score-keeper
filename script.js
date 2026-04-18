let teamAScore = 0;
let teamBScore = 0;
const storageKey = "score-keeper-scores";
const confettiColors = ["#e546b3", "#7c98ea", "#f6c945", "#56c596", "#ff7f50"];
const confettiPieceCount = 18;

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
const resetScoresButton = document.getElementById("reset-scores");

function renderScores() {
  teamAScoreElement.textContent = String(teamAScore);
  teamBScoreElement.textContent = String(teamBScore);
}

function getLeadingTeam() {
  if (teamAScore === teamBScore) return null;
  return teamAScore > teamBScore ? "team-a" : "team-b";
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
  saveScores();

  const leadingTeam = getLeadingTeam();
  renderLeadingTeam(leadingTeam);
  if (leadingTeam) triggerConfetti(leadingTeam);
}

function saveScores() {
  const scores = {
    teamAScore,
    teamBScore,
  };
  localStorage.setItem(storageKey, JSON.stringify(scores));
}

function loadScores() {
  const savedScores = localStorage.getItem(storageKey);
  if (!savedScores) return;

  const parsedScores = JSON.parse(savedScores);
  const hasValidTeamAScore = Number.isFinite(parsedScores.teamAScore);
  const hasValidTeamBScore = Number.isFinite(parsedScores.teamBScore);
  if (!hasValidTeamAScore || !hasValidTeamBScore) return;

  teamAScore = Math.max(0, parsedScores.teamAScore);
  teamBScore = Math.max(0, parsedScores.teamBScore);
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

teamAIncrementButton.addEventListener("click", incrementTeamAScore);
teamADecrementButton.addEventListener("click", decrementTeamAScore);
teamBIncrementButton.addEventListener("click", incrementTeamBScore);
teamBDecrementButton.addEventListener("click", decrementTeamBScore);
resetScoresButton.addEventListener("click", resetScores);

loadScores();
renderScores();
renderLeadingTeam(getLeadingTeam());
