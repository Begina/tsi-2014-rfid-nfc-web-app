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
var SecurityService = require('./lib/SecurityService.js');
var RfidsService = require('./lib/RfidsService.js');
var UsersService = require('./lib/UsersService.js');
var RolesService = require('./lib/RolesService.js');
var NfcsService = require('./lib/NfcsService.js');

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
var rfidsService = new RfidsService(dbConnectionPool);
var usersService = new UsersService(dbConnectionPool);
var rolesService = new RolesService(dbConnectionPool);
var nfcsService = new NfcsService(dbConnectionPool);

var express = require('express');
var app = express();

var ROUTE = {
    login: '/login',
    logout: '/logout',
    rfidsCreate: '/rfids/create',
    rfids: '/rfids',
    rfidsId: '/rfids/:id',
    rfidsUpdate: '/rfids/update',
    rfidsRemoveId: '/rfids/remove/:id',
    usersCreate: '/users/create',
    users: '/users',
    usersId: '/users/:id',
    usersUpdate: '/users/update',
    usersRemoveId: '/users/remove/:id',
    roles:'/roles',
    nfcsCreate: '/nfcs/create',
    nfcs: '/nfcs',
    nfcsId: '/nfcs/:id',
    nfcsUpdate: '/nfcs/update',
    nfcsRemoveId: '/nfcs/remove/:id'
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
app.use([ROUTE.rfidsCreate, ROUTE.rfidsUpdate,
        ROUTE.usersCreate, ROUTE.usersUpdate],
    function (req, res, next) {
        var errorMessage = '';

        var token = req.query.token;
        if (!securityService.isRole(token, ROLE.administrator)) {
            res.status(401);
            errorMessage = 'Only administrators can add new RFIDs.';
            res.json({message: errorMessage});
            res.send();
        } else {
            next();
        }
    });

// Login required resources.
app.use([ROUTE.rfids], function (req, res, next) {
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
 * RFID readers
 ********************/

/**
 * Request object: {uid:String, description:String}
 */
app.post(ROUTE.rfidsCreate, function (req, res) {
    var rfid = req.body;

    var onCreated = function () {
        var message = 'Successfully added: ' + rfid.uid;
        res.json({message: message});
    };

    rfidsService.create(rfid, onCreated);
});

/**
 * Request object: none
 */
app.get(ROUTE.rfids, function (req, res) {
    var onRfids = function (rfids) {
        res.json(rfids);
    };

    rfidsService.getAll(onRfids);
});

/**
 * Request object: {id:Number}
 */
app.get(ROUTE.rfidsId, function (req, res) {
    var rfidId = req.params.id;

    var onRfid = function (rfid) {
        res.json(rfid);
    };

    rfidsService.getById(rfidId, onRfid);
});

/**
 * Request object {id:Number, uid:String, description:String}
 */
app.post(ROUTE.rfidsUpdate, function (req, res) {
    var rfid = req.body;

    var onRfidUpdated = function () {
        res.json({message: 'RFID updated successfully.'});
    };

    rfidsService.update(rfid, onRfidUpdated);
});

app.post(ROUTE.rfidsRemoveId, function (req, res) {
    var id = req.params.id;

    var onRfidRemoved = function () {
        res.json({message: 'RFID removed successfully.'});
    };

    rfidsService.remove(id, onRfidRemoved);
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
 * Request object {id:Number,
 *                 username:String,
 *                 password:String,
 *                 role:Number,
 *                 nfc:Number}
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
 * NFCs
 ********************/

/**
 * Request object: {tag:String, description:String}
 */
app.post(ROUTE.nfcsCreate, function (req, res) {
    var nfc = req.body;

    var onCreated = function () {
        var message = 'Successfully added: ' + nfc.uid;
        res.json({message: message});
    };

    nfcsService.create(nfc, onCreated);
});

/**
 * Request object: none
 */
app.get(ROUTE.nfcs, function (req, res) {
    var onNfcs = function (nfcs) {
        res.json(nfcs);
    };

    nfcsService.getAll(onNfcs);
});

/**
 * Request object: {id:Number}
 */
app.get(ROUTE.nfcsId, function (req, res) {
    var nfcId = req.params.id;

    var onNfc = function (nfc) {
        res.json(nfc);
    };

    nfcsService.getById(nfcId, onNfc);
});

/**
 * Request object {tag:String,
 *                 description:String}
 */
app.post(ROUTE.nfcsUpdate, function (req, res) {
    var nfc = req.body;

    var onNfcUpdated = function () {
        res.json({message: 'NFC updated successfully.'});
    };

    nfcsService.update(nfc, onNfcUpdated);
});

app.post(ROUTE.nfcsRemoveId, function (req, res) {
    var id = req.params.id;

    var onNfcRemoved = function () {
        res.json({message: 'NFC removed successfully.'});
    };

    nfcsService.remove(id, onNfcRemoved);
});

app.listen(3000);