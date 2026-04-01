import os
import time
import re
from collections import defaultdict
from flask import Flask, render_template, request, jsonify
from flask_mail import Mail, Message as MailMessage

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-posdata-studio-2026')

# --- Flask-Mail (Gmail SMTP) ---
app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME', '')
app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD', '')
app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', 'noreply@posdatastudio.com')

CONTACT_RECEIVER = os.environ.get('CONTACT_RECEIVER_EMAIL', 'isposdata@gmail.com')

mail = Mail(app)

# --- Rate limiting (in-memory) ---
_rate_store = defaultdict(list)
RATE_LIMIT = 5          # max requests
RATE_WINDOW = 3600      # per hour (seconds)

def is_rate_limited(ip):
    now = time.time()
    _rate_store[ip] = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    if len(_rate_store[ip]) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False

def sanitize(text, max_len=2000):
    if not text:
        return ''
    text = text.strip()[:max_len]
    text = re.sub(r'<[^>]+>', '', text)  # Strip HTML tags
    return text


# --- Routes ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/project')
@app.route('/projects/<project_id>')
def project_detail(project_id=None):
    return render_template('project.html')

@app.route('/api/contact', methods=['POST'])
def contact_submit():
    ip = request.remote_addr or 'unknown'

    # Rate limiting
    if is_rate_limited(ip):
        return jsonify({'success': False, 'error': 'Demasiados envíos. Intentá más tarde.'}), 429

    # Honeypot check
    honeypot = request.form.get('website', '')
    if honeypot:
        # Bot detected — pretend success
        return jsonify({'success': True})

    # Extract and sanitize
    name    = sanitize(request.form.get('name', ''), 200)
    email   = sanitize(request.form.get('email', ''), 320)
    message = sanitize(request.form.get('message', ''), 5000)

    # Validate required fields
    if not all([name, email, message]):
        return jsonify({'success': False, 'error': 'Todos los campos son obligatorios.'}), 400

    # Validate email format
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    if not re.match(email_regex, email):
        return jsonify({'success': False, 'error': 'Email no válido.'}), 400

    if len(message) < 10:
        return jsonify({'success': False, 'error': 'El mensaje es muy corto.'}), 400

    # Build email
    subject_line = f'[Posdata Studio] Consulta de {name}'
    body = f"""Nuevo mensaje desde el formulario de contacto de Posdata Studio.

Nombre: {name}
Email: {email}

Mensaje:
{message}

---
IP: {ip}
"""

    # Try email send, fallback to console log if SMTP not configured
    if app.config['MAIL_USERNAME']:
        try:
            msg = MailMessage(
                subject=subject_line,
                recipients=[CONTACT_RECEIVER],
                body=body,
                reply_to=email
            )
            mail.send(msg)
        except Exception as e:
            app.logger.error(f'Error sending contact email: {e}')
            return jsonify({'success': False, 'error': 'Error al enviar. Intentá más tarde.'}), 500
    else:
        # Dev mode: log to console
        app.logger.info(f'\n===== CONTACT FORM (dev mode) =====\n{body}===================================\n')

    return jsonify({'success': True})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
