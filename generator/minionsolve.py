#!/usr/bin/env python
import sys
import os
import json
from crossword import *
from collections import defaultdict
from random import randrange
from subprocess import Popen, PIPE
from defaultgrids import INPUT
import re
import MySQLdb
from ConfigParser import ConfigParser
from optparse import OptionParser
import pickle


cp = ConfigParser()
cp.read("%s/../site_config.ini" % sys.path[0])
config = dict(cp.items('local_dev'))

MINION_PATH = config['minion.path']
DICTIONARY_PATH = config['dictionary.path']

gridid = None
db = MySQLdb.connect(config['database.host'],config['database.username'],config['database.password'])
c = db.cursor()

words = [l.strip() for l in open(DICTIONARY_PATH,"r").readlines()]
words_by_length = defaultdict(list)

for word in words:
    words_by_length[len(word)].append(word)
    
def add_word_constraint(key, word):
    matching = re.compile(word.replace(BLANK,"[a-z]"))
    words = [_ for _ in words_by_length[len(word)] if matching.match(word)]
    return words

def add_filled_words(words):
    for k, v in words:
        if BLANK not in v:
            words_by_length[len(v)].append(v)

def parse_puz_file(filename):
    f = open(os.path.join(config['upload.path'], filename),'r')
    lines = f.read().split("\x00")
    f.seek(0x2C)
    width = ord(f.read(1))
    height = ord(f.read(1))
    assert(width==height)
    f.seek(0x34)
    celldata = f.read(width*height).replace(".","#")
    celldata = "".join([c + "\n" if (idx+1) % width==0 else c for idx,c in enumerate(celldata)]).strip()
    g = Grid(initial_data=celldata)

    ws = sorted(g.get_numbered_cells(*g.get_words()).items(), cmp=lambda x,y:cmp(x[1],y[1]))
    answers = {}
    f.seek(0x34+(width*height)*2)
    cluestr = f.read()
    clues = cluestr.split("\x00")
    title = "--".join([line.decode('latin-1').encode('utf-8') for line in clues[0:3] if line.strip()])
    clues = clues[3:]
    for k,v in ws:
        row = g.row_at(k.x,k.y)
        col = g.col_at(k.x,k.y)

        if row.index(k) == 0:
            answers['across_%d' % v] = clues.pop(0).decode('latin-1').encode('utf-8','ignore')
        if col.index(k) == 0:
            answers['down_%d' % v] = clues.pop(0).decode('latin-1').encode('utf-8','ignore')

    return g, answers, title

#unicodedata.normalize('NFKD',unicode(clues.pop(0))).encode('ascii','ignore')
def solve(grid, timelimit=10):
    across, down = grid.get_words()
    nums = grid.get_numbered_cells(across,down)
    formed_across = Grid.format_words(across, nums)
    formed_down = Grid.format_words(down, nums)
    filled_words = add_filled_words(formed_across + formed_down)
    filename = '/tmp/%s.minion' % ("".join([chr(randrange(65,85)) for n in range(10)]))
    outfile = open(filename, 'w')
    outfile.write("MINION 3\n")
    outfile.write("**VARIABLES**\n")
    allwords = []

    for word in formed_across:
        key = "across%d" % word[0]
        allwords.append((key,word[1]))
        outfile.write("DISCRETE %s[%d] {97..122}\n" % (key,len(word[1])))

    for word in formed_down:
        key = "down%d" % word[0]
        allwords.append((key, word[1]))
        outfile.write("DISCRETE %s[%d] {97..122}\n" % (key,len(word[1])))                     
    for word in formed_across:
        key = "h%d" % word[0]
        words = add_word_constraint(key, word[1])
        outfile.write("**TUPLELIST**\n%s %s %s\n" % (key, len(words), len(words[0])))
        outfile.write("\n".join([" ".join([str(ord(c)) for c in word]) for word in words]))
        outfile.write("\n")
    for word in formed_down:
        key = "v%d" % word[0]
        words = add_word_constraint(key, word[1])
        outfile.write("**TUPLELIST**\n%s %s %s\n" % (key, len(words), len(words[0])))
        outfile.write("\n".join([" ".join([str(ord(c)) for c in word]) for word in words]))
        outfile.write("\n")
    outfile.write("**CONSTRAINTS**\n")
    for word, itword in allwords:
        if len(itword) > 1:
            outfile.write("\n".join([("watchvecneq(%s,%s)" % (w, word)) for w,wcon in allwords if w != word and len(wcon) == len(itword)]))
            outfile.write("\n")

    for start, word in across.items():
        rownum = nums[word[0]]
        for hidx, cell in enumerate(word):
            column = grid.col_at(cell.x, cell.y)
            colnum = nums[column[0]]
            vidx = column.index(cell)
            outfile.write("eq(across%d[%d],down%d[%d])" % (rownum, hidx, colnum, vidx))
            outfile.write("\n")
    diffs = []

    for word in Grid.format_words(across, nums):
        key = "across%d" % word[0]
        diffs.append("h%d" %word[0])
        outfile.write("table(across%d, h%d)\n" % (word[0],word[0]))
    for word in Grid.format_words(down, nums):
        key = "down%d" % word[0]
        diffs.append("v%d" % word[0])
        outfile.write("table(down%d, v%d)\n" % (word[0],word[0]))
    outfile.write("**EOF**")
    outfile.close()

    execstr = "%s %s -varorder sdf-random -noresume -timelimit %d" % (
        MINION_PATH, 
        filename,
        30) # timelimit)

    p = Popen(execstr,
              shell=True,stdin=PIPE, stdout=PIPE, stderr=PIPE)
    stdoutput = p.stdout.readlines()
    stderrput = p.stderr.readlines()
    sollines = [line for line in stdoutput if line.startswith('Sol:')]
    sollines = dict(zip(diffs, ["".join([chr(int(c)) for c in line[4:].strip().split(' ')]) for line in sollines]))
#    os.remove(filename)
    return sollines

def apply_solutions(grid, solutions):
    across, down = grid.get_words()
    nums = grid.get_numbered_cells(across,down)
    for k, v in across.items():
        grid.fillcells(across[k], solutions["h%d" % nums[k]])
    return grid

def solve_input(opts, *args, **kwargs):
    clues = None
    global INPUT
    global c
    global gridid
    fallback = True
    title = None
    if opts.loadbook:
        f = "".join(open(os.path.join(config['upload.path'],opts.loadbook),'r').readlines()).replace("\r\n"," ")
        ws = {}
        import re
        startstr = "*** START"
        endstr = "*** END"
        try:
            bstart = f.index(startstr)
            tstart = f.index("EBOOK",bstart)+6
            bend = f.index(endstr)
            title = f[tstart:f.index("***",bstart+len(startstr))]
            f = f[f.index("***",bstart+len(startstr))+3:bend]
        except:
            pass
        sentencebreak = re.compile(r"[!.?]")
        for l in re.split(sentencebreak,f):
            l=l.strip()
            for w in l.split(" "):
                if re.match("^\w+$",w):
                    ws["".join(re.findall("\w+",w)).lower()] = l
                    
        clues = ws
        global words_by_length
        words_by_length = defaultdict(list)
        for lemma, definition in ws.items():
            #sys.stderr.write(lemma + "\n")
            words_by_length[len(lemma)].append(lemma.lower())
        #print list(words_by_length.items())[0:20]
        fallback = False
        #sys.exit(0)
    grid = None

    if opts.puz_file:
        puzzle, answers, title = parse_puz_file(opts.puz_file)
        return puzzle, answers, title
    if opts.ID:
        gridwant = int(opts.ID)
        grid = Grid(INPUT[gridwant])
    elif opts.pregrid:
        import random
        g = pickle.loads(open("/home/adam/unfailed_grids.pickle", "r").read())
        grid = Grid(random.choice(g))
    else:
        if opts.cells and opts.size:
            INPUT = "".join([cell+"\n" if (i+1) % int(opts.size) == 0 else cell for i,cell in enumerate(opts.cells)])
            grid = Grid(INPUT.strip())
        elif opts.size:
            grid = Grid(size=int(opts.size))

    if grid:
        ostr = str(grid)
        db.select_db("xwutf")
        c.execute("insert into working_randoms values (NULL,'%s',NULL,NOW())" % (ostr, ))
        gridid = db.insert_id()

    if opts.blacken and grid: 
        grid = random_grid(grid, opts.pctblack)
    solutions = solve(grid)
    if clues and solutions:
        solstr = apply_solutions(grid, solutions)
        across, down = grid.get_words()
        nums = grid.get_numbered_cells(across,down)
        formed_across = Grid.format_words(across, nums)
        formed_down = Grid.format_words(down, nums)
        answers = {}
        for n, a in formed_across:
            wordre = re.compile(a,re.I)
            answers["across_%d" % n] = re.sub(wordre,"_" * len(a),clues[a])
        for n, a in formed_down:
            wordre = re.compile(a,re.I)
            answers["down_%d" % n] = re.sub(wordre,"_" * len(a),clues[a])
        return solstr, answers, title
    elif solutions:
        solstr = apply_solutions(grid, solutions)
        result = solstr
        c.execute("update working_randoms set result='%s' where id=%d" % (solstr,gridid))
        for code, solution in solutions.items():
            c.execute("insert into working_random_words values (NULL, '%s','%s',%d)" % (code, solution, gridid))
        return solstr
    elif fallback:
        c.execute("""select * from xwutf.working_randoms where original like "%s" and result is not null order by rand() limit 1""" % (ostr))
        r = c.fetchone()
        if r:
            return Grid(initial_data=r[2])
    return False

if __name__ == "__main__":
    
    import sys
    parser = OptionParser()
    parser.add_option("-b", "--blacken-cells", dest="blacken", default=False,
                      action="store_true",
                      help="add black cells before attempting to solve grid")
    parser.add_option("-p","--percent-black", type="float",
                      dest="pctblack", default=0.2,
                      help="percentage of black cells to add")
    parser.add_option("-g","--pregrid", action="store_true",
                          dest="pregrid", default=False),
    parser.add_option("-d", "--predefined-grid-id", dest="ID",
                      help="use predefined grid of id")
    parser.add_option("-c", "--cells", dest="cells",
                      help="use grid defined by cells")
    parser.add_option("-s","--size", dest="size",
                      help="specifies the size of the grid defined by cells or generates a new grid with the specified size")
    parser.add_option("-f","--format", dest="format", default="plain",
                      help="json or plain")
    parser.add_option("-t","--time-limit",default=2, type="int",
                      help="minion's timeout time")
    parser.add_option("-l","--load-book",dest="loadbook",
                      help="uses a plaintext book as a dictionary")
    parser.add_option("-z","--parse-puz",dest="puz_file",
                      help="parses a PUZ file")

    opts, args = parser.parse_args()

    #import cProfile
    #solved = cProfile.run('solve_input(opts)')
    solved = solve_input(opts)
    if solved.__class__ == tuple:
        result = {"result":str(solved[0]).replace("\n","") if solved else "*",
                  "size":len(solved[0].cells[0]),
                  "saved_id":gridid,
                  "clues":solved[1],
                  "title":solved[2]}

        rstr = json.dumps(result)
        print rstr
        
    elif opts.format == "plain":
        print solved if solved else Grid(opts.cells)
        
    elif opts.format == "json":

        result = {"result":str(solved).replace("\n","") if solved else "*",
             "size":len(solved.cells[0]) if solved else 1,
             "saved_id":gridid}

        print json.dumps(result)
