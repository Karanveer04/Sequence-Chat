module.exports.run = function (balancer){
  balancer.addMiddleware(balancer.MIDDLEWARE_CONNECTION, function(socket,next){
    var client_ip = socket.remoteAddress;
    console.log(client_ip)
    next()
  })
}
