import { useState, useEffect, useMemo } from 'react';
import { Ban, Eye } from 'lucide-react';

export default function Relatorios() {
  const [vendas, setVendas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVenda, setModalVenda] = useState(null);

  // Filtros
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todas');
  const [filtroPagamento, setFiltroPagamento] = useState('todas');

  const fetchVendas = async () => {
    try {
      const res = await fetch('/api/vendas');
      const data = await res.json();
      setVendas(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendas();
    
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    setFiltroDataInicio(firstDay);
    setFiltroDataFim(lastDay);
  }, []);

  const vendasFiltradas = useMemo(() => {
    return vendas.filter(v => {
      const dataVenda = v.data_hora.split(' ')[0];
      
      let passData = true;
      if (filtroDataInicio && dataVenda < filtroDataInicio) passData = false;
      if (filtroDataFim && dataVenda > filtroDataFim) passData = false;
      
      let passStatus = true;
      if (filtroStatus !== 'todas' && v.status !== filtroStatus) passStatus = false;
      
      let passPagamento = true;
      if (filtroPagamento !== 'todas' && v.forma_pagamento !== filtroPagamento) passPagamento = false;
      
      return passData && passStatus && passPagamento;
    });
  }, [vendas, filtroDataInicio, filtroDataFim, filtroStatus, filtroPagamento]);

  const metricas = useMemo(() => {
    const vendasValidas = vendasFiltradas.filter(v => v.status === 'concluida');
    const faturamento = vendasValidas.reduce((acc, v) => acc + v.total, 0);
    const qtde = vendasValidas.length;
    const ticketMedio = qtde > 0 ? faturamento / qtde : 0;
    
    const porPagamento = vendasValidas.reduce((acc, v) => {
      acc[v.forma_pagamento] = (acc[v.forma_pagamento] || 0) + v.total;
      return acc;
    }, { dinheiro: 0, pix: 0, cartao: 0 });
    
    return { faturamento, qtde, ticketMedio, porPagamento };
  }, [vendasFiltradas]);

  const handleCancelarVenda = async (id) => {
    if (!window.confirm("Atenção: Cancelar esta venda irá estornar os produtos para o estoque. Deseja continuar?")) return;
    try {
      const res = await fetch(`/api/vendas/${id}/cancelar`, { method: 'POST' });
      if (res.ok) {
        alert("Venda cancelada com sucesso!");
        fetchVendas();
        setModalVenda(null);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao cancelar");
      }
    } catch (err) {
      alert("Erro na requisição");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  return (
    <>
      <header className="topbar">
        <h2>Histórico e Relatórios</h2>
      </header>

      <div className="page-container">
        
        {/* Painel de Filtros */}
        <div className="card" style={{ marginBottom: 32, display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <label>Data Início</label>
            <input type="date" className="input-control" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <label>Data Fim</label>
            <input type="date" className="input-control" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} />
          </div>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <label>Status</label>
            <select className="input-control" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="todas">Todas</option>
              <option value="concluida">Concluídas</option>
              <option value="cancelada">Canceladas</option>
            </select>
          </div>
          <div className="input-group" style={{ flex: 1, margin: 0 }}>
            <label>Pagamento</label>
            <select className="input-control" value={filtroPagamento} onChange={e => setFiltroPagamento(e.target.value)}>
              <option value="todas">Todos</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
        </div>

        {/* Resumo de Métricas (apenas vendas concluídas) */}
        <div className="grid-4" style={{ marginBottom: 32 }}>
          <div className="card">
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Faturamento Total</h4>
            <p style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-success)' }}>{formatCurrency(metricas.faturamento)}</p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Total em Dinheiro</h4>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(metricas.porPagamento.dinheiro)}</p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Total PIX / Cartão</h4>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(metricas.porPagamento.pix + metricas.porPagamento.cartao)}</p>
          </div>
          <div className="card">
            <h4 style={{ color: 'var(--color-text-muted)', fontSize: 14, marginBottom: 8 }}>Ticket Médio</h4>
            <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(metricas.ticketMedio)}</p>
          </div>
        </div>

        {/* Tabela de Histórico */}
        <div className="table-wrapper">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: 18 }}>Histórico de Vendas ({vendasFiltradas.length})</h3>
          </div>
          {loading ? <p style={{ padding: 24 }}>Carregando...</p> : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data/Hora</th>
                  <th>Total</th>
                  <th>Pagamento</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map(v => (
                  <tr key={v.id} style={{ opacity: v.status === 'cancelada' ? 0.6 : 1 }}>
                    <td style={{ fontWeight: 500 }}>#{v.id}</td>
                    <td>{formatDate(v.data_hora)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.total)}</td>
                    <td style={{ textTransform: 'capitalize' }}>{v.forma_pagamento === 'cartao' ? 'Cartão' : v.forma_pagamento}</td>
                    <td>
                      {v.status === 'concluida' ? (
                        <span className="badge badge-success">Concluída</span>
                      ) : (
                        <span className="badge badge-danger">Cancelada</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '8px' }} onClick={() => setModalVenda(v)}>
                        <Eye size={16} /> Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
                {vendasFiltradas.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: 32 }}>Nenhuma venda encontrada no período.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Detalhes da Venda */}
      {modalVenda && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2 className="modal-title">Detalhes da Venda #{modalVenda.id}</h2>
              <button className="btn btn-secondary" onClick={() => setModalVenda(null)}>✕</button>
            </div>
            
            <div style={{ marginBottom: 24, display: 'flex', gap: 32 }}>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Data/Hora</p>
                <p style={{ fontWeight: 500 }}>{formatDate(modalVenda.data_hora)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Pagamento</p>
                <p style={{ fontWeight: 500, textTransform: 'capitalize' }}>{modalVenda.forma_pagamento}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Status</p>
                {modalVenda.status === 'concluida' ? (
                  <span className="badge badge-success">Concluída</span>
                ) : (
                  <span className="badge badge-danger">Cancelada</span>
                )}
              </div>
            </div>

            <h4 style={{ marginBottom: 12 }}>Itens da Venda</h4>
            <div style={{ background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 24 }}>
              {modalVenda.itens?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px dashed #ddd', paddingBottom: 8 }}>
                  <span>{item.quantidade}x {item.nome_produto}</span>
                  <span style={{ fontWeight: 500 }}>{formatCurrency(item.subtotal_item)}</span>
                </div>
              ))}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                <span>{formatCurrency(modalVenda.subtotal)}</span>
              </div>
              {modalVenda.desconto_valor > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'var(--color-danger)' }}>
                  <span>Desconto ({modalVenda.desconto_tipo === 'percentual' ? '%' : 'R$'})</span>
                  <span>- {formatCurrency(modalVenda.desconto_tipo === 'percentual' ? (modalVenda.subtotal * modalVenda.desconto_valor / 100) : modalVenda.desconto_valor)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0', fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ color: 'var(--color-gold-dark)' }}>{formatCurrency(modalVenda.total)}</span>
              </div>
            </div>

            {modalVenda.status === 'concluida' && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                <button className="btn btn-danger" onClick={() => handleCancelarVenda(modalVenda.id)}>
                  <Ban size={18} /> Cancelar Esta Venda
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
