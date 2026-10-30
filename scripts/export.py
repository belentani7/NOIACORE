#!/usr/bin/env python3
"""Export independiente de los datos principales del proyecto NOIACORE.

Protocolo 11 del ecosistema Belentani: expone, en un solo JSON, los datos
reales leídos del propio repositorio (nada inventado):

- Coordenadas Maven y versión de Java (pom.xml).
- Endpoints REST declarados en los controladores (src/main/java/.../web).
- Páginas estáticas servidas (src/main/resources/static).
- Ficha del subproyecto Node black-water (black-water/package.json).

Uso:
    python scripts/export.py            # imprime el JSON en stdout
    python scripts/export.py --out out.json   # además lo escribe en un fichero

Sin dependencias externas: solo biblioteca estándar de Python 3.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MVN_NS = "{http://maven.apache.org/POM/4.0.0}"


def maven_coordinates() -> dict:
    pom = ROOT / "pom.xml"
    tree = ET.parse(pom)
    root = tree.getroot()

    def text(tag: str) -> str | None:
        node = root.find(f"{MVN_NS}{tag}")
        if node is None:
            # el groupId/version del proyecto puede heredarse del parent
            parent = root.find(f"{MVN_NS}parent")
            if parent is not None:
                pnode = parent.find(f"{MVN_NS}{tag}")
                if pnode is not None and pnode.text:
                    return pnode.text.strip() + " (heredado del parent)"
            return None
        return node.text.strip() if node.text else None

    java_version = None
    props = root.find(f"{MVN_NS}properties")
    if props is not None:
        jv = props.find(f"{MVN_NS}java.version")
        if jv is not None and jv.text:
            java_version = jv.text.strip()

    return {
        "groupId": text("groupId"),
        "artifactId": text("artifactId"),
        "version": text("version"),
        "java.version": java_version,
        "packaging": text("packaging") or "jar",
        "fuente": "pom.xml",
    }


def rest_endpoints() -> list[dict]:
    """Escanea los controladores reales bajo src/main/java/**/web."""
    endpoints: list[dict] = []
    web_dir = ROOT / "src" / "main" / "java"
    mapping_re = re.compile(r'@(Get|Post|Put|Delete|Patch)Mapping(?:\(\s*"([^"]*)"\s*\))?')
    base_re = re.compile(r'@RequestMapping(?:\(\s*"([^"]*)"\s*\))?')
    for java_file in sorted(web_dir.rglob("*.java")):
        if "/web/" not in java_file.as_posix() and not java_file.parent.name == "web":
            continue
        source = java_file.read_text(encoding="utf-8")
        base_match = base_re.search(source)
        base = base_match.group(1) if (base_match and base_match.group(1)) else ""
        for m in mapping_re.finditer(source):
            verb, sub = m.group(1).upper(), m.group(2) or ""
            endpoints.append(
                {
                    "metodo": verb,
                    "ruta": (base.rstrip("/") + "/" + sub.lstrip("/")).strip("/") or "/",
                    "controlador": java_file.stem,
                }
            )
    return endpoints


def static_pages() -> list[str]:
    """Páginas HTML reales servidas como recursos estáticos."""
    static_dir = ROOT / "src" / "main" / "resources" / "static"
    return sorted(p.name for p in static_dir.glob("*.html"))


def black_water_info() -> dict:
    pkg_path = ROOT / "black-water" / "package.json"
    if not pkg_path.is_file():
        return {"presente": False}
    pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
    return {
        "presente": True,
        "nombre": pkg.get("name"),
        "version": pkg.get("version"),
        "scripts": pkg.get("scripts", {}),
        "node": pkg.get("engines", {}).get("node"),
        "tests": sorted(p.name for p in (ROOT / "black-water" / "tests").glob("*.test.cjs")),
        "lockfile": (ROOT / "black-water" / "package-lock.json").is_file(),
        "fuente": "black-water/package.json",
    }


def build_export() -> dict:
    return {
        "proyecto": "NOIACORE (belentani7/backend_aportaciones_software01)",
        "generado": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "maven": maven_coordinates(),
        "api_rest": rest_endpoints(),
        "paginas_estaticas": static_pages(),
        "black_water": black_water_info(),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--out", type=Path, default=None, help="fichero JSON de salida (opcional)")
    args = parser.parse_args()

    payload = build_export()
    rendered = json.dumps(payload, indent=2, ensure_ascii=False)
    print(rendered)
    if args.out is not None:
        args.out.write_text(rendered + "\n", encoding="utf-8")
        print(f"export escrito en {args.out}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
