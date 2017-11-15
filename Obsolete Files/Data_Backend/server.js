var SocketCluster = require('socketcluster').SocketCluster;1


var socketCluster = new SocketCluster({
  workers: 2,
  brokers: 1,
  port: 8000,
  appName: null,
  workerController: __dirname + '/worker.js',
  brokerController: __dirname + '/broker.js',
  socketChannelLimit: 1000
});