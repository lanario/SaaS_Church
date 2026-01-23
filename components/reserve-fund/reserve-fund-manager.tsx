'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaPiggyBank, FaArrowDown, FaArrowUp, FaHistory } from 'react-icons/fa'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { depositToReserveFund, withdrawFromReserveFund, autoTransferToReserveFund } from '@/app/actions/reserve-fund'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ReserveFundData {
    id: string
    balance: number
    last_transfer_date: string | null
}

interface ReserveFundTransaction {
    id: string
    transaction_type: 'deposit' | 'withdrawal' | 'auto_transfer'
    amount: number
    description: string | null
    created_at: string
}

interface ReserveFundManagerProps {
    reserveFund: ReserveFundData | null
    transactions: ReserveFundTransaction[]
    transactionsError: string | null
    availableBalance: number
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value)
}

function getTransactionTypeLabel(type: string) {
    const types: Record<string, string> = {
        deposit: 'Depósito',
        withdrawal: 'Retirada',
        auto_transfer: 'Transferência Automática',
    }
    return types[type] || type
}

function getTransactionTypeColor(type: string) {
    const colors: Record<string, string> = {
        deposit: 'text-green-400 bg-green-500/20 border border-green-500/30',
        withdrawal: 'text-red-400 bg-red-500/20 border border-red-500/30',
        auto_transfer: 'text-blue-400 bg-blue-500/20 border border-blue-500/30',
    }
    return colors[type] || 'text-slate-400 bg-slate-500/20 border border-slate-500/30'
}

export function ReserveFundManager({ reserveFund, transactions, transactionsError, availableBalance }: ReserveFundManagerProps) {
    const router = useRouter()
    const [showDepositForm, setShowDepositForm] = useState(false)
    const [showWithdrawForm, setShowWithdrawForm] = useState(false)
    const [depositAmount, setDepositAmount] = useState('')
    const [depositDescription, setDepositDescription] = useState('')
    const [withdrawAmount, setWithdrawAmount] = useState('')
    const [withdrawDescription, setWithdrawDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    async function handleDeposit() {
        if (!depositAmount || Number(depositAmount) <= 0) {
            setError('Informe um valor válido')
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const result = await depositToReserveFund(Number(depositAmount), depositDescription || undefined)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        setSuccess('Depósito realizado com sucesso!')
        setDepositAmount('')
        setDepositDescription('')
        setShowDepositForm(false)
        setIsLoading(false)
        router.refresh()
    }

    async function handleWithdraw() {
        if (!withdrawAmount || Number(withdrawAmount) <= 0) {
            setError('Informe um valor válido')
            return
        }

        if (reserveFund && Number(withdrawAmount) > reserveFund.balance) {
            setError('Saldo insuficiente')
            return
        }

        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const result = await withdrawFromReserveFund(Number(withdrawAmount), withdrawDescription || undefined)

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        setSuccess('Retirada realizada com sucesso!')
        setWithdrawAmount('')
        setWithdrawDescription('')
        setShowWithdrawForm(false)
        setIsLoading(false)
        router.refresh()
    }

    async function handleAutoTransfer() {
        setIsLoading(true)
        setError(null)
        setSuccess(null)

        const result = await autoTransferToReserveFund()

        if (result.error) {
            setError(result.error)
            setIsLoading(false)
            return
        }

        setSuccess(`Transferência automática realizada! Valor transferido: ${formatCurrency(result.amount || 0)}`)
        setIsLoading(false)
        router.refresh()
    }

    const balance = reserveFund?.balance || 0
    const lastTransferDate = reserveFund?.last_transfer_date
        ? format(new Date(reserveFund.last_transfer_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : 'Nunca'

    return (
        <div className="space-y-6">
            {/* Cards de Saldo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card de Saldo em Caixa */}
                <Card className="p-6 bg-gradient-to-br from-slate-700 to-slate-800 text-white border-slate-600">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="bg-green-500/20 p-2 rounded-lg">
                                    <FaArrowDown className="text-xl text-green-400" />
                                </div>
                                <h2 className="text-xl font-bold">Saldo em Caixa</h2>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{formatCurrency(availableBalance)}</p>
                            <p className="text-slate-300 text-sm mt-2">
                                Disponível para depósito no fundo de reserva
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Card de Saldo do Fundo de Reserva */}
                <Card className="p-6 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white border-indigo-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <FaPiggyBank className="text-3xl" />
                                <h2 className="text-xl font-bold">Saldo do Fundo de Reserva</h2>
                            </div>
                            <p className="text-3xl font-extrabold mt-2">{formatCurrency(balance)}</p>
                            <p className="text-indigo-200 text-sm mt-2">
                                Última transferência automática: {lastTransferDate}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Mensagens de Erro/Sucesso */}
            {error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-green-400 text-sm">
                    {success}
                </div>
            )}

            {/* Ações */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                    onClick={() => {
                        setShowDepositForm(true)
                        setShowWithdrawForm(false)
                        setError(null)
                        setSuccess(null)
                    }}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                    <FaArrowDown />
                    Depositar
                </Button>
                <Button
                    onClick={() => {
                        setShowWithdrawForm(true)
                        setShowDepositForm(false)
                        setError(null)
                        setSuccess(null)
                    }}
                    className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                    disabled={balance <= 0}
                >
                    <FaArrowUp />
                    Retirar
                </Button>
                <Button
                    onClick={handleAutoTransfer}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                    <FaPiggyBank />
                    Transferência Automática
                </Button>
            </div>

            {/* Formulário de Depósito */}
            {showDepositForm && (
                <Card className="p-6">
                    <h3 className="font-bold text-white mb-4">Depositar no Fundo de Reserva</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Valor (Saldo disponível: {formatCurrency(availableBalance)})
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                                max={availableBalance}
                            />
                            {availableBalance <= 0 && (
                                <p className="mt-1 text-sm text-amber-400">
                                    Não há saldo disponível para depositar no fundo de reserva.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Descrição (opcional)
                            </label>
                            <Input
                                type="text"
                                placeholder="Descrição do depósito"
                                value={depositDescription}
                                onChange={(e) => setDepositDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleDeposit} disabled={isLoading} className="flex-1">
                                {isLoading ? 'Processando...' : 'Confirmar Depósito'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDepositForm(false)
                                    setDepositAmount('')
                                    setDepositDescription('')
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Formulário de Retirada */}
            {showWithdrawForm && (
                <Card className="p-6">
                    <h3 className="font-bold text-white mb-4">Retirar do Fundo de Reserva</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Valor (Saldo disponível: {formatCurrency(balance)})
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                max={balance}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-300 mb-2">
                                Descrição (opcional)
                            </label>
                            <Input
                                type="text"
                                placeholder="Descrição da retirada"
                                value={withdrawDescription}
                                onChange={(e) => setWithdrawDescription(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-4">
                            <Button onClick={handleWithdraw} disabled={isLoading} className="flex-1">
                                {isLoading ? 'Processando...' : 'Confirmar Retirada'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowWithdrawForm(false)
                                    setWithdrawAmount('')
                                    setWithdrawDescription('')
                                }}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                </Card>
            )}

            {/* Histórico de Transações */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <FaHistory className="text-slate-400" />
                    <h3 className="font-bold text-white">Histórico de Transações</h3>
                </div>
                {transactionsError ? (
                    <p className="text-red-400 text-sm">{transactionsError}</p>
                ) : transactions.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">
                        Nenhuma transação registrada
                    </p>
                ) : (
                    <div className="space-y-3">
                        {transactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="flex items-center justify-between p-4 border border-slate-600 rounded-lg bg-slate-800/50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${getTransactionTypeColor(transaction.transaction_type)}`}>
                                            {getTransactionTypeLabel(transaction.transaction_type)}
                                        </span>
                                        <span className="text-sm font-bold text-white">
                                            {formatCurrency(transaction.amount)}
                                        </span>
                                    </div>
                                    {transaction.description && (
                                        <p className="text-sm text-slate-300">{transaction.description}</p>
                                    )}
                                    <p className="text-xs text-slate-400 mt-1">
                                        {format(new Date(transaction.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}

