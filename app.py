from flask import Flask
from flask.ext.cors import CORS
from generator.generator import get_random, get_clues
import json

app = Flask(__name__)
CORS(app)
app.debug = True


def json_grid(grid):
    across_cells, down_cells = grid.get_words()
    numbered = grid.get_numbered_cells(across_cells, down_cells)
    result = {
        "numbered": dict([(grid.get_cell_id(c), n) for c, n in numbered.items()]),
        "cells": str(grid).replace("\n", "").replace("*", "#"),
        "gridinfo": {
            "size": len(grid.cells[0])
        },
        "clues": {
            "Across": get_clues(grid.format_words(across_cells, numbered)),
            "Down": get_clues(grid.format_words(down_cells, numbered))
        },
        "words": {
            "across": dict(grid.format_words(across_cells, numbered)),
            "down": dict(grid.format_words(down_cells, numbered))
        },
        "size": len(grid.cells[0])
    }
    return result


@app.route('/')
def index():
    grid = get_random()
    return json.dumps(json_grid(grid))

if __name__ == "__main__":
    app.run()
