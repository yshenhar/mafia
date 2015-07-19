var _ = require("lodash");

var gameState = {users: []};

var startGame = function(){
  console.log("Game started with users: " + JSON.stringify(gameState.users));
  var shuffledUsers = _.shuffle(gameState.users);
  shuffledUsers[0].role = shuffledUsers[1].role = "mafia";
  shuffledUsers[2].role = "doctor";
  _.drop(shuffledUsers, 3).forEach(function(user){
    user.role = "townfolk";
  });
  gameState.users.forEach(function(user){
    user.isAlive = true;
    process.send({username: user.name, message: "game-started", payload: user.role})
  });

  gameState.users.forEach(function(user){
    var users = _.map(gameState.users, function(userEl){
      var clone = _.clone(userEl);

      if(userEl.role != "mafia" || user.role != "mafia") clone.role = undefined;

      return clone;
    });

    var payload = {phase: "night", subPhase: "mafia", players: users};
    process.send({username: user.name, message: "game-tick", payload: payload});
  });
};

process.on("message", function(data){
  if (data.type === "create"){
    gameState.users = data.users;
    gameId = data.id;
    startGame();
  }
});

