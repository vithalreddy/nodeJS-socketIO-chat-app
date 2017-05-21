var express = require('express');
var app =express();
var http =require('http').Server(app);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var mongoStore = require('connect-mongo')(session);
var methodOverride = require('method-override');
var path = require('path');
var fs = require('fs');
var logger = require('morgan');

//port setup
var port = process.env.PORT || 5000;

//socket.io
require('./libs/chat.js').sockets(http);

app.use(logger('dev'));

//db connection
var dbPath = "mongodb://localhost/socketChatDB";
mongoose.connect(dbPath);
mongoose.connection.once('open',function(){
  console.log("Database Connection Established Successfully.");
});

//http method override middleware
app.use(methodOverride(function(req,res){
  if(req.body && typeof req.body === 'object' && '_method' in req.body){
    var method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

//session setup
var sessionInit = session({
                    name : 'userCookie',
                    secret : '9743-980-270-india',
                    resave : true,
                    httpOnly : true,
                    saveUninitialized: true,
                    store : new mongoStore({mongooseConnection : mongoose.connection}),
                    cookie : { maxAge : 80*80*800 }
                  });

app.use(sessionInit);

//public folder as static
app.use(express.static(path.resolve(__dirname,'./public')));

//views folder and setting ejs engine
app.set('views', path.resolve(__dirname,'./app/views'));
app.set('view engine', 'ejs');

//parsing middlewares
app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());

//including models files.
fs.readdirSync("./app/models").forEach(function(file){
  if(file.indexOf(".js")){
    require("./app/models/"+file);
  }
});

//including controllers files.
fs.readdirSync("./app/controllers").forEach(function(file){
  if(file.indexOf(".js")){
    var route = require("./app/controllers/"+file);
    //calling controllers function and passing app instance.
    route.controller(app);
  }
});

//handling 404 error.
app.use(function(req,res){
  res.status(404).render('message',
                          {
                            title:"404",
                            msg:"Page Not Found.",
                            status:404,
                            error:"",
                            user:req.session.user,
                            chat:req.session.chat
                          });
});

//app level middleware for setting logged in user.

var userModel = mongoose.model('User');

app.use(function(req,res,next){

	if(req.session && req.session.user){
		userModel.findOne({'email':req.session.user.email},function(err,user){

			if(user){
        req.user = user;
        delete req.user.password;
				req.session.user = user;
        delete req.session.user.password;
				next();
			}

		});
	}
	else{
		next();
	}

});//end of set Logged In User.


http.listen(port,function(){
  console.log("Chat App started at port :" +port);
});
