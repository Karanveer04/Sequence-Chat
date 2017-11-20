var SCWorker = require('socketcluster/scworker');
var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');


var jsonData;

class Worker extends SCWorker {
    run() {
        console.log('   >> Worker PID:', process.pid);
        var environment = this.options.environment;

        var app = express();

        var httpServer = this.httpServer;
        var scServer = this.scServer;
//testets
        if (environment == 'dev') {
            // Log every HTTP request. See https://github.com/expressjs/morgan for other
            // available formats.
            app.use(morgan('dev'));
        }
        app.use(serveStatic(path.resolve(__dirname, 'public')));

        // Add GET /health-check express route
        healthChecker.attach(this, app);

        httpServer.on('request', app);

        var count = 0;

        /*
          In here we handle our incoming realtime connections and listen for events.
        */
        scServer.on('connection', function (socket) {
            // Some sample logic to show how to handle client events,
            // replace this with your own logic

            socket.on('go', function (jsonData) {
                //Read the JSON input
                //Loop throw the conent of the JSON and send it to frontend
                var data = JSON.parse(jsonData);
                data.diagram.content.forEach(function (array) {
                    array.content.forEach(function (x) {
                        scServer.exchange.publish('sample', {
                            from: x.from,
                            to: x.to,
                            message: x.message
                        })
                        //sleep(1000)
                    })
                })

            })

            var interval = setInterval(function () {
                socket.emit('rand', {
                    rand: Math.floor(Math.random() * 5)
                });
            }, 1000);

            socket.on('disconnect', function () {
                clearInterval(interval);
            });
        });
    }
}
new Worker();
