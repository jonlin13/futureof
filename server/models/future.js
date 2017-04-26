var mongoose = require('mongoose');

// Create a data model, 
// and if authentication should be required to view, 
// give it a _creator attribute with ObjectId: 
var FutureSchema = new mongoose.Schema(
	{
		question: {
			type: String,
			required: true,
			minlength: 1,
			trim: true
		},
		_creator: {
			type: mongoose.Schema.Types.ObjectId,
			required: true
		},
		responses: [
			{
				response: {
					type: String,
					required: true,
					minlength: 1,
					trim: true
				},
				user: {
					type: mongoose.Schema.Types.ObjectId,
					required: true
				},
				date: { type: Date, default: Date.now }	
			}
		],
		followers: [
			{
				user: {
					type: mongoose.Schema.Types.ObjectId,
					required: true
				},
				date: { type: Date, default: Date.now }	
			}
		]
	}, 
	{ 
		timestamps: { createdAt: 'created_at' } 
	}
);

FutureSchema.index(
	{ "followers.user" : 1 },
	{ unique: true, partialFilterExpression : { "followers.user" : { $type: 7 } } } 
);

var Future = mongoose.model('Future', FutureSchema);

module.exports = {
	Future: Future
}