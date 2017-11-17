var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');

// INPUT DIAGRAM
var input = require('./parse.json');
const actors = input.processes;
const diagram = input.diagram.content;
var jsonData;

module.exports.run = function (worker) {
  console.log('   >> Worker PID:', process.pid);

  var app = express();

  var httpServer = worker.httpServer;
  var scServer = worker.scServer;

  app.use(serveStatic(path.resolve(__dirname, 'public')));

  // Add GET /health-check express route

  httpServer.on('request', app);

  var indexDiagram = 0;
  var indexMessage = 0;

  /*
    In here we handle our incoming realtime connections and listen for events.
  */
  scServer.on('connection', function (socket) {

    socket.on('go', function(){
      //Read the JSON input
      fs.readFile('./parse.json',sendJson)
    })
    function sendJson(err, data){
      if(err) throw err
      //Parse the JSON input
      jsonData = JSON.parse(data)
      //Loop throw the conent of the JSON and send it to frontend
      jsonData.diagram.content.forEach(function (array) {
        array.content.forEach(function(x){
          socket.emit('word',{
            from: x.from,
            to: x.to,
            message: x.message
          })
          sleep(1000)
        })
      })
    }




    /*
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
    */
  });
  function sleep(milliseconds) {
var start = new Date().getTime();
for (var i = 0; i < 1e7; i++) {
  if ((new Date().getTime() - start) > milliseconds){
    break;
  }
}
}
};
