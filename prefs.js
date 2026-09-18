import Gio from 'gi://Gio';
import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js'

const DEFAULT_WAN_IP         = '8.8.8.8';
const DEFAULT_RESOLVE_DOMAIN = 'google.com';
const POSITION_VALUES        = ['left', 'right'];

// Convert Gdk.RGBA to hex string (#rrggbb)
function _rgbaToHex(rgba) {
    const r = Math.round(rgba.red   * 255).toString(16).padStart(2, '0');
    const g = Math.round(rgba.green * 255).toString(16).padStart(2, '0');
    const b = Math.round(rgba.blue  * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
}

// Build an ActionRow with a ColorButton suffix bound to a GSettings string key
function _makeColorRow(title, subtitle, settingKey, settings) {
    const row = new Adw.ActionRow({title, subtitle});

    const button = new Gtk.ColorButton({
        valign: Gtk.Align.CENTER,
        use_alpha: false,
    });

    const rgba = new Gdk.RGBA();
    rgba.parse(settings.get_string(settingKey));
    button.set_rgba(rgba);

    button.connect('color-set', () => {
        settings.set_string(settingKey, _rgbaToHex(button.get_rgba()));
    });
    settings.connect(`changed::${settingKey}`, () => {
        const updated = new Gdk.RGBA();
        updated.parse(settings.get_string(settingKey));
        button.set_rgba(updated);
    });

    row.add_suffix(button);
    return row;
}

export default class LatencyPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'dialog-information-symbolic',
        });
        window.add(page);

        // ── Display group ───────────────────────────────────────────────────
        const displayGroup = new Adw.PreferencesGroup({title: _('Display')});
        page.add(displayGroup);

        const latencyLabel = new Adw.SwitchRow({
            title: _('Show Section Labels'),
            subtitle: _('Display "INTER:" and "INTRA:" before the ping values'),
        });
        displayGroup.add(latencyLabel);
        settings.bind('show-latency-label', latencyLabel, 'active', Gio.SettingsBindFlags.DEFAULT);

        const positionRow = new Adw.ComboRow({
            title: _('Panel Position'),
            subtitle: _('Where to show the indicator in the panel'),
            model: new Gtk.StringList({strings: [_('Left'), _('Right')]}),
        });
        positionRow.selected = Math.max(0, POSITION_VALUES.indexOf(
            settings.get_string('latency-position')
        ));
        positionRow.connect('notify::selected', () => {
            settings.set_string('latency-position', POSITION_VALUES[positionRow.selected]);
        });
        settings.connect('changed::latency-position', () => {
            positionRow.selected = Math.max(0, POSITION_VALUES.indexOf(
                settings.get_string('latency-position')
            ));
        });
        displayGroup.add(positionRow);

        const ipWan = new Adw.EntryRow({
            title: _('Internet IP Address'),
            text: settings.get_string('latency-ip-wan') || DEFAULT_WAN_IP,
        });
        const internetGroup = new Adw.PreferencesGroup({title: _('Internet Connection')});
        page.add(internetGroup);
        internetGroup.add(ipWan);
        settings.bind('latency-ip-wan', ipWan, 'text', Gio.SettingsBindFlags.DEFAULT);

        const ipIntranet = new Adw.EntryRow({
            title: _('Intranet IP Address'),
            text: settings.get_string('latency-ip-intranet'),
        });
        const intranetGroup = new Adw.PreferencesGroup({title: _('Intranet Connection')});
        page.add(intranetGroup);
        intranetGroup.add(ipIntranet);
        settings.bind('latency-ip-intranet', ipIntranet, 'text', Gio.SettingsBindFlags.DEFAULT);

        const resolveDomain = new Adw.EntryRow({
            title: _('Resolve Domain'),
            text: settings.get_string('latency-resolve-domain') || DEFAULT_RESOLVE_DOMAIN,
        });
        internetGroup.add(resolveDomain);
        settings.bind('latency-resolve-domain', resolveDomain, 'text', Gio.SettingsBindFlags.DEFAULT);

        const refreshIntervalRow = new Adw.SpinRow({
            title: _('Refresh Interval (s)'),
            subtitle: _('How often to run the ping check'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 3600, step_increment: 1, page_increment: 5,
            }),
        });
        refreshIntervalRow.value = settings.get_int('latency-refresh-interval');
        refreshIntervalRow.connect('notify::value', () => {
            settings.set_int('latency-refresh-interval', refreshIntervalRow.value);
        });
        settings.connect('changed::latency-refresh-interval', () => {
            refreshIntervalRow.value = settings.get_int('latency-refresh-interval');
        });
        internetGroup.add(refreshIntervalRow);

        // ── Internet thresholds ─────────────────────────────────────────────
        const internetThresholdGroup = new Adw.PreferencesGroup({
            title: _('Internet thresholds'),
            description: _('Internet latency is colored independently from the intranet latency.'),
        });
        page.add(internetThresholdGroup);

        const internetWarningRow = new Adw.SpinRow({
            title: _('Internet warning threshold (ms)'),
            subtitle: _('Above this value the Internet label turns the warning color'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 10000, step_increment: 10, page_increment: 50,
            }),
        });
        internetWarningRow.value = settings.get_int('latency-internet-threshold-warning');
        internetWarningRow.connect('notify::value', () => {
            settings.set_int('latency-internet-threshold-warning', internetWarningRow.value);
        });
        settings.connect('changed::latency-internet-threshold-warning', () => {
            internetWarningRow.value = settings.get_int('latency-internet-threshold-warning');
        });
        internetThresholdGroup.add(internetWarningRow);

        const internetCriticalRow = new Adw.SpinRow({
            title: _('Internet critical threshold (ms)'),
            subtitle: _('Above this value the Internet label turns the critical color'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 10000, step_increment: 10, page_increment: 50,
            }),
        });
        internetCriticalRow.value = settings.get_int('latency-internet-threshold-critical');
        internetCriticalRow.connect('notify::value', () => {
            settings.set_int('latency-internet-threshold-critical', internetCriticalRow.value);
        });
        settings.connect('changed::latency-internet-threshold-critical', () => {
            internetCriticalRow.value = settings.get_int('latency-internet-threshold-critical');
        });
        internetThresholdGroup.add(internetCriticalRow);

        // ── Internet colors ─────────────────────────────────────────────────
        const internetColorGroup = new Adw.PreferencesGroup({title: _('Internet colors')});
        page.add(internetColorGroup);

        internetColorGroup.add(_makeColorRow(
            _('Internet normal color'), _('Shown when the Internet latency is below its warning threshold'),
            'latency-internet-color-ok', settings
        ));
        internetColorGroup.add(_makeColorRow(
            _('Internet warning color'), _('Shown when the Internet latency is between warning and critical thresholds'),
            'latency-internet-color-warning', settings
        ));
        internetColorGroup.add(_makeColorRow(
            _('Internet critical color'), _('Shown when the Internet latency is above the critical threshold'),
            'latency-internet-color-critical', settings
        ));

        // ── Intranet thresholds ─────────────────────────────────────────────
        const intranetThresholdGroup = new Adw.PreferencesGroup({
            title: _('Intranet thresholds'),
            description: _('Intranet latency uses a completely separate state machine and color scheme.'),
        });
        page.add(intranetThresholdGroup);

        const intranetWarningRow = new Adw.SpinRow({
            title: _('Intranet warning threshold (ms)'),
            subtitle: _('Above this value the Intranet label turns the warning color'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 10000, step_increment: 10, page_increment: 50,
            }),
        });
        intranetWarningRow.value = settings.get_int('latency-intranet-threshold-warning');
        intranetWarningRow.connect('notify::value', () => {
            settings.set_int('latency-intranet-threshold-warning', intranetWarningRow.value);
        });
        settings.connect('changed::latency-intranet-threshold-warning', () => {
            intranetWarningRow.value = settings.get_int('latency-intranet-threshold-warning');
        });
        intranetThresholdGroup.add(intranetWarningRow);

        const intranetCriticalRow = new Adw.SpinRow({
            title: _('Intranet critical threshold (ms)'),
            subtitle: _('Above this value the Intranet label turns the critical color'),
            adjustment: new Gtk.Adjustment({
                lower: 1, upper: 10000, step_increment: 10, page_increment: 50,
            }),
        });
        intranetCriticalRow.value = settings.get_int('latency-intranet-threshold-critical');
        intranetCriticalRow.connect('notify::value', () => {
            settings.set_int('latency-intranet-threshold-critical', intranetCriticalRow.value);
        });
        settings.connect('changed::latency-intranet-threshold-critical', () => {
            intranetCriticalRow.value = settings.get_int('latency-intranet-threshold-critical');
        });
        intranetThresholdGroup.add(intranetCriticalRow);

        // ── Intranet colors ─────────────────────────────────────────────────
        const intranetColorGroup = new Adw.PreferencesGroup({title: _('Intranet colors')});
        page.add(intranetColorGroup);

        intranetColorGroup.add(_makeColorRow(
            _('Intranet normal color'), _('Shown when the Intranet latency is below its warning threshold'),
            'latency-intranet-color-ok', settings
        ));
        intranetColorGroup.add(_makeColorRow(
            _('Intranet warning color'), _('Shown when the Intranet latency is between warning and critical thresholds'),
            'latency-intranet-color-warning', settings
        ));
        intranetColorGroup.add(_makeColorRow(
            _('Intranet critical color'), _('Shown when the Intranet latency is above the critical threshold'),
            'latency-intranet-color-critical', settings
        ));
    }
}
