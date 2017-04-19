var mongoose = require('mongoose');

// Create a data model, 
// and if authentication should be required to view, 
// give it a _creator attribute with ObjectId: 

var DataModelName = mongoose.model('DataModelName', {
	text: {
		type: String,
		required: true,
		minlength: 1,
		trim: true
	},
	_creator: {
		type: mongoose.Schema.Types.ObjectId,
		required: true
	}
});

module.exports = {
	DataModelName: DataModelName
};