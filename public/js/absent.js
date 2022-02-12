const annualLeave = document.getElementById('annualLeave').value;
// Chọn nhiều ngày, tối đa theo ngày nghỉ còn lại
mobiscroll.datepicker('#dateAbsent', {
	controls: ['calendar'],
	selectMultiple: true,
	selectCounter: true,
	selectMax: annualLeave,
	display: 'center',
	touchUi: true,
});

let selectTimeAbsent = () => {
	let timeAbsent = document.getElementById('timeAbsent').value;
	let dateAbsent = document.getElementById('dateAbsent').value;

	// Lấy ra số ngày mà nhân viên đã chọn
	let splits = dateAbsent.split(',');
	let dateAbsentLength = splits.length; // lấy ra được tổng số ngày mà nhân viên đã chọn

	// Tính số giờ nghỉ dựa trên ngày đã chọn
	let annualLeaveLoss = (timeAbsent * dateAbsentLength) / 8;
	document.getElementById('annualLeaveLoss').innerHTML = annualLeaveLoss;
	document.getElementById('hidden').setAttribute('value', annualLeaveLoss); // truyền cho server

	// Check ngày chọn có > ngày nghỉ thực
	const errMsg = document.getElementById('errMsg');
	const btnAbsent = document.getElementById('btnAbsent');
	if (Number(document.getElementById('annualLeaveLoss').innerHTML) > Number(annualLeave)) {
		// Nếu có thì không cho đăng ký
		errMsg.classList.remove('d-none');
		btnAbsent.disabled = true;
	} else {
		errMsg.classList.add('d-none');
		btnAbsent.disabled = false;
	}
};
