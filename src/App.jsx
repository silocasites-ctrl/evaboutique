import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, Store, CreditCard } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import PDV from './pages/PDV';
import Produtos from './pages/Produtos';
import Relatorios from './pages/Relatorios';

// Módulo de Fiado
import { ToastProvider } from './components/ui/ToastContext';
import FiadoLayout from './components/fiado/FiadoLayout';
import FiadoDashboard from './components/fiado/FiadoDashboard';
import FiadoClientes from './components/fiado/FiadoClientes';
import FiadoClienteDetalhes from './components/fiado/FiadoClienteDetalhes';
import FiadoNovo from './components/fiado/FiadoNovo';
import FiadoRelatorios from './components/fiado/FiadoRelatorios';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Store size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
          EVA BOUTIQUE
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/pdv" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <ShoppingCart size={20} /> Caixa / Venda
          </NavLink>
          <NavLink to="/fiado" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CreditCard size={20} /> Fiado / Crediário
          </NavLink>
          <NavLink to="/produtos" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Package size={20} /> Produtos
          </NavLink>
          <NavLink to="/relatorios" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileText size={20} /> Relatórios
          </NavLink>
        </nav>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pdv" element={<PDV />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/relatorios" element={<Relatorios />} />

            {/* Módulo de Fiado */}
            <Route path="/fiado" element={<FiadoLayout />}>
              <Route index element={<FiadoDashboard />} />
              <Route path="clientes" element={<FiadoClientes />} />
              <Route path="clientes/:id" element={<FiadoClienteDetalhes />} />
              <Route path="novo" element={<FiadoNovo />} />
              <Route path="relatorios" element={<FiadoRelatorios />} />
            </Route>
          </Routes>
        </Layout>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
