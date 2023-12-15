import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-app.js";
import { getDatabase, ref, child, get, onValue } from "https://www.gstatic.com/firebasejs/9.6.8/firebase-database.js";

const firebaseConfig = {databaseURL: "https://stats-mk-default-rtdb.europe-west1.firebasedatabase.app"};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const warRaference = ref(database, 'currentWars/' + 874);
const teamReference = ref(database, 'teams')

var teamHost = "-1";
var teamOpponent = "-1";
var hostName = "";
var penalties = [];
onValue(warRaference, (snapshot) => {
  let war = snapshot.val();
  teamHost = war.teamHost;
  teamOpponent = war.teamOpponent;
  penalties = war.penalties;
  get(child(teamReference, teamHost)).then((snapshot) => {
    hostName = snapshot.val().name;
  })
  get(child(teamReference, teamOpponent)).then((snapshot) => {
    // document.getElementById("warName").textContent = hostName + " - " + snapshot.val().name;
    document.getElementById("hostName").textContent = hostName;
    document.getElementById("opponentName").textContent = snapshot.val().name;
  })

  var mapCount = 0;
  var hostScore = 0;
  var opponentScore = 0;
  var tracks = war.warTracks;

  for (let div of document.querySelectorAll("div")) { 
    div.remove();
  }
  if (tracks) {
    mapCount = tracks.length;
    tracks.forEach(track =>
      track.warPositions.forEach(position => 
        hostScore += posToPoints(position.position)
      )
    );
    opponentScore = (82*tracks.length) - hostScore;
    if (penalties) {
      penalties.forEach (penalty =>
        {if (penalty.teamId == war.teamHost)
          hostScore -= penalty.amount
        if (penalty.teamId == war.teamOpponent)
        opponentScore -= penalty.amount}
    )}
  }
  var globalScore = hostScore - opponentScore;
  if (globalScore < 0)
    document.getElementById("scoreDiff").style.color = "#fa8072"
  else if (globalScore > 0)
    document.getElementById("scoreDiff").style.color = "#7fff00"
  else
    document.getElementById("scoreDiff").style.color = "#aaaaaa"
  document.getElementById("mapText").textContent = "Maps restantes : " + (12-mapCount);
  document.getElementById("scoreDiff").textContent = diffLabel(globalScore);
  document.getElementById("hostS").textContent = hostScore;
  document.getElementById("opponentS").textContent = opponentScore;

  if (globalScore > 40*(12-mapCount))
  {document.getElementById("winHost").textContent = "WIN";
  document.getElementById("winHost").style.color = "#7fff00";
  document.getElementById("winOpponent").textContent = "LOSE";
  document.getElementById("winOpponent").style.color = "#fa8072";
  document.getElementById("winHost").style.backgroundColor = "#ffffffb0";
  document.getElementById("winOpponent").style.backgroundColor = "#ffffffb0";
  }
  else if (globalScore < -40*(12-mapCount))
  {document.getElementById("winOpponent").textContent = "WIN";
  document.getElementById("winOpponent").style.color = "#7fff00"
  document.getElementById("winHost").textContent = "LOSE";
  document.getElementById("winHost").style.color = "#fa8072";
  document.getElementById("winHost").style.backgroundColor = "#ffffffb0";
  document.getElementById("winOpponent").style.backgroundColor = "#ffffffb0";
  }
  else
  {
    document.getElementById("winOpponent").textContent = "";
    document.getElementById("winHost").textContent = "";
    document.getElementById("winHost").style.backgroundColor = "transparent";
    document.getElementById("winOpponent").style.backgroundColor = "transparent";
  }
 
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