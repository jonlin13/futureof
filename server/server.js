require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');

var {mongoose} = require('./db/mongoose');
var {Future} = require('./models/future');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

// Call express to start http service
var app = express();

// Set port to environment variable's port attribute
const port = process.env.PORT;

// Body parser middleware makes incoming request bodies available on req.body
app.use(bodyParser.json());

// CREATE A NEW DATA ITEM:
app.post('/futures', authenticate, (req, res) => {

	// Instantiate a new mongoose data model with request:
	var future = new Future({
		question: req.body.question,
		_creator: req.user._id
	});

	// Save, send response and check for errors:
	future.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

// RETRIEVE ALL AVAILABLE DATA REQUEST W/AUTHENTICATION
app.get('/futures', (req, res) => {

	// Perform a lookup for data item based on user ID
	// returned from authentication:
	Future.find({}).then((futures) => {
		res.send({
			futures: futures
		});
	}, (e) => {
		res.status(400).send(e);
	});
});

// RETRIEVE A SINGLE DATA ITEM REQUEST W/AUTHENTICATION
app.get('/futures/:id', (req, res) => {
	var id = req.params.id;

	// Validate ID format
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// If initial validation succeeds,
	// Lookup data item based on ID
	// AND user ID:
	Future.findOne({
		_id:id
	}).then((future) => {

		// Handle no ID found error:
		if(!future){
			return res.status(404).send();
		}

		// Send data item with found ID
		res.status(200).send({
			future: future
		});
		
	}).catch((e) => {
		res.status(400).send();
	});
});


// UPDATE A SINGLE DATA ITEM W/AUTHENTICATION
app.patch('/futures/:id', authenticate, (req, res) => {
	var id = req.params.id;

	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['response']);
	
	// Validate ID format
	if (!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// Lookup data item based on id and user id
	// and set body to requests data submission:
	Future.findOneAndUpdate(
		{
			_id: id
		}, 
		{$push: {"responses": {response: body.response, user: req.user._id}}},
		{ new: true }
	).then((future) => {
		if(!future){
			return res.status(404).send();
		}
		res.status(200).send({
			future: future
		});
	}).catch((e) => {
		res.status(400).send();
	});

});

app.patch('/futures/:id/follow', authenticate, (req, res) => {
	var id = req.params.id;

	if (!ObjectID.isValid(id)){
		return res.status(404).send();
		console.log('id is bad');
	}

	Future.findOneAndUpdate(
		{
			_id: id
		}, 
		{$push: {"followers": {user: req.user._id}}},
		{ new: true }
	).then((future) => {
		if(!future){
			return res.status(404).send();
			console.log('no future found with this id');
		}

		User.findOneAndUpdate(
			{
				_id: req.user
			},
			{$push: {"following_futures": {future: id}}},
			{new: true}
		).then((user) => {
			if(!user){
				return res.status(404).send();
				console.log('no user returned');
			}
			res.status(200).send({
				future: future,
				just_followed_by: user
			});
		});

	}).catch((e) => {
		res.status(400).send();
		console.log(e);
	});
});



// CREATE A NEW USER
app.post('/users', (req, res) => {
	
	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['email', 'username', 'password']);

	// Instantiate a new User data model and pass the 
	// requests body in
	var user = new User(body);

	// Save this request, generate an authentication token
	// and then send it back in a custom header
	user.save().then(() => {
		return user.generateAuthToken();
	}).then((token) => {
		res.header('x-auth', token).send(user);
	}).catch((e) => {
		res.status(400).send(e);
		console.log(e);
	});
});

// LOGIN A USER
app.post('/users/login', (req, res) => {
	
	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['username', 'password']);

	// Lookup user with credentials (instance method)
	User.findByCredentials(body.username, body.password).then((user) => {

		// If user exists, generate a token
		// and send it back as a custom header
		return user.generateAuthToken().then((token) => {
			res.header('x-auth', token).send(user);
		});

	}).catch((e) => {

		res.status(400).send();

	});
});

// LOGOUT A USER
app.delete('/users/me/token', authenticate, (req, res) => {

	// Delete Authenticated user's existing token:
	req.user.removeToken(req.token).then(() => {
		res.status(200).send();
	}, () => {
		res.status(400).send();
	});
});

// RETRIEVE CURRENT USER
app.get('/users/me', authenticate, (req, res) => {

	// Send authenticated user:
	res.send(req.user);
});

// UPDATE A SINGLE DATA ITEM W/AUTHENTICATION
app.get('/users/:id', authenticate, (req, res) => {
	var id = req.params.id;
	
	// Validate ID format
	if (!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// Lookup data item based on id and user id
	// and set body to requests data submission:
	User.findById(id).then((user) => {
		if(!user){
			return res.status(404).send();
		}
		res.status(200).send({
			email: user.email,
			username: user.username,
			id: user._id,
			following_futures: user.following_futures,
			following_users: user.following_users,
			users_following: user.users_following
		});
	}).catch((e) => {
		res.status(400).send();
	});
});


// FOLLOW A USER:
// Adding you to the users list
// and the user to your own list
app.patch('/users/:id/follow', authenticate, (req, res) => {
	var id = req.params.id;

	// Validate ID format
	if (!ObjectID.isValid(id)){
		return res.status(404).send();
		console.log('id is bad');
	}

	User.findOneAndUpdate(
		{
			_id: req.user
		}, 
		{$push: {"following_users": {user: id}}},
		{ new: true }
	).then((user) => {
		if(!user){
			return res.status(404).send();
			console.log('no user found with this id');
		}

		User.findOneAndUpdate(
			{
				_id: id
			},
			{$push: {"users_following": {user: req.user}}},
			{new: true}
		).then((viewedUser) => {
			if(!user){
				return res.status(404).send();
				console.log('no user returned');
			}
			res.status(200).send({
				user: user,
				viewedUser: viewedUser
			});
		});

	}).catch((e) => {
		res.status(400).send();
		console.log(e);
	});

});

app.listen(port, () => {
	console.log(`started on port ${port}`);
});

module.exports = {
	app: app
};