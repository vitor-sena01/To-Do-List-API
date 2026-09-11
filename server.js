const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const open = require('open');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Banco de dados em memória
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

// =========================================================================
// DOCUMENTAÇÃO SWAGGER
// =========================================================================
const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Equipe 10 - API de Lista de Tarefas",
        description: "Documentação da API desenvolvida em Node.js e Express.",
        version: "1.1.0"
    },
    servers: [{ url: `http://localhost:${PORT}` }],
    paths: {
        "/api/tarefas": {
            get: {
                summary: "Retorna todas as tarefas",
                parameters: [
                    { name: "status", in: "query", schema: { type: "string" } },
                    { name: "prioridade", in: "query", schema: { type: "string" } }
                ],
                responses: { "200": { description: "Sucesso." } }
            },
            post: {
                summary: "Cria uma nova tarefa",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    tarefa: { type: "string", example: "Estudar Anatomia" },
                                    descricao: { type: "string", example: "Revisar sistema circulatório" },
                                    prioridades: { type: "string", enum: ["Baixa", "Média", "Alta"], example: "Alta" },
                                    status: { type: "string", enum: ["Pendente", "Concluída"], example: "Pendente" }
                                },
                                required: ["tarefa"]
                            }
                        }
                    }
                },
                responses: { "201": { description: "Criada com sucesso." }, "400": { description: "Erro de validação." } }
            }
        },
        "/api/tarefas/{id}": {
            get: {
                summary: "Retorna uma tarefa pelo ID",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { "200": { description: "Sucesso." }, "404": { description: "Não encontrada." } }
            },
            patch: {
                summary: "Atualiza uma tarefa",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { "200": { description: "Atualizada com sucesso." }, "404": { description: "Não encontrada." } }
            },
            delete: {
                summary: "Remove uma tarefa",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
                responses: { "200": { description: "Removida com sucesso." }, "404": { description: "Não encontrada." } }
            }
        }
    }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// =========================================================================
// ROTAS DA API
// =========================================================================

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

app.get('/api/tarefas/:id', (req, res) => {
    const tarefa = tarefas.find(t => t.id === parseInt(req.params.id));
    if (!tarefa) return res.status(404).json({ error: "Tarefa não encontrada." });
    res.json(tarefa);
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

// Arquivos estáticos
app.use(express.static(path.join(__dirname)));

// Rota fallback ajustada para evitar o erro de sintaxe do Express
// ✅ SUBSTITUA POR ESTA LINHA:
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando com sucesso!`);
    console.log(`💻 Aplicação:    http://localhost:${PORT}`);
    console.log(`📄 Swagger Docs: http://localhost:${PORT}/api-docs\n`);
});

app.listen(PORT, async () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);

    // Abre o navegador automaticamente na documentação
    await open(`http://localhost:${PORT}/api-docs`);
});