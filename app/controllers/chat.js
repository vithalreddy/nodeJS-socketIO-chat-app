var express = require('express');
var router = express.Router();

var auth = require('../../middlewares/auth.js');


module.exports.controller = function(app){

  //route for chat
  app.get('/chat',auth.checkLogin,function(req,res){

    res.render('chat',
                {
                  title:"Chat Home",
                  user:req.session.user,
                  chat:req.session.chat
                });
  });

  app.use(router);

}//Chat controller end.
