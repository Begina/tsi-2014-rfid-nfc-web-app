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

var CookieManager = {
    /**
     * Cookie format: JSON.
     * Overwrites key if it is already saved.
     */
    save: function (key, value) {

        if (!document.cookie || document.cookie.trim().length === 0) {
            document.cookie = JSON.stringify({});
        }

        var cookie = JSON.parse(document.cookie);

        cookie[key] = value;

        document.cookie = JSON.stringify(cookie);

    },

    /**
     * Returns cookie value if key exists.
     * If key doesn't exist, returns a falsy object.
     */
    load: function (key) {

        if (!document.cookie || document.cookie.trim().length === 0) {
            return null;
        }

        var cookie = JSON.parse(document.cookie);

        return cookie[key];

    },

    /**
     * Deletes a key, value pair from the cookie if it exists.
     */
    remove: function (key) {

        if (!document.cookie || document.cookie.trim().length === 0) {
            return;
        }

        var cookie = JSON.parse(document.cookie);

        delete cookie[key];

        document.cookie = JSON.stringify(cookie);

    },

    exists: function (key) {

        if (!document.cookie || document.cookie.trim().length === 0) {
            return false;
        }

        var cookie = JSON.parse(document.cookie);

        return cookie.hasOwnProperty(key);
    }

};

var SecurityService = function (onNotLoggedIn) {

    var me = this;

    var websiteAccessResource = '/accesses';

    var isLoggedIn = false;

    this.setOnNotLoggedIn = function (onNotLoggedInNew) {
        onNotLoggedIn = onNotLoggedInNew;
    };

    var buildAuthorizationHeader = function(username, password) {

        var base64UsernamePassword = username + ":" + password;

        base64UsernamePassword = btoa(base64UsernamePassword);

        return "Basic " + base64UsernamePassword;

    };

    /**
     * credentials {
     *   username: String,
     *   password: String
     * }
     */
    this.login = function (credentials) {

        var authorization = buildAuthorizationHeader(credentials.username,
            credentials.password);

        return $.ajax(websiteAccessResource, {
            type: 'POST',
            data: credentials,
            dataType: 'JSON',
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", authorization);
            }
        }).done(function (role) {

            if (role) {
                var user = {
                    role: role,
                    username: credentials.username,
                    password: credentials.password
                };

                CookieManager.save('user', user);
            }

        });

    };

    this.logout = function () {

        CookieManager.remove('user');

    };

    this.isLoggedIn = function () {

        var user = CookieManager.load('user')

        if (user) {
            return true;
        }

        return false;

    };

    /**
     * Returns null if the user is not logged in.
     */
    this.getRole = function () {

        if (!me.isLoggedIn()) {
            return null;
        }

        return CookieManager.load('user').role;

    };

    /**
     * Appends a basic auth header to the jQuery Ajax options object.
     * If not logged in return null. Returns jQuery Ajax promise otherwise.
     */
    this.request = function (url, ajaxOptions) {

        if (!me.isLoggedIn()) {
            if (onNotLoggedIn) onNotLoggedIn();
            return null;
        }

        var user = CookieManager.load('user');

        var authorization = buildAuthorizationHeader(user.username,
            user.password);

        if (!ajaxOptions.hasOwnProperty('beforeSend')) {
            ajaxOptions.beforeSend = function (xhr) {
                xhr.setRequestHeader ("Authorization", authorization);
            };
        }

        return $.ajax(url, ajaxOptions);

    };

};

var ScannersService = function (securityService) {
    this.add = function (scanner) {
        return securityService.request('/scanners/create', {
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

var DatabaseQueryService = function (securityService) {
    var modelsGetUrl = '/models';
    var modelsCreateUrl = '/models/create';

    /**
     * @param query Select query string.
     * @returns {Object|*}
     */
    this.get = function (query) {
        return securityService.request(modelsGetUrl + '?query=' + query, {
            type: 'GET',
            dataType: 'JSON'
        });
    };

    /**
     * @param query JSON({"query": String})
     * @returns jQuery AJAX promise.
     */
    this.procedure = function (query) {
        return securityService.request(modelsCreateUrl, {
            type: 'POST',
            data: query,
            dataType: 'JSON'
        });
    };
};
