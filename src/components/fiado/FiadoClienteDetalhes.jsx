import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fiadoService } from '../../services/fiadoService';
import { 
  centsToCurrency, 
  formatDate, 
  formatDateTime, 
  buildWhatsAppLink, 
  formatPhone 
} from '../../utils/formatters';
import StatusBadge from '../ui/StatusBadge';
import RegistrarPagamentoModal from './RegistrarPagamentoModal';
import NovoFiadoModal from './NovoFiadoModal';
import ClienteDrawer from './ClienteDrawer';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../ui/ToastContext';
import { 
  ArrowLeft, 
  MessageSquare, 
  PlusCircle, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Layers, 
  Edit3, 
  Trash2, 
  Ban, 
  CreditCard, 
  Banknote, 
  QrCode, 
  History,
  TrendingDown,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

export default function FiadoClienteDetalhes() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'fiados'

  // Modais
  const [pagamentoModalOpen, setPagamentoModalOpen] = useState(false);
  const [novoFiadoModalOpen, setNovoFiadoModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Confirmação de cancelamento de fiado
  const [confirmCancelModalOpen, setConfirmCancelModalOpen] = useState(false);
  const [fiadoParaCancelar, setFiadoParaCancelar] = useState(null);
  const [canceling, setCanceling] = useState(false);

  const carregarCliente = async () => {
    setLoading(true);
    try {
      const data = await fiadoService.getClienteById(id);
      if (!data) {
        toast.error('Não encontrado', 'Cliente não localizado.');
        navigate('/fiado/clientes');
        return;
      }
      setCliente(data);
    } catch (err) {
      console.error(err);
      toast.error('Erro', 'Falha ao carregar dados do cliente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      carregarCliente();
    }
  }, [id]);

  const handleCancelarFiado = async () => {
    if (!fiadoParaCancelar) return;
    setCanceling(true);
    try {
      await fiadoService.cancelFiado(fiadoParaCancelar.id, 'Cancelado pelo operador');
      toast.info('Fiado Cancelado', 'O fiado foi marcado como cancelado. O histórico foi mantido.');
      setConfirmCancelModalOpen(false);
      setFiadoParaCancelar(null);
      carregarCliente();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao Cancelar', err.message);
    } finally {
      setCanceling(false);
    }
  };

  if (loading || !cliente) {
    return (
      <div className="p-8 text-center text-slate-500 space-y-4">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">Carregando ficha e histórico do cliente...</p>
      </div>
    );
  }

  const waLink = buildWhatsAppLink(
    cliente.nome,
    cliente.telefone,
    cliente.saldo_devedor,
    cliente.proximo_vencimento
  );

  // Porcentagem de utilização de limite
  const percentLimiteUtilizado = cliente.limite_credito && cliente.limite_credito > 0
    ? Math.min(100, Math.round((cliente.saldo_devedor / cliente.limite_credito) * 100))
    : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Botão Voltar e Ações Principais */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/fiado/clientes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Clientes</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Botão Cobrar no WhatsApp com mensagem pronta */}
          {cliente.saldo_devedor > 0 && cliente.telefone && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>Cobrar no WhatsApp</span>
            </a>
          )}

          {/* Botão Registrar Pagamento */}
          {cliente.saldo_devedor > 0 && (
            <button
              onClick={() => setPagamentoModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs shadow-emerald-200 transition-colors"
            >
              <DollarSign className="w-4 h-4" />
              <span>Registrar Pagamento</span>
            </button>
          )}

          {/* Botão Novo Fiado para este cliente */}
          <button
            onClick={() => setNovoFiadoModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs shadow-amber-200 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Fiado</span>
          </button>

          {/* Botão Editar Cadastro */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors"
            title="Editar dados cadastrais"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CABEÇALHO DO CLIENTE & CARDS DE RESUMO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100/70 border border-amber-300 flex items-center justify-center font-bold text-amber-900 text-xl shrink-0">
              {cliente.nome.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900">{cliente.nome}</h1>
                <StatusBadge
                  status={cliente.status}
                  diasAtraso={cliente.dias_atraso}
                  label={cliente.status_label}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                <span>WhatsApp: <strong>{cliente.telefone ? formatPhone(cliente.telefone) : 'Não informado'}</strong></span>
                {cliente.proximo_vencimento && (
                  <span>• Próximo vencimento: <strong className="text-slate-700">{formatDate(cliente.proximo_vencimento)}</strong></span>
                )}
              </p>
              {cliente.observacoes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-2 border border-slate-100 max-w-xl">
                  📝 {cliente.observacoes}
                </p>
              )}
            </div>
          </div>

          {/* Medidor de Limite de Crédito se houver */}
          {cliente.limite_credito ? (
            <div className="w-full lg:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-500 font-medium">Limite de Crédito</span>
                <span className="font-bold text-slate-900">{centsToCurrency(cliente.limite_credito)}</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  style={{ width: `${percentLimiteUtilizado}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${
                    percentLimiteUtilizado > 90
                      ? 'bg-rose-500'
                      : percentLimiteUtilizado > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] mt-1.5 text-slate-500">
                <span>{percentLimiteUtilizado}% utilizado</span>
                <span className={cliente.limite_disponivel === 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-semibold'}>
                  {centsToCurrency(cliente.limite_disponivel)} disponível
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 bg-slate-50 px-4 py-3 rounded-xl border border-dashed border-slate-200">
              Nenhum limite de crédito estipulado.
            </div>
          )}
        </div>

        {/* 3 Métricas Obrigatórias: Saldo Devedor, Total já Pago, Quantidade de Fiados em Aberto */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Saldo Devedor Total
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {centsToCurrency(cliente.saldo_devedor)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Valor pendente de amortização
            </p>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Já Pago
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {centsToCurrency(cliente.total_pago)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Acumulado de recebimentos
            </p>
          </div>

          <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fiados em Aberto
            </p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {cliente.quantidade_fiados_abertos}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {cliente.fiados.length} compras no histórico total
            </p>
          </div>
        </div>
      </div>

      {/* ABAS DE NAVEGAÇÃO: LINHA DO TEMPO vs LISTA DE FIADOS DETALHADA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50/50">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'timeline'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Linha do Tempo (Compras e Pagamentos)
          </button>
          <button
            onClick={() => setActiveTab('fiados')}
            className={`pb-3 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'fiados'
                ? 'border-amber-600 text-amber-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            Fiados & Parcelas ({cliente.fiados.length})
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: LINHA DO TEMPO CRONOLÓGICA */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              {cliente.timeline.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  Nenhuma movimentação registrada para este cliente.
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {cliente.timeline.map((item, idx) => {
                    const isCompra = item.tipo === 'compra';
                    const isCancelado = item.status === 'cancelado';

                    return (
                      <div key={idx} className="relative group">
                        {/* Ponto / Ícone no eixo */}
                        <div
                          className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white ${
                            isCancelado
                              ? 'bg-slate-300 text-slate-600'
                              : isCompra
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-500 text-white'
                          }`}
                        >
                          {isCompra ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                        </div>

                        {/* Card do evento na linha do tempo */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          isCancelado
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : isCompra
                            ? 'bg-white border-slate-200 shadow-2xs hover:border-amber-200'
                            : 'bg-emerald-50/30 border-emerald-200 shadow-2xs'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-500">
                                  {formatDate(item.data)}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  isCancelado
                                    ? 'bg-slate-200 text-slate-600 line-through'
                                    : isCompra
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {isCompra ? 'Compra a Prazo' : 'Pagamento'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-slate-900 mt-1">
                                {item.titulo}
                              </h4>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {item.detalhes}
                              </p>
                            </div>

                            <div className="text-right sm:self-center">
                              <p className={`text-base font-bold ${
                                isCancelado
                                  ? 'text-slate-400 line-through'
                                  : isCompra
                                  ? 'text-slate-900'
                                  : 'text-emerald-600'
                              }`}>
                                {isCompra ? `+ ${centsToCurrency(item.valor)}` : `- ${centsToCurrency(item.valor)}`}
                              </p>
                            </div>
                          </div>

                          {/* Se for pagamento com alocações detalhadas */}
                          {!isCompra && item.objeto.alocacoes && item.objeto.alocacoes.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                              <p className="font-semibold text-emerald-950">Amortizações aplicadas nas parcelas:</p>
                              {item.objeto.alocacoes.map((aloc, aIdx) => (
                                <p key={aIdx} className="text-emerald-800 pl-2 border-l-2 border-emerald-400">
                                  • Parcela {aloc.numero_parcela}: abateu <strong>{centsToCurrency(aloc.valor_abatido)}</strong>
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FIADOS E PARCELAS DETALHADAS */}
          {activeTab === 'fiados' && (
            <div className="space-y-6">
              {cliente.fiados.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500">
                  Nenhum fiado lançado para este cliente ainda.
                </div>
              ) : (
                cliente.fiados.map((fiado) => {
                  const isCancelado = fiado.status === 'cancelado';

                  return (
                    <div
                      key={fiado.id}
                      className={`rounded-xl border transition-all ${
                        isCancelado
                          ? 'bg-slate-50 border-slate-200 opacity-60'
                          : 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
                      }`}
                    >
                      {/* Topo do Fiado */}
                      <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-sm font-bold ${isCancelado ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                              {fiado.descricao}
                            </h3>
                            <StatusBadge
                              status={fiado.status_calculado}
                              size="sm"
                            />
                            {isCancelado && (
                              <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-sm">
                                Cancelado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Compra em {formatDate(fiado.data_compra)} • {fiado.total_parcelas} parcela(s)
                            {fiado.observacoes && ` • Obs: ${fiado.observacoes}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">Valor Total</p>
                            <p className="text-sm font-bold text-slate-900">{centsToCurrency(fiado.valor_total)}</p>
                            {fiado.saldo_devedor > 0 && !isCancelado && (
                              <p className="text-[11px] font-semibold text-rose-600">
                                Resta {centsToCurrency(fiado.saldo_devedor)}
                              </p>
                            )}
                          </div>

                          {!isCancelado && (
                            <button
                              onClick={() => {
                                setFiadoParaCancelar(fiado);
                                setConfirmCancelModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Cancelar este fiado (mantém histórico)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Tabela de Parcelas deste Fiado */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-50/40 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[10px]">
                            <tr>
                              <th className="py-2.5 px-4">Parcela</th>
                              <th className="py-2.5 px-4">Vencimento</th>
                              <th className="py-2.5 px-4">Valor</th>
                              <th className="py-2.5 px-4">Pago</th>
                              <th className="py-2.5 px-4">Saldo Restante</th>
                              <th className="py-2.5 px-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {fiado.parcelas.map((parc) => (
                              <tr key={parc.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-2.5 px-4 font-semibold text-slate-800">
                                  {parc.numero_parcela}/{parc.total_parcelas}
                                </td>
                                <td className="py-2.5 px-4 text-slate-600">
                                  {formatDate(parc.data_vencimento)}
                                </td>
                                <td className="py-2.5 px-4 font-medium text-slate-900">
                                  {centsToCurrency(parc.valor)}
                                </td>
                                <td className="py-2.5 px-4 font-medium text-emerald-600">
                                  {centsToCurrency(parc.valor_pago)}
                                </td>
                                <td className="py-2.5 px-4 font-bold text-slate-800">
                                  {centsToCurrency(parc.saldo_restante)}
                                </td>
                                <td className="py-2.5 px-4">
                                  <StatusBadge
                                    status={parc.status_calculado}
                                    diasAtraso={parc.dias_diferenca < 0 ? Math.abs(parc.dias_diferenca) : 0}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Registrar Pagamento */}
      <RegistrarPagamentoModal
        isOpen={pagamentoModalOpen}
        onClose={() => setPagamentoModalOpen(false)}
        cliente={cliente}
        onSuccess={() => carregarCliente()}
      />

      {/* MODAL: Novo Fiado */}
      <NovoFiadoModal
        isOpen={novoFiadoModalOpen}
        onClose={() => setNovoFiadoModalOpen(false)}
        initialClienteId={cliente.id}
        onSuccess={() => carregarCliente()}
      />

      {/* DRAWER: Editar Cliente */}
      <ClienteDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        cliente={cliente}
        onSuccess={() => carregarCliente()}
      />

      {/* DIÁLOGO: Confirmar Cancelamento de Fiado */}
      <ConfirmDialog
        isOpen={confirmCancelModalOpen}
        onClose={() => {
          setConfirmCancelModalOpen(false);
          setFiadoParaCancelar(null);
        }}
        onConfirm={handleCancelarFiado}
        title="Cancelar Lançamento de Fiado"
        message={
          fiadoParaCancelar
            ? `Tem certeza que deseja cancelar o fiado "${fiadoParaCancelar.descricao}" de ${centsToCurrency(fiadoParaCancelar.valor_total)}?\n\nConforme as regras do sistema, ele não será excluído definitivamente para preservar o histórico contábil, mas deixará de computar saldo devedor.`
            : ''
        }
        confirmLabel="Sim, Cancelar Fiado"
        loading={canceling}
      />
    </div>
  );
}
