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
    '  --dbhost      <database_host>(*required)\n' +
    '  --dbport      <database_port>(*required)\n' +
    '  --dbuser      <database_user>(*required)\n' +
    '  --dbpassword  <database_password>(*required)\n' +
    '  --dbname      <database_name>(*required)\n' +
    '  --webport     <web_server_port>(*required)\n' +
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
    || !argv.webport) {
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
    login: '/login',
    logout: '/logout',
    scanners: '/scanners',
    users: '/users',
    roles: '/roles',
    tags: '/tags',
    userScanRules: '/userScanRules',
    userScanRuleRequests: '/userScanRuleRequests'
};

/*******************************************************************************
 * Filters
 ******************************************************************************/

// Automatic request JSON parsing
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // for parsing
                                                  // application/x-www-form-urlencoded

// User authentication

var ROLE = {
    administrator: 1,
    moderator: 2,
    user: 3
};

// TODO: Resource access restrictions by user role.

/*******************************************************************************
 * Authentication
 ******************************************************************************/

app.use(function (req, res, next) {

    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    }

    dbConnectionPool.query('SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS roleId ' +
        'FROM users ' +
        'WHERE username = ? AND password = ?',
        [user.name, user.pass],
        function (err, results) {
            if (err) {
                res.status(500);
                res.send(err);
                return;
            }

            if (results.length > 0) {
                req.user = results[0];
                return next();
            } else {
                return unauthorized(res);
            }
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

    if (!id || !(typeof id === 'number')) {
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

    if (!scanner.hasOwnProperty('uid')) {
        return 'UID invalid.';
    }

    if (!scanner.hasOwnProperty('description')) {
        return 'Description invalid.';
    }

    if (!(typeof scanner.uid === 'string') || !scanner.uid.length >= 1) {
        return 'UID too short. (1 character min.)';
    }

    if (!(typeof scanner.description === 'string') ||
        !scanner.description.length >= 5) {
        return 'Description too short. (5 characters min.)';
    }

    return null;

}

function sendInputParametersErrorResponse(res, error) {

    res.status(422);
    res.send(error);

}

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

    if (!user.hasOwnProperty('username')) {
        return 'Username invalid.';
    }

    if (!user.hasOwnProperty('password')) {
        return 'Password invalid.';
    }

    if (!user.hasOwnProperty('role')) {
        return 'Role invalid';
    }

    if (!(typeof user.username === 'string') ||
        !user.username.length >= 5) {
        return 'Username invalid. (5 characters min.)';
    }

    if (!(typeof user.password === 'string') ||
        !user.password.length >= 6) {
        return 'Password invalid. (6 characters min.)';
    }

    if (!(typeof user.role === 'number') || !(user.role >= 1 && user.role <= 3)) {
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
 * Input: None
 *
 * Output: [{
 *   id: Number,
 *   username: String,
 *   password: String,
 *   role: String
 * }]
 */
app.get(ROUTE.users, function (req, res) {

    dbConnectionPool.query('SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS role ' +
        'FROM users',
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

    dbConnectionPool.query('SELECT id AS id, ' +
        'username AS username, ' +
        'password AS password, ' +
        'role AS role ' +
        'FROM users ' +
        'WHERE id = ?',
        [userId],
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

    if (!tag.hasOwnProperty('uid')) {
        return 'UID invalid.';
    }

    if (!tag.hasOwnProperty('userId')) {
        return 'User id invalid.';
    }

    if (!(typeof tag.uid === 'string') || tag.uid.length < 1) {
        return 'UID invalid. (1 characters min.)';
    }

    if (!(typeof tag.userId === 'number') || tag.userId < 0) {
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

    dbConnectionPool.query('SELECT id AS id, ' +
        'uid AS uid, ' +
        'user AS userId ' +
        'FROM tags',
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

    if (!userScanRule.hasOwnProperty('userId')) {
        return 'User id invalid.';
    }

    if (!userScanRule.hasOwnProperty('scannerId')) {
        return 'Scanner id invalid.';
    }

    if (!userScanRule.hasOwnProperty('startTime')) {
        return 'Start time invalid.';
    }

    if (!userScanRule.hasOwnProperty('endTime')) {
        return 'End time invalid.';
    }

    if (!userScanRule.hasOwnProperty('startDate')) {
        return 'Start date invalid.';
    }

    if (!userScanRule.hasOwnProperty('endDate')) {
        return 'End date invalid.';
    }

    if (!userScanRule.hasOwnProperty('daysOfWeek')) {
        return 'Days of week invalid.';
    }

    if (!(typeof userScanRule.userId === 'number') ||
        userScanRule.userId <= 0) {
        return 'User id invalid. (Number greater than 0.)';
    }

    if (!(typeof userScanRule.scannerId === 'number') ||
        userScanRule.scannerId <= 0) {
        return 'Scanner id invalid. (Number greater than 0.)';
    }

    if (!isTime(userScanRule.startTime)) {
        return 'Start time invalid. (Must be formatted like HH:MM:SS)';
    }

    if (!isTime(userScanRule.endTime)) {
        return 'End time invalid. (Must be formatted like HH:MM:SS)';
    }

    if (compareTimes(userScanRule.startTime, userScanRule.endTime) != -1) {
        return 'Times invalid. (End time must be greater than start time.)';
    }

    if (!isDate(userScanRule.startDate)) {
        return 'Start date invalid. ' +
            '(Start date must be formatted like YYYY-MM-DD.)';
    }

    if (!isDate(userScanRule.endDate)) {
        return 'End date invalid. ' +
            '(End date must be formatted like YYYY-MM-DD.)';
    }

    if (compareDates(userScanRule.startDate, userScanRule.endDate) != -1) {
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

        var error = 'Days of week invalid. ' +
            '(1 - 7 representing sunday through monday. ' +
            'Cannot be more than 7 days. Days cannot repeat.)';
        return error;
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

function selectUserScanRules(userId, userRole, userScanRuleRequestId,
                             isRequest, res) {

    var selectQuery = 'SELECT id AS id, ' +
        'user AS userId, ' +
        'scanner AS scannerId, ' +
        'start_time AS startTime, ' +
        'end_time AS endTime, ' +
        'start_date AS startDate, ' +
        'end_date AS endDate ' +
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

    selectUserScanRules(null, null, null, 0, res);

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

    selectUserScanRules(null, null, userScanRuleId, 0, res);

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

    if (!userScanRuleRequest.hasOwnProperty('isRequest')) {
        return 'Is request invalid.';
    }

    if (!(typeof userScanRuleRequest.isRequest === 'boolean')) {
        return 'Is request invalid';
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

    var user = req.user;

    selectUserScanRules(user.id, user.role, null, 1, res);

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

    var user = req.user;

    selectUserScanRules(user.id, user.role, userScanRuleRequestId, 1, res);

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

/*******************************************************************************
 * Serving static files
 ******************************************************************************/

app.use(express.static(__dirname + '/../client'));

/*******************************************************************************
 * Application start
 ******************************************************************************/

app.listen(argv.webport);

/*******************************************************************************
 * Mqtt client
 ******************************************************************************/

var mqtt = require('mqtt');

client = mqtt.createClient(1883, 'localhost');

var subscribeTopic = 'iot/nfc/*/tag';

client.subscribe(subscribeTopic);

/*******************************************************************************
 * Mqtt utilities
 ******************************************************************************/

function getScannerIdFromSubscribeTopic(subscribeTopic) {

    return subscribeTopic.slice(8).slice(0, subscribeTopic.indexOf('/'));

}

function buildResponseTopic(subscribeTopic) {

    var scannerIdPlaceholder = ':scannerId';
    var responseTopicTemplate = 'iot/nfc/' + scannerIdPlaceholder + '/command';
    var scannerId = getScannerIdFromSubscribeTopic(subscribeTopic);

    return responseTopicTemplate.replace(scannerIdPlaceholder, scannerId);

}


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
