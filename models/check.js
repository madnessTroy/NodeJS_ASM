const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const checkSchema = new Schema({
	date: Number,
	month: Number,
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	timesheet: [
		{
			start: Date,
			place: String,
			end: Date,
			worked: Number,
		},
	],
	isAnnualLeave: {
		type: Boolean,
		default: false,
	},
	annualLeaveTime: Number,
	totalHrs: Number,
	overTime: Number,
	isEdit: Boolean,
});

module.exports = mongoose.model('Check', checkSchema);
