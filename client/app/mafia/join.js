'use strict';

angular.module('mafiaApp')
  .controller("DelphiController", function($scope, $rootScope){
    $scope.delphis = [];
    $scope.chats = [];

    $scope.socket.on("delphi-watch", function(delphi){
      $scope.$apply(function(){
        $scope.delphis.push(delphi);
      });
    });

    $scope.socket.on("chat", function(chat){
      $scope.$apply(function(){
        $scope.chats.push(chat);
      });
    });
  })
  .controller('JoinController', function ($scope, $state, $rootScope) {

    $scope.submitUserName = function(){
      $scope.socket.on("current-users", function(users){
        if(!$rootScope.users) $state.go("wait-for-start");
        $rootScope.$apply(function(){
          $rootScope.users = users;
          $rootScope.user = _.find(users, {name: $rootScope.username});
        });
      });
      $scope.socket.on("fail-join", function(reason){
        $rootScope.$apply(function(){
          $scope.failJoin = reason;
        });
      });
      $rootScope.username = $scope.userName;
      $scope.socket.emit("join", {username: $scope.userName});
    };
  })
  .controller('WaitForStartController', function ($scope, $rootScope, $state) {
    if(!$rootScope.user) $state.go("join");

    $scope.socket.on("game-started", function(role){
      $scope.$apply(function(){
        $state.go("play");
        $rootScope.user.role = role;
      });
    });

    $scope.socket.on("game-tick", function(gameState){
      $rootScope.$apply(function(){
        $rootScope.gameState = gameState;
        $rootScope.user.isAlive = _.find(gameState.players, {name: $rootScope.username}).isAlive;
      });
    });

    $scope.startGame = function(){
      $scope.socket.emit("start-game");
    };
  })
  .controller('PlayController', function ($scope, $state, $rootScope) {
    if(!$rootScope.user) $state.go("join");

    $scope.chats = [];

    $scope.socket.on("chat", function(chat){
      $scope.$apply(function(){
        $scope.chats.push(chat);
      });
    });

    $scope.kill = function(player){
      console.log("kill request: " + player.name);
      $scope.socket.emit("tick", {type: "kill", playername: player.name});
    };

    $scope.save = function(player){
      console.log("save request: " + player.name);
      $scope.socket.emit("tick", {type: "save", playername: player.name});
    };

    $scope.lynch = function(player){
      console.log("lynch request: " + player.name);
      $scope.socket.emit("tick", {type: "lynch", playername: player.name});
      $scope.whoYouLynch = player.name;
    };

    $scope.chat = function(chatMessage){
      $scope.socket.emit("chat", chatMessage);
    };
  });
