import { storage } from './firebase.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Servicio para manejar subidas a Firebase Storage con manejo de errores CORS
 */

export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    
    // Crear un objeto con headers adicionales para ayudar con CORS
    const metadata = {
      contentType: file.type,
      customMetadata: {
        'Access-Control-Allow-Origin': '*',
        'uploaded': new Date().toISOString()
      }
    };

    const snapshot = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return {
      success: true,
      url: downloadURL,
      path: path,
      ref: snapshot.ref
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    
    // Si es un error de CORS, devolver un mensaje más útil
    if (error.code === 'storage/unauthorized' || 
        error.message.includes('CORS') ||
        error.message.includes('Access-Control-Allow-Origin')) {
      
      return {
        success: false,
        error: 'CORS_ERROR',
        message: 'Error de configuración CORS. Por favor, configura las reglas de Firebase Storage.',
        instructions: [
          '1. Ve a Firebase Console > Storage > Rules',
          '2. Aplica las reglas del archivo storage.rules',
          '3. O ejecuta: firebase deploy --only storage'
        ]
      };
    }
    
    return {
      success: false,
      error: error.code || 'UNKNOWN_ERROR',
      message: error.message
    };
  }
};

export const uploadTicketImage = async (file, userId) => {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const path = `tickets/${userId}/${filename}`;
  
  return uploadFile(file, path);
};

export const uploadProfileImage = async (file, userId) => {
  const timestamp = Date.now();
  const filename = `${timestamp}_${file.name}`;
  const path = `profiles/${userId}/${filename}`;
  
  return uploadFile(file, path);
};
