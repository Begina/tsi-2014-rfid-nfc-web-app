var NfcsService = function (dbConnectionPool) {
    this.create = function (nfc, onCreated) {
        dbConnectionPool.query('INSERT INTO nfcs(tag, description) ' +
            'VALUES (?,?)', [nfc.tag, nfc.description],
            function (err, result) {
                if (onCreated) onCreated();
            }
        );
    };

    this.getAll = function (onNfcs) {
        if (!onNfcs) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM nfcs WHERE user IS NULL',
            function (err, results) {
                onNfcs(results);
            }
        );
    };

    this.getById = function (id, onNfc) {
        if (!onNfc) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM nfcs WHERE id=?', [id],
            function (err, results) {
                var result = null;
                if (results.length > 0) {
                    result = results[0]; // Must be one result. (Id is unique.)
                }

                onNfc(result);
            }
        );
    };

    this.update = function (nfc, onNfcUpdated) {
        dbConnectionPool.query('UPDATE rfids SET ? WHERE id=?',
            [{tag: nfc.tag, description: nfc.description}, nfc.id],
            function (err, result) {
                if (onNfcUpdated) onNfcUpdated();
            }
        );
    };

    this.remove = function (id, onNfcRemoved) {
        dbConnectionPool.query('DELETE FROM nfcs WHERE id=?', [id],
            function (err, result) {
                if (onNfcRemoved) onNfcRemoved();
            }
        );
    };
};

module.exports = NfcsService;
