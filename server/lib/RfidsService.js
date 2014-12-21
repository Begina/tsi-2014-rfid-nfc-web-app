var RfidsService = function (dbConnectionPool) {
    this.create = function (rfid, onCreated) {
        dbConnectionPool.query('INSERT INTO rfids(uid, description) ' +
            'VALUES (?,?)', [rfid.uid, rfid.description],
            function (err, result) {
                if (onCreated) onCreated();
            }
        );
    };

    this.getAll = function (onRfids) {
        if (!onRfids) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM rfids', function (err, results) {
            onRfids(results);
        });
    };

    this.getById = function (id, onRfid) {
        if (!onRfid) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM rfids WHERE id=?', [id],
            function (err, results) {
                var result = null;
                if (results.length > 0) {
                    result = results[0]; // Must be one result. (Id is unique.)
                }

                onRfid(result);
            }
        );
    };

    this.update = function (rfid, onRfidUpdated) {
        dbConnectionPool.query('UPDATE rfids SET ? WHERE id=?',
            [{uid: rfid.uid, description: rfid.description}, rfid.id],
            function (err, result) {
                if (onRfidUpdated) onRfidUpdated();
            }
        );
    };

    this.remove = function (id, onRfidRemoved) {
        dbConnectionPool.query('DELETE FROM rfids WHERE id=?', [id],
            function (err, result) {
                if (onRfidRemoved) onRfidRemoved();
            }
        );
    };
};

module.exports = RfidsService;
