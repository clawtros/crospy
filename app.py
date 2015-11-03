from flask import Flask
from flask.ext.cors import CORS
from generator.generator import get_random, get_random_orig
import json

app = Flask(__name__)
CORS(app)
app.debug = True

@app.route('/size/<int:size>/')
def play_size(size):
    return json.dumps(get_random_orig(size=size))


@app.route('/')
def index():
    return json.dumps(get_random())

if __name__ == "__main__":
    app.run(host="0.0.0.0")
