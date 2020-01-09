.PHONY: init
init:
	git init
	elm init
	git add .
	git commit -a -m "Initial commit"


elm.js : src/Main.elm
	elm make src/Main.elm --output=elm.js --optimize

.PHONY: clean
clean:
	rm -rf ./elm-stuff elm.js

.PHONY: live
live:
	elm-live -h 0.0.0.0 src/Main.elm -- --output=elm.js --debug

.PHONY: serve
serve:
	make clean
	make elm.js
	python3 -m http.server

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: release
release:
	git checkout master
	git merge $(BRANCH)
	make clean
	make elm.js
	git commit -a -m "release"
	git push