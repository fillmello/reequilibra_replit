// ========== CONFIGURAÇÃO DA API ==========
const API_BASE_URL = "http://localhost:3000";
const CURRENT_USER_ID = 1;

// ========== VARIÁVEIS GLOBAIS MEMORIES ==========
const btnAddMemory = document.getElementById("btnAddMemory");
let selectedMemory = "";
let memoryID = "";
let boolSelectedMemory = false;

// ========== VARIÁVEIS GLOBAIS FORUMS ==========
let forumID = "";

// ========== VERIFICAÇÃO DE CONEXÃO ==========
function checkServerConnection() {
  return fetch(`${API_BASE_URL}/forums?_limit=1`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Servidor não responde");
      }
      return true;
    })
    .catch((error) => {
      console.error("Erro de conexão com o servidor:", error);
      showErrorModal();
      return false;
    });
}

function showErrorModal() {
  const errorModal = document.getElementById("errorModal");
  if (errorModal) {
    errorModal.style.display = "block";
  }
}

// ========== FUNÇÕES AUXILIARES ==========
function limpaCamposMemory() {
  document.getElementById("memoryCaption").value = "";
  document.getElementById("memoryImage").value = "";
  boolSelectedMemory = false;
}

function limpaCamposForum() {
  document.getElementById("forumTitle").value = "";
  document.getElementById("forumContent").value = "";
  document.getElementById("forumAuthor").value = "";
  document.getElementById("forumIsHealthProfessional").checked = false;
}

function noMemorySelected() {
  if (!boolSelectedMemory) {
    if (document.getElementById("btnAddMemory")) {
      document.getElementById("btnAddMemory").innerHTML = "Adicionar Memory";
    }
    document
      .querySelectorAll(".memory-card")
      .forEach((card) => card.classList.remove("selected-memory"));
  } else {
    if (document.getElementById("btnAddMemory")) {
      document.getElementById("btnAddMemory").innerHTML = "Atualizar Memory";
    }
  }
}

function displayMessage(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `alert alert-${
    type === "success" ? "success" : "danger"
  } position-fixed`;
  notification.style.cssText =
    "top: 100px; right: 20px; z-index: 9999; min-width: 300px;";
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function getTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "há 1 dia";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 14) return "há 1 semana";
  return `há ${Math.floor(diffDays / 7)} semanas`;
}

// ========== MEMORIES CRUD ==========

function createMemory(memoryObject, refreshFunction) {
  limpaCamposMemory();
  fetch(`${API_BASE_URL}/memories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memoryObject),
  })
    .then((response) => {
      if (!response.ok) {
        console.log("Erro ao inserir memory");
        displayMessage("Erro ao inserir memory", "error");
        return;
      }
      return response.json();
    })
    .then((data) => {
      if (data) {
        displayMessage("Memory inserido com sucesso", "success");
        if (refreshFunction) {
          refreshFunction().then(() => {
            selecionaMemory(data.id);
          });
        }
      }
    })
    .catch((error) => {
      console.error("Erro ao inserir memory via API:", error);
      displayMessage("Erro ao inserir memory", "error");
    });
}

function listaMemories() {
  const memoriesContainer = document.getElementById("memoriesContainer");
  return fetch(
    `${API_BASE_URL}/memories?userId=${CURRENT_USER_ID}&_sort=createdAt&_order=desc`
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao carregar memories");
      }
      return response.json();
    })
    .then((memories) => {
      renderMemories(memories);
      return memories;
    })
    .catch((error) => {
      console.error("Erro ao carregar memories:", error);
      if (memoriesContainer) {
        memoriesContainer.innerHTML = `
          <div class="alert alert-warning text-center">
            <i class="bi bi-exclamation-triangle"></i>
            Erro ao carregar memories. Verifique se o servidor está rodando.
          </div>`;
      }
      displayMessage("Erro ao carregar memories", "error");
    });
}

function renderMemories(memories) {
  const container = document.getElementById("memoriesContainer");
  if (!container) return;
  container.innerHTML = "";

  if (memories.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle"></i>
        Nenhum memory encontrado. Adicione seu primeiro memory!
      </div>`;
    return;
  }

  memories.forEach((memory) => {
    const div = document.createElement("div");
    div.className = "memory-item";
    div.innerHTML = `
      <div class="memory-card bg-white shadow-sm" id="cardMemory${
        memory.id
      }" onclick="selecionaMemory('${memory.id}')">
        <img src="${
          memory.imageUrl
        }" class="memory-img" alt="Memory" onerror="this.src='https://via.placeholder.com/1200x400?text=Imagem+não+encontrada'">
        <div class="p-3">
          <p class="mb-2">${memory.caption}</p>
          <small class="text-muted">Postado em: ${new Date(
            memory.createdAt
          ).toLocaleDateString("pt-BR")}</small>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-primary me-2" onclick="event.stopPropagation(); editMemory('${
              memory.id
            }')">
              <i class="bi bi-pencil"></i> Editar
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="event.stopPropagation(); deleteMemory('${
              memory.id
            }', listaMemories)">
              <i class="bi bi-trash"></i> Excluir
            </button>
          </div>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function updateMemory(id, memory, refreshFunction) {
  fetch(`${API_BASE_URL}/memories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memory),
  })
    .then((response) => response.json())
    .then(() => {
      displayMessage("Memory alterado com sucesso", "success");
      if (refreshFunction) {
        boolSelectedMemory = true;
        refreshFunction().then(() => {
          selecionaMemory(id);
          noMemorySelected();
        });
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar memory:", error);
      displayMessage("Erro ao atualizar memory", "error");
    });
}

function deleteMemory(id, refreshFunction) {
  if (!id) {
    displayMessage("Nenhum memory foi selecionado para exclusão", "error");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir este memory?")) return;

  fetch(`${API_BASE_URL}/memories/${id}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        displayMessage("Memory não encontrado", "error");
        return;
      }
      displayMessage("Memory removido com sucesso", "success");
      if (refreshFunction) {
        refreshFunction();
        limpaCamposMemory();
        noMemorySelected();
      }
    })
    .catch((error) => {
      console.error("Erro ao deletar memory:", error);
      displayMessage("Erro ao deletar memory", "error");
    });
}

function selecionaMemory(id) {
  boolSelectedMemory = true;
  noMemorySelected();

  fetch(`${API_BASE_URL}/memories/${id}`)
    .then((response) => response.json())
    .then((data) => {
      const selectedCaption = document.getElementById("memoryCaption");
      if (selectedCaption) {
        selectedCaption.value = data.caption;
      }
      selectedMemory = id;
    })
    .catch((error) => {
      console.error("Erro ao buscar memory:", error);
    });

  document
    .querySelectorAll(".memory-card")
    .forEach((card) => card.classList.remove("selected-memory"));
  const card = document.getElementById(`cardMemory${id}`);
  if (card) card.classList.add("selected-memory");
}

function editMemory(id) {
  fetch(`${API_BASE_URL}/memories/${id}`)
    .then((response) => response.json())
    .then((memory) => {
      const newCaption = prompt("Editar legenda:", memory.caption);
      if (newCaption !== null && newCaption.trim() !== memory.caption) {
        const updatedMemory = { ...memory, caption: newCaption.trim() };
        updateMemory(id, updatedMemory, listaMemories);
      }
    })
    .catch((error) => {
      console.error("Erro ao buscar memory:", error);
      displayMessage("Erro ao buscar memory", "error");
    });
}

// ========== FORUMS CRUD ==========

function createForum(forumObject, refreshFunction) {
  limpaCamposForum();
  fetch(`${API_BASE_URL}/forums`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(forumObject),
  })
    .then((response) => {
      if (!response.ok) {
        displayMessage("Erro ao inserir fórum", "error");
        return;
      }
      return response.json();
    })
    .then((data) => {
      if (data) {
        displayMessage("Fórum inserido com sucesso", "success");
        if (refreshFunction) refreshFunction();
      }
    })
    .catch((error) => {
      console.error("Erro ao inserir fórum via API:", error);
      displayMessage("Erro ao inserir fórum", "error");
    });
}

function listaForums() {
  const forumsContainer = document.querySelector(".list-group");
  return fetch(`${API_BASE_URL}/forums?_sort=createdAt&_order=desc`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao carregar fóruns");
      }
      return response.json();
    })
    .then((forums) => {
      renderForums(forums);
      return forums;
    })
    .catch((error) => {
      console.error("Erro ao carregar fóruns:", error);
      if (forumsContainer) {
        forumsContainer.innerHTML = `
          <div class="alert alert-warning text-center">
            <i class="bi bi-exclamation-triangle"></i>
            Erro ao carregar fóruns. Verifique se o servidor está rodando.
          </div>`;
      }
      displayMessage("Erro ao carregar fóruns", "error");
    });
}

function renderForums(forums) {
  const container = document.querySelector(".list-group");
  if (!container) return;
  container.innerHTML = "";

  if (forums.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info text-center">
        <i class="bi bi-info-circle"></i>
        Nenhum fórum encontrado. Crie o primeiro fórum!
      </div>`;
    return;
  }

  forums.forEach((forum) => {
    const forumDiv = document.createElement("div");
    forumDiv.className = "list-group-item list-group-item-action forum-card m-2";
    forumDiv.id = `cardForum${forum.id}`;
    forumDiv.onclick = () => {
      window.location.href = `forum-detalhes.html?id=${forum.id}`;
    };
    forumDiv.innerHTML = `
      <div class="d-flex justify-content-between">
        <h6 class="mb-1">${forum.title}</h6>
        <small class="text-muted">${getTimeAgo(forum.createdAt)}</small>
      </div>
      <p class="mb-1 small">${forum.content.substring(0, 100)}${
      forum.content.length > 100 ? "..." : ""
    }</p>
      <div class="d-flex justify-content-between align-items-center">
        <small class="text-muted">
          Postado por ${forum.author}
          ${
            forum.isHealthProfessional
              ? '<span class="badge bg-success ms-1">Profissional</span>'
              : ""
          }
        </small>
        <small class="text-muted">
          <i class="bi bi-chat-left-text"></i> ${
            forum.commentsCount || 0
          } comentário${(forum.commentsCount || 0) !== 1 ? "s" : ""}
        </small>
      </div>`;
    container.appendChild(forumDiv);
  });
}

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
  checkServerConnection().then((isConnected) => {
    if (isConnected) {
      listaMemories();
      listaForums();
    }
  });

  if (btnAddMemory) {
    btnAddMemory.addEventListener("click", (event) => {
      event.preventDefault();
      const caption = document.getElementById("memoryCaption").value;
      const fileInput = document.getElementById("memoryImage");
      const date = new Date();

      if (!fileInput.files[0] && !caption.trim()) {
        displayMessage("Adicione uma foto ou legenda", "error");
        return;
      }

      memoryID = Date.now().toString();
      const imageUrl = "https://via.placeholder.com/1200x400?text=New+Memory";

      if (fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const memoryObject = {
            id: memoryID,
            userId: CURRENT_USER_ID,
            imageUrl: e.target.result,
            caption: caption.trim() || "Sem legenda",
            createdAt: date.toISOString(),
          };

          if (!boolSelectedMemory) {
            createMemory(memoryObject, listaMemories);
          } else {
            updateMemory(selectedMemory, memoryObject, listaMemories);
          }
        };
        reader.readAsDataURL(fileInput.files[0]);
      } else {
        const memoryObject = {
          id: memoryID,
          userId: CURRENT_USER_ID,
          imageUrl,
          caption: caption.trim() || "Sem legenda",
          createdAt: date.toISOString(),
        };

        if (!boolSelectedMemory) {
          createMemory(memoryObject, listaMemories);
        } else {
          updateMemory(selectedMemory, memoryObject, listaMemories);
        }
      }
    });
  }

  const createForumBtn = document.getElementById("btnCreateForum");
  if (createForumBtn) {
    createForumBtn.addEventListener("click", () => {
      const forumTitle = document.getElementById("forumTitle");
      const forumContent = document.getElementById("forumContent");
      const forumAuthor = document.getElementById("forumAuthor");
      const forumIsHealthProfessional = document.getElementById(
        "forumIsHealthProfessional"
      );

      if (
        !forumTitle ||
        !forumContent ||
        !forumAuthor ||
        !forumIsHealthProfessional
      ) {
        displayMessage(
          "Erro: Elementos do formulário não encontrados",
          "error"
        );
        return;
      }

      const title = forumTitle.value;
      const content = forumContent.value;
      const author = forumAuthor.value;
      const isHealthProfessional = forumIsHealthProfessional.checked;
      const date = new Date();

      if (!title.trim() || !content.trim() || !author.trim()) {
        displayMessage("Preencha todos os campos", "error");
        return;
      }

      forumID = Date.now().toString();
      const forumObject = {
        id: forumID,
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        createdAt: date.toISOString(),
        isHealthProfessional,
        commentsCount: 0,
      };

      createForum(forumObject, listaForums);

      const modalElement = document.getElementById("novoForumModal");
      if (modalElement) {
        const modal = window.bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
    });
  }

  noMemorySelected();
  console.log("Aplicação inicializada com sucesso!");
});
