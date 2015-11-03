import MySQLdb
import re
from crossword import BLANK
import random


class WordList:
    pass


class MySQLWordList:
    words = {}

    def __init__(self, username, password, host, table_name, database="xwutf", word_column="word", definition_column="definition"):
        self.db = MySQLdb.connect(host, username, password)
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
        return random.choice(definitions)
        
