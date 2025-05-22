// src/components/messaging/MessageTemplates.tsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, Copy, Search, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  variables: string[];
  usageCount: number;
  createdAt: string;
}

interface MessageTemplatesProps {
  onUseTemplate: (template: string) => void;
}

export function MessageTemplates({ onUseTemplate }: MessageTemplatesProps) {
  const [templates] = useState([
    {
      id: '1',
      name: 'Saludo inicial',
      category: 'Saludos',
      content: '¡Hola! 👋 Gracias por contactarnos. ¿En qué podemos ayudarte hoy?',
      variables: [],
      usageCount: 245,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Información de precios',
      category: 'Ventas',
      content: 'Te envío nuestra lista de precios actualizada:\n\n📺 Netflix Premium: S/25\n🏰 Disney+: S/20\n📦 Prime Video: S/15\n\n¿Te interesa alguno?',
      variables: [],
      usageCount: 189,
      createdAt: new Date().toISOString()
    }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: ''
  });

  const categories = [...new Set(templates.map(t => t.category))];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.content) {
      alert('Por favor completa todos los campos');
      return;
    }

    const templateData = {
      ...formData,
      variables: extractVariables(formData.content)
    };

    if (editingTemplate) {
      onUpdateTemplate(editingTemplate.id, templateData);
    } else {
      onCreateTemplate(templateData);
    }

    setFormData({ name: '', content: '', category: '' });
    setShowCreateModal(false);
    setEditingTemplate(null);
  };

  const extractVariables = (content: string): string[] => {
    const matches = content.match(/\{(\w+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  };

  const handleEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category
    });
    setShowCreateModal(true);
  };

  const handleCopy = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    // Aquí podrías mostrar una notificación de "copiado"
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Plantillas de Mensajes</h2>
          <p className="text-gray-600">Gestiona tus plantillas de mensajes reutilizables</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Nueva Plantilla
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Buscar plantillas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>
        <div className="w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todas las categorías</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium text-gray-900">{template.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    <Tag className="w-3 h-3 mr-1" />
                    {template.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    Usado {template.usageCount} veces
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleCopy(template)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copiar"
                >
                  <Copy className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Editar"
                >
                  <Edit className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => onDeleteTemplate(template.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>

            <div className="mb-3">
              <p className="text-sm text-gray-600 line-clamp-3">{template.content}</p>
            </div>

            {template.variables.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Variables:</p>
                <div className="flex flex-wrap gap-1">
                  {template.variables.map((variable) => (
                    <span key={variable} className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                      {`{${variable}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => onUseTemplate(template.content)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Usar Plantilla
            </Button>
          </div>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No se encontraron plantillas</p>
        </div>
      )}

      {/* Modal de crear/editar */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingTemplate(null);
          setFormData({ name: '', content: '', category: '' });
        }}
        title={editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
      >
        <div className="space-y-4">
          <Input
            label="Nombre de la plantilla"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Saludo de bienvenida"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Seleccionar categoría</option>
              <option value="Saludos">Saludos</option>
              <option value="Ventas">Ventas</option>
              <option value="Soporte">Soporte</option>
              <option value="Recordatorios">Recordatorios</option>
              <option value="Promociones">Promociones</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido del mensaje
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Escribe tu plantilla aquí... Usa {variable} para variables dinámicas"
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Usa {`{nombre}`}, {`{servicio}`}, etc. para crear variables dinámicas
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              {editingTemplate ? 'Actualizar' : 'Crear'} Plantilla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}