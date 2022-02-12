const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const covidSchema = new Schema({
	staffId: {
		type: Schema.Types.ObjectId,
		ref: 'Staff',
		required: true,
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
