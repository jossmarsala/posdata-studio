from flask import Blueprint, request, jsonify
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField
from wtforms.validators import DataRequired, Email, Length, Regexp
import re

contact_bp = Blueprint('contact', __name__)

# Basic sanitization function
def sanitize_input(text):
    if not text:
        return ""
    # Remove potentially dangerous characters for SQL/HTML
    # restricted_chars = r"[;'\"]" # Example of simple stripping
    # For now, we escape HTML to prevent XSS which is more relevant here
    text = str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#x27;")
    return text

class ContactForm(FlaskForm):
    name = StringField('Nombre', validators=[
        DataRequired(message="El nombre es obligatorio"), 
        Length(min=2, max=50),
        Regexp(r'^[a-zA-Z\s\u00C0-\u017F]+$', message="El nombre solo puede contener letras y espacios")
    ])
    email = StringField('Email', validators=[
        DataRequired(message="El email es obligatorio"), 
        Email(message="Email inválido"), 
        # Strict Regex as requested
        Regexp(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', message="Formato de email inválido")
    ])
    message = TextAreaField('Mensaje', validators=[
        DataRequired(message="El mensaje no puede estar vacío"), 
        Length(min=10, max=1000)
    ])
    # Honeypot field - should be left empty by humans
    website = StringField('Website') 

@contact_bp.route('/contact', methods=['POST'])
def contact():
    form = ContactForm()
    
    # Check honeypot first
    if form.website.data:
        # Log suspected bot
        print(f"Spam detected from IP: {request.remote_addr}")
        return jsonify({'status': 'error', 'message': 'Spam detected'}), 400

    if form.validate_on_submit():
        # Sanitize inputs before usage (even if just printing)
        clean_name = sanitize_input(form.name.data)
        clean_email = sanitize_input(form.email.data)
        clean_message = sanitize_input(form.message.data)

        # Here you would handle the actual email sending or DB storage
        # The sanitization above prevents basic "SQL Injection" patterns if we were constructing raw queries
        # (though using an ORM is always preferred).
        
        print(f"New Message from {clean_name} ({clean_email}): {clean_message}")
        return jsonify({'status': 'success', 'message': '¡Gracias! Tu mensaje ha sido enviado.'})
    
    # Return validation errors
    return jsonify({'status': 'error', 'errors': form.errors}), 400
