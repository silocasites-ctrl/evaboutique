import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fiadoService } from '../../services/fiadoService';
import { 
  getTodayDateString, 
  addDaysToDateString, 
  centsToCurrency, 
  generateInstallments,
  formatDate 
} from '../../utils/formatters';
import CurrencyInput from '../ui/CurrencyInput';
import { useToast } from '../ui/ToastContext';
import { 
  User, 
  Calendar, 
  FileText, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Search,
  ArrowLeft,
  Sparkles,
  DollarSign
} from 'lucide-react';

export default function FiadoNovo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedClienteId = searchParams.get('clienteId') || '';
  const toast = useToast();

  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // Form states
  const [clienteId, setClienteId] = useState(preSelectedClienteId);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [valorCentavos, setValorCentavos] = useState(0);
  const [dataCompra, setDataCompra] = useState(getTodayDateString());
  const [dataVencimento, setDataVencimento] = useState(addDaysToDateString(getTodayDateString(), 30));
  
  // Parcelamento
  const [isParcelado, setIsParcelado] = useState(false);
  const [totalParcelas, setTotalParcelas] = useState(2);
  const [intervaloDias, setIntervaloDias] = useState(30);
  
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const data = await fiadoService.getClientes();
        setClientes(data);
        if (preSelectedClienteId) {
          setClienteId(preSelectedClienteId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingClientes(false);
      }
    }
    carregar();
  }, [preSelectedClienteId]);

  const clienteSelecionado = useMemo(() => {
    return clientes.find(c => c.id === clienteId) || null;
  }, [clientes, clienteId]);

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes;
    const term = buscaCliente.toLowerCase();
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(term) || 
      (c.telefone && c.telefone.includes(term))
    );
  }, [clientes, buscaCliente]);

  const parcelasPrevia = useMemo(() => {
    if (!valorCentavos || valorCentavos <= 0) return [];
    const count = isParcelado ? Math.max(2, parseInt(totalParcelas, 10) || 2) : 1;
    return generateInstallments(valorCentavos, count, dataCompra, parseInt(intervaloDias, 10) || 30, dataVencimento);
  }, [valorCentavos, isParcelado, totalParcelas, dataCompra, intervaloDias, dataVencimento]);

  const limiteInfo = useMemo(() => {
    if (!clienteSelecionado || !clienteSelecionado.limite_credito) return null;
    const limite = clienteSelecionado.limite_credito;
    const saldoAtual = clienteSelecionado.saldo_devedor || 0;
    const novoSaldo = saldoAtual + (valorCentavos || 0);
    const excedente = novoSaldo - limite;
    const ultrapassou = excedente > 0;

    return {
      limite,
      saldoAtual,
      novoSaldo,
      excedente,
      ultrapassou
    };
  }, [clienteSelecionado, valorCentavos]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!clienteId) {
      toast.error('Atenção', 'Selecione o cliente para o fiado.');
      return;
    }
    if (!descricao.trim()) {
      toast.error('Atenção', 'Informe a descrição da compra ou produtos.');
      return;
    }
    if (!valorCentavos || valorCentavos <= 0) {
      toast.error('Atenção', 'O valor total deve ser maior que zero.');
      return;
    }
    if (dataVencimento < dataCompra) {
      toast.error('Data Inválida', 'A data de vencimento não pode ser anterior à data da compra.');
      return;
    }

    setSubmitting(true);
    try {
      await fiadoService.createFiado({
        cliente_id: clienteId,
        descricao,
        valor_total: valorCentavos,
        data_compra: dataCompra,
        data_vencimento: dataVencimento,
        total_parcelas: isParcelado ? totalParcelas : 1,
        intervalo_dias: isParcelado ? intervaloDias : 30,
        observacoes
      });

      toast.success('Fiado Lançado!', `Novo lançamento de ${centsToCurrency(valorCentavos)} registrado.`);
      navigate(`/fiado/clientes/${clienteId}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao Lançar Fiado', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/fiado/clientes')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
        <span className="text-xs font-mono text-slate-400">Atalho global: tecla N</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Lançar Novo Fiado / Venda a Prazo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Selecione o cliente, defina os valores e as condições de parcelamento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Seleção de Cliente */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-600" /> Cliente <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div 
                className="w-full flex items-center justify-between p-3 border border-slate-300 rounded-lg bg-white cursor-pointer hover:border-amber-500 transition-all text-sm"
                onClick={() => setShowClienteDropdown(!showClienteDropdown)}
              >
                {clienteSelecionado ? (
                  <div className="flex items-center justify-between w-full pr-2">
                    <div>
                      <span className="font-semibold text-slate-900">{clienteSelecionado.nome}</span>
                      <span className="text-xs text-slate-500 ml-2">({clienteSelecionado.telefone})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700">
                        Saldo: {centsToCurrency(clienteSelecionado.saldo_devedor)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400">Clique para buscar e selecionar um cliente...</span>
                )}
              </div>

              {showClienteDropdown && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                  <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por nome ou telefone..."
                      value={buscaCliente}
                      onChange={(e) => setBuscaCliente(e.target.value)}
                      className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-hidden"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                    {clientesFiltrados.map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setClienteId(c.id);
                          setShowClienteDropdown(false);
                          setBuscaCliente('');
                        }}
                        className={`p-3 text-xs flex items-center justify-between cursor-pointer hover:bg-amber-50/60 transition-colors ${
                          c.id === clienteId ? 'bg-amber-50/80 font-medium' : ''
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-slate-800">{c.nome}</p>
                          <p className="text-slate-500">{c.telefone || 'Sem telefone'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-slate-700">Saldo: {centsToCurrency(c.saldo_devedor)}</p>
                          {c.limite_credito && (
                            <p className="text-[11px] text-slate-400">Limite: {centsToCurrency(c.limite_credito)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Banner de Aviso de Limite de Crédito (Não Bloqueia) */}
          {limiteInfo && limiteInfo.ultrapassou && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3 animate-in fade-in">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-amber-950">
                  Aviso: Este lançamento ultrapassará o limite de crédito do cliente!
                </p>
                <p className="text-amber-800 leading-relaxed">
                  Limite: <strong>{centsToCurrency(limiteInfo.limite)}</strong> | 
                  Saldo atual: <strong>{centsToCurrency(limiteInfo.saldoAtual)}</strong> | 
                  Novo saldo previsto: <strong className="text-rose-700">{centsToCurrency(limiteInfo.novoSaldo)}</strong>
                  {' '}(Excede por: <strong>{centsToCurrency(limiteInfo.excedente)}</strong>).
                </p>
                <p className="text-[11px] text-amber-700/80">
                  * A venda a prazo é permitida sem bloqueio conforme a política de relacionamento com o cliente.
                </p>
              </div>
            </div>
          )}

          {/* Descrição e Valor */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Descrição da Compra <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Vestido midi estampado + Bolsa transversal"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Valor Total <span className="text-rose-500">*</span>
              </label>
              <CurrencyInput
                valueInCents={valorCentavos}
                onChangeCents={setValorCentavos}
                required
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data da Compra
              </label>
              <input
                type="date"
                value={dataCompra}
                onChange={(e) => {
                  setDataCompra(e.target.value);
                  if (dataVencimento < e.target.value) {
                    setDataVencimento(addDaysToDateString(e.target.value, 30));
                  }
                }}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" /> Vencimento {isParcelado ? '(1ª Parcela)' : ''} <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                min={dataCompra}
                value={dataVencimento}
                onChange={(e) => setDataVencimento(e.target.value)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-medium"
              />
            </div>
          </div>

          {/* Parcelamento */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xs font-semibold text-slate-800">Opção de Parcelamento</p>
                  <p className="text-[11px] text-slate-500">Divide automaticamente com ajuste de centavos na última parcela</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isParcelado}
                  onChange={(e) => setIsParcelado(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {isParcelado && (
              <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-4 animate-in fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Quantidade de Parcelas
                    </label>
                    <select
                      value={totalParcelas}
                      onChange={(e) => setTotalParcelas(parseInt(e.target.value, 10))}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    >
                      {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                        <option key={n} value={n}>{n}x parcelas</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Intervalo de Dias
                    </label>
                    <select
                      value={intervaloDias}
                      onChange={(e) => setIntervaloDias(parseInt(e.target.value, 10))}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value={30}>Mensal (30 dias)</option>
                      <option value={15}>Quinzenal (15 dias)</option>
                      <option value={7}>Semanal (7 dias)</option>
                    </select>
                  </div>
                </div>

                {parcelasPrevia.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                      <span>Cronograma das Parcelas</span>
                      <span className="text-[11px] text-amber-700 font-normal">
                        Total exato: {centsToCurrency(parcelasPrevia.reduce((a, b) => a + b.valor, 0))}
                      </span>
                    </p>
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                      {parcelasPrevia.map(p => (
                        <div key={p.numero} className="px-3.5 py-2.5 text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-800">
                            Parcela {p.numero} de {p.total}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className="text-slate-500">Vence em {formatDate(p.data_vencimento)}</span>
                            <span className="font-bold text-amber-800">{centsToCurrency(p.valor)}</span>
                            {p.numero === p.total && p.valor !== parcelasPrevia[0].valor && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">
                                Ajuste de centavos
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Observações Adicionais (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Peças para evento especial"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Resumo e Botões de Submissão */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Resumo antes de confirmar:</p>
              <p className="text-sm font-semibold text-slate-900">
                {clienteSelecionado ? clienteSelecionado.nome : 'Cliente não selecionado'} • {valorCentavos > 0 ? centsToCurrency(valorCentavos) : 'R$ 0,00'}
                {isParcelado && ` em ${totalParcelas}x`}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/fiado/clientes')}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !clienteId || valorCentavos <= 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-amber-200 transition-colors"
              >
                {submitting ? 'Gravando...' : 'Confirmar e Salvar Fiado'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
