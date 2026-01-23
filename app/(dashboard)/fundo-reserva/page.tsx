import { getReserveFund, getReserveFundTransactions, getAvailableBalance, type ReserveFundTransaction } from '@/app/actions/reserve-fund'
import { ReserveFundManager } from '@/components/reserve-fund/reserve-fund-manager'
import { ReloadButton } from '@/components/reserve-fund/reload-button'

export default async function FundoReservaPage() {
    const { data: reserveFund, error: fundError } = await getReserveFund()
    const { balance: availableBalance } = await getAvailableBalance()

    // Buscar transações apenas se o fundo existir
    let transactions: ReserveFundTransaction[] = []
    let transactionsError: string | null = null

    if (!fundError && reserveFund) {
        const transactionsResult = await getReserveFundTransactions(100)
        transactions = transactionsResult.data || []
        transactionsError = transactionsResult.error
    }

    if (fundError) {
        return (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">Fundo de Reserva</h1>
                    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 sm:p-6">
                        <h3 className="text-lg font-bold text-red-400 mb-2">Erro</h3>
                        <p className="text-red-300 mb-4">{fundError}</p>
                        <ReloadButton />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 lg:mb-8">Fundo de Reserva</h1>
                <ReserveFundManager
                    reserveFund={reserveFund}
                    transactions={transactions}
                    transactionsError={transactionsError}
                    availableBalance={availableBalance}
                />
            </div>
        </div>
    )
}

