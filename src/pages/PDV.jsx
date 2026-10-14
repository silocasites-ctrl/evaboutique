import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Trash2, CheckCircle, XCircle } from 'lucide-react';

export default function PDV() {
  const [caixa, setCaixa] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  
  const [carrinho, setCarrinho] = useState([]);
  const [descontoTipo, setDescontoTipo] = useState('nenhum');
  const [descontoValor, setDescontoValor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('dinheiro');
  
  const fetchInitialData = async () => {
    try {
      const [caixaRes, prodRes] = await Promise.all([
        fetch('/api/caixa/status'),
        fetch('/api/produtos?ativos=true')
      ]);
      setCaixa(await caixaRes.json());
      setProdutos(await prodRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const produtosFiltrados = useMemo(() => {
    if (!busca) return produtos;
    return produtos.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.categoria.toLowerCase().includes(busca.toLowerCase()));
  }, [produtos, busca]);

  const addToCart = (produto) => {
    if (produto.quantidade_estoque <= 0) {
      if (!window.confirm("Atenção: Este produto está com estoque zerado. Deseja vendê-lo mesmo assim?")) {
        return;
      }
    }
    
    setCarrinho(prev => {
      const exist = prev.find(item => item.produto_id === produto.id);
      if (exist) {
        return prev.map(item => item.produto_id === produto.id ? { ...item, quantidade: item.quantidade + 1, subtotal_item: (item.quantidade + 1) * item.preco_unitario } : item);
      }
      return [...prev, {
        produto_id: produto.id,
        nome_produto: produto.nome,
        quantidade: 1,
        preco_unitario: produto.preco,
        subtotal_item: produto.preco
      }];
    });
  };

  const updateCartQty = (produtoId, delta) => {
    setCarrinho(prev => {
      return prev.map(item => {
        if (item.produto_id === produtoId) {
          const newQty = item.quantidade + delta;
          if (newQty <= 0) return item;
          return { ...item, quantidade: newQty, subtotal_item: newQty * item.preco_unitario };
        }
        return item;
      });
    });
  };

  const removeFromCart = (produtoId) => {
    setCarrinho(prev => prev.filter(item => item.produto_id !== produtoId));
  };

  const clearCart = () => {
    if(window.confirm("Tem certeza que deseja cancelar esta venda? O carrinho será limpo.")) {
      setCarrinho([]);
      setDescontoTipo('nenhum');
      setDescontoValor('');
    }
  };

  const subtotal = carrinho.reduce((acc, item) => acc + item.subtotal_item, 0);
  
  const descontoCalculado = useMemo(() => {
    if (descontoTipo === 'nenhum' || !descontoValor) return 0;
    const valor = parseFloat(descontoValor.toString().replace(',', '.')) || 0;
    if (descontoTipo === 'percentual') {
      return subtotal * (valor / 100);
    }
    return valor;
  }, [subtotal, descontoTipo, descontoValor]);

  const total = Math.max(0, subtotal - descontoCalculado);

  const finalizarVenda = async () => {
    if (!caixa) return alert("Abra o caixa primeiro antes de vender.");
    if (carrinho.length === 0) return alert("Carrinho vazio.");
    
    const payload = {
      subtotal,
      desconto_tipo: descontoTipo,
      desconto_valor: parseFloat(descontoValor.toString().replace(',', '.')) || 0,
      total,
      forma_pagamento: formaPagamento,
      itens: carrinho
    };

    try {
      const res = await fetch('/api/vendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        alert("Venda concluída com sucesso!");
        setCarrinho([]);
        setDescontoTipo('nenhum');
        setDescontoValor('');
        fetchInitialData(); // Atualiza estoque
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao finalizar venda.");
      }
    } catch (err) {
      alert("Erro na conexão");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (!caixa) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <XCircle size={64} color="var(--color-danger)" style={{ marginBottom: 16 }} />
        <h2>Caixa Fechado</h2>
        <p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Você precisa abrir o caixa no Dashboard antes de realizar vendas.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Coluna Esquerda: Produtos */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--color-bg-main)', borderRight: '1px solid #e0e0e0' }}>
        <div style={{ padding: '24px 32px', background: 'white', borderBottom: '1px solid #e0e0e0' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={20} color="var(--color-text-muted)" style={{ position: 'absolute', left: 16, top: 14 }} />
              <input 
                type="text" 
                className="input-control" 
                placeholder="Buscar produto por nome ou categoria..." 
                style={{ paddingLeft: 48, width: '100%', fontSize: 16 }}
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
          <div className="grid-3" style={{ gap: 16 }}>
            {produtosFiltrados.map(p => (
              <div 
                key={p.id} 
                className="card" 
                style={{ padding: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => addToCart(p)}
              >
                <div>
                  <h4 style={{ fontSize: 16, marginBottom: 4 }}>{p.nome}</h4>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.categoria}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontWeight: 600, color: 'var(--color-gold-dark)' }}>{formatCurrency(p.preco)}</span>
                  <span style={{ fontSize: 12, color: p.quantidade_estoque > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    Estoque: {p.quantidade_estoque}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Coluna Direita: Carrinho */}
      <div style={{ width: 450, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 16px rgba(0,0,0,0.05)', zIndex: 10 }}>
        <div style={{ padding: 24, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingCart color="var(--color-gold-dark)" />
          <h2 style={{ fontSize: 20 }}>Carrinho de Compra</h2>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          {carrinho.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: 40 }}>Nenhum item no carrinho.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {carrinho.map(item => (
                <div key={item.produto_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 16 }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: 15, marginBottom: 4 }}>{item.nome_produto}</h4>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>{formatCurrency(item.preco_unitario)} cada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e0e0e0', borderRadius: 4 }}>
                      <button style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateCartQty(item.produto_id, -1)}>-</button>
                      <span style={{ padding: '0 8px', fontWeight: 500 }}>{item.quantidade}</span>
                      <button style={{ padding: '4px 12px', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => updateCartQty(item.produto_id, 1)}>+</button>
                    </div>
                    <span style={{ fontWeight: 600, width: 80, textAlign: 'right' }}>{formatCurrency(item.subtotal_item)}</span>
                    <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} onClick={() => removeFromCart(item.produto_id)}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: 24, background: '#fafafa', borderTop: '1px solid #e0e0e0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
            <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
          </div>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <div className="input-group" style={{ flex: 1, margin: 0 }}>
              <select className="input-control" value={descontoTipo} onChange={e => setDescontoTipo(e.target.value)}>
                <option value="nenhum">Sem Desconto</option>
                <option value="percentual">Desconto (%)</option>
                <option value="valor_fixo">Desconto (R$)</option>
              </select>
            </div>
            {descontoTipo !== 'nenhum' && (
              <div className="input-group" style={{ width: 100, margin: 0 }}>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  placeholder="0.00"
                  className="input-control" 
                  value={descontoValor} 
                  onChange={e => setDescontoValor(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
            <span style={{ fontSize: 18, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-gold-dark)' }}>{formatCurrency(total)}</span>
          </div>

          <div className="input-group" style={{ marginBottom: 24 }}>
            <label>Forma de Pagamento</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {['dinheiro', 'pix', 'cartao'].map(fp => (
                <button 
                  key={fp}
                  className={`btn ${formaPagamento === fp ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, textTransform: 'capitalize' }}
                  onClick={() => setFormaPagamento(fp)}
                >
                  {fp === 'cartao' ? 'Cartão' : fp}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-secondary" style={{ flex: 1 }} onClick={clearCart}>Cancelar</button>
            <button className="btn btn-primary" style={{ flex: 2, background: 'var(--color-success)', color: 'white' }} onClick={finalizarVenda}>
              <CheckCircle size={20} /> Finalizar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
