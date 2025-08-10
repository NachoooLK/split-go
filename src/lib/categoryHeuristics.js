const RULES = [
  { key: 'food', words: ['restaurante','mcdonald','burger','pizza','comida','almuerzo','cena','kebab','bar','café','cafe','supermercado'] },
  { key: 'transport', words: ['uber','taxi','metro','bus','gasolina','parking','peaje','tren','renfe','avion','vuelo'] },
  { key: 'entertainment', words: ['netflix','spotify','cine','juego','concierto','ocio','hbo','disney','steam'] },
  { key: 'shopping', words: ['amazon','zara','ropa','tienda','compra','mercadona','carrefour','aliexpress'] },
  { key: 'bills', words: ['luz','agua','gas','internet','telefono','teléfono','seguro','alquiler','fibra','movil','móvil'] },
]

export function guessCategory(description) {
  if (!description) return 'other'
  const lowered = description.toLowerCase()
  for (const rule of RULES) {
    if (rule.words.some(w => lowered.includes(w))) {
      return rule.key
    }
  }
  return 'other'
}


