// Copyright (C) 2017-2021 Adrien Vergé
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

const SHORTCUT = 'F12';
const TITLE = 'Terminator';
const COMMAND = '/usr/bin/terminator';

const { Gio } = imports.gi;
const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Util = imports.misc.util;

class Extension {
  enable() {
    this._dbus = Gio.DBusExportedObject.wrapJSObject(`
      <node>
        <interface name="org.gnome.Shell.Extensions.GnomeMagicWindow">
          <method name="magic_key_pressed">
            <arg type="s" direction="in" name="title"/>
            <arg type="s" direction="in" name="command"/>
          </method>
        </interface>
      </node>`, this);
    this._dbus.export(Gio.DBus.session, '/org/gnome/Shell/Extensions/GnomeMagicWindow');

    global.display.connect(
      'accelerator-activated',
      (display, action, deviceId, timestamp) => {
        if (action === this._action) {
          return this.magic_key_pressed(TITLE, COMMAND);
        }
      }
    );
    this._action = global.display.grab_accelerator(SHORTCUT, 0);
    if (this._action !== Meta.KeyBindingAction.NONE) {
      const name = Meta.external_binding_name_for_action(this._action);
      Main.wm.allowKeybinding(name, Shell.ActionMode.ALL);
    }
  }

  disable() {
    this._dbus.flush();
    this._dbus.unexport();
    delete this._dbus;

    global.display.ungrab_accelerator(this._action);
    delete this._action;
  }

  debug() {
    return JSON.stringify({
      windows: this.get_windows(),
      active_window: this.get_active_window(),
    }, null, 2);
  }

  get_windows() {
    return global.get_window_actors()
           .map(w => ({id: w.toString(),
                       ref: w,
                       title: w.get_meta_window().get_wm_class()}))
           .filter(w => !w.title.includes('Gnome-shell'));
  }

  get_active_window() {
    return this.get_windows().slice(-1)[0];
  }

  find_magic_window(title) {
    return this.get_windows()
           .filter(w => w.title.toLowerCase().includes(title.toLowerCase()))[0];
  }

  magic_key_pressed(title, command) {
    // For debugging:
    // Util.spawn(['/bin/bash', '-c', `echo '${this.debug()}' > /tmp/test`]);
    // throw new Error(this.debug());
    // log(this.debug());

    const current = this.get_active_window();
    const magic = this.find_magic_window(title);

    if (!magic) {
      Util.spawnCommandLine(command);
      this._last_not_magic = current;

    } else if (current && current.id !== magic.id) {
      Main.activateWindow(magic.ref.get_meta_window());
      this._last_not_magic = current;

    } else if (this._last_not_magic) {
      Main.activateWindow(this._last_not_magic.ref.get_meta_window());
    }
  }
}

function init() {
  return new Extension();
}