import { useState, useEffect, useMemo } from 'react';
import { fiadoService } from '../../services/fiadoService';
import { 
  getTodayDateString, 
  addDaysToDateString, 
  centsToCurrency, 
  generateInstallments,
  formatDate 
} from '../../utils/formatters';
import Modal from '../ui/Modal';
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
  Sparkles,
  Info
} from 'lucide-react';

export default function NovoFiadoModal({ isOpen, onClose, onSuccess, initialClienteId = null }) {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // Form states
  const [clienteId, setClienteId] = useState(initialClienteId || '');
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

  // Carrega clientes para o seletor
  const carregarClientes = async () => {
    setLoadingClientes(true);
    try {
      const data = await fiadoService.getClientes();
      setClientes(data);
      if (initialClienteId) {
        setClienteId(initialClienteId);
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro', 'Não foi possível carregar a lista de clientes.');
    } finally {
      setLoadingClientes(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      carregarClientes();
      setDataCompra(getTodayDateString());
      setDataVencimento(addDaysToDateString(getTodayDateString(), 30));
      if (initialClienteId) {
        setClienteId(initialClienteId);
      }
    }
  }, [isOpen, initialClienteId]);

  // Cliente selecionado
  const clienteSelecionado = useMemo(() => {
    return clientes.find(c => c.id === clienteId) || null;
  }, [clientes, clienteId]);

  // Filtro de clientes na busca
  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente.trim()) return clientes;
    const term = buscaCliente.toLowerCase();
    return clientes.filter(c => 
      c.nome.toLowerCase().includes(term) || 
      (c.telefone && c.telefone.includes(term))
    );
  }, [clientes, buscaCliente]);

  // Geração de parcelas em tempo real
  const parcelasPrevia = useMemo(() => {
    if (!valorCentavos || valorCentavos <= 0) return [];
    const count = isParcelado ? Math.max(2, parseInt(totalParcelas, 10) || 2) : 1;
    return generateInstallments(valorCentavos, count, dataCompra, parseInt(intervaloDias, 10) || 30, dataVencimento);
  }, [valorCentavos, isParcelado, totalParcelas, dataCompra, intervaloDias, dataVencimento]);

  // Verificação de Limite de Crédito
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

      toast.success('Fiado Lançado!', `Novo lançamento de ${centsToCurrency(valorCentavos)} registrado com sucesso.`);
      
      // Limpa formulário
      setDescricao('');
      setValorCentavos(0);
      setIsParcelado(false);
      setTotalParcelas(2);
      setObservacoes('');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao Lançar Fiado', err.message || 'Ocorreu um erro ao salvar o registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Novo Fiado / Compra a Prazo"
      subtitle="Cadastre uma compra fiado com vencimento único ou parcelado."
      maxWidth="max-w-2xl"
      footer={
        <>
          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={submitting || !clienteId || valorCentavos <= 0}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-amber-200 transition-colors flex items-center gap-2"
          >
            {submitting ? 'Gravando...' : 'Confirmar e Salvar Fiado'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Seleção do Cliente */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-600" /> Cliente <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <div 
              className="w-full flex items-center justify-between p-2.5 border border-slate-300 rounded-lg bg-white cursor-pointer hover:border-amber-500 transition-all text-sm"
              onClick={() => setShowClienteDropdown(!showClienteDropdown)}
            >
              {clienteSelecionado ? (
                <div className="flex items-center justify-between w-full pr-2">
                  <span className="font-semibold text-slate-900">{clienteSelecionado.nome}</span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">{clienteSelecionado.telefone}</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium text-slate-700">
                      Saldo: {centsToCurrency(clienteSelecionado.saldo_devedor)}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-slate-400">Selecione um cliente cadastrado...</span>
              )}
            </div>

            {showClienteDropdown && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                  <Search className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Digite para filtrar cliente..."
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-hidden"
                    autoFocus
                  />
                </div>
                <div className="max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {clientesFiltrados.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">
                      Nenhum cliente encontrado.
                    </div>
                  ) : (
                    clientesFiltrados.map(c => (
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
                          <p className="font-medium text-slate-700">
                            Saldo: {centsToCurrency(c.saldo_devedor)}
                          </p>
                          {c.limite_credito ? (
                            <p className="text-[11px] text-slate-400">
                              Limite: {centsToCurrency(c.limite_credito)}
                            </p>
                          ) : (
                            <p className="text-[11px] text-slate-400">Sem limite</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ALERTA DE LIMITE DE CRÉDITO ULTRAPASSADO (Não bloqueia, apenas alerta) */}
        {limiteInfo && limiteInfo.ultrapassou && (
          <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-amber-950">
                Aviso: Este lançamento excederá o limite de crédito do cliente!
              </p>
              <p className="text-amber-800 leading-relaxed">
                Limite cadastrado: <strong>{centsToCurrency(limiteInfo.limite)}</strong> | 
                Saldo atual: <strong>{centsToCurrency(limiteInfo.saldoAtual)}</strong> | 
                Novo saldo final: <strong className="text-rose-700">{centsToCurrency(limiteInfo.novoSaldo)}</strong>
                {' '}(Excedente: <strong>{centsToCurrency(limiteInfo.excedente)}</strong>).
              </p>
              <p className="text-[11px] text-amber-700/90">
                * Conforme as regras da loja, você pode continuar e confirmar esta venda.
              </p>
            </div>
          </div>
        )}

        {/* Descrição e Valor */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Descrição da Compra / Peças <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Vestido estampado + Cinto de couro"
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

        {/* Datas da Compra e Primeiro Vencimento */}
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
                // Se a data de vencimento for anterior, atualiza
                if (dataVencimento < e.target.value) {
                  setDataVencimento(addDaysToDateString(e.target.value, 30));
                }
              }}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" /> Data de Vencimento {isParcelado ? '(1ª Parcela)' : ''} <span className="text-rose-500">*</span>
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

        {/* Opção de Parcelamento */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Deseja parcelar este fiado?</p>
                <p className="text-[11px] text-slate-500">Divide em parcelas com ajuste automático de centavos na última</p>
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
                    Número de Parcelas
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
                    Intervalo entre Parcelas
                  </label>
                  <select
                    value={intervaloDias}
                    onChange={(e) => setIntervaloDias(parseInt(e.target.value, 10))}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value={30}>Mensal (a cada 30 dias)</option>
                    <option value={15}>Quinzenal (a cada 15 dias)</option>
                    <option value={7}>Semanal (a cada 7 dias)</option>
                  </select>
                </div>
              </div>

              {/* Lista das parcelas calculadas */}
              {parcelasPrevia.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Cronograma Gerado ({parcelasPrevia.length} parcelas)</span>
                    <span className="text-[11px] text-amber-700 font-normal">
                      Soma total exata: {centsToCurrency(parcelasPrevia.reduce((a, b) => a + b.valor, 0))}
                    </span>
                  </p>
                  <div className="max-h-36 overflow-y-auto divide-y divide-slate-200 border border-slate-200 rounded-lg bg-white">
                    {parcelasPrevia.map(p => (
                      <div key={p.numero} className="px-3 py-2 text-xs flex items-center justify-between">
                        <span className="font-medium text-slate-800">
                          Parcela {p.numero}/{p.total}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">Vence em {formatDate(p.data_vencimento)}</span>
                          <span className="font-bold text-amber-800">{centsToCurrency(p.valor)}</span>
                          {p.numero === p.total && p.valor !== parcelasPrevia[0].valor && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-sm">
                              Ajuste centavos
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

        {/* Observações opcionais */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Observações Adicionais (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ex: Peças reservadas na arara, cliente retira amanhã"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        {/* Resumo Final antes de confirmar */}
        {clienteSelecionado && valorCentavos > 0 && (
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500">Resumo da operação:</p>
              <p className="font-semibold text-slate-900">
                {clienteSelecionado.nome} • {isParcelado ? `${totalParcelas}x de ${centsToCurrency(parcelasPrevia[0]?.valor || 0)}` : 'À vista no fiado'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Valor Total a Registrar</p>
              <p className="text-base font-bold text-slate-900">{centsToCurrency(valorCentavos)}</p>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
