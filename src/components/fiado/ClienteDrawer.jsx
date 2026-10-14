import { useState, useEffect } from 'react';
import { fiadoService } from '../../services/fiadoService';
import { formatPhone, isValidPhone } from '../../utils/formatters';
import Drawer from '../ui/Drawer';
import CurrencyInput from '../ui/CurrencyInput';
import { useToast } from '../ui/ToastContext';
import { User, Phone, DollarSign, FileText } from 'lucide-react';

export default function ClienteDrawer({ isOpen, onClose, cliente = null, onSuccess }) {
  const toast = useToast();

  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [limiteCentavos, setLimiteCentavos] = useState(0);
  const [temLimite, setTemLimite] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (cliente) {
        setNome(cliente.nome || '');
        setTelefone(cliente.telefone ? formatPhone(cliente.telefone) : '');
        if (cliente.limite_credito && cliente.limite_credito > 0) {
          setTemLimite(true);
          setLimiteCentavos(cliente.limite_credito);
        } else {
          setTemLimite(false);
          setLimiteCentavos(0);
        }
        setObservacoes(cliente.observacoes || '');
      } else {
        // Novo
        setNome('');
        setTelefone('');
        setTemLimite(false);
        setLimiteCentavos(0);
        setObservacoes('');
      }
    }
  }, [isOpen, cliente]);

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    setTelefone(formatPhone(raw));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error('Campo Obrigatório', 'O nome do cliente é obrigatório.');
      return;
    }

    if (telefone && !isValidPhone(telefone)) {
      toast.error('Telefone Inválido', 'Informe um telefone/WhatsApp válido com DDD (10 ou 11 dígitos).');
      return;
    }

    setSubmitting(true);
    try {
      await fiadoService.saveCliente({
        id: cliente ? cliente.id : undefined,
        nome,
        telefone,
        limite_credito: temLimite ? limiteCentavos : null,
        observacoes
      });

      toast.success(
        cliente ? 'Cliente Atualizado!' : 'Cliente Cadastrado!',
        `Os dados de ${nome} foram salvos com sucesso.`
      );

      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao Salvar', err.message || 'Ocorreu um erro ao salvar o cliente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={cliente ? 'Editar Cliente' : 'Novo Cliente'}
      subtitle={cliente ? 'Atualize os dados e limite de crédito do cliente.' : 'Cadastre um novo cliente para compras a prazo.'}
      width="max-w-md"
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
            disabled={submitting || !nome.trim()}
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm shadow-amber-200 transition-colors"
          >
            {submitting ? 'Salvando...' : cliente ? 'Salvar Alterações' : 'Cadastrar Cliente'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nome */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-amber-600" /> Nome Completo <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Mariana Castro Silva"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
            autoFocus
          />
        </div>

        {/* Telefone / WhatsApp */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-600" /> Telefone / WhatsApp
          </label>
          <input
            type="tel"
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={handlePhoneChange}
            className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Necessário para envio de lembretes e cobranças automáticas via WhatsApp.
          </p>
        </div>

        {/* Limite de Crédito Opcional */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <div>
                <p className="text-xs font-semibold text-slate-800">Definir limite de crédito?</p>
                <p className="text-[11px] text-slate-500">Alerta se novos fiados excederem o valor</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={temLimite}
                onChange={(e) => setTemLimite(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>

          {temLimite && (
            <div className="animate-in fade-in space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Valor do Limite de Crédito (R$)
              </label>
              <CurrencyInput
                valueInCents={limiteCentavos}
                onChangeCents={setLimiteCentavos}
                placeholder="R$ 500,00"
              />
              <p className="text-[11px] text-slate-500">
                Ao tentar lançar valor acima deste limite, o sistema exibirá um aviso amigável (sem bloquear a venda).
              </p>
            </div>
          )}
        </div>

        {/* Observações */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" /> Observações Internas
          </label>
          <textarea
            rows={3}
            placeholder="Ex: Prefere ser contatada no período da tarde; cliente antiga da loja..."
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            className="w-full text-sm rounded-lg border border-slate-300 p-3 text-slate-900 placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
      </form>
    </Drawer>
  );
}
