// URL base para o JSON Server
const API_URL = 'http://localhost:3000';

// Elementos DOM globais
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const indicators = document.querySelectorAll('.indicator');
const demoBtn = document.getElementById('loadDemoBtn');
const demoTopic = document.getElementById('demoTopic');

// Elementos do Fórum (presentes em todas as páginas relevantes)
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const forumContainer = document.getElementById('forumContainer');
const topicList = document.getElementById('topicList'); // Lista principal de tópicos

// Controle da apresentação
let currentSlide = 1;
const totalSlides = 6;

// Estado global dos tópicos
let allTopics = [];

// Função principal para carregar e exibir tópicos
async function loadAndDisplayTopics() {
  try {
    // Carrega tópicos do servidor
    const response = await fetch(`${API_URL}/topics`);
    allTopics = await response.json();
    
    // Aplica filtros e ordenação
    const processedTopics = processTopics(allTopics);
    
    // Exibe os tópicos processados
    displayTopics(processedTopics);
  } catch (error) {
    console.error('Erro ao carregar tópicos:', error);
    showErrorMessage('Erro ao carregar tópicos. Tente novamente mais tarde.');
  }
}

// Processa tópicos (filtro + ordenação)
function processTopics(topics) {
  // Aplica filtro de pesquisa
  const filteredTopics = applySearchFilter(topics);
  
  // Aplica ordenação
  const sortedTopics = applySorting(filteredTopics);
  
  return sortedTopics;
}

// Aplica filtro de pesquisa
function applySearchFilter(topics) {
  if (!searchInput || !searchInput.value) return topics;
  
  const searchTerm = searchInput.value.toLowerCase();
  return topics.filter(topic => 
    topic.title.toLowerCase().includes(searchTerm) || 
    topic.content.toLowerCase().includes(searchTerm) ||
    topic.category.toLowerCase().includes(searchTerm)
    );
}

// Aplica ordenação
function applySorting(topics) {
  if (!sortSelect || !sortSelect.value) return topics;
  
  const [field, order] = sortSelect.value.split('_');
  
  return [...topics].sort((a, b) => {
    if (order === 'asc') {
      return a[field] > b[field] ? 1 : -1;
    } else {
      return a[field] < b[field] ? 1 : -1;
    }
  });
}

// Exibe tópicos no container apropriado
function displayTopics(topics) {
  const container = forumContainer || topicList;
  if (!container) return;
  
  if (topics.length === 0) {
    container.innerHTML = '<p class="no-results">Nenhum tópico encontrado.</p>';
    return;
  }
  
  container.innerHTML = topics.map(topic => `
    <div class="topic-card" data-id="${topic.id}">
      <h3>${topic.title}</h3>
      <div class="topic-meta">
        <span>Por ${topic.author}</span>
        <span>${formatDate(topic.date)}</span>
        <span class="category ${topic.category.toLowerCase()}">${topic.category}</span>
      </div>
      <p class="topic-content">${topic.content}</p>
      <div class="topic-stats">
        <span><i class="fas fa-comment"></i> ${topic.comments}</span>
        <span><i class="fas fa-heart"></i> ${topic.likes}</span>
      </div>
    </div>
  `).join('');
}

// Função auxiliar para formatar data
function formatDate(dateString) {
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Mostra mensagem de erro
function showErrorMessage(message) {
  const container = forumContainer || topicList;
  if (container) {
    container.innerHTML = `<p class="error-message">${message}</p>`;
  }
}

// Função para carregar dados de demonstração (slide interativo)
async function loadDemoData() {
  try {
    const [topics, diario, comunidade] = await Promise.all([
      fetch(`${API_URL}/topics`).then(res => res.json()),
      fetch(`${API_URL}/diario`).then(res => res.json()),
      fetch(`${API_URL}/comunidade`).then(res => res.json())
    ]);
    
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    const resposta = comunidade[0].respostas[0];
    const entry = diario[0];

    demoTopic.innerHTML = `
      <div class="demo-topic">
        <h4>${randomTopic.title}</h4>
        <p class="topic-meta">Por ${randomTopic.author} | ${formatDate(randomTopic.date)} | ${randomTopic.category}</p>
        <p class="topic-content">${randomTopic.content}</p>
        <div class="topic-stats">
          <span><i class="fas fa-comment"></i> ${randomTopic.comments} comentários</span>
          <span><i class="fas fa-heart"></i> ${randomTopic.likes} curtidas</span>
        </div>
      </div>
      <hr />
      <div class="post-real">
        <h4>${entry.titulo}</h4>
        <p class="meta">Postado em ${formatDate(entry.data)}</p>
        <p>${entry.conteudo}</p>
        <div class="resposta">
          <p><strong>${resposta.autor}:</strong> ${resposta.conteudo}</p>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Erro ao carregar dados de demonstração:', error);
    demoTopic.innerHTML = '<p class="error-message">Erro ao carregar demonstração.</p>';
  }
}

// Função para mudar de slide
function goToSlide(slideNumber) {
  const currentActiveSlide = document.querySelector('.slide.active');
  const currentActiveIndicator = document.querySelector('.indicator.active');

  if (currentActiveSlide) currentActiveSlide.classList.remove('active');
  if (currentActiveIndicator) currentActiveIndicator.classList.remove('active');
  
  document.getElementById(`slide${slideNumber}`)?.classList.add('active');
  document.querySelector(`.indicator[data-slide="${slideNumber}"]`)?.classList.add('active');

  currentSlide = slideNumber;

  prevBtn.disabled = slideNumber === 1;
  nextBtn.disabled = slideNumber === totalSlides;
}

// Event Listeners globais
document.addEventListener('DOMContentLoaded', () => {
  // Carrega tópicos se estiver em uma página com fórum
  if (forumContainer || topicList) {
    loadAndDisplayTopics();
    
    // Adiciona listeners para pesquisa e ordenação
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const processedTopics = processTopics(allTopics);
        displayTopics(processedTopics);
      });
    }
    
    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        const processedTopics = processTopics(allTopics);
        displayTopics(processedTopics);
      });
    }
  }
});

// Navegação de slides com redirecionamento
prevBtn?.addEventListener('click', () => {
  if (currentSlide === 1) {
    window.location.href = "index.html"; // Redireciona para a página inicial
  } else {
    goToSlide(currentSlide - 1);
  }
});

nextBtn?.addEventListener('click', () => {
  console.log(`Slide atual: ${currentSlide}`); // debug
  if (currentSlide === totalSlides) {
    console.log("Redirecionando para forum.html");
    window.location.href = "forum.html";
  } else {
    goToSlide(currentSlide + 1);
  }
});

indicators?.forEach(indicator => {
  indicator.addEventListener('click', () => {
    const slideNumber = parseInt(indicator.dataset.slide);
    goToSlide(slideNumber);
  });
});

demoBtn?.addEventListener('click', loadDemoData);

// Suporte a teclado
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft' && currentSlide > 1) {
    goToSlide(currentSlide - 1);
  } else if (e.key === 'ArrowRight' && currentSlide < totalSlides) {
    goToSlide(currentSlide + 1);
  }
});

// Inicialização
goToSlide(1);