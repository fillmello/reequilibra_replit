const loginBtn = document.querySelector('#loginBtn');
const signUpBtn = document.querySelector('#signupBtn');
const logoutBtn = document.querySelector('#logoutBtn');

if (!usuarioLogado){
    logoutBtn.classList.add('d-none');
    loginBtn.classList.add('d-flex');
    signUpBtn.classList.add('d-flex');
}
else{
    logoutBtn.classList.toggle('d-flex');
    loginBtn.classList.toggle('d-none');
    signUpBtn.classList.toggle('d-none');
}


