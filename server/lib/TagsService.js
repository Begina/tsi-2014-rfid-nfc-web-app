var TagsService = function (dbConnectionPool) {
    this.create = function (tag, onCreated) {
        dbConnectionPool.query('INSERT INTO tags(uid, description) ' +
            'VALUES (?,?)', [tag.uid, tag.description],
            function (err, result) {
                if (onCreated) onCreated();
            }
        );
    };

    this.getAll = function (onTags) {
        if (!onTags) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM tags',
            function (err, results) {
                onTags(results);
            }
        );
    };

    this.getAllUnassigned = function (onTags) {
        if (!onTags) { // No need to query if results are not used.
            return;
        }

        dbConnectionPool.query('SELECT * FROM tags WHERE user IS NULL',
            function (err, results) {
                onTags(results);
            }
        );
    };

    this.getById = function (id, onTag) {
        if (!onTag) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM tags WHERE id=?', [id],
            function (err, results) {
                var result = null;
                if (results.length > 0) {
                    result = results[0]; // Must be one result. (Id is unique.)
                }

                onTag(result);
            }
        );
    };

    this.remove = function (id, onTagRemoved) {
        dbConnectionPool.query('DELETE FROM tags WHERE id=?', [id],
            function (err, result) {
                if (onTagRemoved) onTagRemoved();
            }
        );
    };
};

module.exports = TagsService;
