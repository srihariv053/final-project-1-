import os
import sys

# Add project root directory to sys.path so 'backend' package can be imported
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.app import create_app

# WSGI application callable for Vercel Serverless Functions
app = create_app()
