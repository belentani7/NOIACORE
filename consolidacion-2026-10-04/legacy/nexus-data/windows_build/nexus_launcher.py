from __future__ import annotations

import os
import shutil
import sys
import threading
import time
import webbrowser
from pathlib import Path


def bundled_root() -> Path:
    return Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))


def user_root() -> Path:
    base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local")) / "NexusData"
    (base / "data" / "processed").mkdir(parents=True, exist_ok=True)
    return base


def prepare_runtime() -> tuple[Path, Path]:
    bundled = bundled_root()
    user = user_root()
    config = user / "sources.yml"
    if not config.exists():
        shutil.copy2(bundled / "config" / "sources.yml", config)
    return bundled, user


def open_browser() -> None:
    time.sleep(4)
    webbrowser.open("http://127.0.0.1:8501")


def main() -> None:
    bundled, user = prepare_runtime()
    sys.path.insert(0, str(bundled / "src"))
    app_path = bundled / "app" / "streamlit_app.py"
    config = user / "sources.yml"
    db = user / "data" / "nexus.db"
    os.environ["NEXUS_DATA_HOME"] = str(user)
    threading.Thread(target=open_browser, daemon=True).start()
    sys.argv = ["streamlit", "run", str(app_path), "--server.address=127.0.0.1", "--server.port=8501", "--server.headless=true", f"--server.runOnSave=false", f"--", "--config", str(config), "--db", str(db)]
    from streamlit.web import cli as stcli
    stcli.main()


if __name__ == "__main__":
    main()
