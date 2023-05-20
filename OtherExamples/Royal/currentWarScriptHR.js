import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getDatabase, ref, child, get, onValue } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {databaseURL: "https://stats-mk-default-rtdb.europe-west1.firebasedatabase.app"};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const warRaference = ref(database, 'newWars/' + 1643723546718);
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
  if (warId == "-1") 
    document.querySelector("h1").textContent = "Aucun match en cours";
  else {
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
      if (tracks) {
        mapCount = tracks.length;
        tracks.forEach(track =>
          track.warPositions.forEach(position => 
            hostScore += posToPoints(position.position)
          )
        );
        opponentScore = (82*tracks.length) - hostScore;
      }
      var scoreGlobal = hostScore - opponentScore;
      if (scoreGlobal < 0)
        document.getElementById("scoreDiff").style.color = "#fa8072"
      else if (scoreGlobal > 0)
        document.getElementById("scoreDiff").style.color = "#7fff00"
      else
        document.getElementById("scoreDiff").style.color = "#aaaaaa"
      document.getElementById("mapsLeft").textContent = (12-mapCount);
      document.getElementById("scoreDiff").textContent = diffLabel(hostScore - opponentScore);
      document.getElementById("hostS").textContent = hostScore;
      document.getElementById("opponentS").textContent = opponentScore;
    });
  };
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

function diffLabel(diff) {
  if (diff > 0) return "+"+diff;
  else return diff;
}