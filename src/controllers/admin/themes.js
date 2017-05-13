'use strict';

var path = require('path');
var file = require('../../file');

var themesController = {};

themesController.get = function (req, res, next) {
	var themeDir = path.join(__dirname, '../../../node_modules/' + req.params.theme);
	file.exists(themeDir, function (err, exists) {
		if (err || !exists) {
			return next(err);
		}

		var themeConfig = require(path.join(themeDir, 'theme.json'));
		var screenshotPath = path.join(themeDir, themeConfig.screenshot);

		function sendDefault() {
			res.sendFile(path.join(__dirname, '../../../public/images/themes/default.png'));
		}

		if (themeConfig.screenshot) {
			file.exists(screenshotPath, function (err, exists) {
				if (err) {
					return next(err);
				}
				if (exists) {
					return res.sendFile(screenshotPath);
				}
				sendDefault();
			});
		} else {
			sendDefault();
		}
	});
};

module.exports = themesController;
