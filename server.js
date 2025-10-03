const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('.'));

// Database
const db = new sqlite3.Database('./database.db');

// Initialize database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY,
        name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS client_procedures (
        id INTEGER PRIMARY KEY,
        client_id INTEGER,
        procedure_text TEXT,
        FOREIGN KEY (client_id) REFERENCES clients (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS providers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        image TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS provider_procedures (
        id INTEGER PRIMARY KEY,
        provider_id INTEGER,
        sinistro_type TEXT,
        procedure_text TEXT,
        FOREIGN KEY (provider_id) REFERENCES providers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS additional_provider_procedures (
        id INTEGER PRIMARY KEY,
        provider_id INTEGER,
        sinistro_type TEXT,
        procedure_text TEXT,
        FOREIGN KEY (provider_id) REFERENCES providers (id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS sinistro_procedures (
        id INTEGER PRIMARY KEY,
        sinistro_type TEXT,
        procedure_text TEXT
    )`);

    // Insert default data if not exists
    db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
        if (row.count === 0) {
            insertDefaultData();
        }
    });
});

function insertDefaultData() {
    const clients = [
        { id: 1, name: 'Cliente A', procedures: ['Contato inicial', 'Análise de requisitos', 'Proposta', 'Negociação', 'Fechamento'] },
        { id: 2, name: 'Cliente B', procedures: ['Reunião de briefing', 'Desenvolvimento', 'Testes', 'Entrega'] },
        { id: 3, name: 'Cliente C', procedures: ['Avaliação', 'Planejamento', 'Execução', 'Acompanhamento'] }
    ];

    const providers = [
        { id: 1, name: 'Prestador X', image: '', procedures: { acidentes: ['Avaliação de danos', 'Contato com cliente', 'Relatório de acidente'], avarias: ['Inspeção visual', 'Fotografia de avarias', 'Orçamento de reparo'], roubo: ['Verificação de documentos', 'Contato com polícia', 'Bloqueio de bens'], exclusoes: ['Análise contratual', 'Consulta jurídica', 'Decisão de cobertura'] }, additionalProcedures: { acidentes: ['Revisão', 'Aprovação'], avarias: [], roubo: [], exclusoes: [] } },
        { id: 2, name: 'Prestador Y', image: '', procedures: { acidentes: ['Registro do sinistro', 'Avaliação médica', 'Processamento de indenização'], avarias: ['Avaliação técnica', 'Negociação com oficinas', 'Acompanhamento de reparos'], roubo: ['Investigação preliminar', 'Verificação de seguros', 'Liberação de valores'], exclusoes: ['Revisão de cláusulas', 'Parecer técnico', 'Comunicação ao cliente'] }, additionalProcedures: { acidentes: ['Treinamento', 'Manutenção'], avarias: [], roubo: [], exclusoes: [] } },
        { id: 3, name: 'Prestador Z', image: '', procedures: { acidentes: ['Análise de responsabilidade', 'Cálculo de prejuízos', 'Pagamento de indenização'], avarias: ['Perícia especializada', 'Definição de reparos', 'Controle de qualidade'], roubo: ['Análise de risco', 'Recuperação de bens', 'Compensação financeira'], exclusoes: ['Auditoria contratual', 'Decisão final', 'Arquivamento do caso'] }, additionalProcedures: { acidentes: ['Suporte pós-venda', 'Atualizações'], avarias: [], roubo: [], exclusoes: [] } }
    ];

    const sinistroProcedures = [
        { sinistro_type: 'acidentes', procedure_text: 'Notificar imediatamente' },
        { sinistro_type: 'acidentes', procedure_text: 'Documentar o acidente' },
        { sinistro_type: 'acidentes', procedure_text: 'Contato com autoridades' },
        { sinistro_type: 'avarias', procedure_text: 'Avaliar danos' },
        { sinistro_type: 'avarias', procedure_text: 'Fotografar avarias' },
        { sinistro_type: 'avarias', procedure_text: 'Solicitar orçamento' },
        { sinistro_type: 'roubo', procedure_text: 'Registrar boletim de ocorrência' },
        { sinistro_type: 'roubo', procedure_text: 'Bloquear cartões/bens' },
        { sinistro_type: 'roubo', procedure_text: 'Notificar seguradora' },
        { sinistro_type: 'exclusoes', procedure_text: 'Verificar cláusulas contratuais' },
        { sinistro_type: 'exclusoes', procedure_text: 'Consultar especialista' },
        { sinistro_type: 'exclusoes', procedure_text: 'Documentar decisão' }
    ];

    clients.forEach(client => {
        db.run("INSERT INTO clients (id, name) VALUES (?, ?)", [client.id, client.name]);
        client.procedures.forEach(proc => {
            db.run("INSERT INTO client_procedures (client_id, procedure_text) VALUES (?, ?)", [client.id, proc]);
        });
    });

    providers.forEach(provider => {
        db.run("INSERT INTO providers (id, name, image) VALUES (?, ?, ?)", [provider.id, provider.name, provider.image]);
        for (let sinistro in provider.procedures) {
            provider.procedures[sinistro].forEach(proc => {
                db.run("INSERT INTO provider_procedures (provider_id, sinistro_type, procedure_text) VALUES (?, ?, ?)", [provider.id, sinistro, proc]);
            });
        }
        for (let sinistro in provider.additionalProcedures) {
            provider.additionalProcedures[sinistro].forEach(proc => {
                db.run("INSERT INTO additional_provider_procedures (provider_id, sinistro_type, procedure_text) VALUES (?, ?, ?)", [provider.id, sinistro, proc]);
            });
        }
    });

    sinistroProcedures.forEach(proc => {
        db.run("INSERT INTO sinistro_procedures (sinistro_type, procedure_text) VALUES (?, ?)", [proc.sinistro_type, proc.procedure_text]);
    });
}

// Routes
app.get('/api/clients', (req, res) => {
    db.all("SELECT * FROM clients", (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/clients/:id/procedures', (req, res) => {
    const clientId = req.params.id;
    db.all("SELECT * FROM client_procedures WHERE client_id = ?", [clientId], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/providers', (req, res) => {
    db.all("SELECT * FROM providers", (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/providers/:id/procedures/:sinistro', (req, res) => {
    const providerId = req.params.id;
    const sinistro = req.params.sinistro;
    db.all("SELECT * FROM provider_procedures WHERE provider_id = ? AND sinistro_type = ?", [providerId, sinistro], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

app.get('/api/providers/:id/additional-procedures/:sinistro', (req, res) => {
    const providerId = req.params.id;
    const sinistro = req.params.sinistro;
    db.all("SELECT * FROM additional_provider_procedures WHERE provider_id = ? AND sinistro_type = ?", [providerId, sinistro], (err, rows) => {
        if (err) return res.status(500).json({error: err.message});
        res.json(rows);
    });
});

// Add provider
app.post('/api/providers', (req, res) => {
    const { name, image } = req.body;
    db.run("INSERT INTO providers (name, image) VALUES (?, ?)", [name, image || ''], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({id: this.lastID});
    });
});

// Edit provider
app.put('/api/providers/:id', (req, res) => {
    const { name, image } = req.body;
    db.run("UPDATE providers SET name = ?, image = ? WHERE id = ?", [name, image || '', req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Delete provider
app.delete('/api/providers/:id', (req, res) => {
    db.run("DELETE FROM providers WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Add client
app.post('/api/clients', (req, res) => {
    const { name } = req.body;
    db.run("INSERT INTO clients (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({id: this.lastID});
    });
});

// Edit client
app.put('/api/clients/:id', (req, res) => {
    const { name } = req.body;
    db.run("UPDATE clients SET name = ? WHERE id = ?", [name, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Delete client
app.delete('/api/clients/:id', (req, res) => {
    db.run("DELETE FROM clients WHERE id = ?", [req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        // Also delete procedures
        db.run("DELETE FROM client_procedures WHERE client_id = ?", [req.params.id]);
        res.json({changes: this.changes});
    });
});

// Add client procedure
app.post('/api/clients/:id/procedures', (req, res) => {
    const { procedure_text } = req.body;
    db.run("INSERT INTO client_procedures (client_id, procedure_text) VALUES (?, ?)", [req.params.id, procedure_text], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({id: this.lastID});
    });
});

// Edit client procedure
app.put('/api/clients/:id/procedures/:procId', (req, res) => {
    const { procedure_text } = req.body;
    db.run("UPDATE client_procedures SET procedure_text = ? WHERE id = ? AND client_id = ?", [procedure_text, req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Delete client procedure
app.delete('/api/clients/:id/procedures/:procId', (req, res) => {
    db.run("DELETE FROM client_procedures WHERE id = ? AND client_id = ?", [req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Add provider procedure
app.post('/api/providers/:id/procedures/:sinistro', (req, res) => {
    const { procedure_text } = req.body;
    db.run("INSERT INTO provider_procedures (provider_id, sinistro_type, procedure_text) VALUES (?, ?, ?)", [req.params.id, req.params.sinistro, procedure_text], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({id: this.lastID});
    });
});

// Edit provider procedure
app.put('/api/providers/:id/procedures/:procId', (req, res) => {
    const { procedure_text } = req.body;
    db.run("UPDATE provider_procedures SET procedure_text = ? WHERE id = ? AND provider_id = ?", [procedure_text, req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Delete provider procedure
app.delete('/api/providers/:id/procedures/:procId', (req, res) => {
    db.run("DELETE FROM provider_procedures WHERE id = ? AND provider_id = ?", [req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Add additional provider procedure
app.post('/api/providers/:id/additional-procedures/:sinistro', (req, res) => {
    const { procedure_text } = req.body;
    db.run("INSERT INTO additional_provider_procedures (provider_id, sinistro_type, procedure_text) VALUES (?, ?, ?)", [req.params.id, req.params.sinistro, procedure_text], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({id: this.lastID});
    });
});

// Edit additional provider procedure
app.put('/api/providers/:id/additional-procedures/:procId', (req, res) => {
    const { procedure_text } = req.body;
    db.run("UPDATE additional_provider_procedures SET procedure_text = ? WHERE id = ? AND provider_id = ?", [procedure_text, req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

// Delete additional provider procedure
app.delete('/api/providers/:id/additional-procedures/:procId', (req, res) => {
    db.run("DELETE FROM additional_provider_procedures WHERE id = ? AND provider_id = ?", [req.params.procId, req.params.id], function(err) {
        if (err) return res.status(500).json({error: err.message});
        res.json({changes: this.changes});
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});