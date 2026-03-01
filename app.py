from flask import Flask, render_template

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev-key-posdata-studio-2026' # Change this in production!

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/vitalia-selfcare')
def vitalia_selfcare():
    return render_template('vitalia-selfcare.html')

@app.route('/project')
def project():
    return render_template('project.html')

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
