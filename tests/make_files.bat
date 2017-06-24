set file="output\short_notags1.mp3"
copy short.mp3 %file%

set file="output\short_notags2.mp3"
copy short.mp3 %file%

set file="output\short_album_only.mp3"
copy short.mp3 %file%
eyeD3 --album "Firts Album" %file%

set file="output\short_album_only_long.mp3"
copy short.mp3 %file%
eyeD3 --album "Firts Album Looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong" %file%

set file="output\short_title_only.mp3"
copy short.mp3 %file%
eyeD3 --title "Good title" %file%

set file="output\short_title_only_long.mp3"
copy short.mp3 %file%
eyeD3 --title "Title Very Looooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooooong" %file%

rem ===== Album 1 ======
set file="output\short_album1_track1.mp3"
copy short.mp3 %file%
eyeD3 --title "z1 title" --album "Album ¹1" --artist "MySelf" -n 1 %file%

set file="output\short_album1_track2.mp3"
copy short.mp3 %file%
eyeD3 --title "a2 title" --album "Album ¹1" --artist "MySelf" -n 2 %file%

set file="output\short_album1_track3.mp3"
copy short.mp3 %file%
eyeD3 --title "g3 title" --album "Album ¹1" --artist "MySelf" -n 3 %file%

set file="output\short_album1_track4.mp3"
copy short.mp3 %file%
eyeD3 --title "04 title" --album "Album ¹1" --artist "MySelf" -n 4 %file%

set file="output\short_album1_track5.mp3"
copy short.mp3 %file%
eyeD3 --title "k5 title" --album "Album ¹1" --artist "MySelf" -n 5 %file%

rem ===== Album 2 ======
set file="output\short_album2_track1.mp3"
copy short_art.mp3 %file%
eyeD3 --title "a1 title" --album "Album ¹2" --artist "MySelf" -n 1 %file%

set file="output\short_album2_track2.mp3"
copy short_art.mp3 %file%
eyeD3 --title "b2 title" --album "Album ¹2" --artist "MySelf" -n 2 %file%

set file="output\short_album2_track3.mp3"
copy short_art.mp3 %file%
eyeD3 --title "c3 title" --album "Album ¹2" --artist "MySelf" -n 3 %file%

set file="output\short_album2_track4.mp3"
copy short_art.mp3 %file%
eyeD3 --title "d4 title" --album "Album ¹2" --artist "MySelf" -n 4 %file%

set file="output\short_album2_track5.mp3"
copy short_art.mp3 %file%
eyeD3 --title "e5 title" --album "Album ¹2" --artist "MySelf" -n 5 %file%





