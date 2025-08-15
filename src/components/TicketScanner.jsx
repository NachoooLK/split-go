import React, { useState, useRef } from 'react'
import { X, Upload, Camera, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { processTicket } from '../services/ticketScanner'
import { processTicketLocal } from '../services/localOCR'

function TicketScanner({ user, onDataExtracted, onClose }) {
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [actualMethod, setActualMethod] = useState(null)
  const [extractedData, setExtractedData] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFileInput = (e) => {
    e.stopPropagation()
    const file = e.target.files[0]
    console.log('Archivo seleccionado:', file)
    if (file) {
      console.log('Procesando archivo:', file.name, 'Tamaño:', file.size, 'Tipo:', file.type)
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('Imagen cargada para preview')
        setImagePreview(e.target.result)
      }
      reader.readAsDataURL(file)
      setError(null)
      setExtractedData(null)
    }
    // Reset input value to allow re-selecting the same image
    e.target.value = ''
  }

  const handleProcessTicket = async () => {
    if (!selectedImage) {
      console.log('❌ No hay imagen seleccionada')
      return
    }

    console.log('🚀 Iniciando procesamiento de ticket...')
    setIsProcessing(true)
    setError(null)
    setOcrProgress(0)
    setActualMethod(null)

    try {
      // Try AI first if available
      const geminiApiKey = localStorage.getItem('gemini_api_key')
      console.log('🔑 API Key disponible:', !!geminiApiKey)
      console.log('👤 Usuario disponible:', !!user)
      
      if (geminiApiKey && user) {
        try {
          console.log('🤖 Intentando procesamiento con IA...')
          setActualMethod('AI')
          const data = await processTicket(selectedImage, user)
          console.log('✅ IA procesamiento exitoso:', data)
          setExtractedData(data)
          setActualMethod('AI')
          return
        } catch (aiError) {
          console.log('❌ AI processing failed, falling back to local OCR:', aiError)
          setError(`IA falló: ${aiError.message}. Usando OCR local...`)
          // Clear error after 2 seconds to show OCR progress
          setTimeout(() => setError(null), 2000)
          // Continue to local fallback
        }
      } else {
        console.log('⚠️ Saltando IA - falta API key o usuario')
      }

      // Fallback to local OCR
      console.log('🔍 Iniciando OCR local...')
      setActualMethod('local-ocr')
      const data = await processTicketLocal(selectedImage, (progress) => {
        console.log(`📊 Progreso OCR: ${progress}%`)
        setOcrProgress(progress)
      })
      console.log('✅ OCR local exitoso:', data)
      setExtractedData(data)
      setActualMethod('local-ocr')
    } catch (err) {
      console.error('❌ Error final procesando ticket:', err)
      setError(err.message || 'Error procesando el ticket')
      setActualMethod(null)
    } finally {
      setIsProcessing(false)
      setOcrProgress(0)
    }
  }

  const handleUseData = () => {
    if (extractedData) {
      onDataExtracted(extractedData)
      onClose()
    }
  }

  const handleRetake = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setExtractedData(null)
    setError(null)
    setActualMethod(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
            Escanear Ticket
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                  Procesamiento Inteligente
                </h3>
                <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                  Primero intenta con IA (más preciso), si falla usa OCR local (gratuito)
                </p>
              </div>
            </div>
          </div>

                     {/* Image Selection */}
           {!selectedImage ? (
             <div className="space-y-4">
               <p className="text-slate-600 dark:text-gray-400 text-center text-sm">
                 Selecciona una imagen del ticket para extraer automáticamente la información del gasto
               </p>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {/* Camera Button */}
                 <button
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     cameraInputRef.current?.click()
                   }}
                   className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                 >
                   <Camera className="w-8 h-8 text-slate-400 dark:text-gray-500 mb-2" />
                   <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Tomar Foto</span>
                   <span className="text-xs text-slate-500 dark:text-gray-400 mt-1">Usar cámara</span>
                 </button>

                 {/* Gallery Button */}
                 <button
                   onClick={(e) => {
                     e.preventDefault()
                     e.stopPropagation()
                     fileInputRef.current?.click()
                   }}
                   className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-xl hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                 >
                   <Upload className="w-8 h-8 text-slate-400 dark:text-gray-500 mb-2" />
                   <span className="text-sm font-medium text-slate-700 dark:text-gray-300">Seleccionar de Galería</span>
                   <span className="text-xs text-slate-500 dark:text-gray-400 mt-1">PNG, JPG hasta 10MB</span>
                 </button>
               </div>

               {/* Hidden Inputs */}
               <input
                 ref={cameraInputRef}
                 type="file"
                 accept="image/*"
                 capture="environment"
                 onChange={handleFileInput}
                 className="hidden"
               />
               <input
                 ref={fileInputRef}
                 type="file"
                 accept="image/*"
                 onChange={handleFileInput}
                 className="hidden"
               />
             </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview */}
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Ticket preview"
                  className="w-full h-48 object-cover rounded-xl border border-slate-200 dark:border-gray-600"
                />
                <button
                  onClick={handleRetake}
                  className="absolute top-2 right-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-600 dark:text-gray-400" />
                </button>
              </div>

              {/* Process Button */}
              <button
                onClick={handleProcessTicket}
                disabled={isProcessing}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {actualMethod === 'AI' ? 'Procesando con IA...' : 
                       actualMethod === 'local-ocr' ? `Procesando localmente... ${ocrProgress}%` : 
                       'Procesando...'}
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    <span>Procesar Ticket</span>
                  </>
                )}
              </button>

              {/* Progress Bar */}
              {isProcessing && actualMethod === 'local-ocr' && (
                <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                </div>
              )}

              {/* Extracted Data */}
              {extractedData && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">
                        Datos extraídos {actualMethod === 'AI' ? '(IA)' : '(OCR local)'}
                      </span>
                    </div>
                    
                    {actualMethod === 'local-ocr' && (
                      <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          ⚠️ Usando OCR local. Los resultados pueden ser menos precisos que la IA.
                        </p>
                      </div>
                    )}

                    <div className="space-y-2 text-sm">
                      {extractedData.establishment && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Establecimiento:</span>
                          <span className="ml-2 text-slate-600 dark:text-gray-400">{extractedData.establishment}</span>
                        </div>
                      )}
                      {extractedData.amount && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Monto:</span>
                          <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">€{extractedData.amount}</span>
                        </div>
                      )}
                      {extractedData.date && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Fecha:</span>
                          <span className="ml-2 text-slate-600 dark:text-gray-400">{extractedData.date}</span>
                        </div>
                      )}
                      {extractedData.suggestedCategory && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Categoría sugerida:</span>
                          <span className="ml-2 text-slate-600 dark:text-gray-400">{extractedData.suggestedCategory}</span>
                        </div>
                      )}
                      {extractedData.description && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Descripción:</span>
                          <span className="ml-2 text-slate-600 dark:text-gray-400">{extractedData.description}</span>
                        </div>
                      )}
                      {extractedData.items && extractedData.items.length > 0 && (
                        <div>
                          <span className="font-medium text-slate-700 dark:text-gray-300">Artículos:</span>
                          <div className="ml-2 mt-1 space-y-1">
                            {extractedData.items.map((item, index) => (
                              <div key={index} className="text-xs text-slate-600 dark:text-gray-400">
                                {item.name} - €{item.price}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleUseData}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    >
                      Usar Datos
                    </button>
                    <button
                      onClick={handleRetake}
                      className="flex-1 bg-slate-200 dark:bg-gray-700 text-slate-700 dark:text-gray-300 py-2 px-4 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Volver a Intentar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TicketScanner
