gnome-magic-window
==================

Bind a key to a specific program in Gnome Shell:
* When the key is pressed and this program is in background, its window is
  brought up to front.
* When the key is pressed and this program is already in front, the last window
  if brought in front again.
* When the key is pressed and the program isn't launched yet, it is spawned.

It is comparable to *Guake* and *Compiz Put*, except that gnome-magic-window
works with Gnome Shell and the new Wayland display server. (It does not use
xdotool and wmctrl, that worked with X11 but not with Wayland.)

## Script usage

```sh
./gnome-magic-window Terminator terminator
                        /          \
            the name of the      the program to spawn
         window to look for      if window not found
```

```sh
./gnome-magic-window --list
[["[0x561dccbdc3e0 MetaWindowActor]","Gnome-shell"],
 ["[0x561dccbdc7c0 MetaWindowActor]","Nautilus"],
 ["[0x561dccbddf00 MetaWindowActor]","Chromium-browser"],
 ["[0x561dccbdd360 MetaWindowActor]","Chromium-browser"],
 ["[0x561dccbdcba0 MetaWindowActor]","Terminator"]]
```

## Quick install

The following commands assume that the trigger key is `F12` and the program to
bring to front is `Terminator`.
* Replace `F12` with `Pause`, `<Super>a` or whichever key you prefer.
* Replace `Terminator` by the program to be brought to front when the key is
  pressed (you can use `gnome-magic-window --list` to see all current window
  names).
* Replace `terminator` by the command to run if no window named `Terminator` is
  found.

### 1. Install the script

```sh
mkdir -p $HOME/bin
curl https://raw.githubusercontent.com/adrienverge/gnome-magic-window/master/gnome-magic-window >$HOME/bin/gnome-magic-window
chmod +x $HOME/bin/gnome-magic-window
```

### 2. Create the shortcut in Gnome Shell

You can do it using the menu in Settings > Keyboard > Shortcuts ([see
help](https://help.gnome.org/users/gnome-help/stable/keyboard-shortcuts-set.html)):
in this case set `My custom shortcut` as name,
`/home/<YOU>/bin/gnome-magic-window Terminator terminator` as command and `F12`
as shortcut.

Otherwise, you can directly create this shortcut using command line:

```sh
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/name "'My custom shortcut'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/binding "'F12'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/command "'$HOME/bin/gnome-magic-window Terminator terminator'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
```
