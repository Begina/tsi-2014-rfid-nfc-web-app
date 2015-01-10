/*******************************************************************************
 * Authentication controllers
 ******************************************************************************/

nfcRfidApp.controller('LoginController', ['$scope', 'SecurityService',
    '$location', function ($scope, securityService, $location) {
        $scope.credentials = {
            username: '',
            password: ''
        };

        $scope.notification = new Notification();

        $scope.login = function () {
            securityService.login($scope.credentials)
                .done(function (userSession) {
                    if (userSession.role === ROLE.administrator) {
                        $location.path('/administrator/dashboard');
                        $scope.$apply();
                    } else if (userSession.role === ROLE.moderator) {
                        $location.path('/moderator/dashboard');
                        $scope.$apply();
                    } else if (userSession.role === ROLE.basic) {
                        $location.path('/user/dashboard');
                        $scope.$apply();
                    }
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };
    }
]);

/*******************************************************************************
 * Administrator scanners controllers
 ******************************************************************************/

nfcRfidApp.controller('AdministratorScannersAddController', ['$scope',
    'ScannersService',
    function ($scope, scannersService) {
        $scope.scanner = {
            id: 0,
            uid: '',
            description: ''
        };

        $scope.notification = new Notification();

        $scope.add = function () {
            scannersService.add($scope.scanner)
                .done(function (response) {
                    $scope.notification.message = response.message;
                    $scope.scanner = {
                        id: 0,
                        uid: '',
                        description: ''
                    };
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };
    }
]);

nfcRfidApp.controller('AdministratorScannersController', ['$scope',
    'ScannersService',
    function ($scope, scannersService) {
        $scope.scanners = [];

        var getAllScannersPromise = scannersService.getAll();
        if (getAllScannersPromise) {
            getAllScannersPromise
                .done(function (scanners) {
                    $scope.scanners = scanners;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load scanners.');
                });
        }
    }
]);

nfcRfidApp.controller('AdministratorScannersEditController', ['$scope',
    'ScannersService', 'ScannerCommandsService', '$routeParams', '$location',
    function ($scope, scannersService, scannerCommandsService, $routeParams,
              $location) {
        $scope.scanner = {};

        $scope.notification = new Notification();

        $scope.update = function () {
            scannersService.update($scope.scanner)
                .done(function (message) {
                    $location.path('/administrator/scanners');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        var getScannerCommands = function (scannerId) {
            var getScannerCommandsPromise =
                scannerCommandsService.getById(scannerId);
            if (getScannerCommandsPromise) {
                getScannerCommandsPromise
                    .done(function (commands) {
                        var commandsOnly = [];
                        for (var i = 0; i < commands.length; i++) {
                            commandsOnly.push(commands[i].command);
                        }
                        $scope.scanner.commands = commandsOnly;
                        $scope.$apply();
                    })
                    .fail(function (response) {
                        var error = response.responseJSON;
                        $scope.notification.message = error.message;
                        $scope.$apply();
                    });
            }
        };

        var scannerId = $routeParams.id;
        var getScannersByIdPromise = scannersService.getById(scannerId);
        if (getScannersByIdPromise) {
            getScannersByIdPromise
                .done(function (scanner) {
                    $scope.scanner = scanner;
                    getScannerCommands(scanner.id);
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        }
    }
]);

nfcRfidApp.controller('AdministratorScannersRemoveController', ['$scope',
    'ScannersService', '$routeParams', '$location',
    function ($scope, scannersService, $routeParams, $location) {
        console.log('Controller active.');

        var id = 0;

        $scope.scanner = {};

        $scope.notification = new Notification();

        $scope.remove = function () {
            scannersService.remove(id)
                .done(function (response) {
                    $location.path('/administrator/scanners');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        id = $routeParams.id;
        var getScannersByIdPromise = scannersService.getById(id);
        if (getScannersByIdPromise) {
            getScannersByIdPromise
                .done(function (scanner) {
                    $scope.scanner = scanner;
                    $scope.$apply();
                })
                .fail(function () {
                    $location.$apply('/administrator/scanners');
                    $scope.$apply();
                });
        }
    }
]);

/*******************************************************************************
 * Administrator users controllers
 ******************************************************************************/

nfcRfidApp.controller('AdministratorUsersAddController', ['$scope',
    'UsersService', 'TagsService', 'RolesService',
    function ($scope, usersService, tagsService, rolesService) {
        $scope.user = {};

        $scope.roles = [];
        $scope.tags = [];

        $scope.notification = new Notification();

        $scope.add = function () {
            usersService.add($scope.user)
                .done(function (response) {
                    $scope.notification.message = response.message;
                    $scope.user = {};
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        // The getAllRolesPromise and getAllNfcPromise  is null when parsed for
        // the first time.

        var getAllRolesPromise = rolesService.getAll();

        if (getAllRolesPromise) {
            getAllRolesPromise
                .done(function (roles) {
                    $scope.roles = roles;
                    $scope.user.role = $scope.roles[0].id;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load roles.');
                });
        }

        var getAllUnassignedTagsPromise = tagsService.getAllUnassigned();

        if (getAllUnassignedTagsPromise) {
            getAllUnassignedTagsPromise
                .done(function (tags) {
                    $scope.tags = tags;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load tags.');
                });
        }
    }
]);

nfcRfidApp.controller('AdministratorUsersController', ['$scope', 'UsersService',
    function ($scope, usersService) {
        $scope.users = [];

        var getAllUsersPromise = usersService.getAll();
        if (getAllUsersPromise) {
            getAllUsersPromise
                .done(function (users) {
                    $scope.users = users;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load users.');
                });
        }
    }
]);

nfcRfidApp.controller('AdministratorUsersEditController', ['$scope',
    'UsersService', 'RolesService', 'TagsService', '$routeParams', '$location',
    function ($scope, usersService, rolesService, tagsService, $routeParams,
              $location) {
        $scope.user_all = {};

        $scope.user = {};

        $scope.roles = [];
        $scope.tags = [];

        $scope.notification = new Notification();

        // The getAllRolesPromise and getAllNfcPromise is null when parsed for
        // the first time.

        // null - no active tag.
        var getUnassignedTags = function (activeTag) {
            var getAllUnassignedTagsPromise = tagsService.getAllUnassigned();

            if (getAllUnassignedTagsPromise) {
                getAllUnassignedTagsPromise
                    .done(function (tags) {
                        $scope.tags = tags;
                        if (activeTag && activeTag.id) {
                            $scope.tags.push(activeTag);
                            $scope.user.tag = activeTag.id;
                        }

                        $scope.$apply();
                    })
                    .fail(function (response) {
                        console.log('Failed to load tags.');
                    });
            }
        };

        var getRoles = function (activeRoleId, callback) {
            var getAllRolesPromise = rolesService.getAll();

            if (getAllRolesPromise) {
                getAllRolesPromise
                    .done(function (roles) {
                        $scope.roles = roles;
                        for (var i = 0; i < $scope.roles.length; i++) {
                            if ($scope.roles[i].id === activeRoleId) {
                                $scope.user.role = $scope.roles[i].id;
                                break;
                            }
                        }

                        callback();
                    })
                    .fail(function (response) {
                        console.log('Failed to load roles.');
                    });
            }
        };

        var userId = $routeParams.id;
        var getUserByIdPromise = usersService.getById(userId);
        if (getUserByIdPromise) {
            getUserByIdPromise
                .done(function (user_all) {
                    $scope.user_all = user_all;

                    $scope.user = {
                        id: user_all.user_id,
                        username: user_all.user_username,
                        password: user_all.user_password,
                        role: user_all.role_id
                    };

                    getRoles(user_all.role_id, function () {
                        getUnassignedTags({
                            id: user_all.tag_id,
                            uid: user_all.tag_uid
                        });
                    });
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        }

        $scope.update = function () {
            usersService.update($scope.user)
                .done(function (message) {
                    $location.path('/administrator/users');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };
    }
]);

nfcRfidApp.controller('AdministratorUsersRemoveController', ['$scope',
    'UsersService', '$routeParams', '$location',
    function ($scope, usersService, $routeParams, $location) {
        var id = 0;

        $scope.notification = new Notification();

        $scope.remove = function () {
            usersService.remove(id)
                .done(function (response) {
                    $location.path('/administrator/users');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        id = $routeParams.id;
        usersService.getById(id)
            .done(function (user) {
                $scope.user = user;
                $scope.$apply();
            })
            .fail(function () {
                $location.$apply('/administrator/users');
                $scope.$apply();
            });
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

nfcRfidApp.controller('ModeratorUserScanRulesAddController', ['$scope',
    'DatabaseQueryService', '$location',
    function ($scope, databaseQueryService, $location) {
        $scope.minDateValidFrom = new Date();
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

        $scope.secondsTo0 = function (time) {
            secondsTo0(time);
        };

        $scope.secondsTo0($scope.userScanRule.timeStart);
        $scope.secondsTo0($scope.userScanRule.timeEnd);

        $scope.users = [];
        $scope.scanners = [];
        $scope.scannerCommands = [];

        $scope.notification = new Notification();

        $scope.add = function () {
            var query = 'CALL createUserScanRule(' +
                'user_id, ' +
                'scanner_id, ' +
                'response_scanner_command_id, ' +
                'week_day, ' +
                'time_start, ' +
                'time_end, ' +
                'valid_from, ' +
                'valid_to)';

            query = query.replace('user_id',
                $scope.userScanRule.userId);
            query = query.replace('scanner_id',
                $scope.userScanRule.scannerId);
            query = query.replace('response_scanner_command_id',
                $scope.userScanRule.responseScannerCommandId);
            query = query.replace('week_day',
                $scope.userScanRule.weekDay);
            query = query.replace('time_start',
                jsDateToOdbcTime($scope.userScanRule.timeStart));
            query = query.replace('time_end',
                jsDateToOdbcTime($scope.userScanRule.timeEnd));
            query = query.replace('valid_from',
                jsDateToOdbcDate($scope.userScanRule.validFrom));
            query = query.replace('valid_to',
                jsDateToOdbcDate($scope.userScanRule.validTo));

            databaseQueryService.procedure({query: query})
                .done(function (response) {
                    $location.path('/moderator/userScanRules');
                    $scope.$apply();
                    console.log(JSON.stringify(response));
                })
                .fail(function (response) {
                    console.log(JSON.stringify(response));
                });
        };

        var scannersGetQuery = databaseQueryService.get(
            'SELECT scanners.id AS id, ' +
            'scanners.uid AS uid, ' +
            'scanners.description AS description ' +
            'FROM scanners '
        );

        function getScannerCommandsForScannerId(id) {
            $scope.scannerCommands = [];

            var scannerCommandsGetQuery = databaseQueryService.get(
                'SELECT scanner_commands.id AS id, ' +
                'scanner_commands.command AS command ' +
                'FROM scanner_commands ' +
                'WHERE scanner=' + id
            );

            if (scannerCommandsGetQuery) {
                scannerCommandsGetQuery.done(function (scannerCommands) {
                    $scope.scannerCommands = scannerCommands;
                    $scope.userScanRule.responseScannerCommandId =
                        scannerCommands[0].id;
                    $scope.$apply();
                }).fail(function (error) {
                    console.log(JSON.stringify(error));
                });
            }
        }

        $scope.queryScannerCommandsForScannerId = function (id) {
            getScannerCommandsForScannerId(id);
        };

        if (scannersGetQuery) {
            scannersGetQuery.done(function (scanners) {
                $scope.scanners = scanners;
                $scope.userScanRule.scannerId = scanners[0].id;
                getScannerCommandsForScannerId(scanners[0].id);
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }

        var usersGetQuery = databaseQueryService.get(
            'SELECT users.id AS id, ' +
            'users.username AS username ' +
            'FROM users'
        );

        if (usersGetQuery) {
            usersGetQuery.done(function (users) {
                $scope.users = users;
                $scope.userScanRule.userId = users[0].id;
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }
    }
]);

nfcRfidApp.controller('ModeratorUserScanRulesController', ['$scope',
    'DatabaseQueryService', function ($scope, databaseQueryService) {

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
            'scanner_commands.id = user_scanner_rules.response_scanner_command'
        );

        if (userScanRulesGet) {
            userScanRulesGet.done(function (userScanRules) {
                $scope.userScanRules = userScanRules;
                $scope.$apply();
            }).fail(function (error) {
                console.log(JSON.stringify(error));
            });
        }
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
