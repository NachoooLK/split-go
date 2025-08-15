import Tesseract from 'tesseract.js'
import { categorizeFromTicket } from './ticketScanner'

/**
 * Extrae texto de una imagen usando Tesseract.js (OCR local)
 */
export const extractTextFromImage = async (imageFile, onProgress = null) => {
  try {
    const result = await Tesseract.recognize(imageFile, 'spa+eng', {
      logger: onProgress ? (m) => {
        if (m.status === 'recognizing text') {
          onProgress(Math.round(m.progress * 100))
        }
      } : undefined
    })
    
    return result.data.text
  } catch (error) {
    console.error('Error in OCR:', error)
    throw new Error('Error al procesar la imagen: ' + error.message)
  }
}

/**
 * Parsea texto extraído de un ticket para encontrar información relevante
 */
export const parseTicketText = (text) => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line)
  
  let amount = null
  let merchant = null
  let date = null
  let items = []
  
  // Patrones para buscar información
  const amountPatterns = [
    /total[:\s]*€?\s*(\d+[.,]\d{2})/i,
    /importe[:\s]*€?\s*(\d+[.,]\d{2})/i,
    /suma[:\s]*€?\s*(\d+[.,]\d{2})/i,
    /€\s*(\d+[.,]\d{2})\s*$/, // Euro al final
    /(\d+[.,]\d{2})\s*€/, // Euro después
    /(\d+[.,]\d{2})\s*eur/i, // EUR después
    /total[:\s]*€?\s*(\d+)\s*€/i, // Total sin decimales explícitos
    /€\s*(\d+)\s*$/, // Euro al final sin decimales
    /(\d+)\s*€\s*$/, // Número seguido de euro al final
  ]
  
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/, // dd/mm/yyyy o dd-mm-yyyy
    /(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // yyyy/mm/dd o yyyy-mm-dd
    /(\d{1,2})\s+(ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\w*\s+(\d{2,4})/i, // dd mes yyyy
  ]
  
  // Buscar monto
  for (const line of lines) {
    for (const pattern of amountPatterns) {
      const match = line.match(pattern)
      if (match) {
        let value = match[1].replace(',', '.')
        
        // Si el número no tiene decimales pero parece ser un precio (ej: "1234" → "12.34")
        if (!value.includes('.') && value.length >= 3) {
          // Heurística: si es mayor a 999, probablemente faltan decimales
          const numValue = parseInt(value)
          if (numValue > 999) {
            // Convertir últimos 2 dígitos en decimales
            value = value.slice(0, -2) + '.' + value.slice(-2)
          } else if (numValue > 99) {
            // Para números entre 100-999, también podría faltar decimal
            // Pero solo si el contexto lo sugiere (por ejemplo, si hay centavos en otros precios)
            const hasDecimalsInText = text.includes(',') || /\d+\.\d{2}/.test(text)
            if (hasDecimalsInText) {
              value = value.slice(0, -2) + '.' + value.slice(-2)
            }
          }
        }
        
        const parsed = parseFloat(value)
        if (!isNaN(parsed) && parsed > 0) {
          amount = parsed
          break
        }
      }
    }
    if (amount) break
  }
  
  // Buscar fecha
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern)
      if (match) {
        try {
          let day, month, year
          
          if (pattern.source.includes('ene|feb')) {
            // Formato: dd mes yyyy
            day = parseInt(match[1])
            const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 
                              'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
            month = monthNames.indexOf(match[2].toLowerCase().substring(0, 3)) + 1
            year = parseInt(match[3])
          } else if (match[3] && match[3].length === 4) {
            // Formato: dd/mm/yyyy
            day = parseInt(match[1])
            month = parseInt(match[2])
            year = parseInt(match[3])
          } else if (match[1] && match[1].length === 4) {
            // Formato: yyyy/mm/dd
            year = parseInt(match[1])
            month = parseInt(match[2])
            day = parseInt(match[3])
          } else {
            // Formato: dd/mm/yy
            day = parseInt(match[1])
            month = parseInt(match[2])
            year = parseInt(match[3])
            if (year < 50) year += 2000
            else if (year < 100) year += 1900
          }
          
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000) {
            const dateObj = new Date(year, month - 1, day)
            date = dateObj.toISOString().split('T')[0]
            break
          }
        } catch (e) {
          console.log('Error parsing date:', e)
        }
      }
    }
    if (date) break
  }
  
  // Buscar establecimiento (primera línea que no sea vacía y no sea número)
  for (const line of lines) {
    if (line.length > 3 && 
        !line.match(/^\d+$/) && 
        !line.match(/^[\d\s\-\/]+$/) &&
        !line.includes('€') &&
        !line.toLowerCase().includes('total') &&
        !line.toLowerCase().includes('importe') &&
        !line.toLowerCase().includes('fecha')) {
      merchant = line
      break
    }
  }
  
  // Buscar items (líneas con precios)
  for (const line of lines) {
    const itemMatch = line.match(/(.+?)\s+€?\s*(\d+[.,]\d{2})/)
    if (itemMatch && itemMatch[1].length > 2) {
      const itemName = itemMatch[1].trim()
      const itemPrice = parseFloat(itemMatch[2].replace(',', '.'))
      if (!isNaN(itemPrice) && itemPrice > 0) {
        items.push({
          name: itemName,
          price: itemPrice
        })
      }
    }
  }
  
  // Generar descripción
  let description = merchant || 'Compra'
  if (items.length > 0 && items.length <= 3) {
    description = items.map(item => item.name).join(', ')
  }
  
  return {
    amount,
    merchant,
    description,
    date: date || new Date().toISOString().split('T')[0],
    items: items.slice(0, 10), // Máximo 10 items
    confidence: calculateConfidence({ amount, merchant, date, items }),
    extractedText: text
  }
}

/**
 * Calcula un nivel de confianza basado en los datos extraídos
 */
const calculateConfidence = ({ amount, merchant, date, items }) => {
  let confidence = 0
  
  if (amount && amount > 0) confidence += 4
  if (merchant && merchant.length > 2) confidence += 3
  if (date) confidence += 2
  if (items && items.length > 0) confidence += 1
  
  return Math.min(confidence, 10)
}

/**
 * Procesa un ticket usando OCR local
 */
export const processTicketLocal = async (imageFile, onProgress = null) => {
  try {
    // Extraer texto con OCR
    const extractedText = await extractTextFromImage(imageFile, onProgress)
    
    // Parsear datos del texto
    const ticketData = parseTicketText(extractedText)
    
    // Categorizar automáticamente
    const suggestedCategory = categorizeFromTicket(ticketData)
    
    return {
      ...ticketData,
      suggestedCategory,
      scannedAt: new Date().toISOString(),
      method: 'local-ocr'
    }
  } catch (error) {
    console.error('Error processing ticket locally:', error)
    throw error
  }
}
