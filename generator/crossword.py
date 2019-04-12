import random


BLANK="_"
BLACK="#"


def cell_cmp(a, b):
    cmped = cmp(a.y, b.y)
    if cmped is not 0:
        return cmped
    else:
        return cmp(a.x, b.x)


class Cell:
    def __init__(self, x, y, is_black=False, initial_value=None):
        self.x = x
        self.y = y
        self.is_black = is_black
        self.value = BLANK
        if not is_black and initial_value != BLANK and initial_value:
            self.value = initial_value

    def set_value(self, new_val):
        self.value = new_val

    def __str__(self):
        if self.is_black:
            return "%s" % ("*")
        else:
            return ("%s" % (self.value if self.value else "_")).replace("None", "_").upper()


class Grid:
    def __call__(self, *args, **kwargs):
        return str(self)

    def __init__(self, initial_data=None, size=None, from_grid=None):
        self.size = size
        if initial_data:
            if size:
                initial_data = "".join([c + "\n" if (idx + 1) % size == 0 else c for idx, c in enumerate(initial_data)])
            split_data = [c for c in initial_data.split('\n') if c]
            self.cells = [[Cell(colnum,
                                rownum,
                                is_black=True if c == BLACK else False,
                                initial_value=c)
                           for colnum, c in enumerate(l)] for rownum, l
                          in enumerate(split_data)]
            self.rows = len(self.cells)
            self.cols = len(self.cells[0])
            self.size = len(self.cells[0])
            if size:
                self.rows = size
                self.cols = size
                self.size = size

        elif size:
            self.cells = [[Cell(colnum, rownum) for colnum in range(size)]
                          for rownum in range(size)]
            self.rows = size
            self.cols = size
        elif from_grid:
            self.cells = [[
                Cell(
                    c.x,
                    c.y,
                    initial_value=c.value,
                    is_black=c.is_black)
                for c in r] for r in from_grid.cells]
            self.rows = from_grid.rows
            self.cols = from_grid.cols

    def get_cell_id(self, cell):
        return self.size * cell.y + cell.x + 1

    def fillcells(self, cells, word):
        return [cell.set_value(word[idx]) for idx, cell in enumerate(cells)]

    def _col(self, n):
        return [l[n] for l in self.cells]

    def get_bounds(self, cells, position):
        lbound = 0
        for idx, cell in enumerate(cells):
            if idx < position and cell.is_black:
                lbound = idx + 1
            if idx > position and cell.is_black:
                return (lbound, idx)
        return (lbound, len(cells))

    def col_at(self,x,y):
        fullcol = self._col(x)
        bounds = self.get_bounds(fullcol,y)
        return fullcol[bounds[0]:bounds[1]]

    def row_at(self,x,y):
        fullrow = self.cells[y]
        bounds = self.get_bounds(fullrow, x)
        return fullrow[bounds[0]:bounds[1]]

    def __str__(self):
        return ("\n".join(["".join([str(c) for c in l]) for l in self.cells]))

    @staticmethod
    def stringify_cells(cells):
        stri = "".join([str(c.value) for c in cells])
        return stri

    def get_numbered_cells(self, a, d):
        return dict([
            (c, v + 1) for v, c in
            enumerate(sorted(set(a.keys() + d.keys()), cmp=cell_cmp))])

    @staticmethod
    def format_words(words, nums):
        return sorted([
            (nums[start], Grid.stringify_cells(word)) for start, word in words.items()],
            cmp=lambda a,b:cmp(a[0], b[0]))

    def get_words(self):
        ar, dr = {}, {}
        for r in self.cells:
            for c in r:
                if not c.is_black:
                    col = self.col_at(c.x, c.y)
                    row = self.row_at(c.x, c.y)
                    dr[col[0]] = col
                    ar[row[0]] = row
        return (ar, dr)

    def blackening_candidates(self):
        MIN_LEN = 3
        results = []
        for row in self.cells:
            for cell in [c for c in row
                         if not c.is_black
                         and c.value == "_" and self.opposite(c).value == "_"]:
                row = self.row_at(cell.x,cell.y)
                col = self.col_at(cell.x,cell.y)
                rowindex= row.index(cell)
                colindex = col.index(cell)
                prerowlen = len([c for c in row[:rowindex] if c is not cell])
                porowlen = len([c for c in (row[rowindex:]) if c is not cell])
                precollen = len([c for c in (col[:colindex]) if c is not cell])
                pocollen = len([c for c in (col[colindex:]) if c is not cell])
                col = self.col_at(cell.x,cell.y)

                if (cell in row and cell in col):
                    dist = False
                    if ((prerowlen == 0 or prerowlen >= MIN_LEN) and
                        (porowlen >= MIN_LEN or porowlen == 0 ) and not
                        (prerowlen == 0 and porowlen == 0) and
                        (precollen == 0 or precollen >= MIN_LEN) and
                        (pocollen >= MIN_LEN or pocollen == 0) and not
                        (precollen == 0 and pocollen == 0)):
                        if self.opposite(cell) in row:
                            dist = abs(row.index(cell) - row.index(self.opposite(cell)))
                        if self.opposite(cell) in col:
                            dist = abs(col.index(cell) - col.index(self.opposite(cell)))
                        if not dist:
                            results.append(cell)
                        else:
                            if dist > MIN_LEN:
                                results.append(cell)
        return results

    def num_blackened(self):
        return len([[c for c in row if c.is_black] for row in self.cells])

    def is_valid(self):
        a, d = self.get_words()
        words = a.values() + d.values()
        return all(len(x) > 2 for x in words)

    def opposite(self, cell):
        return self.cells[abs(self.rows - cell.y) - 1][abs(self.cols - cell.x) - 1]

    def all_accessible_flood_fill(self):
        all_nonblack = [blank for row in self.cells for blank in row if not blank.is_black]
        if all_nonblack:
            accessible = [all_nonblack[0]]
            result = []
            while accessible:
                n = accessible.pop()
                if n.x-1 >= 0 and n not in result:
                    if not self.cells[n.x-1][n.y].is_black:
                        accessible.append(self.cells[n.x-1][n.y])
                if n.x+1 < self.cols and n not in result:
                    if not self.cells[n.x+1][n.y].is_black:
                        accessible.append(self.cells[n.x+1][n.y])
                if n.y-1 >= 0 and n not in result:
                    if not self.cells[n.x][n.y-1].is_black:
                        accessible.append(self.cells[n.x][n.y-1])
                if n.y+1 < self.rows and n not in result:
                    if not self.cells[n.x][n.y+1].is_black:
                        accessible.append(self.cells[n.x][n.y+1])
                if n not in result:
                    result.append(n)
        return len(result) == len(all_nonblack)

    def all_accessible_by_words(self):
        across, down = self.get_words()
        for starta, aword in across.items():
            if len([c for c in aword if any(c in dword for dword in down.values())]) == 1:
                return False
        return True

    def adjacent_to(self, cell, f=lambda x: True):
        rowbounds = (cell.x - 1 if cell.x - 1 >= 0 else 0, cell.x + 1 if cell.x + 1 <= self.cols else cell.x + 1)
        colbounds = (cell.y - 1 if cell.y - 1 >= 0 else 0, cell.y + 1 if cell.y + 1 <= self.rows else cell.y + 1)
        adj = [row[rowbounds[0]:rowbounds[1] + 1] for row in self.cells[colbounds[0]:colbounds[1] + 1]]
        results = []
        for line in adj:
            for c in line:
                if f(c) and cell != c:
                    results.append(c)
        return results

    def num_black(self):
        return len([x for row in self.cells for x in row if x.is_black])

    def cell_is_on_edge(self, cell):
        return (cell.x == 0 or cell.y == 0 or cell.x == self.cols or cell.y == self.rows)

def random_grid(xword, pct):
    for i in range(int(((xword.rows * xword.cols) * pct / 2 - xword.num_black() / 2))):
        candidates = xword.blackening_candidates()

        if candidates:
            r = random.choice(candidates)
            r.is_black = True
            opposite = xword.opposite(r)
            opposite.is_black = True

            if xword.adjacent_to(r, lambda c: c is opposite) or r == opposite:
                if not xword.all_accessible_flood_fill():
                    r.is_black = False
                    xword.opposite(r).is_black = False
        else:
            break

    return xword

if __name__ == "__main__":
    print
    g = Grid(size=21)
    print random_grid(g, 0.3)
    print g
