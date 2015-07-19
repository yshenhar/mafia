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
server.listen(config.port, config.ip, function () {
  console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

// Expose app
exports = module.exports = app;

var gamelessUsers = [];
var currentRoom = 0;

var startGame = function(){
  var gameProcess = fork(__dirname + "/games/mafia/game.js");
  gameProcess.send({type: "create", users: gamelessUsers});

  gamelessUsers = [];
  currentRoom = currentRoom + 1;
};

io.on('connection', function (socket) {
  io.emit("test", "test");

  socket.once("join", function(data){
    var starter = gamelessUsers.length == 0;
    var user = {name: data.username, starter: starter, room: currentRoom};
    gamelessUsers.push(user);
    socket._user = user;
    socket.join("game" + currentRoom);
    io.to("game" + currentRoom).emit("current-users", gamelessUsers);
    console.log("Connected User: " + data.username);
    console.log("Users: " + JSON.stringify(gamelessUsers));

    if(starter){
      socket.once("start-game", startGame);
    }
  });


});
