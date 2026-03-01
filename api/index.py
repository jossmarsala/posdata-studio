import sys
import os

# Add the parent directory to the path so we can import app from app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Vercel needs the application object to be named 'app'
# which it already is in app.py
