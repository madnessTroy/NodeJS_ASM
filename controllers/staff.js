const Staff = require('../models/staff');
const Check = require('../models/check');
const Covid = require('../models/covid');
const covid = require('../models/covid');

exports.getStaffs = (req, res) => {
	Staff.find()
		.then((staffs) => {
			res.render('staff/staff-list', {
				staffs: staffs,
				path: '/',
				pageTitle: 'Home',
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getCheckIn = (req, res) => {
	const staffId = req.staff._id;

	Staff.findById(staffId)
		.then((staff) => {
			res.render('staff/check-in', {
				staff: staff,
				path: '/check-in',
				pageTitle: 'Check In',
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postCheckIn = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Staff.findByIdAndUpdate(staffId, { workStatus: true })
		.then(() => {
			Check.findOne({
				// Kiểm tra có ngày checkIn hôm nay chưa
				staffId: staffId,
				date: currentDay,
				month: currentMonth,
			}).then((checkInfo) => {
				if (!checkInfo) {
					const checkIn = new Check({
						date: now.getDate(),
						month: now.getMonth() + 1,
						staffId: req.staff,
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
			res.redirect('/status/:staffId');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getStatus = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Check.findOne({
		staffId: staffId,
		date: currentDay,
		month: currentMonth,
	})
		.populate('staffId')
		.then((status) => {
			res.render('staff/status', {
				status: status,
				path: '/status',
				pageTitle: 'Trạng Thái',
			});
		});
};

exports.getCheckOut = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Check.findOne({
		staffId: staffId,
		date: currentDay,
		month: currentMonth,
	})
		.populate('staffId')
		.then((staff) => {
			res.render('staff/check-out', {
				staff: staff,
				path: '/check-out',
				pageTitle: 'Check Out',
			});
		});
};

exports.postCheckOut = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();
	const currentDay = now.getDate();
	const currentMonth = now.getMonth() + 1;

	Staff.findByIdAndUpdate(staffId, { workStatus: false })
		.then(
			Check.findOne({
				staffId: staffId,
				date: currentDay,
				month: currentMonth,
			})
				.populate('staffId')
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
					checkInfo.staffId.annualLeave = checkInfo.staffId.annualLeave + annualLeave;

					return checkInfo.save();
				})
		)
		.then(() => {
			res.redirect('/status/:staffId');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getAbsent = (req, res) => {
	const staffId = req.staff._id;

	Staff.findById(staffId)
		.then((staff) => {
			res.render('staff/absent', {
				pageTitle: 'Nghỉ phép',
				staff: staff,
				path: '/absent',
			});
		})
		.catch((err) => console.log(err));
};

exports.postAbsent = (req, res) => {
	const staffId = req.staff._id;

	Staff.findById(staffId)
		.then((staff) => {
			const annualLeaveLoss = Number(req.body.annualLeaveLoss);
			staff.annualLeave = staff.annualLeave - annualLeaveLoss;

			return staff.save();
		})
		.then(() => {
			Check.find({ staffId: staffId })
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
								staffId: staffId,
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
	const staffId = req.staff._id;

	Staff.findById(staffId)
		.then((staffInfo) => {
			res.render('staff/info', {
				staff: staffInfo,
				path: '/info',
				pageTitle: 'Thông tin',
			});
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.postInfo = (req, res) => {
	const staffId = req.staff._id;
	const updatedImageUrl = req.body.imageUrl;
	Staff.findOneAndUpdate({ staffId: staffId }, { imageUrl: updatedImageUrl })
		.then(() => {
			res.redirect('/');
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getWorked = (req, res) => {
	const staffId = req.staff._id;
	const monthSelect = req.body.monthSelect;

	Check.find({ staffId: staffId, month: monthSelect })
		.populate('staffId')
		.then((workedTime) => {
			if (workedTime[0]) {
				let totalOverTime = 0; // Tổng thời gian tăng ca
				let totalSortTime = 0; // Tổng thời gian làm thiếu (<8h/ngày)
				workedTime.map((data) => {
					totalOverTime = totalOverTime + data.overTime;
					// Nếu tổng giờ làm + tổng giờ đki nghỉ < 8 => ngày đó làm thiếu giờ
					if (data.totalHrs + data.annualLeaveTime < 8) {
						totalSortTime = 8 - data.totalHrs - data.annualLeaveTime + totalSortTime;
					}
				});
				// Tính lương
				let salary = workedTime[0].staffId.salaryScale * 3000000; // Lương cơ bản
				salary = salary + (totalOverTime - totalSortTime) * 200000; // Sau khi cộng/trừ giờ tăng ca/thiếu

				res.render('staff/worked', {
					workedTime: workedTime,
					totalOverTime: totalOverTime,
					totalSortTime: totalSortTime,
					salary: salary,
					path: '/worked',
					pageTitle: 'Lương',
				});
			} else {
				res.render('staff/worked', {
					workedTime: workedTime,
					monthSelect: monthSelect,
					path: '/worked',
					pageTitle: 'Lương',
				});
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

exports.getCovid = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();

	// Kiểm tra xem đã có data covid ngày hôm nay chưa
	Covid.findOne({ staffId: staffId })
		.populate('staffId')
		.then((staff) => {
			if (!staff) {
				const newCovidInfo = new Covid({
					staffId: staffId,
				});
				return newCovidInfo.save();
			}
		})
		.then(() => {
			Covid.find()
				.populate('staffId')
				.then((covidInfo) => {
					res.render('staff/staff-list-covid', {
						covidInfo: covidInfo,
						pageTitle: 'Thông tin Covid-19',
						path: '/covid',
					});
				});
		})
		.catch((err) => console.log(err));
};

exports.getCovidInfo = (req, res) => {
	const staffId = req.staff._id;

	Covid.find(staffId)
		.populate('staffId')
		.then((covidInfo) => {
			console.log(covidInfo);
			res.render('staff/covid', {
				covidInfo: covidInfo,
				pageTitle: 'Thông tin Covid-19',
				path: '/covid',
			});
		})
		.catch((err) => console.log(err));
};

exports.getCovidRegis = (req, res) => {
	const staffId = req.staff._id;

	Covid.find(staffId)
		.populate('staffId')
		.then((covidInfo) => {
			console.log(covidInfo);
			res.render('staff/covid-regis', {
				covidInfo: covidInfo,
				pageTitle: 'Đăng ký thông tin Covid-19',
				path: '/covid',
			});
		})
		.catch((err) => console.log(err));
};

exports.postCovidRegis = (req, res) => {
	const staffId = req.staff._id;
	const now = new Date();

	const temp = req.body.temp;
	const firstDoseBrand = req.body.firstDoseBrand;
	const firstDoseDate = req.body.firstDoseDate;
	const secondDoseBrand = req.body.secondDoseBrand;
	const secondDoseDate = req.body.secondDoseDate;
	const isCovid = req.body.isCovid;

	Covid.findOne({ staffId: staffId, date: now.getDate(), month: now.getMonth() + 1 })
		.populate('staffId')
		.then((covidInfo) => {
			covidInfo.timesheet = {
				date: now.getDate(),
				month: now.getMonth() + 1,
				temp: temp,
				isCovid: isCovid,
			};
			covidInfo.firstDose = { brand: firstDoseBrand, date: firstDoseDate };
			covidInfo.secondDose = { brand: secondDoseBrand, date: secondDoseDate };

			return covidInfo.save();
		})
		.then(() => {
			res.redirect('/covid');
		})
		.catch((err) => {
			console.log(err);
		});
};
