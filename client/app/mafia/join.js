'use strict';

angular.module('mafiaApp')
  .controller('JoinController', function ($scope, $state, $rootScope) {
    $scope.submitUserName = function(){
      $state.go("wait-for-start");
      $scope.socket.on("current-users", function(users){
        $rootScope.$apply(function(){
          $rootScope.users = users;
          $rootScope.user = _.find(users, {name: $rootScope.username});
        });
      });
      $rootScope.username = $scope.userName;
      $scope.socket.emit("join", {username: $scope.userName});
    };
  })
  .controller('WaitForStartController', function ($scope, $rootScope) {
    $scope.socket.on("game-started", function(gameState){
      $scope.$apply(function(){

      });
    });

    $scope.startGame = function(){
      $scope.socket.emit("start-game");
    };
  });
