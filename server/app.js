/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
// Setup server
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fork = require('child_process').fork;
require('./config/express')(app);
require('./routes')(app);
var _ = require("lodash");

// Start server
server.listen(config.port, "0.0.0.0", function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;

var games = [];
var sockets = [];
var gamelessUsers = [];
var currentRoom = 0;

var startGame = function(){
  var room = io.of("game" + currentRoom);
  var gameProcess = fork(__dirname + "/games/mafia/game.js", [], {execArgv: ["--debug=" + 5859 + currentRoom]});
  games.push({process: gameProcess, id: currentRoom, users: gamelessUsers});

  gameProcess.send({type: "create", users: gamelessUsers});

  gameProcess.on("message", function(data){
    var socket = _.find(sockets, function(socket){
      return socket._user && socket._user.name == data.username;
    });

    if(socket){
      io.to("delphi").emit("delphi-watch", {originalMessage: data.message, originalData: data.payload, originalUser: socket._user.name});
      socket.emit(data.message, data.payload);
    }
  });

  var gameSockets = _.filter(sockets, function(socket){
    return socket._user.room == currentRoom;
  });

  gameSockets.forEach(function(socket){
    socket.on("tick", function(data){
      gameProcess.send({type: data.type, data: data, user: socket._user.name});
    });
  });

  gamelessUsers = [];
  currentRoom = currentRoom + 1;
};

function nameExists(username) {
  return !!_.find(sockets, function(socket){
    return socket._user && socket._user.name == username;
  });
}

io.on('connection', function (socket) {
  var roomNumber = currentRoom;

  var joinFunc = function(data){
    if(data.username == "delphi"){
      socket.join("delphi");
      socket.join("game" + roomNumber);
      return;
    }

    if(nameExists(data.username))
    {
      socket.emit("fail-join", "name in use");
      socket.once("join", joinFunc);
      return;
    }


    sockets.push(socket);
    var starter = gamelessUsers.length == 0;
    var user = {name: data.username, starter: starter, room: roomNumber};
    gamelessUsers.push(user);
    socket._user = user;
    socket.join("game" + roomNumber);
    io.to("game" + roomNumber).emit("current-users", gamelessUsers);
    console.log("Connected User: " + data.username);
    console.log("Users: " + JSON.stringify(gamelessUsers));

    if(starter){
      socket.once("start-game", startGame);
    }

    socket.on("disconnect", function(){
      sockets = _.remove(sockets, function(socketEl){
        socketEl._user.name = data.username;
      });
    });
  };

  socket.once("join", joinFunc);

  socket.on("chat", function(message){
    io.to("game" + roomNumber).emit("chat", {time: new Date().toLocaleTimeString(), name: socket._user.name, message: message});
  });
});
