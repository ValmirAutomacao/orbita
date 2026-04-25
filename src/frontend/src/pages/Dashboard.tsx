import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, FileText, Users, Settings2, ArrowUpRight } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';

const dataChart = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Fev', income: 3000, expense: 1398 },
  { name: 'Mar', income: 2000, expense: 9800 },
  { name: 'Abr', income: 2780, expense: 3908 },
  { name: 'Mai', income: 1890, expense: 4800 },
  { name: 'Jun', income: 2390, expense: 3800 },
  { name: 'Jul', income: 3490, expense: 4300 },
  { name: 'Ago', income: 4000, expense: 2400 },
  { name: 'Set', income: 3000, expense: 1398 },
  { name: 'Out', income: 2000, expense: 9800 },
];

const topServices = [
  { name: 'Consulta Cardio', value: 300 },
  { name: 'Eletrocardiograma', value: 500 },
  { name: 'Checkup', value: 237 },
];

const recentAppointments = [
  { id: 1, patient: 'Maria Oliveira', service: 'Consulta Cardio', price: 'R$ 350,00', doctor: 'Dr. Roberto', status: 'Confirmado' },
  { id: 2, patient: 'João Pedro', service: 'Eletrocardiograma', price: 'R$ 150,00', doctor: 'Dra. Ana', status: 'Em espera' },
  { id: 3, patient: 'Carla Souza', service: 'Checkup', price: 'R$ 800,00', doctor: 'Dr. Roberto', status: 'Concluído' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Sua Clínica em um Piscar de Olhos</h1>
          <p className="text-zinc-500 text-sm mt-1">Visão em tempo real de faturamento, consultas e pacientes.</p>
        </div>
        <Button variant="outline" className="bg-[#1C1C1E] gap-2">
          <Settings2 className="w-4 h-4" /> Personalizar Widgets
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#111111]/50 border-0 shadow-sm ring-1 ring-[#2C2C2E]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="font-medium text-zinc-400">Faturamento Hoje</p>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">R$ 12.840</h2>
            <div className="flex items-center text-sm font-medium text-zinc-200">
               <span>+5,50% desde ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/50 border-0 shadow-sm ring-1 ring-[#2C2C2E]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="font-medium text-zinc-400">Consultas Realizadas</p>
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">287</h2>
            <div className="flex items-center text-sm font-medium text-zinc-200">
               <span>+6,20% desde ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111111]/50 border-0 shadow-sm ring-1 ring-[#2C2C2E]">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <p className="font-medium text-zinc-400">Pacientes Recorrentes</p>
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-zinc-100 mb-2">84</h2>
            <div className="flex items-center text-sm font-medium text-zinc-200">
               <span>+8,20% desde ontem</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-[#2C2C2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-lg">Análise Financeira</CardTitle>
             <select className="text-sm border-[#2C2C2E] rounded-md text-zinc-400">
               <option>Este Ano</option>
               <option>Último Ano</option>
             </select>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-xs font-medium mb-4">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-zinc-100"></div> Receitas</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Despesas</div>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip />
                  <Area type="monotone" dataKey="income" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-[#2C2C2E]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
             <CardTitle className="text-lg flex items-center gap-2">Top Serviços <span className="w-4 h-4 rounded-full bg-[#2C2C2E] flex items-center justify-center text-[10px] text-zinc-500">?</span></CardTitle>
             <Button variant="outline" size="sm" className="text-xs h-7 px-2 bg-[#2C2C2E] text-zinc-100 border-blue-100 hover:bg-blue-100">Ver Detalhes</Button>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2 mb-6">
              <ArrowUpRight className="w-5 h-5 text-indigo-500" />
              <h3 className="text-2xl font-bold text-zinc-100">10,432</h3>
              <span className="text-blue-500 text-sm font-medium">+512</span>
            </div>
            
            <div className="h-[60px] w-full mb-6">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={topServices} layout="vertical" margin={{top: 0, right: 0, left: 0, bottom: 0}}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip cursor={false} />
                    <Bar dataKey="value" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="space-y-4">
              {topServices.map((service, i) => (
                <div key={i} className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-sm", i === 0 ? "bg-zinc-100" : i === 1 ? "bg-indigo-500" : "bg-purple-500")}></div>
                    <div>
                      <p className="font-medium text-zinc-100 leading-none mb-1">{service.name}</p>
                      <p className="text-xs text-zinc-500">{service.value} Consultas</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-600"><ArrowUpRight className="w-3 h-3"/></Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Table */}
      <Card className="border-0 shadow-sm ring-1 ring-[#2C2C2E]">
        <CardHeader className="flex flex-row items-center justify-between border-b border-[#2C2C2E] pb-4">
           <CardTitle className="text-lg">Pacientes / Consultas Recentes</CardTitle>
           <div className="flex items-center gap-2">
             <div className="relative">
               <input 
                 type="text" 
                 placeholder="Pesquisar..." 
                 className="pl-8 pr-3 py-1.5 text-sm border border-[#2C2C2E] rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
               />
             </div>
             <Button className="h-8 gap-2 bg-zinc-100 hover:bg-blue-700">
               + Novo Agendamento
             </Button>
           </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 font-semibold border-b border-[#2C2C2E] bg-[#111111]">
              <tr>
                <th className="px-6 py-4">Paciente</th>
                <th className="px-6 py-4">Serviço</th>
                <th className="px-6 py-4">Médico</th>
                <th className="px-6 py-4">Valor</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentAppointments.map((row) => (
                <tr key={row.id} className="border-b border-[#2C2C2E] hover:bg-[#2C2C2E]/50">
                  <td className="px-6 py-4 font-medium text-zinc-100">{row.patient}</td>
                  <td className="px-6 py-4 text-zinc-400">{row.service}</td>
                  <td className="px-6 py-4 text-zinc-400">{row.doctor}</td>
                  <td className="px-6 py-4 font-medium text-zinc-100">{row.price}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium",
                      row.status === 'Confirmado' ? "bg-[#2C2C2E] text-zinc-100 border border-blue-200" :
                      row.status === 'Em espera' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                      "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    )}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
