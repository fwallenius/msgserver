

var socket = io.connect('http://localhost');

socket.on('tv', function (data) {
	console.log('Received "tv" event:');
	console.log(data);
});

socket.on('transfer', function (data) {
	console.log('Received "transfer" event:');
	console.log(data);
});
