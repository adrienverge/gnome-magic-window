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
// Configuration options:
// After toggling through all application windows, minimize them.
const MINIMIZE_FINALLY = false;
// After toggling through all application windows, go back to the previous application.
const FOCUS_PREVIOUS_APPLICATION_FINALLY = true;

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
  _first_window = null;
  _previous_application = null;

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
      .map(w => w.get_meta_window())
      .map(w => ({
        ref: w,
        title: w.get_wm_class()
      }))
      .filter(w => w.title && !w.title.includes('Gnome-shell'));
  }

  get_active_window() {
    const current = global.display.focus_window;
    if (!current || !current.get_workspace().active) {
      return null;
    }
    return {
      ref: current,
      title: current.get_wm_class()
    };
  }

  find_magic_windows(title) {
    return this.get_windows()
      .filter(w => w.title.toLowerCase().includes(title.toLowerCase()));
  }

  focus_window(window) {
    if (window.minimized) {
      window.unminimize();
    }
    window.raise();
    Main.activateWindow(window);
    const workspace = window.get_workspace();
    if (!workspace.active) {
      workspace.activate(0);
    }
  }

  hide_window(window) {
    if (window.is_above()) {
      window.unmake_above();
    }
    if (window.can_minimize()) {
      window.minimize();
    }
  }

  magic_key_pressed(title, command) {
    // For debugging:
    // Util.spawn(['/bin/bash', '-c', `echo '${this.debug()}' > /tmp/test`]);
    // throw new Error(this.debug());
    // log(this.debug());  // visible in journalctl -f

    const current = this.get_active_window();
    const magic_windows = this.find_magic_windows(title)
      .sort((a, b) => a.ref.get_id() > b.ref.get_id()); // prevent flapping window order
    const nextIndex = (magic_windows.findIndex(w => current && w.ref === current.ref) + 1) % magic_windows.length;
    const next = magic_windows[nextIndex];

    // Launch application if no window of it found.
    if (!next) {
      if (!this._launching) {
        this._launching = true;
        Mainloop.timeout_add(1000, () => this._launching = false, 1000);
        this._previous_application = global.display.focus_window;
        Util.spawnCommandLine(command);
      }
      return;
    }

    // Focus "next" window, if other application is focused.
    if (!current || current.title !== next.title) {
      this._previous_application = global.display.focus_window;
      this._first_window = next.ref;
      this.focus_window(next.ref);
      return;
    }

    // If one window of the application is focused, switch to next or lower all if cycled through all.
    if (!this._first_window || !magic_windows.find(w => w.ref === this._first_window)) {
      this._first_window = next.ref;
    }
    if (next.ref === this._first_window && (MINIMIZE_FINALLY || FOCUS_PREVIOUS_APPLICATION_FINALLY)) {
      if (MINIMIZE_FINALLY) {
        magic_windows.forEach(w => this.hide_window(w.ref));
      }
      if (FOCUS_PREVIOUS_APPLICATION_FINALLY && this._previous_application) {
        this.focus_window(this._previous_application);
      }
      this._first_window = null;
      this._previous_application = null;
    } else {
      this.focus_window(next.ref);
    }
  }
}
