import time
import logging
import os
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from pathlib import Path

class LIOSFileHandler(FileSystemEventHandler):
    """
    Manejador de eventos de sistema de archivos para LIOS.
    Filtra archivos temporales y duplicados rápidos.
    """
    def __init__(self, callback):
        self.callback = callback
        self.last_processed = {}
        self.cooldown = 2 # segundos para evitar duplicados por guardado rápido

    def on_created(self, event):
        if not event.is_directory:
            self._handle_event(event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._handle_event(event.dest_path)

    def _handle_event(self, file_path):
        path = Path(file_path)
        # Ignorar archivos temporales comunes
        if path.suffix.lower() in ['.tmp', '.crdownload', '.part'] or path.name.startswith('~$'):
            return
            
        now = time.time()
        if file_path in self.last_processed:
            if now - self.last_processed[file_path] < self.cooldown:
                return
        
        self.last_processed[file_path] = now
        logging.info(f"LIOS Watcher: Detectado nuevo archivo -> {path.name}")
        self.callback(file_path)

class LIOSWatcher:
    def __init__(self, watch_path, callback):
        self.watch_path = Path(watch_path)
        self.watch_path.mkdir(parents=True, exist_ok=True)
        self.event_handler = LIOSFileHandler(callback)
        self.observer = Observer()

    def start(self):
        self.observer.schedule(self.event_handler, str(self.watch_path), recursive=False)
        self.observer.start()
        logging.info(f"LIOS Watcher iniciado en: {self.watch_path}")

    def stop(self):
        self.observer.stop()
        self.observer.join()
        logging.info("LIOS Watcher detenido.")

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
    def test_callback(path): print(f"Procesando: {path}")
    watcher = LIOSWatcher("./test_input", test_callback)
    watcher.start()
    try:
        while True: time.sleep(1)
    except KeyboardInterrupt:
        watcher.stop()
