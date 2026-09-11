const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let tarefas = [
    {
        id: 1,
        tarefa: "Estudar para a prova",
        descricao: "Revisar a matéria de Histologia",
        prioridades: "Alta",
        status: "Pendente",
        criadaEm: new Date().toISOString()
    }
];

let proximoId = 2;

const PRIORIDADES_VALIDAS = ["Baixa", "Média", "Alta"];
const STATUS_VALIDOS = ["Pendente", "Concluída"];

app.get('/api/tarefas', (req, res) => {
    let resultado = [...tarefas];

    if (req.query.status) {
        resultado = resultado.filter(t => t.status === req.query.status);
    }
    if (req.query.prioridade) {
        resultado = resultado.filter(t => t.prioridades === req.query.prioridade);
    }

    res.json(resultado);
});

app.post('/api/tarefas', (req, res) => {
    const { tarefa, descricao, prioridades, status } = req.body;

    if (!tarefa || typeof tarefa !== 'string' || tarefa.trim() === '') {
        return res.status(400).json({ error: "O campo 'tarefa' é obrigatório." });
    }

    const novaTarefa = {
        id: proximoId++,
        tarefa: tarefa.trim(),
        descricao: descricao?.trim() || "",
        prioridades: PRIORIDADES_VALIDAS.includes(prioridades) ? prioridades : "Média",
        status: STATUS_VALIDOS.includes(status) ? status : "Pendente",
        criadaEm: new Date().toISOString()
    };

    tarefas.push(novaTarefa);
    res.status(201).json(novaTarefa);
});

app.patch('/api/tarefas/:id', (req, res) => {
    const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
    if (!tarefa) return res.status(404).json({ error: "Tarefa não encontrada." });

    const { tarefa: nome, descricao, prioridades, status } = req.body;

    if (nome !== undefined && nome.trim() !== '') tarefa.tarefa = nome.trim();
    if (descricao !== undefined) tarefa.descricao = descricao.trim();
    if (prioridades && PRIORIDADES_VALIDAS.includes(prioridades)) tarefa.prioridades = prioridades;
    if (status && STATUS_VALIDOS.includes(status)) tarefa.status = status;

    res.json(tarefa);
});

app.delete('/api/tarefas/:id', (req, res) => {
    const index = tarefas.findIndex(t => t.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: "Tarefa não encontrada." });

    const removida = tarefas.splice(index, 1)[0];
    res.json({ message: "Tarefa removida.", tarefa: removida });
});

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em: http://localhost:${PORT}`);
});