// Utilitários de autenticação
class AuthUtils {
  static getLoggedUser() {
    try {
      const userData = localStorage.getItem("usuarioLogado");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Erro ao obter usuário logado:', error);
      return null;
    }
  }

  static isLoggedIn() {
    return this.getLoggedUser() !== null;
  }

  static logout() {
    try {
      if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem("usuarioLogado");
        sessionStorage.removeItem("usuarioCorrente");

        // Limpar outros dados relacionados
        const keysToRemove = [
          'urlDestino',
          'theme',
          'sidebarCollapsed'
        ];

        keysToRemove.forEach(key => {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        });

        window.location.href = "/modulos/login/login.html";
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      window.location.href = "/modulos/login/login.html";
    }
  }

  static requireLogin() {
    if (!this.isLoggedIn()) {
      sessionStorage.setItem("urlDestino", window.location.href);
      window.location.href = "/modulos/login/login.html";
      return false;
    }
    return true;
  }

  static updateButtonsVisibility() {
    const loginBtn = document.querySelector('#loginBtn');
    const signUpBtn = document.querySelector('#signupBtn');
    const logoutBtn = document.querySelector('#logoutBtn');

    const isLoggedIn = this.isLoggedIn();

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
}

// Tornar disponível globalmente
window.AuthUtils = AuthUtils;
window.logoutUser = () => AuthUtils.logout();
window.verificaUsuarioCorrente = () => AuthUtils.requireLogin();

// Atualizar botões quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
  AuthUtils.updateButtonsVisibility();
});
// Função para obter usuário logado
function getUsuarioLogado() {
  return JSON.parse(sessionStorage.getItem('usuarioCorrente')) || JSON.parse(localStorage.getItem('usuarioLogado')) || null;
}

// Verificar autenticação
function verificarAutenticacao() {
  const usuario = getUsuarioLogado();
  if (!usuario) {
    window.location.href = '../login/login.html';
    return false;
  }
  return usuario;
}

// Logout do usuário
function logoutUser() {
  sessionStorage.removeItem('usuarioCorrente');
  localStorage.removeItem('usuarioLogado');
  window.location.href = '../login/login.html';
}

// Obter usuário atual
function getCurrentUser() {
  return getUsuarioLogado();
}

// Variável global para compatibilidade
let usuarioLogado = getUsuarioLogado();