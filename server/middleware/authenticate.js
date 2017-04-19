// User authentication Middleware:

var {User} = require('./../models/user');

var authenticate = (req, res, next) => {

	// Get token from header in request:
	var token = req.header('x-auth');

	// Find user with token:
	User.findByToken(token).then((user) => {

		// Handle error if no token exists:
		if(!user){
			return Promise.reject();
		}
		// Set user and token object properties to found user:
		req.user = user;
		req.token = token;

		// Continue with rest of request:
		next();
		
	}).catch((e) => {
		res.status(401).send();
	});
};

module.exports = {
	authenticate: authenticate
}