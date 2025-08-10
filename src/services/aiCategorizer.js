// AI-powered expense categorization using Google Gemini or OpenAI

const CATEGORY_KEYS = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'other']

let abortController = null

async function getGeminiClient() {
  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) return null
    return new GoogleGenerativeAI(apiKey)
  } catch (error) {
    console.warn('Failed to import Gemini AI:', error)
    return null
  }
}

async function getOpenAIClient() {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) return null
    return { apiKey }
  } catch (error) {
    console.warn('Failed to setup OpenAI:', error)
    return null
  }
}

export async function classifyCategoryAI(description) {
  // Abort previous request if still pending
  if (abortController) {
    abortController.abort()
  }
  
  abortController = new AbortController()
  const signal = abortController.signal

  if (!description?.trim()) {
    return 'other'
  }

  try {
    // Try Gemini first
    const gemini = await getGeminiClient()
    if (gemini) {
      return await classifyWithGemini(gemini, description, signal)
    }

    // Fallback to OpenAI
    const openai = await getOpenAIClient()
    if (openai) {
      return await classifyWithOpenAI(openai, description, signal)
    }

    // Fallback to heuristic classification
    console.warn('No AI API available, using heuristic fallback')
    return classifyWithHeuristic(description)

  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Classification request aborted')
      throw error
    }
    console.warn('AI classification failed, using heuristic fallback:', error)
    return classifyWithHeuristic(description)
  }
}

async function classifyWithGemini(gemini, description, signal) {
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
  
  const prompt = `Clasifica el siguiente gasto en una de estas categorías exactas: ${CATEGORY_KEYS.join(', ')}.
Responde SOLO con la palabra de la categoría, sin explicaciones.

Categorías:
- food: comida, restaurantes, supermercado, bebidas
- transport: transporte, gasolina, taxi, metro, bus
- entertainment: ocio, cine, streaming, juegos
- shopping: compras, ropa, tiendas, productos
- bills: facturas, servicios, alquiler, seguros
- other: cualquier otro gasto que no encaje

Gasto: "${description}"`

  const result = await model.generateContent(prompt)
  const response = result?.response?.text?.()?.trim?.().toLowerCase()
  
  if (signal.aborted) {
    throw new Error('AbortError')
  }
  
  return CATEGORY_KEYS.includes(response) ? response : 'other'
}

async function classifyWithOpenAI(openai, description, signal) {
  const prompt = `Clasifica el siguiente gasto en una de estas categorías exactas: ${CATEGORY_KEYS.join(', ')}.
Responde SOLO con la palabra de la categoría, sin explicaciones.

Categorías:
- food: comida, restaurantes, supermercado, bebidas
- transport: transporte, gasolina, taxi, metro, bus
- entertainment: ocio, cine, streaming, juegos
- shopping: compras, ropa, tiendas, productos
- bills: facturas, servicios, alquiler, seguros
- other: cualquier otro gasto que no encaje

Gasto: "${description}"`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openai.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.1,
    }),
    signal
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  const category = data.choices?.[0]?.message?.content?.trim?.().toLowerCase()
  
  return CATEGORY_KEYS.includes(category) ? category : 'other'
}

function classifyWithHeuristic(description) {
  const RULES = [
    { key: 'food', words: ['restaurante','mcdonald','burger','pizza','comida','almuerzo','cena','kebab','bar','café','cafe','supermercado'] },
    { key: 'transport', words: ['uber','taxi','metro','bus','gasolina','parking','peaje','tren','renfe','avion','vuelo'] },
    { key: 'entertainment', words: ['netflix','spotify','cine','juego','concierto','ocio','hbo','disney','steam'] },
    { key: 'shopping', words: ['amazon','zara','ropa','tienda','compra','mercadona','carrefour','aliexpress'] },
    { key: 'bills', words: ['luz','agua','gas','internet','telefono','teléfono','seguro','alquiler','fibra','movil','móvil'] },
  ]

  const lowered = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.words.some(w => lowered.includes(w))) {
      return rule.key
    }
  }
  return 'other'
}
