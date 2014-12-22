/**
 * Development utilities
 */

var util = require('util');
var inspect = function (object) {
    return util.inspect(object, {showHidden: true, depth: null});
}; // TODO: Delete in production

/*******************************************************************************
 * Command line arguments
 ******************************************************************************/
var argv = require('minimist')(process.argv.slice(2));
var usage = 'Usage:\n' +
    '\n' +
    process.argv[0] + ' ' + process.argv[1] + ' ' + '[options]\n' +
    '\n' +
    'Options:\n' +
    '  --dbhost      <database_host>(*required)\n' +
    '  --dbport      <database_port>(*required)\n' +
    '  --dbuser      <database_user>(*required)\n' +
    '  --dbpassword  <database_password>(*required)\n' +
    '  --dbname      <database_name>(*required)\n' +
    '\n' +
    '  --help        To print this help\n';

if (argv.help) {
    console.log(usage);
    process.exit()
}

if (!argv.dbhost
    || !argv.dbuser
    || !argv.dbpassword
    || !argv.dbname
    || !argv.dbport) {
    console.log(usage);
    process.exit(1);
}

/*******************************************************************************
 * Imports
 ******************************************************************************/
var ROLE = require('./lib/Role.js');
var UsersService = require('./lib/UsersService.js');
var RolesService = require('./lib/RolesService.js');
var SecurityService = require('./lib/SecurityService.js');
var TagsService = require('./lib/TagsService.js');
var ScannersService = require('./lib/ScannersService.js');
var UserScanRulesService = require('./lib/UserScanRulesService.js');

/*******************************************************************************
 * Application
 ******************************************************************************/

var mysql = require('mysql');
var dbConnectionPool = mysql.createPool({
    connectionLimit: 10,
    host: argv.dbhost,
    port: argv.dbport,
    user: argv.dbuser,
    password: argv.dbpassword,
    database: argv.dbname
});

var securityService = new SecurityService(dbConnectionPool);
var scannersService = new ScannersService(dbConnectionPool);
var usersService = new UsersService(dbConnectionPool);
var rolesService = new RolesService(dbConnectionPool);
var tagsService = new TagsService(dbConnectionPool);
var userScanRulesService = new UserScanRulesService(dbConnectionPool);

var express = require('express');
var app = express();

var ROUTE = {
    login: '/login',
    logout: '/logout',
    scannersCreate: '/scanners/create',
    scanners: '/scanners',
    scannersId: '/scanners/:id',
    scannersUpdate: '/scanners/update',
    scannersRemoveId: '/scanners/remove/:id',
    usersCreate: '/users/create',
    users: '/users',
    usersId: '/users/:id',
    usersUpdate: '/users/update',
    usersRemoveId: '/users/remove/:id',
    roles:'/roles',
    tagsCreate: '/tags/create',
    tags: '/tags',
    tagsUnassigned: '/tags/unassigned',
    tagsId: '/tags/:id',
    tagsUpdate: '/tags/update',
    tagsRemoveId: '/tags/remove/:id',
    userScanRulesCreate: '/userScanRules/create'
};

/********************
 * Filters
 ********************/

// Automatic request JSON parsing
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing
                                                  // application/x-www-form-urlencoded

// Enable CORS
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Administrator required resources.
app.use([ROUTE.scannersCreate, ROUTE.scannersUpdate,
        ROUTE.usersCreate, ROUTE.usersUpdate],
    function (req, res, next) {
        var errorMessage = '';

        var token = req.query.token;
        if (!securityService.isRole(token, ROLE.administrator)) {
            res.status(401);
            errorMessage = 'Only administrators can add do this action.';
            res.json({message: errorMessage});
            res.send();
        } else {
            next();
        }
    });

// Login required resources.
app.use([ROUTE.scanners], function (req, res, next) {
    var errorMessage = '';

    var token = req.query.token;
    if (!securityService.isTokenValid(token)) {
        res.status(401);
        errorMessage = 'Trying to forge a request? Path: ' + req.originalUrl;
        res.json({message: errorMessage});
        res.send();
    } else {
        next();
    }
});

/********************
 * Authentication
 ********************/

/**
 * Request object: {username: String, password: String}
 */
app.post(ROUTE.login, function (req, res) {
    var credentials = req.body;

    var onLoggedIn = function (userSession) {
        res.json(userSession);
    };

    var onFail = function (errorMessage) {
        res.status(401);
        res.json({message: errorMessage});
    };

    securityService.login(credentials, onLoggedIn, onFail);
});

/**
 * Request object: {username:String, token:String}
 */
app.post(ROUTE.logout, function (req, res) {
    var userSession = req.body;

    var onFail = function (errorMessage) {
        res.status(401);
        res.json({message: errorMessage});
    };

    var onLoggedOut = function () {
        res.json({message: 'Successfully logged out.'});
    };

    securityService.logout(userSession, onLoggedOut, onFail);
});

/********************
 * Scanners
 ********************/

/**
 * Request object: {uid:String, description:String}
 */
app.post(ROUTE.scannersCreate, function (req, res) {
    var scanner = req.body;

    var onCreated = function () {
        var message = 'Successfully added: ' + scanner.uid;
        res.json({message: message});
    };

    scannersService.create(scanner, onCreated);
});

/**
 * Request object: none
 */
app.get(ROUTE.scanners, function (req, res) {
    var onScanners = function (scanners) {
        res.json(scanners);
    };

    scannersService.getAll(onScanners);
});

/**
 * Request object: {id:Number}
 */
app.get(ROUTE.scannersId, function (req, res) {
    var scannerId = req.params.id;

    var onScanner = function (scanner) {
        res.json(scanner);
    };

    scannersService.getById(scannerId, onScanner);
});

/**
 * Request object {id:Number, uid:String, description:String}
 */
app.post(ROUTE.scannersUpdate, function (req, res) {
    var scanner = req.body;

    var onScannerUpdated = function () {
        res.json({message: 'Scanner updated successfully.'});
    };

    scannersService.update(scanner, onScannerUpdated);
});

app.post(ROUTE.scannersRemoveId, function (req, res) {
    var id = req.params.id;

    var onScannerRemoved = function () {
        res.json({message: 'Scanner removed successfully.'});
    };

    scannersService.remove(id, onScannerRemoved);
});

/********************
 * Users
 ********************/

/**
 * Request object: {username:String, password:String, role:Number, nfc:Number}
 */
app.post(ROUTE.usersCreate, function (req, res) {
    var user = req.body;

    var onCreated = function () {
        var message = 'Successfully added: ' + user.uid;
        res.json({message: message});
    };

    usersService.create(user, onCreated);
});

/**
 * Request object: none
 */
app.get(ROUTE.users, function (req, res) {
    var onUsers = function (users) {
        res.json(users);
    };

    usersService.getAll(onUsers);
});

/**
 * Request object: {id:Number}
 */
app.get(ROUTE.usersId, function (req, res) {
    var userId = req.params.id;

    var onUser = function (user) {
        res.json(user);
    };

    usersService.getById(userId, onUser);
});

/**
 * Request object {id: Number,
 *                 username: String,
 *                 password: String,
 *                 role: Number,
 *                 tag: Number}
 */
app.post(ROUTE.usersUpdate, function (req, res) {
    var user = req.body;

    var onUserUpdated = function () {
        res.json({message: 'User updated successfully.'});
    };

    usersService.update(user, onUserUpdated);
});

app.post(ROUTE.usersRemoveId, function (req, res) {
    var id = req.params.id;

    var onUserRemoved = function () {
        res.json({message: 'User removed successfully.'});
    };

    usersService.remove(id, onUserRemoved);
});

/********************
 * Roles
 ********************/
app.get(ROUTE.roles, function (req, res) {
    var onRoles = function (roles) {
        res.json(roles);
    };

    rolesService.getAll(onRoles);
});

/********************
 * tags
 ********************/

/**
 * Request object: {tag:String, description:String}
 */
app.post(ROUTE.tagsCreate, function (req, res) {
    var tag = req.body;

    var onCreated = function () {
        var message = 'Successfully added: ' + tag.uid;
        res.json({message: message});
    };

    tagsService.create(tag, onCreated);
});

/**
 * Request object: none
 */
app.get(ROUTE.tags, function (req, res) {
    var onTags = function (tags) {
        res.json(tags);
    };

    tagsService.getAll(onTags);
});

/**
 * Request object: none
 */
app.get(ROUTE.tagsUnassigned, function (req, res) {
    var onTags = function (tags) {
        res.json(tags);
    };

    tagsService.getAllUnassigned(onTags);
});

/**
 * Request object: {id:Number}
 */
app.get(ROUTE.tagsId, function (req, res) {
    var tagId = req.params.id;

    var onTag = function (tag) {
        res.json(tag);
    };

    tagsService.getById(tagId, onTag);
});

/**
 * Request object {tag:String,
 *                 description:String}
 */
// app.post(ROUTE.tagsUpdate, function (req, res) {
//     var nfc = req.body;

//     var onTagUpdated = function () {
//         res.json({message: 'NFC updated successfully.'});
//     };

//     tagsService.update(nfc, onTagUpdated);
// });

app.post(ROUTE.tagsRemoveId, function (req, res) {
    var id = req.params.id;

    var onTagRemoved = function () {
        res.json({message: 'Tag removed successfully.'});
    };

    tagsService.remove(id, onTagRemoved);
});

/********************
 * tags
 ********************/

app.post(ROUTE.userScanRulesCreate, function (req, res) {
    var userScanRule = req.body;

    var onUserScanRuleCreated = function () {
        res.json({message: 'User scan rule successfully created.'});
    };

    userScanRulesService.create(userScanRule, onUserScanRuleCreated);
});

app.listen(3000);
