import sqlite3
import os
import json
import time
from datetime import datetime
import numpy as np

class LocalAgentCoreV2:
    def __init__(self, db_path="agente_local_v2.db"):
        self.db_path = db_path
        self._initialize_db()
        self.config = self._load_config()

    def _initialize_db(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS proyectos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL UNIQUE, descripcion TEXT, ruta_base TEXT, fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS archivos (id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, ruta_original TEXT NOT NULL, ruta_actual TEXT, tipo TEXT, id_proyecto INTEGER, metadatos TEXT, fecha_procesamiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (id_proyecto) REFERENCES proyectos(id))''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS notas (id INTEGER PRIMARY KEY AUTOINCREMENT, contenido TEXT NOT NULL, fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, etiquetas TEXT)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS configuracion (clave TEXT PRIMARY KEY, valor TEXT NOT NULL)''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS actividad_usuario (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, tipo_accion TEXT NOT NULL, nombre_archivo TEXT, ruta_origen TEXT, ruta_destino TEXT, categoria_sugerida TEXT, categoria_final TEXT, confianza_agente REAL, metadatos_contexto TEXT)''')
        conn.commit()
        conn.close()

    def _load_config(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT clave, valor FROM configuracion")
        config = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        return config

    def log_user_activity(self, tipo_accion, nombre_archivo, ruta_origen=None, ruta_destino=None, sugerencia=None, final=None, confianza=0.0, contexto=None):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        contexto_json = json.dumps(contexto) if contexto else "{}"
        cursor.execute('''INSERT INTO actividad_usuario (tipo_accion, nombre_archivo, ruta_origen, ruta_destino, categoria_sugerida, categoria_final, confianza_agente, metadatos_contexto) VALUES (?, ?, ?, ?, ?, ?, ?, ?)''', (tipo_accion, nombre_archivo, ruta_origen, ruta_destino, sugerencia, final, confianza, contexto_json))
        conn.commit()
        conn.close()

    def get_training_data(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT nombre_archivo, categoria_final, metadatos_contexto FROM actividad_usuario WHERE categoria_final IS NOT NULL")
        data = cursor.fetchall()
        conn.close()
        return data

    def add_project(self, nombre, descripcion="", ruta_base=""):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO proyectos (nombre, descripcion, ruta_base) VALUES (?, ?, ?)", (nombre, descripcion, ruta_base))
            conn.commit()
            return cursor.lastrowid
        except sqlite3.IntegrityError:
            return None
        finally:
            conn.close()

    def get_projects(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM proyectos")
        proyectos = [{"id": r[0], "nombre": r[1], "descripcion": r[2], "ruta_base": r[3]} for r in cursor.fetchall()]
        conn.close()
        return proyectos

    def get_num_auto_actions(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM actividad_usuario WHERE tipo_accion = 'auto_organizado'")
        count = cursor.fetchone()[0]
        conn.close()
        return count

    def get_total_actions(self):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM actividad_usuario")
        count = cursor.fetchone()[0]
        conn.close()
        return count

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import pickle
from pathlib import Path

class IntuitionEngine:
    """
    Motor de aprendizaje de patrones basado en Random Forest.
    Aprende de las decisiones pasadas del usuario para predecir acciones futuras.
    """
    def __init__(self, agent_core, model_path="legacy/intuition_model.pkl"):
        self.core = agent_core
        self.model_path = Path(model_path)
        self.vectorizer = TfidfVectorizer(analyzer='char', ngram_range=(2, 4))
        self.classifier = RandomForestClassifier(n_estimators=100)
        self.is_trained = False
        self._load_model()

    def _load_model(self):
        if self.model_path.exists():
            try:
                with open(self.model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.vectorizer = data['vectorizer']
                    self.classifier = data['classifier']
                    self.is_trained = True
            except Exception as e:
                logging.error(f"Error cargando modelo de intuición: {e}")

    def train_model(self):
        data = self.core.get_training_data()
        if len(data) < 10: # Mínimo de muestras para entrenar
            return False
        
        X_raw = [row[0] for row in data] # nombres de archivos
        y = [row[1] for row in data]     # categorías finales
        
        try:
            X = self.vectorizer.fit_transform(X_raw)
            self.classifier.fit(X, y)
            self.is_trained = True
            
            with open(self.model_path, 'wb') as f:
                pickle.dump({'vectorizer': self.vectorizer, 'classifier': self.classifier}, f)
            return True
        except Exception as e:
            logging.error(f"Error entrenando modelo de intuición: {e}")
            return False

    def predict_action(self, filename, context):
        if not self.is_trained:
            return None, 0.0
        
        try:
            X = self.vectorizer.transform([filename])
            prediction = self.classifier.predict(X)[0]
            probabilities = self.classifier.predict_proba(X)[0]
            confidence = max(probabilities)
            return prediction, confidence
        except Exception as e:
            logging.error(f"Error en predicción de intuición: {e}")
            return None, 0.0
