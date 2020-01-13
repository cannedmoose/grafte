.PHONY: build
build : 
	webpack

.PHONY: clean
clean:
	rm -rf ./build/*

.PHONY: live
live:
	webpack-dev-server --open

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: release
release:
	git checkout master
	git merge $(BRANCH)
	make clean
	make build
	git commit -a -m "release"
	git push