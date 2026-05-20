const express = require('express');
const cors = require('cors');
const path = require('path'); // Módulo nativo do Node para lidar com caminhos de arquivos
const swaggerUi = require('swagger-ui-express');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Banco de dados temporário na memória
let tarefas = [
    {
        id: 1,
        tarefa: "Estudar para a prova",
        descricao: "Revisar a matéria de Histologia",
        prioridades: "Alta",
        status: "Pendente"
    },
];

// =========================================================================
// 1. CONFIGURAÇÃO DO SWAGGER (Documentação da API)
// =========================================================================
const swaggerDocument = {
    openapi: "3.0.0",
    info: {
        title: "Equipe 10 - API de Lista de Tarefas",
        description: "Documentação da API de tarefas desenvolvida em Node.js e Express.",
        version: "1.0.0"
    },
    servers: [
        {
            url: `http://localhost:${PORT}`
        }
    ],
    paths: {
        "/api/tarefas": {
            get: {
                summary: "Retorna todas as tarefas",
                responses: {
                    "200": { description: "Sucesso ao obter a lista de tarefas." }
                }
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
                                    prioridades: { type: "string", example: "Alta" },
                                    status: { type: "string", example: "Pendente" }
                                },
                                required: ["tarefa"]
                            }
                        }
                    }
                },
                responses: {
                    "201": { description: "Tarefa criada com sucesso." },
                    "400": { description: "Campo obrigatório ausente." }
                }
            }
        },
        "/api/tarefas/{id}": {
            patch: {
                summary: "Atualiza o status de uma tarefa específica",
                parameters: [
                    {
                        name: "id",
                        in: "path",
                        required: true,
                        schema: { type: "integer" }
                    }
                ],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    status: { type: "string", example: "Concluída" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    "200": { description: "Status atualizado com sucesso." },
                    "404": { description: "Tarefa não encontrada." }
                }
            }
        }
    }
};

// Rota onde o Swagger vai rodar
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// =========================================================================
// 2. ROTAS DA API
// =========================================================================

// Rota para listar todas as tarefas (GET)
app.get('/api/tarefas', (req, res) => {
    res.json(tarefas);
});

// Rota para criar uma nova tarefa (POST)
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

// Rota para alterar o status de uma tarefa (PATCH)
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

// =========================================================================
// 3. ROTA PARA SERVIR O FRONTEND (HTML) NO TERMINAL
// =========================================================================
// Quando você acessar a raiz http://localhost:3000, o servidor vai enviar o index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciando o servidor
app.listen(PORT, () => {
    console.log(`\n🚀 Servidor rodando com sucesso!`);
    console.log(`💻 Acesse o Frontend em: http://localhost:${PORT}`);
    console.log(`📄 Acesse o Swagger (Documentação) em: http://localhost:${PORT}/api-docs\n`);
});