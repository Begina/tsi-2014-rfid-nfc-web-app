var RolesService = function (dbConnectionPool) {
    this.getAll = function (onRoles) {
        if (!onRoles) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM roles', function (err, results) {
            onRoles(results);
        });
    };
};

module.exports = RolesService;
