UUID := latency@mboscovich.github.io
PREFIX := $(HOME)/.local/share/gnome-shell/extensions
INSTALL_DIR := $(PREFIX)/$(UUID)

.PHONY: all build check-deps install uninstall zip clean

all: build

build:
	glib-compile-schemas schemas

check-deps:
	@command -v glib-compile-schemas >/dev/null || { echo "Missing dependency: glib-compile-schemas"; exit 1; }
	@command -v ping >/dev/null || { echo "Missing dependency: ping"; exit 1; }
	@command -v host >/dev/null || { echo "Missing dependency: host"; exit 1; }
	@echo "All required dependencies are installed."

install: check-deps build
	mkdir -p "$(INSTALL_DIR)"
	cp extension.js metadata.json prefs.js show-ping-time.sh "$(INSTALL_DIR)/"
	cp -r schemas "$(INSTALL_DIR)/"
	chmod +x "$(INSTALL_DIR)/show-ping-time.sh"
	@echo "Installed to $(INSTALL_DIR)"

uninstall:
	rm -rf "$(INSTALL_DIR)"
	@echo "Removed $(INSTALL_DIR)"

zip: build
	rm -f "$(UUID).zip"
	zip -r "$(UUID).zip" extension.js metadata.json prefs.js show-ping-time.sh schemas

clean:
	rm -f "$(UUID).zip"
	rm -f schemas/gschemas.compiled
