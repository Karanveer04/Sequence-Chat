/*
  This is the SocketCluster master controller file.
  Modified by Simon Lofving
*/

var fs = require('fs');
var argv = require('minimist')(process.argv.slice(2));
var scHotReboot = require('sc-hot-reboot');
var scErrors = require('sc-errors');
var TimeoutError = scErrors.TimeoutError;

var fsUtil = require('socketcluster/fsutil');
var waitForFile = fsUtil.waitForFile;

var SocketCluster = require('socketcluster');
//Check number of CPU cores and use it in the options variabel for workers.
var os = require('os')
var numCPUs = os.cpus().length/2;

var workerControllerPath = argv.wc || process.env.SOCKETCLUSTER_WORKER_CONTROLLER;
var brokerControllerPath = argv.bc || process.env.SOCKETCLUSTER_BROKER_CONTROLLER;
var workerClusterControllerPath = argv.wcc || process.env.SOCKETCLUSTER_WORKERCLUSTER_CONTROLLER;

var options = {
  workers: Number(argv.w) || Number(process.env.SOCKETCLUSTER_WORKERS) || numCPUs,
  brokers: Number(argv.b) || Number(process.env.SOCKETCLUSTER_BROKERS) || 1,
  port: Number(argv.p) || Number(process.env.SOCKETCLUSTER_PORT) || 8000,
  wsEngine: process.env.SOCKETCLUSTER_WS_ENGINE || 'uws',
  appName: argv.n || process.env.SOCKETCLUSTER_APP_NAME || null,
  workerController: workerControllerPath || __dirname + '/worker.js',
  brokerController: brokerControllerPath || __dirname + '/broker.js',
  workerClusterController: workerClusterControllerPath || null,
  socketChannelLimit: Number(process.env.SOCKETCLUSTER_SOCKET_CHANNEL_LIMIT) || 1000,
  clusterStateServerHost: argv.cssh || process.env.SCC_STATE_SERVER_HOST || null,
  clusterStateServerPort: process.env.SCC_STATE_SERVER_PORT || null,
  clusterAuthKey: process.env.SCC_AUTH_KEY || null,
  clusterInstanceIp: process.env.SCC_INSTANCE_IP || null,
  clusterInstanceIpFamily: process.env.SCC_INSTANCE_IP_FAMILY || null,
  clusterStateServerConnectTimeout: Number(process.env.SCC_STATE_SERVER_CONNECT_TIMEOUT) || null,
  clusterStateServerAckTimeout: Number(process.env.SCC_STATE_SERVER_ACK_TIMEOUT) || null,
  clusterStateServerReconnectRandomness: Number(process.env.SCC_STATE_SERVER_RECONNECT_RANDOMNESS) || null,
  crashWorkerOnError: argv['auto-reboot'] != false,
  killMasterOnSignal: false
};

  var socketCluster = new SocketCluster(options);

  socketCluster.on(socketCluster.EVENT_WORKER_CLUSTER_START, function (workerClusterInfo) {
    console.log('   >> WorkerCluster PID:', workerClusterInfo.pid);
  });
