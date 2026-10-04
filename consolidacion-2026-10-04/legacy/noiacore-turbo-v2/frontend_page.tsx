'use client';

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ChatMessage {
  type: 'user' | 'ai';
  text: string;
}

interface LeadResponse {
  lead_id: string;
  reply: string;
  slug?: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      type: 'ai',
      text: '¡Hola! 👋 Soy SAIPS, tu asistente de servicios locales en Pubilla Cases. ¿Qué necesitas hoy?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [showForm, setShowForm] = useState(true);
  const [pendingService, setPendingService] = useState<string | null>(null);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { type: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post<LeadResponse>(`${API_URL}/api/leads`, {
        phone,
        name,
        message: input,
        channel: 'web',
      });

      const aiMsg: ChatMessage = { type: 'ai', text: response.data.reply };
      setMessages((prev) => [...prev, aiMsg]);

      if (response.data.slug) {
        setPendingService(response.data.slug);
      }
    } catch (error) {
      const errorMsg: ChatMessage = {
        type: 'ai',
        text: 'Error procesando tu solicitud. Intenta de nuevo.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!pendingService || !phone) {
      alert('Completa todos los datos');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/orders`, {
        phone,
        name,
        service_slug: pendingService,
      });

      const checkoutUrl = response.data.checkout_url;
      window.location.href = checkoutUrl;
    } catch (error) {
      alert('Error creando pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-blue-900">BarriServei AI</h1>
          <p className="text-sm text-blue-700 mt-1">Servicios locales verificados en Pubilla Cases</p>
        </div>

        {/* Chat */}
        <div className="bg-white rounded-2xl shadow-2xl flex flex-col h-[500px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg text-sm ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-center text-gray-500 text-xs">SAIPS está pensando...</div>}
          </div>

          {/* Input */}
          <div className="border-t p-4 space-y-3">
            {showForm && (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Tu teléfono"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setShowForm(false)}
                  className="w-full bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700"
                >
                  Continuar
                </button>
              </div>
            )}

            {!showForm && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Cuéntame qué necesitas..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Enviar
                </button>
              </div>
            )}

            {pendingService && (
              <button
                onClick={handleCreateOrder}
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-bold"
              >
                {loading ? 'Procesando...' : 'Ir al Pago (Seguro)'}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-blue-700">
          <p>Pago 100% seguro con Stripe • Dinero en garantía hasta completar</p>
        </div>
      </div>
    </main>
  );
}
