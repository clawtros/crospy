from flask import Flask, render_template
from flask.ext.cors import CORS
from generator.generator import get_random, get_random_orig
import json

app = Flask(__name__)
CORS(app)

@app.route('/api/random/size/<int:size>/')
def play_size(size):
    return json.dumps(get_random_orig(size=size))


@app.route('/api/random/')
def random():
    return json.dumps(get_random())


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == "__main__":
    app.run(host="0.0.0.0")
