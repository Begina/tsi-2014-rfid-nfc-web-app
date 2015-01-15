/*******************************************************************************
 * Authentication controllers
 ******************************************************************************/

nfcRfidApp.controller('LoginController', ['$scope', 'SecurityService',
    '$location', '$route',
    function ($scope, securityService, $location, $route) {

        function redirectToDashboard(role) {

            if (role === ROLE.administrator) {
                $location.path('/administrator/dashboard');
            } else if (role === ROLE.moderator) {
                $location.path('/moderator/dashboard');
            } else if (role === ROLE.basic) {
                $location.path('/user/dashboard');
            }

            $route.reload();

        }

        var role = securityService.getRole();

        if (role) {
            redirectToDashboard(role);
        }

        $scope.credentials = {
            username: '',
            password: ''
        };

        $scope.notification = new Notification();

        $scope.login = function () {

            securityService.login($scope.credentials).done(function (role) {

                redirectToDashboard(role);

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

    }
]);

nfcRfidApp.controller('LogoutController', ['$scope', 'SecurityService',
    '$location', '$route',
    function ($scope, securityService, $location, $route) {

        this.logout = function () {

            securityService.logout().done(function () {

                $location.path('/login');

                $route.reload();

            }).fail(function () {

                console.log('Trying something criminal?');

            });

        };

    }
]);

/*******************************************************************************
 * Administrator scanners controllers
 ******************************************************************************/

var scannersResource = '/scanners';
var scannersResourceById = scannersResource + '/:id';

nfcRfidApp.controller('AdministratorScannersAddController', ['$scope',
    'SecurityService', '$location', '$route',
    function ($scope, securityService, $location, $route) {

        $scope.scanner = {};
        // Structure: {
        //   uid: '',
        //   description: ''
        // }

        $scope.notification = new Notification();

        $scope.post = function () {

            securityService.request(scannersResource, {
                type: 'POST',
                data: $scope.scanner,
                dataType: 'text'
            }).done(function (response) {

                $scope.scanner = {};

                $location.path('/administrator/scanners');
                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };
    }
]);

/**
 * Does a GET for all the scanners.
 * onDone(scanners) is executed before an $scope.$apply(). No need to do an
 * apply.
 */
function getScanners(securityService, $scope, onDone) {

    securityService.request(scannersResource, {
        type: 'GET',
        dataType: 'JSON'
    }).done(function (scanners) {

        $scope.scanners = scanners;

        if (onDone) onDone(scanners);

        $scope.$apply();

    }).fail(function () {

        console.log('Failed to load scanners.');

    });

}

nfcRfidApp.controller('AdministratorScannersController', ['$scope',
    'SecurityService',
    function ($scope, securityService) {

        $scope.scanners = [];
        // Structure: [{
        //   uid: '',
        //   description: ''
        // }]

        getScanners(securityService, $scope);

    }
]);

nfcRfidApp.controller('AdministratorScannersEditController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        var scannerId = $routeParams.id;

        var resource = scannersResourceById.replace(':id', scannerId);

        $scope.scanner = {};
        // Structure: {
        //   uid: '',
        //   description: ''
        // }

        $scope.notification = new Notification();

        $scope.put = function () {

            securityService.request(resource, {
                type: 'PUT',
                data: $scope.scanner
            }).done(function () {

                $location.path('/administrator/scanners');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

        securityService.request(resource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (scanner) {

            $scope.scanner = scanner;

            $scope.$apply();

        }).fail(function (response) {

            console.log(response.responseText);

        });

    }
]);

nfcRfidApp.controller('AdministratorScannersRemoveController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        var scannerId = $routeParams.id;

        var resource = scannersResourceById.replace(':id', scannerId);

        $scope.scanner = {};
        // Structure: {
        //   uid: '',
        //   description: ''
        // }

        $scope.notification = new Notification();

        $scope.remove = function () {

            securityService.request(resource, {
                type: 'DELETE'
            }).done(function () {

                $location.path('/administrator/scanners');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

        securityService.request(resource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (scanner) {

            $scope.scanner = scanner;

            $scope.$apply();

        }).fail(function (response) {

            console.log(response.responseText);

        });

    }
]);

/*******************************************************************************
 * Administrator users controllers
 ******************************************************************************/

var usersResource = '/users';
var usersResourceById = usersResource + '/:id';

var rolesResource = '/roles';
var rolesResourceById = rolesResource + '/:id';

nfcRfidApp.controller('AdministratorUsersAddController', ['$scope',
    'SecurityService', '$location', '$route',
    function ($scope, securityService, $location, $route) {

        $scope.user = {};
        // Structure: {
        //   username: String,
        //   password: String,
        //   role: Number (1 to 3)
        // }

        $scope.roles = [];
        // Structure: [{
        //   id: Number,
        //   description: String
        // }]

        $scope.notification = new Notification();

        $scope.post = function () {

            securityService.request(usersResource, {
                type: 'POST',
                data: JSON.stringify($scope.user),
                contentType: "application/json; charset=utf-8"
            }).done(function () {

                $location.path('/administrator/users');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

        securityService.request(rolesResource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (roles) {

            $scope.roles = roles;

            $scope.user.role = $scope.roles[0].id; // Select first in dropdown.

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load roles.');

        });

    }
]);

/**
 * Does a GET for all the users, using an expanded role.
 * onDone(users) is executed before the $scope.$apply(). No need to do an apply.
 */
function getUsers(securityService, $scope, onDone) {

    var resource = usersResource + '?expand=role';

    securityService.request(resource, {
        type: 'GET',
        dataType: 'JSON'
    }).done(function (users) {

        $scope.users = users;

        if (onDone) onDone(users);

        $scope.$apply();

    }).fail(function () {

        console.log('Failed to load users.');

    });

}

nfcRfidApp.controller('AdministratorUsersController', ['$scope',
    'SecurityService',
    function ($scope, securityService) {

        $scope.users = [];
        // Structure: [{
        //   id: Number,
        //   username: String,
        //   password: String,
        //   role: String
        // }]

        getUsers(securityService, $scope);

    }
]);

nfcRfidApp.controller('AdministratorUsersEditController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        var userId = $routeParams.id;

        var resource = usersResourceById.replace(':id', userId);

        $scope.user = {};
        // Structure: {
        //   username: String,
        //   password: String,
        //   role: Number (1 to 3)
        // }

        $scope.roles = [];
        // Structure: [{
        //   id: Number,
        //   description: String
        // }]

        $scope.notification = new Notification();

        $scope.put = function () {

            securityService.request(resource, {
                type: 'PUT',
                data: JSON.stringify($scope.user),
                contentType: 'application/json; charset=utf-8'
            }).done(function () {

                $location.path('/administrator/users');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

        securityService.request(rolesResource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (roles) {

            $scope.roles = roles;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load roles.');

        });

        securityService.request(resource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (user) {

            $scope.user = user;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load user.');

        });

    }
]);

nfcRfidApp.controller('AdministratorUsersRemoveController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        var userId = $routeParams.id;

        var resource = usersResourceById.replace(':id', userId);

        $scope.user = {};
        // Structure: {
        //   id: Number,
        //   username: String,
        //   password: String,
        //   role: String
        // }

        var getResource = resource + '?expand=role';

        securityService.request(getResource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (user) {

            $scope.user = user;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load user.');

        });

        $scope.remove = function () {

            securityService.request(resource, {
                type: 'DELETE'
            }).done(function () {

                $location.path('/administrator/users');

                $route.reload();

            }).fail(function () {

                console.log('Failed to delete user.');

            });
        };

    }
]);

/*******************************************************************************
 * Moderator user scan rules controllers
 ******************************************************************************/

function jsDateToMysqlTime(date) {
    date = new Date(date);
    return date.toTimeString().slice(0, 8);
}

function jsDateToOdbcTime(date) {
    return "{ t '" + jsDateToMysqlTime(date) + "' }";
}

/**
 * Formats the date like YYYY delimiter MM delimiter DD
 * @param date
 * @param delimiter
 */
function jsDateFormat(date, delimiter) {
    date = new Date(date);
    var dayOfMonth = date.getDate() + 1;
    var month = date.getMonth() + 1;
    var year = date.getFullYear();

    var formatedDate = '';
    formatedDate += year;
    formatedDate += delimiter;
    formatedDate += month >= 10 ? month : '0' + month;
    formatedDate += delimiter;
    formatedDate += dayOfMonth >= 10 ? dayOfMonth : '0' + dayOfMonth;

    return formatedDate;
}

function jsDateToOdbcDate(date) {
    var delimiter = '-';
    return "{ d '" + jsDateFormat(date, delimiter) + "' }";
}

function secondsTo0(time) {
    time.setSeconds(0);
}

var userScanRulesResource = '/userScanRules';
var userScanRulesResourceById = userScanRulesResource + '/:id';

nfcRfidApp.controller('ModeratorUserScanRulesAddController', ['$scope',
    'SecurityService', '$location', '$route',
    function ($scope, securityService, $location, $route) {

        $scope.minDateValidFrom = new Date();

        $scope.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
            'Saturday', 'Sunday'];

        $scope.userScanRule = {
           userId: 0,
           scannerId: 0,
           startTime: new Date(),
           endTime: new Date(),
           startDate: new Date(),
           endDate: new Date(),
           daysOfWeek: []
        };
        // Structure {
        //   userId: Number,
        //   scannerId: Number,
        //   startTime: String (Format 'HH:MM:SS'),
        //   endTime: String (Format 'HH:MM:SS'),
        //   startDate: String (Format 'YYYY-MM-DD'),
        //   endDate: String (Format 'YYYY-MM-DD'),
        //   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
        // }

        $scope.secondsTo0 = function (time) {
            secondsTo0(time);
        };

        $scope.secondsTo0($scope.userScanRule.startTime);
        $scope.secondsTo0($scope.userScanRule.endTime);

        $scope.users = [];
        $scope.scanners = [];

        $scope.notification = new Notification();

        $scope.toggleDay = function (day) {

            var index = $scope.userScanRule.daysOfWeek.indexOf(day);

            if (index >= 0) {
                $scope.userScanRule.daysOfWeek.splice(index, 1);
            } else {
                $scope.userScanRule.daysOfWeek.push(day);
            }

        };

        $scope.post = function () {

            $scope.userScanRule.startTime = jsDateToOdbcTime(
                $scope.userScanRule.startTime);
            $scope.userScanRule.endTime = jsDateToOdbcTime(
                $scope.userScanRule.endTime);

            $scope.userScanRule.startDate = jsDateToOdbcDate(
                $scope.userScanRule.startDate);
            $scope.userScanRule.endDate = jsDateToOdbcDate(
                $scope.userScanRule.endDate);

            securityService.request(userScanRulesResource, {
                type: 'POST',
                data: JSON.stringify($scope.userScanRule),
                contentType: 'application/json; charset=utf-8'
            }).done(function () {

                $location.path('/moderator/userScanRules');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

        getScanners(securityService, $scope, function (scanners) {
            $scope.userScanRule.scannerId = scanners[0].id;
        });

        getUsers(securityService, $scope, function (users) {
            $scope.userScanRule.userId = users[0].id;
        });

    }
]);

nfcRfidApp.controller('ModeratorUserScanRulesController', ['$scope',
    'SecurityService', function ($scope, securityService) {

        $scope.days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
            'Friday', 'Saturday'];

        $scope.userScanRules = [];
        // Structure: [{
        //   id: Number,
        //   username: String,
        //   scannerUid: String,
        //   startTime: String (Format 'HH:MM:SS'),
        //   endTime: String (Format 'HH:MM:SS'),
        //   startDate: String (Format 'YYYY-MM-DD'),
        //   endDate: String (Format 'YYYY-MM-DD'),
        //   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
        // }]

        var resource = userScanRulesResource + '?expand=user,scanner';

        securityService.request(resource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (userScanRules) {

            $scope.userScanRules = userScanRules;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load user scan rules.');

        });

    }
]);

nfcRfidApp.controller('ModeratorUserScanRulesRemoveController', ['$scope',
    'DatabaseQueryService', '$routeParams', '$location',
    function ($scope, databaseQueryService, $routeParams, $location) {

        var userScanRuleId = $routeParams.id;

        $scope.userScanRules = [];
        /**
         * {
         *   id: Number,
         *   username: String,
         *   scannerUid: String,
         *   responseCommand: String,
         *   weekDay: Number (0 - 6, Monday - Sunday),
         *   timeStart: Time (HH:MM:SS),
         *   timeEnd: Time (HH:MM:SS),
         *   validFrom: Date (YYYY-MM-DD),
         *   validTo: Date (YYYY-MM-DD)
         * }
         */

        var userScanRulesGet = databaseQueryService.get(
            'SELECT user_scanner_rules.id AS id, ' +
            'users.username AS username, ' +
            'scanners.uid AS scannerUid, ' +
            'scanner_commands.command AS responseCommand, ' +
            'user_scanner_rules.week_day AS weekDay, ' +
            'user_scanner_rules.time_start AS timeStart, ' +
            'user_scanner_rules.time_end AS timeEnd, ' +
            'user_scanner_rules.valid_from AS validFrom, ' +
            'user_scanner_rules.valid_to AS validTo ' +
            'FROM users, scanners, scanner_commands, user_scanner_rules ' +
            'WHERE users.id = user_scanner_rules.user AND ' +
            'scanners.id = user_scanner_rules.scanner AND ' +
            'scanner_commands.id = user_scanner_rules.response_scanner_command AND ' +
            'user_scanner_rules.id = ' + userScanRuleId
        );

        if (userScanRulesGet) {
            userScanRulesGet.done(function (userScanRules) {
                $scope.userScanRules = userScanRules;
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }

        $scope.remove = function () {
            var deleteUserScannerRule = 'CALL deleteUserScannerRule(id)';
            deleteUserScannerRule = deleteUserScannerRule.replace('id',
                userScanRuleId);
            databaseQueryService.procedure({query: deleteUserScannerRule})
                .done(function (response) {
                    console.log(JSON.stringify(response));
                    $location.path('/moderator/userScanRules');
                    $scope.$apply();
                }).fail(function (response) {
                    console.log(JSON.stringify(response));
                });
        };
    }
]);

nfcRfidApp.controller('ModeratorAccessRequestsController', ['$scope',
    'DatabaseQueryService', 'SecurityService',
    function ($scope, databaseQueryService, securityService) {

        $scope.scannerCommands = [];
        $scope.accessRequests = [];

        /**
         * {
         *   id: Number,
         *   username: String,
         *   scannerUid: String,
         *   responseCommand: String,
         *   weekDay: Number (0 - 6, Monday - Sunday),
         *   timeStart: Time (HH:MM:SS),
         *   timeEnd: Time (HH:MM:SS),
         *   validFrom: Date (YYYY-MM-DD),
         *   validTo: Date (YYYY-MM-DD)
         * }
         */
        var accessRequestsGet = securityService.request('/accessRequests');

        if (accessRequestsGet) {
            accessRequestsGet.done(function (accessRequests) {
                $scope.accessRequests = accessRequests;
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }

        $scope.disapprove = function (accessRequest) {
            // TODO
        };
    }
]);

nfcRfidApp.controller('ModeratorAccessRequestsEditController', ['$scope',
    'DatabaseQueryService', 'SecurityService', '$routeParams', '$location',
    function ($scope, databaseQueryService, securityService, $routeParams,
              $location) {

        var accessRequestId = $routeParams.id;
        console.log('Access request id: ' + accessRequestId);

        $scope.userScanRule = {
            userId: 0,
            scannerId: 0,
            responseScannerCommandId: 0,
            weekDay: 0,
            timeStart: new Date(),
            timeEnd: new Date(),
            validFrom: new Date(),
            validTo: new Date()
        };
        $scope.scannerCommands = [];

        $scope.notification = new Notification();

        var requestUrl = '/accessRequests/' + accessRequestId;
        console.log('Request URL: ' + requestUrl);
        var accessRequestsGet = securityService.request(requestUrl, {
            type: 'get',
            dataType: 'json'
        });

        if (accessRequestsGet) {
            accessRequestsGet.done(function (userScanRules) {
                $scope.userScanRule = userScanRules[0];
                console.log(JSON.stringify($scope.userScanRule));
                securityService.request('/scannerCommands/' + $scope.userScanRule.scannerId, {
                    type: 'get',
                    dataType: 'json'
                }).done(function (scannerCommands) {
                    $scope.scannerCommands = scannerCommands;
                    $scope.userScanRule.responseScannerCommandId = scannerCommands[0].id;
                    $scope.$apply();
                }).fail(function (error) {
                    console.log(JSON.stringify(error));
                });
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }

        $scope.add = function () {
            securityService.request('/approveAccessRequest', {
                type: 'post',
                data: {
                    accessRequestId: accessRequestId,
                    responseScannerCommandId: $scope.userScanRule.responseScannerCommandId
                },
                dataType: 'json'
            }).done(function (response) {
                $location.path('/moderator/accessRequests');
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            })
        };
    }
]);

nfcRfidApp.controller('UserRequestsAddController', ['$scope',
    'DatabaseQueryService', '$location', 'SecurityService',
    function ($scope, databaseQueryService, $location, securityService) {

        $scope.accessRequest = {
            scannerId: 0,
            weekDay: 0,
            timeStart: new Date(),
            timeEnd: new Date(),
            validFrom: new Date(),
            validTo: new Date()
        };

        $scope.minDateValidFrom = new Date();

        $scope.notification = new Notification();

        $scope.secondsTo0 = function (time) {
            secondsTo0(time);
        };

        $scope.scanners = [];
        /**
         * {
         *   id: Number,
         *   scannerDescription: String,
         *   weekDay: Number (0 - 6, Monday - Sunday),
         *   timeStart: Time (HH:MM:SS),
         *   timeEnd: Time (HH:MM:SS),
         *   validFrom: Date (YYYY-MM-DD),
         *   validTo: Date (YYYY-MM-DD)
         * }
         */

        var scannersGet = databaseQueryService.get(
            'SELECT id AS id, ' +
            'description AS description ' +
            'FROM scanners'
        );

        if (scannersGet) {
            scannersGet.done(function (scanners) {
                $scope.scanners = scanners;
                $scope.accessRequest.scannerId = scanners[0].id;
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }

        $scope.add = function () {
            securityService.request('/accessRequests/create', {
                type: 'post',
                data: $scope.accessRequest,
                dataType: 'json'
            }).done(function (response) {
                $location.path('/user/dashboard');
                $scope.$apply();
            }).fail(function (response) {
                console.log(JSON.stringify(response));
            });
        };
    }
]);

nfcRfidApp.controller('UserRequestsController', ['$scope',
    'DatabaseQueryService', '$location', 'SecurityService',
    function ($scope, databaseQueryService, $location, securityService) {

        $scope.accessRequests = [];
        /**
         * {
         *   id: Number,
         *   scannerUid: String,
         *   weekDay: Number (0 - 6, Monday - Sunday),
         *   timeStart: Time (HH:MM:SS),
         *   timeEnd: Time (HH:MM:SS),
         *   validFrom: Date (YYYY-MM-DD),
         *   validTo: Date (YYYY-MM-DD)
         * }
         */

        $scope.notification = new Notification();

        var accessRequestsGet = securityService.request(
            '/accessRequests', {
                type: 'get',
                dataType: 'json'
            });

        if (accessRequestsGet) {
            accessRequestsGet.done(function (accessRequests) {
                $scope.accessRequests = accessRequests;
                $scope.$apply();
            }).fail(function (response) {
                console.log(JSON.stringify(response));
            });
        }
    }
]);

nfcRfidApp.controller('UserAccessRightsController', ['$scope',
    'DatabaseQueryService', '$location', 'SecurityService',
    function ($scope, databaseQueryService, $location, securityService) {

        $scope.accessRights = [];
        /**
         * {
         *   id: Number,
         *   scannerUid: String,
         *   weekDay: Number (0 - 6, Monday - Sunday),
         *   timeStart: Time (HH:MM:SS),
         *   timeEnd: Time (HH:MM:SS),
         *   validFrom: Date (YYYY-MM-DD),
         *   validTo: Date (YYYY-MM-DD)
         * }
         */

        $scope.notification = new Notification();

        var accessRights = securityService.request(
            '/accessRights', {
                type: 'get',
                dataType: 'json'
            });

        if (accessRights) {
            accessRights.done(function (accessRights) {
                $scope.accessRights = accessRights;
                $scope.$apply();
            }).fail(function (response) {
                console.log(JSON.stringify(response));
            });
        }
    }
]);
