import sys
sys.path.append('.')
import constraint
from crossword import INPUT, Grid, Cell,BLANK
from collections import defaultdict
from random import shuffle
import re
words = [l.strip() for l in open("/home/adam/src/wordz","r").readlines()]

#words = [l.strip() for l in open("/Users/adam/cruciverbalizer.com/gen/plwordlist2","r").readlines()]
words_by_length = defaultdict(list)
for word in words:
    words_by_length[len(word)].append(word)
    
def add_word_constraint(key, word, problem):
    matching = re.compile(word.replace(BLANK,"[a-z]"))
    words = [word for word in words_by_length[len(word)] if matching.match(word)]
    shuffle(words)
    problem.addVariable(key, words)

def add_filled_words(words):
    for k, v in words:
        if BLANK not in v:
            words_by_length[len(v)].append(v)
    
def solve(grid):
    p = constraint.Problem()
    across, down = grid.get_words()
    nums = grid.get_numbered_cells(across,down)
    formed_across = Grid.format_words(across, nums)
    formed_down = Grid.format_words(down, nums)
    filled_words = add_filled_words(formed_across + formed_down)

    for word in Grid.format_words(across, nums):
        add_word_constraint("h%d" % word[0], word[1], p)
    for word in Grid.format_words(down, nums):
        add_word_constraint("v%d" % word[0], word[1], p)
    for start, word in across.items():
        rownum = nums[word[0]]
        for hidx, cell in enumerate(word):
            column = grid.col_at(cell.x, cell.y)
            colnum = nums[column[0]]
            vidx = column.index(cell)
            p.addConstraint(lambda hw, vw, hidx=hidx, vidx=vidx:
                                hw[hidx] == vw[vidx],
                            ("h%d" % rownum, "v%d" % colnum))

    p.addConstraint(constraint.AllDifferentConstraint())
    return p.getSolution()

def apply_solutions(grid, solutions):
    across, down = grid.get_words()
    nums = grid.get_numbered_cells(across,down)
    for k, v in across.items():
        grid.fillcells(across[k], solutions["h%d" % nums[k]])
    return grid

INPUT = {}

INPUT[0] = """___#___
___#___
_______
##___##
_______
___#___
___#___"""

INPUT[777] = """abz
___
zzz"""

INPUT[1] = """____#___
____#___
____#___
###____#
#____###
___#____
___#____
___#____"""

INPUT[3] = """____
____
____
____""" 

INPUT[4] = """_____
_____
_____
_____
_____""" 

INPUT[2] = """##___#
#_____
______
______
_____#
#___##"""

INPUT[45] = """____#_____
____#_____
____#_____
____#_____
______####
####______
_____#____
_____#____
_____#____
_____#____"""

INPUT[88] = """____#____
____#____
___#_____
_____#___
###___###
___#_____
_____#___
____#____
____#____"""

INPUT[1215] = """___#___#___
___#___#___
___#___#___
_____#_____
###___#____
___#___#___
____#___###
_____#_____
___#___#___
___#___#___
___#___#___"""

INPUT[9898] = """___#_____#_____
___#_____#_____
___#_____#_____
_____#___#_____
____##_____####
###__#____#____
_____#_________
______###______
_________#_____
____#____#__###
####_____##____
_____#___#_____
_____#_____#___
_____#_____#___
_____#_____#___"""

INPUT[9892] = """#___#____#____#
____#____#_____
____#____#_____
___#___#___#___
_____####___###
###___#___#____
____#____##____
___##_____##___
____##____#____
____#___#___###
###___####_____
___#___#___#___
_____#____#____
_____#____#____
#____#____#___#"""


def solve_input(*args):
    global INPUT

    if len(args) == 2:
        gridwant = int(args[1])
        grid = Grid(INPUT[gridwant])
    elif len(args) == 3:
        INPUT = "".join([c+"\n" if (i+1) % int(args[2]) == 0 else c for i,c in enumerate(args[1])])
        grid = Grid(INPUT.strip())
    else:
        gridwant = 1
        grid = Grid(INPUT[gridwant])
    gridid = None
    if grid:
        import MySQLdb
        ostr = str(grid)
        db = MySQLdb.connect("127.0.0.1","root","")
        db.select_db("xword")
        c = db.cursor()
        c.execute("insert into working_randoms values (NULL,'%s',NULL,NOW())" % (ostr, ))
        gridid = db.insert_id()

    solutions = solve(grid)
    if solutions:

        solstr = apply_solutions(grid, solutions)
        result = solstr
        c.execute("update working_randoms set result='%s' where id=%d" % (solstr,gridid))
        for code, solution in solutions.items():
            c.execute("insert into working_random_words values (NULL, '%s','%s',%d)" % (code, solution, gridid))
        return result
    else:
        return False

if __name__ == "__main__":
    import sys
    print solve_input(*sys.argv)
