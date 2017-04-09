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

UserSchema.methods.generateAuthToken = function () {
	var user = this;
	var access = 'auth';
	var token = jwt.sign({_id: user._id.toHexString(), access}, '123abc').toString();

	user.tokens.push({
		access: access,
		token: token
	});

	return user.save().then(() => {
		return token;
	});
};

UserSchema.statics.findByToken = function(token) {
	var User = this;
	var decoded;

	try {
		decoded = jwt.verify(token, '123abc')
	} catch (e) {
		return Promise.reject();
	}

	return User.findOne({
		'_id': decoded._id,
		'tokens.token': token,
		'tokens.access': 'auth'
	})
};

UserSchema.pre('save', function (next) {
	var user = this;


// var hashedPassword = '$2a$10$J6IG1O3/e1W6Ea492dye0ubOSNYTREj6cpRW6tKyb2iiuh1KNPMWO'

// bcrypt.compare(password, hashedPassword, (err, result) => {
// 	console.log(result);
// });





	if(user.isModified('password')){
		bcrypt.genSalt(10, (err, salt) => {
			bcrypt.hash(user.password, salt, (err, hash) => {
				//console.log(hash);
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