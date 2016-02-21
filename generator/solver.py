from crossword import Grid
from subprocess import Popen, PIPE
import cStringIO


class MinionSolver:

    class UnsuccessfulSolveException(Exception):
        pass
    
    def __init__(self, minion_path):
        self.minion_path = minion_path

    def _get_minion_string(self, grid, wordlist):
        across, down = grid.get_words()
        nums = grid.get_numbered_cells(across, down)
        formed_across = Grid.format_words(across, nums)
        formed_down = Grid.format_words(down, nums)
        outfile = cStringIO.StringIO()
        outfile.write("MINION 3\n")
        outfile.write("**VARIABLES**\n")
        allwords = []

        for word in formed_across:
            key = "across%d" % word[0]
            allwords.append((key, word[1]))
            outfile.write("DISCRETE %s[%d] {97..122}\n" % (key, len(word[1])))
            

        for word in formed_down:
            key = "down%d" % word[0]
            allwords.append((key, word[1]))
            outfile.write("DISCRETE %s[%d] {97..122}\n" % (key, len(word[1])))

        for word in formed_across:
            key = "h%d" % word[0]
            words = wordlist.words_matching(word[1])
            outfile.write("**TUPLELIST**\n%s %s %s\n" % (key, len(words), len(words[0])))
            outfile.write("\n".join([" ".join([str(ord(c)) for c in word]) for word in words]))
            outfile.write("\n")

        for word in formed_down:
            key = "v%d" % word[0]
            words = wordlist.words_matching(word[1])
            outfile.write("**TUPLELIST**\n%s %s %s\n" % (key, len(words), len(words[0])))
            outfile.write("\n".join([" ".join([str(ord(c)) for c in word]) for word in words]))
            outfile.write("\n")

        outfile.write("**CONSTRAINTS**\n")
        for word, itword in allwords:
            if len(itword) > 1:
                outfile.write("\n".join([
                    ("watchvecneq(%s,%s)" % (w, word))
                    for w, wcon in allwords
                    if w != word and len(wcon) == len(itword)]))
                outfile.write("\n")

        for start, word in across.items():
            rownum = nums[word[0]]
            for hidx, cell in enumerate(word):
                column = grid.col_at(cell.x, cell.y)
                colnum = nums[column[0]]
                vidx = column.index(cell)
                outfile.write("eq(across%d[%d],down%d[%d])" % (rownum, hidx, colnum, vidx))
                outfile.write("\n")
        self.diffs = []

        for word in Grid.format_words(across, nums):
            key = "across%d" % word[0]
            self.diffs.append("h%d" % word[0])
            outfile.write("table(across%d, h%d)\n" % (word[0], word[0]))

        for word in Grid.format_words(down, nums):
            key = "down%d" % word[0]
            self.diffs.append("v%d" % word[0])
            outfile.write("table(down%d, v%d)\n" % (word[0], word[0]))

        outfile.write("**EOF**")
        return outfile.getvalue()
    
    def apply_solutions(self, grid, solutions):
        across, down = grid.get_words()
        nums = grid.get_numbered_cells(across, down)
        for k, v in across.items():
            grid.fillcells(across[k], solutions["h%d" % nums[k]])
        return grid

    def solve(self, grid, wordlist, timelimit=20):
        execstr = "%s -- -varorder sdf-random -noresume -timelimit %d -sollimit 1 -printsolsonly" % (
            self.minion_path,
            timelimit)

        p = Popen(execstr.split(),
                  stdin=PIPE,
                  stdout=PIPE,
                  stderr=PIPE)
        stdoutput, stderrors = p.communicate(input=self._get_minion_string(grid, wordlist))
        sollines = dict(zip(self.diffs, ["".join([chr(int(c)) for c in l.strip().split(' ')]) for l in stdoutput.split('\n') if l]))
        
        if sollines:
            return self.apply_solutions(grid, sollines)
        raise self.UnsuccessfulSolveException("Solver timed out")
