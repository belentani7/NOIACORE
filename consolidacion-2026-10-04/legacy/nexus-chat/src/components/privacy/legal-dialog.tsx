'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/store/chat-store';
import { Scale, FileText, Cookie, BookOpen } from 'lucide-react';

export function LegalDialog() {
  const open = useChatStore((s) => s.legalOpen);
  const setOpen = useChatStore((s) => s.setLegalOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Scale className="h-5 w-5 text-primary" />
            Información Legal
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="legal" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="legal" className="text-xs gap-1">
              <Scale className="h-3 w-3" />
              <span className="hidden sm:inline">Aviso Legal</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="text-xs gap-1">
              <FileText className="h-3 w-3" />
              <span className="hidden sm:inline">Privacidad</span>
            </TabsTrigger>
            <TabsTrigger value="cookies" className="text-xs gap-1">
              <Cookie className="h-3 w-3" />
              <span className="hidden sm:inline">Cookies</span>
            </TabsTrigger>
            <TabsTrigger value="terms" className="text-xs gap-1">
              <BookOpen className="h-3 w-3" />
              <span className="hidden sm:inline">Términos</span>
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 -mx-1 px-1 mt-4">
            {/* Aviso Legal */}
            <TabsContent value="legal" className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-foreground mb-2">Aviso Legal</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  En cumplimiento de la Ley 34/2002, de 11 de julio, de servicios
                  de la sociedad de la información y de comercio electrónico
                  (LSSI-CE), se informa a los usuarios sobre los siguientes
                  aspectos:
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Titular</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nexus AI es una plataforma de asistencia conversacional
                  multimedial. El responsable del tratamiento de los datos es la
                  entidad titular de la plataforma, con domicilio en Barcelona,
                  Cataluña, España.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Objeto</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  La plataforma proporciona servicios de inteligencia
                  artificial conversacional, incluyendo chat, análisis de
                  imágenes, generación de imágenes, síntesis de voz y búsqueda
                  web. El uso de la plataforma implica la aceptación de las
                  presentes condiciones.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Legislación aplicable</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Este aviso legal se rige por la legislación española. Para
                  cualquier controversia, las partes se someten a los Juzgados y
                  Tribunales de Barcelona, Cataluña, renunciando expresamente a
                  cualquier otro fuero que pudiera corresponderles.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Propiedad intelectual</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Todos los contenidos de la plataforma (diseño, código, marcas,
                  logotipos) están protegidos por derechos de propiedad
                  intelectual e industrial. El usuario retiene la propiedad de
                  los contenidos que genera.
                </p>
              </section>
            </TabsContent>

            {/* Política de Privacidad */}
            <TabsContent value="privacy" className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  Política de Privacidad
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  En cumplimiento del Reglamento (UE) 2016/679 (RGPD) y la Ley
                  Orgánica 3/2018 de Protección de Datos Personales y garantía
                  de los derechos digitales (LOPDGDD):
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Responsable del tratamiento
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nexus AI, Barcelona, España. Contacto DPO:{' '}
                  <a
                    href="mailto:dpo@nexus-ai.es"
                    className="text-primary underline"
                  >
                    dpo@nexus-ai.es
                  </a>
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Finalidad</h4>
                <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                  <li>Gestión de conversaciones y mensajes del usuario</li>
                  <li>Procesamiento de consultas mediante IA (LLM, VLM, TTS, ASR)</li>
                  <li>Generación de imágenes y búsqueda web</li>
                  <li>Mejora del servicio mediante métricas anónimas</li>
                  <li>Cumplimiento de obligaciones legales</li>
                </ul>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Legitimación
                </h4>
                <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                  <li>Consentimiento del usuario (art. 6.1.a RGPD)</li>
                  <li>Ejecución de contrato (art. 6.1.b RGPD)</li>
                  <li>Interés legítimo (art. 6.1.f RGPD)</li>
                  <li>Cumplimiento legal (art. 6.1.c RGPD)</li>
                </ul>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Conservación
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Los datos se conservan durante 365 días de inactividad. Los
                  logs de auditoría se conservan según el Esquema Nacional de
                  Seguridad (ENS).
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Derechos del usuario
                </h4>
                <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                  <li>Acceso (art. 15 RGPD)</li>
                  <li>Rectificación (art. 16 RGPD)</li>
                  <li>Supresión / Derecho al olvido (art. 17 RGPD)</li>
                  <li>Limitación del tratamiento (art. 18 RGPD)</li>
                  <li>Portabilidad (art. 20 RGPD)</li>
                  <li>Oposición (art. 21 RGPD)</li>
                  <li>Retirada del consentimiento (art. 7.3 RGPD)</li>
                </ul>
                <p className="text-xs text-muted-foreground mt-2">
                  Puedes ejercer estos derechos desde el{' '}
                  <strong>Centro de Privacidad</strong> o contactando con la
                  AEPD (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary underline">www.aepd.es</a>).
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Transferencias internacionales
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Los datos pueden ser procesados por proveedores de servicios
                  de IA ubicados fuera de la UE, bajo las garantías adecuadas
                  (cláusulas contractuales tipo, decisiones de adecuación).
                </p>
              </section>
            </TabsContent>

            {/* Política de Cookies */}
            <TabsContent value="cookies" className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  Política de Cookies
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  En cumplimiento de la LSSI-CE y el RGPD, informamos sobre el
                  uso de cookies en nuestra plataforma.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  Tipos de cookies
                </h4>
                <div className="space-y-2">
                  <div className="rounded-md border p-2">
                    <p className="text-xs font-medium text-foreground">
                      Técnicas (Necesarias)
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Funcionamiento básico, seguridad, sesión. No requieren
                      consentimiento.
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-xs font-medium text-foreground">
                      Preferencias
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Idioma, tema, configuración de interfaz.
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-xs font-medium text-foreground">
                      Analíticas
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Estadísticas de uso anónimas.
                    </p>
                  </div>
                  <div className="rounded-md border p-2">
                    <p className="text-xs font-medium text-foreground">
                      Marketing
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Personalización y publicidad.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">Gestión</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Puedes gestionar tus consentimientos desde el banner de cookies
                  o desde la configuración de tu navegador. Las cookies técnicas
                  son necesarias y no se pueden desactivar.
                </p>
              </section>
            </TabsContent>

            {/* Términos y Condiciones */}
            <TabsContent value="terms" className="space-y-4 text-sm">
              <section>
                <h3 className="font-semibold text-foreground mb-2">
                  Términos y Condiciones
                </h3>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  1. Aceptación
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El uso de Nexus AI implica la aceptación de estos términos. Si
                  no estás de acuerdo, no uses la plataforma.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  2. Uso permitido
                </h4>
                <ul className="text-xs text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
                  <li>Uso personal y profesional legítimo</li>
                  <li>Prohibido: contenido ilegal, dañino, discriminatorio</li>
                  <li>Prohibido: automatización abusiva, scraping, DDoS</li>
                  <li>Prohibido: intentar acceder a sistemas no autorizados</li>
                </ul>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  3. Limitación de responsabilidad
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  La IA puede generar contenido incorrecto. El usuario es
                  responsable de verificar la información antes de usarla. No
                  nos hacemos responsables de daños derivados del uso de la
                  plataforma.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  4. Privacidad y datos
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El tratamiento de datos se rige por nuestra Política de
                  Privacidad (RGPD/LOPDGDD). El usuario retiene todos sus
                  derechos.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  5. Modificaciones
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Nos reservamos el derecho de modificar estos términos. Los
                  cambios se notificarán a los usuarios.
                </p>
              </section>

              <section>
                <h4 className="font-medium text-foreground mb-1">
                  6. Legislación
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Estos términos se rigen por la legislación española. Juzgados
                  competentes: Barcelona, Cataluña.
                </p>
              </section>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
