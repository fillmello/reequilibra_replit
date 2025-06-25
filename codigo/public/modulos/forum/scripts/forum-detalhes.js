// ========== CONFIGURAÇÃO DA API ==========
const CURRENT_USER_ID = 1

// ========== VARIÁVEIS GLOBAIS ==========
let currentForumId = null
let currentForum = null

// ========== FUNÇÕES AUXILIARES ==========
function getUrlParameter(name) {
  name = name.replace(/[[]/, "\\[").replace(/[\]]/, "\\]")
  const regex = new RegExp("[\\?&]" + name + "=([^&#]*)")
  const results = regex.exec(location.search)
  return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "))
}

function formatDate(dateString) {
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
  return new Date(dateString).toLocaleDateString("pt-BR", options)
}

function displayMessage(message, type = "info") {
  const notification = document.createElement("div")
  notification.className = `alert alert-${type === "success" ? "success" : "danger"} position-fixed`
  notification.style.cssText = "top: 100px; right: 20px; z-index: 9999; min-width: 300px;"
  notification.textContent = message

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// ========== CARREGAMENTO DO FÓRUM ==========
function loadForumDetails() {
  currentForumId = getUrlParameter("id")

  if (!currentForumId) {
    displayMessage("ID do fórum não encontrado", "error")
    document.getElementById("forumDetails").innerHTML = `
      <div class="alert alert-danger">
        Fórum não encontrado. <a href="index.html">Voltar para a página inicial</a>
      </div>
    `
    return
  }

  fetch(`/forums/${currentForumId}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Fórum não encontrado")
      }
      return response.json()
    })
    .then((forum) => {
      currentForum = forum
      renderForumDetails(forum)
      loadComments()
    })
    .catch((error) => {
      console.error("Erro ao carregar detalhes do fórum:", error)
      document.getElementById("forumDetails").innerHTML = `
        <div class="alert alert-danger">
          Erro ao carregar o fórum. <a href="index.html">Voltar para a página inicial</a>
        </div>
      `
    })
}

function renderForumDetails(forum) {
  const forumDetailsElement = document.getElementById("forumDetails")

  forumDetailsElement.innerHTML = `
    <div class="d-flex justify-content-between align-items-start mb-3">
      <h2 class="mb-0">${forum.title}</h2>
      <div class="d-flex align-items-center gap-2">
        <span class="badge ${forum.isHealthProfessional ? "bg-success" : "bg-secondary"} fs-6">
          ${forum.isHealthProfessional ? "Profissional de Saúde" : "Membro da Comunidade"}
        </span>
        <div class="btn-group">
          <button class="btn btn-outline-primary btn-sm" onclick="editForum()">
            <i class="bi bi-pencil"></i> Editar
          </button>
          <button class="btn btn-outline-danger btn-sm" onclick="deleteForum()">
            <i class="bi bi-trash"></i> Excluir
          </button>
        </div>
      </div>
    </div>
    <div class="d-flex justify-content-between text-muted mb-4">
      <span>Por: ${forum.author}</span>
      <span>Publicado em: ${formatDate(forum.createdAt)}</span>
    </div>
    <div class="forum-content mb-4">
      <p class="fs-5">${forum.content}</p>
    </div>
    <div class="d-flex align-items-center">
      <span class="me-3" id="commentsCountDisplay">
        <i class="bi bi-chat-left-text"></i> ${forum.commentsCount || 0} comentário${(forum.commentsCount || 0) !== 1 ? "s" : ""}
      </span>
    </div>
  `
}

// ========== GERENCIAMENTO DE COMENTÁRIOS ==========
function loadComments() {
  // Usando o endpoint direto do JSON Server para filtrar comentários por forumId
  fetch(`/comments?forumId=${currentForumId}&_sort=createdAt&_order=desc`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao carregar comentários")
      }
      return response.json()
    })
    .then((comments) => {
      renderComments(comments)
    })
    .catch((error) => {
      console.error("Erro ao carregar comentários:", error)
      displayMessage("Erro ao carregar comentários", "error")

      const commentsListElement = document.getElementById("commentsList")
      if (commentsListElement) {
        commentsListElement.innerHTML = `
          <div class="alert alert-warning text-center">
            <i class="bi bi-exclamation-triangle"></i>
            Erro ao carregar comentários. Verifique se o servidor está rodando.
          </div>
        `
      }
    })
}

function renderComments(comments) {
  const commentsListElement = document.getElementById("commentsList")
  if (!commentsListElement) return

  if (comments.length === 0) {
    commentsListElement.innerHTML = `
      <div class="alert alert-light text-center">
        Nenhum comentário ainda. Seja o primeiro a comentar!
      </div>
    `
    return
  }

  commentsListElement.innerHTML = ""

  comments.forEach((comment) => {
    const commentElement = document.createElement("div")
    commentElement.className = "card mb-3"
    commentElement.innerHTML = `
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center">
            <h6 class="card-subtitle mb-0 me-2">${comment.author}</h6>
            ${
              comment.isHealthProfessional
                ? `<span class="badge bg-success d-flex align-items-center">
                <i class="bi bi-patch-check-fill me-1"></i> Profissional Verificado
              </span>`
                : ""
            }
          </div>
          <small class="text-muted">${formatDate(comment.createdAt)}</small>
        </div>
        <p class="card-text">${comment.content}</p>
        <div class="d-flex justify-content-end">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteComment('${comment.id}')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    `
    commentsListElement.appendChild(commentElement)
  })
}

function createComment(commentData) {
  fetch("/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao adicionar comentário")
      }
      return response.json()
    })
    .then((data) => {
      displayMessage("Comentário adicionado com sucesso", "success")

      const commentForm = document.getElementById("commentForm")
      if (commentForm) {
        commentForm.reset()
      }

      // Atualiza o contador de comentários no fórum
      updateForumCommentsCount()

      // Recarrega os comentários
      loadComments()
    })
    .catch((error) => {
      console.error("Erro ao adicionar comentário:", error)
      displayMessage("Erro ao adicionar comentário", "error")
    })
}

function deleteComment(commentId) {
  if (!confirm("Tem certeza que deseja excluir este comentário?")) {
    return
  }

  fetch(`/comments/${commentId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao excluir comentário")
      }

      displayMessage("Comentário excluído com sucesso", "success")

      // Atualiza o contador de comentários no fórum
      updateForumCommentsCount()

      // Recarrega os comentários
      loadComments()
    })
    .catch((error) => {
      console.error("Erro ao excluir comentário:", error)
      displayMessage("Erro ao excluir comentário", "error")
    })
}

function updateForumCommentsCount() {
  // Busca o número atual de comentários para este fórum específico
  fetch(`/comments?forumId=${currentForumId}`)
    .then((response) => response.json())
    .then((comments) => {
      // Atualiza o fórum com o novo número de comentários
      if (currentForum) {
        const updatedForum = {
          ...currentForum,
          commentsCount: comments.length,
        }

        fetch(`/forums/${currentForumId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedForum),
        }).then(() => {
          // Atualiza a contagem na interface
          const commentsCountElement = document.getElementById("commentsCountDisplay")
          if (commentsCountElement) {
            commentsCountElement.innerHTML = `
              <i class="bi bi-chat-left-text"></i> ${comments.length} comentário${comments.length !== 1 ? "s" : ""}
            `
          }

          // Atualiza o objeto do fórum atual
          currentForum = updatedForum
        })
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar contagem de comentários:", error)
    })
}

// ========== GERENCIAMENTO DO FÓRUM ==========

// EDITAR FÓRUM
function editForum() {
  if (!currentForum) {
    displayMessage("Erro: Dados do fórum não encontrados", "error")
    return
  }

  // Verifica se os elementos existem
  const editForumId = document.getElementById("editForumId")
  const editForumTitle = document.getElementById("editForumTitle")
  const editForumContent = document.getElementById("editForumContent")
  const editForumAuthor = document.getElementById("editForumAuthor")
  const editForumIsHealthProfessional = document.getElementById("editForumIsHealthProfessional")
  const editForumModal = document.getElementById("editForumModal")

  if (
    !editForumId ||
    !editForumTitle ||
    !editForumContent ||
    !editForumAuthor ||
    !editForumIsHealthProfessional ||
    !editForumModal
  ) {
    displayMessage("Erro: Modal de edição não encontrado", "error")
    return
  }

  // Preenche os campos do modal
  editForumId.value = currentForum.id
  editForumTitle.value = currentForum.title
  editForumContent.value = currentForum.content
  editForumAuthor.value = currentForum.author
  editForumIsHealthProfessional.checked = currentForum.isHealthProfessional

  // Abre o modal
  const modal = new window.bootstrap.Modal(editForumModal)
  modal.show()
}

// ATUALIZAR FÓRUM
function updateForum(forumData) {
  fetch(`/forums/${currentForumId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(forumData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao atualizar fórum")
      }
      return response.json()
    })
    .then((updatedForum) => {
      displayMessage("Fórum atualizado com sucesso", "success")
      currentForum = updatedForum
      renderForumDetails(updatedForum)

      // Fecha o modal
      const editForumModal = document.getElementById("editForumModal")
      if (editForumModal) {
        const modal = window.bootstrap.Modal.getInstance(editForumModal)
        if (modal) {
          modal.hide()
        }
      }
    })
    .catch((error) => {
      console.error("Erro ao atualizar fórum:", error)
      displayMessage("Erro ao atualizar fórum", "error")
    })
}

// EXCLUIR FÓRUM
function deleteForum() {
  if (!confirm("Tem certeza que deseja excluir este fórum? Esta ação não pode ser desfeita.")) {
    return
  }

  fetch(`/forums/${currentForumId}`, {
    method: "DELETE",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erro ao excluir fórum")
      }

      displayMessage("Fórum excluído com sucesso", "success")

      // Redireciona para a página inicial após 2 segundos
      setTimeout(() => {
        window.location.href = "index.html"
      }, 2000)
    })
    .catch((error) => {
      console.error("Erro ao excluir fórum:", error)
      displayMessage("Erro ao excluir fórum", "error")
    })
}

// ========== EVENT LISTENERS ==========
document.addEventListener("DOMContentLoaded", () => {
  // Carrega os detalhes do fórum
  loadForumDetails()

  // Configura o formulário de comentários
  const commentForm = document.getElementById("commentForm")
  if (commentForm) {
    commentForm.addEventListener("submit", (event) => {
      event.preventDefault()

      const author = document.getElementById("commentAuthor").value
      const content = document.getElementById("commentContent").value
      const isHealthProfessional = document.getElementById("isHealthProfessional").checked

      if (!author.trim() || !content.trim()) {
        displayMessage("Preencha todos os campos", "error")
        return
      }

      // Comentário DEVE ter forumId para associar ao fórum correto
      const commentData = {
        id: Date.now().toString(), // ID como STRING
        forumId: currentForumId, // Mantém como string também
        author: author.trim(),
        content: content.trim(),
        isHealthProfessional: isHealthProfessional,
        createdAt: new Date().toISOString(),
      }

      createComment(commentData)
    })
  }

  // Event listener para salvar edição do fórum
  const saveEditForumBtn = document.getElementById("btnSaveEditForum")
  if (saveEditForumBtn) {
    saveEditForumBtn.addEventListener("click", () => {
      const editForumTitle = document.getElementById("editForumTitle")
      const editForumContent = document.getElementById("editForumContent")
      const editForumAuthor = document.getElementById("editForumAuthor")
      const editForumIsHealthProfessional = document.getElementById("editForumIsHealthProfessional")

      if (!editForumTitle || !editForumContent || !editForumAuthor || !editForumIsHealthProfessional) {
        displayMessage("Erro: Elementos do formulário não encontrados", "error")
        return
      }

      const title = editForumTitle.value
      const content = editForumContent.value
      const author = editForumAuthor.value
      const isHealthProfessional = editForumIsHealthProfessional.checked

      if (!title.trim() || !content.trim() || !author.trim()) {
        displayMessage("Preencha todos os campos", "error")
        return
      }

      // Mantém os dados originais e atualiza apenas os campos editados
      const updatedForum = {
        ...currentForum,
        title: title.trim(),
        content: content.trim(),
        author: author.trim(),
        isHealthProfessional: isHealthProfessional,
      }

      updateForum(updatedForum)
    })
  }
})
