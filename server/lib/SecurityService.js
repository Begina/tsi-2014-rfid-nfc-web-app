// Type definition
UserSession = function (username, key, role) {
    this.username = username;
    this.key = key;
    this.role = role;
};

var SecurityService = function (dbConnectionPool) {
    var me = this;

    var userSessions = [];

    var generateToken = function (username, password) {
        return username + password; // TODO: Improve key generation algorithm.
    };

    var isLoggedIn = function (username) {
        for (var i = 0; i < userSessions.length; i++) {
            var userSession = userSessions[i];
            if (userSession.username === username) {
                return true;
            }
        }

        return false;
    };

    var areLoginCredentialsCorrect = function (credentials,
                                               onCredentialsCorrect,
                                               onCredentialsIncorrect) {
        dbConnectionPool.query('CALL areLoginCredentialsCorrect(?,?)',
            [credentials.username, credentials.password],
            function (err, rows, fields) {
                if (rows[0][0].are_credentials_correct === 0 && // 0 - invalid
                    onCredentialsIncorrect) {
                    onCredentialsIncorrect();
                } else if (onCredentialsCorrect) {
                    onCredentialsCorrect();
                }
            }
        );
    };

    var getRole = function (username, onRoleReceived) {
        dbConnectionPool.query('CALL getRole(?)', [username],
            function (err, rows, fields) {
                if (onRoleReceived) onRoleReceived(rows[0][0].role);
            }
        );
    };

    var getUserSession = function (username) {
        for (var i = 0; i < userSessions.length; i++) {
            var us = userSessions[i];
            if (us.username === username) {
                return us;
            }
        }

        return null;
    };

    this.login = function (credentials, onLoggedIn, onFail) {
        if (isLoggedIn(credentials.username)) {
            onLoggedIn(getUserSession(credentials.username));
            return;
        }

        var onLoginCredentialsCorrect = function () {
            getRole(credentials.username, function (role) {
                var userSession = {
                    username: credentials.username,
                    token: generateToken(credentials.username,
                        credentials.password),
                    role: role
                };

                userSessions.push(userSession);

                if (onLoggedIn) onLoggedIn(userSession);
            });
        };

        var onLoginCredentialsIncorrect = function () {
            if (onFail) onFail('Login credentials invalid.');
        };

        areLoginCredentialsCorrect(credentials,
            onLoginCredentialsCorrect, onLoginCredentialsIncorrect);
    };

    this.logout = function (userSession, onLoggedOut, onFail) {
        for (var i = 0; i < userSessions.length; i++) {
            var us = userSessions[i];
            if (us.username === userSession.username &&
                us.token === userSession.token) {
                userSessions.splice(i, 1); // Remove userSession[i].

                if (onLoggedOut) onLoggedOut();

                return;
            }
        }

        if (onFail) onFail('Trying to forge a logout? The user is already ' +
        'logged out or the user does not exist.');
    };

    this.isTokenValid = function (token) {
        for (var i = 0; i < userSessions.length; i++) {
            var us = userSessions[i];
            if (us.token === token) {
                return true;
            }
        }

        return false;
    };

    this.isRole = function (token, role) {
        for (var i = 0; i < userSessions.length; i++) {
            var userSession = userSessions[i];
            if (userSession.token == token &&
                userSession.role == role) {
                return true;
            }
        }

        return false;
    };
};

module.exports = SecurityService;
