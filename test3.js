var   express = require('express')
    , passport = require('passport')
    , LocalStrategy = require('passport-localapikey').Strategy;


var users = [
    { id: 1, username: 'bob', password: 'secret', email: 'bob@example.com', apikey: 'asdasjsdgfjkjhg' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com', apikey: 'gfsdgsfgsfg' }
];

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByApiKey(apikey, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.apikey === apikey) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    findById(id, function (err, user) {
        done(err, user);
    });
});

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
    function(apikey, done) {
        // asynchronous verification, for effect...
        process.nextTick(function () {
            // Find the user by username.  If there is no user with the given
            // username, or the password is not correct, set the user to `false` to
            // indicate failure and set a flash message.  Otherwise, return the
            // authenticated `user`.
            findByApiKey(apikey, function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false, { message: 'Unknown apikey : ' + apikey }); }
                // if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
                return done(null, user);
            })
        });
    }
));



var app = express();
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var morgan = require('morgan');


// configure Express
var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
    // configure stuff here

    /*app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.engine('ejs', require('ejs-locals'));*/

    app.use(morgan('combined'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(session({ secret: 'keyboard cat',  resave: true, saveUninitialized: true }));
    //app.use(flash());

    // Initialize Passport!  Also use passport.session() middleware, to support
    // persistent login sessions (recommended).
    app.use(passport.initialize());

    // persistent login sessions
    app.use(passport.session());

};


app.get('/', function(req, res){
    res.json({ message: "Authenticated" })
});

app.get('/api/account', ensureAuthenticated, function(req, res){
    res.json({ message: "Authenticated" })
});

app.post('/api/authenticate',
    passport.authenticate('localapikey', { failureRedirect: '/api/unauthorized', failureFlash: true }),
    function(req, res) {
        res.json({ message: "Authenticated" })
    });

app.get('/api/unauthorized', function(req, res){
    res.json({ message: "Authentication Error" })
});

app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});

app.listen(3000);

console.log("Server running on port 3000");

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/api/unauthorized')
}