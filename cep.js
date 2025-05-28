window.onload = function() {
    // Função para limpar os campos de endereço
    function limpa_formulário_cep() {
        document.getElementById('rua').value = "";
        document.getElementById('bairro').value = "";
        document.getElementById('cid').value = "";
        document.getElementById('est').value = "";
        document.getElementById('resultado-cep').textContent = "CEP: "; // Limpa o campo de resultado
    }

    // Função para adicionar CEP ao histórico
    function adicionarHistorico(cep, endereco) {
        const historicoList = document.getElementById('historico-list');

        // Verifica se o CEP já está presente no histórico
        const existingItems = Array.from(historicoList.getElementsByTagName('li'));
        if (existingItems.some(item => item.textContent.includes(cep))) {
            return; // Se já estiver, não adiciona
        }

        const li = document.createElement('li');
        li.textContent = `CEP - ${cep}`;
        // Adiciona os dados do endereço ao elemento para reutilizar no clique
        li.dataset.endereco = JSON.stringify(endereco);

        // Evento de clique para preencher o CEP e os campos de endereço
        li.addEventListener('click', function() {
            document.getElementById('CEP').value = cep;
            const data = JSON.parse(li.dataset.endereco);
            document.getElementById('rua').value = data.logradouro;
            document.getElementById('bairro').value = data.bairro;
            document.getElementById('cid').value = data.localidade;
            document.getElementById('est').value = data.uf;
            document.getElementById('resultado-cep').textContent = `CEP: ${cep}`;
        });

        historicoList.appendChild(li);
    }

    // Função para pesquisar o CEP
    function pesquisacep() {
        var valor = document.getElementById('CEP').value;
        var cep = valor.replace(/\D/g, '');

        if (cep != "") {
            var validacep = /^[0-9]{8}$/;

            if(validacep.test(cep)) {
                document.getElementById('rua').value = "...";
                document.getElementById('bairro').value = "...";
                document.getElementById('cid').value = "...";
                document.getElementById('est').value = "...";
                document.getElementById('resultado-cep').textContent = "CEP: ...";

                fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!("erro" in data)) {
                        document.getElementById('rua').value = data.logradouro;
                        document.getElementById('bairro').value = data.bairro;
                        document.getElementById('cid').value = data.localidade;
                        document.getElementById('est').value = data.uf;
                        document.getElementById('resultado-cep').textContent = `CEP: ${cep}`; // Exibe o CEP encontrado
                        document.getElementById('CEP').value = cep; // Atualiza o input "CEP"

                        // Adiciona o CEP ao histórico com os dados de endereço
                        adicionarHistorico(cep, data);
                    } else {
                        limpa_formulário_cep();
                        alert("CEP não encontrado.");
                    }
                })
                .catch(error => {
                    console.error("Erro ao buscar o CEP:", error);
                });
            } else {
                limpa_formulário_cep();
                alert("Formato de CEP inválido.");
            }
        } else {
            limpa_formulário_cep();
        }
    }

    // Função para remover acentos e caracteres especiais
    function removeAcentos(text) {
        return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Função para formatar texto para URL (substituir espaços por %20)
    function formataParaUrl(text) {
        return text.trim().replace(/ /g, "%20");
    }

    // Função para buscar o CEP com base no endereço (estado, cidade e rua)
    function buscaCepPorEndereco() {
        var rua = removeAcentos(document.getElementById('rua').value);
        var cidade = removeAcentos(document.getElementById('cid').value);
        var estado = document.getElementById('est').value;

        rua = formataParaUrl(rua);
        cidade = formataParaUrl(cidade);

        if (rua && cidade && estado) {
            var url = `https://viacep.com.br/ws/${estado}/${cidade}/${rua}/json/`;
            console.log("URL gerada:", url);

            fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    document.getElementById('CEP').value = data[0].cep;
                    document.getElementById('rua').value = data[0].logradouro;
                    document.getElementById('bairro').value = data[0].bairro;
                    document.getElementById('cid').value = data[0].localidade;
                    document.getElementById('est').value = data[0].uf;
                    document.getElementById('resultado-cep').textContent = `CEP: ${data[0].cep}`;

                    // Adiciona ao histórico o CEP encontrado com os dados de endereço
                    adicionarHistorico(data[0].cep, data[0]);
                } else {
                    alert("Endereço não encontrado.");
                }
            })
            .catch(error => {
                console.error("Erro ao buscar o CEP:", error);
            });
        } else {
            alert("Preencha todos os campos do endereço.");
        }
    }

    // Vincular o botão "Enviar" de pesquisa de CEP
    document.getElementById('env').addEventListener('click', function(event) {
        event.preventDefault();  // Previne o comportamento padrão
        pesquisacep();           // Chama a função de busca por CEP
    });

    // Vincular o botão "Enviar" de pesquisa de endereço
    document.getElementById('env-endereco').addEventListener('click', function(event) {
        event.preventDefault();  // Previne o comportamento padrão
        buscaCepPorEndereco();   // Chama a função de busca por endereço
    });
};
