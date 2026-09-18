/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

import GObject from "gi://GObject";
import GLib from "gi://GLib";
import Gio from "gi://Gio";
import Clutter from "gi://Clutter";
import St from "gi://St";

import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import {Extension} from "resource:///org/gnome/shell/extensions/extension.js";

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(openPrefsCallback) {
            // `menuAlignment`, `nameText`, `dontCreateMenu`.
            super._init(0.0, 'Latency', false);

            this._box = new St.BoxLayout();
            this.add_child(this._box);

            this._internetLabel = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
            });
            this._separator = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
                text: ' | ',
            });
            this._intranetLabel = new St.Label({
                y_align: Clutter.ActorAlign.CENTER,
            });
            this._box.add_child(this._internetLabel);
            this._box.add_child(this._separator);
            this._box.add_child(this._intranetLabel);

            const prefsItem = new PopupMenu.PopupMenuItem('Preferences');
            prefsItem.connect('activate', openPrefsCallback);
            this.menu.addMenuItem(prefsItem);
        }

        setResults(internet, intranet, internetColor, intranetColor) {
            this._internetLabel.set_text(internet || '...');
            this._intranetLabel.set_text(intranet || '...');
            this._internetLabel.style = internetColor ? `color: ${internetColor};` : '';
            this._intranetLabel.style = intranetColor ? `color: ${intranetColor};` : '';
        }
    }
);

export default class Latency extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
        this._timeout = null;
        this._settings = null;
        this._positionChangedId = null;
        this._intervalChangedId = null;
        this._colorSettingChangedIds = [];
        this._results = ['', ''];
    }

    enable() {
        this._settings = this.getSettings();

        this._positionChangedId = this._settings.connect(
            'changed::latency-position', () => this._createIndicator()
        );
        this._intervalChangedId = this._settings.connect(
            'changed::latency-refresh-interval', () => this._restartTimer()
        );
        for (const key of [
            'latency-internet-threshold-warning',
            'latency-internet-threshold-critical',
            'latency-internet-color-ok',
            'latency-internet-color-warning',
            'latency-internet-color-critical',
            'latency-intranet-threshold-warning',
            'latency-intranet-threshold-critical',
            'latency-intranet-color-ok',
            'latency-intranet-color-warning',
            'latency-intranet-color-critical',
        ]) {
            this._colorSettingChangedIds.push(this._settings.connect(
                `changed::${key}`, () => this._updateDisplay()
            ));
        }

        this._createIndicator();
        this._restartTimer();
    }

    disable() {
        if (this._positionChangedId) {
            this._settings.disconnect(this._positionChangedId);
            this._positionChangedId = null;
        }
        if (this._intervalChangedId) {
            this._settings.disconnect(this._intervalChangedId);
            this._intervalChangedId = null;
        }
        for (const id of this._colorSettingChangedIds)
            this._settings.disconnect(id);
        this._colorSettingChangedIds = [];
        if (this._timeout != null) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        if (this._indicator != null) {
            this._indicator.destroy();
            this._indicator = null;
        }
        this._settings = null;
    }

    _restartTimer() {
        if (this._timeout != null) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        const interval = this._settings.get_int('latency-refresh-interval');
        this.getCurrentLatency();
        this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT, interval, () => {
                this.getCurrentLatency();
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _createIndicator() {
        if (this._indicator != null) {
            this._indicator.destroy();
        }

        const position = this._settings.get_string('latency-position');
        const box = position === 'right' ? 'right' : 'left';
        const pos = position === 'right' ? 0 : 1;

        this._indicator = new Indicator(() => this.openPreferences());
        Main.panel.addToStatusArea(this.uuid, this._indicator, pos, box);
    }

    getCurrentLatency() {
        this._results = ['', ''];
        const addresses = [
            this._settings.get_string('latency-ip-wan').trim(),
            this._settings.get_string('latency-ip-intranet').trim(),
        ];

        addresses.forEach((address, index) => this._getLatency(address, index));
    }

    _getLatency(address, index) {
        const scriptArgs = [`${this.path}/show-ping-time.sh`];
        if (address.length > 0)
            scriptArgs.push('--ip', address);
        if (index === 1)
            scriptArgs.push('--skip-dns');

        const resolveDomain = this._settings.get_string('latency-resolve-domain').trim();
        if (resolveDomain.length > 0)
            scriptArgs.push('--domain', resolveDomain);

        try {
            const proc = Gio.Subprocess.new(
                scriptArgs,
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );

            proc.communicate_utf8_async(null, null, (proc, result) => {
                try {
                    const [ok, stdout, stderr] = proc.communicate_utf8_finish(result);
                    if (ok) {
                        this._results[index] = String(stdout).trim() || 'Error';
                    } else {
                        log(`Error running script: ${String(stderr).trim()}`);
                        this._results[index] = 'Error';
                    }
                } catch (e) {
                    logError(e);
                    this._results[index] = 'Error';
                }

                this._updateDisplay();
            });
        } catch (e) {
            logError(e);
            this._results[index] = 'Error';
            this._updateDisplay();
        }
    }

    _parseLatency(result) {
        const match = /^([0-9]+(?:\.[0-9]+)?)\s*ms$/i.exec(result?.trim() ?? '');
        if (match === null)
            return null;

        const value = Number.parseFloat(match[1]);
        return Number.isFinite(value) ? value : null;
    }

    _getColorForSection(section, result) {
        const latencyMs = this._parseLatency(result);
        const warnKey = section === 'internet'
            ? 'latency-internet-threshold-warning'
            : 'latency-intranet-threshold-warning';
        const critKey = section === 'internet'
            ? 'latency-internet-threshold-critical'
            : 'latency-intranet-threshold-critical';
        const okKey = section === 'internet'
            ? 'latency-internet-color-ok'
            : 'latency-intranet-color-ok';
        const warnColorKey = section === 'internet'
            ? 'latency-internet-color-warning'
            : 'latency-intranet-color-warning';
        const critColorKey = section === 'internet'
            ? 'latency-internet-color-critical'
            : 'latency-intranet-color-critical';

        if (latencyMs === null)
            return '';

        const warnThreshold = this._settings.get_int(warnKey);
        const critThreshold = this._settings.get_int(critKey);

        if (latencyMs >= critThreshold)
            return this._settings.get_string(critColorKey);
        if (latencyMs >= warnThreshold)
            return this._settings.get_string(warnColorKey);
        return this._settings.get_string(okKey);
    }

    _updateDisplay() {
        if (this._indicator == null)
            return;

        const [internet, intranet] = this._results;
        const internetColor = this._getColorForSection('internet', internet);
        const intranetColor = this._getColorForSection('intranet', intranet);
        const showLabels = this._settings.get_boolean('show-latency-label');

        this._indicator.setResults(
            showLabels ? `INTER: ${internet || '...'}` : (internet || '...'),
            showLabels ? `INTRA: ${intranet || '...'}` : (intranet || '...'),
            internetColor,
            intranetColor
        );
    }
}
