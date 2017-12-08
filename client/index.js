var ctx = document.getElementById('ctx').getContext('2d');
ctx.font = '30px Arial';
var socket = io();
socket.on('newPosition',function(data){
  ctx.clearRect(0,0,500,500);
  for(var i = 0; i < data.length; i++){
    ctx.fillText(data[i].number,data[i].x,data[i].y);
  };
  document.onkeydown = function(event){
      if(event.keyCode === 68)
          socket.emit('keyPress',{inputId:'right',state:true});
      else if(event.keyCode === 83)
          socket.emit('keyPress',{inputId:'down',state:true});
      else if(event.keyCode === 65)
          socket.emit('keyPress',{inputId:'left',state:true});
      else if(event.keyCode === 87)
          socket.emit('keyPress',{inputId:'up',state:true});
  }
  document.onkeyup = function(event){
      if(event.keyCode === 68)
          socket.emit('keyPress',{inputId:'right',state:false});
      else if(event.keyCode === 83)
          socket.emit('keyPress',{inputId:'down',state:false});
      else if(event.keyCode === 65)
          socket.emit('keyPress',{inputId:'left',state:false});
      else if(event.keyCode === 87)
          socket.emit('keyPress',{inputId:'up',state:false});
  }
});
