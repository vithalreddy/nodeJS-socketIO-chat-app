
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var roomSchema = new Schema({

  name1 : {type:String,default:"",required:true},
  name2 : {type:String,default:"",required:true},
  members : [],
  lastActive : {type:Date,default:Date.now},
  createdOn : {type:Date,default:Date.now}

});

mongoose.model('Room',roomSchema);
