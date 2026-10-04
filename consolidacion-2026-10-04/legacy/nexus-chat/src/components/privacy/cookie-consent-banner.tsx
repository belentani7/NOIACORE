'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Cookie, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';

const CONSENT_KEY = 'nexus-ai-cookie-consent';
const POLICY_VERSION = '1.0';

interface ConsentData {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  marketing: boolean;
  consentDate: string;
  policyVersion: string;
}

export function CookieConsentBanner() {
  // Lazy initializer - verifica consentimiento solo en cliente
  const [showBanner, setShowBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const stored = localStorage.getItem(CONSENT_KEY);
      if (!stored) return true;
      const data = JSON.parse(stored) as ConsentData;
      return data.policyVersion !== POLICY_VERSION;
    } catch {
      return true;
    }
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const [prefs, setPrefs] = useState({
    necessary: true,
    preferences: false,
    analytics: false,
    marketing: false,
  });

  const saveConsent = async (consent: typeof prefs) => {
    const data: ConsentData = {
      ...consent,
      necessary: true,
      consentDate: new Date().toISOString(),
      policyVersion: POLICY_VERSION,
    };

    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(data));

      await fetch('/api/cookie-consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      toast.success('Preferencias de cookies guardadas');
    } catch {
      toast.success('Preferencias de cookies guardadas');
    }

    setShowBanner(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      preferences: true,
      analytics: true,
      marketing: true,
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      preferences: false,
      analytics: false,
      marketing: false,
    });
  };

  const handleSavePreferences = () => {
    saveConsent(prefs);
  };

  if (!showBanner) return null;

  return (
    <>
      {!showPreferences && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom duration-300">
          <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card/95 backdrop-blur-md shadow-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Cookie className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  Tu privacidad es importante
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Usamos cookies para mejorar tu experiencia. Las{' '}
                  <strong>técnicas</strong> son necesarias para el
                  funcionamiento. Las de{' '}
                  <strong>preferencias, analíticas y marketing</strong>{' '}
                  requieren tu consentimiento (RGPD, LOPDGDD). Puedes cambiar
                  tu elección en cualquier momento.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button size="sm" onClick={handleAcceptAll} className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Aceptar todo
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRejectAll}
                  >
                    Solo necesarias
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowPreferences(true)}
                    className="gap-1.5"
                  >
                    <Info className="h-3.5 w-3.5" />
                    Personalizar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Cookie className="h-5 w-5 text-primary" />
              Preferencias de Cookies
            </DialogTitle>
            <DialogDescription>
              Personaliza qué cookies quieres permitir. Cumplimiento RGPD /
              LOPDGDD (España).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">Técnicas (Necesarias)</Label>
                <p className="text-xs text-muted-foreground">
                  Funcionamiento básico, seguridad, autenticación. No se pueden
                  desactivar.
                </p>
              </div>
              <Switch checked disabled />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">Preferencias</Label>
                <p className="text-xs text-muted-foreground">
                  Recordar idioma, tema (claro/oscuro), configuración de la
                  interfaz.
                </p>
              </div>
              <Switch
                checked={prefs.preferences}
                onCheckedChange={(v) =>
                  setPrefs((p) => ({ ...p, preferences: v }))
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">Analíticas</Label>
                <p className="text-xs text-muted-foreground">
                  Estadísticas de uso anónimas para mejorar el servicio.
                </p>
              </div>
              <Switch
                checked={prefs.analytics}
                onCheckedChange={(v) =>
                  setPrefs((p) => ({ ...p, analytics: v }))
                }
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
              <div className="space-y-0.5 flex-1">
                <Label className="text-sm font-medium">Marketing</Label>
                <p className="text-xs text-muted-foreground">
                  Personalización de contenido y publicidad. No vendemos tus
                  datos.
                </p>
              </div>
              <Switch
                checked={prefs.marketing}
                onCheckedChange={(v) =>
                  setPrefs((p) => ({ ...p, marketing: v }))
                }
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleRejectAll}>
              Rechazar todo
            </Button>
            <Button variant="outline" size="sm" onClick={handleAcceptAll}>
              Aceptar todo
            </Button>
            <Button size="sm" onClick={handleSavePreferences}>
              Guardar preferencias
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
