let imageUrl = document.getElementById('imageUrl');
const handleEditImageUrl = () => {
	if (imageUrl.disabled) {
		imageUrl.classList.add('bg-light', 'text-dark');
		imageUrl.disabled = false;
	} else {
		imageUrl.classList.remove('bg-light', 'text-dark');
		imageUrl.disabled = true;
	}
};
