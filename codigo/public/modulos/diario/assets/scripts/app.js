const btnSalvarDiario = document.getElementById('btnSalvarDiario');
let statusDiario = '';
let selectedDiario = '';
let diarioID = '';
let boolSelectedDiario = false;
const diariosUrl = '/diarios';

function limpaCampos() {
    // Reseta os campos
    document.getElementById('tituloDiario').value = null;
    document.getElementById('textoDiario').value = null;
    const resetBtn = document.querySelectorAll('#btnStatus1, #btnStatus2, #btnStatus3, #btnStatus4, #btnStatus5');
    resetBtn.forEach(btn => btn.classList.replace('btn-custom', 'btn-light'));

    boolSelectedDiario = false;
}

function noDiarySelected() {
    if (!boolSelectedDiario) {
        document.getElementById('btnSalvarDiario').innerHTML = "Criar Diário";

        let allCards = document.querySelectorAll('#diario1 > div');
        allCards.forEach(cards => cards.classList.replace('bg-primary', 'bg-light'));
    } else {
        document.getElementById('btnSalvarDiario').innerHTML = "Atualizar Diário";
    }
}

btnSalvarDiario.addEventListener('click', function (event) {
    event.preventDefault();
    const tituloDiario = document.getElementById('tituloDiario').value;
    const textoDiario = document.getElementById('textoDiario').value;
    const date = new Date();

    // Gera o ID
    diarioID = Date.now();

    // Cria um objeto com os dados do diário
    let diarioObject = {
        id: diarioID,
        userid: 1,
        data: date.toLocaleDateString('pt-BR'),
        titulo: tituloDiario,
        publico: false,
        status: statusDiario,
        conteudo: textoDiario,
        favorito: false
    };

    if (!boolSelectedDiario) {
        createDiario(diarioObject, listaDiarios);
    } else {
        updateDiario(selectedDiario, diarioObject, listaDiarios);
    }
});

// CREATE
function createDiario(diarioObject, refreshFunction) {
    // Reseta os campos
    document.getElementById('tituloDiario').value = null;
    document.getElementById('textoDiario').value = null;
    const resetBtn = document.querySelectorAll('#btnStatus1, #btnStatus2, #btnStatus3, #btnStatus4, #btnStatus5');
    resetBtn.forEach(btn => btn.classList.replace('btn-custom', 'btn-light'));

    fetch(diariosUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(diarioObject),
    })
        .then(response => {
            if (!response.ok) {
                console.log('Erro ao inserir diário');
                alert("Erro ao inserir diário");
                return;
            }
            return response.json(); // Converte a resposta para JSON
        })
        .then(data => {
            alert("Diário inserido com sucesso");

            if (refreshFunction) {
                // Atualiza a lista de diários e destaca o novo card
                refreshFunction()
                    .then(() => {
                        selecionaDiario(data.id);
                    });
            }
        })
        .catch(error => {
            console.error('Erro ao inserir diário via API REPLIT Server:', error);
            alert("Erro ao inserir diário");
        });
}

// ============== BOTÕES STATUS ================
function defStatusDiario(i) {
    // Reseta os botões
    const resetBtn = document.querySelectorAll('#btnStatus1, #btnStatus2, #btnStatus3, #btnStatus4, #btnStatus5');
    resetBtn.forEach(btn => btn.classList.replace('btn-custom', 'btn-light'));

    statusDiario = i;
    const btnStatus = document.getElementById(`btnStatus${i}`);
    btnStatus.classList.replace('btn-light', 'btn-custom');
}

function selecionaDiario(i) {
    boolSelectedDiario = true;
    noDiarySelected();

    // Preenche os campos com o diário selecionado
    fetch(`${diariosUrl}?id=${i}`)
        .then(response => response.json())
        .then(data => {
            let selectedTitulo = document.getElementById('tituloDiario');
            let selectedTexto = document.getElementById('textoDiario');

            // Remove o destaque de todos os cards
            selectedTitulo.value = data[0].titulo;
            selectedTexto.value = data[0].conteudo;

            statusDiario = data[0].status;
            defStatusDiario(statusDiario); // Atualiza o botão de status

            console.log("Título do diário selecionado:", selectedTitulo.value);

            selectedDiario = i;
        });

    console.log("ID do diário selecionado:", selectedDiario);

    let allCards = document.querySelectorAll('#diario1 > div');
    allCards.forEach(cards => cards.classList.replace('bg-purple', 'bg-light'));

    let card = document.getElementById(`card${i}`);
    card.classList.replace('bg-light', 'bg-purple');
}

function deleteDiario(id, refreshFunction) {
    if (!id) {
        alert("Nenhum diário foi selecionado para exclusão.");
        return;
    }

    fetch(`${diariosUrl}/${id}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (!response.ok) {
                console.log('Diário não encontrado');
                alert("Diário não encontrado");
                return;
            } else {
                alert("Diário removido com sucesso");
            }
        });

    // Atualiza a lista de diários
    if (refreshFunction) {
        refreshFunction();
        selecionaDiario(id);
    }
}

function updateDiario(id, diario, refreshFunction) {
    fetch(`${diariosUrl}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(diario),
    })
        .then(response => response.json())
        .then(data => {
            alert("Diário alterado com sucesso");
            if (refreshFunction) {
                boolSelectedDiario = true;
                refreshFunction()
                    .then(() => {
                        selecionaDiario(id);
                        noDiarySelected();
                        statusDiario = data.status;
                    });
            }
        })
        .catch(error => {
            console.error('Erro ao atualizar diário via API JSONServer:', error);
            displayMessage("Erro ao atualizar diário");
        });
}

