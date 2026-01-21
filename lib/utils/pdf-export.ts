'use client'

import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatCurrency } from './format-currency'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Exportar relatório de Receitas vs Despesas em PDF
 */
export async function exportRevenueVsExpensePDF(data: any) {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(18)
  doc.text('Relatório Financeiro - Receitas vs Despesas', 14, 20)
  
  // Data do relatório
  doc.setFontSize(10)
  doc.text(
    `Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}`,
    14,
    30
  )
  
  // Resumo
  doc.setFontSize(14)
  doc.text('Resumo', 14, 45)
  
  doc.setFontSize(10)
  doc.text(`Total de Receitas: ${formatCurrency(data.totalRevenue)}`, 14, 55)
  doc.text(`Total de Despesas: ${formatCurrency(data.totalExpense)}`, 14, 62)
  doc.text(`Saldo Final: ${formatCurrency(data.balance)}`, 14, 69)
  
  // Tabela de dados mensais
  if (data.monthlyData && data.monthlyData.length > 0) {
    doc.setFontSize(14)
    doc.text('Evolução Mensal', 14, 85)
    
    const tableData = data.monthlyData.map((month: any) => [
      format(new Date(month.month + '-01'), 'MM/yyyy', { locale: ptBR }),
      formatCurrency(month.revenue),
      formatCurrency(month.expense),
      formatCurrency(month.balance),
    ])
    
    autoTable(doc, {
      head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
      body: tableData,
      startY: 90,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    })
  }
  
  // Salvar PDF
  doc.save(`relatorio-financeiro-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

