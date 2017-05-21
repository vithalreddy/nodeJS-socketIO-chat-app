var express = require('express');
var mongoose = require('mongoose');


var router = express.Router();

var userModel = mongoose.model('User');

module.exports.controller = function(app){

  //router for home.
  router.get('/',function(req,res){
    res.redirect('/user/login');
  });

  app.use(router);

}//home controller end.
