/*******************************************************************************
 * Authentication controllers
 ******************************************************************************/

nfcApp.controller('LoginController', ['$scope', 'SecurityService',
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
 * Administrator RFIDs controllers
 ******************************************************************************/

nfcApp.controller('AdministratorRfidsAddController', ['$scope', 'RfidsService',
    function ($scope, rfidsService) {
        $scope.user = {
            id: 0,
            uid: '',
            description: ''
        };

        $scope.notification = new Notification();

        $scope.add = function () {
            rfidsService.add($scope.user)
                .done(function (response) {
                    $scope.notification.message = response.message;
                    $scope.user = {
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

nfcApp.controller('AdministratorRfidsController', ['$scope', 'RfidsService',
    function ($scope, rfidsService) {
        $scope.rfids = [];

        var getAllRfidsPromise = rfidsService.getAll();
        if (getAllRfidsPromise) {
            getAllRfidsPromise
                .done(function (rfids) {
                    $scope.rfids = rfids;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load RFIDs.');
                });
        }
    }
]);

nfcApp.controller('AdministratorRfidsEditController', ['$scope', 'RfidsService',
    '$routeParams', '$location', function ($scope, rfidsService, $routeParams,
                                           $location) {
        $scope.rfid = {};

        $scope.notification = new Notification();

        $scope.update = function () {
            rfidsService.update($scope.rfid)
                .done(function (message) {
                    $location.path('/administrator/rfids');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        var rfidId = $routeParams.id;
        var getRfidsByIdPromise = rfidsService.getById(rfidId);
        if (getRfidsByIdPromise) {
            getRfidsByIdPromise
                .done(function (rfid) {
                    $scope.rfid = rfid;
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

nfcApp.controller('AdministratorRfidsRemoveController', ['$scope',
    'RfidsService', '$routeParams', '$location', function ($scope, rfidsService,
                                                           $routeParams,
                                                           $location) {
        var id = 0;

        $scope.rfid = {};

        $scope.notification = new Notification();

        $scope.remove = function () {
            rfidsService.remove(id)
                .done(function (response) {
                    $location.path('/administrator/rfids');
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        };

        id = $routeParams.id;
        var getRfidsByIdPromise = rfidsService.getById(id);
        if (getRfidsByIdPromise) {
            getRfidsByIdPromise
                .done(function (rfid) {
                    $scope.rfid = rfid;
                    $scope.$apply();
                })
                .fail(function () {
                    $location.$apply('/administrator/rfids');
                    $scope.$apply();
                });
        }
    }
]);

/*******************************************************************************
 * Administrator users controllers
 ******************************************************************************/

nfcApp.controller('AdministratorUsersAddController', ['$scope', 'UsersService',
    'NfcsService', 'RolesService', function ($scope, usersService, nfcsService,
                                             rolesService) {
        $scope.user = {
            id: 0,
            username: '',
            password: '',
            role: 0
        };

        $scope.roles = [];
        $scope.nfcs = [];

        $scope.notification = new Notification();

        $scope.add = function () {
            usersService.add($scope.user)
                .done(function (response) {
                    $scope.notification.message = response.message;
                    $scope.user = {
                        id: 0,
                        username: '',
                        password: '',
                        role: 0
                    };
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
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load roles.');
                });
        }

        var getAllNfcsPromise = nfcsService.getAll();

        if (getAllNfcsPromise) {
            getAllNfcsPromise
                .done(function (nfcs) {
                    $scope.nfcs = nfcs;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load tags.');
                });
        }
    }
]);

nfcApp.controller('AdministratorUsersController', ['$scope', 'UsersService',
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


nfcApp.controller('AdministratorUsersEditController', ['$scope', 'UsersService',
    'RolesService', 'NfcsService', '$routeParams', '$location',
    function ($scope, usersService, rolesService, nfcsService, $routeParams,
              $location) {
        $scope.user = {};

        $scope.roles = [];
        $scope.nfcs = [];

        $scope.notification = new Notification();

        // The getAllRolesPromise and getAllNfcPromise  is null when parsed for
        // the first time.

        var userId = $routeParams.id;
        var getUserByIdPromise = usersService.getById(userId);
        if (getUserByIdPromise) {
            getUserByIdPromise
                .done(function (user) {
                    $scope.user = user;
                    $scope.user.username = user.user_username;
                    $scope.user.password = user.user_password;
                    $scope.$apply();
                })
                .fail(function (response) {
                    var error = response.responseJSON;
                    $scope.notification.message = error.message;
                    $scope.$apply();
                });
        }

        var getAllRolesPromise = rolesService.getAll();

        if (getAllRolesPromise) {
            getAllRolesPromise
                .done(function (roles) {
                    $scope.roles = roles;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load roles.');
                });
        }

        var getAllNfcsPromise = nfcsService.getAll();

        if (getAllNfcsPromise) {
            getAllNfcsPromise
                .done(function (nfcs) {
                    $scope.nfcs = nfcs;
                    $scope.$apply();
                })
                .fail(function (response) {
                    console.log('Failed to load tags.');
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

nfcApp.controller('AdministratorUsersRemoveController', ['$scope',
    'UsersService', '$routeParams', '$location', function ($scope, usersService,
                                                           $routeParams,
                                                           $location) {
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

