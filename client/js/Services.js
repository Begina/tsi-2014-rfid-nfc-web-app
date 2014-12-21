var securityService = new SecurityService();
nfcApp.factory('SecurityService', ['$location', function ($location) {
    var onNotLoggedIn = function () {
        $location.path('/login');
    };
    securityService.setOnNotLoggedIn(onNotLoggedIn);
    return securityService;
}]);

nfcApp.factory('RfidsService', ['SecurityService', function (securityService) {
    //return new RfidsService(securityService);
    return new CrudService(securityService, {
        create: serverUrl + '/rfids/create',
        getAll: serverUrl + '/rfids',
        getById: serverUrl + '/rfids/:id',
        update: serverUrl + '/rfids/update',
        remove: serverUrl + '/rfids/remove/:id'
    });
}]);

nfcApp.factory('UsersService', ['SecurityService', function (securityService) {
    return new CrudService(securityService, {
        create: serverUrl + '/users/create',
        getAll: serverUrl + '/users',
        getById: serverUrl + '/users/:id',
        update: serverUrl + '/users/update',
        remove: serverUrl + '/users/remove/:id'
    });
}]);

nfcApp.factory('RolesService', ['SecurityService', function (securityService) {
    return new CrudService(securityService, {
        create: '',
        getAll: serverUrl + '/roles',
        getById: '',
        update: '',
        remove: ''
    });
}]);

nfcApp.factory('NfcsService', ['SecurityService', function (securityService) {
    return new CrudService(securityService, {
        create: serverUrl + '/nfcs/create',
        getAll: serverUrl + '/nfcs',
        getById: serverUrl + '/nfcs/:id',
        update: serverUrl + '/nfcs/update',
        remove: serverUrl + '/nfcs/remove/:id'
    });
}]);
