.PHONY: build
build : 
	tsc
	cp ./static/* ./build/

.PHONY: clean
clean:
	rm -rf ./build/*

.PHONY: live
live:
	make build
	tsc -w &
	cd build && python3 -m http.server

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: release
release:
	git checkout master
	git merge $(BRANCH)
	make clean
	make elm.js
	git commit -a -m "release"
	git push