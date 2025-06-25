// Configurações
const API_URL = 'http://localhost:3000';
const TOPICS_PER_PAGE = 5;

// Estado do Fórum
let currentPage = 1;
let totalPages = 1;
let currentCategory = 'all';
let currentSort = 'date_desc';
let searchQuery = '';

// Elementos DOM
const elements = {
    topicsContainer: document.getElementById('topicsContainer'),
    topicsCount: document.getElementById('topicsCount'),
    pageInfo: document.getElementById('pageInfo'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    searchInput: document.getElementById('forumSearch'),
    searchButton: document.getElementById('searchButton'),
    categoryFilter: document.getElementById('categoryFilter'),
    sortSelect: document.getElementById('sortSelect'),
    newTopicBtn: document.getElementById('newTopicBtn'),
    modal: document.getElementById('newTopicModal'),
    closeModal: document.querySelector('.close-modal'),
    topicForm: document.getElementById('topicForm'),
    categoryLinks: document.querySelectorAll('[data-category]')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadTopics();
    setupEventListeners();
});

// Configura listeners
function setupEventListeners() {
    // Paginação
    elements.prevPage.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadTopics();
        }
    });

    elements.nextPage.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadTopics();
        }
    });

    // Pesquisa
    elements.searchButton.addEventListener('click', (e) => {
        e.preventDefault();
        searchQuery = elements.searchInput.value.trim();
        currentPage = 1;
        loadTopics();
    });

    elements.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchQuery = elements.searchInput.value.trim();
            currentPage = 1;
            loadTopics();
        }
    });

    // Filtros
    elements.categoryFilter.addEventListener('change', () => {
        currentCategory = elements.categoryFilter.value;
        currentPage = 1;
        loadTopics();
    });

    elements.sortSelect.addEventListener('change', () => {
        currentSort = elements.sortSelect.value;
        loadTopics();
    });

    // Categorias na sidebar
    elements.categoryLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentCategory = link.dataset.category;
            currentPage = 1;
            loadTopics();
            
            // Atualiza UI
            elements.categoryLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Novo Tópico
    elements.newTopicBtn.addEventListener('click', () => {
        elements.modal.style.display = 'block';
    });

    elements.closeModal.addEventListener('click', () => {
        elements.modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            elements.modal.style.display = 'none';
        }
    });

    elements.topicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createNewTopic();
    });
}

// Carrega tópicos do servidor
async function loadTopics() {
    try {
        elements.topicsContainer.innerHTML = `
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
                Carregando tópicos...
            </div>
        `;

        // Construir URL com parâmetros
        let url = `${API_URL}/topics?`;
        
        // Filtro de categoria
        if (currentCategory && currentCategory !== 'all') {
            url += `category=${currentCategory}&`;
        }
        
        // Pesquisa
        if (searchQuery) {
            url += `q=${searchQuery}&`;
        }
        
        // Ordenação
        const [sortField, sortOrder] = currentSort.split('_');
        url += `_sort=${sortField}&_order=${sortOrder}&`;
        
        // Paginação
        url += `_page=${currentPage}&_limit=${TOPICS_PER_PAGE}`;

        const response = await fetch(url);
        const topics = await response.json();
        
        // Obter total de itens para paginação
        const totalCount = response.headers.get('X-Total-Count');
        totalPages = Math.ceil(totalCount / TOPICS_PER_PAGE);
        
        // Atualizar UI
        displayTopics(topics);
        updatePagination();
        elements.topicsCount.textContent = totalCount;
        
    } catch (error) {
        console.error('Erro ao carregar tópicos:', error);
        elements.topicsContainer.innerHTML = `
            <div class="error-message">
                Ocorreu um erro ao carregar os tópicos. Por favor, tente novamente.
            </div>
        `;
    }
}

// Exibe tópicos na página
function displayTopics(topics) {
    if (topics.length === 0) {
        elements.topicsContainer.innerHTML = `
            <div class="no-topics">
                Nenhum tópico encontrado. Que tal criar o primeiro?
            </div>
        `;
        return;
    }

    elements.topicsContainer.innerHTML = topics.map(topic => `
        <div class="topic-card" data-id="${topic.id}">
            <h3>${topic.title}</h3>
            <div class="topic-meta">
                <span>Por ${topic.author}</span>
                <span>${formatDate(topic.date)}</span>
                <span class="topic-category ${topic.category.toLowerCase()}">${topic.category}</span>
            </div>
            <p class="topic-content">${topic.content}</p>
            <div class="topic-stats">
                <span><i class="fas fa-comment"></i> ${topic.comments} comentários</span>
                <span><i class="fas fa-heart"></i> ${topic.likes} curtidas</span>
            </div>
        </div>
    `).join('');
}

// Atualiza controles de paginação
function updatePagination() {
    elements.pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    elements.prevPage.disabled = currentPage === 1;
    elements.nextPage.disabled = currentPage === totalPages;
}

// Formata data
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

// Cria novo tópico
async function createNewTopic() {
    try {
        const title = document.getElementById('topicTitle').value;
        const category = document.getElementById('topicCategory').value;
        const content = document.getElementById('topicContent').value;
        
        const newTopic = {
            title,
            content,
            category,
            author: "Usuário Atual", // Substituir por usuário logado
            date: new Date().toISOString().split('T')[0],
            comments: 0,
            likes: 0
        };

        const response = await fetch(`${API_URL}/topics`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTopic)
        });

        if (response.ok) {
            // Fecha modal e limpa formulário
            elements.modal.style.display = 'none';
            elements.topicForm.reset();
            
            // Recarrega tópicos
            currentPage = 1;
            loadTopics();
        } else {
            alert('Erro ao criar tópico. Tente novamente.');
        }
    } catch (error) {
        console.error('Erro ao criar tópico:', error);
        alert('Erro ao criar tópico. Tente novamente.');
    }
}