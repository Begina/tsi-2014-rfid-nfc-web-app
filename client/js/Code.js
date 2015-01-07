var Validator = function () {
    var me = this;

    var allValid = function (validations_list) {
        for (var i = 0; i < validations_list.length; i++) {
            if (!validations_list[i]()) {
                return false;
            }
        }

        return true;
    };

    this.lengthAtLeast = function (string, length) {
        return string.length >= length;
    };

    this.lettersAndDigitsOnly = function (string) {
        return string.match(/^[0-9a-zA-Z]+$/g) ? true : false;
    };

    this.digitsOnly = function (string) {
        return String(string).match(/[0-9]+/g) ? true : false;
    };

    this.isUsernameValid = function (string) {
        return me.lengthAtLeast(string, 5) &&
            me.lettersAndDigitsOnly(string);
    };

    this.isPasswordValid = function (string) {
        return me.lengthAtLeast(string, 6) &&
            me.lettersAndDigitsOnly(string);
    };

    this.isUidValid = function (string) {
        return me.lengthAtLeast(string, 1) &&
            me.lettersAndDigitsOnly(string);
    };

    this.isDescriptionValid = function (string) {
        return me.lengthAtLeast(string, 5);
    };

    this.isRfidValid = function (rfid) {
        var isValid = [
            me.isUidValid,
            me.isDescriptionValid
        ];

        return allValid(isValid);
    };

    this.isUserValid = function (user) {
        var isValid = [
            me.isUsernameValid,
            me.isPasswordValid
        ];

        return allValid(isValid);
    };
};

/*******************************************************************************
 *
 ******************************************************************************/

// Model definitions

var UserSession = function () {
    this.id = 0;
    this.username = '';
    this.token = '';
    this.role = 0;
};

var Credentials = function () {
    this.id = 0;
    this.username = '';
    this.password = '';
};

var Scanner = function () {
    this.id = 0;
    this.uid = '';
    this.description = '';
};

// Models in use
var Notification = function () {
    var me = this;

    this.message = '';
    this.hasOccurred = function () {
        return me.message.length > 0;
    }
};

// TODO: Parametrize.
var serverUrl = '';

var ROLE = {
    administrator: 1,
    moderator: 2,
    basic: 3
};

var Urls = function (create, getAll, getById, update, remove) {
    this.create =create;
    this.getAll = getAll;
    this.getById = getById;
    this.update = update;
    this.remove = remove;
};

var SecurityService = function (onNotLoggedIn) {
    var userSession = null;

    this.setOnNotLoggedIn = function (onNotLoggedInNew) {
        onNotLoggedIn = onNotLoggedInNew;
    };

    this.login = function (credentials) {
        return $.ajax(serverUrl + "/login", {
            type: 'POST',
            data: credentials,
            dataType: 'JSON',
            crossDomain: true,
            success: function (response) {
                userSession = response;
            }
        });
    };

    this.logout = function () {
        return $.ajax(serverUrl + "/logout", {
            type: 'POST',
            data: userSession,
            dataType: 'JSON',
            crossDomain: true,
            success: function (response) {
                userSession = null;
            }
        });
    };

    /**
     * Makes an authenticated asynchronous REST request.
     * @param url
     * @param ajaxOptions
     * @returns {Object} jQuery Ajax Promise
     */
    this.request = function (url, ajaxOptions) {
        if (userSession === null) {
            if (onNotLoggedIn) onNotLoggedIn();
            return null;
        }

        if (url.indexOf('?') < 0) {
            url += '?'
        }
        url += 'token=' + userSession.token;

        return $.ajax(url, ajaxOptions);
    };
};

var ScannersService = function (securityService) {
    this.add = function (scanner) {
        return securityService.request(serverUrl + '/scanners/create', {
            type: 'POST',
            data: scanner,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getAll = function () {
        return securityService.request(serverUrl + '/scanners', {
            type: 'GET',
            dataType: 'JSON',
            cache: false,
            crossDomain: true
        });
    };

    this.getById = function (id) {
        return securityService.request(serverUrl + '/scanners/' + id, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.update = function (scanner) {
        return securityService.request(serverUrl + '/scanners/update', {
            type: 'POST',
            data: scanner,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.remove = function (id) {
        return securityService.request(serverUrl + '/scanners/remove/' + id, {
            type: 'POST',
            dataType: 'JSON',
            crossDomain: true
        });
    };
};

var UsersService = function (securityService) {
    this.add = function (user) {
        return securityService.request(serverUrl + '/users/create', {
            type: 'POST',
            data: user,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getAll = function () {
        return securityService.request(serverUrl + '/users', {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getById = function (id) {
        return securityService.request(serverUrl + '/users/' + id, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.update = function (user) {
        console.log(JSON.stringify(user));
        return securityService.request(serverUrl + '/users/update', {
            type: 'POST',
            data: user,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.remove = function (id) {
        return securityService.request(serverUrl + '/users/remove/' + id, {
            type: 'POST',
            dataType: 'JSON',
            crossDomain: true
        });
    };
};

/**
 *
 * @param securityService
 * @param urls - {
 *                create:String,
 *                getAll:String,
 *                getById:String, Must be http://something.com/something/.../:id
 *                update:String,
 *                remove:String Must be http://something.com/something/.../:id
 *               }
 * @constructor
 */
var CrudService = function (securityService, urls) {
    this.add = function (model) {
        return securityService.request(urls.create, {
            type: 'POST',
            data: model,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getAll = function () {
        return securityService.request(urls.getAll, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getById = function (id) {
        var requestUrl = urls.getById.replace(':id', id);
        return securityService.request(requestUrl, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.update = function (model) {
        return securityService.request(urls.update, {
            type: 'POST',
            data: model,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.remove = function (id) {
        var requestUrl = urls.remove.replace(':id', id);
        return securityService.request(requestUrl, {
            type: 'POST',
            dataType: 'JSON',
            crossDomain: true
        });
    };
};

/**
 *
 * @param securityService
 * @param urls - {
 *                create: String,
 *                getAll: String,
 *                getAllUnassigned: String
 *                getById: String, Must be http://bla.com/bla/.../:id
 *                update: String,
 *                remove: String Must be http://bla.com/bla/.../:id
 *               }
 * @constructor
 */
var TagsService = function (securityService, urls) {
    this.add = function (model) {
        return securityService.request(urls.create, {
            type: 'POST',
            data: model,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getAll = function () {
        return securityService.request(urls.getAll, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getAllUnassigned = function () {
        return securityService.request(urls.getAllUnassigned, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.getById = function (id) {
        var requestUrl = urls.getById.replace(':id', id);
        return securityService.request(requestUrl, {
            type: 'GET',
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.update = function (model) {
        return securityService.request(urls.update, {
            type: 'POST',
            data: model,
            dataType: 'JSON',
            crossDomain: true
        });
    };

    this.remove = function (id) {
        var requestUrl = urls.remove.replace(':id', id);
        return securityService.request(requestUrl, {
            type: 'POST',
            dataType: 'JSON',
            crossDomain: true
        });
    };
};
