var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');

// INPUT DIAGRAM 
var input = require('./parse.json');
const actors = input.processes;
const diagram = input.diagram.content;

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);
  var environment = worker.options.environment;

  var app = express();

  var httpServer = worker.httpServer;
  var scServer = worker.scServer;

  if (environment == 'dev') {
    // Log every HTTP request. See https://github.com/expressjs/morgan for other
    // available formats.
    app.use(morgan('dev'));
  }
  app.use(serveStatic(path.resolve(__dirname, 'public')));

  // Add GET /health-check express route
  healthChecker.attach(worker, app);

  httpServer.on('request', app);

  var indexDiagram = 0;
  var indexMessage = 0;

  /*
    In here we handle our incoming realtime connections and listen for events.
  */
  scServer.on('connection', function (socket) {

    // Some sample logic to show how to handle client events,
    // replace this with your own logic

    socket.on('sampleClientEvent', function (data) {
      console.log('Handled sampleClientEvent', data);
      scServer.exchange.publish('sample', count);
    });

    var interval = setInterval(function () {
      if(indexMessage < diagram[indexDiagram].content.length){
        socket.emit('word', {
        from: diagram[indexDiagram].content[indexMessage].from , 
        to: diagram[indexDiagram].content[indexMessage].to, 
        message: diagram[indexDiagram].content[indexMessage].message  
      });
      indexMessage++;
      if(indexMessage >= diagram[indexDiagram].content.length && indexDiagram < diagram.length){
        indexMessage=0;
        indexDiagram++;
      }
      }
    }, 1000);

    socket.on('disconnect', function () {
      clearInterval(interval);
    });
  });
};
