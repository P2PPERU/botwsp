// src/components/LoadingStates.tsx
'use client';

import React from 'react';
import { Loader, MessageSquare, Users, Bot, Workflow, BarChart3, RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Loading spinner básico
export function LoadingSpinner({ size = 'md', className = '' }: LoadingStateProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

// Loading con mensaje
export function LoadingMessage({ message = 'Cargando...', size = 'md' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <LoadingSpinner size={size} />
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}

// Loading para tarjetas
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-gray-200 rounded" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        </div>
      ))}
    </>
  );
}

// Loading para tabla
export function TableSkeleton({ rows = 5, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3">
                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Loading para conversación
export function ConversationSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {/* Mensajes recibidos */}
      <div className="flex justify-start">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-gray-200 rounded-lg p-3 animate-pulse">
            <div className="h-3 bg-gray-300 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-300 rounded w-24" />
          </div>
          <div className="h-2 bg-gray-200 rounded w-16 mt-1 animate-pulse" />
        </div>
      </div>
      
      {/* Mensaje enviado */}
      <div className="flex justify-end">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-blue-100 rounded-lg p-3 animate-pulse">
            <div className="h-3 bg-blue-200 rounded w-40 mb-2" />
            <div className="h-3 bg-blue-200 rounded w-32" />
          </div>
          <div className="h-2 bg-gray-200 rounded w-16 mt-1 ml-auto animate-pulse" />
        </div>
      </div>
      
      {/* Más mensajes */}
      <div className="flex justify-start">
        <div className="max-w-xs lg:max-w-md">
          <div className="bg-gray-200 rounded-lg p-3 animate-pulse">
            <div className="h-3 bg-gray-300 rounded w-48" />
          </div>
          <div className="h-2 bg-gray-200 rounded w-16 mt-1 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

// Loading para estadísticas
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Loading personalizado por módulo
interface ModuleLoadingProps {
  module: 'dashboard' | 'messages' | 'clients' | 'workflows' | 'settings';
}

export function ModuleLoading({ module }: ModuleLoadingProps) {
  const modules = {
    dashboard: {
      icon: BarChart3,
      message: 'Cargando dashboard...',
      color: 'text-blue-600'
    },
    messages: {
      icon: MessageSquare,
      message: 'Cargando conversaciones...',
      color: 'text-green-600'
    },
    clients: {
      icon: Users,
      message: 'Cargando clientes...',
      color: 'text-purple-600'
    },
    workflows: {
      icon: Workflow,
      message: 'Cargando workflows...',
      color: 'text-indigo-600'
    },
    settings: {
      icon: Bot,
      message: 'Cargando configuración...',
      color: 'text-gray-600'
    }
  };

  const { icon: Icon, message, color } = modules[module];

  return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="relative">
        <Icon className={`w-16 h-16 ${color} opacity-20`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}

// Loading para página completa
export function PageLoading({ message = 'Cargando aplicación...' }: LoadingStateProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Bot className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">WhatsApp Hub</h2>
          <LoadingMessage message={message} />
        </div>
      </div>
    </div>
  );
}

// Estado de reconexión
interface ReconnectingStateProps {
  service: string;
  attempts: number;
  maxAttempts: number;
  onRetry?: () => void;
}

export function ReconnectingState({ service, attempts, maxAttempts, onRetry }: ReconnectingStateProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-3">
        <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Reconectando {service}...
          </h3>
          <p className="text-xs text-yellow-600 mt-1">
            Intento {attempts} de {maxAttempts}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
          >
            Reintentar ahora
          </button>
        )}
      </div>
    </div>
  );
}

// Loading inline para botones
export function ButtonLoading({ text = 'Procesando' }: { text?: string }) {
  return (
    <span className="flex items-center space-x-2">
      <LoadingSpinner size="sm" />
      <span>{text}...</span>
    </span>
  );
}

// Estado vacío con loading opcional
interface EmptyStateProps {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && (
        <div className="mt-6">
          <button
            type="button"
            onClick={action.onClick}
            disabled={action.loading}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action.loading ? <ButtonLoading text={action.label} /> : action.label}
          </button>
        </div>
      )}
    </div>
  );
}

// Exportar todo como un objeto para facilitar importación
export const LoadingStates = {
  Spinner: LoadingSpinner,
  Message: LoadingMessage,
  Card: CardSkeleton,
  Table: TableSkeleton,
  Conversation: ConversationSkeleton,
  Stats: StatsSkeleton,
  Module: ModuleLoading,
  Page: PageLoading,
  Reconnecting: ReconnectingState,
  Button: ButtonLoading,
  Empty: EmptyState
};

export default LoadingStates;