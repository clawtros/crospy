import sys

def is_valid(p):
    # words must be at least 3 characters
    padded = '1' + p + '1'
    return "101" not in padded and "1001" not in padded and len([c for c in p if c != '0']) / float(len(p)) < 0.25


def groups(size):
    current = ""
    result = []
    for count in range(2**size):
        current = bin(count)[2:]
        if is_valid(current.zfill(size)):
            result.append(current.zfill(size))
    return result


def get_minion_constraints(possibilities):
    result = ""
    size = len(possibilities[0])
    # all rows are rows
    for prefix in ['a', 'd']:
        for i in range(size):
            result += "table({0}{1}, possibilities)\n".format(prefix, i)
            
    # all cells are cells
    for i in range(size):
        for j in range(size):
            result += "eq(a{0}[{1}], d{1}[{0}])\n".format(i, j)

    # grid is symmetric
    for i in range(size):
        for j in range(size):
            result += "eq(a{0}[{1}], a{2}[{3}])\n".format(i, j, size - i - 1, size - j - 1)

    return result


def get_minion_vars(possibilities):
    result = ""
    size = len(possibilities[0])
    for prefix in ['a', 'd']:
        for i in range(size):
            result += "BOOL {0}{1}[{2}]\n".format(prefix, i, size)
    result += """**TUPLELIST**
possibilities {0} {1}\n{2}""".format(
    len(possibilities),
    size,
    "\n".join([" ".join(c for c in t) for t in possibilities]))
    return result



def generate_minioncode(size):
    possibilities = groups(size)
    return """MINION 3
**VARIABLES**
{0}
**CONSTRAINTS**
{1}
**EOF**
""".format(get_minion_vars(possibilities), get_minion_constraints(possibilities))


print generate_minioncode(int(sys.argv[1]) or 4)
