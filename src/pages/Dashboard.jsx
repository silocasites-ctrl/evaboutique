import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, TrendingUp, PackageSearch, AlertCircle, CreditCard } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [caixa, setCaixa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showFecharModal, setShowFecharModal] = useState(false);
  const [valorAbertura, setValorAbertura] = useState('');
  const [valorFechamento, setValorFechamento] = useState('');

  const fetchCaixa = async () => {
    try {
      const res = await fetch('/api/caixa/status');
      const data = await res.json();
      setCaixa(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaixa();
  }, []);

  const handleAbrirCaixa = async (e) => {
    e.preventDefault();
    if (!valorAbertura) return;
    try {
      await fetch('/api/caixa/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_abertura: parseFloat(valorAbertura.replace(',', '.')) })
      });
      setValorAbertura('');
      setShowAbrirModal(false);
      fetchCaixa();
    } catch (err) {
      alert("Erro ao abrir caixa");
    }
  };

  const handleFecharCaixa = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/caixa/fechar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor_fechamento_informado: parseFloat(valorFechamento.replace(',', '.')) || 0 })
      });
      setValorFechamento('');
      setShowFecharModal(false);
      fetchCaixa();
    } catch (err) {
      alert("Erro ao fechar caixa");
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  if (loading) return <div className="page-container">Carregando...</div>;

  return (
    <>
      <header className="topbar">
        <div>
          {caixa ? (
            <span className="badge badge-success">Caixa Aberto</span>
          ) : (
            <span className="badge badge-danger">Caixa Fechado</span>
          )}
        </div>
        <div>
          {caixa ? (
            <button className="btn btn-danger" onClick={() => setShowFecharModal(true)}>Fechar Caixa</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setShowAbrirModal(true)}>Abrir Caixa</button>
          )}
        </div>
      </header>

      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">Bem-vindo(a) à Eva Boutique</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>O que você deseja fazer hoje?</p>
        </div>

        <div className="grid-4">
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/pdv')}>
            <Wallet size={40} color="var(--color-gold)" style={{ marginBottom: 16 }} />
            <h3>Nova Venda (PDV)</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Registrar uma venda no balcão</p>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/fiado')}>
            <CreditCard size={40} color="var(--color-gold)" style={{ marginBottom: 16 }} />
            <h3>Fiado / Crediário</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Clientes a prazo e cobranças</p>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/produtos')}>
            <PackageSearch size={40} color="var(--color-gold)" style={{ marginBottom: 16 }} />
            <h3>Consultar Produtos</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Ver e editar o estoque da loja</p>
          </div>
          <div className="card" style={{ cursor: 'pointer' }} onClick={() => navigate('/relatorios')}>
            <TrendingUp size={40} color="var(--color-gold)" style={{ marginBottom: 16 }} />
            <h3>Relatórios</h3>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Resultados e faturamento</p>
          </div>
        </div>

        {caixa && (
          <div className="card" style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Resumo do Caixa Atual</h3>
            <div className="grid-4">
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Valor de Abertura</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(caixa.valor_abertura)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Vendas Dinheiro</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(caixa.total_vendido_dinheiro)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Vendas Cartão/PIX</p>
                <p style={{ fontSize: 24, fontWeight: 600 }}>{formatCurrency(caixa.total_vendido_cartao + caixa.total_vendido_pix)}</p>
              </div>
              <div>
                <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Total Geral do Dia</p>
                <p style={{ fontSize: 24, fontWeight: 600, color: 'var(--color-success)' }}>{formatCurrency(caixa.total_geral)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Abrir Caixa */}
      {showAbrirModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Abrir Caixa do Dia</h2>
              <button className="btn btn-secondary" onClick={() => setShowAbrirModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAbrirCaixa}>
              <div className="input-group">
                <label>Valor em dinheiro no gaveteiro (Troco Inicial)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="input-control" 
                  value={valorAbertura} 
                  onChange={e => setValorAbertura(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Confirmar Abertura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Fechar Caixa */}
      {showFecharModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">Fechamento de Caixa</h2>
              <button className="btn btn-secondary" onClick={() => setShowFecharModal(false)}>✕</button>
            </div>
            
            <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8, marginBottom: 24 }}>
              <p><strong>Total esperado em dinheiro:</strong> {formatCurrency(caixa?.valor_abertura + caixa?.total_vendido_dinheiro)}</p>
              <p><strong>Total PIX:</strong> {formatCurrency(caixa?.total_vendido_pix)}</p>
              <p><strong>Total Cartão:</strong> {formatCurrency(caixa?.total_vendido_cartao)}</p>
            </div>

            <form onSubmit={handleFecharCaixa}>
              <div className="input-group">
                <label>Valor em dinheiro contado na gaveta (Conferência)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  className="input-control" 
                  value={valorFechamento} 
                  onChange={e => setValorFechamento(e.target.value)} 
                  required 
                  autoFocus
                />
              </div>
              
              {valorFechamento && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: 'var(--color-bg-main)', border: '1px solid #ddd' }}>
                  {(() => {
                    const esperado = (caixa?.valor_abertura || 0) + (caixa?.total_vendido_dinheiro || 0);
                    const informado = parseFloat(valorFechamento.replace(',', '.')) || 0;
                    const diferenca = informado - esperado;
                    if (Math.abs(diferenca) < 0.05) return <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Tudo certo! Sem diferenças.</span>;
                    if (diferenca > 0) return <span style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Sobra de {formatCurrency(diferenca)}</span>;
                    return <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>Falta de {formatCurrency(Math.abs(diferenca))}</span>;
                  })()}
                </div>
              )}

              <div style={{ display: 'flex', gap: 16, marginTop: 24 }}>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Confirmar Fechamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
