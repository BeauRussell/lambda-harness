.PHONY: analyzer test dev

# Build the TypeScript analyzer
analyzer:
	cd analyzer && bun run build

# Run Go tests (depends on analyzer build)
test: analyzer
	go test ./...

# Development mode: build and test
dev: test

# Clean build artifacts
clean:
	rm -rf internal/embedded/analyzer
	rm -f cmd/lth/analyzer.log
	go clean -testcache
