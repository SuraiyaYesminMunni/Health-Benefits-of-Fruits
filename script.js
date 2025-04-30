// Simple Smooth Scroll Functionality for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });
});

// Simple Form Validation (Optional)
document.querySelector('.contact-form').addEventListener('submit', function (e) {
    let fname = document.getElementById('fname').value;
    let lname = document.getElementById('lname').value;
    let email = document.getElementById('email').value;
    let message = document.getElementById('message').value;

    if (fname === '' || lname === '' || email === '' || message === '') {
        alert('Please fill out all fields.');
        e.preventDefault();
    } else {
        alert('Form submitted successfully!');
    }
});


 