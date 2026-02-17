import express from 'express';
import { JSONFilePreset } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// Configuração da Porta para o Render
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Dados iniciais
const defaultData = { 
    usuarios: [{ user: "Gerson", pass: "123456" }], 
    pacientes: [] 
};

// Inicialização do Banco de Dados JSON
const db = await JSONFilePreset('db.json', defaultData);

// --- ROTAS DE USUÁRIO ---
app.post('/api/login', (req, res) => {
    const { user, pass } = req.body;
    const usuario = db.data.usuarios.find(u => u.user === user && u.pass === pass);
    res.json({ success: !!usuario });
});

app.post('/api/registrar', async (req, res) => {
    const { user, pass } = req.body;
    if (db.data.usuarios.find(u => u.user === user)) {
        return res.status(400).json({ message: "Usuário já existe" });
    }
    db.data.usuarios.push({ user, pass });
    await db.write();
    res.json({ success: true });
});

// --- ROTAS DE PACIENTES ---
app.get('/api/pacientes', (req, res) => {
    const lista = [...db.data.pacientes].sort((a, b) => a.nome.localeCompare(b.nome));
    res.json(lista);
});

app.post('/api/pacientes', async (req, res) => {
    const novo = { id: Date.now(), avaliacoes: [], ...req.body };
    db.data.pacientes.push(novo);
    await db.write();
    res.json(novo);
});

app.put('/api/pacientes/:id', async (req, res) => {
    const index = db.data.pacientes.findIndex(p => p.id == req.params.id);
    if (index !== -1) {
        db.data.pacientes[index] = { ...db.data.pacientes[index], ...req.body };
        await db.write();
        res.json({ success: true });
    }
});

app.delete('/api/pacientes/:id', async (req, res) => {
    db.data.pacientes = db.data.pacientes.filter(p => p.id != req.params.id);
    await db.write();
    res.json({ success: true });
});

// --- ROTAS DE AVALIAÇÃO ---
app.post('/api/pacientes/:id/avaliacoes', async (req, res) => {
    const index = db.data.pacientes.findIndex(p => p.id == req.params.id);
    if (index !== -1) {
        const novaAval = { idAval: Date.now(), data: new Date().toLocaleDateString('pt-BR'), ...req.body };
        db.data.pacientes[index].avaliacoes.push(novaAval);
        await db.write();
        res.json(novaAval);
    }
});

app.get('/api/pacientes/:id/avaliacoes', (req, res) => {
    const paciente = db.data.pacientes.find(p => p.id == req.params.id);
    res.json(paciente ? paciente.avaliacoes : []);
});

// Inicialização dinâmica da porta
app.listen(PORT, () => {
    console.log(`
    ==================================================
    🚀 Servidor Online!
    📡 Porta: ${PORT}
    🔗 Local: http://localhost:${PORT}
    ==================================================
    `);
});