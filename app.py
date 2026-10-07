import os
import sys
import types

_ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
_BACKEND_DIR = os.path.join(_ROOT_DIR, "backend")

for _p in (_ROOT_DIR, _BACKEND_DIR):
    if _p not in sys.path:
        sys.path.insert(0, _p)

if "backend" not in sys.modules:
    try:
        import backend
    except ModuleNotFoundError:
        _backend_pkg = types.ModuleType("backend")
        _backend_pkg.__path__ = [_BACKEND_DIR]
        _backend_pkg.__file__ = os.path.join(_BACKEND_DIR, "__init__.py")
        sys.modules["backend"] = _backend_pkg

from backend.app import app

# Top-level exports for Vercel
app = app
application = app
handler = app
