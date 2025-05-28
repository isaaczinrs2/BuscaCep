document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const cepInput = document.getElementById('CEP');
    const ruaInput = document.getElementById('rua');
    const bairroInput = document.getElementById('bairro');
    const cidadeInput = document.getElementById('cid');
    const estadoInput = document.getElementById('est');
    const resultadoCep = document.getElementById('resultado-cep');
    const btnBuscarCep = document.getElementById('env');
    const btnBuscarEndereco = document.getElementById('env-endereco');
    const btnOpenMaps = document.getElementById('open-maps');
    const btnClearHistory = document.getElementById('clear-history');
    const historicoList = document.getElementById('historico-list');

    // Máscara para o CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        e.target.value = value;
    });

    // Limpar formulário
    function limparFormulario() {
        ruaInput.value = '';
        bairroInput.value = '';
        cidadeInput.value = '';
        estadoInput.value = '';
        resultadoCep.textContent = 'CEP não informado';
        btnOpenMaps.disabled = true;
    }

    // Formatador de endereço para exibição
    function formatarEndereco(data) {
        let endereco = '';
        if (data.logradouro) endereco += data.logradouro;
        if (data.bairro) endereco += endereco ? ', ' + data.bairro : data.bairro;
        if (data.localidade) endereco += endereco ? ' - ' + data.localidade : data.localidade;
        if (data.uf) endereco += endereco ? '/' + data.uf : data.uf;
        return endereco;
    }

    // Adicionar ao histórico
    function adicionarAoHistorico(cep, data) {
        // Verificar se já existe no histórico
        const items = historicoList.querySelectorAll('li');
        for (let item of items) {
            if (item.dataset.cep === cep) {
                return; // Já está no histórico
            }
        }

        const li = document.createElement('li');
        li.dataset.cep = cep;
        li.dataset.endereco = JSON.stringify(data);
        
        li.innerHTML = `
            <div class="history-item-content">
                <strong>CEP:</strong> ${cep} - ${formatarEndereco(data)}
            </div>
            <div class="history-item-actions">
                <button class="btn-view" title="Ver no mapa">
                    <i class="fas fa-map-marked-alt"></i>
                </button>
                <button class="btn-remove" title="Remover">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Adiciona eventos aos botões
        li.querySelector('.btn-view').addEventListener('click', function(e) {
            e.stopPropagation();
            abrirNoMaps(cep, data);
        });

        li.querySelector('.btn-remove').addEventListener('click', function(e) {
            e.stopPropagation();
            li.remove();
            salvarHistorico();
        });

        // Evento de clique no item
        li.addEventListener('click', function() {
            preencherFormulario(cep, data);
        });

        historicoList.prepend(li);
        salvarHistorico();
    }

    // Salvar histórico no localStorage
    function salvarHistorico() {
        const items = historicoList.querySelectorAll('li');
        const historico = [];
        
        items.forEach(item => {
            historico.push({
                cep: item.dataset.cep,
                endereco: item.dataset.endereco
            });
        });
        
        localStorage.setItem('buscaCepHistorico', JSON.stringify(historico));
    }

    // Carregar histórico do localStorage
    function carregarHistorico() {
        const historico = JSON.parse(localStorage.getItem('buscaCepHistorico')) || [];
        
        historico.forEach(item => {
            const data = JSON.parse(item.endereco);
            adicionarAoHistorico(item.cep, data);
        });
    }

    // Preencher formulário com dados
    function preencherFormulario(cep, data) {
        cepInput.value = cep;
        ruaInput.value = data.logradouro || '';
        bairroInput.value = data.bairro || '';
        cidadeInput.value = data.localidade || '';
        estadoInput.value = data.uf || '';
        resultadoCep.textContent = `CEP: ${cep}`;
        btnOpenMaps.disabled = false;
        btnOpenMaps.dataset.cep = cep;
        btnOpenMaps.dataset.endereco = JSON.stringify(data);
    }

    // Buscar CEP
    async function buscarCep() {
        const cep = cepInput.value.replace(/\D/g, '');
        
        if (cep.length !== 8) {
            alert('CEP deve conter 8 dígitos');
            return;
        }

        try {
            btnBuscarCep.disabled = true;
            btnBuscarCep.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();
            
            if (data.erro) {
                throw new Error('CEP não encontrado');
            }
            
            preencherFormulario(cep, data);
            adicionarAoHistorico(cep, data);
        } catch (error) {
            limparFormulario();
            alert(error.message || 'Erro ao buscar CEP');
        } finally {
            btnBuscarCep.disabled = false;
            btnBuscarCep.innerHTML = '<i class="fas fa-search"></i> Buscar';
        }
    }

    // Buscar por endereço
    async function buscarPorEndereco() {
        const rua = ruaInput.value.trim();
        const cidade = cidadeInput.value.trim();
        const estado = estadoInput.value.trim().toUpperCase();
        
        if (!rua || !cidade || !estado || estado.length !== 2) {
            alert('Preencha todos os campos do endereço corretamente (Estado deve ser a sigla com 2 letras)');
            return;
        }
        
        try {
            btnBuscarEndereco.disabled = true;
            btnBuscarEndereco.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            
            const response = await fetch(`https://viacep.com.br/ws/${estado}/${cidade}/${rua}/json/`);
            const data = await response.json();
            
            if (data.erro || data.length === 0) {
                throw new Error('Endereço não encontrado');
            }
            
            // Pegamos o primeiro resultado
            const primeiroResultado = data[0];
            const cep = primeiroResultado.cep.replace(/\D/g, '');
            
            preencherFormulario(cep, primeiroResultado);
            adicionarAoHistorico(cep, primeiroResultado);
        } catch (error) {
            alert(error.message || 'Erro ao buscar endereço');
        } finally {
            btnBuscarEndereco.disabled = false;
            btnBuscarEndereco.innerHTML = '<i class="fas fa-search-location"></i> Buscar CEP';
        }
    }

    // Abrir no Google Maps
    function abrirNoMaps(cep, data) {
        const endereco = `${data.logradouro || ''}, ${data.bairro || ''}, ${data.localidade || ''}, ${data.uf || ''}, Brasil`.replace(/,\s*,/g, ',').trim();
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
        window.open(url, '_blank');
    }

    // Event Listeners
    btnBuscarCep.addEventListener('click', function(e) {
        e.preventDefault();
        buscarCep();
    });

    btnBuscarEndereco.addEventListener('click', function(e) {
        e.preventDefault();
        buscarPorEndereco();
    });

    btnOpenMaps.addEventListener('click', function() {
        const cep = btnOpenMaps.dataset.cep;
        const data = JSON.parse(btnOpenMaps.dataset.endereco || '{}');
        abrirNoMaps(cep, data);
    });

    btnClearHistory.addEventListener('click', function() {
        if (confirm('Tem certeza que deseja limpar todo o histórico?')) {
            historicoList.innerHTML = '';
            localStorage.removeItem('buscaCepHistorico');
        }
    });

    // Permitir busca com Enter
    cepInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            buscarCep();
        }
    });

    // Carregar histórico ao iniciar
    carregarHistorico();
});