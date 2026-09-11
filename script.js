const API_URL = '/api/tarefas';

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
// API — LEITURA E ESCRITA
// =========================================================================

async function carregarTarefas() {
    try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error('Erro ao buscar tarefas');
        
        todasTarefas = await res.json();
        
        renderizarTarefas();
        atualizarStats();
    } catch (e) {
        console.error('Erro ao carregar tarefas:', e);
    }
}

async function adicionarTarefa(dados) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
    });

    if (!res.ok) throw new Error('Erro ao adicionar tarefa no servidor');
    return await res.json();
}

async function toggleStatus(id, statusAtual) {
    const novoStatus = statusAtual === 'Concluída' ? 'Pendente' : 'Concluída';
    try {
        await fetch(`${API_URL}/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: novoStatus })
        });
        await carregarTarefas();
    } catch (e) {
        console.error('Erro ao atualizar status:', e);
    }
}

async function deletarTarefa(id) {
    try {
        await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        await carregarTarefas();
    } catch (e) {
        console.error('Erro ao deletar tarefa:', e);
    }
}

// =========================================================================
// FORMULÁRIO DE CADASTRO
// =========================================================================

function configurarFormulario() {
    const form = document.getElementById('tarefaForm');
    const inputTarefa = document.getElementById('tarefa');
    const erroEl = document.getElementById('tarefaErro');

    if (!form) return;

    inputTarefa?.addEventListener('input', () => {
        inputTarefa.classList.remove('input-invalid');
        erroEl?.classList.remove('visible');
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nomeTarefa = inputTarefa.value.trim();

        if (!nomeTarefa) {
            inputTarefa.classList.add('input-invalid');
            erroEl?.classList.add('visible');
            inputTarefa.focus();
            return;
        }

        const btn = form.querySelector('.btn-add');
        if (btn) btn.disabled = true;

        const dados = {
            tarefa:      nomeTarefa,
            descricao:   document.getElementById('descricao')?.value.trim() || '',
            prioridades: document.getElementById('prioridade')?.value || 'Média',
            status:      'Pendente'
        };

        try {
            await adicionarTarefa(dados);
            form.reset();

            // Reseta para a aba 'Todas' ao criar para que o usuário veja a nova tarefa
            filtroAtivo = 'Todas';
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.filter === 'Todas');
            });

            await carregarTarefas();
        } catch (err) {
            console.error('Erro ao salvar tarefa:', err);
        } finally {
            if (btn) btn.disabled = false;
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
// RENDERIZAÇÃO VISUAL
// =========================================================================

function renderizarTarefas() {
    const container  = document.getElementById('listaTarefas');
    const emptyState = document.getElementById('emptyState');

    if (!container) return;

    // Normalização das chaves vindas da API (prioridades vs prioridade)
    const listaNormalizada = todasTarefas.map(t => ({
        id: t.id,
        tarefa: t.tarefa || t.nome || 'Sem título',
        descricao: t.descricao || '',
        prioridades: t.prioridades || t.prioridade || 'Média',
        status: t.status || 'Pendente',
        criadaEm: t.criadaEm
    }));

    const filtradas = filtroAtivo === 'Todas'
        ? listaNormalizada
        : listaNormalizada.filter(t => t.status === filtroAtivo);

    container.innerHTML = '';

    if (filtradas.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';

    filtradas.forEach((t, i) => {
        const card = criarCard(t, i);
        container.appendChild(card);
    });
}

function criarCard(t, i) {
    const card = document.createElement('div');
    const statusSlug = slugify(t.status);
    const prioSlug = slugify(t.prioridades);

    card.className = `tarefa-card ${t.status} ${t.prioridades} status-${statusSlug} prio-${prioSlug}`;
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
                <span class="badge prio-badge prio-${t.prioridades}">${t.prioridades}</span>
                <span class="badge status-badge status-${t.status}">${t.status}</span>
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
    const elPendente = document.getElementById('countPendente');
    const elConcluida = document.getElementById('countConcluida');

    if (elPendente) {
        elPendente.textContent = todasTarefas.filter(t => t.status === 'Pendente').length;
    }
    if (elConcluida) {
        elConcluida.textContent = todasTarefas.filter(t => t.status === 'Concluída').length;
    }
}

// =========================================================================
// UTILITÁRIOS
// =========================================================================

function slugify(str) {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function formatarData(iso) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}