import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { fiadoService } from '../../services/fiadoService';
import { 
  centsToCurrency, 
  formatDate, 
  buildWhatsAppLink, 
  formatPhone 
} from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import ClienteDrawer from './ClienteDrawer';
import { TableSkeleton } from '../ui/Skeleton';
import { 
  Search, 
  UserPlus, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  MessageSquare, 
  ChevronRight, 
  Eye, 
  Edit3, 
  PlusCircle, 
  Filter, 
  CheckCircle,
  CreditCard,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export default function FiadoClientes(props) {
  const navigate = useNavigate();
  const outletCtx = useOutletContext() || {};
  const onOpenNovoFiadoComCliente = props.onOpenNovoFiadoComCliente || outletCtx.onOpenNovoFiadoComCliente;
  const passedSearchRef = props.searchInputRef || outletCtx.searchInputRef;

  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros e busca
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos'); // 'todos', 'atrasado', 'vence_hoje', 'em_aberto', 'quitado'
  const [ocultarQuitados, setOcultarQuitados] = useState(false);

  // Ordenação
  const [sortField, setSortField] = useState('nome'); // 'nome', 'saldo_devedor', 'proximo_vencimento', 'status'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Drawer de edição/cadastro
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clienteParaEditar, setClienteParaEditar] = useState(null);

  const localSearchRef = useRef(null);
  const actualSearchRef = passedSearchRef || localSearchRef;

  const carregarClientes = async () => {
    setLoading(true);
    try {
      const data = await fiadoService.getClientes();
      setClientes(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Clientes filtrados e ordenados
  const clientesFiltrados = useMemo(() => {
    let result = [...clientes];

    // Busca textual
    if (busca.trim()) {
      const term = busca.toLowerCase().trim();
      result = result.filter(c => 
        c.nome.toLowerCase().includes(term) || 
        (c.telefone && c.telefone.toLowerCase().includes(term))
      );
    }

    // Filtro por status
    if (filtroStatus !== 'todos') {
      if (filtroStatus === 'atrasado') {
        result = result.filter(c => c.status === 'atrasado');
      } else if (filtroStatus === 'vence_hoje') {
        result = result.filter(c => c.status === 'vence_hoje');
      } else if (filtroStatus === 'em_aberto') {
        result = result.filter(c => c.status === 'em_aberto' || c.status === 'vence_em_breve' || c.status === 'parcialmente_pago');
      } else if (filtroStatus === 'quitado') {
        result = result.filter(c => c.status === 'quitado' || c.status === 'sem_debitos');
      }
    }

    // Toggle para ocultar quitados
    if (ocultarQuitados) {
      result = result.filter(c => c.saldo_devedor > 0);
    }

    // Ordenação
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'nome') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'saldo_devedor') {
        valA = valA || 0;
        valB = valB || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (sortField === 'proximo_vencimento') {
        valA = valA || '9999-99-99';
        valB = valB || '9999-99-99';
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      if (sortField === 'status') {
        valA = (a.status_label || '').toLowerCase();
        valB = (b.status_label || '').toLowerCase();
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      return 0;
    });

    return result;
  }, [clientes, busca, filtroStatus, ocultarQuitados, sortField, sortDirection]);

  // Ícone indicador de ordenação
  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 inline ml-1" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-3.5 h-3.5 text-amber-600 inline ml-1" />
      : <ArrowDown className="w-3.5 h-3.5 text-amber-600 inline ml-1" />;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Barra de Filtros e Ações de Topo */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Campo de Busca com atalho "/" */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            ref={actualSearchRef}
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou WhatsApp... (Pressione /)"
            className="w-full text-xs sm:text-sm pl-9 pr-14 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-100 text-[10px] font-mono text-slate-500">
            /
          </span>
        </div>

        {/* Filtros lado a lado */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status select */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value)}
              className="bg-transparent font-medium text-slate-700 outline-hidden cursor-pointer"
            >
              <option value="todos">Todos os status</option>
              <option value="atrasado">Atrasados</option>
              <option value="vence_hoje">Vence hoje</option>
              <option value="em_aberto">Em aberto</option>
              <option value="quitado">Quitados / Sem débitos</option>
            </select>
          </div>

          {/* Toggle ocultar quitados */}
          <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
            <input
              type="checkbox"
              checked={ocultarQuitados}
              onChange={(e) => setOcultarQuitados(e.target.checked)}
              className="rounded-sm text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
            />
            <span>Apenas com dívida ativa</span>
          </label>

          {/* Botão Novo Cliente (abre drawer) */}
          <button
            onClick={() => {
              setClienteParaEditar(null);
              setDrawerOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs shadow-amber-200 transition-colors ml-auto sm:ml-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : clientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <p className="text-base font-semibold text-slate-700 mb-1">Nenhum cliente encontrado</p>
            <p className="text-slate-400 mb-4">Tente ajustar os filtros ou a busca digitada.</p>
            <button
              onClick={() => { setBusca(''); setFiltroStatus('todos'); setOcultarQuitados(false); }}
              className="text-xs font-medium text-amber-700 underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 text-[11px]">
                <tr>
                  <th 
                    onClick={() => handleSort('nome')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group select-none"
                  >
                    Cliente {renderSortIndicator('nome')}
                  </th>
                  <th className="py-3 px-4">Telefone / WhatsApp</th>
                  <th 
                    onClick={() => handleSort('saldo_devedor')}
                    className="py-3 px-4 text-right cursor-pointer hover:bg-slate-100/80 transition-colors group select-none"
                  >
                    Saldo Devedor {renderSortIndicator('saldo_devedor')}
                  </th>
                  <th 
                    onClick={() => handleSort('proximo_vencimento')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group select-none"
                  >
                    Próximo Vencimento {renderSortIndicator('proximo_vencimento')}
                  </th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100/80 transition-colors group select-none"
                  >
                    Status {renderSortIndicator('status')}
                  </th>
                  <th className="py-3 px-4 text-center">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientesFiltrados.map((c) => {
                  const waLink = buildWhatsAppLink(c.nome, c.telefone, c.saldo_devedor, c.proximo_vencimento);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/fiado/clientes/${c.id}`)}
                      className="hover:bg-amber-50/20 transition-colors cursor-pointer group"
                    >
                      {/* Nome e observações */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                            {c.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 group-hover:text-amber-700 transition-colors">
                              {c.nome}
                            </p>
                            {c.limite_credito ? (
                              <p className="text-[11px] text-slate-400">
                                Limite: {centsToCurrency(c.limite_credito)} (Disp: {centsToCurrency(c.limite_disponivel)})
                              </p>
                            ) : (
                              <p className="text-[11px] text-slate-400">Sem limite definido</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Telefone */}
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {c.telefone ? formatPhone(c.telefone) : <span className="text-slate-400 font-sans italic">Não informado</span>}
                      </td>

                      {/* Saldo devedor */}
                      <td className="py-3.5 px-4 text-right">
                        <p className={`font-bold ${c.saldo_devedor > 0 ? 'text-slate-900' : 'text-slate-400'}`}>
                          {centsToCurrency(c.saldo_devedor)}
                        </p>
                        {c.total_pago > 0 && (
                          <p className="text-[10px] text-emerald-600">
                            Já pagou {centsToCurrency(c.total_pago)}
                          </p>
                        )}
                      </td>

                      {/* Próximo vencimento */}
                      <td className="py-3.5 px-4">
                        {c.proximo_vencimento ? (
                          <div>
                            <p className="font-medium text-slate-800">{formatDate(c.proximo_vencimento)}</p>
                            {c.dias_atraso > 0 && (
                              <span className="text-[10px] font-bold text-rose-600">
                                {c.dias_atraso}d de atraso
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge
                          status={c.status}
                          diasAtraso={c.dias_atraso}
                          label={c.status_label}
                        />
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Botão WhatsApp */}
                          {c.saldo_devedor > 0 && c.telefone && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              title="Cobrar via WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Botão Novo Fiado para este cliente */}
                          <button
                            onClick={() => {
                              if (onOpenNovoFiadoComCliente) {
                                onOpenNovoFiadoComCliente(c.id);
                              } else {
                                navigate(`/fiado/novo?clienteId=${c.id}`);
                              }
                            }}
                            className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                            title="Lançar novo fiado para este cliente"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={() => {
                              setClienteParaEditar(c);
                              setDrawerOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
                            title="Editar cadastro"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Botão Ver Detalhes */}
                          <button
                            onClick={() => navigate(`/fiado/clientes/${c.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Ver histórico e conta do cliente"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Rodapé da tabela com totais */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Exibindo <strong>{clientesFiltrados.length}</strong> de {clientes.length} clientes</span>
          <span className="font-semibold text-slate-700">
            Dívida consolidada da listagem: {centsToCurrency(clientesFiltrados.reduce((a, b) => a + b.saldo_devedor, 0))}
          </span>
        </div>
      </div>

      {/* Drawer de Cadastro / Edição do Cliente */}
      <ClienteDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cliente={clienteParaEditar}
        onSuccess={() => carregarClientes()}
      />
    </div>
  );
}
