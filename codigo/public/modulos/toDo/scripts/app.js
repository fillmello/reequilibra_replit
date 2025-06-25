const API_URL = "/toDo"



let tarefas = []

document.addEventListener("DOMContentLoaded", () => {
  carregarTarefas()
  configurarModal()
})

function configurarModal() {
  const modal = document.getElementById("modal")
  const closeBtn = document.querySelector(".close")

  closeBtn.onclick = fecharModal
  window.onclick = (event) => {
    if (event.target === modal) fecharModal()
  }
}

async function carregarTarefas() {
  try {
    const response = await fetch(`${API_URL}?userid=${USER_ID}`)
    tarefas = await response.json()
    renderizarTarefas()
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error)
    mostrarErro("Erro ao carregar tarefas")
  }
}

function renderizarTarefas() {
  const container = document.getElementById("listaTarefas")

  if (tarefas.length === 0) {
    container.innerHTML = '<div class="empty-state">Nenhuma tarefa encontrada</div>'
    return
  }

  container.innerHTML = tarefas
    .map(
      (tarefa) => `
        <div class="task-card ${getStatusClass(tarefa.status)}">
            <div class="task-header">
                <div>
                    <div class="task-title">${tarefa.titulo}</div>
                    <div class="task-status">${getStatusText(tarefa.status)}</div>
                </div>
                <div class="task-actions">
                    <button class="task-btn" onclick="editarTarefa('${tarefa.id}', '${tarefa.titulo}', ${tarefa.status})">✏️</button>
                    <button class="task-btn delete" onclick="deletarTarefa('${tarefa.id}')">🗑️</button>
                </div>
            </div>
        </div>
    `,
    )
    .join("")
}

async function adicionarTarefa() {
  const titulo = document.getElementById("tituloTarefa").value.trim()

  if (!titulo) {
    alert("Por favor, digite um título para a tarefa")
    return
  }

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        titulo,
        status: "1",
        userid: USER_ID,
      }),
    })

    document.getElementById("tituloTarefa").value = ""
    carregarTarefas()
  } catch (error) {
    console.error("Erro ao adicionar tarefa:", error)
    alert("Erro ao adicionar tarefa")
  }
}

async function deletarTarefa(id) {
  if (!confirm("Deseja realmente deletar esta tarefa?")) return

  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" })
    carregarTarefas()
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error)
    alert("Erro ao deletar tarefa")
  }
}

function editarTarefa(id, titulo, status) {
  document.getElementById("editId").value = id
  document.getElementById("editTitulo").value = titulo
  document.getElementById("editStatus").value = status
  document.getElementById("modal").style.display = "block"
}


async function salvarEdicao() {
  const id = document.getElementById("editId").value
  const titulo = document.getElementById("editTitulo").value.trim()
  const status = document.getElementById("editStatus").value

  if (!titulo) {
    alert("Por favor, digite um título para a tarefa")
    return
  }

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, titulo, status }),
    })

    fecharModal()
    carregarTarefas()
  } catch (error) {
    console.error("Erro ao editar tarefa:", error)
    alert("Erro ao editar tarefa")
  }
}


function fecharModal() {
  document.getElementById("modal").style.display = "none"
}


function limparCampo() {
  document.getElementById("tituloTarefa").value = ""
  document.getElementById("tituloTarefa").focus()
}


function getStatusClass(status) {
  const classes = { 1: "pendente", 2: "progresso", 3: "concluida" }
  return classes[status] || "pendente"
}

function getStatusText(status) {
  const texts = { 1: "Pendente", 2: "Em Progresso", 3: "Concluída" }
  return texts[status] || "Pendente"
}

function mostrarErro(mensagem) {
  document.getElementById("listaTarefas").innerHTML =
    `<div class="empty-state" style="color: #dc3545">${mensagem}</div>`
}

document.getElementById("tituloTarefa").addEventListener("keypress", (e) => {
  if (e.key === "Enter") adicionarTarefa()
})