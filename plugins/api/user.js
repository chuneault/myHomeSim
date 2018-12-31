var mongoose = require('mongoose');
//var bcrypt = require('bcrypt');

let UserSchema = new mongoose.Schema({
        googleId: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },
        email: {
            type: String
        },
        authorize: {
           type: Boolean
        }
    }
    ,
    { strict: false }
);

//authenticate input against database
UserSchema.statics.authenticate = function (googleId, userInfo, callback) {
    User.findOne({ googleId: googleId })
      .exec(function (err, user) {
        if (err) {
          return callback(err)
        }
        else if (!user) {
          userInfo.authorize = false;
          let newUser = new User(userInfo);
          newUser.googleId = googleId;

          newUser.save();
          let err = new Error('User not authorize.');
          err.status = 401;
          return callback(err);
        }
        else
          if (user.authorize)
            return callback(null, googleId);
          else {
              let err = new Error('User not authorize.');
              err.status = 401;
              return callback(err);
          }
        /*bcrypt.compare(password, user.password, function (err, result) {
          if (result === true) {
            return callback(null, user);
          } else {
            return callback();
          }
        })*/
      });
};

//hashing a password before saving it to the database
/*UserSchema.pre('save', function (next) {
    var user = this;
    bcrypt.hash(user.password, 10, function (err, hash) {
        if (err) {
            return next(err);
        }
        user.password = hash;
        next();
    })
});*/


var User = mongoose.model('User', UserSchema);

module.exports = function (connectUrl) {
    mongoose.connect(connectUrl, { useNewUrlParser: true, socketTimeoutMS: 0, keepAlive: true, reconnectTries: 5 });

    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function(callback) {
        console.log("connection to db open")
    });

    return User;
};

//module.exports = User;

