from flask import Flask, render_template
from generator.generator import get_random, get_random_orig
from pymongo import MongoClient
from bson import ObjectId
from collections import defaultdict
import json

client = MongoClient()
db = client.crosswords

app = Flask(__name__)
app.debug = True

roomdata = defaultdict(list)
        
    

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
    app.run(host="0.0.0.0")
