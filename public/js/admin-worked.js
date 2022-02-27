var table = document.getElementsByTagName('table');

for (let i = 0; i < table.length; i++) {
	const deleteBtn = document.getElementsByClassName('delete-btn')[i];
	const confirmBtn = document.getElementsByClassName('confirm-btn')[i];
	const cancelBtn = document.getElementsByClassName('cancel-btn')[i];

	confirmBtn.style.display = 'none';
	cancelBtn.style.display = 'none';

	deleteBtn.onclick = () => {
		deleteBtn.style.display = 'none';

		confirmBtn.style.display = 'block';
		cancelBtn.style.display = 'block';
	};

	cancelBtn.onclick = () => {
		confirmBtn.style.display = 'none';
		cancelBtn.style.display = 'none';

		deleteBtn.style.display = 'block';
	};
}
