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
    '  --dbhost         <database_host>(*required)\n' +
    '  --dbport         <database_port>(*required)\n' +
    '  --dbuser         <database_user>(*required)\n' +
    '  --dbpassword     <database_password>(*required)\n' +
    '  --dbname         <database_name>(*required)\n' +
    '  --webServerPort  <web_server_port>(*required)\n' +
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
    || !argv.dbport
    || !argv.webServerPort) {
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
var ScannerCommandsService = require('./lib/ScannerCommandsService.js');
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

// Avoid app termination on invalid SQL.
dbConnectionPool.on('connection', function (connection) {
    connection.on('error', function (error) {
        console.log(error);
    });
});

var securityService = new SecurityService(dbConnectionPool);
var scannersService = new ScannersService(dbConnectionPool);
var scannerCommandsService = new ScannerCommandsService(dbConnectionPool);
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
    roles: '/roles',
    tagsCreate: '/tags/create',
    tags: '/tags',
    tagsUnassigned: '/tags/unassigned',
    tagsId: '/tags/:id',
    tagsUpdate: '/tags/update',
    tagsRemoveId: '/tags/remove/:id',
    userScanRulesCreate: '/userScanRules/create',
    scannerCommands: '/scannerCommands/:id',
    models: '/models',
    modelsCreate: '/models/create',
    modelProcedures: '/modes/procedures',
    accessRequests: '/accessRequests',
    accessRequestsId: '/accessRequests/:id',
    accessRequestsCreate: '/accessRequests/create',
    approveAccessRequest: '/approveAccessRequest',
    accessRights: '/accessRights'
};

/*******************************************************************************
 * Filters
 ******************************************************************************/

// Automatic request JSON parsing
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing
                                                  // application/x-www-form-urlencoded

// Enable CORS
//app.use(function (req, res, next) {
//    res.header("Access-Control-Allow-Origin", "*");
//    res.header("Access-Control-Allow-Headers",
//        "Origin, X-Requested-With, Content-Type, Accept");
//    next();
//});

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

/*******************************************************************************
 * Authentication
 ******************************************************************************/

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

/*******************************************************************************
 * Scanners
 ******************************************************************************/

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

/*******************************************************************************
 * Scanner commands
 ******************************************************************************/
app.get(ROUTE.scannerCommands, function (req, res) {
    var scannerId = req.params.id;

    var onScannerCommands = function (commands) {
        res.json(commands);
    };

    scannerCommandsService.getById(scannerId, onScannerCommands);
});

/*******************************************************************************
 * Users
 ******************************************************************************/

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

/*******************************************************************************
 * Roles
 ******************************************************************************/
app.get(ROUTE.roles, function (req, res) {
    var onRoles = function (roles) {
        res.json(roles);
    };

    rolesService.getAll(onRoles);
});

/*******************************************************************************
 * tags
 ******************************************************************************/

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

/*******************************************************************************
 * User scan rules
 ******************************************************************************/

app.post(ROUTE.userScanRulesCreate, function (req, res) {
    var userScanRule = req.body;

    var onUserScanRuleCreated = function () {
        res.json({message: 'User scan rule successfully created.'});
    };

    userScanRulesService.create(userScanRule, onUserScanRuleCreated);
});

/*******************************************************************************
 * Access rights
 ******************************************************************************/

/**
 * Request:
 *
 * {
 *   "scannerId": Number,
 *   "weekDay": Number (0-6),
 *   "timeStart": Time (HH:MM:SS),
 *   "timeEnd": Time (HH:MM:SS),
 *   "validFrom": Date (YYYY-MM-DD),
 *   "validTo": Date (YYYY-MM-DD)
 * }
 */
app.post(ROUTE.accessRequestsCreate, function (req, res) {
    var accessRequest = req.body;
    var token = req.query.token;
    securityService.userIdByToken(token, function (userId) {
        dbConnectionPool.query('CALL createAccessRequest(?,?,?,?,?,?,?)',
            [userId, accessRequest.scannerId, accessRequest.weekDay,
                accessRequest.timeStart, accessRequest.timeEnd,
                accessRequest.validFrom, accessRequest.validTo],
            function (err, result) {
                if (err) {
                    res.status(400);
                    res.send({message: err});
                    return;
                }

                res.send({message: 'Procedure executed successfully.'});
            }
        );
    });
});

/**
 * Requires token.
 * {
 *   "scannerUid": String,
 *   "weekDay": Number (0-6),
 *   "timeStart": Time (HH:MM:SS),
 *   "timeEnd": Time (HH:MM:SS),
 *   "validFrom": Date (YYYY-MM-DD),
 *   "validTo": Date (YYYY-MM-DD)
 * }
 */
app.get(ROUTE.accessRequests, function (req, res) {
    var token = req.query.token;
    if (securityService.isRole(token, ROLE.basic)) {
        securityService.userIdByToken(token, function (userId) {
            dbConnectionPool.query('SELECT scanners.uid AS scannerUid, ' +
                'access_requests.week_day AS weekDay, ' +
                'access_requests.time_start AS timeStart, ' +
                'access_requests.time_end AS timeEnd, ' +
                'access_requests.valid_from AS validFrom, ' +
                'access_requests.valid_to AS validTo ' +
                'FROM users, scanners, access_requests ' +
                'WHERE scanners.id = access_requests.scanner AND ' +
                'users.id = access_requests.user AND ' +
                'users.id = ?',
                [userId],
                function (err, results) {
                    if (err) {
                        res.status(400);
                        res.send({message: err});
                        return;
                    }

                    res.send(results);
                }
            );
        })
    } else if (securityService.isRole(token, ROLE.moderator)) {
        dbConnectionPool.query('SELECT users.id AS userId, ' +
            'users.username AS username, ' +
            'scanners.id AS scannerId, ' +
            'scanners.uid AS scannerUid, ' +
            'access_requests.id AS accessRequestId, ' +
            'access_requests.week_day AS weekDay, ' +
            'access_requests.time_start AS timeStart, ' +
            'access_requests.time_end AS timeEnd, ' +
            'access_requests.valid_from AS validFrom, ' +
            'access_requests.valid_to AS validTo ' +
            'FROM users, scanners, access_requests ' +
            'WHERE scanners.id = access_requests.scanner AND ' +
            'users.id = access_requests.user',
            function (err, results) {
                if (err) {
                    res.status(400);
                    res.send({message: err});
                    return;
                }

                res.send(results);
            }
        );
    }
});

app.get(ROUTE.accessRequestsId, function (req, res) {
    var accessRequestId = req.params.id;
    var token = req.query.token;
    if (securityService.isRole(token, ROLE.moderator)) {
        dbConnectionPool.query('SELECT users.id AS userId, ' +
            'users.username AS username, ' +
            'scanners.id AS scannerId, ' +
            'scanners.uid AS scannerUid, ' +
            'access_requests.id AS accessRequestId, ' +
            'access_requests.week_day AS weekDay, ' +
            'access_requests.time_start AS timeStart, ' +
            'access_requests.time_end AS timeEnd, ' +
            'access_requests.valid_from AS validFrom, ' +
            'access_requests.valid_to AS validTo ' +
            'FROM users, scanners, access_requests ' +
            'WHERE scanners.id = access_requests.scanner AND ' +
            'users.id = access_requests.user AND ' +
            'access_requests.id = ?',
            [accessRequestId],
            function (err, results) {
                if (err) {
                    res.status(400);
                    res.send({message: err});
                    return;
                }

                res.send(results);
            }
        );
    }
});

/**
 * Requires token.
 * Input:
 * {
 *   "accessRequestId": Number,
 *   "responseScannerCommandId": Number
 * }
 */
app.post(ROUTE.approveAccessRequest, function (req, res) {
    var accessRequestApprove = req.body;
    var token = req.query.token;
    if (securityService.isRole(token, ROLE.moderator)) {
        dbConnectionPool.query('CALL approveAccessRequest(?,?)',
            [accessRequestApprove.accessRequestId,
                accessRequestApprove.responseScannerCommandId],
            function (err, results) {
                if (err) {
                    res.status(400);
                    res.send({message: err});
                    return;
                }

                res.send({message: 'Procedure successfully executed.'});
            });
    }
});

/**
 * Requires token.
 * {
 *   "scannerUid": String,
 *   "weekDay": Number (0-6),
 *   "timeStart": Time (HH:MM:SS),
 *   "timeEnd": Time (HH:MM:SS),
 *   "validFrom": Date (YYYY-MM-DD),
 *   "validTo": Date (YYYY-MM-DD)
 * }
 */
app.get(ROUTE.accessRights, function (req, res) {
    var token = req.query.token;
    if (securityService.isRole(token, ROLE.basic)) {
        securityService.userIdByToken(token, function (userId) {
            dbConnectionPool.query('SELECT scanners.uid AS scannerUid, ' +
                'user_scanner_rules.week_day AS weekDay, ' +
                'user_scanner_rules.time_start AS timeStart, ' +
                'user_scanner_rules.time_end AS timeEnd, ' +
                'user_scanner_rules.valid_from AS validFrom, ' +
                'user_scanner_rules.valid_to AS validTo ' +
                'FROM users, scanners, user_scanner_rules ' +
                'WHERE scanners.id = user_scanner_rules.scanner AND ' +
                'users.id = user_scanner_rules.user AND ' +
                'users.id = ?',
                [userId],
                function (err, results) {
                    if (err) {
                        res.status(400);
                        res.send({message: err});
                        return;
                    }

                    res.send(results);
                }
            );
        })
    }
});

/*******************************************************************************
 * Get any model using dynamic querying.
 ******************************************************************************/

/**
 * Parameters:
 *
 * GET /models?query=SELECT columns FROM tables WHERE ...
 */

function parseQueryStringVariable(expressQueryObject, variableName) {
    var variable = null;
    if (expressQueryObject.hasOwnProperty(variableName)) {
        variable = expressQueryObject[variableName];
    }

    return variable;
}

function isSqlInjection(query) {
    if (query.indexOf('--') >= 0 ||
        query.indexOf('#') >= 0 ||
        query.indexOf('/*') >= 0 || query.indexOf('*/') >= 0) {
        return true;
    }

    return false;
}

function isSqlQueryAllowed(query) {
    if (query.indexOf('DELETE') >= 0 ||
        query.indexOf('INSERT') >= 0) {

    }
}

function isCreateAccessRequestValid(query, loggedInUserId) {
    var start = 'CALL createAccessRequest(';
    var end = ')';

    if (query.indexOf(start) != 0 || query.indexOf(end) != query.length - 1) {
        return false;
    }


    var givenUserId = start.length;

}

function isQueryValid(query) {
    // TODO: Access rights restriction.
    return true;
}

app.get(ROUTE.models, function (req, res) {
    var query = parseQueryStringVariable(req.query, 'query');

    console.log(query);

    if (!isQueryValid(query)) {
        res.status(403);
        res.send({message: 'Query invalid.'});
    }

    dbConnectionPool.query(query, function (err, results) {
        if (err) {
            res.status(400);
            res.send({message: err});
            return;
        }

        res.send(results);
    });
});

/**
 * Parameters:
 *
 * POST /models/create
 *
 * Input:
 * {
 *   "query": String
 * }
 */
app.post(ROUTE.modelsCreate, function (req, res) {
    var query = req.body;

    if (!(query &&
        query.hasOwnProperty('query'))) {
        res.status(400);
        res.send({message: 'Invalid JSON.'});
        return;
    }

    if (!isQueryValid(query)) {
        res.status(403);
        res.send({message: 'Query invalid.'});
        return;
    }

    dbConnectionPool.query(query.query, [], function (err, result) {
            if (err) {
                res.status(400);
                res.send({message: err});
                return;
            }

            res.send({message: 'Procedure executed successfully.'});
        }
    );
});

/*******************************************************************************
 * Generic procedure calls.
 ******************************************************************************/

var allowedCalls = {};
allowedCalls['CALL createAccessRequest(?,?,?,?,?,?,?)'] = {
    validateParameters: function (parameters, token, onValid, onInvalid) {
        securityService.userIdByToken(token, function (userId) {
            if (parameters[0] != userId) {
                onInvalid();
                return;
            }

            onValid();
        });
    }
};

function isAllowed(procedure, allowedCalls) {
    return allowedCalls.hasOwnProperty(procedure);
}

/**
 * Request:
 * {
 *   "procedure": String,
 *   "parameters": [String]
 * }
 */
app.post(ROUTE.modelProcedures, function (req, res) {
    var procedure = req.body;

    if (!procedure.hasOwnProperty('procedure') || !procedure.hasOwnProperty('parameters')) {
        res.status(400);
        res.send({message: 'Invalid JSON.'});
        return;
    }

    if (!isAllowed(procedure.procedure, allowedCalls)) {
        res.status(403);
        res.send({message: 'Procedure does not exist.'});
        return;
    }

    var token = req.query.token;
    if (!token) {
        res.status(403);
        res.send({message: 'Token invalid.'});
        return;
    }

    var onSuccess = function () {
        dbConnectionPool.query(procedure.procedure, procedure.parameters,
            function (err, result) {
                if (err) {
                    res.status(400);
                    res.send({message: err});
                    return;
                }

                res.send({message: 'Procedure executed successfully.'});
            }
        );
    };

    var onFail = function () {
        res.status(400);
        res.send({message: 'Invalid request.'});
    };

    allowedCalls[procedure.procedure].validateParameters(procedure.parameters,
        token, onSuccess, onFail);
});

/*******************************************************************************
 * Serving static files
 ******************************************************************************/

app.use(express.static(__dirname + '/../client'));

/*******************************************************************************
 * Application start
 ******************************************************************************/

app.listen(argv.webServerPort);


/*******************************************************************************
 * Mqtt client
 ******************************************************************************/

var mqtt = require('mqtt');

client = mqtt.createClient(1883, 'localhost');

var subscribeTopic = 'iot/nfc/*/tag';

function getScannerIdFromSubscribeTopic(subscribeTopic) {
    return subscribeTopic.slice(8).slice(0, subscribeTopic.indexOf('/'));
}

function buildResponseTopic(subscribeTopic) {
    var scannerIdPlaceholder = ':scannerId';
    var responseTopicTemplate = 'iot/nfc/' + scannerIdPlaceholder + '/command';
    var scannerId = getScannerIdFromSubscribeTopic(subscribeTopic);
    return responseTopicTemplate.replace(scannerIdPlaceholder, scannerId);
}

client.subscribe(subscribeTopic);

function yyyymmddhhmmssToMysqlTimestamp(yyyymmddhhmmss) {
    var mysqlTimestamp = ''; // Should be formated like: 2012-12-31 11:30:45

    // YYYY-
    mysqlTimestamp += yyyymmddhhmmss.slice(0, 4);
    mysqlTimestamp += '-';
    // MM-
    mysqlTimestamp += yyyymmddhhmmss.slice(4, 6);
    mysqlTimestamp += '-';
    // DD
    mysqlTimestamp += yyyymmddhhmmss.slice(6, 8);
    mysqlTimestamp += ' ';

    // HH:
    mysqlTimestamp += yyyymmddhhmmss.slice(8, 10);
    mysqlTimestamp += ':';
    // MM:
    mysqlTimestamp += yyyymmddhhmmss.slice(10, 12);
    mysqlTimestamp += ':';
    // SS
    mysqlTimestamp += yyyymmddhhmmss.slice(12, 14);

    return mysqlTimestamp;
}

function isTagUidPresentInDatabase(tagUid, onPresent, onNotPresent, onError) {
    dbConnectionPool.query('SELECT id FROM tags WHERE tags.id = ?',
        [tagUid],
        function (err, results) {
            if (err && onError) {
                onError(err);
                return;
            }

            if (results.length > 0 && onPresent) {
                onPresent();
            } else if (onNotPresent) {
                onNotPresent();
            }
        }
    );
}

function addTagToDatabase(tagUid, onSuccess, onError) {
    dbConnectionPool.query('INSERT INTO tags(uid) VALUES(?)',
        [tagUid],
        function (err, results) {
            if (onError && err) {
                onError(err);
                return;
            }

            if (onSuccess) onSuccess();
        });
}

// Null if no user for tag UID.
// User id if there is a user for the given tag UID.
function getUserIdByTagUid(tagUid, onUserId, onError) {
    dbConnectionPool.query('SELECT users.id AS id ' +
        'FROM users, tags ' +
        'WHERE users.id = tags.user AND ' +
        'tags.uid = ?',
        [tagUid],
        function (err, results) {
            if (onError && err) {
                onError(err);
                return;
            }

            if (onUserId) {
                if (results.length > 0) {
                    onUserId(results[0].id);
                } else {
                    onUserId(null);
                }
            }
        });
}

/**
 * scanTime:
 * {
 *   userId: Number,
 *   scannerId: Number,
 *   responseCommandId: Number,
 *   timestamp: String (Timestamp)
 * }
 */
function addScanTimeToDatabase(scanTime, onSuccess, onError) {
    dbConnectionPool.query('INSERT INTO user_scan_times(user, ' +
        'scanner, ' +
        'command, ' +
        'timestamp) ' +
        'VALUES (?, ?, ?, ?)',
        [scanTime.userId, scanTime.scannerId, scanTime.responseCommandId,
            scanTime.timestamp],
        function (err, results) {
            if (onError && err) {
                onError(err);
                return;
            }

            if (onSuccess) onSuccess();
        });
}

function hasUserAccessToScanner(userId, scannerId, onHasAccess, onNoAccess,
                                onError) {
    dbConnectionPool.query('SELECT week_day, ' +
        'time_start, ' +
        'time_end, ' +
        'valid_from, ' +
        'valid_to ' +
        'FROM user_scan_rules ' +
        'WHERE ' +
        '(week_day = DAYOFWEEK() AND valid_from <= CURDATE() AND ' +
        'valid_to >= CURDATE() AND time_start <= CURTIME() AND ' +
        'time_end >= CURTIME()) AND ' +
        'user_scan_rules.user = ? AND user_scan_rules.scanner = ?',
        [userId, scannerId],
        function (err, results) {
            if (onError && err) {
                onError(err);
                return;
            }

            if (results > 0 && onHasAccess) {
                onHasAccess();
            } else if (onNoAccess) {
                onNoAccess();
            }
        });
}

client.on('message', function (topic, message) {
    /*
     Message format:
     'YYYYMMDDhhmmss rfid_nfc_uid'
     */
    var scanTime = message.slice(0, 14);
    var tagUid = message.slice(15);
    var scannerId = getScannerIdFromSubscribeTopic(topic);

    var scanTimeMysqlTimestamp = yyyymmddhhmmssToMysqlTimestamp(scanTime);

    var onError = function (err) {
        console.log(err);
    };

    var onTagNotPresentInDatabase = function () {
        addTagToDatabase(tagUid, null, onError);
    };

    var onTagPresentInDatabase = function () {
        var onUserId = function (userId) {
            if (!userId) {
                return;
            }

            var responseTopic = buildResponseTopic(topic);

            var onHasAccess = function () {
                client.publish(responseTopic, 'PERMIT');
                addScanTimeToDatabase({
                    userId: userId,
                    scannerId: scannerId,
                    responseCommand: 'PERMIT',
                    timestamp: scanTimeMysqlTimestamp
                }, null, onError);
            };

            var onNoAccess = function () {
                client.publish(responseTopic, 'DENY');
                addScanTimeToDatabase({
                    userId: userId,
                    scannerId: scannerId,
                    responseCommand: 'DENY',
                    timestamp: scanTimeMysqlTimestamp
                }, null, onError);
            };

            hasUserAccessToScanner(userId, scannerId, onHasAccess, onNoAccess,
                onError);
        };

        getUserIdByTagUid(tagUid, onUserId, onError);
    };

    isTagUidPresentInDatabase(tagUid, onTagPresentInDatabase,
        onTagNotPresentInDatabase, onError);
});

process.on('SIGTERM', function () {
    client.end();
    process.exit(0);
});
