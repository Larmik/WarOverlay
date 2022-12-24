import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getDatabase, ref, child, get, onValue } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {databaseURL: "https://stats-mk-default-rtdb.europe-west1.firebasedatabase.app"};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const warRaference = ref(database, 'newWars');
const teamReference = ref(database, 'teams')

var warId = "-1";
var teamHost = "-1";
var teamOpponent = "-1";
var hostName = "";

onValue(warRaference, (snapshot) => {
  let wars = snapshot.val();
  for (var id in wars) {
    let war = snapshot.child(id).val();
    if (!war.warTracks || war.warTracks.length < 12) {
      warId = war.mid;
      teamHost = war.teamHost;
      teamOpponent = war.teamOpponent;
    };
  };
  get(child(teamReference, teamHost)).then((snapshot) => {
    hostName = snapshot.val().name;
  })
  get(child(teamReference, teamOpponent)).then((snapshot) => {
    // document.getElementById("warName").textContent = hostName + " - " + snapshot.val().name;
    document.getElementById("hostName").textContent = hostName;
    document.getElementById("opponentName").textContent = snapshot.val().name;
  })
  get(child(warRaference, warId)).then((snapshot) => {
    const tracks = snapshot.val().warTracks;
    var mapCount = 0;
    var hostScore = 0;
    var opponentScore = 0;
    for (let div of document.querySelectorAll("div")) { 
      div.remove();
    }
    if (tracks) {
      mapCount = tracks.length;
      tracks.forEach(track =>
        createTrackLine(track)
      );
      tracks.forEach(track =>
        track.warPositions.forEach(position => 
          hostScore += posToPoints(position.position)
        )
      );
      opponentScore = (82*tracks.length) - hostScore;
    }
    var globalScore = hostScore - opponentScore;
    if (globalScore < 0)
      document.getElementById("scoreDiff").style.color = "#fa8072"
    else if (globalScore > 0)
      document.getElementById("scoreDiff").style.color = "#7fff00"
    else
      document.getElementById("scoreDiff").style.color = "#aaaaaa"
    document.getElementById("mapText").textContent = "Maps restantes : " + (12-mapCount);
    document.getElementById("scoreDiff").textContent = diffLabel(hostScore - opponentScore);
    document.getElementById("hostS").textContent = hostScore;
    document.getElementById("opponentS").textContent = opponentScore;
  });
});

function posToPoints(pos) {
  if (pos === 1) return 15;
  if (pos === 2) return 12;
  if (pos === 3) return 10;
  if (pos === 4) return 9;
  if (pos === 5) return 8;
  if (pos === 6) return 7;
  if (pos === 7) return 6;
  if (pos === 8) return 5;
  if (pos === 9) return 4;
  if (pos === 10) return 3;
  if (pos === 11) return 2;
  if (pos === 12) return 1;
  else return 0;
}

function getMapLabel(trackIndex) {
  if (trackIndex === 0) return "MKS";
  if (trackIndex === 1) return "WP";
  if (trackIndex === 2) return "SSC";
  if (trackIndex === 3) return "TR";
  if (trackIndex === 4) return "MC";
  if (trackIndex === 5) return "TH";
  if (trackIndex === 6) return "TM";
  if (trackIndex === 7) return "SGF";
  if (trackIndex === 8) return "SA";
  if (trackIndex === 9) return "DS";
  if (trackIndex === 10) return "Ed";
  if (trackIndex === 11) return "MW";
  if (trackIndex === 12) return "CC";
  if (trackIndex === 13) return "BDD";
  if (trackIndex === 14) return "BC";
  if (trackIndex === 15) return "RR";
  if (trackIndex === 16) return "dYC";
  if (trackIndex === 17) return "dEA";
  if (trackIndex === 18) return "dDD";
  if (trackIndex === 19) return "dMC";
  if (trackIndex === 20) return "dWGM";
  if (trackIndex === 21) return "dRR";
  if (trackIndex === 22) return "dIIO";
  if (trackIndex === 23) return "dHC";
  if (trackIndex === 24) return "rMMM";
  if (trackIndex === 25) return "rMC";
  if (trackIndex === 26) return "rCCB";
  if (trackIndex === 27) return "rTT";
  if (trackIndex === 28) return "rDDD";
  if (trackIndex === 29) return "rDP3";
  if (trackIndex === 30) return "rRRY";
  if (trackIndex === 31) return "rDKJ";
  if (trackIndex === 32) return "rWS";
  if (trackIndex === 33) return "rSL";
  if (trackIndex === 34) return "rMP";
  if (trackIndex === 35) return "rYV";
  if (trackIndex === 36) return "rTTC";
  if (trackIndex === 37) return "rPPS";
  if (trackIndex === 38) return "rGV";
  if (trackIndex === 39) return "rRRd";
  if (trackIndex === 40) return "dBP";
  if (trackIndex === 41) return "dCL";
  if (trackIndex === 42) return "dWW";
  if (trackIndex === 43) return "dAC";
  if (trackIndex === 44) return "dNBC";
  if (trackIndex === 45) return "dRiR";
  if (trackIndex === 46) return "dSBS";
  if (trackIndex === 47) return "dBB";
  if (trackIndex === 48) return "bPP";
  if (trackIndex === 49) return "bTC";
  if (trackIndex === 50) return "bCMo";
  if (trackIndex === 51) return "bCMa";
  if (trackIndex === 52) return "bTB";
  if (trackIndex === 53) return "bSR";
  if (trackIndex === 54) return "bSG";
  if (trackIndex === 55) return "bNH";
  if (trackIndex === 56) return "bNYM";
  if (trackIndex === 57) return "bMC3";
  if (trackIndex === 58) return "bKD";
  if (trackIndex === 59) return "bWP";
  if (trackIndex === 60) return "bSS";
  if (trackIndex === 61) return "bSL";
  if (trackIndex === 62) return "bMG";
  if (trackIndex === 63) return "bSHS";
  if (trackIndex === 64) return "bLL";
  if (trackIndex === 65) return "bBL";
  if (trackIndex === 66) return "bAP";
  if (trackIndex === 67) return "bMT";
  if (trackIndex === 68) return "bBB";
  if (trackIndex === 69) return "bPG";
  if (trackIndex === 70) return "bMM";
  if (trackIndex === 71) return "bRR7";
}

function createTrackLine(track) {
  var line = document.createElement("div");
  var scoreHost = 0;
  track.warPositions.forEach(position => 
    scoreHost += posToPoints(position.position)
  );
  var scoreOpponent = 82 - scoreHost;
  //var scoreDiff = scoreHost - scoreOpponent;
  //line.textContent = getMapLabel(track.trackIndex) + " " + scoreHost + " - " + scoreOpponent + " (" + diffLabel(scoreDiff) + ")"; 
  document.body.appendChild(line);
}

function diffLabel(diff) {
  if (diff > 0) return "+"+diff;
  else return diff;
}