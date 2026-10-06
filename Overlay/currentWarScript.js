import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBQWV1OoWnqmlyL2yO9A0m9zS5NEMM_3y4",
  authDomain: "stats-mkworld.firebaseapp.com",
  databaseURL: "https://stats-mkworld-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "stats-mkworld",
  storageBucket: "stats-mkworld.firebasestorage.app",
  messagingSenderId: "566035259986",
  appId: "1:566035259986:web:a47a0c023cf3012bebf58b",
  measurementId: "G-PEFD2QDQKT"
};

/* Barème 12 joueurs, aligné sur positionToPoints(is24p = false) et ScoringConstants (Stats MKWorld). */
const POINTS_BY_POSITION_12P = [15, 12, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
const MAX_POINTS_PER_TRACK_12P = 82;
const TRACKS_PER_WAR = 12;
/* Écart par manche restante au-delà duquel la victoire est assurée. */
const WIN_MARGIN_PER_REMAINING_TRACK = 40;

/* Tag affiché quand l'équipe est absente de tags/ (rafraîchi manuellement côté app). */
const UNKNOWN_TAG = "???";

const COLOR_WIN = "#7fff00";
const COLOR_LOSE = "#fa8072";
const COLOR_DRAW = "#aaaaaa";
const BADGE_BACKGROUND = "#ffffffb0";

const elements = {
  hostName: document.getElementById("hostName"),
  opponentName: document.getElementById("opponentName"),
  hostScore: document.getElementById("hostS"),
  opponentScore: document.getElementById("opponentS"),
  scoreDiff: document.getElementById("scoreDiff"),
  mapCount: document.getElementById("mapCount"),
  mapCountLine: document.getElementById("mapCountLine"),
  winHost: document.getElementById("winHost"),
  winOpponent: document.getElementById("winOpponent"),
};

/* Dernières valeurs reçues de la RTDB ; tags vaut null tant que tags/ n'a pas été lu. */
let currentWar = null;
let tags = null;

const database = getDatabase(initializeApp(firebaseConfig));
const rosterId = rosterIdFromUrl();

if (rosterId) {
  onValue(ref(database, "tags"), (snapshot) => {
    tags = asArray(snapshot.val());
    render();
  });
  onValue(ref(database, "currentWars/" + rosterId), (snapshot) => {
    currentWar = snapshot.val();
    render();
  });
}

/* L'URL de l'overlay est de la forme /{rosterId} : on prend le dernier segment non vide du chemin. */
function rosterIdFromUrl() {
  return window.location.pathname.split("/").filter(Boolean).pop();
}

/* Normalise une liste RTDB : tableau, objet indexé (tableau à trous) ou valeur absente. */
function asArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item != null);
  if (value && typeof value === "object") return Object.values(value);
  return [];
}

/* teamOpponent est un tableau de rosterIds ; une chaîne isolée est tolérée par sécurité. */
function opponentIds(war) {
  const ids = typeof war.teamOpponent === "string" ? [war.teamOpponent] : asArray(war.teamOpponent);
  return ids.map(String);
}

function resolveTag(teamId) {
  if (tags === null) return "";
  if (teamId == null) return UNKNOWN_TAG;
  const entry = tags.find((element) => String(element?.teamId) === String(teamId));
  return entry?.tag || UNKNOWN_TAG;
}

function positionToPoints(position) {
  return POINTS_BY_POSITION_12P[position - 1] ?? 0;
}

function computeScores(war, opponents) {
  const tracks = asArray(war.tracks);
  let hostScore = 0;
  tracks.forEach((track) =>
    asArray(track?.positions).forEach((position) => {
      hostScore += positionToPoints(position?.position);
    })
  );
  let opponentScore = MAX_POINTS_PER_TRACK_12P * tracks.length - hostScore;

  const hostId = String(war.teamHost);
  asArray(war.penalties).forEach((penalty) => {
    if (penalty?.teamId == null) return;
    const amount = Number(penalty?.amount) || 0;
    const teamId = String(penalty.teamId);
    if (teamId === hostId) hostScore -= amount;
    else if (opponents.includes(teamId)) opponentScore -= amount;
  });

  return { hostScore, opponentScore, mapCount: tracks.length };
}

function diffLabel(diff) {
  return diff > 0 ? "+" + diff : String(diff);
}

function diffColor(diff) {
  if (diff > 0) return COLOR_WIN;
  if (diff < 0) return COLOR_LOSE;
  return COLOR_DRAW;
}

function showBadge(element, text, color) {
  element.textContent = text;
  element.style.color = color;
  element.style.backgroundColor = BADGE_BACKGROUND;
}

function hideBadge(element) {
  element.textContent = "";
  element.style.backgroundColor = "transparent";
}

function renderResult(diff, remainingTracks) {
  const winMargin = WIN_MARGIN_PER_REMAINING_TRACK * remainingTracks;
  if (diff > winMargin) {
    showBadge(elements.winHost, "WIN", COLOR_WIN);
    showBadge(elements.winOpponent, "LOSE", COLOR_LOSE);
  } else if (diff < -winMargin) {
    showBadge(elements.winOpponent, "WIN", COLOR_WIN);
    showBadge(elements.winHost, "LOSE", COLOR_LOSE);
  } else {
    hideBadge(elements.winHost);
    hideBadge(elements.winOpponent);
  }
}

/* Sans war en cours (nœud absent ou supprimé), l'affichage est laissé en l'état (cf. issue #2). */
function render() {
  const war = currentWar;
  if (!war || typeof war !== "object") return;

  const opponents = opponentIds(war);
  elements.hostName.textContent = resolveTag(war.teamHost);
  elements.opponentName.textContent = resolveTag(opponents[0]);

  const { hostScore, opponentScore, mapCount } = computeScores(war, opponents);
  const diff = hostScore - opponentScore;
  const remainingTracks = TRACKS_PER_WAR - mapCount;

  elements.scoreDiff.style.color = diffColor(diff);
  elements.scoreDiff.textContent = diffLabel(diff);
  elements.hostScore.textContent = hostScore;
  elements.opponentScore.textContent = opponentScore;
  elements.mapCount.textContent = remainingTracks;
  elements.mapCountLine.textContent = "Maps restantes : " + remainingTracks;

  renderResult(diff, remainingTracks);
}
