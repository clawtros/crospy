import crossword
import os

def extract_worddefs(grid, across_clues, down_clues):
    across_words, down_words = grid.get_words()
    def ordered(words):
        result = ""
        def toID(c, s=15):
            return c.x + s * c.y
        ordered = []
        for k, v in words.items():
            ordered.append((toID(k), "".join("%s" % (str(c)) for c in v)))
        #wat
        return [v for k, v in sorted(ordered)]
    
    def merge_clues(words, clues):
        return zip(ordered(words), [term for term, number in clues])
    
    result = {}
    result.update(merge_clues(across_words, across_clues))
    result.update(merge_clues(down_words, down_clues))
    return result

def parse_puz_file(filename):
    f = open(filename,'r')
    
    lines = [l for l in f.read().split("\x00") if len(l) > 0]
    
    f.seek(0x2C)
    width = ord(f.read(1))
    height = ord(f.read(1))
    assert(width==height)
    
    clues = lines[7:]
    
    celldata = lines[4][0:width*height].replace(".","#")
    celldata = "".join([c + "\n" if (idx+1) % width==0 else c for idx,c in enumerate(celldata)]).strip()

    g = crossword.Grid(initial_data=celldata)
    aclues = []
    dclues = []
    words = g.cells
    ws = sorted(g.get_numbered_cells(*g.get_words()).items(), cmp=lambda x,y:cmp(x[1],y[1]))
    for k,v in ws:
        row = g.row_at(k.x,k.y)
        col = g.col_at(k.x,k.y)
        if row.index(k) == 0:
            aclues.append((clues.pop(0),v))
        if col.index(k) == 0:
            dclues.append((clues.pop(0),v))
    return g, aclues, dclues

result = {}
#path = "/Users/adam/projects/cruciverbalizer.com/gen/puz/%s%s%d.puz" 
#for location in [path % ("Aug", ("%d" % i).zfill(2), 14) for i in range(1, 30)]:
basedir = "/Users/adam/projects/cruciverbalizer.com/gen/puz/"
for location in os.listdir(basedir):
    try:
        grid, across, down = parse_puz_file(basedir + location)
        result.update(extract_worddefs(grid, across, down))
    except:
        print location

import re
filtered = {}
for k, v in result.items():
    if re.match("\d+-[AD]", v):
        print k, v
    else:
        filtered[k.lower()] = v

import MySQLdb

db = MySQLdb.connect("127.0.0.1", "root", "")
c = db.cursor()

c.executemany("replace into xwutf.nyt_dictionary (word, definition) values (%s, %s)", filtered.items())
db.commit()

print len(filtered)

