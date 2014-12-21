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
                        $location.path('/basic/dashboard');
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
    'ScannersService', '$routeParams', '$location', 
    function ($scope, scannersService, $routeParams, $location) {
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

        var scannerId = $routeParams.id;
        var getScannersByIdPromise = scannersService.getById(scannerId);
        if (getScannersByIdPromise) {
            getScannersByIdPromise
                .done(function (scanner) {
                    $scope.scanner = scanner;
                    $scope.$apply();
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
                        for (var i=0; i<$scope.roles.length; i++) {
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
