'use strict';

angular.module('mafiaApp')
  .controller('JoinController', function ($scope, $state, $rootScope) {
    $scope.submitUserName = function(){
      $scope.socket.on("current-users", function(users){
        if(!$rootScope.users) $state.go("wait-for-start");
        $rootScope.$apply(function(){
          $rootScope.users = users;
          $rootScope.user = _.find(users, {name: $rootScope.username});
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

    $scope.chat = function(){
      $scope.socket.emit("chat", $scope.chatMessage);
      $scope.chatMessage = "";
    };
  });
