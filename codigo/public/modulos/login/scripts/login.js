document.addEventListener("DOMContentLoaded", () => {
  const formCadastro = document.getElementById("register-form");
  const formLogin = document.getElementById("login-form");
  const DESTINO_URL = sessionStorage.getItem("urlDestino") || "../index.html";
  const apiUrl = '/usuarios';

  // Cadastro de novo usuário
  if (formCadastro) {
    formCadastro.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nome = document.getElementById("txt_nome").value.trim();
      const login = document.getElementById("txt_login").value.trim();
      const email = document.getElementById("txt_email").value.trim();
      const senha = document.getElementById("txt_senha").value;
      const senha2 = document.getElementById("txt_senha2").value;

      if (senha !== senha2) {
        alert("As senhas informadas não conferem.");
        return;
      }

      const novoUsuario = {
        id: Date.now().toString(),
        nome,
        login,
        email,
        senha,
        tipo: "usuario",
      };

      try {
        // Verifica se login ou e-mail já existem
        const response = await fetch('/usuarios');
        const usuarios = await response.json();

        const jaExiste = usuarios.find(
          (u) => u.login === login || u.email === email
        );

        if (jaExiste) {
          alert("Já existe um usuário com esse login ou e-mail.");
          return;
        }

        // Adiciona o novo usuário ao banco de dados
        await fetch('/usuarios', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(novoUsuario),
        });

        alert("Usuário salvo com sucesso!");
        window.location.href = "../modulos/login/login.html"; // Redireciona para login
      } catch (error) {
        console.error("Erro ao cadastrar usuário:", error);
        alert("Erro ao cadastrar usuário. Tente novamente.");
      }
    });
  }

  // Login de usuário
  if (formLogin) {
    formLogin.addEventListener("submit", (event) => {
      event.preventDefault();

      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;

      fetch('/usuarios')
        .then((response) => response.json())
        .then((usuarios) => {
          const usuarioEncontrado = usuarios.find(
            (u) =>
              (u.login === username || u.email === username) &&
              u.senha === password
          );

          if (usuarioEncontrado) {
            alert(
              `Login realizado com sucesso! Bem-vindo, ${usuarioEncontrado.nome}`
            );
            localStorage.setItem(
              "usuarioLogado",
              JSON.stringify(usuarioEncontrado)
            );
            window.location.href = DESTINO_URL;
          } else {
            alert(
              "Usuário não encontrado. Verifique login e senha ou crie uma conta."
            );
          }
        })
        .catch((error) => {
          console.error("Erro ao buscar usuários:", error);
          alert("Erro ao realizar login. Tente novamente.");
        });
    });
  }
});
