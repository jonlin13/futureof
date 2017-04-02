const {ObjectID} = require('mongodb');

const {mongoose} = require('./../server/db/mongoose');
const {Todo} = require('./../server/models/todo');
const {User} = require('./../server/models/user');

 var id = '58df2b658e7eccdcbf50bdad';

 if(!ObjectID.isValid(id)){
 	console.log('ID is not valid');  
 }

 // if(!ObjectID.isValid(id)){
 // 	console.log('ID not valid');  
 // }

 // Todo.find({
 // 	_id: id
 // }).then((todos) => {
 // 	console.log('todos: ', todos);
 // });

 // Todo.findOne({
 // 	_id: id
 // }).then((todo) => {
 // 	console.log('todo: ', todo);
 // }); 

// Todo.findById(id).then((todo) => {
// 	if(!todo){
// 		return console.log('Id not found');
// 	}
// 	console.log('Todo: ', todo);
// }).catch((e) => {
// 	console.log(e);
// });

User.findById(id).then((user) => {
	if(!user){
		console.log('User not found');
	}
	console.log('User: ', user)
}).catch((e) => {
	console.log(e);
});