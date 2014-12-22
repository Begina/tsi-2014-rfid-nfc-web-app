var ScannersService = function (dbConnectionPool) {
    var buildScannerCommandsField = function (scanner) {
        var commands = '';
        scanner.commands.forEach(function (command) {
            commands += command + ',';
        });

        return commands;
    };

    this.create = function (scanner, onCreated) {
        var commands = buildScannerCommandsField(scanner);
        dbConnectionPool.query('CALL createScanner(?, ?, ?) ', 
            [scanner.uid, scanner.description, commands],
            function (err, result) {
                if (onCreated) onCreated();
            }
        );
    };

    this.getAll = function (onScanners) {
        if (!onScanners) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM scanners', 
            function (err, results) {
                onScanners(results);
            });
    };

    this.getById = function (id, onScanner) {
        if (!onScanner) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM scanners WHERE id=?', [id],
            function (err, results) {
                var result = null;
                if (results.length > 0) {
                    result = results[0]; // Must be one result. (Id is unique.)
                }

                onScanner(result);
            }
        );
    };

    this.update = function (scanner, onScannerUpdated) {
        var commands = buildScannerCommandsField(scanner);
        dbConnectionPool.query('CALL updateScanner(?, ?, ?, ?)',
            [scanner.id, scanner.uid, scanner.description, commands],
            function (err, result) {
                if (onScannerUpdated) onScannerUpdated();
            }
        );
    };

    this.remove = function (id, onScannerRemoved) {
        dbConnectionPool.query('DELETE FROM scanners WHERE id=?', [id],
            function (err, result) {
                if (onScannerRemoved) onScannerRemoved();
            }
        );
    };
};

module.exports = ScannersService;
