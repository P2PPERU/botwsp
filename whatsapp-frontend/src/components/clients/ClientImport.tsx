// src/components/clients/ClientImport.tsx
import React, { useState } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';

interface ClientImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: Array<{
    data?: any;
    error: string;
  }>;
}

export function ClientImport({ onSuccess, onCancel }: ClientImportProps) {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Por favor selecciona un archivo CSV');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Validar headers
      const requiredHeaders = ['name', 'phone', 'service'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        alert(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
        return;
      }

      // Procesar datos
      const clients = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const client: any = {};
          
          headers.forEach((header, index) => {
            client[header] = values[index] || '';
          });
          
          // Calcular estado si no viene
          if (!client.status && client.expiry) {
            const daysToExpiry = Math.floor(
              (new Date(client.expiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );
            client.status = daysToExpiry < 0 ? 'expired' : 
                           daysToExpiry <= 3 ? 'expiring' : 'active';
          }
          
          return client;
        });

      // Importar a través de la API
      const response = await api.clients.importClients({ clients });
      setResults(response);
      
    } catch (error) {
      console.error('Error importing clients:', error);
      alert('Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      ['name', 'phone', 'service', 'plan', 'expiry', 'status'],
      ['Juan Pérez', '51987654321', 'Netflix Premium', 'Familiar', '2025-06-30', 'active'],
      ['María García', '51923456789', 'Disney+ Familiar', 'Premium', '2025-05-30', 'expiring']
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_clientes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {!results ? (
        <>
          {/* Instrucciones */}
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900">Instrucciones de importación</h3>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• El archivo debe ser en formato CSV</li>
                  <li>• Columnas requeridas: name, phone, service</li>
                  <li>• Columnas opcionales: plan, expiry, status</li>
                  <li>• Máximo 500 clientes por importación</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Plantilla */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              icon={<Download className="w-4 h-4" />}
            >
              Descargar Plantilla CSV
            </Button>
          </div>

          {/* Área de drop */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Arrastra tu archivo CSV aquí
            </p>
            <p className="text-gray-600 mb-4">
              o haz clic para seleccionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload" className="cursor-pointer">
              <Button
                variant="outline"
                icon={<Upload className="w-4 h-4" />}
                disabled={loading}
                type="button"
              >
                {loading ? 'Procesando...' : 'Seleccionar archivo'}
              </Button>
            </label>
          </div>
        </>
      ) : (
        /* Resultados */
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Resultados de la importación
          </h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{results.imported}</p>
              <p className="text-sm text-green-700">Importados</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center border border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{results.skipped}</p>
              <p className="text-sm text-yellow-700">Omitidos</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
              <div className="flex items-center justify-center mb-2">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-600">{results.errors?.length || 0}</p>
              <p className="text-sm text-red-700">Errores</p>
            </div>
          </div>

          {/* Resumen de la importación */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>✅ <strong>{results.imported} clientes</strong> importados correctamente</p>
              {results.skipped > 0 && (
                <p>⚠️ <strong>{results.skipped} clientes</strong> omitidos (ya existían)</p>
              )}
              {results.errors && results.errors.length > 0 && (
                <p>❌ <strong>{results.errors.length} errores</strong> encontrados</p>
              )}
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <h4 className="font-medium text-red-900 mb-2">Errores encontrados:</h4>
              <ul className="text-sm text-red-700 space-y-1 max-h-40 overflow-y-auto">
                {results.errors.slice(0, 10).map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span>{error.error}</span>
                  </li>
                ))}
                {results.errors.length > 10 && (
                  <li className="text-red-600 font-medium">
                    ... y {results.errors.length - 10} errores más
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Botones */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          variant="outline" 
          onClick={onCancel}
          disabled={loading}
        >
          {results ? 'Cerrar' : 'Cancelar'}
        </Button>
        {results && results.imported > 0 && (
          <Button onClick={onSuccess}>
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}