import os
import shutil
import random
import string

import mutagen
from mutagen.easyid3 import EasyID3
from mutagen.id3 import ID3, APIC

SRC = "short.mp3"
SRC_ART = "short_art.mp3"
DST_DIR = "output"
COVER = "index.jpg"

def get_meta(filePath):
    try:
        meta = EasyID3(f)
    except mutagen.id3.ID3NoHeaderError:
        meta = mutagen.File(f, easy=True)
        meta.add_tags()
    return meta

def add_cover_art(filePath, coverFilePath):
    try:
        meta = ID3(f)
    except mutagen.id3.ID3NoHeaderError:
        meta = mutagen.File(f, easy=True)
        meta.add_tags()

    #import pdb; pdb.set_trace()
    meta.add(
        APIC(
            encoding=3, # 3 is for utf-8
            mime='image/jpg', # image/jpeg or image/png
            type=3, # 3 is for the cover image
            desc=u'Cover',
            data=open(coverFilePath).read()
        )
    )
    meta.save(v2_version=3, v1=2)


print "Creating directory for mp3 files: {}".format(DST_DIR)
try:
    os.mkdir(DST_DIR)
except OSError:
    print "    Directory {} exists".format(DST_DIR)



f = os.path.join(DST_DIR, "short_notags1.mp3")
shutil.copy(SRC, f)

f = os.path.join(DST_DIR, "short_notags2.mp3")
shutil.copy(SRC, f)

f = os.path.join(DST_DIR, "short_album_only.mp3")
shutil.copy(SRC, f)
meta = get_meta(f)
meta["album"] = "Firts Album"
meta.save()

f = os.path.join(DST_DIR, "short_album_only_long.mp3")
shutil.copy(SRC, f)
meta = get_meta(f)
meta["album"] = "Firts Album Looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong"
meta.save()

f = os.path.join(DST_DIR, "short_title_only.mp3")
shutil.copy(SRC, f)
meta = get_meta(f)
meta["title"] = "Good title"
meta.save()

f = os.path.join(DST_DIR, "short_title_only_long.mp3")
shutil.copy(SRC, f)
meta = get_meta(f)
meta["title"] = "Title Very Looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong"
meta.save()

for i in range(9,-1,-1):
    f = os.path.join(DST_DIR, "short_album1_track_{}.mp3".format(i))
    shutil.copy(SRC, f)
    meta = get_meta(f)
    r_part = ''.join(random.choice(string.ascii_lowercase) for _ in range(5))
    meta["title"] = "{} title (track - {})".format(r_part, i+1)
    meta["album"] = "Album #1"
    meta["artist"] = "Myself Artist ____________________________________________________ Cool"
    meta["tracknumber"] = str(i+1)
    meta.save()

for i in range(1000):
    f = os.path.join(DST_DIR, "short_album2_track_{}.mp3".format(i))
    shutil.copy(SRC_ART, f)
    meta = get_meta(f)
    r_part = ''.join(random.choice(string.ascii_lowercase) for _ in range(5))
    meta["title"] = "{} title (track - {})".format(r_part,i+1)
    meta["album"] = "Album #2"
    meta["artist"] = "Myself Artist Cool"
    meta["tracknumber"] = str(i+1)
    meta.save()
    #add_cover_art(f, COVER)

for i in range(10):
    f = os.path.join(DST_DIR, "short_album3_track_{}.mp3".format(i))
    shutil.copy(SRC, f)
    meta = get_meta(f)
    r_part = ''.join(random.choice(string.ascii_lowercase) for _ in range(10))
    meta["title"] = "{} title".format(r_part)
    meta["album"] = "Album #3 (without track numbers)"
    meta["artist"] = "Myself Artist Cool"
    meta.save()

# rem ===== Album 1 ======
# set file="output\short_album1_track1.mp3"
# copy short.mp3 %file%
# eyeD3 --title "z1 title" --album "Album #1" --artist "MySelf" -n 1 %file%

# set file="output\short_album1_track2.mp3"
# copy short.mp3 %file%
# eyeD3 --title "a2 title" --album "Album #1" --artist "MySelf" -n 2 %file%

# set file="output\short_album1_track3.mp3"
# copy short.mp3 %file%
# eyeD3 --title "g3 title" --album "Album #1" --artist "MySelf" -n 3 %file%

# set file="output\short_album1_track4.mp3"
# copy short.mp3 %file%
# eyeD3 --title "04 title" --album "Album #1" --artist "MySelf" -n 4 %file%

# set file="output\short_album1_track5.mp3"
# copy short.mp3 %file%
# eyeD3 --title "k5 title" --album "Album #1" --artist "MySelf" -n 5 %file%

# rem ===== Album 2 ======
# set file="output\short_album2_track1.mp3"
# copy short_art.mp3 %file%
# eyeD3 --title "a1 title" --album "Album #2" --artist "MySelf" -n 1 %file%

# set file="output\short_album2_track2.mp3"
# copy short_art.mp3 %file%
# eyeD3 --title "b2 title" --album "Album #2" --artist "MySelf" -n 2 %file%

# set file="output\short_album2_track3.mp3"
# copy short_art.mp3 %file%
# eyeD3 --title "c3 title" --album "Album #2" --artist "MySelf" -n 3 %file%

# set file="output\short_album2_track4.mp3"
# copy short_art.mp3 %file%
# eyeD3 --title "d4 title" --album "Album #2" --artist "MySelf" -n 4 %file%

# set file="output\short_album2_track5.mp3"
# copy short_art.mp3 %file%
# eyeD3 --title "e5 title" --album "Album #2" --artist "MySelf" -n 5 %file%






