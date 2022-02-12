// Modules for index.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
// Modules for app
const mongoose = require('mongoose');
// Route
const staffRoutes = require('./routes/staff');
// Staff model
const Staff = require('./models/staff');
const Check = require('./models/check');
const req = require('express/lib/request');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
// const __dirname = path.resolve();
app.use(express.static(path.join(__dirname, 'public')));

// Config view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
	Staff.findById('6201404c46bd2d5ca0a69a6a')
		.then((staff) => {
			req.staff = staff;
			next();
		})
		.catch((err) => {
			console.log(err);
		});
});

app.use(staffRoutes);

// Connect to DB and initial WebServer
const PORT = 3000;
const URI =
	'mongodb+srv://admin:admin@asm1.vqwxp.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';

mongoose
	.connect(URI)
	.then(() => {
		console.log(`From index.js \nConnect to DB Succes!`);
		app.listen(PORT);
		console.log(`Server is running on PORT: ${PORT}`);
	})
	.catch((err) => {
		console.log(`From index.js || Connect to DB Failed! ${err}`);
	});
