// TODO:
// 1 - Really need a database
// 2 - Chat is bad, can inject javascript
var express = require('express');
var app = express();
var serv = require('http').Server(app);
const portserv = 2000
var io = require('socket.io')(serv,{});

// Using Express. Probably will change in the future
app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

var SOCKET_LIST = {};

var Entity = function(){
  var self = {
    x:250,
    y:250,
    spdX:0,
    spdY:0,
    id:'',
  }
  self.update = function(){
    self.updatePos();
  }
  self.updatePos = function(){
    self.x += self.spdX;
    self.y += self.spdY;
  }
  return self;
}

var Player = function(id){
  var self = Entity();
    self.id = id;
    self.number = '' + Math.floor(10 * Math.random ());
    self.moveRight = false;
    self.moveLeft = false;
    self.moveUp = false;
    self.moveDown = false;
    self.speed = 5;

    var super_update = self.update;

    self.update = function(){
      self.updateSpd();
      super_update();
    }

    self.updateSpd = function(){
      if(self.moveRight)
        self.spdX = self.speed;
      else if(self.moveLeft)
        self.spdX = -self.speed;
      else
        self.spdX = 0;

      if(self.moveUp)
        self.spdY = -self.speed;
      else if(self.moveDown)
        self.spdY = self.speed;
      else
        self.spdY = 0;
    }
  Player.list[id] = self;
  return self;
}
Player.list = {};
Player.onConnect = function(socket){
  var player = Player(socket.id);
  // When 'keyPress' socket come from client change the bool in players object
  socket.on('keyPress', function(data){
    if(data.inputId === 'left')
      player.moveLeft = data.state;
    else if(data.inputId === 'right')
      player.moveRight = data.state;
    else if(data.inputId === 'up')
      player.moveUp = data.state;
    else if(data.inputId === 'down')
      player.moveDown = data.state;
  });
}
Player.onDisconnect = function(socket){
    delete Player.list[socket.id];
}
Player.update = function(){
  var pack = [];
  for(var i in Player.list){
    var player = Player.list[i];
    player.update();
    pack.push({
      x:player.x,
      y:player.y,
      number:player.number
    });
  }
  return pack;
}

var Bullet = function(angle){
  var self = Entity();
  self.id = Math.random();
  self.spdX = Math.cos(angle/180*Math.PI) * 10;
  self.spdY = Math.sin(angle/180*Math.PI) * 10;

  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function(){
    if(self.timer++ > 100)
      self.toRemove = true;
    super_update();
  }
  Bullet.list[self.id] = self;
  return self;
}
Bullet.list = {};
Bullet.update = function(){
  if(Math.random() < 0.1){
    Bullet(Math.random()*360);
  }

  var pack = [];
  for(var i in Bullet.list){
    var bullet = Bullet.list[i];
    bullet.update();
    pack.push({
      x:bullet.x,
      y:bullet.y,
    });
  }
  return pack;
}

io.sockets.on('connection', function(socket){
  socket.id = Math.random();
  SOCKET_LIST[socket.id] = socket;
  Player.onConnect(socket);
  // Handling chat
  socket.on('sendMsgToServer', function(data){
    var playerName = ('' + socket.id).slice(2,7);
    for(var i in SOCKET_LIST){
      SOCKET_LIST[i].emit('addToChat', '<b>' + playerName + '</b>: ' + data);
    }
  });
  // When disconnected delete list entry
  socket.on('disconnect', function(){
    delete SOCKET_LIST[socket.id];
    Player.onDisconnect(socket);
  });
});

// Looping
setInterval(function(){
  var pack = {
    player:Player.update(),
    bullet:Bullet.update(),
  }

  for(var i in SOCKET_LIST){
    var socket = SOCKET_LIST[i];
    socket.emit('newPosition',pack);
  }
},1000/30)

serv.listen(portserv);
console.log('Server Started, port: ' + portserv)
