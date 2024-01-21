# noterender

barebones markdown/wiki note-taking app website thing. meant to be used with a
server that handles PUT on `/notes/src/:file` and POST `/notes/commit/`, but my
implementation is just nginx with a bash script in fcgiwrap (which is too hacky
for me to feel good sharing).
