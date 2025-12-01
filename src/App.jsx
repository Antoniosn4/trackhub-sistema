import React, { useState } from 'react';
import { Package, Plus, Minus, Search, Trash2, Calendar, Users, DollarSign, FileText, Printer, X } from 'lucide-react';

// IMPORTAÇÕES ORGANIZADAS (SRP - Princípio da Responsabilidade Única)
import { useAuth } from './hooks/useAuth';
import { useInventory } from './hooks/useInventory';
import { Button, Card, Badge } from './components/UI';

// Hook local simples para mensagens (Toast)
const useToast = () => {
  const [msg, setMsg] = useState(null);
  const addToast = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };
  return { msg, addToast };
};

export default function App() {
  // 1. Usa os Hooks para trazer a lógica (Separado da visualização)
  const user = useAuth();
  const { msg, addToast } = useToast();
  const { items, loading, addItem, deleteItem } = useInventory(user, addToast);

  // 2. Estados locais para controle visual (Modal e Busca)
  const [isModalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // Estado para a busca

  // 3. Função para salvar o formulário
  const handleSave = (e) => {
    e.preventDefault();
    const form = e.target;

    addItem({
      name: form.name.value,
      quantity: Number(form.qtd.value),
      classification: form.classification.value,
      createdAt: new Date()
    });
    setModalOpen(false);
  };

  // 4. Lógica de Filtragem (Torna a busca funcional)
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-600 font-sans">

      {/* Toast Feedback */}
      {msg && (
        <div className={`fixed top-5 right-5 px-4 py-3 rounded shadow-lg z-50 text-white ${msg.type === 'error' ? 'bg-rose-600' : 'bg-slate-800'}`}>
          {msg.text}
        </div>
      )}

      {/* Menu Lateral */}
      <aside className="w-64 bg-[#0F172A] text-slate-300 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/50 bg-[#0B1120] font-bold text-white gap-2 text-lg">
          <div className="p-1.5 bg-blue-600 rounded"><Package size={20} className="text-white" /></div>
          TrackHub
        </div>
        <nav className="p-4 space-y-2">
          {[
            { icon: Calendar, l: 'Agenda' },
            { icon: Users, l: 'Clientes' },
            { icon: DollarSign, l: 'Financeiro' },
            { icon: Package, l: 'Estoque', active: true }
          ].map(i => (
            <div key={i.l} className={`flex items-center gap-3 px-4 py-3 rounded cursor-pointer transition-colors ${i.active ? 'bg-blue-600 text-white' : 'hover:bg-slate-800'}`}>
              <i.icon size={18} /> {i.l}
            </div>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 overflow-auto">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Controle de Estoque</h1>
            <p className="text-sm text-slate-400">Gerencie entradas e saídas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="success" icon={Plus} onClick={() => setModalOpen(true)}>Entrada</Button>
            <Button variant="danger" icon={Minus} onClick={() => alert("Funcionalidade de Saída em desenvolvimento!")}>Saída</Button>
          </div>
        </header>

        <Card className="min-h-[500px] flex flex-col">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              {/* Input agora conectado ao estado searchTerm */}
              <input
                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:border-blue-500 transition-all"
                placeholder="Buscar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-400">Carregando dados...</div>
          ) : items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Package size={48} className="mb-2 opacity-20" />
              <p>Nenhum item no estoque.</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-2 opacity-20" />
              <p>Nenhum produto encontrado para "{searchTerm}".</p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-4">Produto</th>
                    <th className="p-4">Categoria</th>
                    <th className="p-4">Qtd</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-700">{item.name}</td>
                      <td className="p-4"><Badge>{item.classification || 'Geral'}</Badge></td>
                      <td className="p-4 font-bold">{item.quantity}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors" title="Excluir">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </main>

      {/* Modal de Cadastro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Nova Entrada</h2>
              <button onClick={() => setModalOpen(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome do Produto</label>
                <input name="name" className="w-full border border-slate-300 p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500" required autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantidade</label>
                  <input name="qtd" type="number" min="1" className="w-full border border-slate-300 p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Classificação</label>
                  <select name="classification" className="w-full border border-slate-300 p-2.5 rounded-lg mt-1 outline-none focus:border-blue-500">
                    <option>Medicamentos</option>
                    <option>Materiais</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="primary">Salvar Entrada</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}