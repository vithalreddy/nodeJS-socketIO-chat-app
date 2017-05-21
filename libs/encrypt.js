var crypto = require('crypto');


module.exports.encryptPassword = function(password){
  var hash = crypto.createHmac('sha256',password)
                   .update("9743-980")
                   .digest('hex');
  return hash
};
