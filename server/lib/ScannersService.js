var ScannersService = function (dbConnectionPool) {
    this.create = function (scanner, onCreated) {
        dbConnectionPool.query('INSERT INTO scanners(uid, description) ' +
            'VALUES (?,?)', [scanner.uid, scanner.description],
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
        dbConnectionPool.query('UPDATE scanners SET ? WHERE id=?',
            [{uid: scanner.uid, description: scanner.description}, scanner.id],
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
