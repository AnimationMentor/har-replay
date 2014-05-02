#!/usr/bin/env node

'use strict';

// Loading modules
var fs = require("fs");
var _ = require("underscore");
var request = require("request");
var moment = require("moment");
var commander = require("commander");
var multimeter = require("multimeter");
var glob = require("glob");

commander
    .option('-s, --site <site>', 'only fire requests that are for this domain (ignore everything else)')
    .option('-f, --files <glob>', 'A glob pattern of paths to HAR files to replay')
    .option('-q, --quiet', 'Do not display any http errors')
    .option('-d, --delaymax <secs>', 'Max number of seconds to delay before starting each script run. Default:0', 0)
    .parse(process.argv);

// Check arguments (files is required)
if (commander.files == undefined){
    commander.outputHelp();
    process.exit();
}

function gracefulExit(){
    multi.write('\nExiting... (you may have to use `stty echo` to fix your terminal)\n');
    process.exit();
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

var multi = multimeter(process);
multi.charm.reset();
multi.on('^C', gracefulExit);
multi.on('^D', gracefulExit);
var bars = [];

multi.write('Running HAR scripts (ctrl-D to exit):\n\n');

// Don't worry about any bad https certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

glob(commander.files, function(er, files){
    var filenames = [],
        maxNameLen = 0;

    _.forEach(files, function(file, i) {
        var filename = file.split('/').pop().split('.')[0];
        maxNameLen = Math.max(filename.length, maxNameLen);
        filenames.push(filename);
    });

    _.forEach(filenames, function(filename, i) {
        multi.write(filename + ': \n');

        var bar = multi(maxNameLen + 3, i+3, {
            width : 80,
            solid : {
                text : '|',
                foreground : 'white',
                background : 'blue'
            },
            empty : { text : ' ' },
        });
        bars.push(bar);
    });

    multi.write('\n----- ' + (commander.quiet ? 'Errors Surpressed' : 'Errors Below') + ' -----\n');

    // Do the Bartman! :)
    _.forEach(files, function(file, fileIndex) {
        fs.readFile(file, function(err, data) {
            if (err) throw err;

            // Delay for a random number of millisecs 
            _.delay(function() {
                var har = JSON.parse(data),
                    basetime = moment(har['log']['entries'][0]['startedDateTime']),
                    expectedEvents = 0,
                    completedEvents = 0;

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

                            if (!response && !commander.quiet){
                                multi.write(new Date() +'\t'+ entry.request.method +'\t\t\t'+ file +'\t'+ entry.request.url + '\t' + error + '\n');
                            } else if (response.statusCode != 200 && !commander.quiet){
                                multi.write(new Date() +'\t'+ entry.request.method +'\t'+ response.statusCode +'\t'+ file +'\t'+ entry.request.url +'\t'+ body + '\n');
                            } else {
                                // All good, do nothing
                            }

                            completedEvents++;

                            bars[fileIndex].percent((completedEvents/expectedEvents) * 100);
                        });

                        // Garbage collect, if we can (if started with --expose-gc)
                        if (global.gc) {
                            global.gc();
                        }

                    }, diff);

                    expectedEvents++;
                });
            }, Math.random() * commander.delaymax * 1000);

        });
    });
});

