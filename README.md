gnome-magic-window
==================

Bind a key to a specific program in Gnome Shell:
* When the key is pressed and this program is in background, its window is
  brought up to front.
* When the key is pressed and this program is already in front, the last window
  if brought in front again.

It is comparable to *Guake* and *Compiz Put*, except that gnome-magic-window
works with Gnome Shell and the new Wayland display server. (It does not use
xdotool and wmctrl, that worked with X11 but not with Wayland.)

## Quick install

The following commands assume that the trigger key is `F12` and the program to
bring to front is `terminator`.
* Replace `F12` with `Pause`, `<Super>a` or whichever key you prefer.
* Replace `terminator` by the program to be brought to front when the key is
  pressed (you can use `gnome-magic-window --list` to see all current window
  names).

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
`/home/<YOU>/bin/gnome-magic-window terminator` as command and `F12` as
shortcut.

Otherwise, you can directly create this shortcut using command line:

```sh
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/name "'My custom shortcut'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/binding "'F12'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/command "'$HOME/bin/gnome-magic-window terminator'"
dconf write /org/gnome/settings-daemon/plugins/media-keys/custom-keybindings "['/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/custom0/']"
```
