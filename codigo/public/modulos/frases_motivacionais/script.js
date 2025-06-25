
let frasesApoio = JSON.parse(localStorage.getItem('frases')) || [
    { id: 1, texto: "Você é incrível! 🌟", favorito: false },
    { id: 2, texto: "Persistência leva ao sucesso. 💪", favorito: false }
];

let frasesFavoritas = JSON.parse(localStorage.getItem('favoritos')) || [];


const elementoFrase = document.getElementById('frase-apoio');
const botaoMudarFrase = document.getElementById('mudar-frase');
const formFrase = document.getElementById('form-frase');
const inputTexto = document.getElementById('texto-frase');
const inputId = document.getElementById('frase-id');
const listaFrases = document.getElementById('lista-frases');
const botaoCancelar = document.getElementById('cancelar-edicao');
const btnFavorito = document.getElementById('btn-favorito');
const textoFavorito = document.getElementById('texto-favorito');
const listaFavoritos = document.getElementById('lista-favoritos');


let editando = false;
let fraseAtual = null;


function salvarDados() {
    localStorage.setItem('frases', JSON.stringify(frasesApoio));
    localStorage.setItem('favoritos', JSON.stringify(frasesFavoritas));
}


function exibirFrases() {
    listaFrases.innerHTML = '';
    frasesApoio.forEach(frase => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${frase.texto}</span>
            <div>
                <button class="btn-editar" data-id="${frase.id}">✏️</button>
                <button class="btn-excluir" data-id="${frase.id}">🗑️</button>
            </div>
        `;
        listaFrases.appendChild(li);
    });


    document.querySelectorAll('.btn-editar').forEach(btn => {
        btn.addEventListener('click', editarFrase);
    });

    document.querySelectorAll('.btn-excluir').forEach(btn => {
        btn.addEventListener('click', excluirFrase);
    });
}


function atualizarFavoritos() {
    listaFavoritos.innerHTML = '';
    frasesFavoritas.forEach(frase => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${frase.texto}</span>
            <button class="btn-remover-favorito" data-id="${frase.id}">❌</button>
        `;
        listaFavoritos.appendChild(li);
    });

    // Adiciona eventos aos botões de remover
    document.querySelectorAll('.btn-remover-favorito').forEach(btn => {
        btn.addEventListener('click', removerFavorito);
    });
}



function gerarId() {
    return frasesApoio.length > 0 ? Math.max(...frasesApoio.map(f => f.id)) + 1 : 1;
}

function adicionarFrase(texto) {
    const novaFrase = {
        id: gerarId(),
        texto: texto,
        favorito: false
    };
    frasesApoio.push(novaFrase);
    salvarDados();
}

function editarFrase(e) {
    const id = parseInt(e.target.getAttribute('data-id'));
    const frase = frasesApoio.find(f => f.id === id);
    
    inputTexto.value = frase.texto;
    inputId.value = frase.id;
    editando = true;
    inputTexto.focus();
}

function atualizarFrase(id, novoTexto) {
    const index = frasesApoio.findIndex(f => f.id === id);
    frasesApoio[index].texto = novoTexto;
    salvarDados();
}

function excluirFrase(e) {
    const id = parseInt(e.target.getAttribute('data-id'));
    frasesApoio = frasesApoio.filter(frase => frase.id !== id);
    frasesFavoritas = frasesFavoritas.filter(frase => frase.id !== id);
    salvarDados();
    exibirFrases();
    atualizarFavoritos();
}



function alternarFavorito() {
    if (!fraseAtual) return;
    
    const index = frasesApoio.findIndex(f => f.id === fraseAtual.id);
    frasesApoio[index].favorito = !frasesApoio[index].favorito;
    
    if (frasesApoio[index].favorito) {
        if (!frasesFavoritas.some(f => f.id === fraseAtual.id)) {
            frasesFavoritas.push({...fraseAtual, favorito: true});
        }
        textoFavorito.textContent = "Favoritado!";
    } else {
        frasesFavoritas = frasesFavoritas.filter(f => f.id !== fraseAtual.id);
        textoFavorito.textContent = "Adicionar aos Favoritos";
    }
    
    salvarDados();
    atualizarFavoritos();
}

function removerFavorito(e) {
    const id = parseInt(e.target.getAttribute('data-id'));
    frasesFavoritas = frasesFavoritas.filter(f => f.id !== id);
    
    const index = frasesApoio.findIndex(f => f.id === id);
    if (index !== -1) {
        frasesApoio[index].favorito = false;
    }
    
    salvarDados();
    atualizarFavoritos();
    
    if (fraseAtual && fraseAtual.id === id) {
        textoFavorito.textContent = "Adicionar aos Favoritos";
    }
}



async function mostrarProximaFrase() {

    elementoFrase.classList.add('fade-out');
    

    await new Promise(resolve => setTimeout(resolve, 500));
    

    if (frasesApoio.length > 0) {
        const indiceAleatorio = Math.floor(Math.random() * frasesApoio.length);
        fraseAtual = frasesApoio[indiceAleatorio];
        elementoFrase.textContent = fraseAtual.texto;
        

        textoFavorito.textContent = fraseAtual.favorito ? "Favoritado!" : "Adicionar aos Favoritos";
    } else {
        fraseAtual = null;
        elementoFrase.textContent = "Adicione frases para começar!";
        textoFavorito.textContent = "";
    }
    

    elementoFrase.classList.remove('fade-out');
}


formFrase.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const texto = inputTexto.value.trim();
    if (!texto) return;

    if (editando) {
        atualizarFrase(parseInt(inputId.value), texto);
        editando = false;
    } else {
        adicionarFrase(texto);
    }

    formFrase.reset();
    exibirFrases();
    atualizarFavoritos();
});

botaoCancelar.addEventListener('click', () => {
    formFrase.reset();
    editando = false;
});

botaoMudarFrase.addEventListener('click', mostrarProximaFrase);
btnFavorito.addEventListener('click', alternarFavorito);


function iniciar() {
    exibirFrases();
    atualizarFavoritos();
    mostrarProximaFrase();
    
    
    setInterval(mostrarProximaFrase, 8000);
}

window.onload = iniciar;