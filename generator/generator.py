import cPickle
import json
import random

from crossword import Grid, random_grid
from generator_conf import settings
from solver import MinionSolver
from wordlist import FixedWidthFileBasedWordList, MySQLWordList, \
    SeparatedFileBasedWordList


mysql_wordlist = MySQLWordList(
    username=settings['database'].get('user'),
    password=settings['database'].get('password'),
    host=settings['database'].get('host'),
    database=settings['database'].get('database'),
    table_name=settings['database'].get('table_name'),
    encoding=settings['database'].get('encoding')
)

# nyt_wordlist = SeparatedFileBasedWordList('/home/adam/projects/crospy/generator/out.txt')
# nyt2_wordlist = FixedWidthFileBasedWordList('/home/adam/projects/crospy/generator/clues')

wordlist = mysql_wordlist

solver = MinionSolver(settings['minion_path'])
grids = cPickle.loads(open(settings['grid_path'], "r").read())

# TODO: where should this go?
def get_clues(numbered_words):
    result = {}

    for n, t in numbered_words:
        clue = wordlist.define(t)
        result[n] = {
            "clue_number": n,
            "clue_text": clue.encode('utf-8')
        }
    return result


def json_grid(grid):
    across_cells, down_cells = grid.get_words()
    numbered = grid.get_numbered_cells(across_cells, down_cells)
    return {
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


def get_random():
    grid = Grid(initial_data=random.choice(grids))
    return json_grid(solver.solve(grid=grid, wordlist=wordlist))


def get_random_orig(size=13):
    grid = Grid(size=size)
    grid = random_grid(grid, 0.2)
    return json_grid(solver.solve(grid=grid, wordlist=wordlist))


if __name__ == "__main__":
    solved = get_random()

    result = {
        "result": str(solved).replace("\n", "") if solved else "*",
        "size": len(solved.cells[0]) if solved else 1,
        "saved_id": 0
    }

    print json.dumps(result)
