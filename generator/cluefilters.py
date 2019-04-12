def valid_clue(clue):
    badwords = ["Across",
                "Down",
                "puzzle's",
                "this puzzle",
                "circled",
                "starred clues"]
    if clue.startswith("See") or clue.startswith("[See") or clue.startswith("With"):
        return False
    if any(w in clue for w in badwords):
        return False
    if len(clue) < 2:
        return False
    return True


def dequotes(clue):
    if clue.startswith('"') and clue.endswith('"'):
        joiners = ['&ldquo;', '&rdquo;']
        result = ""
        split_clue = clue[1:-1].split('""')
        for i, part in enumerate(split_clue):
            result += part
            if (i + 1) < len(split_clue):
                result += joiners[i % 2]
        return result
    return clue
