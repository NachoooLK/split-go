const DICT = {
  es: {
    'nav.personal': 'Personal',
    'nav.groups': 'Grupos',
    'nav.analytics': 'Analytics',
    'nav.friends': 'Amigos',
    'header.settings': 'Ajustes',
    'header.logout': 'Salir',
    'settings.title': 'Ajustes',
    'settings.currency': 'Moneda',
    'settings.decimal': 'Separador decimal',
    'settings.decimal.comma': 'Coma (1.234,56)',
    'settings.decimal.dot': 'Punto (1,234.56)',
    'settings.language': 'Idioma',
    'settings.close': 'Cerrar',
    'actions.exportCsv': 'Exportar CSV',
  },
  en: {
    'nav.personal': 'Personal',
    'nav.groups': 'Groups',
    'nav.analytics': 'Analytics',
    'nav.friends': 'Friends',
    'header.settings': 'Settings',
    'header.logout': 'Logout',
    'settings.title': 'Settings',
    'settings.currency': 'Currency',
    'settings.decimal': 'Decimal separator',
    'settings.decimal.comma': 'Comma (1,234.56)',
    'settings.decimal.dot': 'Dot (1,234.56)',
    'settings.language': 'Language',
    'settings.close': 'Close',
    'actions.exportCsv': 'Export CSV',
  }
}

export function t(language, key) {
  const lang = (language === 'en' ? 'en' : 'es')
  return DICT[lang][key] || DICT.es[key] || key
}

export const LANG_OPTIONS = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
]


