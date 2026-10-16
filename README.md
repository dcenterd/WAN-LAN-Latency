# Latency - GNOME Shell Extension

A GNOME Shell extension that displays Internet and intranet latency (ping) in the top panel. It also detects when the internet connection is lost or when there is a DNS problem.

## Features

- Real-time Internet and intranet latency display in the top panel
- Separate warning and critical thresholds for Internet and intranet latency
- Separate configurable colors for normal, warning, and critical states
- Configurable refresh interval from 1 to 3600 seconds
- Configurable panel position (left or right)
- Configurable `INTER:` and `INTRA:` section labels
- Automatic detection of connection loss
- DNS problem detection for the Internet check
- Quick access to preferences by clicking the indicator
- Customizable Internet IP, intranet IP, and DNS resolve domain

## Changes from the original source

This project is a customized fork of the original GNOME Shell `latency` extension. The main changes made in this version are:

- Added separate configuration for Internet and intranet targets instead of relying on a single fixed setup.
- Added support for custom Internet IP, intranet IP, and DNS resolve domain through the extension settings.
- Improved status handling to detect both "no internet connection" and "DNS problem" states.
- Added independent warning and critical thresholds for each network check.
- Added separate color config for normal, warning, and critical states for both Internet and intranet results.
- Added panel placement control so the indicator can be shown on the left or right side of the top bar.
- Added optional section labels (`INTER:` and `INTRA:`) to control the display format.
- Added a Preferences menu entry directly from the indicator.
- Updated the extension for newer GNOME Shell versions and modern extension APIs.

## GNOME Shell version support

| GNOME version | Supported |
|---|---|
| 45, 46, 47, 48, 49, 50 | Yes |

## Prerequisites

Before building and installing this extension, make sure you have the following installed:

- GNOME Shell 45 or later
- `glib-compile-schemas` (part of `glib2-devel` or `libglib2.0-dev`)
- `make`
- `ping`
- `host` (for DNS checking)

### Installing prerequisites

**Ubuntu/Debian:**
```bash
sudo apt install libglib2.0-dev make iputils-ping bind9-host
```

**Fedora/RHEL:**
```bash
sudo dnf install glib2-devel make iputils bind-utils
```

**Arch Linux:**
```bash
sudo pacman -S glib2 make iputils bind
```

## Building and installing

```bash
git clone https://github.com/zgasparian/latency-mboscovich.github.io.git
cd latency-mboscovich.github.io
make install
```

This copies the extension into `~/.local/share/gnome-shell/extensions/`.

To install without `make`, copy the project files to the GNOME extensions directory and compile the schema:

```bash
mkdir -p ~/.local/share/gnome-shell/extensions/latency@mboscovich.github.io
cp extension.js metadata.json prefs.js show-ping-time.sh ~/.local/share/gnome-shell/extensions/latency@mboscovich.github.io/
cp -r schemas ~/.local/share/gnome-shell/extensions/latency@mboscovich.github.io/
glib-compile-schemas ~/.local/share/gnome-shell/extensions/latency@mboscovich.github.io/schemas
chmod +x ~/.local/share/gnome-shell/extensions/latency@mboscovich.github.io/show-ping-time.sh
```

After installing:

1. **Restart GNOME Shell:**
   - X11: `Alt + F2` → type `r` → Enter
   - Wayland: log out and log back in

2. **Enable the extension:**
```bash
gnome-extensions enable latency@mboscovich.github.io
```

## Configuration

Click the indicator in the panel to open a menu, then select **Preferences**.

Alternatively:
- Open the GNOME Extensions app and click the settings icon for Latency
- Or run: `gnome-extensions prefs latency@mboscovich.github.io`

### Display

| Setting | Description |
|---|---|
| Show Section Labels | Toggle the `INTER:` and `INTRA:` prefixes before the ping values |
| Panel Position | Place the indicator on the **Left** or **Right** side of the panel |

### Connection

| Setting | Default | Description |
|---|---|---|
| Internet IP Address | `8.8.8.8` | IP used for the Internet ping check |
| Intranet IP Address | `192.168.1.1` | IP used for the intranet ping check |
| Resolve Domain | `google.com` | Domain used for the DNS check |
| Refresh Interval | `5` s | How often to run the ping check (1–3600 seconds) |

### Color thresholds

| Setting | Default | Description |
|---|---|---|
| Internet warning threshold | `100` ms | At or above this value the Internet result turns the warning color |
| Internet critical threshold | `300` ms | At or above this value the Internet result turns the critical color |
| Intranet warning threshold | `150` ms | At or above this value the intranet result turns the warning color |
| Intranet critical threshold | `400` ms | At or above this value the intranet result turns the critical color |

### Colors

| Setting | Default | Description |
|---|---|---|
| Normal, warning, critical colors | Configurable | Each result has its own color for each threshold state |

When the connection is lost or there is a DNS problem, the indicator reverts to the default panel text color.

## Usage

Once installed and enabled, the extension shows in the panel and updates at the configured interval (default 5 seconds):

The panel displays both results in this format: `INTER: result | INTRA: result`.

| Display | Meaning |
|---|---|
| `INTER: 29.4ms` | Current Internet latency, colored based on Internet thresholds |
| `INTRA: 4.2ms` | Current intranet latency, colored based on intranet thresholds |
| `[ No internet connection ]` | Ping failed |
| `[ DNS Problem ]` | Ping succeeded but DNS resolution failed |

## Makefile targets

| Target | Description |
|---|---|
| `make build` | Compile the GSettings schema |
| `make install` | Install the extension locally |
| `make uninstall` | Remove the extension |
| `make zip` | Build ZIP for extensions.gnome.org |
| `make clean` | Remove build artifacts and ZIPs |
| `make check-deps` | Verify all required tools are installed |

## Troubleshooting

**Schema error on startup:**
```bash
glib-compile-schemas schemas/
```

**Permission denied on ping script:**
```bash
chmod +x show-ping-time.sh
```

**Extension not appearing after install:**
1. Restart GNOME Shell (see above)
2. Check it is enabled: `gnome-extensions list --enabled`
3. Check for errors: `journalctl -f -o cat /usr/bin/gnome-shell`

## License

GNU General Public License v2.0 or later. See [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome. Please open an issue or pull request on GitHub.
