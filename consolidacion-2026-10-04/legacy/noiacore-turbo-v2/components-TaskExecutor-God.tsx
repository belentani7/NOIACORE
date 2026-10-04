'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader, CheckCircle2, AlertCircle, Zap, DollarSign, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface TaskResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  prompt: string;
  result?: string;
  error?: string;
  cost?: number;
  tokensUsed?: number;
  completedAt?: string;
}

export function TaskExecutorGod() {
  const [prompt, setPrompt] = useState('');
  const [tasks, setTasks] = useState<Map<string, TaskResult>>(new Map());
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [queueStats, setQueueStats] = useState({ active: 0, pending: 0, completed: 0, failed: 0 });
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${wsProtocol}//localhost:3001/ws?token=${token}`);

    ws.onopen = () => {
      setWsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const { channel, data } = JSON.parse(event.data);

      if (channel === 'task:updates') {
        setTasks(prev => {
          const updated = new Map(prev);
          const task = updated.get(data.taskId) || { id: data.taskId, status: 'pending', prompt: '' };
          task.status = data.status;
          if (data.cost) task.cost = data.cost;
          if (data.result) task.result = JSON.stringify(data.result);
          if (data.error) task.error = data.error;
          updated.set(data.taskId, task);
          return updated;
        });
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [token]);

  // Poll queue stats
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/tasks?action=queue', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          setQueueStats(await res.json());
        }
      } catch (e) {
        console.error('Queue stats error:', e);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token]);

  const handleExecute = async () => {
    if (!prompt.trim()) {
      setError('Escribe una tarea');
      return;
    }

    setError(null);

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
        const { error } = await res.json();
        throw new Error(error);
      }

      const { taskId } = await res.json();
      setActiveTaskId(taskId);
      setTasks(prev => new Map(prev).set(taskId, {
        id: taskId,
        status: 'pending',
        prompt
      }));
      setPrompt('');

      // Subscribe via WebSocket
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'subscribe', taskId }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    }
  };

  const currentTask = activeTaskId ? tasks.get(activeTaskId) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {wsConnected ? (
          <Badge className="bg-emerald-500/20 text-emerald-400">
            <Wifi className="w-3 h-3 mr-1" /> Live
          </Badge>
        ) : (
          <Badge className="bg-gray-500/20 text-gray-400">
            <WifiOff className="w-3 h-3 mr-1" /> Offline
          </Badge>
        )}
        <Badge>Active: {queueStats.active} | Queued: {queueStats.pending}</Badge>
      </div>

      <Card className="bg-slate-900/50 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white">Ejecutor de Tareas (God Mode)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Describe tu tarea..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="bg-slate-800 border-purple-500/20 text-white min-h-24"
          />

          <Button
            onClick={handleExecute}
            disabled={!wsConnected || !prompt.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-orange-600"
          >
            <Zap className="w-4 h-4 mr-2" /> Ejecutar
          </Button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {currentTask && (
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-sm">{currentTask.prompt.slice(0, 60)}...</CardTitle>
              {currentTask.status === 'completed' && (
                <Badge className="bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Completado
                </Badge>
              )}
              {currentTask.status === 'running' && (
                <Badge className="bg-blue-500/20 text-blue-400">
                  <Loader className="w-3 h-3 mr-1 animate-spin" /> En progreso
                </Badge>
              )}
              {currentTask.status === 'failed' && (
                <Badge className="bg-red-500/20 text-red-400">
                  <AlertCircle className="w-3 h-3 mr-1" /> Error
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {currentTask.status === 'running' && (
              <div className="space-y-2">
                <Progress value={50} className="bg-slate-700" />
                <p className="text-xs text-gray-400">Ejecutando...</p>
              </div>
            )}

            {currentTask.cost && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Costo</p>
                  <p className="text-sm font-bold text-orange-400">
                    <DollarSign className="w-3 h-3 inline mr-1" />
                    {currentTask.cost.toFixed(4)}
                  </p>
                </div>
                <div className="bg-slate-800/50 p-3 rounded">
                  <p className="text-xs text-gray-400">Tokens</p>
                  <p className="text-sm font-bold text-blue-400">{currentTask.tokensUsed || 0}</p>
                </div>
              </div>
            )}

            {currentTask.result && (
              <pre className="bg-slate-950 p-3 rounded text-xs overflow-auto max-h-64 text-green-400 border border-gray-800">
                {currentTask.result}
              </pre>
            )}

            {currentTask.error && (
              <div className="bg-red-500/10 p-3 rounded border border-red-500/30">
                <p className="text-red-300 text-sm">{currentTask.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tasks.size > 1 && (
        <Card className="bg-slate-900/50 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white text-sm">Historial ({tasks.size})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-auto">
              {Array.from(tasks.values()).map(task => (
                <div
                  key={task.id}
                  onClick={() => setActiveTaskId(task.id)}
                  className="p-2 rounded bg-slate-800/50 cursor-pointer hover:bg-slate-800 text-xs text-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{task.prompt.slice(0, 50)}...</span>
                    <span className={`text-xs ${task.status === 'completed' ? 'text-emerald-400' : task.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
