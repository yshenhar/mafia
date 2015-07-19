'use strict';

angular.module('mafiaApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/join/join.html',
        controller: 'JoinController'
      });
  });

angular.module('mafiaApp')
  .controller('JoinController', function ($scope, $http) {

    $scope.submitUserName = function(){
      $scope.socket.emit("join", {username: $scope.userName});
    };
  });
