const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

//remove all docs:
// Todo.remove({}).then((result) => {
// 	console.log(result);
// });

//find a doc by something more than just id, and remove it:
// Todo.findOneAndRemove({_id: '58e4d6c11e93c0d56ebd8847'}).then((todo) => {
// 	console.log(todo)
// });


//find a doc by id only, and remove it.
Todo.findByIdAndRemove('58e4d6c11e93c0d56ebd8847').then((todo) => {
	console.log(todo);
});
