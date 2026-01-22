from flask import Blueprint, request, jsonify

contact_bp = Blueprint('contact', __name__)

@contact_bp.route('/contact', methods=['POST'])
def contact():
    # Aquí iría la lógica para enviar el email o guardar en base de datos
    data = request.form
    print("Datos recibidos:", data)
    return jsonify({'status': 'success', 'message': 'Mensaje enviado correctamente'})
