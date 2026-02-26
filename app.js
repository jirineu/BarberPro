const app = {
    dados: {
        caixa: 0, 
        agenda: [], 
        historico: [], // Armazena serviços concluídos
        prestadores: [], 
        estoque: [], 
        servicos: [],
        config: { inicioDia: 8, fimDia: 19, intervalo: 30 }
    },

    persistir() {
        localStorage.setItem('barber_data', JSON.stringify(this.dados));
    },

    renderView(view, btn) {
        if (view === 'add-agenda') {
            this.prepararNovoAgendamento();
            return;
        }

        document.querySelectorAll('.view-section').forEach(s => s.style.display = 'none');
        const targetView = (view === 'externo') ? 'add-agenda' : view;
        
        const viewEl = document.getElementById(`view-${targetView}`);
        if(viewEl) viewEl.style.display = 'block';

        const tabBar = document.querySelector('.tab-bar');
        // Esconde tab bar no histórico ou no externo
        tabBar.style.display = (view === 'externo' || view === 'historico') ? 'none' : 'flex';
        
        if (btn) {
            document.querySelectorAll('.tab-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }

        this.atualizarDadosTela(targetView);
    },

    atualizarDadosTela(view) {
        if (view === 'dash') {
            document.getElementById('dash-caixa').innerText = `R$ ${this.dados.caixa.toFixed(2)}`;
            document.getElementById('dash-agenda-count').innerText = this.dados.agenda.length;
        }
        if (view === 'agenda') this.filtrarLista('agenda', '');
        if (view === 'historico') this.filtrarHistorico();
        if (view === 'servicos') this.filtrarLista('servicos', '');
        if (view === 'estoque') this.filtrarLista('estoque', '');
        if (view === 'prestadores') this.renderListaPrestadores();
    },

    // --- GESTÃO DE HISTÓRICO ---
// --- GESTÃO DE HISTÓRICO ---
   // --- GESTÃO DE HISTÓRICO E FATURAMENTO ---
    setFiltroRapido(modo) {
        const inputData = document.getElementById('filtro-data-hist');
        const inputMes = document.getElementById('filtro-mes-hist');
        if (!inputData || !inputMes) return;

        inputData.value = "";
        inputMes.value = "";

        if (modo === 'hoje') {
            inputData.value = new Date().toISOString().split('T')[0];
        } else if (modo === 'mes') {
            inputMes.value = new Date().toISOString().slice(0, 7);
        }
        
        this.filtrarHistorico();
    },

filtrarHistorico() {
        const dataFiltro = document.getElementById('filtro-data-hist').value;
        const mesFiltro = document.getElementById('filtro-mes-hist').value;
        const container = document.getElementById('lista-historico-content');

        let filtrados = [...this.dados.historico];

        if (dataFiltro) {
            filtrados = filtrados.filter(h => h.data === dataFiltro);
        } else if (mesFiltro) {
            filtrados = filtrados.filter(h => h.data.startsWith(mesFiltro));
        }

        // CÁLCULOS FINANCEIROS
        const faturamentoBruto = filtrados.reduce((acc, curr) => acc + curr.valor, 0);
        const lucroLiquido = filtrados.reduce((acc, curr) => acc + (curr.lucroCasa || 0), 0);

        const resumoHtml = `
            <div style="background:var(--card); padding:15px; border-radius:12px; margin-bottom:15px; border:1px solid #333;">
                <div style="display:flex; justify-content:space-between; margin-bottom:8px">
                    <span style="color:#888; font-size:12px">Faturamento Bruto:</span>
                    <strong style="color:var(--text); font-size:14px">R$ ${faturamentoBruto.toFixed(2)}</strong>
                </div>
                <div style="display:flex; justify-content:space-between; border-top:1px solid #333; padding-top:8px">
                    <span style="color:#888; font-size:12px">Lucro Líquido (Casa):</span>
                    <strong style="color:var(--success); font-size:16px">R$ ${lucroLiquido.toFixed(2)}</strong>
                </div>
            </div>
        `;

        container.innerHTML = resumoHtml + (filtrados.reverse().map(h => `
            <div class="item-list" style="border-left: 4px solid #555">
                <div>
                    <strong>${h.data.split('-').reverse().join('/')} - ${h.hora}</strong><br>
                    <small>${h.cliente} (${h.prestador})</small>
                </div>
                <div style="text-align:right">
                    <span style="color:var(--success); font-weight:bold; font-size:12px">R$ ${h.valor.toFixed(2)}</span><br>
                    <small style="color:#888; font-size:10px">Liq: R$ ${h.lucroCasa.toFixed(2)}</small>
                </div>
            </div>
        `).join('') || '<p style="text-align:center; padding:20px; color:#666">Sem registros no período.</p>');
    },

    prepararNovoAgendamento() {
        const optPrestadores = this.dados.prestadores.map(p => `<option value="${p.nome}">${p.nome}</option>`).join('');
        const optServicos = this.dados.servicos.map(s => `<option value="${s.nome}" data-preco="${s.valor}">${s.nome} - R$ ${s.valor}</option>`).join('');
        
        // Data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];

        const html = `
            <input type="text" id="ag-nome" placeholder="Nome do Cliente">
            <label style="font-size:12px; color:#888; display:block; margin-top:10px">Data:</label>
            <input type="date" id="ag-data" value="${hoje}">
            <label style="font-size:12px; color:#888; display:block; margin-top:10px">Barbeiro:</label>
            <select id="ag-prestador-select" onchange="app.atualizarHorariosDisponiveis()">
                <option value="">Selecione...</option>
                ${optPrestadores}
            </select>
            <label style="font-size:12px; color:#888; display:block; margin-top:10px">Serviço:</label>
            <select id="ag-servico-select">
                <option value="">Selecione o serviço...</option>
                ${optServicos}
            </select>
            <label style="font-size:12px; color:#888; display:block; margin-top:10px">Horário:</label>
            <select id="ag-hora-select">
                <option value="">Escolha o profissional...</option>
            </select>
            <button class="btn-primary" style="margin-top:20px" onclick="app.salvarAgenda()">Confirmar Agendamento</button>
            <button class="btn-primary" style="background:#333; margin-top:10px" onclick="app.fecharModal()">Cancelar</button>
        `;
        this.abrirModalForm("Novo Agendamento", html);
    },

    salvarAgenda() {
        const cliente = document.getElementById('ag-nome').value;
        const data = document.getElementById('ag-data').value;
        const prestador = document.getElementById('ag-prestador-select').value;
        const hora = document.getElementById('ag-hora-select').value;
        const selectServ = document.getElementById('ag-servico-select');
        const servico = selectServ.value;
        const preco = parseFloat(selectServ.options[selectServ.selectedIndex]?.dataset.preco);

        if (cliente && data && prestador && hora && servico) {
            this.dados.agenda.push({ 
                id: Date.now(), 
                cliente, 
                data, // Salvamos a data escolhida
                prestador, 
                hora, 
                servico, 
                valor: preco 
            });
            this.persistir();
            this.fecharModal();
            this.renderView('agenda');
        } else {
            alert("Preencha todos os campos!");
        }
    },

    abrirCheckout(id) {
        const item = this.dados.agenda.find(a => a.id === id);
        const barbeiro = this.dados.prestadores.find(p => p.nome === item.prestador);
        const comissao = barbeiro ? barbeiro.comissao : 0;
        const lucro = item.valor - comissao;
        
        document.getElementById('modal-content').innerHTML = `
            <h3>Finalizar Atendimento</h3>
            <p>Cliente: ${item.cliente}</p>
            <p>Serviço: ${item.servico}</p>
            <p>Comissão Barbeiro: R$ ${comissao.toFixed(2)}</p>
            <p style="color:var(--success); font-weight:bold">Líquido Casa: R$ ${lucro.toFixed(2)}</p>
            <button class="btn-primary" style="margin-top:20px" onclick="app.finalizarPagamento(${id}, ${lucro})">Confirmar Pagamento</button>
            <button class="btn-primary" style="background:#333; margin-top:10px" onclick="app.fecharModal()">Voltar</button>
        `;
        document.getElementById('modal-container').style.display = 'flex';
    },

    finalizarPagamento(id, lucro) {
        const index = this.dados.agenda.findIndex(a => a.id === id);
        const itemConcluido = this.dados.agenda[index];
        
        this.dados.caixa += lucro;
        // Move para o histórico antes de remover da agenda
        this.dados.historico.push({
            ...itemConcluido,
            lucroCasa: lucro,
            dataConclusao: new Date().toISOString().split('T')[0]
        });
        
        this.dados.agenda.splice(index, 1);
        this.persistir();
        this.fecharModal();
        this.renderView('dash');
    },

    // --- FUNÇÕES DE APOIO (MANTIDAS) ---
    filtrarLista(tipo, termo) {
        const termoBusca = termo.toLowerCase();
        if (tipo === 'agenda') {
            const container = document.getElementById('lista-agenda-content');
            const filtrados = this.dados.agenda.filter(item => 
                item.cliente.toLowerCase().includes(termoBusca) || 
                item.prestador.toLowerCase().includes(termoBusca)
            ).sort((a,b) => a.hora.localeCompare(b.hora));

            container.innerHTML = filtrados.map(item => `
                <div class="item-list">
                    <div><strong>${item.hora}</strong> - ${item.cliente}<br>
                    <small>${item.servico} (${item.prestador})</small></div>
                    <button class="btn-small" onclick="app.abrirCheckout(${item.id})">Pagar</button>
                </div>
            `).join('') || '<p>Agenda vazia.</p>';
        }
        // ... (outros filtros de serviço/estoque seguem a mesma lógica original)
    },

    abrirModalForm(titulo, html) {
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        content.innerHTML = `<h3>${titulo}</h3><br>${html}`;
        modal.style.display = 'flex';
    },

    fecharModal() { document.getElementById('modal-container').style.display = 'none'; },

    atualizarHorariosDisponiveis() {
        const barbeiro = document.getElementById('ag-prestador-select').value;
        const data = document.getElementById('ag-data').value;
        const selectHora = document.getElementById('ag-hora-select');
        if (!barbeiro || !data) return;

        let html = '<option value="">Selecione o horário...</option>';
        const { inicioDia, fimDia, intervalo } = this.dados.config;
        for (let h = inicioDia; h < fimDia; h++) {
            for (let m = 0; m < 60; m += intervalo) {
                const horaFormatada = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                // Verifica ocupação na data e barbeiro específicos
                const ocupado = this.dados.agenda.some(a => a.prestador === barbeiro && a.hora === horaFormatada && a.data === data);
                if (!ocupado) html += `<option value="${horaFormatada}">${horaFormatada}</option>`;
            }
        }
        selectHora.innerHTML = html;
    },

    renderListaPrestadores() {
        document.getElementById('lista-pre').innerHTML = [...this.dados.prestadores].reverse().map(p => `
            <div class="item-list">
                <div><strong>${p.nome}</strong><br><small>Comissão: R$ ${p.comissao}</small></div>
                <button class="btn-small" style="background:#444; color:white" onclick="app.prepararEdicaoPrestador(${p.id})">Editar</button>
            </div>
        `).join('');
    },

    prepararEdicaoServico(id = null) {
        const s = id ? this.dados.servicos.find(x => x.id === id) : { nome: '', valor: '' };
        const html = `<input type="hidden" id="srv-id" value="${id || ''}"><input type="text" id="srv-nome" placeholder="Nome do Serviço" value="${s.nome}"><input type="number" id="srv-valor" placeholder="Valor R$" value="${s.valor}"><button class="btn-primary" onclick="app.salvarServico()">Salvar</button><button class="btn-primary" style="background:#333; margin-top:10px" onclick="app.fecharModal()">Cancelar</button>`;
        this.abrirModalForm(id ? "Editar Serviço" : "Novo Serviço", html);
    },

    salvarServico() {
        const nome = document.getElementById('srv-nome').value;
        const valor = parseFloat(document.getElementById('srv-valor').value);
        const id = document.getElementById('srv-id').value;
        if (nome && !isNaN(valor)) {
            if (id) {
                const idx = this.dados.servicos.findIndex(s => s.id == id);
                this.dados.servicos[idx] = { id: parseInt(id), nome, valor };
            } else {
                this.dados.servicos.push({ id: Date.now(), nome, valor });
            }
            this.persistir(); this.fecharModal(); this.renderView('servicos');
        }
    },
    
    prepararEdicaoPrestador(id = null) {
        const p = id ? this.dados.prestadores.find(x => x.id === id) : { nome: '', comissao: '' };
        const html = `<input type="hidden" id="pre-id" value="${id || ''}"><input type="text" id="pre-nome" placeholder="Nome" value="${p.nome}"><input type="number" id="pre-comissao" placeholder="Comissão" value="${p.comissao}"><button class="btn-primary" onclick="app.salvarPrestador()">Salvar</button><button class="btn-primary" style="background:#333; margin-top:10px" onclick="app.fecharModal()">Cancelar</button>`;
        this.abrirModalForm(id ? "Editar Prestador" : "Novo Prestador", html);
    },

    salvarPrestador() {
        const nome = document.getElementById('pre-nome').value;
        const comissao = parseFloat(document.getElementById('pre-comissao').value);
        const id = document.getElementById('pre-id').value;
        if (nome && !isNaN(comissao)) {
            if (id) {
                const idx = this.dados.prestadores.findIndex(p => p.id == id);
                this.dados.prestadores[idx] = { id: parseInt(id), nome, comissao };
            } else {
                this.dados.prestadores.push({ id: Date.now(), nome, comissao });
            }
            this.persistir(); this.fecharModal(); this.renderView('prestadores');
        }
    },

    prepararEdicaoEstoque(id = null) {
        const e = id ? this.dados.estoque.find(x => x.id === id) : { nome: '', qtd: '', preco: '' };
        const html = `<input type="hidden" id="est-id" value="${id || ''}"><input type="text" id="est-nome" placeholder="Nome do Produto" value="${e.nome}"><input type="number" id="est-qtd" placeholder="Quantidade" value="${e.qtd}"><input type="number" id="est-preco" placeholder="Preço" value="${e.preco}"><button class="btn-primary" onclick="app.salvarEstoque()">Salvar</button><button class="btn-primary" style="background:#333; margin-top:10px" onclick="app.fecharModal()">Cancelar</button>`;
        this.abrirModalForm(id ? "Editar Item" : "Novo Item", html);
    },

    salvarEstoque() {
        const nome = document.getElementById('est-nome').value;
        const qtd = parseInt(document.getElementById('est-qtd').value);
        const preco = parseFloat(document.getElementById('est-preco').value) || 0;
        const id = document.getElementById('est-id').value;
        if (nome && !isNaN(qtd)) {
            if (id) {
                const idx = this.dados.estoque.findIndex(e => e.id == id);
                this.dados.estoque[idx] = { id: parseInt(id), nome, qtd, preco };
            } else {
                this.dados.estoque.push({ id: Date.now(), nome, qtd, preco });
            }
            this.persistir(); this.fecharModal(); this.renderView('estoque');
        }
    },

    compartilharLink() {
        const url = window.location.href.split('?')[0] + "?agendar=true";
        navigator.clipboard.writeText(url).then(() => alert("Link de agendamento copiado!"));
    }
};

window.onload = () => {
    const dadosSalvos = localStorage.getItem('barber_data');
    if (dadosSalvos) {
        app.dados = JSON.parse(dadosSalvos);
        if (!app.dados.historico) app.dados.historico = [];
    }

    const params = new URLSearchParams(window.location.search);
    
    if (params.has('agendar')) {
        // Se não houver serviços cadastrados (celular do cliente), 
        // a tela ficaria branca. Vamos avisar ou carregar algo.
        if (app.dados.servicos.length === 0) {
            document.body.innerHTML = `
                <div style="padding:40px; text-align:center; color:white; background:#111; height:100vh">
                    <h2>BarberPro</h2>
                    <p>Olá! No momento não há serviços ou profissionais disponíveis para agendamento online.</p>
                </div>`;
            return;
        }
        // Se houver dados, renderiza a view externa
        app.renderView('externo');
    } else {
        app.renderView('dash');
    }
};
