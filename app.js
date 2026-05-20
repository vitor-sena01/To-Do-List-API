const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

let tarefas = [
    {
        id: 1,
        tarefa: "Estudar para a prova",
        descricao: "Revisar a matéria de Histologia",
        status: "Pendente"
    },
];

app.get('/api/tarefas', (req, res) =>{
    res.json(tarefas);
});

app.post('/api/tarefas', (req, res) => {
    const { tarefa, descricao, prioridades, status } = req.body;
    
    if (!tarefa) {
        return res.status(400).json({ error: "O campo 'Tarefa' é obrigatório." });
    }

    const novaTarefa = {
        id: tarefas.length + 1,
        tarefa,
        descricao: descricao || "",
        prioridades: prioridades || "Média",
        status: status || "Pendente"
    };

    tarefas.push(novaTarefa);
    res.status(201).json(novaTarefa);
});

app.patch('/api/tarefas/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const tarefaEncontrada = tarefas.find(t => t.id === parseInt(id));

    if (!tarefaEncontrada) {
        return res.status(404).json({ error: "Tarefa não encontrada." });
    }

    tarefaEncontrada.status = status;
    res.json(tarefaEncontrada);
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});