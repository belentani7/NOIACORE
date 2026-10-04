import asyncio
import os

class DiscreteUIv2:
    def __init__(self, app_name="LIOS Event Horizon"):
        self.app_name = app_name
        self.quiet_mode = False
        self.history = []

    def set_quiet_mode(self, enabled: bool):
        self.quiet_mode = enabled
        logging.info(f"LIOS UI: Modo silencioso {'activado' if enabled else 'desactivado'}")

    async def notify_task_complete(self, title, message, play_sound=True):
        if self.quiet_mode:
            logging.info(f"LIOS UI (Silencioso): {title} - {message}")
            return
        
        print(f"\n[LIOS] {title}: {message}")
        if play_sound:
            # En Windows real: winsound.PlaySound("SystemAsterisk", winsound.SND_ALIAS)
            print("🔊 (Sonido de sistema)")
        self.history.append({"type": "notification", "title": title, "msg": message, "time": datetime.now()})

    async def ask_discreetly(self, title, message, suggestions=None, play_sound=False):
        if self.quiet_mode:
            logging.info(f"LIOS UI (Silencioso): Pregunta omitida -> {message}")
            return suggestions[0] if suggestions else "OK"

        print(f"\n[LIOS PREGUNTA] {title}")
        print(f"👉 {message}")
        if suggestions:
            print(f"Opciones: [{' | '.join(suggestions)}]")
        
        if play_sound:
            print("🔔 (Notificación sonora)")
        
        # Simulación de respuesta de usuario rápida
        return suggestions[0] if suggestions else "Sí"
