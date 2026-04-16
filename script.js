let teamAScore = 0;
let teamBScore = 0;
const storageKey = "score-keeper-scores";

const teamAScoreElement = document.getElementById("team-a-score");
const teamBScoreElement = document.getElementById("team-b-score");

const teamAIncrementButton = document.getElementById("team-a-increment");
const teamADecrementButton = document.getElementById("team-a-decrement");
const teamBIncrementButton = document.getElementById("team-b-increment");
const teamBDecrementButton = document.getElementById("team-b-decrement");

function renderScores() {
  teamAScoreElement.textContent = String(teamAScore);
  teamBScoreElement.textContent = String(teamBScore);
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
  renderScores();
  saveScores();
}

function decrementTeamAScore() {
  if (teamAScore === 0) return;
  teamAScore -= 1;
  renderScores();
  saveScores();
}

function incrementTeamBScore() {
  teamBScore += 1;
  renderScores();
  saveScores();
}

function decrementTeamBScore() {
  if (teamBScore === 0) return;
  teamBScore -= 1;
  renderScores();
  saveScores();
}

teamAIncrementButton.addEventListener("click", incrementTeamAScore);
teamADecrementButton.addEventListener("click", decrementTeamAScore);
teamBIncrementButton.addEventListener("click", incrementTeamBScore);
teamBDecrementButton.addEventListener("click", decrementTeamBScore);

loadScores();
renderScores();
