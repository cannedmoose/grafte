.PHONY: build
build : 
	webpack

.PHONY: clean
clean:
	rm -rf ./build/*

.PHONY: live
live:
	webpack-dev-server --open --host ::

BRANCH := $(shell git rev-parse --abbrev-ref HEAD)

.PHONY: release
release:
	make build
	rm -rf docs
	mkdir docs
	cp build/* docs/
