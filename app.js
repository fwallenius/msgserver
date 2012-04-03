
/*

	Small real time message server with pairing function.
	Just a hack in current state and should not be used by anyone.

*/


var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

var io = require('socket.io').listen(app);
io.set('log level', 1);

/**
 * Simple code generator;
 * @author Andrey Bodoev
 */ 
function genToken () {
	var alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

	var 
		i = 4,
		word = '';
	while (i) {
		i -= 1;
		var random = Math.floor(Math.random()*26)
		// console.log(random,alphabet[random]);
		word += alphabet[random];
	}
	return word
};


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);

// Store all current sessions here (host + client(s))
var sessions = {};


io.sockets.on('connection', function (socket) {

	
	// TV request for token
	socket.on('get_code',function (fn) {
		var token = genToken();

		sessions[token] = {
			host: socket,
			clients: []
		}

		socket.join(token);
		socket.set('token', token, function() {
			fn (token); // Return token to requester;
		})
	});

	// Client sending pairing token
	socket.on('connect', function (params, fn) {
		var result = false;
		var token = params.token;

		console.log('Received connect event!');
		if (sessions[token]) {

			console.log('Found host for token: ' + params.token);
			// Add client to this hosts list of clients
			sessions[token].clients.push(socket);
			sessions[token].host.emit('tv', {
				state: 'connected'
			});

			socket.join(token);
			socket.set('token', token);

			result = true;
		}

		// Notify client if we found host for that token
		fn({
			connected: result
		});

	});

	socket.on('transfer', function (data) {

		// Get the session this socket is bound to
		socket.get('token', function(err, token) {
			var result = false;

			if (!err && token !== null) {
				sessions[token].host.emit('transfer', data);
				result = true;
			} else {
				console.log('err + token:');
				console.log(err);
				console.log(token);
			}

			console.log('success: ' + result);
		});
	})

});
