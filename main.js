var express = require("express");
var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var exec = require('child_process').execSync;
var url = 'mongodb://localhost:27017/mydb';
var x = -1;
var app = express();
var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy;
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var game=require('./game.js');

//static stuff
app.use('/js', express.static(__dirname + '/node_modules/bootstrap/dist/js')); // redirect bootstrap JS
app.use('/js', express.static(__dirname + '/node_modules/jquery/dist')); // redirect JS jQuery
app.use('/css', express.static(__dirname + '/node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
app.use(express.static('public'));

app.use(cookieParser());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(session({
	secret: 'keyboard cat',
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(id, done) {
	users.findOne({
		'_id': new mongodb.ObjectId(id)
	}, function(err, user) {
		console.log(err + ' ' + user)
		if (err) done(err);
		else done(null, user);
	});
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		users.findOne({
			'username': username,
			'password': password
		}, function(err, user) {
			if (err) {
				return done(err);
			}
			if (!user) {
				return done(null, false, {
					message: 'Incorrect username or password.'
				});
			}
			console.log("ok");
			return done(null, user._id);
		});
	}
));

MongoClient.connect(url, function(err, db) {
	if (err) {
		console.log('Unable to connect to the mongoDB server. Error:', err);
	} else {
		console.log('Connection established to', url);
		users = db.collection('users');
	}
});

app.get('/login', function(req, res) {
	if (req.user) {
		res.send("already logged in")
	} else {
		res.sendFile('login.html', {
			root: __dirname
		});
	}
});

app.get('/', function(req, res) {
	console.log("homepage " + req.user)
	if (req.user) {
		res.send('<a href="/logout">logout</a><a href="/play">play</a>');
	} else {
		res.send('<a href="/login">login</a><a href="/signup">sign up</a>');
	}
});

app.post('/login',
	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/login'
	}));

app.get('/logout', function(req, res) {
	req.logout();
	res.redirect('/');
});

app.get('/signup', function(req, res) {
	res.sendFile('signup.html',{
			root: __dirname
		})
});
app.post('/signup', function(req, res) {
	var user = req.body.username,
		pass = req.body.password;
	users.findOne({
		'username': user
	}, function(err, usr) {
		if (err || usr) {
			res.send("Error");
		} else {
			users.insert({
				'username': user,
				'password': pass,
				'progress':0
			}, function(err, record) {
				if (err) res.send(err);
				else passport.authenticate('local', {
					successRedirect: '/',
					failureRedirect: '/signup'
				})(req, res);
			});
		}
	});
});
app.get('/play', function(req, res) {
	if (req.user) {
		res.sendFile('play.html', {
			root: __dirname
		});
	} else {
		res.redirect('/');
	}
});
app.post('/play', function(req, res) {
	if (req.user) {
		game(req.body.command,req.user,users,res);
	} else {
		res.redirect('/');
	}
});
app.use(function(req, res, next) {
	res.status(404);
	res.send('Not found');
});

app.listen(8081, function() {
	console.log('Example app listening on port 8081!');
});

process.on('SIGINT', function() {
	console.log("server exiting");
	exec("brew services stop mongodb;echo hello");
	process.exit();
});
console.log('Server running at http://127.0.0.1:8081/');