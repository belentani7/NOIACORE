import asyncio
import os
# Nota: En Windows real, se usaría:
# from desktop_notifier import DesktopNotifier, Button, Urgency
# import pystray
# from PIL import Image

class DiscreteUI:
    def __init__(self, app_name="Agente Local"):
        self.app_name = app_name
        # self.notifier = DesktopNotifier(app_name=self.app_name)

    async def ask_discreetly(self, title, message, suggestions=None):
        """Muestra una notificación toast con botones de respuesta rápida."""
        print(f"--- NOTIFICACIÓN DISCRETA ---")
        print(f"Título: {title}")
        print(f"Mensaje: {message}")
        
        if suggestions:
            print(f"Sugerencias de respuesta rápida: {suggestions}")
        
        # En Windows real con desktop-notifier:
        # buttons = [Button(title=s, on_pressed=lambda s=s: self._on_button_click(s)) for s in (suggestions or [])]
        # await self.notifier.send(title=title, message=message, buttons=buttons, urgency=Urgency.Normal)
        
        return "aceptado" # Simulación de respuesta del usuario

    def _on_button_click(self, action):
        print(f"Usuario seleccionó: {action}")

    def create_system_tray(self):
        """Crea el icono en la bandeja del sistema (System Tray)."""
        print("Icono de bandeja del sistema creado (Simulado).")
        # En Windows real con pystray:
        # menu = pystray.Menu(pystray.MenuItem('Estado: Activo', lambda: None), 
        #                    pystray.MenuItem('Configuración', self._open_config),
        #                    pystray.MenuItem('Salir', self._exit_app))
        # icon = pystray.Icon("AgenteLocal", Image.open("icon.png"), "Agente Local", menu)
        # icon.run()

    def _open_config(self):
        print("Abriendo ventana de configuración...")

    def _exit_app(self, icon):
        icon.stop()

if __name__ == "__main__":
    ui = DiscreteUI()
    asyncio.run(ui.ask_discreetly("Sugerencia de Organización", "¿Mover 'documento.pdf' a 'Trabajo'?", ["Sí", "No", "Elegir otro"]))
