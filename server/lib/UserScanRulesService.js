var UserScanRulesService = function (dbConnectionPool) {
	
	/**
	 * For creating a rule for a day of week the userScanRule should be:
	 * {
	 *   userId: Number,
	 *   scannerId: Number,
	 *   dayOfWeek: Number,
	 *   timeStart: Time,
	 *   timeEnd: Time,
	 *   responseScannerCommandId: Number,
	 *   validFrom: Date,
	 *   validTo: Date
	 * }
	 * dayOfWeek = 0-Monday, 1-Tuesday, 2-Wednesday, 3-Thursday, 4-Friday,
	 *             5-Saturday, 6-Sunday.
	 * 
	 * For creating a rule for a date the userScanRule should be:
	 * {
	 *   userId: Number,
	 *   scannerId: Number,
	 *   timeStart: Time,
	 *   timeEnd: Time,
	 *   responseScannerCommandId: Number,
	 *   validFrom: Date,
	 *   validTo: Date
	 * }
	 * Fields validFrom and validTo should contain the same date.
	 */
	this.create = function (userScanRule, onCreated) {
		if (userScanRule.weekDay) {
			dbConnectionPool.query(
				'CALL createUserDayOfWeekScanRule(?, ?, ?, ?, ?, ?, ?, ?)',
				[userScanRule.userId, userScanRule.scannerId, 
				 userScanRule.dayOfWeek, userScanRule.timeStart, 
				 userScanRule.timeEnd, userScanRule.responseScannerCommandId,
				 userScanRule.validFrom, userScanRule.validTo],
				function (err, result) {
					if (onCreated) onCreated();
				});
		} else {
			dbConnectionPool.query(
				'CALL createUserDateScanRule(?, ?, ?, ?, ?, ?)',
				[userScanRule.userId, userScanRule.scannerId, 
				 userScanRule.timeStart, userScanRule.timeEnd, 
				 userScanRule.responseScannerCommandId, userScanRule.validFrom,
				 userScanRule.validTo],
				function (err, result) {
					if (onCreated) onCreated();
				});
		}
	};
};

module.exports = UserScanRulesService;
