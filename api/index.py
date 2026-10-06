import os
import sys

# ── Vercel serverless path fix ──────────────────────────────────────
# __file__ is   /var/task/api/index.py
# project root is /var/task/
_TASK_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if _TASK_DIR not in sys.path:
    sys.path.insert(0, _TASK_DIR)

# Ensure backend sub-package is importable
_BACKEND_DIR = os.path.join(_TASK_DIR, "backend")
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# ── Import Flask app ─────────────────────────────────────────────────
try:
    from backend.app import app          # standard import
except Exception as e:
    # Absolute fallback: run app.py directly from file path
    import importlib.util
    _spec = importlib.util.spec_from_file_location(
        "backend.app",
        os.path.join(_BACKEND_DIR, "app.py"),
    )
    _mod = importlib.util.module_from_spec(_spec)
    sys.modules["backend.app"] = _mod
    _spec.loader.exec_module(_mod)
    app = _mod.app

# Vercel looks for the WSGI callable named 'app'
