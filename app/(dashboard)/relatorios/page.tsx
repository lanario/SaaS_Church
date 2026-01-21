import { getMonthlyReport } from '@/app/actions/reports'
import { MonthlyReport } from '@/components/reports/monthly-report'
import { FaFileAlt } from 'react-icons/fa'
import { ReportTabs } from '@/components/reports/report-tabs-new'
import { MonthYearSelector } from '@/components/reports/month-year-selector'

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: {
    tab?: string
    month?: string
    year?: string
  }
}) {
  const currentDate = new Date()
  const month = searchParams.month ? parseInt(searchParams.month) : currentDate.getMonth() + 1
  const year = searchParams.year ? parseInt(searchParams.year) : currentDate.getFullYear()
  const activeTab = searchParams.tab || 'monthly'

  // Buscar dados do relatório mensal
  const { data: monthlyData, error: monthlyError } = await getMonthlyReport(month, year)

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FaFileAlt className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold text-gray-800">Relatórios</h1>
        </div>
        <p className="text-gray-500 ml-11">
          Visualize e analise os dados financeiros da sua igreja com gráficos e relatórios detalhados
        </p>
      </div>

      {/* Seletores de Mês/Ano */}
      {activeTab === 'monthly' && (
        <div className="mb-6">
          <MonthYearSelector currentMonth={month} currentYear={year} />
        </div>
      )}

      {/* Tabs */}
      <ReportTabs activeTab={activeTab} month={month} year={year}>
        {activeTab === 'monthly' && (
          <MonthlyReport 
            data={monthlyData || {
              month,
              year,
              totalRevenue: 0,
              totalExpense: 0,
              balance: 0,
              variation: 0,
              variationPercent: 0,
              monthlyData: [],
              transactions: [],
            }} 
          />
        )}
        {activeTab === 'annual' && (
          <div className="text-center py-12 text-gray-500">
            Relatório Anual em desenvolvimento
          </div>
        )}
        {activeTab === 'tithes' && (
          <div className="text-center py-12 text-gray-500">
            Dízimos por Membro em desenvolvimento
          </div>
        )}
      </ReportTabs>
    </div>
  )
}
