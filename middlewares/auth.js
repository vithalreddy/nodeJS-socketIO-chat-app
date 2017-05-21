var mongoose = require('mongoose');

module.exports.checkLogin = function(req,res,next){

	if(!req.user && !req.session.user){
		res.redirect('/user/login');
	}
	else{
		next();
	}

};

module.exports.loggedIn = function(req,res,next){

	if(!req.user && !req.session.user){
		next();
	}
	else{
		res.redirect('/chat');
	}

};
