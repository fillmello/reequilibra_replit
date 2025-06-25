document.addEventListener('DOMContentLoaded', function() {
    const articlesList = document.getElementById('articles-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const allArticlesBtn = document.getElementById('all-articles');
    const favoritesBtn = document.getElementById('favorites');
    const categoriesBtn = document.getElementById('categories-btn');
    const categoriesList = document.getElementById('categories-list');
    const recommendationsBtn = document.getElementById('recommendations');
    const modal = document.getElementById('article-modal');

    let articlesData = [];
    let categoriesData = [];
    let favoritesData = [];
    let recommendationsData = [];
    let currentFilter = 'all';
    let currentSearch = '';
    let currentCategory = '';
    const currentUserId = 1;

    fetch('/artigos.json')
        .then(response => response.json())
        .then(data => {
            articlesData = data.artigos;
            categoriesData = data.categorias;
            favoritesData = data.favoritos;
            recommendationsData = data.indicacoes;

            renderArticles(articlesData);
            renderCategories(categoriesData);
            setupRecommendations();
        })
        .catch(error => console.error('Erro ao carregar artigos:', error));

    function isFavorite(articleId) {
        return favoritesData.some(fav =>
            fav.noticia_id === articleId && fav.usuario_id === currentUserId
        );
    }

    function renderArticles(articles) {
        articlesList.innerHTML = '';

        if (articles.length === 0) {
            articlesList.innerHTML = '<p>Nenhum artigo encontrado.</p>';
            return;
        }

        articles.forEach(article => {
            const category = categoriesData.find(cat => cat.id == article.categoria_id);
            const isFav = isFavorite(article.id);

            const articleItem = document.createElement('div');
            articleItem.className = 'article-item';
            articleItem.dataset.id = article.id;

            articleItem.innerHTML = `
                <h2>${article.titulo}</h2>
                <p class="article-meta">${article.data} - Autor(a): ${article.autor} | Categoria: ${category ? category.nome : 'Sem categoria'}</p>
                <p>${article.texto.substring(0, 150)}...</p>
                <!-- Link removido daqui para aparecer só no modal -->
                <i class="favorite-icon ${isFav ? 'fas fa-heart active' : 'far fa-heart'}" data-id="${article.id}"></i>
            `;

            articlesList.appendChild(articleItem);
        });

        setupArticleEvents();
    }

    function setupArticleEvents() {
        document.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.classList.contains('favorite-icon') && !e.target.closest('a')) {
                    const articleId = parseInt(this.dataset.id);
                    openArticleModal(articleId);
                }
            });
        });

        document.querySelectorAll('.favorite-icon').forEach(icon => {
            icon.addEventListener('click', function(e) {
                e.stopPropagation();
                const articleId = parseInt(this.dataset.id);
                toggleFavorite(articleId);
            });
        });
    }

    function renderCategories(categories) {
        categoriesList.innerHTML = '';

        categories.forEach(category => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = category.nome;
            a.dataset.categoryId = category.id;

            a.addEventListener('click', function(e) {
                e.preventDefault();
                filterByCategory(category.id);
            });

            li.appendChild(a);
            categoriesList.appendChild(li);
        });
    }

    function setupRecommendations() {
        recommendationsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showRecommendations();
        });
    }

    function showRecommendations() {
        articlesList.innerHTML = '<h2>Indicações de Leitura</h2>';

        recommendationsData.forEach(recommendation => {
            const recItem = document.createElement('div');
            recItem.className = 'recommendation-item';

            recItem.innerHTML = `
                <h3>${recommendation.titulo}</h3>
                <p>Autor: ${recommendation.autor}</p>
                ${recommendation.link ? `<a href="${recommendation.link}" target="_blank">Ler artigo</a>` : ''}
            `;

            articlesList.appendChild(recItem);
        });
    }

    function openArticleModal(articleId) {
        const article = articlesData.find(a => a.id === articleId);
        if (!article) return;

        const category = categoriesData.find(cat => cat.id == article.categoria_id);
        const isFav = isFavorite(articleId);

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div>
                        <h2 id="modal-title">${article.titulo}</h2>
                        <p class="modal-meta">
                            ${article.data} - Autor(a): ${article.autor} | 
                            Categoria: ${category ? category.nome : 'Sem categoria'}
                        </p>
                    </div>
                    <button class="close-modal">&times;</button>
                </div>
                <div id="modal-content">
                    <p>${article.texto}</p>
                    ${article.link ? `<p><a href="${article.link}" target="_blank" style="color: white; text-decoration: underline;">Leia o artigo completo</a></p>` : ''}
                </div>
                <button id="toggle-favorite" class="favorite-btn ${isFav ? 'active' : ''}" data-id="${articleId}">
                    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i> 
                    ${isFav ? 'Remover dos favoritos' : 'Favoritar'}
                </button>
            </div>
        `;

        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';

        document.querySelector('.close-modal').addEventListener('click', closeArticleModal);
        document.getElementById('toggle-favorite').addEventListener('click', function() {
            const articleId = parseInt(this.dataset.id);
            toggleFavorite(articleId);
            updateFavoriteButton(this, articleId);
        });
    }

    function updateFavoriteButton(button, articleId) {
        const isFav = isFavorite(articleId);
        button.innerHTML = isFav ?
            '<i class="fas fa-heart"></i> Remover dos favoritos' :
            '<i class="far fa-heart"></i> Favoritar';
        button.className = isFav ? 'favorite-btn active' : 'favorite-btn';
    }

    function closeArticleModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    function toggleFavorite(articleId) {
        const existingIndex = favoritesData.findIndex(fav =>
            fav.noticia_id === articleId && fav.usuario_id === currentUserId
        );

        if (existingIndex === -1) {
            const newId = favoritesData.length > 0 ?
                Math.max(...favoritesData.map(f => f.id)) + 1 : 1;

            favoritesData.push({
                id: newId,
                usuario_id: currentUserId,
                noticia_id: articleId
            });
        } else {
            favoritesData.splice(existingIndex, 1);
        }

        console.log('Favoritos atualizados:', favoritesData);

        document.querySelectorAll(`.favorite-icon[data-id="${articleId}"]`).forEach(icon => {
            icon.classList.toggle('active');
            icon.classList.toggle('far');
            icon.classList.toggle('fas');
        });

        if (currentFilter === 'favorites') {
            filterFavorites();
        }
    }

    function filterAll() {
        currentFilter = 'all';
        currentCategory = '';
        renderArticles(articlesData);
    }

    function filterFavorites() {
        currentFilter = 'favorites';
        currentCategory = '';
        const favArticleIds = favoritesData
            .filter(fav => fav.usuario_id === currentUserId)
            .map(fav => fav.noticia_id);

        const favArticles = articlesData.filter(article =>
            favArticleIds.includes(article.id)
        );
        renderArticles(favArticles);
    }

    function filterByCategory(categoryId) {
        currentFilter = 'category';
        currentCategory = categoryId;
        const filteredArticles = articlesData.filter(article =>
            article.categoria_id == categoryId
        );
        renderArticles(filteredArticles);
    }

    function filterBySearch(query) {
        currentFilter = 'search';
        currentSearch = query.toLowerCase();

        const filteredArticles = articlesData.filter(article =>
            article.titulo.toLowerCase().includes(currentSearch) ||
            article.texto.toLowerCase().includes(currentSearch) ||
            article.autor.toLowerCase().includes(currentSearch)
        );

        renderArticles(filteredArticles);
    }

    allArticlesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        filterAll();
    });

    favoritesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        filterFavorites();
    });

    categoriesBtn.addEventListener('click', function(e) {
        e.preventDefault();
        categoriesList.classList.toggle('show');
    });

    searchBtn.addEventListener('click', function() {
        const query = searchInput.value.trim();
        if (query) {
            filterBySearch(query);
        }
    });

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                filterBySearch(query);
            }
        }
    });

    document.addEventListener('click', function(e) {
        if (!categoriesBtn.contains(e.target) && !categoriesList.contains(e.target)) {
            categoriesList.classList.remove('show');
        }
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeArticleModal();
        }
    });
});
