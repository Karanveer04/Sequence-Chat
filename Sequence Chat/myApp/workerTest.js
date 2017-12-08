/* jshint node: true */
var SCWorker = require('socketcluster/scworker');
var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var morgan = require('morgan');
var healthChecker = require('sc-framework-health-check');
var _ = require('lodash');


var jsonData;

class Worker extends SCWorker {
    run() {
        console.log('   >> Worker PID:', process.pid);
        var environment = this.options.environment;

        var app = express();

        var httpServer = this.httpServer;
        var scServer = this.scServer;
//testets
        if (environment === 'dev') {
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
            socket.on('go', function (jsonData) {
                //Read the JSON input
                //Loop through the content of the JSON and send it to frontend
                var arr = [];
                //var arr2 = [];
                //var tog = [];
                var data = JSON.parse(jsonData);

                if (data.type === 'sequence_diagrammmmm') {
                    data.diagram.content.forEach(function (array) {
                        array.content.forEach(function (x) {
                            arr.push({
                                from: x.from,
                                to: x.to,
                                message: x.message
                            });
                        });
                    });

                    //working on the parallel diagrams
                    /*if (data.diagram.node !== 'par') {
                        data.diagram.content.content.forEach(function (x) {
                            arr.push({
                                from: x.from,
                                to: x.to,
                                message: x.message
                            });
                        });
                        scServer.exchange.publish('sample', arr);
                    }
                    else {
                        data.diagram.content.forEach(function (array) {
                            arr2.push(array);
                        });
                        arr2[0].forEach(function (x) {
                            arr2[1].forEach(function (xo) {
                                arr.push({
                                    from: x.from,
                                    to: x.to,
                                    message: x.message,
                                    fromPar: xo.from,
                                    toPar: xo.to,
                                    messagePar: xo.message
                                });
                            });
                        });
                        */
                    scServer.exchange.publish('sample', arr);
                }

                else if(data.type === 'deployment_diagram'){
                    var tree = [];
                    data.mapping.forEach(function(x){
                        if(x.device === 'server'){
                            tree.push({
                                key: x.process,
                                name: x.process
                            });
                        }
                        else{
                            tree.push({
                                key: x.device,
                                name: x.device,
                                parent: 'g'
                            });
                            tree.push({
                                key: x.process,
                                name: x.process,
                                parent: x.device
                            });
                        }
                    });
                    var newTree = _.uniqBy(tree, 'name');
                    scServer.exchange.publish('deploy', newTree);
                }
                else if(data.type === 'class_diagram'){
                    //Code for parsing class diagram
                    //publish to the right channel
                    //scServer.exchange.publish('class', data)

                    var nodeData  = [];
                    var linkData = [];
                    var classData = [];
                    data.classes.forEach(function(array){
                        nodeData.push({
                            key:array.name,
                            name:array.name,
                            properties:array.fields,
                            methods:array.methods
                        });

                    });

                    data.relationships.forEach(function (relation) {
                        linkData.push({
                            from:relation.subclass,
                            to:relation.superclass,
                            relationship: relation.type
                        });
                    });
                    classData.push(nodeData);
  //                   console.log("node data test" + nodeData)
                    classData.push(linkData);
  //                   console.log("node data test" + nodeData)
                    scServer.exchange.publish('class' , classData);
                }
                

                else if(data.type === 'sequence_diagram'){
                    var nodeData = [];
                    var linkData = [];
                    var classData = [];
                    var loca = 0;

                    data.processes.forEach(function(array){
                        nodeData.push({
                            key:array.name,
                            text:array.name,
                            isGroup:true,
                            loc:loca,
                            duration:9
                        });
                        loca = loca + 10;
                    });    
                        
                    var x = 1;
                    data.diagram.content.forEach(function(array){
                        array.content.forEach(function (y){
                            linkData.push({
                            from:y.from,
                            to:y.to,
                            text:y.message,
                            time:x
                        });
                            x = x + 5;
                    });                        
                });

                    classData.push(nodeData);
                    console.log("node data " + nodeData)
                    classData.push(linkData);
                    console.log("link data " +linkData)
                    scServer.exchange.publish('sequence' , classData);
                   
            }


                else{
                    console.log('Wrong diagram');
                }

            });

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
