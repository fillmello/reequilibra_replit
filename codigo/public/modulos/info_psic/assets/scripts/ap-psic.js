document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.container-psicologos')) {
        carregarLtsPsig();
    } else if (document.querySelector('.detalhes-container')) {
        carregarDtlPsig();
    }
});

function buscarEnderecoPorCEP(cep) {
    if (!cep) return Promise.resolve(null);
    
    return fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => {
            if (!response.ok) {
                console.error('CEP não encontrado');
                return null;
            }
            return response.json();
        })
        .then(data => {
            if (data.erro) {
                console.error('CEP não encontrado');
                return null;
            }
            return `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''} - ${data.uf || ''}`.replace(/, , /g, ', ').replace(/, $/, '');
        })
        .catch(error => {
            console.error('Erro ao buscar CEP:', error);
            return null;
        });
}

function carregarLtsPsig() {
    let todosPsicologos = [];
    const inputBusca = document.getElementById('input-busca');
    const btnBusca = document.getElementById('btn-busca');
    const container = document.querySelector('.container-psicologos');

    fetch('/psicologos')
        .then(response => {
            if (!response.ok) {
                console.error('Erro ao carregar psicólogos');
                container.innerHTML = '<div class="erro">Não foi possível carregar os psicólogos</div>';
                return [];
            }
            return response.json();
        })
        .then(data => {
            todosPsicologos = data;
            return Promise.all(data.map(psicologo => processarImagem(psicologo)));
        })
        .then(psicologosProcessados => {
            exibirPsig(psicologosProcessados);
            configCardsPsig();
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="erro">Não foi possível carregar os psicólogos</div>';
        });

    btnBusca.addEventListener('click', buscarPsicologos);
    inputBusca.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') buscarPsicologos();
    });

    function buscarPsicologos() {
        const termo = inputBusca.value.toLowerCase().trim();
        const resultados = termo
            ? todosPsicologos.filter(p => p.area_atua.toLowerCase().includes(termo))
            : todosPsicologos;

        exibirPsig(resultados);
        configCardsPsig();
    }

    function processarImagem(psicologo) {
        return new Promise((resolve) => {
            if (psicologo.img && (psicologo.img.startsWith('http') || psicologo.img.startsWith('data:'))) {
                resolve(psicologo);
                return;
            }

            if (psicologo.img && psicologo.img.startsWith('data:')) {
                const img = new Image();
                img.onload = function() {
                    psicologo.img = this.src;
                    resolve(psicologo);
                };
                img.onerror = function() {
                    psicologo.img = 'https://via.placeholder.com/150?text=Sem+Imagem';
                    resolve(psicologo);
                };
                img.src = psicologo.img;
            } else {
                psicologo.img = psicologo.img || 'https://via.placeholder.com/150?text=Sem+Imagem';
                resolve(psicologo);
            }
        });
    }

    function exibirPsig(psicologos) {
        container.innerHTML = psicologos.map(p => `
        <div class="card-psicologo" data-id="${p.id}">
            <div class="detalhe-card"></div>
            <img src="${p.img}" alt="${p.nome}" class="foto-psicologo" onerror="this.src='https://via.placeholder.com/150?text=Sem+Imagem'">
            <div class="card-psicologo-content">
                <h2 class="nome-psicologo">${p.nome}</h2>
                <p class="especialidade-psicologo">${p.area_atua}</p>
                <div class="avaliacao-container">
                    <i class="fas fa-star"></i>
                    <span class="avaliacao">${p.nota}</span>
                </div>
            </div>
        </div>
        `).join('');
    }

    function configCardsPsig() {
        document.querySelectorAll('.card-psicologo').forEach(card => {
            card.addEventListener('click', function () {
                const psicologoId = this.getAttribute('data-id');
                window.location.href = `dtlpsicologos.html?id=${psicologoId}`;
            });
        });
    }
}

function carregarDtlPsig() {
    const urlParams = new URLSearchParams(window.location.search);
    const psicologoId = urlParams.get('id');
    const container = document.querySelector('.detalhes-container');

    if (!psicologoId) {
        container.innerHTML = '<p>Psicólogo não especificado</p>';
        return;
    }

    fetch('/psicologos')
        .then(response => {
            if (!response.ok) {
                console.error('Erro ao carregar psicólogo');
                container.innerHTML = '<div class="erro">Não foi possível carregar os dados do psicólogo</div>';
                return [];
            }
            return response.json();
        })
        .then(data => {
            const psicologo = data.find(p => p.id == psicologoId);
            if (!psicologo) {
                console.error('Psicólogo não encontrado');
                container.innerHTML = '<div class="erro">Psicólogo não encontrado</div>';
                return null;
            }
            return processarImagem(psicologo);
        })
        .then(psicologo => {
            if (!psicologo) return null;
            return buscarEnderecoCompleto(psicologo);
        })
        .then(psicologoComEndereco => {
            if (psicologoComEndereco) {
                exibirDtlPsig(psicologoComEndereco);
            }
        })
        .catch(error => {
            console.error('Erro:', error);
            container.innerHTML = '<div class="erro">Não foi possível carregar os dados do psicólogo</div>';
        });

    function processarImagem(psicologo) {
        return new Promise((resolve) => {
            if (psicologo.img && (psicologo.img.startsWith('http') || psicologo.img.startsWith('data:'))) {
                resolve(psicologo);
                return;
            }
            
            if (psicologo.img && psicologo.img.startsWith('data:')) {
                const img = new Image();
                img.onload = function() {
                    psicologo.img = this.src;
                    resolve(psicologo);
                };
                img.onerror = function() {
                    psicologo.img = 'https://via.placeholder.com/300?text=Sem+Imagem';
                    resolve(psicologo);
                };
                img.src = psicologo.img;
            } else {
                psicologo.img = psicologo.img || 'https://via.placeholder.com/300?text=Sem+Imagem';
                resolve(psicologo);
            }
        });
    }

    function buscarEnderecoCompleto(psicologo) {
        if (!psicologo.local_atend.includes('Presencial') || !psicologo.cep) {
            let enderecoCompleto = psicologo.endereco || '';
            if (psicologo.local_atend.includes('Online')) {
                enderecoCompleto = 'Atendimento Online';
            }
            return Promise.resolve({
                ...psicologo,
                enderecoCompleto: enderecoCompleto || 'Endereço não disponível'
            });
        }

        return buscarEnderecoPorCEP(psicologo.cep)
            .then(enderecoViaCEP => {
                let enderecoCompleto = psicologo.endereco || '';
                if (enderecoViaCEP) {
                    enderecoCompleto = enderecoViaCEP;
                } else {
                    enderecoCompleto = enderecoCompleto || 'Endereço não disponível (CEP não encontrado)';
                }
                return {
                    ...psicologo,
                    enderecoCompleto: enderecoCompleto
                };
            })
            .catch(error => {
                console.error('Erro ao processar endereço:', error);
                return {
                    ...psicologo,
                    enderecoCompleto: psicologo.endereco || 'Endereço não disponível'
                };
            });
    }
}

function exibirDtlPsig(psicologo) {
    const container = document.querySelector('.detalhes-container');

    container.innerHTML = `
    <div class="destaques-psic"></div>
    <div class="perfil-header">
            <img src="${psicologo.img}" alt="${psicologo.nome}" class="perfil-img" onerror="this.src='https://via.placeholder.com/300?text=Sem+Imagem'">
            <div class="perfil-info">
                <h1>${psicologo.nome}</h1>
                <div class="especialidade-badge">${psicologo.area_atua}</div>
                <div class="avaliacao-header">
                    <i class="fas fa-star"></i>
                    <span>${psicologo.nota}</span>
                </div>
            </div>
        </div>

        <div class="descricao">${psicologo.descricao}</div>

        <div class="info-section">
            <h2>Agendar Consulta</h2>
            <div class="info-grid">
                <div class="info-item">
                    <i class="fas fa-id-card info-icon"></i>
                    <span>CRP: ${psicologo.crp}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-envelope info-icon"></i>
                    <span>${psicologo.email}</span>
                </div>
                <div class="info-item">
                    <i class="fab fa-whatsapp info-icon"></i>
                    <span>${psicologo.whatsapp}</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marker-alt info-icon"></i>
                    <span>${psicologo.enderecoCompleto} (${psicologo.local_atend})</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-calendar-alt info-icon"></i>
                    <span>${psicologo.horarios}</span>
                </div>
            </div>

            <button class="btn-agendar">Agendar Consulta</button>
        </div>
    `;

    document.querySelector('.btn-agendar')?.addEventListener('click', function () {
        const numero = psicologo.whatsapp.replace(/\D/g, '');
        window.open(`https://wa.me/${numero}`);
    });
}