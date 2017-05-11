'use strict';

var async = require('async');
var winston = require('winston');
var validator = require('validator');
var cronJob = require('cron').CronJob;

var db = require('../database');
var analytics = require('../analytics');

var errors = module.exports;

var counters = {};

new cronJob('0 * * * * *', function () {
	errors.writeData();
}, null, true);

errors.writeData = function () {
	var dbQueue = [];
	if (Object.keys(counters).length > 0) {
		for (var key in counters) {
			if (counters.hasOwnProperty(key)) {
				dbQueue.push(async.apply(db.sortedSetIncrBy, 'errors:404', counters[key], key));
			}
		}
		counters = {};
		async.series(dbQueue, function (err) {
			if (err) {
				winston.error(err);
			}
		});
	}
};

errors.log404 = function (route, callback) {
	callback = callback || function () {};
	if (!route) {
		return setImmediate(callback);
	}
	route = route.replace(/\/$/, '');	// remove trailing slashes
	analytics.increment('errors:404');
	counters[route] = counters[route] || 0;
	counters[route] += 1;
	setImmediate(callback);
};

errors.get = function (escape, callback) {
	async.waterfall([
		function (next) {
			db.getSortedSetRevRangeWithScores('errors:404', 0, 199, next);
		},
		function (data, next) {
			data = data.map(function (nfObject) {
				nfObject.value = escape ? validator.escape(String(nfObject.value || '')) : nfObject.value;
				return nfObject;
			});

			next(null, data);
		},
	], callback);
};

errors.clear = function (callback) {
	db.delete('errors:404', callback);
};
