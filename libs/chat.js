var socketio = require('socket.io');
var mongoose = require('mongoose');
var events = require('events');
var _ = require('lodash');
var eventEmitter = new events.EventEmitter();

//adding db models
require('../app/models/user.js');
require('../app/models/chat.js');
require('../app/models/room.js');

//using mongoose Schema models
var userModel = mongoose.model('User');
var chatModel = mongoose.model('Chat');
var roomModel = mongoose.model('Room');


//reatime magic begins here
module.exports.sockets = function(http) {
  io = socketio.listen(http);


  //setting chat route
  var ioChat = io.of('/chat');
  var userStack = {};
  var oldChats, sendUserStack, setRoom;
  var userSocket = {};

  //socket.io magic starts here
  ioChat.on('connection', function(socket) {
    console.log("socketio chat connected.");

    //function to get user name
    socket.on('set-user-data', function(username) {
      console.log(username+ "  logged In");



      //storing variable.
      socket.username = username;
      userSocket[socket.username] = socket.id;

      socket.broadcast.emit('broadcast',{ description: username + ' Logged In'});




      //getting all users list
      eventEmitter.emit('get-all-users');

      //sending all users list. and setting if online or offline.
      sendUserStack = function() {
        for (i in userSocket) {
          for (j in userStack) {
            if (j == i) {
              userStack[j] = "Online";
            }
          }
        }
        //for popping connection message.
        ioChat.emit('onlineStack', userStack);
      } //end of sendUserStack function.

    }); //end of set-user-data event.

    //setting room.
    socket.on('set-room', function(room) {
      //leaving room.
      socket.leave(socket.room);
      //getting room data.
      eventEmitter.emit('get-room-data', room);
      //setting room and join.
      setRoom = function(roomId) {
        socket.room = roomId;
        console.log("roomId : " + socket.room);
        socket.join(socket.room);
        ioChat.to(userSocket[socket.username]).emit('set-room', socket.room);
      };

    }); //end of set-room event.

    //emits event to read old-chats-init from database.
    socket.on('old-chats-init', function(data) {
      eventEmitter.emit('read-chat', data);
    });

    //emits event to read old chats from database.
    socket.on('old-chats', function(data) {
      eventEmitter.emit('read-chat', data);
    });

    //sending old chats to client.
    oldChats = function(result, username, room) {
      ioChat.to(userSocket[username]).emit('old-chats', {
        result: result,
        room: room
      });
    }

    //showing msg on typing.
    socket.on('typing', function() {
      socket.to(socket.room).broadcast.emit('typing', socket.username + " : is typing...");
    });

    //for showing chats.
    socket.on('chat-msg', function(data) {
      //emits event to save chat to database.
      eventEmitter.emit('save-chat', {
        msgFrom: socket.username,
        msgTo: data.msgTo,
        msg: data.msg,
        room: socket.room,
        date: data.date
      });
      //emits event to send chat msg to all clients.
      ioChat.to(socket.room).emit('chat-msg', {
        msgFrom: socket.username,
        msg: data.msg,
        date: data.date
      });
    });

    //for popping disconnection message.
    socket.on('disconnect', function() {

      console.log(socket.username+ "  logged out");
      socket.broadcast.emit('broadcast',{ description: socket.username + ' Logged out'});



      console.log("chat disconnected.");

      _.unset(userSocket, socket.username);
      userStack[socket.username] = "Offline";

      ioChat.emit('onlineStack', userStack);
    }); //end of disconnect event.

  }); //end of io.on(connection).
  //end of socket.io code for chat feature.

  //database operations are kept outside of socket.io code.
  //saving chats to database.
  eventEmitter.on('save-chat', function(data) {

    // var today = Date.now();

    var newChat = new chatModel({

      msgFrom: data.msgFrom,
      msgTo: data.msgTo,
      msg: data.msg,
      room: data.room,
      createdOn: data.date

    });

    newChat.save(function(err, result) {
      if (err) {
        console.log("Error : " + err);
      } else if (result == undefined || result == null || result == "") {
        console.log("Chat Is Not Saved.");
      } else {
        console.log("Chat Saved.");
        //console.log(result);
      }
    });

  }); //end of saving chat.

  //reading chat from database.
  eventEmitter.on('read-chat', function(data) {

    chatModel.find({})
      .where('room').equals(data.room)
      .sort('-createdOn')
      .skip(data.msgCount)
      .lean()
      .limit(5)
      .exec(function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //calling function which emits event to client to show chats.
          oldChats(result, data.username, data.room);
        }
      });
  }); //end of reading chat from database.

  //listening for get-all-users event. creating list of all users.
  eventEmitter.on('get-all-users', function() {
    userModel.find({})
      .select('username')
      .exec(function(err, result) {
        if (err) {
          console.log("Error : " + err);
        } else {
          //console.log(result);
          for (var i = 0; i < result.length; i++) {
            userStack[result[i].username] = "Offline";
          }
          //console.log("stack "+Object.keys(userStack));
          sendUserStack();
        }
      });
  }); //end of get-all-users event.

  //listening get-room-data event.
  eventEmitter.on('get-room-data', function(room) {
    roomModel.find({
      $or: [{
        name1: room.name1
      }, {
        name1: room.name2
      }, {
        name2: room.name1
      }, {
        name2: room.name2
      }]
    }, function(err, result) {
      if (err) {
        console.log("Error : " + err);
      } else {
        if (result == "" || result == undefined || result == null) {

          var today = Date.now();

          newRoom = new roomModel({
            name1: room.name1,
            name2: room.name2,
            lastActive: today,
            createdOn: today
          });

          newRoom.save(function(err, newResult) {

            if (err) {
              console.log("Error : " + err);
            } else if (newResult == "" || newResult == undefined || newResult == null) {
              console.log("Some Error Occured During Room Creation.");
            } else {
              setRoom(newResult._id); //calling setRoom function.
            }
          }); //end of saving room.

        } else {
          var jresult = JSON.parse(JSON.stringify(result));
          setRoom(jresult[0]._id); //calling setRoom function.
        }
      } //end of else.
    }); //end of find room.
  }); //end of get-room-data listener.
  //end of database operations for chat feature.

  //
  //

  //to verify for unique username and email at signup.
  //socket namespace for signup.
  var ioSignup = io.of('/signup');

  var checkUname, checkEmail; //declaring variables for function.

  ioSignup.on('connection', function(socket) {
    console.log("signup connected.");

    //verifying unique username.
    socket.on('checkUname', function(uname) {
      eventEmitter.emit('findUsername', uname); //event to perform database operation.
    }); //end of checkUname event.

    //function to emit event for checkUname.
    checkUname = function(data) {
      ioSignup.to(socket.id).emit('checkUname', data); //data can have only 1 or 0 value.
    }; //end of checkUsername function.

    //verifying unique email.
    socket.on('checkEmail', function(email) {
      eventEmitter.emit('findEmail', email); //event to perform database operation.
    }); //end of checkEmail event.

    //function to emit event for checkEmail.
    checkEmail = function(data) {
      ioSignup.to(socket.id).emit('checkEmail', data); //data can have only 1 or 0 value.
    }; //end of checkEmail function.

    //on disconnection.
    socket.on('disconnect', function() {
      console.log("signup disconnected.");
    });

  }); //end of ioSignup connection event.

  //database operations are kept outside of socket.io code.
  //event to find and check username.
  eventEmitter.on('findUsername', function(uname) {

    userModel.find({
      'username': uname
    }, function(err, result) {
      if (err) {
        console.log("Error : " + err);
      } else {
        //console.log(result);
        if (result == "") {
          checkUname(1); //send 1 if username not found.
        } else {
          checkUname(0); //send 0 if username found.
        }
      }
    });

  }); //end of findUsername event.

  //event to find and check username.
  eventEmitter.on('findEmail', function(email) {

    userModel.find({
      'email': email
    }, function(err, result) {
      if (err) {
        console.log("Error : " + err);
      } else {
        //console.log(result);
        if (result == "") {
          checkEmail(1); //send 1 if email not found.
        } else {
          checkEmail(0); //send 0 if email found.
        }
      }
    });

  }); //end of findUsername event.

  //
  //

  return io;

};
