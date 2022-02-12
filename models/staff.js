const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const staffSchema = new Schema({
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
		default: Date.now,
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
	workStatus: Boolean,
	imageUrl: {
		type: String,
		required: true,
	},
});

module.exports = mongoose.model('Staff', staffSchema);
