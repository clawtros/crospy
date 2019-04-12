try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass
import re
from collections import defaultdict

from crossword import BLANK
import random


class WordList:
    pass


class MySQLWordList:
    words = {}

    def __init__(self, username, password, host, table_name, database="xwutf", word_column="word", definition_column="definition", encoding="utf-8"):
        self.db = pymysql.connect(host, username, password)
        self.encoding = encoding
        c = self.db.cursor()
        # FIXME: parameterize this -- mysqldb breaks the table_name w/ quotes
        c.execute("SELECT %s, %s FROM %s.%s" % (word_column, definition_column, database, table_name,))

        for row in c.fetchall():
            self.words[str(row[0])] = str(row[1])

    def words_matching(self, word):
        matching = re.compile("^{}$".format(word.replace(BLANK, "[a-z]")))
        words = [t for t in self.words.keys() if matching.match(t)]
        return words

    def define(self, word):
        definitions = self.words.get(word).split('|||')
        return unicode(random.choice(definitions), self.encoding)


class FileBasedWordList(WordList):
    words = defaultdict(list)

    def __init__(self, filename, get_word=lambda x: x, get_definition=lambda x: x):
        with open(filename) as infile:
            for line in infile.readlines():
                self.words[get_word(line)].append(get_definition(line))

    def words_matching(self, word):
        matching = re.compile("^{}$".format(word.replace(BLANK, "[a-z]")))
        return [t for t in self.words.keys() if matching.match(t)]

    def define(self, word):
        return random.choice(self.words.get(word))
