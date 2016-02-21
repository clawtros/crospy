import re
import random
from collections import defaultdict

from cluefilters import dequotes, valid_clue
from crossword import BLANK

import MySQLdb


class WordList(object):
    clue_validators = [valid_clue]
    clue_processors = [dequotes]
    words = {}

    def should_use_clue(self, clue):
        return all(validator(clue) for validator in self.clue_processors)

    def process_clue(self, clue):
        result = clue
        for processor in self.clue_processors:
            result = processor(clue)
        return result

    def words_matching(self, word):
        matching = re.compile("^{}$".format(word.replace(BLANK, "[a-z]")))
        return [t for t in self.words.keys() if matching.match(t)]

    def define(self, word):
        return self.words.get(word)


class MySQLWordList(WordList):

    def __init__(self, username, password, host, table_name, database="xwutf", word_column="word", definition_column="definition", encoding="utf-8"):
        self.db = MySQLdb.connect(host, username, password)
        self.encoding = encoding
        c = self.db.cursor()
        # FIXME: parameterize this -- mysqldb breaks the table_name w/ quotes
        c.execute("SELECT %s, %s FROM %s.%s" % (word_column, definition_column, database, table_name,))

        for row in c.fetchall():
            clue = row[1]
            if self.should_use_clue(clue):
                self.words[str(row[0])] = str(self.process_clue(clue))

    def define(self, word):
        definitions = super(MySQLWordList, self).define(word).split('|||')
        return unicode(random.choice(definitions), self.encoding)


class FileBasedWordList(WordList):
    def __init__(self, filename):
        with open(filename, 'r') as infile:
            self.words = defaultdict(list)
            for line in infile.readlines():
                clue = self.get_clue_from_line(line)
                if self.should_use_clue(clue):
                    self.words[self.get_word_from_line(line)].append(self.process_clue(clue))

    def define(self, word):
        return random.choice(super(FileBasedWordList, self).define(word.lower()))


class SeparatedFileBasedWordList(FileBasedWordList):
    separator = "\t"
    word_index = 1
    clue_index = 0
    
    def get_word_from_line(self, line):
        return line.split(self.separator)[self.word_index].lower()

    def get_clue_from_line(self, line):
        return line.split(self.separator)[self.clue_index]
    

class FixedWidthFileBasedWordList(FileBasedWordList):
    word_end_index = 26
    clue_start_index = 37
    
    def get_word_from_line(self, line):
        return line[:self.word_end_index].strip().lower()

    def get_clue_from_line(self, line):
        return line[self.clue_start_index:].strip()


