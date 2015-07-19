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

var mafiaApp = angular.module("mafiaApp");

mafiaApp.run(function($rootScope){
  var socket = io();

  $rootScope.socket = socket;
});
