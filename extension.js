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

const BINDINGS = [
  {
    shortcut: 'F12',
    title: 'Terminator',
    command: 'terminator'
  },
  // More bindings can be added, for example:
  // {
  //   shortcut: 'F11',
  //   title: 'Gworldclock',
  //   command: 'gworldclock'
  // },
];

import Gio from 'gi://Gio';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const Mainloop = imports.mainloop
import Meta from 'gi://Meta'; // const Meta = imports.gi.Meta; //TODO
import Shell from 'gi://Shell';
import * as Util from 'resource:///org/gnome/shell/misc/util.js';


export default class GnomeMagicWindowExtension extends Extension {

  _dbus = null;
  _actions = [];
  _launching = false;
  _last_not_magic = null;

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

    for (const binding of BINDINGS) {
      const thisAction = global.display.grab_accelerator(binding.shortcut, 0);
      if (thisAction !== Meta.KeyBindingAction.NONE) {
        global.display.connect(
          'accelerator-activated',
          (display, action) => {
            if (action === thisAction) {
              return this.magic_key_pressed(binding.title, binding.command);
            }
          }
        );

        const name = Meta.external_binding_name_for_action(thisAction);
        Main.wm.allowKeybinding(name, Shell.ActionMode.ALL);

        this._actions.push(thisAction);
      }
    }
  }

  disable() {
    for (const action of this._actions) {
      global.display.ungrab_accelerator(action);
    }
    this._actions = [];

    this._dbus.flush();
    this._dbus.unexport();
    this._dbus = null;
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
           .filter(w => w.title && !w.title.includes('Gnome-shell'));
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
    // log(this.debug());  // visible in journalctl -f

    const current = this.get_active_window();
    const next = this.find_magic_window(title);

    // In case no application window is found launch the application.
    if (!next) {
      if (!this._launching) {
        this._launching = true;
        Mainloop.timeout_add(1000, () => this._launching = false, 1000);
        Util.spawnCommandLine(command);
        this._last_not_magic = current;
      }
      return;
    }

    // Toggle though the windows of the application.
    if (current && current.id !== next.id) {
      Main.activateWindow(next.ref.get_meta_window());
      this._last_not_magic = current;
      return;
    }

    // Bring previous application back to front after toggling through all windows.
    if (this._last_not_magic) {
      Main.activateWindow(this._last_not_magic.ref.get_meta_window());
    }
  }
}
