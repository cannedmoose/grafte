build/elm.js : src/Main.elm build/elm.js
	elm make src/Main.elm --output=build/elm.js --optimize

build : elm.js
	mkdir ./build
	cp ./static/* ./build/

.PHONY: clean
clean:
	rm -rf ./elm-stuff

.PHONY: live
live:
	elm-live -h 0.0.0.0 src/Main.elm -- --output=build/elm.js --debug

.PHONY: serve
serve:
	make clean
	build
	cd build
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

.PHONY: init
init:
	git init
	elm init
	mkdir build
	mkdir static
	touch static/index.html
	touch static/style.css
	git add .
	git commit -a -m "Initial commit"