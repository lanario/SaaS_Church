import { getReserveFund, getReserveFundTransactions } from '@/app/actions/reserve-fund'
import { ReserveFundManager } from '@/components/reserve-fund/reserve-fund-manager'

export default async function FundoReservaPage() {
  const { data: reserveFund, error: fundError } = await getReserveFund()
  const { data: transactions, error: transactionsError } = await getReserveFundTransactions(100)

  if (fundError) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-bold text-red-800 mb-2">Erro</h3>
          <p className="text-red-700">{fundError}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Fundo de Reserva</h1>
        <ReserveFundManager
          reserveFund={reserveFund}
          transactions={transactions || []}
          transactionsError={transactionsError}
        />
      </div>
    </div>
  )
}

