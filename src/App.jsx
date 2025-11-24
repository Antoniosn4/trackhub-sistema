/**
 * TrackHub - Sistema de Gestão Médica
 * Desenvolvido para fins acadêmicos.
 * * Stack: React, TailwindCSS, Firebase (Firestore/Auth)
 * Arquitetura: Single File Component (adaptado para este ambiente)
 * Padrões: Hooks Pattern, Atomic Design (simplificado), Separation of Concerns
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Users, DollarSign, Package, FileText, Printer, 
  Briefcase, Search, Settings, Bell, Menu, ChevronDown, Plus, Minus, 
  Calendar, Filter, MoreHorizontal, X, Database, Construction, Trash2, 
  Edit, MessageSquare, CheckCircle, AlertCircle, Info 
} from 'lucide-react';

// --- Integração com Firebase ---
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken 
} from 'firebase/auth';
import { 
  getFirestore, collection, addDoc, query, onSnapshot, orderBy, 
  serverTimestamp, writeBatch, doc, deleteDoc 
} from 'firebase/firestore';

// --- CONFIGURAÇÃO DO FIREBASE (SUAS CHAVES REAIS) ---
const getFirebaseConfig = () => {
  return { 
    apiKey: "AIzaSyDr6OV1l-UyrK0cTjlWE0QZq_8B10qmapE",
    authDomain: "trackhub-13337.firebaseapp.com",
    projectId: "trackhub-13337",
    storageBucket: "trackhub-13337.firebasestorage.app",
    messagingSenderId: "1022402346972",
    appId: "1:1022402346972:web:4a02f8ae4e615ae86f1919"
  };
};

// Inicializa o Firebase
let app, auth, db;
try {
    const config = getFirebaseConfig();
    app = initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
} catch (e) {
    console.error("Erro ao inicializar Firebase:", e);
}

const getAppId = () => 'default-app-id';

// --- Constantes e Dados Mockados ---
const MOCK_INVENTORY = [
  { name: 'Paracetamol 750mg', batch: 'L8832', expiry: '2025-12-31', quantity: 150, unitCost: 0.45, classification: 'Medicamentos', type: 'Geral' },
  { name: 'Seringa 5ml', batch: 'S1029', expiry: '2026-06-20', quantity: 500, unitCost: 0.25, classification: 'Materiais', type: 'Geral' },
  { name: 'Amoxicilina 500mg', batch: 'A9001', expiry: '2024-10-15', quantity: 80, unitCost: 1.20, classification: 'Medicamentos', type: 'Controlados' },
  { name: 'Luva Procedimento M', batch: 'LP2023', expiry: '2027-01-01', quantity: 1000, unitCost: 0.15, classification: 'Materiais', type: 'Geral' },
  { name: 'Dipirona Sódica', batch: 'D4421', expiry: '2025-05-10', quantity: 200, unitCost: 0.60, classification: 'Medicamentos', type: 'Geral' }
];

// --- Styles (CSS-in-JS simulado para animações) ---
const GlobalStyles = () => (
  <style>{`
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
    .animate-slide-in-right { animation: slideInRight 0.3s ease-out forwards; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #f1f5f9; }
    ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  `}</style>
);

// --- HOOKS CUSTOMIZADOS (Lógica de Negócio) ---

const useAuth = () => {
  const [user, setUser] = useState(null);
  useEffect(() => {
    if (!auth) return;
    const initAuth = async () => {
      try {
         // Tenta login anônimo
         await signInAnonymously(auth);
      } catch (err) {
        console.error("Falha na autenticação. Verifique se o login Anônimo está ativado no Firebase Console.", err);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);
  return user;
};

const useToast = () => {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  return { toasts, addToast, removeToast };
};

const useInventory = (user, addToast) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
        // Timeout de segurança para não ficar carregando infinitamente se der erro de auth
        const timer = setTimeout(() => setLoading(false), 3000);
        return () => clearTimeout(timer);
    }
    
    const collectionRef = collection(db, 'artifacts', getAppId(), 'public', 'data', 'trackhub_inventory');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Erro no listener:", error);
      setLoading(false);
      // Mensagem amigável se o erro for de permissão
      if (error.code === 'permission-denied') {
          addToast('Erro de permissão. Verifique as Regras do Firestore.', 'error');
      } else {
          addToast('Erro de conexão com o banco de dados.', 'error');
      }
    });
    return () => unsubscribe();
  }, [user, addToast]);

  const addItem = async (itemData) => {
    if (!user || !db) return;
    try {
      await addDoc(collection(db, 'artifacts', getAppId(), 'public', 'data', 'trackhub_inventory'), {
        ...itemData,
        createdAt: serverTimestamp(),
        userId: user.uid
      });
      addToast('Produto adicionado com sucesso!', 'success');
      return true;
    } catch (error) {
      console.error(error);
      addToast('Erro ao salvar item.', 'error');
      return false;
    }
  };

  const deleteItem = async (itemId) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'artifacts', getAppId(), 'public', 'data', 'trackhub_inventory', itemId));
      addToast('Item removido do estoque.', 'success');
    } catch (error) {
      console.error(error);
      addToast('Erro ao excluir item.', 'error');
    }
  };

  const generateMockData = async () => {
    if (!user || !db) {
        alert("Aguarde a autenticação do Firebase...");
        return;
    }
    const batch = writeBatch(db);
    const colRef = collection(db, 'artifacts', getAppId(), 'public', 'data', 'trackhub_inventory');
    MOCK_INVENTORY.forEach(item => {
      batch.set(doc(colRef), { ...item, createdAt: serverTimestamp(), userId: user.uid });
    });
    try {
      await batch.commit();
      addToast('Dados de teste gerados!', 'success');
    } catch {
      addToast('Erro ao gerar dados.', 'error');
    }
  };

  return { items, loading, addItem, deleteItem, generateMockData };
};

// --- COMPONENTES DE UI ---

const Button = ({ children, variant = 'primary', className = '', icon: Icon, onClick, type = 'button', disabled = false }) => {
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200",
    danger: "bg-rose-500 text-white hover:bg-rose-600 shadow-rose-200",
    outline: "border border-slate-300 text-slate-700 bg-white hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg shadow-sm text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200/60 ${className}`}>
    {children}
  </div>
);

const Badge = ({ children, color = 'blue' }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    purple: 'bg-purple-50 text-purple-700 border-purple-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

const ToastContainer = ({ toasts, removeToast }) => (
  <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 pointer-events-none">
    {toasts.map(t => (
      <div key={t.id} className={`pointer-events-auto flex items-center gap-3 p-4 rounded-lg shadow-xl text-white min-w-[320px] animate-slide-in-right ${t.type === 'success' ? 'bg-emerald-600' : t.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'}`}>
        {t.type === 'success' ? <CheckCircle size={20} /> : t.type === 'error' ? <AlertCircle size={20} /> : <Info size={20} />}
        <span className="flex-1 text-sm font-medium">{t.message}</span>
        <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100"><X size={16} /></button>
      </div>
    ))}
  </div>
);

// --- COMPONENTES DE FUNCIONALIDADE ---

const SupportModal = ({ isOpen, onClose, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
      <Card className="w-full max-w-md p-6 m-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" /> Suporte Técnico
          </h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Assunto</label>
            <select className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
              <option>Relatar um erro</option><option>Dúvida</option><option>Sugestão</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Mensagem</label>
            <textarea required rows="4" className="mt-1 w-full border border-slate-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none transition-all" placeholder="Descreva sua solicitação..."></textarea>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">Enviar Ticket</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AddProductModal = ({ isOpen, onClose, onSave }) => {
  const [form, setForm] = useState({ name: '', batch: '', expiry: '', quantity: 1, unitCost: 0, classification: 'Medicamentos', type: 'Geral' });
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in-up">
      <Card className="w-full max-w-lg p-6 m-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><Plus size={20} /></div>Nova Entrada
          </h2>
          <button onClick={onClose}><X className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); onClose(); setForm({ name: '', batch: '', expiry: '', quantity: 1, unitCost: 0, classification: 'Medicamentos', type: 'Geral' }); }} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <input required className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nome do Produto" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.classification} onChange={e => setForm({...form, classification: e.target.value})}><option>Medicamentos</option><option>Materiais</option></select>
            <select className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.type} onChange={e => setForm({...form, type: e.target.value})}><option>Geral</option><option>Controlados</option></select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input required className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.batch} onChange={e => setForm({...form, batch: e.target.value})} placeholder="Lote" />
            <input type="date" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.expiry} onChange={e => setForm({...form, expiry: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="number" min="1" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.quantity} onChange={e => setForm({...form, quantity: Number(e.target.value)})} placeholder="Qtd" />
            <input type="number" step="0.01" required className="rounded-lg border border-slate-300 px-3 py-2 outline-none" value={form.unitCost} onChange={e => setForm({...form, unitCost: Number(e.target.value)})} placeholder="Custo Unit." />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="success" icon={Plus}>Confirmar</Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// --- MÓDULOS DA APLICAÇÃO ---

const InventoryModule = ({ items, onGenerateData, onAddClick, onDeleteItem, showToast }) => {
  const [filter, setFilter] = useState('');
  const [activeTab, setActiveTab] = useState('SALDOS');
  const filteredItems = useMemo(() => items.filter(i => 
    i.name.toLowerCase().includes(filter.toLowerCase()) || i.batch?.toLowerCase().includes(filter.toLowerCase())
  ), [items, filter]);

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-slate-400 mb-1 flex items-center gap-2 uppercase tracking-wide">
            Início / <span className="text-blue-600">Estoque</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="success" icon={Plus} onClick={onAddClick}>Entrada</Button>
          <Button variant="danger" icon={Minus}>Saída</Button>
        </div>
      </div>
      <Card className="min-h-[500px] overflow-hidden flex flex-col">
        <div className="flex border-b border-slate-200 px-6 pt-2 bg-slate-50/50">
          {['ENTRADAS', 'SAÍDAS', 'SALDOS'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-all" 
              placeholder="Filtrar por nome ou lote..." value={filter} onChange={e => setFilter(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 bg-white overflow-auto p-0">
          {activeTab !== 'SALDOS' ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <Construction size={48} className="mb-4 opacity-20" />
              <p>Módulo em construção...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center p-8">
              <Database size={48} className="mb-4 opacity-20" />
              <p className="mb-4">Nenhum item encontrado.</p>
              <Button variant="ghost" onClick={onGenerateData}>Gerar Dados de Teste</Button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase sticky top-0">
                <tr>
                  <th className="p-4 pl-6">Produto</th>
                  <th className="p-4">Detalhes</th>
                  <th className="p-4 text-center">Saldo</th>
                  <th className="p-4 text-right">Custo Total</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map(item => (
                  <InventoryRow key={item.id} item={item} onDelete={() => onDeleteItem(item.id)} onEdit={() => showToast('Edição em breve!', 'info')} />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
};

const InventoryRow = ({ item, onDelete, onEdit }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <tr className="hover:bg-slate-50 transition-colors group">
      <td className="p-4 pl-6 align-top">
        <div className="font-bold text-slate-700 text-sm">{item.name}</div>
        <div className="flex gap-2 mt-1">
          <Badge color={item.classification === 'Medicamentos' ? 'blue' : 'purple'}>{item.classification}</Badge>
          {item.type === 'Controlados' && <Badge color="amber">Controlado</Badge>}
        </div>
      </td>
      <td className="p-4 align-top">
        <div className="text-xs text-slate-500 space-y-1">
          <div><span className="font-semibold">Lote:</span> {item.batch}</div>
          <div><span className="font-semibold">Venc:</span> {item.expiry ? new Date(item.expiry).toLocaleDateString('pt-BR') : '-'}</div>
          <div><span className="font-semibold">Unit:</span> R$ {item.unitCost}</div>
        </div>
      </td>
      <td className="p-4 text-center align-top pt-6">
        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm border ${item.quantity < 50 ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{item.quantity}</span>
      </td>
      <td className="p-4 text-right align-top pt-7 font-bold text-slate-700 text-sm">
        {(item.quantity * item.unitCost).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </td>
      <td className="p-4 text-center align-top pt-6 relative">
        <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-400 hover:bg-white hover:text-blue-600 rounded transition-all"><MoreHorizontal size={18} /></button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-8 top-8 bg-white rounded-lg shadow-xl border border-slate-100 w-32 z-20 flex flex-col overflow-hidden animate-fade-in-up">
              <button onClick={onEdit} className="px-4 py-3 text-xs text-left text-slate-600 hover:bg-slate-50 flex gap-2"><Edit size={14} /> Editar</button>
              <button onClick={onDelete} className="px-4 py-3 text-xs text-left text-rose-600 hover:bg-rose-50 flex gap-2"><Trash2 size={14} /> Excluir</button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
};

export default function App() {
  const user = useAuth();
  const { toasts, addToast, removeToast } = useToast();
  const { items, loading, addItem, deleteItem, generateMockData } = useInventory(user, addToast);
  
  const [activeModule, setActiveModule] = useState('Estoque');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const menuItems = [
    { id: 'Agenda', icon: Calendar }, { id: 'Clientes', icon: Users }, 
    { id: 'Financeiro', icon: DollarSign }, { id: 'Estoque', icon: Package },
    { id: 'Cadastros', icon: FileText }, { id: 'Relatorios', icon: Printer }
  ];

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-600 overflow-hidden">
      <GlobalStyles />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-[#0F172A] text-slate-300 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0B1120] gap-3">
          <div className="p-1.5 bg-blue-600 rounded-lg"><Package size={20} className="text-white" /></div>
          <span className="font-bold text-white text-lg tracking-tight">TrackHub</span>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setActiveModule(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${activeModule === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'hover:bg-slate-800 hover:text-white'}`}>
              <item.icon size={20} /> <span className="text-sm font-medium">{item.id}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800/50 bg-[#0B1120]">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-lg">JD</div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-medium text-white truncate">João Doutor</div>
              <div className="text-xs text-slate-500">Administrador</div>
            </div>
            <Settings size={16} />
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <main className="flex-1 flex flex-col h-full relative">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shadow-sm shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"><Menu size={20} /></button>
            <div className="relative hidden md:block w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              <input className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent focus:bg-white focus:border-blue-500 rounded-lg text-sm transition-all outline-none" placeholder="Busca global..." />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-blue-600 relative"><Bell size={20} /><span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" /></button>
            <div className="h-6 w-px bg-slate-200 hidden sm:block"></div>
            <button onClick={() => setSupportOpen(true)} className="text-sm font-semibold text-blue-600 hover:underline hidden sm:block">Suporte</button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 sm:p-8">
          {activeModule === 'Estoque' ? (
            loading ? (
              <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
            ) : (
              <InventoryModule items={items} onGenerateData={generateMockData} onAddClick={() => setModalOpen(true)} onDeleteItem={(id) => { if(confirm('Excluir item?')) deleteItem(id); }} showToast={addToast} />
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Construction size={64} className="mb-6 opacity-20" />
              <h2 className="text-xl font-bold text-slate-700">Módulo {activeModule}</h2>
              <p>Em desenvolvimento.</p>
            </div>
          )}
        </div>
      </main>
      <AddProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={addItem} />
      <SupportModal isOpen={supportOpen} onClose={() => setSupportOpen(false)} onSubmit={() => { setSupportOpen(false); addToast('Chamado aberto com sucesso!', 'success'); }} />
    </div>
  );
}