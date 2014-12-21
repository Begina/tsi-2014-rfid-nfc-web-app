var nfcApp = angular.module('nfcApp', ['ngRoute']);

nfcApp.config(function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginController'
        })
        .when('/administrator/dashboard', {
            templateUrl: 'partials/administrator/dashboard.html'
        })
        .when('/administrator/rfids/add', {
            templateUrl: 'partials/administrator/rfids/add.html',
            controller: 'AdministratorRfidsAddController'
        })
        .when('/administrator/rfids', {
            templateUrl: 'partials/administrator/rfids/list.html',
            controller: 'AdministratorRfidsController'
        })
        .when('/administrator/rfids/edit/:id', {
            templateUrl: 'partials/administrator/rfids/edit.html',
            controller: 'AdministratorRfidsEditController'
        })
        .when('/administrator/rfids/remove/:id', {
            templateUrl: 'partials/administrator/rfids/remove.html',
            controller: 'AdministratorRfidsRemoveController'
        })
        .when('/administrator/users/add', {
            templateUrl: 'partials/administrator/users/add.html',
            controller: 'AdministratorUsersAddController'
        })
        .when('/administrator/users', {
            templateUrl: 'partials/administrator/users/list.html',
            controller: 'AdministratorUsersController'
        })
        .when('/administrator/users/edit/:id', {
            templateUrl: 'partials/administrator/users/edit.html',
            controller: 'AdministratorUsersEditController'
        })
        .when('/administrator/users/remove/:id', {
            templateUrl: 'partials/administrator/users/remove.html',
            controller: 'AdministratorUsersRemoveController'
        })
        .when('/moderator/dashboard', {
            templateUrl: 'partials/moderator/dashboard.html'
        })
        .otherwise({
            redirectTo: '/login'
        });
});