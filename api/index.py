import os
import sys

# Add project root directory to sys.path so backend module can be imported
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(CURRENT_DIR)
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from backend.app import app

# Vercel looks for the WSGI application callable named 'app'
