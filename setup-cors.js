#!/usr/bin/env node

/**
 * Script para configurar CORS en Firebase Storage
 * Ejecutar: node setup-cors.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BUCKET_NAME = 'tricount-a6a39.appspot.com';
const CORS_FILE = 'cors.json';

console.log('🔧 Configurando CORS para Firebase Storage...');

try {
  // Verificar que el archivo cors.json existe
  if (!fs.existsSync(CORS_FILE)) {
    console.error(`❌ Archivo ${CORS_FILE} no encontrado`);
    process.exit(1);
  }

  // Aplicar configuración CORS
  console.log(`📦 Aplicando CORS al bucket: ${BUCKET_NAME}`);
  execSync(`gsutil cors set ${CORS_FILE} gs://${BUCKET_NAME}`, { stdio: 'inherit' });
  
  console.log('✅ CORS configurado exitosamente');
  console.log('🔄 Los cambios pueden tardar unos minutos en propagarse');
  
} catch (error) {
  console.error('❌ Error configurando CORS:', error.message);
  console.log('\n📋 Pasos manuales:');
  console.log('1. Instala Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  console.log('2. Ejecuta: gcloud auth login');
  console.log('3. Ejecuta: gsutil cors set cors.json gs://tricount-a6a39.appspot.com');
  process.exit(1);
}
