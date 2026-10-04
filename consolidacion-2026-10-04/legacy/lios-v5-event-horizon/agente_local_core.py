import sqlite3
import os
import json
import time
from datetime import datetime

class LocalAgentCore:
    def __init__(self, db_path="agente_local.db"):
        self.db_path = db_path
        self._initialize_db()
        self.config = self._load_config()

    def _initialize_db(self):
        """Inicializa la base de datos SQLite con las tablas necesarias."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Tabla de proyectos
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS proyectos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL UNIQUE,
                descripcion TEXT,
                ruta_base TEXT,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Tabla de archivos procesados
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS archivos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                ruta_original TEXT NOT NULL,
                ruta_actual TEXT,
                tipo TEXT,
                id_proyecto INTEGER,
                metadatos TEXT, -- Almacenado como JSON
                fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_proyecto) REFERENCES proyectos(id)
            )
        ''')
        
        # Tabla de notas diarias
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contenido TEXT NOT NULL,
                fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                etiquetas TEXT -- Almacenado como JSON o lista separada por comas
            )
        ''')
        
        # Tabla de configuraciones y reglas aprendidas
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS configuracion (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL
            )
        ''')
        
        conn.commit()
        conn.close()

    def _load_config(self):
        """Carga la configuración desde la base de datos."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT clave, valor FROM configuracion")
        config = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        return config

    def save_config(self, clave, valor):
        """Guarda una configuración en la base de datos."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)", (clave, valor))
        conn.commit()
        conn.close()
        self.config[clave] = valor

    def add_project(self, nombre, descripcion="", ruta_base=""):
        """Añade un nuevo proyecto a la base de datos."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO proyectos (nombre, descripcion, ruta_base) VALUES (?, ?, ?)", 
                           (nombre, descripcion, ruta_base))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            print(f"El proyecto '{nombre}' ya existe.")
            return None
        finally:
            conn.close()

    def log_file(self, nombre, ruta_original, tipo, id_proyecto=None, metadatos=None):
        """Registra un archivo procesado en la base de datos."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        metadatos_json = json.dumps(metadatos) if metadatos else "{}"
        cursor.execute('''
            INSERT INTO archivos (nombre, ruta_original, tipo, id_proyecto, metadatos) 
            VALUES (?, ?, ?, ?, ?)
        ''', (nombre, ruta_original, tipo, id_proyecto, metadatos_json))
        conn.commit()
        conn.close()

    def add_note(self, contenido, etiquetas=None):
        """Añade una nota diaria."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        etiquetas_str = ",".join(etiquetas) if etiquetas else ""
        cursor.execute("INSERT INTO notas (contenido, etiquetas) VALUES (?, ?)", (contenido, etiquetas_str))
        conn.commit()
        conn.close()

    def get_projects(self):
        """Devuelve todos los proyectos."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM proyectos")
        proyectos = cursor.fetchall()
        conn.close()
        return proyectos

if __name__ == "__main__":
    # Prueba inicial del núcleo
    agente = LocalAgentCore()
    print("Núcleo del agente inicializado correctamente.")
    
    # Añadir un proyecto de prueba
    project_id = agente.add_project("Mi Proyecto Local", "Un proyecto de prueba para el agente.", "/home/ubuntu/proyectos/test")
    if project_id:
        print(f"Proyecto añadido con ID: {project_id}")
    
    # Registrar un archivo de prueba
    agente.log_file("test.txt", "/home/ubuntu/test.txt", "texto", project_id, {"tamano": 1024, "autor": "Manus"})
    print("Archivo de prueba registrado.")
    
    # Añadir una nota de prueba
    agente.add_note("Hoy empecé a desarrollar mi agente local.", ["desarrollo", "inicio"])
    print("Nota de prueba añadida.")
