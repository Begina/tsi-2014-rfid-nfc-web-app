var nfcRfidApp = angular.module('nfcRfidApp', ['ngRoute', 'ui.bootstrap']);

nfcRfidApp.config(function ($routeProvider) {
    $routeProvider
        .when('/login', {
            templateUrl: 'partials/login.html',
            controller: 'LoginController'
        })
        .when('/administrator/dashboard', {
            templateUrl: 'partials/administrator/dashboard.html'
        })
        .when('/administrator/scanners/add', {
            templateUrl: 'partials/administrator/scanners/add.html',
            controller: 'AdministratorScannersAddController'
        })
        .when('/administrator/scanners', {
            templateUrl: 'partials/administrator/scanners/list.html',
            controller: 'AdministratorScannersController'
        })
        .when('/administrator/scanners/edit/:id', {
            templateUrl: 'partials/administrator/scanners/edit.html',
            controller: 'AdministratorScannersEditController'
        })
        .when('/administrator/scanners/remove/:id', {
            templateUrl: 'partials/administrator/scanners/remove.html',
            controller: 'AdministratorScannersRemoveController'
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
        .when('/moderator/userScanRules/add', {
            templateUrl: 'partials/moderator/userScanRules/add.html',
            controller: 'ModeratorUserScanRulesAddController'
        })
        .when('/moderator/userScanRules', {
            templateUrl: 'partials/moderator/userScanRules/list.html',
            controller: 'ModeratorUserScanRulesController'
        })
        .when('/moderator/userScanRules/remove/:id', {
            templateUrl: 'partials/moderator/userScanRules/remove.html',
            controller: 'ModeratorUserScanRulesRemoveController'
        })
        .when('/moderator/accessRequests', {
            templateUrl: 'partials/moderator/accessRequests/list.html',
            controller: 'ModeratorAccessRequestsController'
        })
        .when('/accessRequests/edit/:id', {
            templateUrl: 'partials/moderator/accessRequests/edit.html',
            controller: 'ModeratorAccessRequestsEditController'
        })
        .when('/user/requests/add', {
            templateUrl: 'partials/user/requests/add.html',
            controller: 'UserRequestsAddController'
        })
        .when('/user/dashboard', {
            templateUrl: 'partials/user/dashboard.html'
        })
        .when('/user/requests/add', {
            templateUrl: 'partials/user/requests/add.html',
            controller: 'UserRequestsAddController'
        })
        .when('/user/requests', {
            templateUrl: 'partials/user/requests/list.html',
            controller: 'UserRequestsController'
        })
        .when('/user/accessRights', {
            templateUrl: 'partials/user/accessRights/list.html',
            controller: 'UserAccessRightsController'
        })
        .otherwise({
            redirectTo: '/login'
        });
});