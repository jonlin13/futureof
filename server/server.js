require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');
const bcrypt = require('bcryptjs');

var {mongoose} = require('./db/mongoose');
var {DataModelName} = require('./models/dataModelName');
var {User} = require('./models/user');
var {authenticate} = require('./middleware/authenticate');

// Call express to start http service
var app = express();

// Set port to environment variable's port attribute
const port = process.env.PORT;

// Body parser middleware makes incoming request bodies available on req.body
app.use(bodyParser.json());

// CREATE A NEW DATA ITEM:
app.post('/datamodelname', authenticate, (req, res) => {

	// Instantiate a new mongoose data model with request:
	var datamodelname = new DataModelName({
		text: req.body.text,
		_creator: req.user._id
	});

	// Save, send response and check for errors:
	datamodelname.save().then((doc) => {
		res.send(doc);
	}, (e) => {
		res.status(400).send(e);
	});
});

// RETRIEVE ALL AVAILABLE DATA REQUEST W/AUTHENTICATION
app.get('/datamodelname', authenticate, (req, res) => {

	// Perform a lookup for data item based on user ID
	// returned from authentication:
	DataModelName.find({
		_creator: req.user._id
	}).then((todos) => {
		res.send({
			datamodelname: datamodelname
		});
	}, (e) => {
		res.status(400).send(e);
	});
});

// RETRIEVE A SINGLE DATA ITEM REQUEST W/AUTHENTICATION
app.get('/datamodelname/:id', authenticate, (req, res) => {
	var id = req.params.id;

	// Validate ID format
	if(!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// If initial validation succeeds,
	// Lookup data item based on ID
	// AND user ID:
	DataModelName.findOne({
		_id:id,
		_creator:req.user._id
	}).then((datamodelname) => {

		// Handle no ID found error:
		if(!datamodelname){
			return res.status(404).send();
		}

		// Send data item with found ID
		res.status(200).send({
			todo: todo
		});
		
	}).catch((e) => {
		res.status(400).send();
	});
});

// DELETE A SINGLE DATA ITEM REQUEST W/AUTHENTICATION
app.delete('/datamodelname/:id', authenticate, (req, res) => {
	var id = req.params.id;

	// Validate ID format
	if (!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// If initial validation succeeds,
	// Lookup and remove data item based on ID
	// AND user ID:
	DataModelName.findOneAndRemove({
		_id: id,
		_creator: req.user._id
	}).then((datamodelname) => {

		// Handle no ID found error:
		if(!datamodelname){
			return res.status(404).send();
		}
		// Send removed data item with found ID
		res.status(200).send({
			datamodelname: datamodelname
		});
	}).catch((e) => {
		res.status(400).send();
	});
});

// UPDATE A SINGLE DATA ITEM W/AUTHENTICATION
app.patch('/datamodelname/:id', authenticate, (req, res) => {
	var id = req.params.id;

	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['text', 'completed']);
	
	// Validate ID format
	if (!ObjectID.isValid(id)){
		return res.status(404).send();
	}

	// TODO app-specific condition
	// In the body object, if the 'completed' attribute 
	// comes back as a boolean and it is truthy
	// the automatically set the 'completedAt' attribute
	// to be equal to the current time-stamp
	// otherwise set to false with a null time-stamp:
	if(_.isBoolean(body.completed) && body.completed){
		body.completedAt = new Date().getTime();
	} else {
		body.completed = false;
		body.completedAt = null;
	}

	// Lookup data item based on id and user id
	// and set body to requests data submission:
	DataModelName.findOneAndUpdate(
		{
			_id: id,
			_creator: req.user._id
		}, 
		{ $set: body },
		{ new: true }
	).then((datamodelname) => {
		if(!datamodelname){
			return res.status(404).send();
		}
		res.status(200).send({
			datamodelname: datamodelname
		});
	}).catch((e) => {
		res.status(400).send();
	});

});

// CREATE A NEW USER
app.post('/users', (req, res) => {
	
	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['email', 'password']);

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
	});
});

// LOGIN A USER
app.post('/users/login', (req, res) => {
	
	// Use lodash to create a body object 
	// that we can use to pass into our data scheme
	// from request's body
	var body = _.pick(req.body, ['email', 'password']);

	// Lookup user with credentials (instance method)
	User.findByCredentials(body.email, body.password).then((user) => {

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

// Start app up on port number set by environment PORT variable:
app.listen(port, () => {
	console.log(`started on port ${port}`);
});

module.exports = {
	app: app
};