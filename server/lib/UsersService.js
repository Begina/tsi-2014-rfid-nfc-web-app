var UsersService = function (dbConnectionPool) {
    this.create = function (user, onCreated) {
        dbConnectionPool.query('CALL createUser(?, ?, ?, ?) ', [user.username,
                user.password, user.role, user.tag], function (err, result) {
                if (onCreated) onCreated();
            }
        );
    };

    this.getAll = function (onUsers) {
        if (!onUsers) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM users_all',
            function (err, results) {
                onUsers(results);
            }
        );
    };

    this.getById = function (id, onUser) {
        if (!onUser) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM users_all WHERE user_id=?', [id],
            function (err, results) {
                var result = null;
                if (results.length > 0) {
                    result = results[0]; // Must be one result. (Id is unique.)
                }

                onUser(result);
            }
        );
    };

    this.update = function (user, onUserUpdated) {
        dbConnectionPool.query('CALL updateUser(?, ?, ?, ?, ?)',
            [user.user_id, user.username, user.password, user.role, user.tag],
            function (err, result) {
                if (onUserUpdated) onUserUpdated();
            }
        );
    };

    this.remove = function (id, onUserRemoved) {
        dbConnectionPool.query('CALL deleteUser(?)', [id],
            function (err, result) {
                if (onUserRemoved) onUserRemoved();
            }
        );
    };
};

module.exports = UsersService;
