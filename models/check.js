const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const checkSchema = new Schema({
	date: Number,
	month: Number,
	staffId: {
		type: Schema.Types.ObjectId,
		ref: 'Staff',
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
});

module.exports = mongoose.model('Check', checkSchema);
