import { useState, useEffect } from 'react';
import { Plus, Edit2, Archive, ArchiveRestore } from 'lucide-react';

const CATEGORIAS = [
  "Calças Jeans", "Alfaiataria Slim", "Alfaiataria Plus Size", 
  "Moda Praia", "Fitness", "Maquiagens", "Acessórios", 
  "T-shirts", "Perfumaria"
];

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    categoria: CATEGORIAS[0],
    preco: '',
    quantidade_estoque: '',
    ativo: true
  });

  const fetchProdutos = async () => {
    try {
      const res = await fetch('/api/produtos');
      const data = await res.json();
      setProdutos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
      ...formData,
      preco: parseFloat(formData.preco.toString().replace(',', '.')),
      quantidade_estoque: parseInt(formData.quantidade_estoque, 10)
    };

    try {
      if (editingId) {
        await fetch(`/api/produtos/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await fetch('/api/produtos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      setShowModal(false);
      fetchProdutos();
    } catch (err) {
      alert("Erro ao salvar produto");
    }
  };

  const openNew = () => {
    setEditingId(null);
    setFormData({ nome: '', categoria: CATEGORIAS[0], preco: '', quantidade_estoque: '', ativo: true });
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setFormData({
      nome: p.nome,
      categoria: p.categoria,
      preco: p.preco,
      quantidade_estoque: p.quantidade_estoque,
      ativo: p.ativo === 1
    });
    setShowModal(true);
  };

  const toggleAtivo = async (p) => {
    try {
      const payload = { ...p, ativo: p.ativo === 1 ? 0 : 1 };
      await fetch(`/api/produtos/${p.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      fetchProdutos();
    } catch (err) {
      alert("Erro ao alterar status");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <>
      <header className="topbar">
        <h2>Gestão de Produtos</h2>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={18} /> Novo Produto
        </button>
      </header>

      <div className="page-container">
        {loading ? <p>Carregando...</p> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Nome do Produto</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Estoque</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(p => (
                  <tr key={p.id} style={{ opacity: p.ativo === 1 ? 1 : 0.6 }}>
                    <td style={{ fontWeight: 500 }}>{p.nome}</td>
                    <td>{p.categoria}</td>
                    <td>{formatCurrency(p.preco)}</td>
                    <td>
                      {p.quantidade_estoque === 0 ? (
                        <span className="badge badge-danger">Esgotado</span>
                      ) : (
                        p.quantidade_estoque
                      )}
                    </td>
                    <td>
                      {p.ativo === 1 ? (
                        <span className="badge badge-success">Ativo</span>
                      ) : (
                        <span className="badge badge-danger">Inativo</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '8px', marginRight: 8 }} onClick={() => openEdit(p)}>
                        <Edit2 size={16} />
                      </button>
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '8px' }} 
                        onClick={() => toggleAtivo(p)}
                        title={p.ativo === 1 ? "Inativar" : "Reativar"}
                      >
                        {p.ativo === 1 ? <Archive size={16} /> : <ArchiveRestore size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Nenhum produto cadastrado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Nome do Produto</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={formData.nome} 
                  onChange={e => setFormData({...formData, nome: e.target.value})} 
                  required 
                />
              </div>
              
              <div className="input-group">
                <label>Categoria</label>
                <select 
                  className="input-control" 
                  value={formData.categoria} 
                  onChange={e => setFormData({...formData, categoria: e.target.value})}
                  required
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Preço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    className="input-control" 
                    value={formData.preco} 
                    onChange={e => setFormData({...formData, preco: e.target.value})} 
                    required 
                  />
                </div>
                
                <div className="input-group">
                  <label>Quantidade em Estoque</label>
                  <input 
                    type="number" 
                    step="1" 
                    min="0"
                    className="input-control" 
                    value={formData.quantidade_estoque} 
                    onChange={e => setFormData({...formData, quantidade_estoque: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
