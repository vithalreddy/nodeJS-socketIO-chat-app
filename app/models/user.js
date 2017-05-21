var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var userSchema = new Schema({

  userId : {type:String,default:"",required:true},
  username : {type:String,default:"",required:true},
  email : {type:String,default:"",required:true},
  password : {type:String,default:"",required:true},
  createdOn : {type:Date,default:Date.now},
  updatedOn : {type:Date,default:Date.now}

});
mongoose.model('User',userSchema);
