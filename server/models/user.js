// STARTER USER DATA MODEL WITH MODEL 
// AND INSTANCE METHODS TO HANDLE AUTHENTICATION:

var mongoose = require('mongoose');
var validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

var UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		trim: true,
		minlength:1,
		unique: true,
		validate: {
			validator: validator.isEmail,
			message: '{VALUE} is not a valid email'
		}
	},
	password: {
		type: String,
		require: true,
		minlength: 6
	},
	tokens: [{
		access: {
			type: String,
			required: true
		},
		token: {
			type: String,
			required: true
		}
	}]
});


UserSchema.methods.toJSON = function () {
	var user = this;
	var userObject = user.toObject();
	return _.pick(userObject, ['_id', 'email']);
};

// Method to Create a token and add it to the user model's token array
// Use for creation of new user accounts and logging in:
UserSchema.methods.generateAuthToken = function () {
	var user = this;

	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, process.env.JWT_SECRET).toString();

	user.tokens.push({
		access: access,
		token: token
	});

	return user.save().then(() => {
		return token;
	});
};

// Method to Remove the token from user
// Use for logging out:
UserSchema.methods.removeToken = function (token) {
	var user = this;

	return user.update({
		$pull: {
			tokens: {
				token: token
			}
		}
	});
};

// Method to find a user based on current token
// Use for authentication middleware:
UserSchema.statics.findByToken = function(token) {
	var User = this;
	var decoded;

	try {
		decoded = jwt.verify(token, process.env.JWT_SECRET)
	} catch (e) {
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	})
};

// Instance method used to find a user based on email and password
// Used to login in tandem with generateAuthToken:
UserSchema.statics.findByCredentials = function(email, password) {
	var User = this;

	return User.findOne({
		'email': email
	}).then((user) => {
		if(!user) {
			return Promise.reject();
		}

		return new Promise((resolve, reject) => {

			bcrypt.compare(password, user.password, (err, result) => {
				//console.log(err, result);
				if(result){
					//return user.generateAuthToken();
					resolve(user);
				} else {
					reject();
				}
			});

		});

	});
};

// Hash and salt password if it ever changes:
UserSchema.pre('save', function (next) {
	var user = this;

	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {

				user.password = hash;
				next();

			});
		});
	} else {

		next();
	
	}
});

var User = mongoose.model('User', UserSchema);

module.exports = {
	User: User
}