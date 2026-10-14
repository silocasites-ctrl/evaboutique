import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  FileText, 
  RotateCcw, 
  Keyboard, 
  DollarSign, 
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import NovoFiadoModal from './NovoFiadoModal';
import { fiadoService } from '../../services/fiadoService';
import { useToast } from '../ui/ToastContext';

export default function FiadoLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [novoFiadoModalOpen, setNovoFiadoModalOpen] = useState(false);
  const [selectedClienteIdParaNovoFiado, setSelectedClienteIdParaNovoFiado] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const searchInputRef = useRef(null);

  // Manipulador de Atalhos de Teclado Globais: "N" para novo fiado, "/" para busca
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignora se o usuário estiver digitando em campos de texto
      const tag = (e.target.tagName || '').toLowerCase();
      const isInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

      if (isInput) return;

      // Atalho "N": abre Novo Fiado
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setSelectedClienteIdParaNovoFiado(null);
        setNovoFiadoModalOpen(true);
      }

      // Atalho "/": foca na busca
      if (e.key === '/') {
        e.preventDefault();
        // Se estiver em outra página, navega para /fiado/clientes
        if (!location.pathname.includes('/fiado/clientes')) {
          navigate('/fiado/clientes');
          setTimeout(() => {
            if (searchInputRef.current) {
              searchInputRef.current.focus();
            }
          }, 150);
        } else {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate]);

  // Função para abrir o modal de novo fiado com cliente pré-selecionado
  const handleOpenNovoFiadoComCliente = (clienteId) => {
    setSelectedClienteIdParaNovoFiado(clienteId);
    setNovoFiadoModalOpen(true);
  };

  // Restaurar dados de demonstração
  const handleRestaurarDados = async () => {
    if (window.confirm('Deseja recarregar a base de dados de demonstração com os 8 clientes e cenários de exemplo?')) {
      await fiadoService.resetDemoData();
      toast.info('Dados Restaurados', 'A base de demonstração do Fiado foi reinicializada com sucesso.');
      setRefreshKey(prev => prev + 1);
      // Força reload leve da rota
      navigate(location.pathname);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50/60" key={refreshKey}>
      {/* Top Header do Módulo de Fiado */}
      <header className="bg-white border-b border-slate-200/80 px-6 py-4 sticky top-0 z-10 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wider">
                Módulo Financeiro
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Controle de Fiado & Crediário
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de clientes com compras a prazo, vencimentos, limite de crédito e cobranças
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Atalhos hints */}
            <div className="hidden xl:flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
              <span>Atalhos:</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded-sm font-bold text-slate-700 shadow-2xs">N</kbd>
              <span>Novo Fiado</span>
              <span className="text-slate-300">•</span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded-sm font-bold text-slate-700 shadow-2xs">/</kbd>
              <span>Buscar</span>
            </div>

            {/* Botão Restaurar Dados de Demonstração */}
            <button
              onClick={handleRestaurarDados}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors text-xs font-medium flex items-center gap-1.5 shadow-2xs"
              title="Restaurar dados de teste com 8 clientes variados"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Resetar Demonstração</span>
            </button>

            {/* Botão de Destaque "Novo Fiado" */}
            <button
              onClick={() => {
                setSelectedClienteIdParaNovoFiado(null);
                setNovoFiadoModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm shadow-amber-300/40 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Novo Fiado</span>
              <kbd className="hidden sm:inline px-1 py-0.2 bg-amber-700 text-amber-100 rounded-sm text-[10px] font-mono">
                N
              </kbd>
            </button>
          </div>
        </div>

        {/* Barra de Abas de Navegação */}
        <div className="flex gap-2 mt-4 -mb-4 overflow-x-auto border-t border-slate-100 pt-2">
          <NavLink
            to="/fiado"
            end
            className={({ isActive }) => `px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              isActive
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/fiado/clientes"
            className={({ isActive }) => `px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              isActive
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Clientes & Saldos</span>
          </NavLink>

          <NavLink
            to="/fiado/novo"
            className={({ isActive }) => `px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              isActive
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Novo Lançamento</span>
          </NavLink>

          <NavLink
            to="/fiado/relatorios"
            className={({ isActive }) => `px-4 py-2 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              isActive
                ? 'border-amber-600 text-amber-900 bg-amber-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Relatórios & Exportação</span>
          </NavLink>
        </div>
      </header>

      {/* Conteúdo das Subtelas */}
      <main className="p-6 flex-1 overflow-y-auto">
        <Outlet context={{ 
          onOpenNovoFiado: () => setNovoFiadoModalOpen(true),
          onOpenNovoFiadoComCliente: handleOpenNovoFiadoComCliente,
          searchInputRef
        }} />
      </main>

      {/* Modal Global de Novo Fiado (acionado por botão ou tecla N) */}
      <NovoFiadoModal
        isOpen={novoFiadoModalOpen}
        onClose={() => setNovoFiadoModalOpen(false)}
        initialClienteId={selectedClienteIdParaNovoFiado}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
