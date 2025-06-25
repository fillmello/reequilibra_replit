let gameData = null
let activityTypes = {}
let currentUser = null

const darkModeToggle = document.getElementById("darkModeToggle")
const navLinks = document.querySelectorAll(".nav-link")
const sections = document.querySelectorAll(".section")
const addActivityBtn = document.getElementById("addActivityBtn")
const activityModal = document.getElementById("activityModal")
const closeActivityModal = document.getElementById("closeActivityModal")
const activityForm = document.getElementById("activityForm")
const loadingOverlay = document.getElementById("loadingOverlay")

// Configuração da API
const API_BASE_URL = window.location.origin

// Função para mostrar/esconder loading
function showLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }
}

function hideLoading() {
  if (loadingOverlay) {
    loadingOverlay.style.display = "none"
  }
}

// Função para obter usuário logado
function getCurrentUser() {
  const usuarioLogado = localStorage.getItem("usuarioLogado")
  const usuarioCorrente = sessionStorage.getItem("usuarioCorrente")

  if (usuarioLogado) {
    return JSON.parse(usuarioLogado)
  } else if (usuarioCorrente) {
    return JSON.parse(usuarioCorrente)
  }

  // Redirecionar para login se não houver usuário
  window.location.href = "../login/login.html"
  return null
}

// Funções da API
async function apiRequest(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("API Request Error:", error)
    throw error
  }
}

async function fetchUserGameData(userId) {
  try {
    showLoading()

    const [
      tiposDeAtividade,
      medalhas,
      recompensas,
      gamificacaoUsuario,
      atividadesUsuario,
      conquistasUsuario,
      recompensasUsuario,
    ] = await Promise.all([
      apiRequest("/tiposDeAtividade"),
      apiRequest("/medalhas"),
      apiRequest("/recompensas"),
      apiRequest(`/gamificacao_usuarios?userId=${userId}`),
      apiRequest(`/atividades_usuarios?userId=${userId}`),
      apiRequest(`/conquistas_usuarios?userId=${userId}`),
      apiRequest(`/recompensas_usuarios?userId=${userId}`),
    ])

    // Inicializar dados do usuário se não existirem
    let userGameData = gamificacaoUsuario[0]
    if (!userGameData) {
      userGameData = await createUserGameData(userId)
    }

    // Preencher tipos de atividade
    activityTypes = {}
    const activitySelect = document.getElementById("activityType")
    const activitiesGrid = document.getElementById("activitiesGrid")

    if (activitySelect) {
      activitySelect.innerHTML = '<option value="">Selecione uma atividade</option>'
    }

    if (activitiesGrid) {
      activitiesGrid.innerHTML = ""
    }

    tiposDeAtividade.forEach((item) => {
      activityTypes[item.id] = {
        name: item.nome,
        xp: item.xp,
        icon: item.icone,
      }

      if (activitySelect) {
        activitySelect.innerHTML += `<option value="${item.id}">${item.nome} (${item.xp} XP)</option>`
      }

      if (activitiesGrid) {
        activitiesGrid.innerHTML += `
          <div class="activity-type" data-type="${item.id}">
            <i class="${item.icone}"></i>
            <h4>${item.nome}</h4>
            <p>${item.xp} XP</p>
          </div>
        `
      }
    })

    // Processar conquistas do usuário
    const processedAchievements = medalhas.map((medalha) => {
      const userAchievement = conquistasUsuario.find((c) => c.conquistaId === medalha.id)
      return {
        ...medalha,
        conquistada: userAchievement ? userAchievement.conquistada : false,
        progresso: userAchievement ? userAchievement.progresso : 0,
        dataConquista: userAchievement ? userAchievement.dataConquista : null,
      }
    })

    // Processar recompensas do usuário
    const processedRewards = recompensas.map((recompensa) => {
      const userReward = recompensasUsuario.find((r) => r.recompensaId === recompensa.id)
      return {
        ...recompensa,
        completa: userReward ? userReward.completa : false,
        dataCompleta: userReward ? userReward.dataCompleta : null,
      }
    })

    gameData = {
      user: {
        id: userId,
        name: currentUser.nome,
        level: userGameData.level,
        xp: userGameData.xp,
        currentLevelXP: userGameData.currentLevelXP,
        nextLevelXP: userGameData.nextLevelXP,
      },
      activities: atividadesUsuario || [],
      achievements: processedAchievements,
      rewards: processedRewards,
      consecutiveDays: userGameData.consecutiveDays || 0,
      lastActivityDate: userGameData.lastActivityDate,
    }

    return gameData
  } catch (error) {
    console.error("Erro ao carregar dados da gamificação:", error)
    showNotification("Erro ao carregar dados de gamificação", "error")
    throw error
  } finally {
    hideLoading()
  }
}

async function createUserGameData(userId) {
  const newUserData = {
    userId: userId,
    level: 1,
    xp: 0,
    currentLevelXP: 0,
    nextLevelXP: 500,
    consecutiveDays: 0,
    lastActivityDate: null,
  }

  return await apiRequest("/gamificacao_usuarios", {
    method: "POST",
    body: JSON.stringify(newUserData),
  })
}

async function updateUserGameData(userId, data) {
  const existingData = await apiRequest(`/gamificacao_usuarios?userId=${userId}`)

  if (existingData.length > 0) {
    return await apiRequest(`/gamificacao_usuarios/${existingData[0].id}`, {
      method: "PUT",
      body: JSON.stringify({ ...existingData[0], ...data }),
    })
  } else {
    return await createUserGameData(userId)
  }
}

async function saveActivity(activity) {
  return await apiRequest("/atividades_usuarios", {
    method: "POST",
    body: JSON.stringify({
      ...activity,
      userId: currentUser.id,
      createdAt: new Date().toISOString(),
    }),
  })
}

async function updateUserAchievement(userId, achievementId, data) {
  const existing = await apiRequest(`/conquistas_usuarios?userId=${userId}&conquistaId=${achievementId}`)

  if (existing.length > 0) {
    return await apiRequest(`/conquistas_usuarios/${existing[0].id}`, {
      method: "PUT",
      body: JSON.stringify({ ...existing[0], ...data }),
    })
  } else {
    return await apiRequest("/conquistas_usuarios", {
      method: "POST",
      body: JSON.stringify({
        userId,
        conquistaId: achievementId,
        ...data,
      }),
    })
  }
}

async function updateUserReward(userId, rewardId, data) {
  const existing = await apiRequest(`/recompensas_usuarios?userId=${userId}&recompensaId=${rewardId}`)

  if (existing.length > 0) {
    return await apiRequest(`/recompensas_usuarios/${existing[0].id}`, {
      method: "PUT",
      body: JSON.stringify({ ...existing[0], ...data }),
    })
  } else {
    return await apiRequest("/recompensas_usuarios", {
      method: "POST",
      body: JSON.stringify({
        userId,
        recompensaId: rewardId,
        ...data,
      }),
    })
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  currentUser = getCurrentUser()
  if (!currentUser) return

  try {
    await fetchUserGameData(currentUser.id)
    updateUI()
    setupEventListeners()
    setupCalendar()

    // Definir data padrão para hoje
    const activityDateEl = document.getElementById("activityDate")
    if (activityDateEl) {
      activityDateEl.value = new Date().toISOString().split("T")[0]
    }
  } catch (error) {
    console.error("Erro ao inicializar gamificação:", error)
    showNotification("Erro ao carregar dados de gamificação", "error")
  }
})

function setupEventListeners() {
  if (darkModeToggle) {
    darkModeToggle.addEventListener("click", toggleDarkMode)
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault()
      const targetSection = link.getAttribute("href").substring(1)
      showSection(targetSection)

      navLinks.forEach((l) => l.classList.remove("active"))
      link.classList.add("active")
    })
  })

  if (addActivityBtn) {
    addActivityBtn.addEventListener("click", () => showModal())
  }

  if (closeActivityModal) {
    closeActivityModal.addEventListener("click", () => hideModal())
  }

  if (activityModal) {
    activityModal.addEventListener("click", (e) => {
      if (e.target === activityModal) hideModal()
    })
  }

  if (activityForm) {
    activityForm.addEventListener("submit", handleActivitySubmit)
  }

  // Event delegation para activity types (já que são criados dinamicamente)
  document.addEventListener("click", (e) => {
    if (e.target.closest(".activity-type")) {
      const activityType = e.target.closest(".activity-type").dataset.type
      const activityTypeSelect = document.getElementById("activityType")
      if (activityTypeSelect) {
        activityTypeSelect.value = activityType
      }
      showModal()
    }
  })
}

function toggleDarkMode() {
  const currentTheme = document.documentElement.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  document.documentElement.setAttribute("data-theme", newTheme)
  localStorage.setItem("theme", newTheme)

  const icon = darkModeToggle.querySelector("i")
  if (icon) {
    icon.className = newTheme === "dark" ? "fas fa-sun" : "fas fa-moon"
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.documentElement.setAttribute("data-theme", savedTheme)

  if (darkModeToggle) {
    const icon = darkModeToggle.querySelector("i")
    if (icon) {
      icon.className = savedTheme === "dark" ? "fas fa-sun" : "fas fa-moon"
    }
  }
}

function showSection(sectionId) {
  sections.forEach((section) => section.classList.remove("active"))
  const targetSection = document.getElementById(sectionId)
  if (targetSection) {
    targetSection.classList.add("active")
  }
}

function showModal() {
  if (activityModal) {
    activityModal.classList.add("active")
  }
}

function hideModal() {
  if (activityModal) {
    activityModal.classList.remove("active")
  }
  if (activityForm) {
    activityForm.reset()
  }
  const activityDateEl = document.getElementById("activityDate")
  if (activityDateEl) {
    activityDateEl.value = new Date().toISOString().split("T")[0]
  }
}

async function handleActivitySubmit(e) {
  e.preventDefault()

  const activityType = document.getElementById("activityType")?.value
  const activityDate = document.getElementById("activityDate")?.value
  const activityNotes = document.getElementById("activityNotes")?.value

  if (!activityType || !activityDate) {
    showNotification("Por favor, preencha todos os campos obrigatórios.", "warning")
    return
  }

  const alreadyExists = gameData.activities.some((a) => a.date === activityDate && a.type === activityType)

  if (alreadyExists) {
    showNotification("Você já registrou esta atividade para esta data.", "warning")
    return
  }

  try {
    showLoading()

    const activity = {
      type: activityType,
      date: activityDate,
      notes: activityNotes,
      xp: activityTypes[activityType].xp,
    }

    // Salvar atividade no servidor
    const savedActivity = await saveActivity(activity)

    // Atualizar dados locais
    gameData.activities.push(savedActivity)
    gameData.user.xp += activity.xp
    gameData.user.currentLevelXP += activity.xp

    // Verificar level up
    await checkLevelUp()

    // Calcular dias consecutivos
    await calculateConsecutiveDays()

    // Verificar conquistas
    await checkAchievements()

    // Verificar recompensas
    await checkRewardsProgress(activity)

    // Salvar dados do usuário no servidor
    await updateUserGameData(currentUser.id, {
      level: gameData.user.level,
      xp: gameData.user.xp,
      currentLevelXP: gameData.user.currentLevelXP,
      nextLevelXP: gameData.user.nextLevelXP,
      consecutiveDays: gameData.consecutiveDays,
      lastActivityDate: activityDate,
    })

    updateUI()
    hideModal()
    showNotification(`Atividade registrada! +${activity.xp} XP`, "success")
  } catch (error) {
    console.error("Erro ao salvar atividade:", error)
    showNotification("Erro ao salvar atividade", "error")
  } finally {
    hideLoading()
  }
}

async function checkLevelUp() {
  let leveledUp = false

  while (gameData.user.currentLevelXP >= gameData.user.nextLevelXP) {
    gameData.user.currentLevelXP -= gameData.user.nextLevelXP
    gameData.user.level++
    gameData.user.nextLevelXP = gameData.user.level * 100
    leveledUp = true
  }

  if (leveledUp) {
    showNotification(`🎉 Parabéns! Você subiu para o nível ${gameData.user.level}!`, "success")
  }
}

async function checkAchievements() {
  for (const achievement of gameData.achievements) {
    if (achievement.conquistada || !achievement.objetivo) continue

    let count = 0

    const typeMap = {
      terapeuta: "terapia",
      meditador: "meditacao",
      atleta: "exercicio",
      grato: "gratidao",
    }

    const nameKey = achievement.nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")

    for (const key in typeMap) {
      if (nameKey.includes(key)) {
        count = gameData.activities.filter((a) => a.type === typeMap[key]).length
        break
      }
    }

    if (nameKey.includes("escritor")) {
      try {
        const diarios = await apiRequest(`/diarios?userid=${currentUser.id}`)
        count = diarios.length
      } catch (error) {
        console.error("Erro ao buscar diários:", error)
      }
    }

    if (nameKey.includes("mestre")) {
      count = gameData.user.level
    }

    achievement.progresso = count

    if (count >= achievement.objetivo && !achievement.conquistada) {
      achievement.conquistada = true
      achievement.dataConquista = new Date().toISOString()

      try {
        await updateUserAchievement(currentUser.id, achievement.id, {
          conquistada: true,
          progresso: count,
          dataConquista: achievement.dataConquista,
        })

        showNotification(`🏆 Conquista desbloqueada: ${achievement.nome}!`, "success")
      } catch (error) {
        console.error("Erro ao salvar conquista:", error)
      }
    } else if (count < achievement.objetivo) {
      try {
        await updateUserAchievement(currentUser.id, achievement.id, {
          progresso: count,
        })
      } catch (error) {
        console.error("Erro ao atualizar progresso da conquista:", error)
      }
    }
  }
}

async function checkRewardsProgress(activity) {
  for (const reward of gameData.rewards) {
    if (reward.completa) continue

    const match = reward.tipo === activity.type || (reward.tipo === "diario" && activity.type === "gratidao")

    if (match) {
      reward.completa = true
      reward.dataCompleta = new Date().toISOString()

      try {
        await updateUserReward(currentUser.id, reward.id, {
          completa: true,
          dataCompleta: reward.dataCompleta,
        })

        showNotification(`🎁 Recompensa completa: ${reward.titulo}!`, "success")
      } catch (error) {
        console.error("Erro ao salvar recompensa:", error)
      }
    }
  }
}

async function calculateConsecutiveDays() {
  const dates = [...new Set(gameData.activities.map((a) => a.date))].sort((a, b) => new Date(b) - new Date(a))
  let count = 0
  const today = new Date().toISOString().split("T")[0]

  if (dates.length > 0 && (dates[0] === today || dates[0] === getYesterday())) {
    count = 1
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i - 1]) - new Date(dates[i])) / (1000 * 60 * 60 * 24)
      if (diff === 1) count++
      else break
    }
  }

  gameData.consecutiveDays = count
}

function getYesterday() {
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return y.toISOString().split("T")[0]
}

function updateUI() {
  // Carregar tema
  loadTheme()

  // Atualizar informações do usuário
  const userNameEl = document.getElementById("userName")
  if (userNameEl && gameData) {
    userNameEl.textContent = gameData.user.name
  }

  const userLevelEl = document.getElementById("userLevel")
  if (userLevelEl && gameData) {
    userLevelEl.textContent = `Nível ${gameData.user.level}`
  }

  // Atualizar estatísticas
  const consecutiveDaysEl = document.getElementById("consecutiveDays")
  if (consecutiveDaysEl && gameData) {
    consecutiveDaysEl.textContent = gameData.consecutiveDays
  }

  const totalXPEl = document.getElementById("totalXP")
  if (totalXPEl && gameData) {
    totalXPEl.textContent = gameData.user.xp.toLocaleString()
  }

  const achievementsEl = document.getElementById("achievements")
  if (achievementsEl && gameData) {
    achievementsEl.textContent = gameData.achievements.filter((a) => a.conquistada).length
  }

  const currentLevelEl = document.getElementById("currentLevel")
  if (currentLevelEl && gameData) {
    currentLevelEl.textContent = gameData.user.level
  }

  const progressFillEl = document.getElementById("progressFill")
  if (progressFillEl && gameData) {
    progressFillEl.style.width = `${(gameData.user.currentLevelXP / gameData.user.nextLevelXP) * 100}%`
  }

  const currentXPEl = document.getElementById("currentXP")
  if (currentXPEl && gameData) {
    currentXPEl.textContent = gameData.user.currentLevelXP
  }

  const nextLevelXPEl = document.getElementById("nextLevelXP")
  if (nextLevelXPEl && gameData) {
    nextLevelXPEl.textContent = gameData.user.nextLevelXP
  }

  updateTodayActivities()
  updateAchievements()
  updateRewardsUI()
  updateCalendar()
}

function updateTodayActivities() {
  if (!gameData) return

  const today = new Date().toISOString().split("T")[0]
  const activities = gameData.activities.filter((a) => a.date === today)
  const container = document.getElementById("todayActivities")

  if (!container) return

  if (!activities.length) {
    container.innerHTML =
      '<p style="text-align:center; color: var(--text-secondary); padding: 2rem;">Nenhuma atividade registrada hoje.</p>'
    return
  }

  container.innerHTML = activities
    .map((a) => {
      const info = activityTypes[a.type]
      if (!info) return ""

      return `<div class="activity-item">
        <div class="activity-info">
          <div class="activity-icon"><i class="${info.icon}"></i></div>
          <div>
            <h4>${info.name}</h4>
            ${a.notes ? `<p>${a.notes}</p>` : ""}
          </div>
        </div>
        <div class="activity-xp">+${a.xp} XP</div>
      </div>`
    })
    .join("")
}

function updateAchievements() {
  if (!gameData) return

  const container = document.getElementById("achievementsList")
  if (!container) return

  container.innerHTML = gameData.achievements
    .map((achievement) => {
      const isUnlocked = achievement.conquistada
      const progressBar = achievement.objetivo
        ? `
          <div class="achievement-progress-bar">
            <div class="progress-fill" style="width: ${(achievement.progresso / achievement.objetivo) * 100}%"></div>
          </div>
          <p class="progress-text">${achievement.progresso || 0} / ${achievement.objetivo}</p>
        `
        : ""

      return `
        <div class="achievement-card ${isUnlocked ? "unlocked" : ""}">
          <div class="achievement-icon">
            <i class="${achievement.icone}"></i>
          </div>
          <div class="achievement-info">
            <h4>${achievement.nome}</h4>
            <p>${achievement.descricao}</p>
            ${progressBar}
          </div>
        </div>
      `
    })
    .join("")
}

function updateRewardsUI() {
  if (!gameData) return

  const container = document.getElementById("rewardsList")
  if (!container) return

  container.innerHTML = gameData.rewards
    .map(
      (r) => `<div class="reward-card ${r.completa ? "completed" : ""}">
      <div class="reward-icon"><i class="${r.icone}"></i></div>
      <div class="reward-info">
        <h4>${r.titulo}</h4>
        <p>${r.descricao}</p>
        <span class="reward-points">${r.pontos} XP</span>
      </div>
    </div>`,
    )
    .join("")
}

function setupCalendar() {
  const prevMonthBtn = document.getElementById("prevMonth")
  const nextMonthBtn = document.getElementById("nextMonth")

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() - 1)
      updateCalendar()
    })
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      currentDate.setMonth(currentDate.getMonth() + 1)
      updateCalendar()
    })
  }
}

const currentDate = new Date()

function updateCalendar() {
  if (!gameData) return

  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDay = firstDay.getDay()

  const currentMonthEl = document.getElementById("currentMonth")
  if (currentMonthEl) {
    currentMonthEl.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }

  const monthActivities = gameData.activities.filter((a) => {
    const d = new Date(a.date)
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
  })

  let html = ""
  dayNames.forEach((d) => {
    html += `<div class="calendar-day" style="font-weight:bold;">${d}</div>`
  })

  for (let i = 0; i < startDay; i++) {
    html += `<div class="calendar-day other-month"></div>`
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(day).padStart(2, "0")}`
    const hasActivity = monthActivities.some((a) => a.date === date)
    html += `<div class="calendar-day ${hasActivity ? "has-activity" : ""}" data-date="${date}">
      ${day}${hasActivity ? '<div class="dot"></div>' : ""}
    </div>`
  }

  const total = Math.ceil((daysInMonth + startDay) / 7) * 7
  const rem = total - (daysInMonth + startDay)
  for (let i = 0; i < rem; i++) {
    html += `<div class="calendar-day other-month"></div>`
  }

  const calendarGridEl = document.getElementById("calendarGrid")
  if (calendarGridEl) {
    calendarGridEl.innerHTML = html

    document.querySelectorAll(".calendar-day[data-date]").forEach((el) => {
      el.addEventListener("click", () => {
        const activityDateEl = document.getElementById("activityDate")
        if (activityDateEl) {
          activityDateEl.value = el.dataset.date
        }
        showModal()
      })
    })
  }
}

function showNotification(msg, type = "info") {
  const n = document.createElement("div")

  const colors = {
    success: "var(--primary-green)",
    error: "#dc3545",
    warning: "#ffc107",
    info: "var(--primary-blue)",
  }

  n.style.cssText = `
    position: fixed; top: 100px; right: 20px;
    background: ${colors[type] || colors.info}; color: white;
    padding: 1rem 1.5rem; border-radius: 8px; box-shadow: var(--shadow);
    z-index: 3000; transform: translateX(100%);
    transition: transform 0.3s ease; max-width: 300px;
    font-size: 0.9rem; line-height: 1.4;
  `
  n.textContent = msg
  document.body.appendChild(n)

  setTimeout(() => (n.style.transform = "translateX(0)"), 100)
  setTimeout(() => {
    n.style.transform = "translateX(100%)"
    setTimeout(() => {
      if (document.body.contains(n)) {
        document.body.removeChild(n)
      }
    }, 300)
  }, 4000)
}

// Inicializar quando o DOM estiver carregado
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    // Já inicializado no event listener acima
  })
} else {
  // DOM já carregado
  setTimeout(async () => {
    currentUser = getCurrentUser()
    if (currentUser) {
      try {
        await fetchUserGameData(currentUser.id)
        updateUI()
        setupEventListeners()
        setupCalendar()
      } catch (error) {
        console.error("Erro ao inicializar gamificação:", error)
      }
    }
  }, 100)
}
