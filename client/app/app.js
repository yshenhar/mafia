'use strict';



angular.module('mafiaApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ui.router',
  'ui.bootstrap'
])
  .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $urlRouterProvider
      .otherwise('/');

    $locationProvider.html5Mode(false);
  });


angular.module('mafiaApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('join', {
        url: '/',
        templateUrl: 'app/mafia/join.html',
        controller: 'JoinController'
      })
    .state('wait-for-start', {
      url: '/wait-for-start',
      templateUrl: 'app/mafia/wait-for-start.html',
      controller: 'WaitForStartController'
    })
    .state('play', {
      url: '/play',
      templateUrl: 'app/mafia/play.html',
      controller: 'PlayController'
    });
  });

var mafiaApp = angular.module("mafiaApp");

mafiaApp.run(function($rootScope, $state, $location){
  var socket = io();

  window.__socket = socket;

  $rootScope.socket = socket;

  $state.go("join");
});
