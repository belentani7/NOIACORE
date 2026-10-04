'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader, CheckCircle2, AlertCircle, Zap, DollarSign } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ExecutionResult {
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  subtasks: Array<{ description: string; agent: string }>;
  results?: Array<{ subtask: string; agent: string; result: string; tokensUsed: number; cost: number }>;
  totalCost?: number;
  totalTokens?: number;
  error?: string;
}

export function TaskExecutor() {
  const [prompt, setPrompt] = useState('');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Escribe una tarea');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const { taskId: id } = await res.json();
      setTaskId(id);

      // Poll for results
      let attempts = 0;
      const maxAttempts = 180; // 6 minutes

      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          const checkRes = await fetch(`/api/tasks?id=${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (checkRes.ok) {
            const task = await checkRes.json();
            setResult(task);

            if (task.status !== 'running' && task.status !== 'pending') {
              clearInterval(pollInterval);
              setLoading(false);
            }
          }
        } catch (e) {
          console.error('Poll error:', e);
        }

        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setError('Timeout: tarea tardó demasiado');
          setLoading(false);
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Ejecutor de Tareas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe tu tarea compleja (ej: Crea un dashboard de análisis con Next.js, Recharts y autenticación)"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-slate-800 border-purple-500/20 text-white placeholder-gray-500 min-h-24"
            disabled={loading}
          />

          <Button
            onClick={handleExecute}
            disabled={loading || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-600 hover:from-purple-700 hover:to-orange-700 text-white font-bold"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Ejecutando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Ejecutar
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-3 flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-white">Resultado</CardTitle>
              <p className="text-xs text-gray-400 mt-1">ID: {result.taskId}</p>
            </div>
            {result.status === 'completed' && (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Completado
              </Badge>
            )}
            {result.status === 'running' && (
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                <Loader className="w-3 h-3 mr-1 animate-spin" />
                En progreso
              </Badge>
            )}
            {result.status === 'failed' && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                <AlertCircle className="w-3 h-3 mr-1" />
                Error
              </Badge>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {result.results && result.results.length > 0 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 p-3 rounded border border-purple-500/20">
                    <p className="text-xs text-gray-400">Costo Total</p>
                    <p className="text-lg font-bold text-orange-400 flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {result.totalCost?.toFixed(4) || '0.00'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded border border-purple-500/20">
                    <p className="text-xs text-gray-400">Tokens Usados</p>
                    <p className="text-lg font-bold text-blue-400">{result.totalTokens || 0}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {result.results.map((r, i) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded border border-gray-700 text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-white">{r.agent}</p>
                        <span className="text-xs text-gray-400">${r.cost.toFixed(4)}</span>
                      </div>
                      <p className="text-gray-300 text-xs mb-2">{r.subtask.slice(0, 80)}...</p>
                      <pre className="bg-slate-900 p-2 rounded text-xs overflow-auto max-h-32 text-green-400 border border-gray-800">
                        {r.result.slice(0, 500)}
                      </pre>
                    </div>
                  ))}
                </div>
              </>
            )}

            {result.error && (
              <div className="bg-red-500/10 p-3 rounded border border-red-500/30">
                <p className="text-red-300 text-sm">{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
