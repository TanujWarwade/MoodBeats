import os
import sys

# ── Vercel serverless path setup ─────────────────────────────────────────────
# On Vercel, __file__ = /var/task/api/index.py
# Project root  =       /var/task/
# backend pkg   =       /var/task/backend/

_THIS_DIR   = os.path.dirname(os.path.abspath(__file__))   # /var/task/api
_ROOT_DIR   = os.path.dirname(_THIS_DIR)                    # /var/task
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")           # /var/task/backend

for _p in (_ROOT_DIR, _BACKEND_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.app import app  # noqa: E402
except ModuleNotFoundError:
    from app import app  # noqa: E402
