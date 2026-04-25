import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Stethoscope, 
  CreditCard,
  Target,
  LineChart,
  Megaphone,
  HelpCircle,
  Settings,
  Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboards', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Pacientes', href: '/dashboard/patients', icon: Users },
  { name: 'Agendamentos', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Serviços/Procedimentos', href: '/dashboard/services', icon: Stethoscope },
  { name: 'Transações', href: '/dashboard/transactions', icon: CreditCard },
];

const growthItems = [
  { name: 'Metas', href: '/dashboard/goals', icon: Target },
  { name: 'Desempenho', href: '/dashboard/performance', icon: LineChart },
  { name: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#111111] flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-[#1C1C1E] border-r border-[#2C2C2E] transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 shrink-0 items-center px-6 border-b border-[#2C2C2E]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-[#111111] font-bold text-sm">P</span>
            </div>
            <span className="font-semibold text-lg text-zinc-100">Pulseo Saúde</span>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8">
          <div>
            <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-2">
              Menu Principal
            </div>
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    end={item.href === '/dashboard'}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-[#2C2C2E] text-zinc-200" 
                        : "text-zinc-400 hover:bg-[#2C2C2E] hover:text-zinc-100"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3 px-2">
              Ferramentas de Crescimento
            </div>
            <ul className="space-y-1">
              {growthItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) => cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-[#2C2C2E] text-zinc-200" 
                        : "text-zinc-400 hover:bg-[#2C2C2E] hover:text-zinc-100"
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-4 border-t border-[#2C2C2E] space-y-1">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#2C2C2E] hover:text-zinc-100">
            <HelpCircle className="h-5 w-5" />
            Central de Ajuda
          </button>
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-[#2C2C2E] hover:text-zinc-100">
            <Settings className="h-5 w-5" />
            Configurações
          </button>
          <div className="mt-4 flex items-center gap-3 px-3 py-2">
            <img 
              className="h-9 w-9 rounded-full bg-[#3A3A3C] object-cover"
              src="https://i.pravatar.cc/150?u=dr.smith" 
              alt="Dr. Roberto"
            />
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-100">Dr. Roberto</span>
              <span className="text-xs text-zinc-500">roberto@clinica.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#1C1C1E] border-b border-[#2C2C2E] flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <button 
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:bg-[#3A3A3C] rounded-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-end gap-4 items-center">
             <div className="relative w-full max-w-sm hidden sm:block">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                 </svg>
               </div>
               <input 
                 className="block w-full pl-10 pr-3 py-2 border border-[#2C2C2E] rounded-lg leading-5 bg-[#111111] placeholder-slate-400 focus:outline-none focus:bg-[#1C1C1E] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                 placeholder="Pesquisar pacientes, agendamentos..." 
                 type="search" 
               />
             </div>
             <button className="p-2 text-zinc-600 hover:text-zinc-500 relative">
               <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
               <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
               </svg>
             </button>
             <button className="bg-[#2C2C2E] text-zinc-100 hover:bg-blue-100 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               <span className="hidden sm:inline">Exportar Relatório</span>
             </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#111111]/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
