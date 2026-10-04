#!/usr/bin/env python3
"""
Script de seeding para BarriServei AI.
Carga 20 servicios y 10 proveedores de demo.
Uso: python seed_db.py
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys

# Importar modelos (asumiendo estructura)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from app.main import Base, Service, Provider, User

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://of1p:of1p@localhost:5432/of1p")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False)

def seed():
    """Seed servicios y proveedores."""

    # Crear tablas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # Borrar datos previos (opcional)
    # db.query(Service).delete()
    # db.query(Provider).delete()
    # db.query(User).delete()
    # db.commit()

    # Servicios iniciales
    services_data = [
        # Soporte Digital
        {"slug": "soporte-digital-mayores", "name": "Soporte Digital para Mayores", "category": "asistencia", "description": "Ayuda con móvil, WhatsApp, correo electrónico y trámites básicos online para personas mayores.", "price_cents": 3900, "commission_bps": 2500, "delivery_mode": "onsite", "risk_level": "low"},
        {"slug": "configuracion-movil", "name": "Configuración Móvil", "category": "asistencia", "description": "Configuración de WhatsApp, videollamadas, fotos, almacenamiento.", "price_cents": 2900, "commission_bps": 2500, "delivery_mode": "hybrid", "risk_level": "low"},
        {"slug": "seguridad-digital", "name": "Seguridad Digital Básica", "category": "asistencia", "description": "Antivirus, limpieza de malware, protección contra estafas, contraseñas seguras.", "price_cents": 3900, "commission_bps": 2500, "delivery_mode": "onsite", "risk_level": "low"},

        # Trámites
        {"slug": "tramite-asistido", "name": "Trámite Online Asistido", "category": "gestiones", "description": "Acompañamiento para citas previas, solicitudes sin asesoría legal/fiscal.", "price_cents": 2900, "commission_bps": 2500, "delivery_mode": "hybrid", "risk_level": "low"},
        {"slug": "certificado-digital", "name": "Certificado Digital Setup", "category": "gestiones", "description": "Instalación y configuración de certificado digital.", "price_cents": 1900, "commission_bps": 2500, "delivery_mode": "hybrid", "risk_level": "low"},

        # Marketing Local
        {"slug": "google-business", "name": "Google Business Profile Optimizado", "category": "marketing", "description": "Crear/optimizar ficha, fotos, descripción, reseñas QR para comercio local.", "price_cents": 9900, "commission_bps": 7000, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "resenas-management", "name": "Gestión de Reseñas", "category": "marketing", "description": "Gestión automatizada de reseñas en Google, estrategia mensual.", "price_cents": 4900, "commission_bps": 4000, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "whatsapp-qr", "name": "WhatsApp QR para Negocio", "category": "marketing", "description": "QR interactivo para contacto vía WhatsApp en comercios.", "price_cents": 1900, "commission_bps": 7000, "delivery_mode": "digital", "risk_level": "low"},

        # Web & Digital
        {"slug": "web-basica", "name": "Web Básica para Negocio", "category": "digital", "description": "Landing page con contacto, servicios, horarios, mapa, WhatsApp.", "price_cents": 29900, "commission_bps": 7000, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "chatbot-whatsapp", "name": "Chatbot WhatsApp para Negocio", "category": "digital", "description": "Bot automatizado para responder FAQs 24/7, agendar citas.", "price_cents": 14900, "commission_bps": 6000, "delivery_mode": "digital", "risk_level": "medium"},
        {"slug": "email-profesional", "name": "Email Profesional Setup", "category": "digital", "description": "Correo con dominio propio, setup en dispositivos, firma.", "price_cents": 1900, "commission_bps": 2500, "delivery_mode": "digital", "risk_level": "low"},

        # Reparaciones & Hogar
        {"slug": "reparaciones-mobiliario", "name": "Reparaciones Muebles & Menaje", "category": "hogar", "description": "Montaje de muebles, pequeños arreglos, cerraduras, estanterías.", "price_cents": 6000, "commission_bps": 2500, "delivery_mode": "onsite", "risk_level": "medium"},
        {"slug": "instalacion-tv", "name": "Instalación de TV y Audiovisual", "category": "hogar", "description": "Montaje de TV, conexión de dispositivos, configuración.", "price_cents": 8900, "commission_bps": 2500, "delivery_mode": "onsite", "risk_level": "medium"},
        {"slug": "limpieza-profunda", "name": "Limpieza Profunda (App Conecta)", "category": "hogar", "description": "Servicio de limpieza profunda de vivienda, cristales, etc.", "price_cents": 15000, "commission_bps": 3000, "delivery_mode": "onsite", "risk_level": "medium"},

        # Otros Servicios
        {"slug": "fotografia-evento", "name": "Fotografía de Evento", "category": "eventos", "description": "Fotografía profesional de evento, comida, fiesta.", "price_cents": 35000, "commission_bps": 2000, "delivery_mode": "onsite", "risk_level": "low"},
        {"slug": "video-promocion", "name": "Vídeo Promocional Negocio", "category": "marketing", "description": "Grabación y edición de vídeo promocional para redes.", "price_cents": 29900, "commission_bps": 5000, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "asesoria-seo-local", "name": "Asesoría SEO Local Básica", "category": "marketing", "description": "Auditoría SEO, palabras clave, estructura, enlaces internos.", "price_cents": 19900, "commission_bps": 4000, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "gestion-redes", "name": "Gestión de Redes Sociales (Mensual)", "category": "marketing", "description": "Crear y gestionar contenido en redes (Instagram, TikTok, Facebook).", "price_cents": 9900, "commission_bps": 3500, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "diseno-flyer", "name": "Diseño de Flyer", "category": "marketing", "description": "Diseño personalizado de flyer/poster, PDF listo para imprenta.", "price_cents": 4900, "commission_bps": 5500, "delivery_mode": "digital", "risk_level": "low"},
        {"slug": "backup-nube", "name": "Backup a Nube & Recuperación", "category": "asistencia", "description": "Configuración de backup automático a nube, recuperación de archivos.", "price_cents": 3900, "commission_bps": 2500, "delivery_mode": "hybrid", "risk_level": "low"},
    ]

    existing_services = db.query(Service).count()
    if existing_services == 0:
        for svc_data in services_data:
            service = Service(**svc_data)
            db.add(service)
        db.commit()
        print(f"✓ {len(services_data)} servicios creados.")
    else:
        print(f"✓ Ya existen {existing_services} servicios. Saltando seed de servicios.")

    # Proveedores de demo
    providers_data = [
        {"name": "María García", "phone": "+34611111111", "legal_name": "María García López", "tax_id": "12345678A"},
        {"name": "Juan Martínez", "phone": "+34612222222", "legal_name": "Juan Martínez Ruiz", "tax_id": "87654321B"},
        {"name": "Tech Solutions", "phone": "+34613333333", "legal_name": "Tech Solutions SL", "tax_id": "B12345678"},
        {"name": "Ana Construcción", "phone": "+34614444444", "legal_name": "Ana Pérez Construcción", "tax_id": "12345678C"},
        {"name": "Limpiezas Pro", "phone": "+34615555555", "legal_name": "Limpiezas Profesionales SL", "tax_id": "B87654321"},
        {"name": "Digital Expert", "phone": "+34616666666", "legal_name": "David López Digital", "tax_id": "12345678D"},
        {"name": "Marketing Local", "phone": "+34617777777", "legal_name": "Marketing Local SL", "tax_id": "B11111111"},
        {"name": "Fotografía Estudio", "phone": "+34618888888", "legal_name": "Estudio Foto Barcelona", "tax_id": "B22222222"},
        {"name": "Reparaciones Hogar", "phone": "+34619999999", "legal_name": "Reparaciones Integral", "tax_id": "12345678E"},
        {"name": "Asesoría Web", "phone": "+34610101010", "legal_name": "Asesoría Web Cataluña", "tax_id": "B33333333"},
    ]

    existing_providers = db.query(Provider).count()
    if existing_providers == 0:
        for prov_data in providers_data:
            # Crear usuario primero
            phone = prov_data.pop("phone")
            name = prov_data.pop("name")

            user = User(role="provider", phone=phone, name=name)
            db.add(user)
            db.commit()
            db.refresh(user)

            # Crear proveedor
            provider = Provider(user_id=user.id, status="active", kyc_status="approved", rating_x100=450, completed_jobs=12, **prov_data)
            db.add(provider)

        db.commit()
        print(f"✓ {len(providers_data)} proveedores creados.")
    else:
        print(f"✓ Ya existen {existing_providers} proveedores. Saltando seed de proveedores.")

    db.close()
    print("\n✓ Seeding completado.")

if __name__ == "__main__":
    seed()
