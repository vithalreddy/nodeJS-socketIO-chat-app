var express = require('express');
var mongoose = require('mongoose');
var shortid = require("shortid");


//middlewares
var auth = require('../../middlewares/auth.js');
var validator = require('../../middlewares/validator.js');
var encrypt = require('../../libs/encrypt.js');

var router = express.Router();


var userModel = mongoose.model('User');


module.exports.controller = function(app){

  //route for signup
  router.get("/signup",auth.loggedIn,function(req,res){
    res.render('signup',
                {
                  title:"User Signup",
                  user:req.session.user,
                  chat:req.session.chat
                });
  });

  //api to create new user
  router.post("/api/v1/signup",auth.loggedIn,validator.emailExist,function(req,res){

    var today = Date.now();
    var id = shortid.generate();
    var epass = encrypt.encryptPassword(req.body.password);

    //create user.
    var newUser = new userModel({

      userId : id,
      username : req.body.username,
      email : req.body.email,
      password : epass,
      createdOn : today,
      updatedOn : today

    });

    newUser.save(function(err,result){
      if(err){
        console.log(err);
        res.render('message',
                    {
                      title:"Error",
                      msg:"Some Error Occured During Creation.",
                      status:500,
                      error:err,
                      user:req.session.user,
                      chat:req.session.chat
                    });
      }
      else if(result == undefined || result == null || result == ""){
        res.render('message',
                    {
                      title:"Empty",
                      msg:"User Is Not Created. Please Try Again.",
                      status:404,
                      error:"",
                      user:req.session.user,
                      chat:req.session.chat
                    });
      }
      else{
        req.user = result;
        delete req.user.password;
        req.session.user = result;
        delete req.session.user.password;
        res.redirect('/chat');
      }
    });

  });

  app.use('/user',router);

}//signup controller end
