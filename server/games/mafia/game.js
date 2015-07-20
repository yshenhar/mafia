var _ = require("lodash");

var gameState = {players: []};

var currentTick = {};

var getLivingPlayers = function(){
  return gameState.players.filter(function(user){
    return user.isAlive;
  });
};

var getLivingMafia = function(){
  return gameState.players.filter(function(user){
    return user.role == 'mafia' && user.isAlive;
  });
};

var sendState = function(specificUsers){
  var sendToUsers = specificUsers || gameState.players;
  sendToUsers.forEach(function(sendToUser){
    var payload = _.cloneDeep(gameState);

    payload.players.forEach(function(userEl){
      if(userEl.role != "mafia" || sendToUser.role != "mafia") userEl.role = undefined;
    });

    if(sendToUser.role != "mafia") payload.suggestedKill = undefined;

    process.send({username: sendToUser.name, message: "game-tick", payload: payload});
  });
};

var startGame = function(){
  console.log("Game started with users: " + JSON.stringify(gameState.players));
  var shuffledUsers = _.shuffle(gameState.players);
  shuffledUsers[0].role = shuffledUsers[1].role = "mafia";
  shuffledUsers[2].role = "doctor";
  _.drop(shuffledUsers, 3).forEach(function(user){
    user.role = "townfolk";
  });
  gameState.players.forEach(function(user){
    user.isAlive = true;
    process.send({username: user.name, message: "game-started", payload: user.role})
  });

  gameState.phase = "night";
  sendState();
};

process.on("message", function(data){
  if (data.type === "create"){
    gameState.players = data.users;
    gameId = data.id;
    startGame();
  }else if(data.type === "kill"){
    currentTick.suggestedKill = currentTick.suggestedKill || {};
    currentTick.suggestedKill[data.user] = data.data.playername;
    console.log("who to kill suggest: " + data.data.playername + " by: " + data.user);
    var livingMafia = getLivingMafia();

    var counts = _.countBy(currentTick.suggestedKill);
    currentTick.whoToKill = getWhoToKill(counts, livingMafia);
    if(currentTick.whoToKill)
      doneKilling();
    else{
      gameState.suggestedKill = currentTick.suggestedKill;
      sendState(livingMafia);
    }
    //data.data.playername = who to kill
    //data.user who wants to do the killing
  }else if(data.type === "save"){
    currentTick.whoToSave = data.data.playername;
    console.log("who to save final: " + currentTick.save);
    doneSaving();
  }else if(data.type === "lynch"){
    var whoToLynch = data.data.playername;
    var whoWantsLynch = data.user;

    if(currentTick[whoWantsLynch] != whoToLynch){
      currentTick[whoWantsLynch] = whoToLynch;
      var valuesCount = _.countBy(_.values(currentTick));

      gameState.players.forEach(function(player){
        player.lynchCount = 0;
      });

      var lynchedPlayer = getLynchedPlayer(valuesCount);

      if(lynchedPlayer)
        doneLynching(lynchedPlayer);
      else
        updateCounts(valuesCount);
    }
  }
});

var getWhoToKill = function(counts, livingMafia){
  var suggestions = _.keys(counts);
  var firstSuggestion = suggestions[0];
  var firstSuggestionCount = counts[firstSuggestion];
  if (suggestions.length == 1 && firstSuggestionCount == livingMafia.length) return firstSuggestion;
};

var getWinner = function(){
  var nonMafiaAlive = 0;
  var mafiaAlive = 0;
  gameState.players.forEach(function(player){
    if(player.isAlive)
      if(player.role == 'mafia') mafiaAlive = mafiaAlive + 1;
      else nonMafiaAlive = nonMafiaAlive + 1;
  });

  if (mafiaAlive >= nonMafiaAlive) return "mafia";
  if (mafiaAlive == 0) return "townsfolk";
};

var getLynchedPlayer = function(valuesCount){
  return _.find(gameState.players, function(player){
    return valuesCount[player.name] / getLivingPlayers().length > 0.5
  });
};

var updateCounts = function(valuesCount){
  console.log("sending updated counts");

  gameState.players.forEach(function(player){
    player.lynchCount = valuesCount[player.name] || 0;
  });

  sendState();
};

var doneLynching = function(lynchedPlayer){
  console.log("done lynching. lynched player: " + lynchedPlayer.name);

  gameState.lastKilled = lynchedPlayer.name;
  gameState.phase = "night";

  lynchedPlayer.isAlive = false;

  gameState.winner = getWinner();

  currentTick = {};
  sendState();
};

var doneKilling = function(){
  currentTick.doneKilling = true;
  console.log("done killing");
  console.log("who to kill final: " + currentTick.whoToKill);
  checkDoneNight();
};

var doneSaving = function(){
  currentTick.doneSaving = true;
  console.log("done saving");
  checkDoneNight();
};

var doneNight = function(){
  console.log("done night");
  if (currentTick.whoToKill != currentTick.whoToSave){
    gameState.lastKilled = currentTick.whoToKill;
    var killedUser = _.find(gameState.players, {name: currentTick.whoToKill});
    killedUser.isAlive = false;
  }
  else
    gameState.lastKilled = null;

  gameState.phase = "day";
  gameState.suggestedKill = null;
  gameState.winner = getWinner();

  if(gameState.winner) console.log("Game Over: " + gameState.winner + " wins!");

  currentTick = {};
  sendState();
};

var checkDoneNight = function(){
  if(currentTick.doneSaving && currentTick.doneKilling) doneNight();
};
