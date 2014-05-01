#!/usr/bin/env node

'use strict';

// Loading modules
var fs = require("fs");
var _ = require("underscore");
var _s = require('underscore.string');
var request = require("request");
var moment = require("moment");
var commander = require("commander");

commander
    .option('-s, --site <site>', 'only fire requests that are for this domain (ignore everything else)')
    .option('-f, --file <file>', 'HAR file to replay')
    .parse(process.argv);

// Check arguments (file is required)
if (commander.file == undefined) {
    commander.outputHelp();
    process.exit();
}

// Don't worry about any bad https certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Do the Bartman! :)
fs.readFile(commander.file, function(err, data) {
    if (err) throw err;

    var har = JSON.parse(data),
        basetime = moment(har['log']['entries'][0]['startedDateTime']);

    // Passing in an object
    _.forEach(har['log']['entries'], function(entry) {

        // Ignore other sites if so requested
        if (commander.site != undefined && entry.request.url.split('://')[1].split('/')[0] != commander.site)
            return;

        // How late did this request happen?
        var diff = moment(entry['startedDateTime']).diff(basetime, 'miliseconds');

        // Send a request into the future
        _.delay(function() {
            // New request
            var req = request({
                url: entry.request.url,
                method: entry.request.method,
                // reformat headers from HAR format to a dict
                headers: _.reduce(entry.request.headers, function(memo, e) {
                    memo[e['name']] = e['value'];
                    return memo;
                }, {})
            }, function(error, response, body) {
                // Just print a status, drop the files as soon as possible
                console.log(entry.request.url + " " + entry.request.method + (response ? " => " + response.statusCode: " X> " + error + ':' + body));
            });

            // Garbage collect, if we can (if started with --expose-gc)
            if (global.gc) {
                global.gc();
            }
        }, diff);
    });
});

