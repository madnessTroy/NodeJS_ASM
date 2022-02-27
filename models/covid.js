const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const covidSchema = new Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: true,
	},
	staffList: {
		type: Schema.Types.ObjectId,
		ref: 'User',
	},
	timesheet: [
		{
			date: Number,
			month: Number,
			temp: Number,
			isCovid: Boolean,
		},
	],
	firstDose: {
		brand: String,
		date: Date,
	},
	secondDose: {
		brand: String,
		date: Date,
	},
});

module.exports = mongoose.model('Covid', covidSchema);
