// Third-party packages for index.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
// Modules for app
const mongoose = require('mongoose');
// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
// User model
const User = require('./models/user');
// MongoDB link
const MONGODB_URI = 'mongodb+srv://admin:admin@asm1.vqwxp.mongodb.net/myFirstDatabase';

// Initial app
const app = express();
const store = new MongoDBStore({
	uri: MONGODB_URI,
	collection: 'sessions',
});
const csrfProtection = csrf();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: 'my secret', resave: false, saveUninitialized: false, store: store }));
app.use(csrfProtection);
app.use(flash());

// Config view engine
app.set('view engine', 'ejs');
app.set('views', 'views');

app.use((req, res, next) => {
	res.locals.isAuthenticated = req.session.isLoggedIn;
	res.locals.csrfToken = req.csrfToken();
	next();
});

app.use(authRoutes);
app.use(userRoutes);
app.use('/admin', adminRoutes);
// Connect to DB and initial WebServer
const PORT = 3000;

mongoose
	.connect(MONGODB_URI)
	.then(() => {
		console.log(`From index.js \nConnect to DB Success!`);
		app.listen(PORT);
		console.log(`Server is running on PORT: ${PORT}`);
	})
	.catch((err) => {
		console.log(`From index.js || Connect to DB Failed! ${err}`);
	});
