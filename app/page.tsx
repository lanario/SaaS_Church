import Link from 'next/link'
import { FaChurch, FaHandHoldingHeart, FaFileInvoiceDollar, FaChartPie, FaCheckCircle } from 'react-icons/fa'

export default function HomePage() {
  return (
    <div className="bg-slate-50 text-slate-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 glass border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <FaChurch className="text-white text-xl" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight font-display">
              Tesour<span className="text-indigo-600">App</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 font-medium text-slate-600">
            <a href="#recursos" className="hover:text-indigo-600 transition-colors">
              Recursos
            </a>
            <a href="#dashboard" className="hover:text-indigo-600 transition-colors">
              O Sistema
            </a>
            <a href="#precos" className="hover:text-indigo-600 transition-colors">
              Planos
            </a>
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Acessar Painel
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6 inline-block uppercase tracking-wider">
            Gestão Eclesiástica Moderna
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 leading-tight font-display">
            Transparência e Fé na <span className="gradient-text">Gestão Financeira</span>
          </h1>
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Um sistema completo para tesourarias de igrejas. Controle dízimos, ofertas e despesas com relatórios automáticos e segurança total.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all shadow-xl"
            >
              Começar Agora
            </Link>
            <button className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all">
              Ver Demonstração
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="recursos" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-display">Tudo o que sua igreja precisa</h2>
            <p className="text-slate-500">Funcionalidades pensadas para facilitar o dia a dia do tesoureiro.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <FaHandHoldingHeart className="text-indigo-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Dízimos e Ofertas</h3>
              <p className="text-slate-600 leading-relaxed">
                Registro rápido de entradas com identificação de membros e emissão de recibos digitais.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <FaFileInvoiceDollar className="text-indigo-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Controle de Gastos</h3>
              <p className="text-slate-600 leading-relaxed">
                Gestão de contas a pagar, manutenção do templo e projetos missionários em um só lugar.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="p-8 rounded-3xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all group">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform">
                <FaChartPie className="text-indigo-600 text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Relatórios em 1 Clique</h3>
              <p className="text-slate-600 leading-relaxed">
                Gere balancetes mensais e anuais automaticamente para prestação de contas em assembleias.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section id="dashboard" className="py-24 bg-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 text-white">
              <h2 className="text-4xl font-bold mb-6 leading-tight font-display">
                Interface intuitiva para focar no que importa
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Desenvolvemos um painel que não exige conhecimentos técnicos. Em poucos minutos você domina todas as ferramentas de tesouraria.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300">
                  <FaCheckCircle className="text-indigo-500" />
                  Dashboard em tempo real
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <FaCheckCircle className="text-indigo-500" />
                  Acesso seguro por múltiplos usuários
                </li>
                <li className="flex items-center gap-3 text-slate-300">
                  <FaCheckCircle className="text-indigo-500" />
                  Backup automático na nuvem
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/10">
                <div className="bg-slate-800 rounded-2xl shadow-2xl h-[500px] flex items-center justify-center">
                  <p className="text-slate-400">Dashboard Preview</p>
                </div>
              </div>
              {/* Floating Card */}
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-2xl hidden md:block">
                <div className="flex items-center gap-4">
                  <div className="bg-green-100 p-3 rounded-xl">
                    <span className="text-green-600 font-bold">↑</span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Saldo Atual</p>
                    <p className="text-xl font-black text-slate-900">R$ 42.500,00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="precos" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 font-display">Planos para cada tamanho de obra</h2>
            <p className="text-slate-500">Escolha o que melhor se adapta à sua congregação.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Plan 1 */}
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-xl mb-2">Missões</h3>
              <div className="text-4xl font-black mb-6">Grátis</div>
              <ul className="space-y-4 mb-8 text-slate-600">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  Até 30 membros
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  Entradas e Saídas
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  1 Usuário
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-all">
                Começar
              </button>
            </div>
            {/* Plan 2 (Featured) */}
            <div className="bg-indigo-600 p-10 rounded-3xl shadow-2xl shadow-indigo-200 transform scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-1 text-xs font-bold uppercase">
                Popular
              </div>
              <h3 className="font-bold text-xl mb-2 text-white">Crescimento</h3>
              <div className="text-4xl font-black mb-6 text-white">
                R$ 49<span className="text-lg font-normal opacity-80">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 text-indigo-100">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-white" />
                  Membros Ilimitados
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-white" />
                  Relatórios Avançados
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-white" />
                  5 Usuários
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-white" />
                  Suporte Prioritário
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white text-indigo-600 font-bold hover:bg-indigo-50 transition-all">
                Assinar Agora
              </button>
            </div>
            {/* Plan 3 */}
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-xl mb-2">Catedral</h3>
              <div className="text-4xl font-black mb-6">
                R$ 99<span className="text-lg font-normal opacity-80">/mês</span>
              </div>
              <ul className="space-y-4 mb-8 text-slate-600">
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  Multi-igrejas
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  API de Integração
                </li>
                <li className="flex items-center gap-2">
                  <FaCheckCircle className="text-green-500" />
                  Usuários Ilimitados
                </li>
              </ul>
              <button className="w-full py-3 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 transition-all">
                Contatar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <FaChurch className="text-white text-sm" />
            </div>
            <span className="text-xl font-bold font-display">TesourApp</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 TesourApp. Desenvolvido para fortalecer a gestão do Reino.</p>
        </div>
      </footer>
    </div>
  )
}

