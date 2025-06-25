const loginBtn = document.querySelector('#loginBtn');
const signUpBtn = document.querySelector('#signupBtn');
const logoutBtn = document.querySelector('#logoutBtn');

// Get user from localStorage
const usuarioLogado = localStorage.getItem('usuarioLogado');

if (!usuarioLogado){
    if (logoutBtn) logoutBtn.classList.add('d-none');
    if (loginBtn) loginBtn.classList.add('d-flex');
    if (signUpBtn) signUpBtn.classList.add('d-flex');
}
else{
    if (logoutBtn) logoutBtn.classList.toggle('d-flex');
    if (loginBtn) loginBtn.classList.toggle('d-none');
    if (signUpBtn) signUpBtn.classList.toggle('d-none');
}


