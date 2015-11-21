from flask import Flask, render_template
from generator.generator import get_random, get_random_orig
from pymongo import MongoClient
from bson import ObjectId
from flask_socketio import SocketIO, emit
import json

client = MongoClient()
db = client.crosswords

app = Flask(__name__)
app.debug = True
socketio = SocketIO(app)

@socketio.on('key pressed')
def handle_key_pressed(json):
    print('received json: ' + str(json))
    emit('key pressed', json, broadcast=True)
    return json

@app.route('/api/random/size/<int:size>/')
def play_size(size):
    return json.dumps(get_random_orig(size=size))


@app.route('/api/random/')
def random():
    result = get_random()
    inserted_id = db.grids.insert(json.loads(json.dumps(result)))
    result['_id'] = str(inserted_id)
    return json.dumps(result)


@app.route('/api/grid/<string:_id>/')
def get_grid(_id):
    result = db.grids.find_one({"_id": ObjectId(_id)})
    result["_id"] = str(result["_id"])
    return json.dumps(result)


@app.route('/<string:crossword_id>/')
def play(crossword_id):
    return render_template('index.html', crossword_id=crossword_id)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == "__main__":
    socketio.run(app)
