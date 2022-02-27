const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const User = require('../models/user');
const Check = require('../models/check');
const Covid = require('../models/covid');

exports.getAdminPage = (req, res, next) => {
	const userId = req.session.user._id;

	User.findById({ _id: userId })
		.then((admin) => {
			User.findById({ _id: admin.staffList }).then((staff) => {
				res.render('admin/staff-management', {
					admin: admin,
					staffList: staff,
					isAdmin: admin.isAdmin,
					pageTitle: 'Quản lý nhân viên',
					path: '/admin',
				});
			});
		})
		.catch((err) => console.log(err));
};

exports.getStaffSalary = (req, res, next) => {
	const staffId = req.params.staffId;
	const monthSelect = req.body.monthSelect;
	const page = +req.query.page || 1; // Phân trang hiển thị
	let ITEMS_PER_PAGE = 0;
	let totalTimesheet = 0;
	let totalOverTime = 0; // Tổng thời gian tăng ca
	let totalSortTime = 0; // Tổng thời gian làm thiếu (<8h/ngày)

	// Mặc định render tất cả cá tháng có trong DB
	if (monthSelect === undefined) {
		Check.find({ userId: staffId })
			.populate('userId')
			.then((workedTime) => {
				// Nếu có DB giờ làm
				if (workedTime !== []) {
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
					User.find({ _id: workedTime[0].userId.staffList }).then((admin) => {
						res.render('admin/worked', {
							staff: workedTime,
							admin: admin,
							isAdmin: true,
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
		Check.find({ userId: staffId, month: monthSelect })
			.populate('userId')
			.then((workedTime) => {
				if (workedTime[0]) {
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
					User.find({ _id: workedTime[0].userId.staffList, month: monthSelect }).then(
						(admin) => {
							res.render('admin/worked', {
								staff: workedTime,
								admin: admin,
								isAdmin: true,
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
					);
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

exports.postDeleteWorked = (req, res, next) => {
	const staffId = req.params.staffId;
	const checkId = req.body.checkId;
	const month = new Date(req.body.start).getMonth() + 1;

	Check.findOneAndUpdate(
		{ userId: staffId, 'timesheet._id': checkId },
		{ $pull: { timesheet: { _id: checkId } } }
	).then(() => {
		Check.updateMany({ userId: staffId, month: month }, { isEdit: false })
			.then(() => {
				console.log('From Admin Controller || Delete worked timesheet complete!');
			})
			.catch((err) => {
				console.log(err);
			});
		res.redirect('/admin/staff-management');
	});
};

exports.getCovidPDF = (req, res, next) => {
	const staffId = req.session.user._id;

	console.log(staffId);
	Covid.findOne({ userId: staffId })
		.populate('userId')
		.then((covidDoc) => {
			console.log(covidDoc);
			const fileName = 'covid-' + covidDoc.userId.name + '-' + staffId + '.pdf';
			const filePath = path.join('data', 'covid-document', fileName);

			// PDF Generation
			const pdfDoc = new PDFDocument();
			res.setHeader('Content-Type', 'applicaiton/pdf');
			res.setHeader('Content-Disposition', 'inline; filename = "' + fileName + '" ');
			pdfDoc.pipe(fs.createWriteStream(filePath));
			pdfDoc.pipe(res);

			// PDF Create
			pdfDoc.fontSize(26).text('THÔNG TIN COVID CÁ NHÂN', { align: 'center' });
			pdfDoc.text('-----------o0o-----------', { align: 'center' });

			pdfDoc.moveDown(0.5);

			pdfDoc.fontSize(20).text('Nhân viên: ' + covidDoc.userId.name);
			pdfDoc.fontSize(20).text('ID: ' + covidDoc.userId._id);

			pdfDoc.moveDown(0.5);

			// Mũi 1:
			pdfDoc
				.fontSize(14)
				.text(
					'Mũi 1: ' +
						covidDoc.firstDose.brand +
						'||' +
						covidDoc.firstDose.date.toLocaleDateString()
				);

			//Mũi 2:
			pdfDoc
				.fontSize(14)
				.text(
					'Mũi 2: ' +
						covidDoc.secondDose.brand +
						'||' +
						covidDoc.secondDose.date.toLocaleDateString()
				);

			// Thông tin thân nhiệt:
			covidDoc.timesheet.forEach((data) => {
				const c = data.isCovid === true ? 'Dương tính' : 'Âm tính';
				pdfDoc
					.fontSize(14)
					.text(
						'Ngày: ' +
							data.date +
							'/' +
							data.month +
							'||' +
							'Nhiệt độ: ' +
							data.temp +
							'||' +
							c
					);
			});
			pdfDoc.end();
		})
		.catch((err) => {
			console.log(err);
		});
};
