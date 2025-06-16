/**
 * Utilitários para manipulação segura de datas
 * Evita problemas de overflow ao adicionar meses
 */

/**
 * Adiciona meses a uma data de forma segura
 * @param date Data base
 * @param months Número de meses para adicionar
 * @returns Nova data com os meses adicionados
 */
export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date.getFullYear(), date.getMonth() + months, date.getDate())
  
  // Se houve overflow (ex: 31 de janeiro + 1 mês = 3 de março em vez de fevereiro)
  // Ajustar para o último dia do mês pretendido
  if (newDate.getMonth() !== (date.getMonth() + months) % 12) {
    // Overflow detectado, usar o último dia do mês pretendido
    newDate.setDate(0) // Vai para o último dia do mês anterior (o mês pretendido)
  }
  
  return newDate
}

/**
 * Adiciona um mês a uma data mantendo o mesmo dia
 * Se o dia não existir no mês de destino, usa o último dia desse mês
 * @param date Data base
 * @returns Nova data com um mês adicionado
 */
export function addOneMonth(date: Date): Date {
  return addMonths(date, 1)
}

/**
 * Calcula a data final de um contrato baseado na data de início e duração
 * @param startDate Data de início do contrato
 * @param months Duração em meses
 * @returns Data final do contrato (um dia antes do próximo período)
 */
export function calculateContractEndDate(startDate: Date, months: number): Date {
  const endDate = addMonths(startDate, months)
  // Subtrair um dia para que o contrato termine no dia anterior
  endDate.setDate(endDate.getDate() - 1)
  return endDate
}