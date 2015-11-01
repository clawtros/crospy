import sys
sys.path.append('.')
import MySQLdb
import en
print "begin"
db = MySQLdb.connect('127.0.0.1','root','')
db.select_db("wordnet30")
cursor = db.cursor()
db.query('truncate flat_dict_with_plurals')
cursor.execute("""select synsetid, wordid, casedwordid, replace(lemma,' ','') as word, senseid, sensenum, lexid, tagcount, sensekey, cased, group_concat(pos separator ','), lexdomainid, group_concat(definition separator '|||'), sampleset from flat_dict where replace(lemma,' ','') regexp '^[a-z]+$' group by lemma
""")
nonpl = [0,20,18,15,26,27,5,2]
for row in cursor:
    past = None
    prespart = None
    pled = None
    orow = list(row)
    original_word = orow[3]
    qstr = "insert into flat_dict_with_plurals values (%s)" % (",".join(['"%s"' % str(i if i else "") for i in row]))
    try:
        db.query(qstr)
    except:
        pass
    if (('n' in orow[12] or 'v' in orow[12]) and int(orow[11]) not in nonpl):
        try:
            pled = en.plural.plural(orow[3])
        except:
            pass
        if pled != original_word and pled:
            orow[3] = pled
            orow[12] = orow[12].replace('|||',' [pl] |||') + ' [pl]'
            try:
                db.query("insert into flat_dict_with_plurals values (%s)" % (",".join(['"%s"' % str(i if i else "") for i in orow])))
            except:
                print "plexp"
    if 'v' in orow[12]:
        try:
            past = en.verb.past(orow[3])
        except:
            pass
        try:
            prespart = en.verb.present_participle(orow[3])
        except:
            pass
        if past != original_word and past:
            orow[3] = past
            orow[12] = row[12].replace('|||',' [past] |||') + '[past]'
            try:
                db.query("insert into flat_dict_with_plurals values (%s)" % (",".join(['"%s"' % str(i if i else "") for i in orow])))
            except:
                pass
        if prespart != original_word and prespart:
            orow[3] = prespart
            orow[12] = row[12].replace('|||',' [pp] |||') + '[pp]'
            try:
                db.query("insert into flat_dict_with_plurals values (%s)" % (",".join(['"%s"' % str(i if i else "") for i in orow])))
            except:
                pass
