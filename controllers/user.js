const User = require('../models/user');
const Check = require('../models/check');
const Covid = require('../models/covid');

exports.getHomePage = (req, res) => {
	User.find()
		.then((staff) => {
			console.log(staff);
			res.render('staff/home', {
				staff: staff,
				path: '/',
				pageTitle: 'Đăng nhập',
				errorMessage: req.flash('error'),
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getStaffs = (req, res) => {
	const userId = req.session.user._id;

	User.findById(userId)
		.then((staff) => {
			res.render('staff/staff-list', {
				staff: staff,
				pageTitle: 'Home',
				isAdmin: staff.isAdmin,
				path: '/staff',
				errorMessage: req.flash('error'),
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getCheckIn = (req, res) => {
	const userId = req.params.userId;

	User.findById(userId)
		.then((staff) => {
			res.render('staff/check-in', {
				staff: staff,
				isAdmin: staff.isAdmin,
				path: '/check-in',
				pageTitle: 'Check In',
				isAdmin: staff.isAdmin,
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postCheckIn = (req, res) => {
	const userId = req.session.user._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	User.findByIdAndUpdate(userId, { workStatus: true })
		.then(() => {
			Check.findOne({
				// Kiểm tra có ngày checkIn hôm nay chưa
				userId: userId,
				date: currentDay,
				month: currentMonth,
			}).then((checkInfo) => {
				if (!checkInfo) {
					const checkIn = new Check({
						date: now.getDate(),
						month: now.getMonth() + 1,
						userId: userId,
						timesheet: [
							{
								start: now,
								place: req.body.place,
							},
						],
					});
					return checkIn.save();
				} else {
					checkInfo.timesheet.push({
						start: now,
						place: req.body.place,
					});
					return checkInfo.save();
				}
			});
		})
		.then(() => {
			res.redirect('/status/:userId');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getStatus = (req, res) => {
	const userId = req.session.user._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Check.findOne({
		userId: userId,
		date: currentDay,
		month: currentMonth,
	})
		.populate('userId')
		.then((staff) => {
			res.render('staff/status', {
				staff: staff,
				isAdmin: req.session.user.isAdmin,
				path: '/status',
				pageTitle: 'Trạng Thái',
			});
		});
};

exports.getCheckOut = (req, res) => {
	const userId = req.session.user._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Check.findOne({
		userId: userId,
		date: currentDay,
		month: currentMonth,
	})
		.populate('userId')
		.then((staff) => {
			res.render('staff/check-out', {
				staff: staff,
				isAdmin: staff.userId.isAdmin,
				path: '/check-out',
				pageTitle: 'Check Out',
			});
		});
};

exports.postCheckOut = (req, res) => {
	const userId = req.session.user._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	User.findByIdAndUpdate(userId, { workStatus: false })
		.then(
			Check.findOne({
				userId: userId,
				date: currentDay,
				month: currentMonth,
			})
				.populate('userId')
				.then((checkInfo) => {
					// Lấy index của timesheet chưa có Check-out
					const index = checkInfo.timesheet.findIndex((item) => {
						return item.end === undefined;
					});

					// Tính thời gian đã làm
					const start = checkInfo.timesheet[index].start;
					const end = now;
					const worked = ((end.getTime() - start.getTime()) / 3600000).toFixed(1);
					checkInfo.timesheet[index].end = end;
					checkInfo.timesheet[index].worked = worked;

					if (checkInfo.userId.isAdmin === false) {
						checkInfo.isEdit = true;
					}

					// Tính tổng giờ đã làm trong ngày
					let totalHrs = 0;
					checkInfo.timesheet.filter((data) => {
						totalHrs = totalHrs + data.worked;
						return totalHrs.toFixed(2);
					});
					let overTime = totalHrs > 8 ? totalHrs - 8 : 0;
					checkInfo.totalHrs = totalHrs;
					checkInfo.overTime = overTime;

					// Tính số ngày nghỉ phép
					let annualLeave = 0;
					if (totalHrs >= 8) {
						return (annualLeave = (totalHrs / 8).toFixed(1));
					}
					checkInfo.userId.annualLeave = checkInfo.userId.annualLeave + annualLeave;

					return checkInfo.save();
				})
		)
		.then(() => {
			res.redirect('/status/:userId');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getAbsent = (req, res) => {
	const userId = req.session.user._id;

	User.findById(userId)
		.then((staff) => {
			res.render('staff/absent', {
				pageTitle: 'Nghỉ phép',
				staff: staff,
				isAdmin: staff.isAdmin,
				path: '/absent',
			});
		})
		.catch((err) => console.log(err));
};

exports.postAbsent = (req, res) => {
	const userId = req.session.user._id;

	User.findById(userId)
		.then((staff) => {
			const annualLeaveLoss = Number(req.body.annualLeaveLoss);
			staff.annualLeave = staff.annualLeave - annualLeaveLoss;

			return staff.save();
		})
		.then(() => {
			Check.find({ userId: userId })
				.then((checkInfo) => {
					const timeAbsent = Number(req.body.timeAbsent);
					const dateAbsent = req.body.dateAbsent;
					const splits = dateAbsent.split(',');

					for (let i = 0; i < splits.length; i++) {
						absentDate = new Date(splits[i]);

						// Kiểm tra đã có ngày-tháng trong Check chưa
						checkInfo.find((data) => {
							return (checkDate =
								data.date == absentDate.getDate() &&
								data.month == absentDate.getMonth() + 1);
						});

						// TH checkDate true (tức là đã có ngày đó trong Check)
						if (checkDate) {
							Check.findOneAndUpdate(
								{
									date: absentDate.getDate(),
									month: absentDate.getMonth() + 1,
								},
								{ isAnnualLeave: true }
							)
								.then((data) => {
									data.overTime =
										data.totalHrs > 8 ? data.totalHrs - 8 : data.overTime;
									data.annualLeaveTime = !data.annualLeaveTime
										? timeAbsent
										: data.annualLeaveTime + timeAbsent;

									return data.save();
								})
								.catch((err) => {
									console.log(err);
								});
						} else {
							const newAnnualLeave = new Check({
								date: absentDate.getDate(),
								month: absentDate.getMonth() + 1,
								userId: userId,
								totalHrs: 0,
								overTime: 0,
								isAnnualLeave: true,
								annualLeaveTime: timeAbsent,
							});

							return newAnnualLeave.save();
						}
					}
				})
				.then(() => {
					res.redirect('/');
				})
				.catch((err) => console.log(err));
		});
};

exports.getInfo = (req, res) => {
	const userId = req.params.userId;

	User.findById(userId)
		.then((staffInfo) => {
			res.render('staff/info', {
				staff: staffInfo,
				isAdmin: staffInfo.isAdmin,
				path: '/info',
				pageTitle: 'Thông tin',
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postInfo = (req, res) => {
	const userId = req.session.user._id;
	const updatedImageUrl = req.body.imageUrl;

	User.findByIdAndUpdate({ _id: userId }, { imageUrl: updatedImageUrl })
		.then(() => {
			res.redirect('/staff');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getWorked = (req, res) => {
	const userId = req.session.user._id;
	const monthSelect = req.body.monthSelect;
	const page = +req.query.page || 1; // Phân trang hiển thị
	let ITEMS_PER_PAGE = 2;
	let totalTimesheet = 0;
	// Mặc định render tất cả cá tháng có trong DB
	if (monthSelect === undefined) {
		Check.find({ userId: userId })
			.populate('userId')
			.then((workedTime) => {
				console.log(workedTime);
				// Nếu có DB giờ làm
				if (workedTime) {
					let totalOverTime = 0; // Tổng thời gian tăng ca
					let totalSortTime = 0; // Tổng thời gian làm thiếu (<8h/ngày)
					workedTime.map((data) => {
						totalOverTime += data.overTime;
						if (data.annualLeaveTime === undefined) {
							totalSortTime += 8 - data.totalHrs;
						} else {
							// Nếu tổng giờ làm + tổng giờ đki nghỉ < 8 => ngày đó làm thiếu giờ
							totalSortTime += 8 - data.totalHrs - data.annualLeaveTime;
						}
					});
					// Tính lương
					let salary = workedTime[0].userId.salaryScale * 3000000; // Lương cơ bản
					salary = salary + (totalOverTime - totalSortTime) * 200000; // Sau khi cộng/trừ giờ tăng ca/thiếu ca

					// Pagination (đếm tổng số ngày đã làm từ DB)
					for (let i = 0; i < workedTime.length; i++) {
						totalTimesheet = i;
					}
					console.log(totalTimesheet);
					// Nếu là nhân viên thì lấy thêm thông tin của quản lý (Quản lý thì không cần)
					if (workedTime[0].userId.isAdmin === false) {
						User.find({ _id: workedTime[0].userId.staffList }).then((staffList) => {
							res.render('staff/worked', {
								staff: workedTime,
								staffList: staffList,
								isAdmin: workedTime[0].userId.isAdmin,
								totalOverTime: totalOverTime,
								totalSortTime: totalSortTime,
								salary: salary,
								currentPage: page,
								hasNextPage: ITEMS_PER_PAGE * page < totalTimesheet,
								hasPreviousPage: page > 1,
								nextPage: page + 1,
								previousPage: page - 1,
								lastPage: Math.ceil(totalTimesheet / ITEMS_PER_PAGE),
								path: '/worked',
								pageTitle: 'Lương',
							});
						});
					} else {
						// Quản lý
						res.render('staff/worked', {
							staff: workedTime,
							staffList: undefined,
							isAdmin: workedTime[0].userId.isAdmin,
							totalOverTime: totalOverTime,
							totalSortTime: totalSortTime,
							salary: salary,
							currentPage: page,
							hasNextPage: ITEMS_PER_PAGE * page < totalTimesheet,
							hasPreviousPage: page > 1,
							nextPage: page + 1,
							previousPage: page - 1,
							lastPage: Math.ceil(totalTimesheet / ITEMS_PER_PAGE),
							path: '/worked',
							pageTitle: 'Lương',
						});
					}
				} else {
					res.render('not-found', {
						pageTitle: 'Lỗi!',
						isAdmin: req.session.user.isAdmin,
						staff: req.session.user,
						path: '/not-found',
					});
				}
			})
			.catch((err) => {
				console.log(err);
			});

		// Trường hợp người dùng muốn xem bảng lương theo tháng
	} else {
		Check.find({ userId: userId, month: monthSelect })
			.populate('userId')
			.then((workedTime) => {
				console.log(workedTime);
				if (workedTime[0]) {
					let totalOverTime = 0; // Tổng thời gian tăng ca
					let totalSortTime = 0; // Tổng thời gian làm thiếu (<8h/ngày)
					workedTime.map((data) => {
						totalOverTime += data.overTime;
						if (data.annualLeaveTime === undefined) {
							totalSortTime += 8 - data.totalHrs;
						} else {
							// Nếu tổng giờ làm + tổng giờ đki nghỉ < 8 => ngày đó làm thiếu giờ
							totalSortTime += 8 - data.totalHrs - data.annualLeaveTime;
						}
					});
					// Tính lương
					let salary = workedTime[0].userId.salaryScale * 3000000; // Lương cơ bản
					salary = salary + (totalOverTime - totalSortTime) * 200000; // Sau khi cộng/trừ giờ tăng ca/thiếu ca

					// Pagination (đếm tổng số ngày đã làm từ DB)
					for (let i = 0; i < workedTime.length; i++) {
						totalTimesheet = i;
					}

					if (workedTime[0].userId.isAdmin === false) {
						User.find({ _id: workedTime[0].userId.staffList }).then((staffList) => {
							console.log(staffList);
							res.render('staff/worked', {
								staff: workedTime,
								staffList: staffList,
								isAdmin: workedTime[0].userId.isAdmin,
								totalOverTime: totalOverTime,
								totalSortTime: totalSortTime,
								salary: salary,
								currentPage: page,
								hasNextPage: ITEMS_PER_PAGE * page < totalTimesheet,
								hasPreviousPage: page > 1,
								nextPage: page + 1,
								previousPage: page - 1,
								lastPage: Math.ceil(totalTimesheet / ITEMS_PER_PAGE),
								path: '/worked',
								pageTitle: 'Lương',
							});
						});
					} else {
						// Quản lý
						res.render('staff/worked', {
							staff: workedTime,
							staffList: undefined,
							isAdmin: workedTime[0].userId.isAdmin,
							totalOverTime: totalOverTime,
							totalSortTime: totalSortTime,
							salary: salary,
							currentPage: page,
							hasNextPage: ITEMS_PER_PAGE * page < totalTimesheet,
							hasPreviousPage: page > 1,
							nextPage: page + 1,
							previousPage: page - 1,
							lastPage: Math.ceil(totalTimesheet / ITEMS_PER_PAGE),
							path: '/worked',
							pageTitle: 'Lương',
						});
					}
				} else {
					res.render('not-found', {
						pageTitle: 'Lỗi!',
						isAdmin: req.session.user.isAdmin,
						staff: req.session.user,
						path: '/not-found',
					});
				}
			})
			.catch((err) => {
				console.log(err);
			});
	}
};

// Hiển thị trang covid của tất cả nhân viên
exports.getCovid = (req, res) => {
	const userId = req.session.user._id;

	// Kiểm tra xem đã có data covid ngày hôm nay chưa
	Covid.findOne({ userId: userId })
		.then((staff) => {
			if (!staff) {
				const newCovidInfo = new Covid({
					userId: userId,
				});
				return newCovidInfo.save();
			}
		})
		.then((staff) => {
			Covid.find({ userId: userId })
				.populate('userId')
				.then((staff) => {
					if (staff[0].userId.isAdmin === true) {
						User.find({ _id: staff[0].userId.staffList }).then((staffList) => {
							res.render('staff/staff-list-covid', {
								staff: staff,
								staffList: staffList,
								isAdmin: staff[0].userId.isAdmin,
								pageTitle: 'Thông tin Covid-19',
								path: '/covid',
							});
						});
					} else {
						res.render('staff/staff-list-covid', {
							staff: staff,
							staffList: undefined,
							isAdmin: staff[0].userId.isAdmin,
							pageTitle: 'Thông tin Covid-19',
							path: '/covid',
						});
					}
				});
		})
		.catch((err) => console.log(err));
};

// Hiển thị trang covid của mỗi cá nhân
exports.getCovidInfo = (req, res) => {
	const userId = req.params.userId;
	Covid.find({ userId: userId })
		.populate('userId')
		.then((staff) => {
			res.render('staff/covid', {
				staff: staff,
				isAdmin: staff[0].userId.isAdmin,
				pageTitle: 'Thông tin Covid-19',
				path: '/covid',
			});
		})
		.catch((err) => console.log(err));
};

exports.getCovidRegis = (req, res) => {
	const userId = req.params.userId;
	const now = new Date();

	Covid.find({ userId: userId })
		.populate('userId')
		.then((staff) => {
			res.render('staff/covid-regis', {
				staff: staff,
				isAdmin: staff[0].userId.isAdmin,
				now: now,
				pageTitle: 'Đăng ký thông tin Covid-19',
				path: '/covid',
			});
		})
		.catch((err) => console.log(err));
};

exports.postCovidRegis = (req, res) => {
	const userId = req.session.user._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;
	let matchDate;

	const temp = req.body.temp;
	const firstDoseBrand = req.body.firstDoseBrand;
	const firstDoseDate = req.body.firstDoseDate;
	const secondDoseBrand = req.body.secondDoseBrand;
	const secondDoseDate = req.body.secondDoseDate;
	const isCovid = req.body.isCovid;

	Covid.findOne({ userId: userId })
		.populate('userId')
		.then((staff) => {
			staff.timesheet.filter((data) => {
				matchDate = data.date === currentDay && data.month === currentMonth ? true : false;
			});
			// Nếu đã có ngày trong DB thì update
			if (matchDate === true) {
				staff.timesheet = {
					date: now.getDate(),
					month: now.getMonth() + 1,
					temp: temp,
					isCovid: isCovid,
				};
				staff.firstDose = { brand: firstDoseBrand, date: firstDoseDate };
				staff.secondDose = { brand: secondDoseBrand, date: secondDoseDate };

				return staff.save();
			} else {
				// Không có thì thêm mới
				staff.timesheet.push({
					date: now.getDate(),
					month: now.getMonth() + 1,
					temp: temp,
					isCovid: isCovid,
				});
				staff.firstDose = { brand: firstDoseBrand, date: firstDoseDate };
				staff.secondDose = { brand: secondDoseBrand, date: secondDoseDate };

				return staff.save();
			}
		})
		.then(() => {
			res.redirect('/covid');
		})
		.catch((err) => {
			console.log(err);
		});
};
