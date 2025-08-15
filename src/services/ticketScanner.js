import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function processTicket(imageFile, user) {
  console.log('Intentando con Google AI...')
  
  try {
    // Get API key from localStorage
    const apiKey = localStorage.getItem('gemini_api_key')
    console.log('API Key recuperada:', apiKey ? apiKey.slice(0, 10) + '...' + apiKey.slice(-4) : 'NO ENCONTRADA')
    
    if (!apiKey) {
      throw new Error('API key no configurada')
    }

    // Procesar imagen directamente sin subirla a Storage (evita problemas de CORS)
    console.log('Procesando imagen localmente para evitar CORS...')

    // Initialize Google AI
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    console.log('Modelo Gemini inicializado correctamente')

    // Create prompt for ticket analysis
    const prompt = `
    Analiza esta imagen de un ticket/receipt y extrae la siguiente información en formato JSON:
    
    {
      "establishment": "nombre del establecimiento",
      "amount": "monto total (formato: 12.34)",
      "date": "fecha en formato YYYY-MM-DD",
      "suggestedCategory": "categoría sugerida (food, transport, entertainment, shopping, health, education, other)",
      "description": "descripción breve del gasto",
      "items": [
        {
          "name": "nombre del artículo",
          "price": "precio (formato: 12.34)"
        }
      ]
    }
    
    Reglas CRÍTICAS para decimales:
    - Para amount y price: usa formato decimal con punto (ej: 12.34, no 1234)
    - Si ves €12,34 o 12,34€ → convierte a 12.34
    - Si ves €1234 sin decimales y es claramente erróneo → probablemente sea 12.34
    - NUNCA omitas decimales en precios reales
    - Si no estás seguro del decimal, usa tu mejor juicio basado en el contexto
    
    Otras reglas:
    - Si no puedes detectar algo, usa null
    - Para suggestedCategory, usa solo: food, transport, entertainment, shopping, health, education, other
    - Para date, si no hay fecha usa la fecha actual
    - Para items, incluye solo si puedes identificar artículos individuales
    - Responde SOLO con el JSON válido, sin texto adicional
    `

    // Convert image to base64 for API
    const base64Image = await fileToBase64(imageFile)
    const imagePart = {
      inlineData: {
        data: base64Image.split(',')[1], // Remove data:image/...;base64, prefix
        mimeType: imageFile.type
      }
    }

    // Generate content
    const result = await model.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text()

    // Parse JSON response
    let parsedData
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0])
      } else {
        parsedData = JSON.parse(text)
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      throw new Error('Error procesando la respuesta de la IA')
    }

    // Validate and clean data
    const cleanedData = {
      establishment: parsedData.establishment || null,
      amount: parsedData.amount ? parseFloat(String(parsedData.amount).replace(',', '.')) : null,
      date: parsedData.date || new Date().toISOString().split('T')[0],
      suggestedCategory: parsedData.suggestedCategory || 'other',
      description: parsedData.description || null,
      items: Array.isArray(parsedData.items) ? parsedData.items.map(item => ({
        ...item,
        price: item.price ? parseFloat(String(item.price).replace(',', '.')) : item.price
      })) : []
    }

    return cleanedData

  } catch (error) {
    console.error('Error in processTicket:', error)
    
    // Mensajes de error más específicos
    if (error.message?.includes('CORS')) {
      throw new Error('Error de configuración CORS. Procesando sin subir imagen...')
    } else if (error.message?.includes('API key expired') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error('API key de Google AI expirada o inválida. Actualízala en Configuración.')
    } else if (error.message?.includes('API key')) {
      throw new Error('API key de Google AI no configurada. Ve a Configuración.')
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      throw new Error('Cuota de API excedida. Intenta más tarde.')
    } else {
      throw new Error(`Error procesando ticket: ${error.message}`)
    }
  }
}

// Helper function to convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

/**
 * Categoriza automáticamente un gasto basado en los datos extraídos
 */
export function categorizeFromTicket(ticketData) {
  const { description, merchant, items } = ticketData
  const text = `${description || ''} ${merchant || ''} ${items?.map(item => item.name).join(' ') || ''}`.toLowerCase()
  
  // Patrones para categorización
  const patterns = {
    food: [
      /restaurante|bar|café|cafeteria|pizzeria|hamburguesa|kebab|sushi|comida|aliment|supermercado|carrefour|mercadona|lidl|aldi|dia|eroski|consum|hipercor|el corte ingles|food|restaurant|cafe|pizza|burger|kebab|sushi|meal|grocery|supermarket/i
    ],
    transport: [
      /taxi|uber|cabify|metro|bus|autobús|renfe|ave|tren|gasolina|gas|parking|estacionamiento|transport|uber|cabify|metro|bus|train|gasoline|parking/i
    ],
    entertainment: [
      /cine|película|teatro|concierto|disco|pub|club|museo|parque|atracción|entertainment|movie|theater|concert|club|museum|park|attraction/i
    ],
    shopping: [
      /ropa|zapatos|tienda|compras|shopping|clothes|shoes|store|mall|centro comercial|zara|h&m|mango|pull&bear|bershka|stradivarius|massimo dutti|uniqlo|nike|adidas|puma|converse|vans|timberland|dr martens|clarks|geox|camper|desigual|mango|zara|h&m|pull&bear|bershka|stradivarius|massimo dutti|uniqlo|nike|adidas|puma|converse|vans|timberland|dr martens|clarks|geox|camper|desigual/i
    ],
    health: [
      /farmacia|medicina|doctor|médico|hospital|clínica|dentista|fisio|fisioterapia|pharmacy|medicine|doctor|hospital|clinic|dentist|physio|physiotherapy/i
    ],
    education: [
      /libro|curso|universidad|colegio|escuela|academia|formación|education|book|course|university|school|academy|training/i
    ]
  }
  
  // Buscar coincidencias
  for (const [category, categoryPatterns] of Object.entries(patterns)) {
    for (const pattern of categoryPatterns) {
      if (pattern.test(text)) {
        return category
      }
    }
  }
  
  // Si no hay coincidencias, usar 'other'
  return 'other'
}
