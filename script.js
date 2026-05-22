const API_URL = 'http://localhost:3000/api/tarefas';

let filtroAtivo = 'Todas';
let todasTarefas = [];

// =========================================================================
// INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    carregarTarefas();
    configurarFormulario();
    configurarFiltros();
});

// =========================================================================
// API — LEITURA
// =========================================================================

async function carregarTarefas() {
    try {
        const res = await fetch(API_URL);
        todasTarefas = await res.json();
        renderizarTarefas();
        atualizarStats();
    } catch (e) {
        console.error('Erro ao carregar tarefas:', e);
    }
}

// =========================================================================
// API — ESCRITA
// =========================================================================

async function adicionarTarefa(dados) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });
    if (!res.ok) throw new Error('Erro ao adicionar tarefa');
}

async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'Concluída' ? 'Pendente' : 'Concluída';
    await fetch(`${API_URL}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus })
    });
    await carregarTarefas();
}

async function deletarTarefa(id) {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    await carregarTarefas();
}

// =========================================================================
// FORMULÁRIO
// =========================================================================

function configurarFormulario() {
    const inputTarefa = document.getElementById('tarefa');
    const erroEl = document.getElementById('tarefaErro');

    // Limpa o erro enquanto o usuário digita
    inputTarefa.addEventListener('input', () => {
        inputTarefa.classList.remove('input-invalid');
        erroEl.classList.remove('visible');
    });

    document.getElementById('tarefaForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validação customizada
        if (!inputTarefa.value.trim()) {
            inputTarefa.classList.add('input-invalid');
            erroEl.classList.add('visible');
            inputTarefa.focus();
            return;
        }

        inputTarefa.classList.remove('input-invalid');
        erroEl.classList.remove('visible');

        const btn = e.target.querySelector('.btn-add');
        btn.disabled = true;

        const dados = {
            tarefa:      inputTarefa.value,
            descricao:   document.getElementById('descricao').value,
            prioridades: document.getElementById('prioridade').value,
            status:      'Pendente'
        };

        try {
            await adicionarTarefa(dados);
            e.target.reset();
            await carregarTarefas();
        } catch (err) {
            console.error(err);
        } finally {
            btn.disabled = false;
        }
    });
}

// =========================================================================
// FILTROS
// =========================================================================

function configurarFiltros() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filtroAtivo = btn.dataset.filter;
            renderizarTarefas();
        });
    });
}

// =========================================================================
// RENDERIZAÇÃO
// =========================================================================

function renderizarTarefas() {
    const container  = document.getElementById('listaTarefas');
    const emptyState = document.getElementById('emptyState');

    const filtradas = filtroAtivo === 'Todas'
        ? todasTarefas
        : todasTarefas.filter(t => t.status === filtroAtivo);

    container.innerHTML = '';

    if (filtradas.length === 0) {
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    filtradas.forEach((t, i) => {
        const card = criarCard(t, i);
        container.appendChild(card);
    });
}

function criarCard(t, i) {
    const card = document.createElement('div');
    card.className = `tarefa-card status-${slugify(t.status)} prio-${slugify(t.prioridades)}`;
    card.style.animationDelay = `${i * 60}ms`;

    const concluida = t.status === 'Concluída';

    card.innerHTML = `
        <div class="card-left">
            <button class="check-btn ${concluida ? 'checked' : ''}"
                data-id="${t.id}"
                data-status="${t.status}"
                title="${concluida ? 'Marcar como Pendente' : 'Marcar como Concluída'}">
                ${concluida ? '✓' : ''}
            </button>
        </div>
        <div class="card-body">
            <p class="card-title ${concluida ? 'riscado' : ''}">${escapeHtml(t.tarefa)}</p>
            ${t.descricao ? `<p class="card-desc">${escapeHtml(t.descricao)}</p>` : ''}
            <div class="card-meta">
                <span class="badge prio-badge prio-${slugify(t.prioridades)}">${t.prioridades}</span>
                <span class="badge status-badge status-${slugify(t.status)}">${t.status}</span>
                ${t.criadaEm ? `<span class="card-date">${formatarData(t.criadaEm)}</span>` : ''}
            </div>
        </div>
        <div class="card-actions">
            <button class="btn-delete" data-id="${t.id}" title="Remover tarefa">✕</button>
        </div>
    `;

    card.querySelector('.check-btn').addEventListener('click', () => toggleStatus(t.id, t.status));
    card.querySelector('.btn-delete').addEventListener('click', () => deletarTarefa(t.id));

    return card;
}

function atualizarStats() {
    document.getElementById('countPendente').textContent =
        todasTarefas.filter(t => t.status === 'Pendente').length;
    document.getElementById('countConcluida').textContent =
        todasTarefas.filter(t => t.status === 'Concluída').length;
}

// =========================================================================
// UTILITÁRIOS
// =========================================================================

function slugify(str) {
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function escapeHtml(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}