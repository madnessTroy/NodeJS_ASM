const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
	email: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
	name: {
		type: String,
		required: true,
	},
	doB: {
		type: Date,
		required: true,
	},
	salaryScale: {
		type: Number,
		required: true,
		default: 1,
	},
	startDate: {
		type: Date,
		required: true,
	},
	department: {
		type: String,
		required: true,
	},
	annualLeave: {
		type: Number,
		required: true,
		default: 0,
	},
	imageUrl: {
		type: String,
		required: true,
	},
	workStatus: Boolean,
	isAdmin: Boolean,
	staffList: Schema.Types.ObjectId,
});

module.exports = mongoose.model('User', userSchema);
