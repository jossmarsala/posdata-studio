from flask import Flask, render_template
from routes.contact import contact_bp, ContactForm

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key-posdata-studio-2026' # Change this in production!
app.register_blueprint(contact_bp)

@app.route('/')
def index():
    form = ContactForm()
    return render_template('index.html', form=form)

if __name__ == '__main__':
    app.run(debug=True)
