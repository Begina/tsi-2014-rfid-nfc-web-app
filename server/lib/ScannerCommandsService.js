var ScannerCommandsService = function (dbConnectionPool) {
    this.getById = function (scannerId, onCommands) {
        if (!onCommands) {
            return;
        }

        dbConnectionPool.query('SELECT * FROM scanner_commands WHERE scanner=?', 
            [scannerId],
            function (err, results) {
                onCommands(results);
            }
        );
    };
};

module.exports = ScannerCommandsService;
