/*******************************************************************************
 * Development utilities
 ******************************************************************************/

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
    '  --webport        <web_server_port>(*required)\n' +
    '  --mosquittoHost  <mosquito_server_host>(*required)\n' +
    '  --mosquittoPort  <mosquito_server_port>(*required)\n' +
    '\n' +
    '  --help        To print this help\n';

if (argv.help) {
    console.log(usage);
    process.exit()
}

if (!argv.dbhost ||
    !argv.dbuser ||
    !argv.dbpassword ||
    !argv.dbname ||
    !argv.dbport ||
    !argv.webport ||
    !argv.mosquittoHost ||
    !argv.mosquittoPort) {
    console.log(usage);
    process.exit(1);
}

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

var basicAuth = require('basic-auth');

var express = require('express');
var app = express();

var ROUTE = {
    accesses: '/accesses',
    scanners: '/scanners',
    users: '/users',
    roles: '/roles',
    tags: '/tags',
    userScanRules: '/userScanRules',
    userScanRuleRequests: '/userScanRuleRequests',
    userScanTimes: '/userScanTimes'
};

/*******************************************************************************
 * Filters
 ******************************************************************************/

// Automatic request JSON parsing
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing
                                                  // application/x-www-form-urlencoded

/*******************************************************************************
 * Serving static files
 ******************************************************************************/

app.use(express.static(__dirname + '/../client'));

/*******************************************************************************
 * Authentication
 ******************************************************************************/

// User authentication

var ROLE = {
    administrator: 1,
    moderator: 2,
    user: 3
};

// TODO: Resource access restrictions by user role.
app.use(function (req, res, next) {

    function sendUnauthorized(res, error) {
        //res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.status(401);
        res.send(error);
    }

    var credentials = basicAuth(req);

    var error = getCredentialsError(credentials);

    if (error) {
        sendUnauthorized(res, error);
        return;
    }

    dbConnectionPool.query('SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS role ' +
        'FROM users ' +
        'WHERE username = ? AND password = ?',
        [credentials.name, credentials.pass],
        function (err, results) {

            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                req.user = results[0];
                return next();
            }

            sendUnauthorized(res, 'Username or password invalid.');

        }
    );

});

/*******************************************************************************
 * Utility methods
 ******************************************************************************/

function timeToHours(string) {

    return parseInt(string.slice(0, 2));

}

function timeToMinutes(string) {

    return parseInt(string.slice(3, 5));

}

function timeToSeconds(string) {

    return parseInt(string.slice(6, 8));

}

function isTime(string) {

    // Confirm that string format is HH:MM:SS

    var hhmmssRegex = /^[0-9][0-9]:[0-9][0-9]:[0-9][0-9]$/;
    if (!hhmmssRegex.test(string)) {
        return false;
    }

    var hh = timeToHours(string);
    var mm = timeToMinutes(string);
    var ss = timeToSeconds(string);

    return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59 && ss >= 0 && ss <= 59;

}

function hhmmssToDate(hhmmss) {

    return new Date(0, 0, 0, timeToHours(hhmmss), timeToMinutes(hhmmss),
        timeToSeconds(hhmmss), 0);

}

/**
 * If time1 is greater than time2, returns 1.
 * If time1 is equal to time2, returns 0.
 * If time1 is less than time2, return -1.
 * time1 and time2 must be strings formatted like 'hh:mm:ss'.
 */
function compareTimes(time1, time2) {

    if (hhmmssToDate(time1).getTime() > hhmmssToDate(time2).getTime()) {
        return 1;
    }

    if (hhmmssToDate(time1).getTime() === hhmmssToDate(time2).getTime()) {
        return 0;
    }

    return -1;

}

function isDate(string) {

    // Check if formatted like YYYY-MM-DD

    var yyyymmddRegex = /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]$/;
    if (!yyyymmddRegex.test(string)) {
        return false;
    }

    return !isNaN(Date.parse(string));

}

function yyyymmddToDate(yyyymmdd) {

    return new Date(yyyymmdd);

}

/**
 * If date1 is greater than date2, returns 1.
 * If date1 is equal to date2, returns 0.
 * If date1 is less than date2, return -1.
 * date1 and date2 must be strings formatted like 'hh:mm:ss'.
 */
function compareDates(date1, date2) {

    if (yyyymmddToDate(date1).getTime() > yyyymmddToDate(date2).getTime()) {
        return 1;
    }

    if (yyyymmddToDate(date1).getTime() === yyyymmddToDate(date2).getTime()) {
        return 0;
    }

    return -1;

}

function getIdParameterError(id) {

    if (!id || typeof id != 'number') {
        return 'Id invalid.';
    }

    if (id <= 0) {
        return 'Id invalid. (Numerical value greater than 0.)';
    }

    return null;

}

function getScannerError(scanner) {

    if (!scanner) {
        return 'Scanner invalid.';
    }

    if (!scanner.hasOwnProperty('uid') || typeof scanner.uid != 'string') {
        return 'UID invalid.';
    }

    if (!scanner.hasOwnProperty('description') ||
        typeof scanner.description != 'string') {
        return 'Description invalid.';
    }

    if (scanner.uid.length < 1) {
        return 'UID too short. (1 character min.)';
    }

    if (scanner.description.length < 5) {
        return 'Description too short. (5 characters min.)';
    }

    return null;

}

function sendInputParametersErrorResponse(res, error) {

    res.status(422);
    res.send(error);

}

/*******************************************************************************
* Login
******************************************************************************/

function getCredentialsError(credentials) {

    if (!credentials) {
        return 'Credentials invalid.';
    }

    if (!credentials.hasOwnProperty('name') ||
        typeof credentials.name != 'string') {
        return 'Username invalid.';
    }

    if (!credentials.hasOwnProperty('pass') ||
        typeof credentials.pass != 'string') {
        return 'Password invalid.';
    }

    if (credentials.name.length < 5) {
        return 'Username too short. (5 character min.)';
    }

    if (credentials.pass.length < 6) {
        return 'Password too short. (6 characters min.)';
    }

    return null;

}

/**
* POST /accesses
*
* Input: Basic Authentication header is needed to get to this resource.
*
* Output: Number (role).
*         403 error if unauthorized to login.
*         'Error.' (On error.)
*/
app.post(ROUTE.accesses, function (req, res) {

    var user = req.user;

    res.send('' + user.role);

});

/*******************************************************************************
 * Scanners
 ******************************************************************************/

/**
 * POST /scanners
 *
 * Input: {
 *   uid: String,
 *   description: String
 * }
 *
 * Output: 'Scanner created successfully.' (On success.)
 *         ['error1', 'error2', ...] (List of error on validation fail)
 *         'Database error.' (On database error)
 */
app.post(ROUTE.scanners, function (req, res) {

    var scanner = req.body;

    var error = getScannerError(scanner);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('INSERT INTO scanners (uid, description) ' +
        'VALUES (?, ?)',
        [scanner.uid, scanner.description],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.status(201);
                res.send('Scanner created successfully.');
            }
        }
    );

});

/**
 * GET /scanners
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   uid: String,
 *   description: String
 * }]
 */
app.get(ROUTE.scanners, function (req, res) {

    dbConnectionPool.query('SELECT id AS id, ' +
        'uid AS uid, ' +
        'description AS description ' +
        'FROM scanners',
        [],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            res.send(results);
        }
    );

});

/**
 * GET /scanners/:id
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   uid: String,
 *   description: String
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.scanners + '/:id', function (req, res) {

    var scannerId = parseInt(req.params.id);

    var error = getIdParameterError(scannerId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('SELECT id AS id, ' +
        'uid AS uid, ' +
        'description AS description ' +
        'FROM scanners ' +
        'WHERE id = ?',
        [scannerId],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                res.send(results[0]);
                return;
            }

            res.send(null);
        }
    );

});

/**
 * PUT /scanners/:id
 *
 * Input: {
 *   uid: String,
 *   description: String
 * }
 *
 * Output: 'Scanner updated successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.put(ROUTE.scanners + '/:id', function (req, res) {

    var scannerId = parseInt(req.params.id);
    var scanner = req.body;

    var idError = getIdParameterError(scannerId);

    if (idError) {
        sendInputParametersErrorResponse(idError);
        return;
    }

    var scannerError = getScannerError(scanner);

    if (scannerError) {
        sendInputParametersErrorResponse(scannerError);
        return;
    }


    dbConnectionPool.query('UPDATE scanners ' +
        'SET uid = ?, description = ? ' +
        'WHERE id = ?',
        [scanner.uid, scanner.description, scannerId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('Scanner updated successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );

});

/**
 * DELETE /scanners/:id
 *
 * Input: None
 *
 * Output: 'Scanner deleted successfully.' (On success.)
 *         ['error1', 'error2', ...] (List of error on validation fail)
 *         'Database error.' (On database error)
 */
app.delete(ROUTE.scanners + '/:id', function (req, res) {

    var scannerId = parseInt(req.params.id);

    var error = getIdParameterError(scannerId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('DELETE FROM scanners ' +
        'WHERE id = ?',
        [scannerId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('Scanner deleted successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );

});

/*******************************************************************************
 * Users
 ******************************************************************************/

function getUserError(user) {

    if (!user) {
        return 'User invalid.';
    }

    if (!user.hasOwnProperty('username') || typeof user.username != 'string') {
        return 'Username invalid.';
    }

    if (!user.hasOwnProperty('password') || typeof user.password != 'string') {
        return 'Password invalid.';
    }

    if (!user.hasOwnProperty('role') || typeof user.role != 'number') {
        return 'Role invalid';
    }

    if (user.username.length < 5) {
        return 'Username invalid. (5 characters min.)';
    }

    if (user.password.length < 6) {
        return 'Password invalid. (6 characters min.)';
    }

    if (user.role < 1 || user.role > 3) {
        return 'Role invalid. (Number 1 to 3.)';
    }

    return null;

}

/**
 * POST /users
 *
 * Input: {
 *   username: String,
 *   password: String,
 *   role: Number (1 to 3)
 * }
 *
 * Output: 'User created successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.post(ROUTE.users, function (req, res) {

    var user = req.body;

    var error = getUserError(user);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('INSERT INTO users (username, password, role) ' +
        'VALUES (?, ?, ?)',
        [user.username, user.password, user.role],
        function (err, result) {
            if (err) {

                if (err.code = 'ER_DUP_ENTRY') {
                    res.status(422);
                    res.send('User already exists.');
                    return;
                }

                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.status(201);
                res.send('User created successfully.');
            }
        }
    );

});

/**
 * GET /users
 *
 * Query string:
 *   ?expand=role // Returns the role name, not the role id.
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   username: String,
 *   password: String,
 *   role: Number
 * }]
 */
app.get(ROUTE.users, function (req, res) {

    var expand = req.query.expand;

    var select = 'SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS role ' +
        'FROM users';

    if (expand && expand.indexOf('role') >= 0) {
        select = 'SELECT users.id AS id, ' +
        'users.username AS username, ' +
        'users.password AS password, ' +
        'roles.description AS role ' +
        'FROM users ' +
        'LEFT OUTER JOIN roles ON users.role = roles.id';
    }

    dbConnectionPool.query(select, [], function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            res.send(results);
        }
    );

});

/**
 * GET /users/:id
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   username: String,
 *   password: String,
 *   role: String
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.users + '/:id', function (req, res) {

    var userId = parseInt(req.params.id);

    var error = getIdParameterError(userId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    var expand = req.query.expand;

    var select = 'SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS role ' +
        'FROM users ' +
        'WHERE id = ?';

    var parameters = [userId];

    if (expand && expand.indexOf('role') >= 0) {
        select = 'SELECT users.id AS id, ' +
        'users.username AS username, ' +
        'users.password AS password, ' +
        'roles.description AS role ' +
        'FROM users ' +
        'LEFT OUTER JOIN roles ON users.role = roles.id ' +
        'WHERE users.id = ?';

        parameters = [userId];
    }

    dbConnectionPool.query(select, parameters, function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                res.send(results[0]);
                return;
            }

            res.send(null);
        }
    );

});

/**
 * PUT /users/:id
 *
 * Input: {
 *   username: String,
 *   password: String,
 *   role: Number (1 to 3)
 * }
 *
 * Output: 'User updated successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.put(ROUTE.users + '/:id', function (req, res) {

    var userId = parseInt(req.params.id);
    var user = req.body;

    var idError = getIdParameterError(userId);

    if (idError) {
        sendInputParametersErrorResponse(idError);
        return;
    }

    var userError = getUserError(user);

    if (userError) {
        sendInputParametersErrorResponse(userError);
        return;
    }


    dbConnectionPool.query('UPDATE users ' +
        'SET username = ?, password = ?, role = ? ' +
        'WHERE id = ?',
        [user.username, user.password, user.role, userId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('User updated successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );

});

/**
 * DELETE /users/:id
 *
 * Input: None
 *
 * Output: 'User deleted successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.delete(ROUTE.users + '/:id', function (req, res) {

    var userId = parseInt(req.params.id);

    var error = getIdParameterError(userId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('DELETE FROM users WHERE id = ?',
        [userId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('User deleted successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );

});

/*******************************************************************************
 * Roles
 ******************************************************************************/

/**
 * GET /roles
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   description: String
 * }]
 */
app.get(ROUTE.roles, function (req, res) {

    dbConnectionPool.query('SELECT id AS id, ' +
        'description AS description ' +
        'FROM roles',
        [],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            res.send(results);
        }
    );

});

/**
 * GET /roles/:id
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   description: String
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.roles + '/:id', function (req, res) {

    var roleId = parseInt(req.params.id);

    var error = getIdParameterError(roleId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('SELECT id AS id, ' +
        'description AS description ' +
        'FROM roles ' +
        'WHERE id = ?',
        [roleId],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                res.send(results[0]);
                return;
            }

            res.send(null);
        }
    );

});

/*******************************************************************************
 * Tags
 ******************************************************************************/

function getTagError(tag) {

    if (!tag) {
        return 'Tag invalid.';
    }

    if (!tag.hasOwnProperty('uid') || typeof tag.uid != 'string') {
        return 'UID invalid.';
    }

    if (!tag.hasOwnProperty('userId') || typeof tag.userId != 'number') {
        return 'User id invalid.';
    }

    if (tag.uid.length < 1) {
        return 'UID invalid. (1 characters min.)';
    }

    if (tag.userId < 0) {
        return 'User id invalid. (Number greater than or equal to 0.)';
    }

    return null;

}

/**
 * POST /tags
 *
 * Input: {
 *   uid: String,
 *   userId: Number (0-No user)
 * }
 *
 * Output: 'Tag created successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.post(ROUTE.tags, function (req, res) {

    var tag = req.body;

    var error = getTagError(tag);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    var insertQuery = 'INSERT INTO tags (uid, user) VALUES (?, :user)';
    var parameters = [tag.uid];
    if (tag.userId === 0) {
        insertQuery = insertQuery.replace(':user', 'NULL');
    } else {
        insertQuery = insertQuery.replace(':user', '?');
        parameters.push(tag.userId);
    }

    dbConnectionPool.query(insertQuery, parameters, function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.status(201);
                res.send('Tag created successfully.');
            }
        }
    );

});

/**
 * GET /tags
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   uid: String,
 *   userId: Number
 * }]
 */
app.get(ROUTE.tags, function (req, res) {

    var expand = req.query.expand;

    var select = 'SELECT id AS id, uid AS uid, user AS userId FROM tags';

    if (expand && expand.indexOf('user') >= 0) {
        select = 'SELECT tags.id AS id, ' +
            'tags.uid AS uid, ' +
            'users.username AS username ' +
            'FROM tags ' +
            'LEFT OUTER JOIN users ON tags.user = users.id';
    }

    dbConnectionPool.query(select, [], function (err, results) {

            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            res.send(results);

        }
    );

});

/**
 * GET /tags/:id
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   uid: String,
 *   userId: Number
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.tags + '/:id', function (req, res) {

    var tagId = parseInt(req.params.id);

    var error = getIdParameterError(tagId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('SELECT id AS id, ' +
        'uid AS uid, ' +
        'user AS userId ' +
        'FROM tags ' +
        'WHERE id = ?',
        [tagId],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                res.send(results[0]);
                return;
            }

            res.send(null);
        }
    );

});

/**
 * PUT /tags/:id
 *
 * Input: {
 *   uid: String,
 *   userId: Number (0-No user)
 * }
 *
 * Output: 'Tag updated successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.put(ROUTE.tags + '/:id', function (req, res) {

    var tagId = parseInt(req.params.id);
    var tag = req.body;

    var idError = getIdParameterError(tagId);

    if (idError) {
        sendInputParametersErrorResponse(idError);
        return;
    }

    var userError = getTagError(tag);

    if (userError) {
        sendInputParametersErrorResponse(userError);
        return;
    }

    dbConnectionPool.query('UPDATE tags ' +
        'SET uid = ?, user = ? ' +
        'WHERE id = ?',
        [tag.uid, tag.userId, tagId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('Tag updated successfully.');
                return;
            }

            res.status(404);
            res.send('Id or user id invalid.');
        }
    );

});

/**
 * PATCH /tags/:id
 *
 * Input: userId: Number (0-No user)
 *
 * Output: 'Tag updated successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.patch(ROUTE.tags + '/:id', function (req, res) {

    var tagId = parseInt(req.params.id);
    var userId = req.body;

    if (!userId.hasOwnProperty('userId')) {
        sendInputParametersErrorResponse(res, 'User id invalid.');

        return;
    }

    userId = userId.userId;

    var idError = getIdParameterError(tagId);

    if (idError) {
        sendInputParametersErrorResponse(res, idError);
        return;
    }

    var userIdError = getIdParameterError(userId);

    if (userIdError) {
        sendInputParametersErrorResponse(res, userIdError);
        return;
    }

    dbConnectionPool.query('UPDATE tags ' +
        'SET user = ? ' +
        'WHERE id = ?',
        [userId, tagId],
        function (err, result) {

            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('Tag updated successfully.');
                return;
            }

            res.status(404);
            res.send('Id or user id invalid.');

        }
    );

});

/**
 * DELETE /tags/:id
 *
 * Input: None
 *
 * Output: 'Tag deleted successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.delete(ROUTE.tags + '/:id', function (req, res) {

    var tagId = parseInt(req.params.id);

    var error = getIdParameterError(tagId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('DELETE FROM tags WHERE id = ?',
        [tagId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('Tag deleted successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );

});

/*******************************************************************************
 * User scan rules
 ******************************************************************************/

function getUserScanRuleError(userScanRule) {

    if (!userScanRule) {
        return 'User scan rule invalid.';
    }

    if (!userScanRule.hasOwnProperty('userId') ||
        typeof userScanRule.userId != 'number') {
        return 'User id invalid.';
    }

    if (!userScanRule.hasOwnProperty('scannerId') ||
        typeof userScanRule.scannerId != 'number') {
        return 'Scanner id invalid.';
    }

    if (!userScanRule.hasOwnProperty('startTime') ||
        !isTime(userScanRule.startTime)) {
        return 'Start time invalid. (Must be formatted like HH:MM:SS)';
    }

    if (!userScanRule.hasOwnProperty('endTime') ||
        !isTime(userScanRule.endTime)) {
        return 'End time invalid. (Must be formatted like HH:MM:SS)';
    }

    if (!userScanRule.hasOwnProperty('startDate') ||
        !isDate(userScanRule.startDate)) {
        return 'Start date invalid. ' +
            '(Start date must be formatted like YYYY-MM-DD.)';
    }

    if (!userScanRule.hasOwnProperty('endDate') ||
        !isDate(userScanRule.endDate)) {
        return 'End date invalid. ' +
            '(End date must be formatted like YYYY-MM-DD.)';
    }

    if (!userScanRule.hasOwnProperty('daysOfWeek')) {
        return 'Days of week invalid.';
    }

    if (userScanRule.userId <= 0) {
        return 'User id invalid. (Number greater than 0.)';
    }

    if (userScanRule.scannerId <= 0) {
        return 'Scanner id invalid. (Number greater than 0.)';
    }

    var comparison = compareTimes(userScanRule.startTime,
        userScanRule.endTime);
    if (comparison != -1) {
        return 'Times invalid. (End time must be greater than or equal to ' +
            'start time.)';
    }

    comparison = compareDates(userScanRule.startDate,
        userScanRule.endDate);
    if (comparison != -1 && comparison != 0) {
        return 'Dates invalid. (End date must be greater than start date.)';
    }

    function areDaysOfWeekValid(daysOfWeek) {
        var i, dayOfWeek;

        for (i = 0; i < daysOfWeek.length; i++) {
            dayOfWeek = daysOfWeek[i];

            if (typeof dayOfWeek != 'number' || dayOfWeek > 7 ||
                dayOfWeek < 1) {
                return false;
            }
        }

        return true;
    }

    function areDaysOfWeekRepeating(daysOfWeek) {
        var i, j;

        for (i = 0; i < daysOfWeek.length; i++) {
            for (j = i + 1; j < daysOfWeek.length; j++) {
                if (daysOfWeek[i] === daysOfWeek[j]) {
                    return true;
                }
            }
        }

        return false;
    }

    if (!Array.isArray(userScanRule.daysOfWeek) ||
        userScanRule.daysOfWeek.length > 7 || !areDaysOfWeekValid(userScanRule.daysOfWeek) ||
        areDaysOfWeekRepeating(userScanRule.daysOfWeek)) {

        return 'Days of week invalid. ' +
            '(1 - 7 representing sunday through monday. ' +
            'Cannot be more than 7 days. Days cannot repeat.)';
    }

    return null;

}

function insertIntoUserScanRules(userScanRule, res, isRequest,
                                 responseMessage) {

    var error = getUserScanRuleError(userScanRule);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    dbConnectionPool.query('INSERT INTO user_scan_rules (user, ' +
        'scanner, ' +
        'start_time, ' +
        'end_time, ' +
        'start_date, ' +
        'end_date, ' +
        'is_request' +
        ') VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userScanRule.userId, userScanRule.scannerId, userScanRule.startTime,
            userScanRule.endTime, userScanRule.startDate, userScanRule.endDate,
            isRequest],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0 &&
                userScanRule.daysOfWeek.length === 0) {
                res.status(201);
                res.send(responseMessage);
                return;
            }

            var i;

            var userScanRuleId = result.insertId;

            var daysOfWeekInsertQuery = 'INSERT INTO user_scan_rule_days(' +
                'user_scan_rule, ' +
                'day_of_week) ' +
                'VALUES ';

            var parameters = [];

            for (i = 0; i < userScanRule.daysOfWeek.length; i++) {
                daysOfWeekInsertQuery += '(?, ?),';
                parameters.push(userScanRuleId);
                parameters.push(userScanRule.daysOfWeek[i]);
            }

            daysOfWeekInsertQuery = daysOfWeekInsertQuery
                .slice(0, daysOfWeekInsertQuery.length - 1);

            dbConnectionPool.query(daysOfWeekInsertQuery, parameters,
                function (err, result) {
                    if (err) {
                        res.status(500);
                        res.send(err);
                        return;
                    }

                    if (result.affectedRows > 0) {
                        res.status(201);
                        res.send(responseMessage);
                    }
                }
            );
        }
    );

}

/**
 * expand must not be falsy. If no expand set expand='';
 */
function selectUserScanRules2(req, res, userScanRuleId, isRequest) {

    var user = req.user;
    var userId = user.id;
    var userRole = user.role;
    var expand = req.query.expand;

    if (!expand) {
        expand = '';
    }

    var selectQueryTemplate = 'SELECT :columns FROM user_scan_rules ' +
        ':joins WHERE :conditions';

    var columns = 'user_scan_rules.id AS id' +
        ',user_scan_rules.start_time AS startTime' +
        ',user_scan_rules.end_time AS endTime' +
        ',user_scan_rules.start_date AS startDate' +
        ',user_scan_rules.end_date AS endDate';

    var joins = '';

    var conditions = ' is_request = ?';

    var parameters = [isRequest];

    if (expand.indexOf('user') >= 0) {
        columns += ',users.username AS username';
        joins += ' LEFT OUTER JOIN users' +
        ' ON users.id = user_scan_rules.user';
    } else {
        columns += ',user_scan_rules.user AS userId';
    }

    if (expand.indexOf('scanner') >= 0) {
        columns += ',scanners.uid AS scannerUid';
        joins += ' LEFT OUTER JOIN scanners' +
        ' ON scanners.id = user_scan_rules.scanner';
    } else {
        columns += ',user_scan_rules.scanner AS scannerId';
    }

    if (userRole && userRole === ROLE.user) {
        conditions += ' AND user_scan_rules.user = ?';
        parameters.push(userId);
    }

    if (userScanRuleId) {
        conditions += ' AND user_scan_rules.id = ?';
        parameters.push(userScanRuleId);
    }

    var select = selectQueryTemplate.replace(':columns', columns);
    select = select.replace(':joins', joins);
    select = select.replace(':conditions', conditions);

    dbConnectionPool.query(select, parameters, function (err, userScanRules) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (userScanRules.length <= 0) {
                res.send(userScanRules);
                return;
            }

            var loaded = 0, userScanRulesCount = userScanRules.length;

            userScanRules.forEach(function (userScanRule) {
                dbConnectionPool.query('SELECT day_of_week AS day ' +
                    'FROM user_scan_rule_days ' +
                    'WHERE user_scan_rule = ?',
                    [userScanRule.id],
                    function (err, userScanRuleDays) {
                        if (err) {
                            res.status(500);
                            res.send(err);
                            return;
                        }

                        var daysOfWeek = [];
                        userScanRuleDays.forEach(function (userCanRuleDay) {
                            daysOfWeek.push(userCanRuleDay.day);
                        });
                        userScanRule.daysOfWeek = daysOfWeek;

                        loaded++;
                        if (loaded === userScanRulesCount) {
                            if (userScanRuleId) {
                                res.send(userScanRules[0]);
                            } else {
                                res.send(userScanRules);
                            }
                        }
                    }
                );
            });
        }
    );
}


function selectUserScanRules1(userId, userRole, userScanRuleRequestId,
                             isRequest, res, expand) {

    if (!expand) {
        expand = '';
    }

    var selectQueryTemplate = 'SELECT :columns FROM user_scan_rules ' +
        ':joins WHERE :conditions';

    var columns = 'user_scan_rules.id AS id' +
        ',user_scan_rules.start_time AS startTime' +
        ',user_scan_rules.end_time AS endTime' +
        ',user_scan_rules.start_date AS startDate' +
        ',user_scan_rules.end_date AS endDate';

    var joins = '';

    var conditions = ' is_request = ?';

    var parameters = [isRequest];

    if (expand.indexOf('user') >= 0) {
        columns += ',users.username AS username';
        joins += ' LEFT OUTER JOIN users' +
                 ' ON users.id = user_scan_rules.user';
    } else {
        columns += ',user_scan_rules.user AS userId';
    }

    if (expand.indexOf('scanner') >= 0) {
        columns += ',scanners.uid AS scannerUid';
        joins += ' LEFT OUTER JOIN scanners' +
                 ' ON scanners.id = user_scan_rules.scanner';
    } else {
        columns += ',user_scan_rules.scanner AS scannerId';
    }

    if (userRole && userRole === ROLE.user) {
        conditions += ' AND user_scan_rules.user = ?';
        parameters.push(userId);
    }

    if (userScanRuleRequestId) {
        conditions += ' AND user_scan_rules.id = ?';
        parameters.push(userScanRuleRequestId);
    }

    var select = selectQueryTemplate.replace(':columns', columns);
    select = select.replace(':joins', joins);
    select = select.replace(':conditions', conditions);

    dbConnectionPool.query(select, parameters, function (err, userScanRules) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (userScanRules.length <= 0) {
                res.send(userScanRules);
                return;
            }

            var loaded = 0, userScanRulesCount = userScanRules.length;

            userScanRules.forEach(function (userScanRule) {
                dbConnectionPool.query('SELECT day_of_week AS day ' +
                    'FROM user_scan_rule_days ' +
                    'WHERE user_scan_rule = ?',
                    [userScanRule.id],
                    function (err, userScanRuleDays) {
                        if (err) {
                            res.status(500);
                            res.send(err);
                            return;
                        }

                        var daysOfWeek = [];
                        userScanRuleDays.forEach(function (userCanRuleDay) {
                            daysOfWeek.push(userCanRuleDay.day);
                        });
                        userScanRule.daysOfWeek = daysOfWeek;

                        loaded++;
                        if (loaded === userScanRulesCount) {
                            if (userScanRuleRequestId) {
                                res.send(userScanRules[0]);
                            } else {
                                res.send(userScanRules);
                            }
                        }
                    }
                );
            });
        }
    );
}


function selectUserScanRules(userId, userRole, userScanRuleRequestId,
                             isRequest, res) {

    var selectQuery = 'SELECT user_scan_rules.id AS id, ' +
        'user_scan_rules.user AS userId, ' +
        'user_scan_rules.scanner AS scannerId, ' +
        'user_scan_rules.start_time AS startTime, ' +
        'user_scan_rules.end_time AS endTime, ' +
        'user_scan_rules.start_date AS startDate, ' +
        'user_scan_rules.end_date AS endDate' +
        'FROM user_scan_rules ' +
        'WHERE is_request = ?';

    var parameters = [isRequest];

    if (userRole && userRole === ROLE.user) {
        selectQuery += ' AND user = ?';
        parameters.push(userId);
    }

    if (userScanRuleRequestId) {
        selectQuery += ' AND id = ?';
        parameters.push(userScanRuleRequestId);
    }

    dbConnectionPool.query(selectQuery, parameters,
        function (err, userScanRules) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (userScanRules.length <= 0) {
                res.send(userScanRules);
                return;
            }

            var loaded = 0, userScanRulesCount = userScanRules.length;

            userScanRules.forEach(function (userScanRule) {
                dbConnectionPool.query('SELECT day_of_week AS day ' +
                    'FROM user_scan_rule_days ' +
                    'WHERE user_scan_rule = ?',
                    [userScanRule.id],
                    function (err, userScanRuleDays) {
                        if (err) {
                            res.status(500);
                            res.send(err);
                            return;
                        }

                        var daysOfWeek = [];
                        userScanRuleDays.forEach(function (userCanRuleDay) {
                            daysOfWeek.push(userCanRuleDay.day);
                        });
                        userScanRule.daysOfWeek = daysOfWeek;

                        loaded++;
                        if (loaded === userScanRulesCount) {
                            if (userScanRulesCount === 1) {
                                res.send(userScanRules[0]);
                            } else {
                                res.send(userScanRules);
                            }
                        }
                    }
                );
            });
        }
    );
}

function deleteUserScanRule(userScanRuleId, res) {
    dbConnectionPool.query('DELETE FROM user_scan_rules WHERE id = ?',
        [userScanRuleId],
        function (err, result) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('User scan rule deleted successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');
        }
    );
}

/**
 * POST /userScanRules
 *
 * Input: {
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }
 *
 * Output: 'User scan rule created successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.post(ROUTE.userScanRules, function (req, res) {

    var userScanRule = req.body;

    var successMessage = 'User scan rule created successfully.';

    insertIntoUserScanRules(userScanRule, res, 0, successMessage);

});

/**
 * GET /userScanRules
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }]
 */
app.get(ROUTE.userScanRules, function (req, res) {

    selectUserScanRules2(req, res, null, 0);

});

/**
 * GET /userScanRules/:id
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.userScanRules + '/:id', function (req, res) {

    var userScanRuleId = parseInt(req.params.id);

    var error = getIdParameterError(userScanRuleId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    selectUserScanRules2(req, res, userScanRuleId, 0);

});

/**
 * DELETE /userScanRules/:id
 *
 * Input: None
 *
 * Output: 'User scan rule deleted successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.delete(ROUTE.userScanRules + '/:id', function (req, res) {

    var userScanRuleId = parseInt(req.params.id);

    var error = getIdParameterError(userScanRuleId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    deleteUserScanRule(userScanRuleId, res);

});

/*******************************************************************************
 * User scan rule requests
 ******************************************************************************/

function getUserScanRuleRequestError(userScanRuleRequest) {

    var error = getUserScanRuleError(userScanRuleRequest);

    if (error) return error;

    if (!userScanRuleRequest.hasOwnProperty('isRequest') ||
        typeof userScanRuleRequest.isRequest != 'boolean') {
        return 'Is request invalid.';
    }

    return null;

}

/**
 * POST /userScanRuleRequests
 *
 * Input: {
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }
 *
 * Output: 'User scan rule request created successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.post(ROUTE.userScanRuleRequests, function (req, res) {

    var userScanRuleRequest = req.body;
    var user = req.user;

    userScanRuleRequest.userId = user.id;

    var error = getUserScanRuleError(userScanRuleRequest);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    var successMessage = 'User scan rule request created successfully.';
    insertIntoUserScanRules(userScanRuleRequest, res, 1, successMessage);

});

/**
 * GET /userScanRuleRequests
 *
 * If administrator or moderator, returns all user scan rule requests.
 * If normal user, returns user scan rule requests for that user only.
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }]
 */
app.get(ROUTE.userScanRuleRequests, function (req, res) {

    selectUserScanRules2(req, res, null, 1);

});

/**
 * GET /userScanRuleRequests/:id
 *
 * If administrator or moderator, returns any user scan rule request.
 * If normal user, returns the user scan rule if it belongs to that user.
 *
 * Input: None
 *
 * Output: {
 *   id: Number,
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)]
 * }
 *
 * or null if no results were found.
 */
app.get(ROUTE.userScanRuleRequests + '/:id', function (req, res) {

    var userScanRuleRequestId = parseInt(req.params.id);

    var error = getIdParameterError(userScanRuleRequestId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    selectUserScanRules2(req, res, userScanRuleRequestId, 1);

});

/**
 * PUT /userScanRuleRequests/:id
 *
 * Input: {
 *   userId: Number,
 *   scannerId: Number,
 *   startTime: String (Format 'HH:MM:SS'),
 *   endTime: String (Format 'HH:MM:SS'),
 *   startDate: String (Format 'YYYY-MM-DD'),
 *   endDate: String (Format 'YYYY-MM-DD'),
 *   daysOfWeek: [Number (1-Sunday, ..., 7-Monday)],
 *   isRequest: Boolean
 * }
 *
 * Output: 'User scan rule request updated successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.put(ROUTE.userScanRuleRequests + '/:id', function (req, res) {

    var userScanRuleRequestId = parseInt(req.params.id);
    var userScanRuleRequest = req.body;

    var idError = getIdParameterError(userScanRuleRequestId);

    if (idError) {
        sendInputParametersErrorResponse(idError);
        return;
    }

    var userError = getUserScanRuleRequestError(userScanRuleRequest);

    if (userError) {
        sendInputParametersErrorResponse(userError);
        return;
    }

    dbConnectionPool.query('UPDATE user_scan_rules ' +
        'SET user = ?, ' +
        'scanner = ?, ' +
        'start_time = ?, ' +
        'end_time = ?, ' +
        'start_date = ?, ' +
        'end_date = ?, ' +
        'is_request = ?, ' +
        'WHERE id = ?',
        [userScanRuleRequest.userId, userScanRuleRequest.scannerId,
            userScanRuleRequest.startTime, userScanRuleRequest.endTime,
            userScanRuleRequest.startDate, userScanRuleRequest.endDate,
            userScanRuleRequest.isRequest ? 1 : 0, userScanRuleRequestId],
        function (err, result) {

            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('User scan rule request updated successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');

        }
    );

});

/**
 * Method for approving a user scan rule request.
 */
app.patch(ROUTE.userScanRuleRequests + '/:id', function (req, res) {

    var method = req.query.method;

    if (!method || method.indexOf('approve') < 0) {
        res.status(422);
        res.send('Invalid method.');

        return;
    }

    var userScanRuleRequestId = parseInt(req.params.id);

    var error = getIdParameterError(userScanRuleRequestId);

    if (error) {
        sendInputParametersErrorResponse(error);
        return;
    }


    dbConnectionPool.query('UPDATE user_scan_rules ' +
        'SET is_request = 0 ' +
        'WHERE id = ?',
        [userScanRuleRequestId],
        function (err, result) {

            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (result.affectedRows > 0) {
                res.send('User scan rule request approved successfully.');
                return;
            }

            res.status(404);
            res.send('Id invalid.');

        }
    );

});

/**
 * DELETE /userScanRuleRequest/:id
 *
 * Input: None
 *
 * Output: 'User scan rule request deleted successfully.' (On success.)
 *         'Error.' (On error.)
 */
app.delete(ROUTE.userScanRuleRequests + '/:id', function (req, res) {

    var userScanRuleRequestId = parseInt(req.params.id);

    var error = getIdParameterError(userScanRuleRequestId);

    if (error) {
        sendInputParametersErrorResponse(res, error);
        return;
    }

    deleteUserScanRule(userScanRuleRequestId, res);

});

/**
 * GET /userScanTimes
 *
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   username: Number,
 *   scannerUid: Number,
 *   scanTimestamp: Number
 * }]
 */
app.get(ROUTE.userScanTimes, function (req, res) {

    dbConnectionPool.query('SELECT user_scan_times.id AS id,' +
        'user_scan_times.scan_timestamp AS scanTimestamp, ' +
        'users.username AS username, ' +
        'scanners.uid AS scannerUid ' +
        'FROM user_scan_times ' +
        'LEFT OUTER JOIN users ON user_scan_times.user = users.id ' +
        'LEFT OUTER JOIN scanners ON user_scan_times.scanner = scanners.id ',
        [],
        function (err, results) {

            if (err) {
                res.status(500);
                res.send(err);

                return;
            }

            res.send(results);

        }
    );

});

/*******************************************************************************
 * Application start
 ******************************************************************************/

app.listen(argv.webport);

/*******************************************************************************
 * Mqtt utilities
 ******************************************************************************/

function getScannerUidFromSubscribeTopic(subscribeTopic) {

    return subscribeTopic.slice(8, subscribeTopic.indexOf('/', 8));

}

function yyyymmddhhmmssToMysqlDateString(yyyymmddhhmmss) {

    var mysqlDateString = ''; // Should be formatted like: YYYY-MM-DD

    // YYYY-
    mysqlDateString += yyyymmddhhmmss.slice(0, 4);
    mysqlDateString += '-';
    // MM-
    mysqlDateString += yyyymmddhhmmss.slice(4, 6);
    mysqlDateString += '-';
    // DD
    mysqlDateString += yyyymmddhhmmss.slice(6, 8);
    
    return mysqlDateString;

}

function yyyymmddhhmmssToMysqlTimeString(yyyymmddhhmmss) {
    
    var mysqlTimString = ''; // Should be formatted like HH:MM:SS
    
    // HH:
    mysqlTimString += yyyymmddhhmmss.slice(8, 10);
    mysqlTimString += ':';
    // MM:
    mysqlTimString += yyyymmddhhmmss.slice(10, 12);
    mysqlTimString += ':';
    // SS
    mysqlTimString += yyyymmddhhmmss.slice(12, 14);
    
    return mysqlTimString;
    
}

function yyyymmddhhmmssToMysqlTimestamp(yyyymmddhhmmss) {

    var mysqlTimestamp = ''; // Should be formatted like: 2012-12-31 11:30:45

    mysqlTimestamp += yyyymmddhhmmssToMysqlDateString(yyyymmddhhmmss);
    
    mysqlTimestamp += ' ';

    mysqlTimestamp += yyyymmddhhmmssToMysqlTimeString(yyyymmddhhmmss);

    return mysqlTimestamp;

}

/*******************************************************************************
 * Mqtt client
 ******************************************************************************/

var mqtt = require('mqtt');

client = mqtt.createClient(argv.mosquittoPort, argv.mosquittoHost);

var subscribeTopic = 'iot/nfc/+/tag';

client.subscribe(subscribeTopic);

var publishTopicTemplate = 'iot/nfc/:scannerUid/command';

client.on('message', function (topic, message) {

    console.log('Topic: ' + topic);
    console.log('Message: ' + message);

    /*
     Message format:
     'YYYYMMDDhhmmss rfid_nfc_uid'
     */
    var scanTime = message.slice(0, 14);
    var tagUid = message.slice(15);
    var scannerUid = getScannerUidFromSubscribeTopic(topic);
    var publishTopic = publishTopicTemplate.replace(':scannerUid', scannerUid);
    var scanTimeMysqlTimestamp = yyyymmddhhmmssToMysqlTimestamp(scanTime);
    var scanTimeTimeString = yyyymmddhhmmssToMysqlTimeString(scanTime);
    var scanTimeDateString = yyyymmddhhmmssToMysqlDateString(scanTime);

    /**
     *
     * This query inserts a new tag into the database.
     * If the tag already exists an error is thrown base on the unique
     * constraint and nothing is inserted.
     *
     */
    var query = 'INSERT INTO tags(uid) VALUES (?)';
    var parameters = [tagUid];

    dbConnectionPool.query(query, parameters, function (err, result) {

            if (err) {
                // Do nothing if the tag already exists inside the database.
            }

        }
    );

    /**
     *
     * Note:
     * This query does the following:
     *   1. Checks scan rules for permission to scan a tag at a given time.
     *   2. Gets the user id and scanner id to insert into user_scan_times.
     *   3. Checks for user scan rule validity.
     *   4. Inserts the new user scan time into user_scan_times.
     *
     * IMPORTANT:
     *
     *   The database must be set to UTC time in order for this to work
     *   correctly.
     *
     *   Works only for the UTC+01:00 time zone correctly.
     *
     */
    query = 'INSERT INTO user_scan_times(user, ' +
                                        'scanner, ' +
                                        'response_command, ' +
                                        'scan_timestamp) ' +
        'SELECT DISTINCT ' +
            '(SELECT users.id ' +
             'FROM users, tags ' +
             'WHERE users.id = tags.user AND ' +
                   'tags.uid = ?), ' +
            '(SELECT id FROM scanners WHERE scanners.uid = ?), ' +
            '?, ' +
            '? ' +
        'FROM user_scan_rules ' +
            'LEFT OUTER JOIN user_scan_rule_days ' +
            'ON user_scan_rules.id = user_scan_rule_days.user_scan_rule ' +
        'WHERE ' +
            'user_scan_rules.start_time <= ? AND ' +
            'user_scan_rules.end_time >= ? AND ' +
            'user_scan_rules.start_date <= ? AND ' +
            'user_scan_rules.end_date >= ? AND ' +
            'user_scan_rule_days.day_of_week = DAYOFWEEK(?) AND ' +
            'user_scan_rules.is_request = 0 ' +
        'LIMIT 1';

    parameters = [tagUid, scannerUid, 'PERMIT', scanTimeMysqlTimestamp, 
        scanTimeTimeString, scanTimeTimeString, scanTimeDateString, 
        scanTimeDateString, scanTimeDateString];

    //parameters = [tagUid, scannerUid, 'PERMIT', scanTimeMysqlTimestamp];

    dbConnectionPool.query(query, parameters, function (err, result) {

            if (err || result.affectedRows <= 0) {
                console.log('Publishing DENY to topic ' + publishTopic);

                client.publish(publishTopic, 'DENY');

                return;
            }

            console.log('Publishing PERMIT to topic ' + publishTopic);

            client.publish(publishTopic, 'PERMIT');

        }
    );

});

process.on('SIGTERM', function () {

    client.end();
    process.exit(0);

});
