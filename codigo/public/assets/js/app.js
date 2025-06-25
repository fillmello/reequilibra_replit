// Verifica se o usuário está logado
function verificaUsuarioCorrente() {
  try {
    const usuarioCorrente = JSON.parse(localStorage.getItem("usuarioLogado"));
    if (!usuarioCorrente) {
      // Se não estiver logado, redireciona para a página de login
      window.location.href = "/modulos/login/login.html";
      return null;
    }
    return usuarioCorrente;
  } catch (error) {
    console.error('Erro ao verificar usuário:', error);
    localStorage.removeItem("usuarioLogado");
    window.location.href = "/modulos/login/login.html";
    return null;
  }
}

// Função para fazer logout
function logoutUser() {
  try {
    if (confirm('Tem certeza que deseja sair?')) {
      localStorage.removeItem("usuarioLogado");
      sessionStorage.removeItem("usuarioCorrente");
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/modulos/login/login.html";
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
    window.location.href = "/modulos/login/login.html";
  }
}

// Define usuarioLogado globally
let usuarioLogado = null;
try {
  const usuarioData = localStorage.getItem("usuarioLogado");
  if (usuarioData) {
    usuarioLogado = JSON.parse(usuarioData);
  }
} catch (error) {
  console.error('Erro ao carregar usuário logado:', error);
  usuarioLogado = null;
}

// Make functions available globally
window.verificaUsuarioCorrente = verificaUsuarioCorrente;
window.logoutUser = logoutUser;
window.usuarioLogado = usuarioLogado;

// Update button visibility based on login status
document.addEventListener('DOMContentLoaded', function() {
  updateLoginButtons();
});

function updateLoginButtons() {
  const loginBtn = document.querySelector('#loginBtn');
  const signUpBtn = document.querySelector('#signupBtn');
  const logoutBtn = document.querySelector('#logoutBtn');

  const isLoggedIn = localStorage.getItem('usuarioLogado');

  if (!isLoggedIn) {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (signUpBtn) signUpBtn.style.display = 'inline-block';
  } else {
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (loginBtn) loginBtn.style.display = 'none';
    if (signUpBtn) signUpBtn.style.display = 'none';
  }
}
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