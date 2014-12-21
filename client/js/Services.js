var securityService = new SecurityService();
nfcRfidApp.factory('SecurityService', ['$location', function ($location) {
    var onNotLoggedIn = function () {
        $location.path('/login');
    };
    securityService.setOnNotLoggedIn(onNotLoggedIn);
    return securityService;
}]);

nfcRfidApp.factory('ScannersService', ['SecurityService', 
    function (securityService) {
        return new CrudService(securityService, {
            create: serverUrl + '/scanners/create',
            getAll: serverUrl + '/scanners',
            getById: serverUrl + '/scanners/:id',
            update: serverUrl + '/scanners/update',
            remove: serverUrl + '/scanners/remove/:id'
        });
}]);

nfcRfidApp.factory('UsersService', ['SecurityService', function (securityService) {
    return new CrudService(securityService, {
        create: serverUrl + '/users/create',
        getAll: serverUrl + '/users',
        getById: serverUrl + '/users/:id',
        update: serverUrl + '/users/update',
        remove: serverUrl + '/users/remove/:id'
    });
}]);

nfcRfidApp.factory('RolesService', ['SecurityService', function (securityService) {
    return new CrudService(securityService, {
        create: '',
        getAll: serverUrl + '/roles',
        getById: '',
        update: '',
        remove: ''
    });
}]);

nfcRfidApp.factory('TagsService', ['SecurityService', 
    function (securityService) {
        return new TagsService(securityService, {
            create: serverUrl + '/tags/create',
            getAll: serverUrl + '/tags',
            getAllUnassigned: serverUrl + '/tags/unassigned',
            getById: serverUrl + '/tags/:id',
            update: serverUrl + '/tags/update',
            remove: serverUrl + '/tags/remove/:id'
        });
}]);
