const User = require('../models/user');

exports.postLogin = (req, res) => {
	const email = req.body.email;
	const password = req.body.password;

	User.findOne({ email: email, password: password })
		.then((user) => {
			if (!user) {
				req.flash('error', 'Sai E-mail hoặc Mật khẩu!');
				return res.redirect('/');
			}

			req.session.isLoggedIn = true;
			req.session.user = user;
			res.redirect('/staff');
		})
		.catch((err) => console.log(err));
};

exports.postLogout = (req, res) => {
	req.session.destroy(() => {
		res.redirect('/');
	});
};
