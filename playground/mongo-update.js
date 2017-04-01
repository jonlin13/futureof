//const MongoClient = require('mongodb').MongoClient;
const { MongoClient, ObjectID } = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', (err, db) => {
	if(err){
		return console.log('Unable to connect to MongoDB server.');
	}
	console.log('Connected to MongoDB server.');

	//findOneAndUpdate

	// db.collection('Todos').findOneAndUpdate(
	// 	{
	// 		_id: new ObjectID('58df170e1e93c0d56ebcff1d')
	// 	}, 
	// 	{
	// 		$set: {
	// 			completed: false
	// 		}
	// 	},
	// 	{
	// 		returnOriginal: false
	// 	}
	// ).then((result) => {
	// 	console.log(result);
	// });

	db.collection('Users').findOneAndUpdate(
		{
			_id: new ObjectID("58de4a749e2c42a6aba49dd7")
		},
		{
			$set: {
				name: 'Julia'
			},
			$inc: {
				age: 20
			}
		},
		{
			returnOriginal: false
		}
	).then((result) => {
		console.log(result);
	});


	//db.close();
});