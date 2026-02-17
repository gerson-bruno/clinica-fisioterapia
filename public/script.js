let pacienteAtualId = null;
let avaliacoesLocais = []; // Cache temporário para as avaliações do paciente selecionado

function showSection(id) {
    const ids = ['login-section', 'register-section', 'main-section', 'paciente-form', 'aval-form', 'ver-avaliacoes-section', 'detalhe-aval-section'];
    ids.forEach(s => {
        const el = document.getElementById(s);
        if(el) el.classList.add('hidden');
    });
    document.getElementById(id).classList.remove('hidden');
}

function toggleTheme() {
    const body = document.body;
    body.setAttribute('data-theme', body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

// --- AUTH ---
async function login() {
    const user = document.getElementById('user').value;
    const pass = document.getElementById('pass').value;
    const res = await fetch('/api/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user, pass })
    });
    if(res.ok && (await res.json()).success) {
        showSection('main-section');
        carregarPacientes();
    } else alert('Usuário ou senha incorretos');
}

async function registrarUsuario() {
    const user = document.getElementById('reg-user').value;
    const pass = document.getElementById('reg-pass').value;
    if(!user || !pass) return alert('Preencha todos os campos');

    const res = await fetch('/api/registrar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user, pass })
    });
    if(res.ok) {
        alert('Conta criada com sucesso! Faça login.');
        showSection('login-section');
    } else alert('Erro ao criar ou usuário já existe.');
}

// --- PACIENTES ---
function abrirNovoPaciente() {
    pacienteAtualId = null;
    document.getElementById('p-nome').value = '';
    document.getElementById('p-nasc').value = '';
    document.getElementById('p-diag').value = '';
    document.getElementById('titulo-paciente').innerText = "Cadastro de Paciente";
    showSection('paciente-form');
}

async function carregarPacientes() {
    const res = await fetch('/api/pacientes');
    const pacientes = await res.json();
    const lista = document.getElementById('lista-pacientes');
    lista.innerHTML = '<h4>Pacientes Ativos</h4>';
    pacientes.forEach(p => {
        const div = document.createElement('div');
        div.className = 'patient-card';
        div.innerHTML = `
            <div style="flex:1">
                <strong>${p.nome}</strong><br>
                <small>Nasc: ${p.nascimento}</small>
            </div>
            <div style="display:flex; gap:5px">
                <button onclick="abrirFormAvaliacao(${p.id})" title="Nova Avaliação">📋</button>
                <button onclick="verHistoricoAvaliacoes(${p.id})" title="Ver Histórico" style="background:#555">👁️</button>
                <button onclick="prepararEdicao(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="background:orange">✏️</button>
                <button onclick="excluirPaciente(${p.id})" style="background:red">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

async function salvarPaciente() {
    const dados = {
        nome: document.getElementById('p-nome').value,
        nascimento: document.getElementById('p-nasc').value,
        diagnostico: document.getElementById('p-diag').value
    };
    const method = pacienteAtualId ? 'PUT' : 'POST';
    const url = pacienteAtualId ? `/api/pacientes/${pacienteAtualId}` : '/api/pacientes';
    await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(dados)
    });
    showSection('main-section');
    carregarPacientes();
}

function prepararEdicao(p) {
    pacienteAtualId = p.id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-nasc').value = p.nascimento;
    document.getElementById('p-diag').value = p.diagnostico;
    document.getElementById('titulo-paciente').innerText = "Editar Paciente";
    showSection('paciente-form');
}

async function excluirPaciente(id) {
    if(confirm('Deseja excluir permanentemente este paciente?')) {
        await fetch(`/api/pacientes/${id}`, { method: 'DELETE' });
        carregarPacientes();
    }
}

// --- AVALIAÇÕES ---
function abrirFormAvaliacao(id) {
    pacienteAtualId = id;
    showSection('aval-form');
}

async function salvarAvaliacao() {
    const aval = {
        avaliador: document.getElementById('av-nome').value,
        idade: document.getElementById('av-idade').value,
        diagClinico: document.getElementById('av-diag-clin').value,
        exames: document.getElementById('av-exames').value,
        dor: document.getElementById('av-dor').value,
        hma: document.getElementById('av-hma').value,
        avalFisio: document.getElementById('av-aval').value,
        diagFisio: document.getElementById('av-diag-fisio').value,
        obs: document.getElementById('av-obs').value
    };
    await fetch(`/api/pacientes/${pacienteAtualId}/avaliacoes`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(aval)
    });
    alert('Avaliação Salva!');
    showSection('main-section');
}

async function verHistoricoAvaliacoes(id) {
    const res = await fetch(`/api/pacientes/${id}/avaliacoes`);
    avaliacoesLocais = await res.json();
    const cont = document.getElementById('lista-avaliacoes-conteudo');
    cont.innerHTML = avaliacoesLocais.length ? '' : '<p>Nenhuma avaliação registrada.</p>';
    
    avaliacoesLocais.forEach((a, index) => {
        cont.innerHTML += `
            <div class="patient-card" style="justify-content: space-between; align-items: center;">
                <div>
                    <strong>Data: ${a.data}</strong><br>
                    <small>Dor: ${a.dor}/10 | Fisioterapeuta: ${a.avaliador || 'Não informado'}</small>
                </div>
                <button onclick="verAvaliacaoDetalhada(${index})" style="background:var(--accent)">Ver Completa</button>
            </div>`;
    });
    showSection('ver-avaliacoes-section');
}

function verAvaliacaoDetalhada(index) {
    const a = avaliacoesLocais[index];
    const cont = document.getElementById('detalhe-conteudo');
    cont.innerHTML = `
        <p><strong>Avaliador:</strong> ${a.avaliador || '-'}</p>
        <p><strong>Idade:</strong> ${a.idade || '-'}</p>
        <p><strong>Escala de Dor:</strong> ${a.dor}/10</p>
        <hr>
        <p><strong>Diagnóstico Clínico:</strong><br>${a.diagClinico || '-'}</p>
        <p><strong>Exames:</strong><br>${a.exames || '-'}</p>
        <p><strong>HMA:</strong><br>${a.hma || '-'}</p>
        <p><strong>Avaliação Fisioterapêutica:</strong><br>${a.avalFisio || '-'}</p>
        <p><strong>Diagnóstico Fisioterapêutico:</strong><br>${a.diagFisio || '-'}</p>
        <p><strong>Observações:</strong><br>${a.obs || '-'}</p>
    `;
    showSection('detalhe-aval-section');
}

let todosPacientes = []; // Armazena a lista completa vinda do servidor

async function carregarPacientes() {
    const res = await fetch('/api/pacientes');
    todosPacientes = await res.json();
    renderizarLista(todosPacientes);
}

function filtrarPacientes() {
    const termo = document.getElementById('search-input').value.toLowerCase();
    const filtrados = todosPacientes.filter(p => 
        p.nome.toLowerCase().includes(termo)
    );
    renderizarLista(filtrados);
}

function renderizarLista(lista) {
    const container = document.getElementById('lista-pacientes');
    container.innerHTML = lista.length ? '' : '<p style="text-align:center; opacity:0.5">Nenhum paciente encontrado.</p>';
    
    lista.forEach(p => {
        const div = document.createElement('div');
        div.className = 'patient-card';
        div.innerHTML = `
            <div style="flex:1">
                <strong style="font-size:1.1rem">${p.nome}</strong><br>
                <small style="opacity:0.7">Nasc: ${p.nascimento}</small>
            </div>
            <div style="display:flex; gap:8px">
                <button onclick="abrirFormAvaliacao(${p.id})" style="padding:10px">📋</button>
                <button onclick="verHistoricoAvaliacoes(${p.id})" style="background:#555; padding:10px">👁️</button>
                <button onclick="prepararEdicao(${JSON.stringify(p).replace(/"/g, '&quot;')})" style="background:orange; padding:10px">✏️</button>
                <button onclick="excluirPaciente(${p.id})" style="background:#ff4d4d; padding:10px">🗑️</button>
            </div>
        `;
        container.appendChild(div);
    });
}