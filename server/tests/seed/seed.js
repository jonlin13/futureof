// SEED A TEST DATABASE:

const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

// Pull in data models:
const {dataModelName} = require('./../../models/dataModelName');
const {User} = require('./../../models/user');

// Create test user IDs:
const userOneId = new ObjectID();
const userTwoId = new ObjectID();

// Create test users:
const users = [{
	_id: userOneId,
	email: 'jon@gmail.com',
	password: 'userOnePass',
	tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userOneId, access: 'auth'}, process.env.JWT_SECRET).toString()
	}]
},{
	_id: userTwoId,
	email: 'jen@example.com',
	password: 'userTwoPass',
	tokens: [{
		access: 'auth',
		token: jwt.sign({_id: userTwoId, access: 'auth'}, process.env.JWT_SECRET).toString()
	}]
}];

// Create a couple test data objects:
const dataModelName = [{
	_id: new ObjectID(), 
	text: 'First data model item',
	_creator: userOneId
},{
	_id: new ObjectID(), 
	text: 'Second data model item',
	_creator: userTwoId
}];

// Populate application's test database with data:
const populateDataModelName = (done) => {
	Todo.remove({}).then(() => {
		return Todo.insertMany(todos);
	}).then(() => {
		done();
	});
};

// Populate test database with both users:
const populateUsers = (done) => {
	User.remove({}).then(() => {
		var userOne = new User(users[0]).save();
		var userTwo = new User(users[1]).save();

		return Promise.all([userOne, userTwo]);
	}).then(() => {
		done();
	});
};

module.exports = {
	dataModelName: dataModelName,
	users: users,
	populateDataModelName: populateDataModelName,
	populateUsers: populateUsers

};