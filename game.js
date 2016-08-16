module.exports = function(command, user, collection, res) {
	command = command.toLowerCase().replace(/[^\w\s]/gi, '').split(" ")
	console.log(command)
	if (user.progress == 0) {
		if (command[0] == 'status') {
			res.send("welcome");
		} else if (command[0] == "help") {
			res.send("possible commands: help, status, look, leave, lookat");
		} else if (command[0] == "look") {
			res.send("you are in a room with a door");
		} else if (command[0] == "lookat") {
			if (command[1] == 'door') {
				res.send("there is an open door in the room");
			} else {
				res.send("No such Object");
			}
		} else if (command[0] == "leave") {
			collection.update(user, {
				'set$': {
					'progress': user.progress + 1
				}
			}, {
				upsert: false,
				multi: false
			}, function(err, results) {
				if (err) {
					res.send(err);
				} else {
					res.send("successful");
				}
			});
		} else {
			res.send("unknown command, try again");
		}
	} else {
		res.send("level unavailable");
	}
}