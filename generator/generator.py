from crossword import Grid
from wordlist import MySQLWordList
from solver import MinionSolver
import cPickle
from collections import defaultdict
import json
import random

successes = defaultdict(list)
failures = defaultdict(int)

wordlist = MySQLWordList(username="cruci", password="cruci", host="127.0.0.1", table_name="nyt_dictionary")
solver = MinionSolver(None, wordlist, '/home/adam/src/minion-1.7/bin/minion')

grids = cPickle.loads(open("/home/adam/unfailed_grids.pickle", "r").read())


def get_clues(numbered_words):
    result = {}
    for n, t in numbered_words:
        result[n] = {
            "clue_number": n,
            "clue_text": wordlist.define(t)
        }
    return result



def get_random():
    grid = Grid(initial_data=random.choice(grids))
    solver.grid = grid
    return solver.solve()


if __name__ == "__main__":
    solved = get_random()

    result = {"result": str(solved).replace("\n","") if solved else "*",
              "size": len(solved.cells[0]) if solved else 1,
              
              "saved_id": 0}

    print json.dumps(result)
