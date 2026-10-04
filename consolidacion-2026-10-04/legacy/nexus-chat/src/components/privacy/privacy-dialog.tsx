'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/store/chat-store';
import { toast } from 'sonner';
import {
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  FileText,
  UserCog,
  Scroll,
  Scale,
} from 'lucide-react';

export function PrivacyDialog() {
  const open = useChatStore((s) => s.privacyOpen);
  const setOpen = useChatStore((s) => s.setPrivacyOpen);
  const loadConversations = useChatStore((s) => s.loadConversations);

  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportData, setExportData] = useState<unknown>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/privacy');
      const data = await res.json();
      setExportData(data);

      // Descargar como JSON
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-ai-datos-personales-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Datos exportados (RGPD art. 20 - Portabilidad)');
    } catch {
      toast.error('Error al exportar datos');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/privacy?confirm=DELETE_EVERYTHING', {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Todos tus datos han sido eliminados (RGPD art. 17)');
      setShowDeleteConfirm(false);
      setOpen(false);
      await loadConversations();
      // Recargar la página para limpiar el estado
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar datos');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Shield className="h-5 w-5 text-primary" />
              Centro de Privacidad
            </DialogTitle>
            <DialogDescription>
              Tus derechos según RGPD (UE 2016/679) y LOPDGDD (España).
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 -mx-1 px-1">
            <div className="space-y-4 pb-2">
              {/* Derechos RGPD */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
                  <Scale className="h-4 w-4 text-primary" />
                  Tus Derechos (RGPD)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <FileText className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Art. 15 - Acceso:</span>{' '}
                      <span className="text-muted-foreground">Ver tus datos</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Download className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Art. 20 - Portabilidad:</span>{' '}
                      <span className="text-muted-foreground">Exportar datos</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Trash2 className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Art. 17 - Supresión:</span>{' '}
                      <span className="text-muted-foreground">Derecho al olvido</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <UserCog className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <span className="font-medium">Art. 7 - Consentimiento:</span>{' '}
                      <span className="text-muted-foreground">Retirar consentimiento</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exportar datos */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      Exportar tus datos
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Descarga todos tus datos en formato JSON (conversaciones,
                      mensajes, configuración, marcadores). Cumple con RGPD art.
                      20 (portabilidad).
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={handleExport}
                    disabled={exporting}
                    className="gap-1.5 shrink-0"
                  >
                    {exporting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Política de retención */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Scroll className="h-4 w-4 text-primary" />
                  Política de Retención
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Tus datos se conservan durante <strong>365 días</strong> de
                  inactividad. Tras este periodo, se eliminan automáticamente
                  (RGPD art. 5(1)(e) - limitación de conservación). Los logs de
                  auditoría se conservan por motivos de seguridad según el
                  Esquema Nacional de Seguridad (ENS).
                </p>
              </div>

              {/* Zona peligrosa - Borrar todo */}
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Zona Peligrosa
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Elimina <strong>permanentemente</strong> todos tus datos:
                  conversaciones, mensajes, marcadores, reacciones,
                  configuración. Esta acción <strong>no se puede deshacer</strong>.
                  Cumple con RGPD art. 17 (derecho al olvido).
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar todos mis datos
                </Button>
              </div>

              {/* Contacto DPO */}
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Delegado de Protección de Datos (DPO):</strong>{' '}
                  dpo@nexus-ai.es
                  <br />
                  Para ejercer tus derechos: AEPD{' '}
                  <a
                    href="https://www.aepd.es"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    www.aepd.es
                  </a>
                </p>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmación de borrado */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Confirmar eliminación completa?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar <strong>permanentemente</strong> todos
              tus datos. Esta acción no se puede deshacer. Se perderán todas tus
              conversaciones, mensajes, marcadores y configuración.
              <br />
              <br />
              <strong>Jurisdicción:</strong> RGPD art. 17 - Derecho de
              supresión. Esta solicitud se registrará en el log de auditoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90 gap-1.5"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Sí, eliminar todo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
