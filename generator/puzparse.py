import sys
sys.path.append('.')
import crossword

def parse_puz_file(filename):
    f = open(filename,'r')
    lines = f.read().split("\x00")
    f.seek(0x2C)
    width = ord(f.read(1))
    height = ord(f.read(1))
    assert(width==height)
    clues = lines[11:]
    celldata = lines[8][0:width*height].replace(".","#")
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

if __name__ == "__main__":
    puzzle, across, down = parse_puz_file("/Users/adam/Downloads/Jun1509.puz")
    print puzzle, across, down
