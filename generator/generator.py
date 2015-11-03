from crossword import Grid, random_grid
from wordlist import MySQLWordList
from solver import MinionSolver
import cPickle
from collections import defaultdict
import json
import random

successes = defaultdict(list)
failures = defaultdict(int)
orig_wordlist = MySQLWordList(username="cruci", password="cruci", host="127.0.0.1", table_name="dictionary")
wordlist = MySQLWordList(username="cruci", password="cruci", host="127.0.0.1", table_name="nyt_dictionary")
solver = MinionSolver(None, wordlist, '/home/adam/src/minion-1.7/bin/minion')

grids = cPickle.loads(open("/home/adam/unfailed_grids.pickle", "r").read())


# TODO: where should this go?
def get_clues(numbered_words):
    result = {}

    for n, t in numbered_words:
        if not wordlist.define(t):
            print "UNFOUND", t
        result[n] = {
            "clue_number": n,
            "clue_text": wordlist.define(t).decode('latin-1').encode('utf-8')
        }
    return result


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


def get_random():
    grid = Grid(initial_data=random.choice(grids))
    solver.wordlist = wordlist
    solver.grid = grid
    return json_grid(solver.solve())

def get_random_orig(size=13):
    grid = Grid(size=size)
    grid = random_grid(grid, 0.2)
    solver.wordlist = wordlist
    solver.grid = grid
    result = solver.solve()
    return json_grid(result)


if __name__ == "__main__":
    solved = get_random()

    result = {"result": str(solved).replace("\n","") if solved else "*",
              "size": len(solved.cells[0]) if solved else 1,
              
              "saved_id": 0}

    print json.dumps(result)
