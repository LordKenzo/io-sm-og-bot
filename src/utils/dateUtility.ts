import { monthMap } from "./constants"

export const isDataBeforeToday = (date: string): boolean => {
  let inputDay: number
  let inputMonth: number

  // Verifica se la data è nel formato DD-MM-YYYY
  if (date.includes('-')) {
    const [day, month] = date.split('-')
    inputDay = parseInt(day)
    inputMonth = parseInt(month)
  } else {
    // Formato "12 dicembre"
    const [day, month] = date.split(' ')
    inputDay = parseInt(day)
    inputMonth = monthMap[month.toLowerCase()]
  }

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()

  if (inputMonth < currentMonth) {
    return true
  }

  if (inputMonth === currentMonth && inputDay < currentDay) {
    return true
  }

  return false
}

export const addYearToDateString = (dateString: string): string => {
  if (isDataBeforeToday(dateString))
    return `${dateString} ${new Date().getFullYear() + 1}`
  return `${dateString} ${new Date().getFullYear()}`
}

export const getTomorrowDate = (format: string, days: number = 1): string => {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + days)

  switch (format) {
    case 'DD-MM-YYYY':
      return tomorrow
        .toLocaleDateString('it-IT', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
        .replace(/\//g, '-')

    case 'day month':
      return tomorrow.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'long',
      })

    default:
      throw new Error(
        'Formato non valido. Utilizzare "DD-MM-YYYY" o "day month"'
      )
  }
}

export const getFormattedDate = (date: string, format: string): string => {
  const dateWithYear = addYearToDateString(date)
  const [day, month, year] = dateWithYear.split(' ')

  const monthNumber = monthMap[month.toLowerCase()]
  const paddedDay = day.padStart(2, '0')
  const paddedMonth = String(monthNumber).padStart(2, '0')

  switch (format) {
    case 'DD-MM-YYYY':
      return `${paddedDay}-${paddedMonth}-${year}`

    case 'day month':
      return `${day} ${month}`

    default:
      throw new Error(
        'Formato non valido. Utilizzare "DD-MM-YYYY" o "day month"'
      )
  }
}

export const checkDateTooFar = (date: string, weeks: number = 2): boolean => {
  // Converte la data dal formato DD-MM-YYYY in un oggetto Date
  const [day, month, year] = date.split('-').map(Number)
  const inputDate = new Date(year, month - 1, day)

  // Calcola la data limite (oggi + numero di settimane)
  const limitDate = new Date()
  limitDate.setDate(limitDate.getDate() + weeks * 7)

  // Verifica se la data di input è successiva alla data limite
  return inputDate > limitDate
}
