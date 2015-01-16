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

        var onLoggedIn = function (role) {
            redirectToDashboard(role);
        };

        securityService.isLoggedIn(onLoggedIn);

        //if (role) {
        //    redirectToDashboard(role);
        //}

        $scope.credentials = {
            username: '',
            password: ''
        };

        $scope.notification = new Notification();

        $scope.login = function () {

            securityService.login($scope.credentials).done(function (role) {

                redirectToDashboard(role);

            }).fail(function (response) {

                console.log(JSON.stringify(response));

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        };

    }
]);

nfcRfidApp.controller('LogoutController', ['$scope', 'SecurityService',
    '$location', '$route',
    function ($scope, securityService, $location, $route) {

        function redirectToLogin() {

            $location.path('/login');

            $route.reload();

        }

        if (!securityService.isLoggedIn()) {
            redirectToLogin();
        }

        this.logout = function () {

            securityService.logout();

            redirectToLogin();

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
 * Administrator tags controllers
 ******************************************************************************/

var tagsResource = '/tags';
var tagsResourceById = tagsResource + '/:id';

nfcRfidApp.controller('AdministratorTagsController', ['$scope',
    'SecurityService',
    function ($scope, securityService) {

        $scope.tags = {};
        // Structure: {
        //   id: Number,
        //   uid: String,
        //   username: String
        // }

        var resource = tagsResource + '?expand=user';

        securityService.request(resource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (tags) {

            $scope.tags = tags;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load tags.');

        });

    }
]);

nfcRfidApp.controller('AdministratorTagsEditController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        var tagId = $routeParams.id;

        var resource = tagsResourceById.replace(':id', tagId);

        $scope.userId = 0;

        $scope.users = [];

        $scope.tag = {};
        // Structure: {
        //   id: Number,
        //   uid: String,
        //   user: Number
        // }

        $scope.notification = new Notification();

        securityService.request(usersResource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (users) {

            $scope.users = users;

            $scope.userId = users[0].id;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load users.');

        });

        securityService.request(resource, {
            type: 'GET'
        }).done(function (tag) {

            $scope.tag = tag;

            $scope.$apply();

        }).fail(function (response) {

            console.log('Failed to load tag.');

        });

        $scope.assign = function () {

            securityService.request(resource, {
                type: 'PATCH',
                data: JSON.stringify({userId: $scope.userId}),
                contentType: 'application/json; charset=utf-8'
            }).done(function () {

                $location.path('/administrator/tags');

                $route.reload();

            }).fail(function (response) {

                $scope.notification.message = response.responseText;

                $scope.$apply();

            });

        }

    }
]);

/*******************************************************************************
 * Moderator user scan rules controllers
 ******************************************************************************/

function jsDateToHHMMSS(date) {
    date = new Date(date);
    return date.toTimeString().slice(0, 8);
}

function jsDateToOdbcTime(date) {
    return "{ t '" + jsDateToHHMMSS(date) + "' }";
}

/**
 * Formats the date like YYYY delimiter MM delimiter DD
 * @param date
 * @param delimiter
 */
function jsDateYYYYMMDDFormat(date, delimiter) {
    date = new Date(date);
    var dayOfMonth = date.getDate();
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
    return "{ d '" + jsDateYYYYMMDDFormat(date, delimiter) + "' }";
}

function secondsTo0(time) {
    time.setSeconds(0);
}

var userScanRulesResource = '/userScanRules';
var userScanRulesResourceById = userScanRulesResource + '/:id';

function dayOfWeekToInt(dayOfWeek) {
    return {
        Sunday: 1,
        Monday: 2,
        Tuesday: 3,
        Wednesday: 4,
        Thursday: 5,
        Friday: 6,
        Saturday: 7
    }[dayOfWeek];
}

function userScanRuleCreate($scope, securityService, $location, $route,
                            resource, redirect) {

    $scope.minStartDate = new Date();

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

        $scope.userScanRule.startTime = jsDateToHHMMSS(
            $scope.userScanRule.startTime);
        $scope.userScanRule.endTime = jsDateToHHMMSS(
            $scope.userScanRule.endTime);

        $scope.userScanRule.startDate = jsDateYYYYMMDDFormat(
            $scope.userScanRule.startDate, '-');
        $scope.userScanRule.endDate = jsDateYYYYMMDDFormat(
            $scope.userScanRule.endDate, '-');

        for (var i = 0; i < $scope.userScanRule.daysOfWeek.length; i++) {
            $scope.userScanRule.daysOfWeek[i] = dayOfWeekToInt(
                $scope.userScanRule.daysOfWeek[i]);
        }

        securityService.request(resource, {
            type: 'POST',
            data: JSON.stringify($scope.userScanRule),
            contentType: 'application/json; charset=utf-8'
        }).done(function () {

            $location.path(redirect);

            $route.reload();

        }).fail(function (response) {

            $scope.notification.message = response.responseText;

            $scope.$apply();

        });

    };

}

function userScanRuleCreateController($scope, securityService, resource,
                                      $location, $route, redirect) {

    userScanRuleCreate($scope, securityService, $location, $route,
        resource, redirect);

    getScanners(securityService, $scope, function (scanners) {
        $scope.userScanRule.scannerId = scanners[0].id;
    });

    getUsers(securityService, $scope, function (users) {
        $scope.userScanRule.userId = users[0].id;
    });

}

nfcRfidApp.controller('ModeratorUserScanRulesAddController', ['$scope',
    'SecurityService', '$location', '$route',
    function ($scope, securityService, $location, $route) {

        var redirect = '/moderator/userScanRules';

        userScanRuleCreateController($scope, securityService,
            userScanRulesResource, $location, $route, redirect);

    }
]);

/**
 * number is specified as an integer in range [1 .. 7].
 * 1 - Sunday,
 * 2 - Monday,
 * 3 - Tuesday
 * ...
 * 7 - Saturday
 */
function intToDayOfWeek(number) {

    return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
        'Friday', 'Saturday'][number - 1];

}

function intsToDaysOfWeek(numbers) {

    var i, daysOfWeek = '';

    for (i = 0; i < numbers.length; i++) {
        daysOfWeek += intToDayOfWeek(numbers[i]) + ', ';
    }

    return daysOfWeek.slice(0, daysOfWeek.length - 2);

}

function requestUserScanRules($scope, resource, securityService) {

    $scope.intsToDaysOfWeek = function (numbers) {
        return intsToDaysOfWeek(numbers);
    };

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

    resource = resource + '?expand=user,scanner';

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

nfcRfidApp.controller('ModeratorUserScanRulesController', ['$scope',
    'SecurityService', function ($scope, securityService) {

        requestUserScanRules($scope, userScanRulesResource, securityService)

    }
]);

nfcRfidApp.controller('ModeratorUserScanRulesRemoveController', ['$scope',
    'SecurityService', '$routeParams', '$location', '$route',
    function ($scope, securityService, $routeParams, $location, $route) {

        $scope.intsToDaysOfWeek = function (numbers) {
            return intsToDaysOfWeek(numbers);
        };

        var userScanRuleId = $routeParams.id;

        $scope.userScanRule = {};
        // Structure {
        //   userId: Number,
        //   scannerId: Number,
        //   startTime: String (Format 'HH:MM:SS'),
        //   endTime: String (Format 'HH:MM:SS'),
        //   startDate: String (Format 'YYYY-MM-DD'),
        //   endDate: String (Format 'YYYY-MM-DD'),
        //   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
        // }

        var resource = userScanRulesResourceById.replace(':id', userScanRuleId);

        securityService.request(resource + '?expand=user,scanner', {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (userScanRule) {

            $scope.userScanRule = userScanRule;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load user scan rules.');

        });

        $scope.remove = function () {

            securityService.request(resource, {
                type: 'DELETE'
            }).done(function () {

                $location.path('/moderator/userScanRules');

                $route.reload();

            }).fail(function (response) {

                console.log(JSON.stringify(response));

            });

        };
    }
]);

/*******************************************************************************
 * Moderator user scan rule requests controllers
 ******************************************************************************/

var userScanRuleRequestsResource = '/userScanRuleRequests';
var userScanRuleRequestsResourceById = userScanRuleRequestsResource + '/:id';

nfcRfidApp.controller('ModeratorAccessRequestsController', ['$scope',
    'SecurityService', '$route',
    function ($scope, securityService, $route) {

        requestUserScanRules($scope, userScanRuleRequestsResource,
            securityService);

        var resource = userScanRuleRequestsResourceById + '?method=approve';

        $scope.approve = function (userScanRuleId) {

            securityService.request(resource.replace(':id', userScanRuleId), {
                type: 'PATCH'
            }).done(function () {

                $route.reload();

            }).fail(function (response) {

                console.log(JSON.stringify(response));

            });

        };

        $scope.disapprove = function (userScanRuleId) {

            securityService.request(resource.replace(':id', userScanRuleId), {
                type: 'DELETE'
            }).done(function () {

                $route.reload();

            }).fail(function (response) {

                console.log(JSON.stringify(response));

            });

        };

    }
]);

/*******************************************************************************
 * Moderator reports controllers
 ******************************************************************************/

var userScanTimesResource = '/userScanTimes';

nfcRfidApp.controller('ModeratorReportsEntranceTimesController', ['$scope',
    'SecurityService', function ($scope, securityService) {

        $scope.userScanTimes = [];

        securityService.request(userScanTimesResource, {
            type: 'GET',
            dataType: 'JSON'
        }).done(function (userScanTimes) {

            $scope.userScanTimes = userScanTimes;

            $scope.$apply();

        }).fail(function () {

            console.log('Failed to load user scan times.');

        });

    }
]);

/*******************************************************************************
 * User requests controllers
 ******************************************************************************/

nfcRfidApp.controller('UserRequestsAddController', ['$scope',
    'SecurityService', '$location', '$route',
    function ($scope, securityService, $location, $route) {

        var redirect = '/user/requests';

        userScanRuleCreateController($scope, securityService,
            userScanRuleRequestsResource, $location, $route, redirect);

    }
]);

nfcRfidApp.controller('UserRequestsController', ['$scope',
    'DatabaseQueryService', 'SecurityService',
    function ($scope, databaseQueryService, securityService) {

        requestUserScanRules($scope, userScanRuleRequestsResource,
            securityService)

    }
]);

nfcRfidApp.controller('UserAccessRightsController', ['$scope',
    'SecurityService',
    function ($scope, securityService) {

        var resource = userScanRulesResource + '?expand=user,scanner';

        requestUserScanRules($scope, resource, securityService);

    }
]);
