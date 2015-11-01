import sys


if __name__ == "__main__":
    lines = [l.split(" ") for l in sys.stdin.readlines()]
    size = len("".join(lines[0]).strip())
    output = ""
    grid = ""
    for i, l in enumerate(lines):
        l = "".join(l).strip()
        if i % (size) == 0:
            print grid,
            grid = ""

        if i / size % 2 == 0:
            grid += "".join("#" if c == '1' else "_" for c in l)
