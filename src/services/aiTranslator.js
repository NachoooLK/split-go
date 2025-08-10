// Simple Gemini-powered translation service
// Expects an environment variable VITE_GEMINI_API_KEY

let client = null

async function getClient() {
  if (client) return client
  // Lazy import to avoid bundling issues if key not present
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY not set. Falling back to identity translator.')
    client = null
    return null
  }
  client = new GoogleGenerativeAI(apiKey)
  return client
}

// Cache translations by key+target language
const inMemoryCache = new Map()

export async function translateText({ text, to, from = 'auto' }) {
  const key = `${from}->${to}::${text}`
  if (inMemoryCache.has(key)) return inMemoryCache.get(key)

  const gemini = await getClient()
  if (!gemini) {
    inMemoryCache.set(key, text)
    return text
  }

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const prompt = `Traduce el siguiente texto al idioma destino. Responde solo con el texto traducido, sin explicaciones.
Idioma origen: ${from}
Idioma destino: ${to}
Texto:
"""
${text}
"""`
    const result = await model.generateContent(prompt)
    const translated = result?.response?.text?.() || text
    inMemoryCache.set(key, translated)
    return translated
  } catch (e) {
    console.warn('Gemini translation failed; returning original text', e)
    inMemoryCache.set(key, text)
    return text
  }
}

// Helper to translate multiple labels at once
export async function translateBulk({ entries, to, from = 'auto' }) {
  const translated = await Promise.all(entries.map(text => translateText({ text, to, from })))
  return translated
}



