const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const mongoStore = require("connect-mongo")(session);
const methodOverride = require("method-override");
const path = require("path");
const fs = require("fs");
const logger = require("morgan");

const app = express();
const http = require("http").Server(app);

//port setup
const port = process.env.PORT || 5000;

//socket.io
require("./libs/chat.js").sockets(http);

app.use(logger("dev"));

//db connection
// const dbPath = "mongodb://localhost/socketChatDB";
const dbPath = `mongodb://github_demo:Pass\#12@ds149511.mlab.com:49511/socketionodejschat`;
mongoose.connect(dbPath, { useNewUrlParser: true });
mongoose.connection.once("open", function() {
  console.log("Database Connection Established Successfully.");
});

//http method override middleware
app.use(
  methodOverride(function(req, res) {
    if (req.body && typeof req.body === "object" && "_method" in req.body) {
      var method = req.body._method;
      delete req.body._method;
      return method;
    }
  })
);

//session setup
const sessionInit = session({
  name: "userCookie",
  secret: "9743-980-270-india",
  resave: true,
  httpOnly: true,
  saveUninitialized: true,
  store: new mongoStore({ mongooseConnection: mongoose.connection }),
  cookie: { maxAge: 80 * 80 * 800 }
});

app.use(sessionInit);

//public folder as static
app.use(express.static(path.resolve(__dirname, "./public")));

//views folder and setting ejs engine
app.set("views", path.resolve(__dirname, "./app/views"));
app.set("view engine", "ejs");

//parsing middlewares
app.use(bodyParser.json({ limit: "10mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

//including models files.
fs.readdirSync("./app/models").forEach(function(file) {
  if (file.indexOf(".js")) {
    require("./app/models/" + file);
  }
});

//including controllers files.
fs.readdirSync("./app/controllers").forEach(function(file) {
  if (file.indexOf(".js")) {
    var route = require("./app/controllers/" + file);
    //calling controllers function and passing app instance.
    route.controller(app);
  }
});

//handling 404 error.
app.use(function(req, res) {
  res.status(404).render("message", {
    title: "404",
    msg: "Page Not Found.",
    status: 404,
    error: "",
    user: req.session.user,
    chat: req.session.chat
  });
});

//app level middleware for setting logged in user.

const userModel = mongoose.model("User");

app.use(function(req, res, next) {
  if (req.session && req.session.user) {
    userModel.findOne({ email: req.session.user.email }, function(err, user) {
      if (user) {
        req.user = user;
        delete req.user.password;
        req.session.user = user;
        delete req.session.user.password;
        next();
      }
    });
  } else {
    next();
  }
}); //end of set Logged In User.

http.listen(port, function() {
  console.log("Chat App started at port :" + port);
});
