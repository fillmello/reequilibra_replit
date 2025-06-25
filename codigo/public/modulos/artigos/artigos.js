document.addEventListener('DOMContentLoaded', function () {
    const articlesList = document.getElementById('articles-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const favoritesBtn = document.getElementById('favorites');
    const categoriesList = document.getElementById('categories-collapse');
    const modalElement = document.getElementById('article-modal');

    const modalTitle = document.getElementById('modal-title');
    const modalDate = document.getElementById('modal-date');
    const modalAuthor = document.getElementById('modal-author');
    const modalContent = document.getElementById('modal-content');
    const toggleFavoriteBtn = document.getElementById('toggle-favorite');

    let articlesData = [];
    let categoriesData = [];
    let favoritesData = [];
    const currentUserId = 1;
    let currentFilter = 'all';
    let currentSearch = '';
    let currentCategory = '';

    Promise.all([
        fetch('/artigos').then(res => res.json()),
        fetch('/categorias').then(res => res.json()),
        fetch('/favoritos').then(res => res.json())
    ])
        .then(([artigos, categorias, favoritos]) => {
            articlesData = artigos;
            categoriesData = categorias;
            favoritesData = favoritos;

            renderArticles(articlesData);
            renderCategories(categoriesData);
        })
        .catch(err => console.error('Erro ao carregar dados:', err));

    function isFavorite(articleId) {
        return favoritesData.some(fav =>
            fav.noticia_id.toString() === articleId.toString() &&
            Number(fav.usuario_id) === currentUserId
        );
    }

    function renderArticles(articles) {
        articlesList.innerHTML = '';

        if (articles.length === 0) {
            articlesList.innerHTML = '<p class="text-center py-4" style="color:#52bfa6">Nenhum artigo encontrado.</p>';
            return;
        }

        articles.forEach(article => {
            if (!article.id) return;
            const isFav = isFavorite(article.id);

            const div = document.createElement('div');
            div.className = 'col-12 mb-3';
            div.innerHTML = `
            <div class="card h-100 article-item" data-id="${article.id}">
                <div class="card-body">
                    <h5 class="card-title">${article.titulo}</h5>
                    <h6 class="card-subtitle mb-2 text-muted">${article.data} - Autor(a): ${article.autor}</h6>
                    <p class="card-text">${article.texto.substring(0, 150)}...</p>
                    <div class="text-end">
                        <i class="favorite-icon ${isFav ? 'fas' : 'far'} fa-heart ${isFav ? 'text-danger' : ''}" 
                           data-id="${article.id}" style="cursor:pointer;"></i>
                    </div>
                </div>
            </div>
        `;
            articlesList.appendChild(div);
        });

        setupArticleEvents();
    }

    function setupArticleEvents() {
        document.querySelectorAll('.article-item').forEach(item => {

            item.addEventListener('click', function (e) {
                if (!e.target.closest('.favorite-icon')) {
                    const id = this.dataset.id;
                    openArticleModal(id);
                }
            });


            const favoriteIcon = item.querySelector('.favorite-icon');
            if (favoriteIcon) {
                favoriteIcon.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const id = this.dataset.id;
                    toggleFavorite(id, () => {
                        const isFav = isFavorite(id);
                        this.className = `favorite-icon ${isFav ? 'fas' : 'far'} fa-heart ${isFav ? 'text-danger' : ''}`;
                        if (currentFilter === 'favorites') {
                            renderArticles(getFilteredArticles());
                        }
                    });
                });
            }
        });
    }

    function renderCategories(categories) {
        categoriesList.innerHTML = '';
        categories.forEach(cat => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = cat.nome;
            a.classList.add('d-block', 'text-decoration-none', 'mb-1');
            a.addEventListener('click', function (e) {
                e.preventDefault();
                currentFilter = 'category';
                currentCategory = cat.id;
                renderArticles(getFilteredArticles());
            });
            li.appendChild(a);
            categoriesList.appendChild(li);
        });
    }

    function getFilteredArticles() {
        if (currentFilter === 'favorites') {
            const favIds = favoritesData
                .filter(f => f.usuario_id.toString() === currentUserId.toString())
                .map(f => f.noticia_id.toString());

            return articlesData.filter(article => favIds.includes(article.id.toString()));

        } else if (currentFilter === 'category') {
            return articlesData.filter(article => article.categoria_id == currentCategory);
        } else if (currentFilter === 'search') {
            return articlesData.filter(article =>
                article.titulo.toLowerCase().includes(currentSearch) ||
                article.texto.toLowerCase().includes(currentSearch) ||
                article.autor.toLowerCase().includes(currentSearch)
            );
        }
        return articlesData;
    }

    function openArticleModal(articleId) {
        const article = articlesData.find(a => a.id.toString() === articleId.toString());

        if (!article) {
            console.warn("Artigo com id não encontrado:", articleId);
            return;
        }

        const isFav = isFavorite(articleId);

        modalTitle.textContent = article.titulo;
        modalDate.textContent = article.data;
        modalAuthor.textContent = article.autor;
        modalContent.innerHTML = `
    <p>${article.texto}</p>
    ${article.link ? `<p><a href="${article.link}" target="_blank" style="color:#52bfa6">Leia o artigo completo</a></p>` : ''}
  `;

        toggleFavoriteBtn.dataset.id = articleId;
        toggleFavoriteBtn.innerHTML = `
    <i class="${isFav ? 'fas' : 'far'} fa-heart"></i> ${isFav ? 'Remover dos favoritos' : 'Favoritar'}
  `;
        toggleFavoriteBtn.classList.toggle('active', isFav);


        const bootstrapModal = bootstrap.Modal.getOrCreateInstance(modalElement);
        bootstrapModal.show();
    }


    toggleFavoriteBtn.addEventListener('click', function () {
        const articleId = parseInt(this.dataset.id);
        toggleFavorite(articleId, () => {
            const isFav = isFavorite(articleId);
            this.innerHTML = `
        <i class="${isFav ? 'fas' : 'far'} fa-heart"></i> ${isFav ? 'Remover dos favoritos' : 'Favoritar'}
      `;
            this.classList.toggle('active', isFav);
            renderArticles(getFilteredArticles());
        });
    });

    function toggleFavorite(articleId, callback) {
        const existing = favoritesData.find(f =>
            f.noticia_id.toString() === articleId.toString() &&
            Number(f.usuario_id) === currentUserId
        );

        if (!existing) {
            const newFavorite = {
                usuario_id: currentUserId,
                noticia_id: articleId.toString()
            };

            fetch('/favoritos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newFavorite)
            })
                .then(res => res.json())
                .then(data => {
                    favoritesData.push(data);
                    if (callback) callback();
                });
        } else {
            fetch(`/favoritos/${existing.id}`, {
                method: 'DELETE'
            })
                .then(() => {
                    favoritesData = favoritesData.filter(f => f.id !== existing.id);
                    if (callback) callback();
                });
        }
    }

    favoritesBtn.addEventListener('click', function (e) {
        e.preventDefault();
        currentFilter = 'favorites';
        currentCategory = '';
        renderArticles(getFilteredArticles());
    });

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (query) {
            currentFilter = 'search';
            currentSearch = query;
            renderArticles(getFilteredArticles());
        }
    });

    searchInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
});
document.addEventListener("DOMContentLoaded", function () {
    const toggle = document.getElementById("themeToggle");
    const body = document.body;
    const icon = toggle.querySelector("i");


    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark-mode");
        icon.classList.replace("fa-moon", "fa-sun");
    }

    toggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        const isDark = body.classList.contains("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");


        if (isDark) {
            icon.classList.replace("fa-moon", "fa-sun");
        } else {
            icon.classList.replace("fa-sun", "fa-moon");
        }
    });
});

//Senha para cadastar artigos
document.addEventListener("DOMContentLoaded", function () {
    const senhaCorreta = "reequilibra2025";
    const inputSenha = document.getElementById("inputSenha");
    const btnConfirmar = document.getElementById("confirmarSenha");
    const mensagemErro = document.getElementById("mensagemErro");

    btnConfirmar.addEventListener("click", function () {
        const senhaDigitada = inputSenha.value.trim();

        if (senhaDigitada === senhaCorreta) {
            window.location.href = "../cadastroartigos/crudartigos.html";
        } else {
            mensagemErro.classList.remove("d-none");
            inputSenha.classList.add("is-invalid");
        }
    });

    document.getElementById("modalSenha").addEventListener("show.bs.modal", () => {
        inputSenha.value = "";
        inputSenha.classList.remove("is-invalid");
        mensagemErro.classList.add("d-none");
    });
});