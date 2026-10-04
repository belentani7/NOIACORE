from __future__ import annotations

import sqlite3
import sys
from pathlib import Path


def main() -> None:
    db_path = Path(sys.argv[1])
    with sqlite3.connect(db_path) as con:
        for row in con.execute("SELECT source, received, valid, invalid, duplicates, status FROM source_metrics ORDER BY source"):
            print("|".join(str(value) for value in row))


if __name__ == "__main__":
    main()
