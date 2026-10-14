import { useState, useEffect, useMemo } from 'react';
import { fiadoService } from '../../services/fiadoService';
import { 
  getTodayDateString, 
  centsToCurrency, 
  formatDate 
} from '../../utils/formatters';
import Modal from '../ui/Modal';
import CurrencyInput from '../ui/CurrencyInput';
import { useToast } from '../ui/ToastContext';
import { 
  Banknote, 
  QrCode, 
  CreditCard, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Sparkles
} from 'lucide-react';

export default function RegistrarPagamentoModal({ 
  isOpen, 
  onClose, 
  cliente, 
  onSuccess 
}) {
  const toast = useToast();

  const [valorCentavos, setValorCentavos] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState('pix');
  const [dataPagamento, setDataPagamento] = useState(getTodayDateString());
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const saldoDevedor = cliente ? cliente.saldo_devedor : 0;

  // Carrega parcelas pendentes do cliente para pré-visualização FIFO
  const parcelasPendentes = useMemo(() => {
    if (!cliente || !cliente.parcelas) return [];
    return cliente.parcelas
      .filter(p => p.saldo_restante > 0 && p.status_calculado !== 'cancelado')
      .sort((a, b) => {
        if (a.data_vencimento !== b.data_vencimento) {
          return a.data_vencimento.localeCompare(b.data_vencimento);
        }
        return a.numero_parcela - b.numero_parcela;
      });
  }, [cliente]);

  // Pré-visualização FIFO da amortização em tempo real
  const simulacaoAmortizacao = useMemo(() => {
    if (!valorCentavos || valorCentavos <= 0) return [];
    let restante = valorCentavos;
    const sim = [];

    for (const p of parcelasPendentes) {
      if (restante <= 0) break;
      const devido = p.saldo_restante;
      const abatido = Math.min(restante, devido);
      const quitado = abatido === devido;

      sim.push({
        id: p.id,
        numero: p.numero_parcela,
        total: p.total_parcelas,
        descricao: p.parent_descricao,
        vencimento: p.data_vencimento,
        valorOriginal: p.valor,
        devidoAntes: devido,
        abatido,
        saldoRestanteApos: devido - abatido,
        quitado
      });

      restante -= abatido;
    }

    return sim;
  }, [valorCentavos, parcelasPendentes]);

  // Atalhos rápidos de valores
  const handleSetValorTotal = () => {
    setValorCentavos(saldoDevedor);
  };

  const handleSetValorPrimeiraParcela = () => {
    if (parcelasPendentes.length > 0) {
      setValorCentavos(parcelasPendentes[0].saldo_restante);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setDataPagamento(getTodayDateString());
      setObservacao('');
      // Sugere o valor da primeira parcela pendente ou total
      if (parcelasPendentes.length > 0) {
        setValorCentavos(parcelasPendentes[0].saldo_restante);
      } else {
        setValorCentavos(saldoDevedor);
      }
    }
  }, [isOpen, cliente, parcelasPendentes, saldoDevedor]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!valorCentavos || valorCentavos <= 0) {
      toast.error('Valor Inválido', 'Informe um valor maior que zero.');
      return;
    }

    if (valorCentavos > saldoDevedor) {
      toast.error(
        'Valor Acima do Saldo',
        `O valor do pagamento (${centsToCurrency(valorCentavos)}) não pode ser superior ao saldo devedor atual (${centsToCurrency(saldoDevedor)}).`
      );
      return;
    }

    setSubmitting(true);
    try {
      await fiadoService.registrarPagamento({
        cliente_id: cliente.id,
        valor: valorCentavos,
        forma_pagamento: formaPagamento,
        data_pagamento: dataPagamento,
        observacao
      });

      toast.success(
        'Pagamento Registrado!',
        `Recebimento de ${centsToCurrency(valorCentavos)} registrado e amortizado com sucesso.`
      );

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro no Pagamento', err.message || 'Falha ao registrar recebimento.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cliente) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Pagamento"
      subtitle={`Abatimento de débito para o cliente ${cliente.nome}`}
      maxWidth="max-w-xl"
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
            disabled={submitting || valorCentavos <= 0 || valorCentavos > saldoDevedor}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-emerald-200 transition-colors flex items-center gap-2"
          >
            {submitting ? 'Processando...' : `Confirmar Recebimento de ${centsToCurrency(valorCentavos)}`}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Banner do Saldo Atual do Cliente */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Cliente</p>
            <p className="text-sm font-bold text-slate-900">{cliente.nome}</p>
            <p className="text-xs text-slate-500">{cliente.telefone || 'Sem telefone'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-medium">Saldo Devedor Total</p>
            <p className="text-lg font-bold text-rose-600">{centsToCurrency(saldoDevedor)}</p>
          </div>
        </div>

        {/* Campo do Valor do Pagamento e Atalhos */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Valor do Pagamento <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              {parcelasPendentes.length > 0 && parcelasPendentes[0].saldo_restante !== saldoDevedor && (
                <button
                  type="button"
                  onClick={handleSetValorPrimeiraParcela}
                  className="text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md transition-colors"
                >
                  1ª Parcela ({centsToCurrency(parcelasPendentes[0].saldo_restante)})
                </button>
              )}
              <button
                type="button"
                onClick={handleSetValorTotal}
                className="text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md transition-colors"
              >
                Quitar Tudo ({centsToCurrency(saldoDevedor)})
              </button>
            </div>
          </div>
          <CurrencyInput
            valueInCents={valorCentavos}
            onChangeCents={setValorCentavos}
            required
          />
          {valorCentavos > saldoDevedor && (
            <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              O pagamento não pode ultrapassar o saldo devedor ({centsToCurrency(saldoDevedor)}).
            </p>
          )}
        </div>

        {/* Forma de Pagamento */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            Forma de Pagamento
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'pix', label: 'PIX', Icon: QrCode },
              { id: 'dinheiro', label: 'Dinheiro', Icon: Banknote },
              { id: 'cartao', label: 'Cartão', Icon: CreditCard },
            ].map(({ id, label, Icon }) => {
              const selected = formaPagamento === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFormaPagamento(id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    selected
                      ? 'border-amber-600 bg-amber-50/80 text-amber-900 shadow-xs ring-1 ring-amber-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-1 ${selected ? 'text-amber-600' : 'text-slate-500'}`} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Data e Observação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" /> Data do Pagamento
            </label>
            <input
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Observação (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Comprovante enviado no WhatsApp"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>

        {/* REGRA FIFO: Pré-visualização da distribuição nas parcelas mais antigas */}
        {simulacaoAmortizacao.length > 0 && (
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" /> Amortização Automática (Mais antigas primeiro)
              </span>
              <span className="text-[11px] text-blue-700">
                Novo saldo do cliente: {centsToCurrency(saldoDevedor - valorCentavos)}
              </span>
            </div>
            <div className="divide-y divide-blue-200/60 border border-blue-200/80 rounded-lg bg-white overflow-hidden text-xs">
              {simulacaoAmortizacao.map(item => (
                <div key={item.id} className="p-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.descricao} (Parc. {item.numero}/{item.total})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Venc: {formatDate(item.vencimento)} • Devia {centsToCurrency(item.devidoAntes)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">
                      - {centsToCurrency(item.abatido)}
                    </p>
                    {item.quitado ? (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-sm">
                        Parcela Quitada
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-sm">
                        Resta {centsToCurrency(item.saldoRestanteApos)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
