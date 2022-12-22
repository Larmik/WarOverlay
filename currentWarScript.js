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
  for (var id in snapshot.val()) {
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
    document.getElementById("hostName").textContent = hostName;
    document.getElementById("opponentName").textContent = snapshot.val().name;
  })
  get(child(warRaference, warId)).then((snapshot) => {
    const tracks = snapshot.val().warTracks;
    var mapCount = 0;
    var hostScore = 0;
    var opponentScore = 0;
    if (tracks) {
      mapCount = tracks.length;
      tracks.forEach(track =>
        track.warPositions.forEach(position => 
          hostScore += posToPoints(position.position)
        )
      );
      opponentScore = (82*tracks.length) - hostScore;
    }
    refreshOverlay(hostScore, opponentScore, mapCount)   
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

function refreshOverlay(host, opponent, count) {
  const global = host - opponent
  document.getElementById("mapText").textContent = "Maps restantes : " + (12-count);
  document.getElementById("hostS").textContent = host;
  document.getElementById("opponentS").textContent = opponent;
  if (global > 0) {
    document.getElementById("scoreDiff").textContent = "+" + global;
    document.getElementById("scoreDiff").style.color = "#7fff00";
  } else {
    document.getElementById("scoreDiff").textContent =  global;
    if (global < 0) 
      document.getElementById("scoreDiff").style.color = "#fa8072";
    else
    document.getElementById("scoreDiff").style.color = "#aaaaaa";
  }
}
