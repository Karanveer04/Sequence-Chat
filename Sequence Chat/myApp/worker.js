/* jshint node: true */
var SCWorker = require('socketcluster/scworker');
var fs = require('fs');
var express = require('express');
var serveStatic = require('serve-static');
var path = require('path');
var _ = require('lodash');

class Worker extends SCWorker {
    run() {
        console.log('   >> Worker PID:', process.pid);
        var app = express();

        var httpServer = this.httpServer;
        var scServer = this.scServer;

        app.use(serveStatic(path.resolve(__dirname, 'public')));

        httpServer.on('request', app);


        scServer.on('connection', function (socket) {
          socket.on('pass', function(){
            socket.emit('confirm', 'catpass')
          })
            socket.on('go', function (jsonData) {
                var data = JSON.parse(jsonData);

                if (data.type === 'sequence_diagram') {
                    var arr = [];
                    var tog = [];
                    data.diagram.content.forEach(function (array) {
                        array.content.forEach(function (x) {
                            arr.push({
                                from: x.from,
                                to: x.to,
                                message: x.message
                            });
                        });
                        tog.push(arr);
                        arr = [];
                    });
                    scServer.exchange.publish('sample', tog);
                }

                else if(data.type === 'deployment_diagram'){
                    var tree = []
                    var count = 0
                    var phone = 'smartphone'
                    var comp = 'computer'
                    var serv = 'server'
                    var parent
                    data.mapping.forEach(function(x){
                      if(count == 0){
                        tree.push({
                          key: x.process,
                          name: x.process,
                          source: (x.device.indexOf(serv) !== -1) ? "img/server.png" :
                           ""
                        })
                        count++
                        parent = x.process
                      }
                      else{
                        var path
                          if(x.device.indexOf(phone) !== -1){
                            path = "img/smartphone.png"
                          }else if(x.device.indexOf(comp) !== -1){
                            path = "img/computer.png"
                          }else{
                            path = ""
                          }
                        tree.push({
                          key: x.device,
                          name: x.device,
                          parent: parent,
                          source: path
                        })
                        tree.push({
                          key: x.process,
                          name: x.process,
                          parent: x.device,
                          source: "img/user.png"
                        })
                      }
                    })
                    var newTree = _.uniqBy(tree, 'name')
                    scServer.exchange.publish('deploy', newTree)
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
                    classData.push(linkData);
                    scServer.exchange.publish('class' , classData);
                }

                else{
                    socket.emit('diagramError', 'Wrong diagram type, we only support SSD, Class and Deployment diagrams!')
                }

            });

        });
    }
}
new Worker();
