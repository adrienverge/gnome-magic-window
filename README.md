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

## Demo

![pseudo-video demonstration](demo.gif)

## Quick install

The following commands assume that the trigger key is `F12` and the program to
bring to front is `Terminator`.
* Replace `F12` with `<Pause>`, `<Super>a` or whichever key you prefer.
* Replace `Terminator` by the program to be brought to front when the key is
  pressed.
* Replace `/usr/bin/terminator` by the command to run if no window named
  `Terminator` is found. Make sure you use a absolute path.

### 1. Install the extension

Since Gnome 41, gnome-magic-window is shipped as a Gnome extension. To install
this extension from the Git repository:

```shell
cd ~/.local/share/gnome-shell/extensions
git clone https://github.com/adrienverge/gnome-magic-window gnome-magic-window@adrienverge
```

### 2. Customize

Edit `extension.js` to set your favorite key, window name and command to run:

```javascript
const SHORTCUT = 'F12';
const TITLE = 'Terminator';
const COMMAND = '/usr/bin/terminator';
```

### 3. Enable the extension

After installing files and customizing, you probably need to close your session
and log in again in order for Gnome to the extension.

Either run:
```shell
gnome-extensions enable gnome-magic-window@adrienverge
```

Or open Gnome "Extensions" utility to enable the extension.

You're set! Try pressing your magic key.

### 9. Debug

In case it doesn't work, you may need to add your gnome version in
`metadata.json` and reload your session, or debug futher.

```shell
gdbus call --session --dest org.gnome.Shell --object-path /org/gnome/Shell/Extensions/GnomeMagicWindow --method org.gnome.Shell.Extensions.GnomeMagicWindow.magic_key_pressed Terminator terminator
```

## For Gnome versions < 41

Use this repo on commit 26230da or before, and read the README file from that
version.
