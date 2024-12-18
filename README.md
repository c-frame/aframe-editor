# A-Frame editor

The [A-Frame editor](https://github.com/c-frame/aframe-editor) is based on the
[A-Frame inspector](https://github.com/aframevr/aframe-inspector) with additional features:

- Undo/redo feature for all the actions you do in the editor.
- Better copy a-scene HTML to clipboard with a dedicated button. This replaces
  the aframe-watcher button.

[See video](https://x.com/vincentfretin/status/1861726540196708776)

The latest A-Frame editor version works with [A-Frame master](https://github.com/aframevr/aframe/commits/master/) greater than Nov 25, 2024, soon to be aframe 1.7.0.
A-Frame 1.6.0 has known issues with the "copy a-scene HTML to clipboard" feature of the editor.

![aframe-editor](https://github.com/user-attachments/assets/e9970517-4864-4794-a5b4-323076d2fe07)

## How to use it?

Instead of using:

```html
<script src="https://aframe.io/releases/1.6.0/aframe.min.js"></script>
```

use an A-Frame master build like this one (Nov 25, 2024):

```html
<script src="https://cdn.jsdelivr.net/gh/aframevr/aframe@3c884fef5a7ceaf093dbe962e78b4bb7ff4a7afe/dist/aframe-master.min.js"></script>
```

To load the A-Frame editor instead of the A-Frame inspector, specify the url like this:

```html
<a-scene
  inspector="url: https://cdn.jsdelivr.net/gh/c-frame/aframe-editor@1.7.0/dist/aframe-editor.min.js">
```

> [!NOTE]
> If you want to test a build of the dev branch, replace the version by the commit hash of the build.
> The master branch is kept in sync with aframe-inspector, and merged into the dev branch
> if there is any fixes in the original inspector repository.

A-Frame inspector component comes with a **keyboard shortcut** to inject the editor. Just open
up your A-Frame scene where you customized the inspector url and press
**`<ctrl> + <alt> + i`** to inject the editor.

## Local Development

```bash
git clone git@github.com:c-frame/aframe-editor.git
cd aframe-editor
npm install
npm start
```

Then navigate to [http://localhost:3333/examples/](http://localhost:3333/examples/)

## Self-hosting the sample-assets directory

The textures modal is using https://aframe.io/sample-assets/dist/images.json
to get the available textures.
The GitHub repository for those assets is https://github.com/aframevr/sample-assets

If you want to self-host this directory, do the following:

```bash
cd examples
git clone git@github.com:aframevr/sample-assets.git
```

edit `index.html` and define before any script tag this global variable:

```html
<script>window.AFRAME_SAMPLE_ASSETS_ROOT = "./sample-assets/";</script>
```

## About the undo/redo feature

You have the undo and redo buttons in the top bar on the left.
The shortcuts are the following (also described in the help modal).

On macOS:

- cmd + z to undo an action
- cmd + shift + z to redo an action

on Windows and Ubuntu:

- ctrl + z to undo an action
- ctrl + shift + z to redo and action

## About the copy a-scene HTML to clipboard feature

![aframe-editor-copy-to-clipboard](https://github.com/user-attachments/assets/f4ee426b-7bf4-470d-b40e-991b6b586572)

Compared to the A-Frame inspector where you actually already have that feature by selecting a-scene and then "Copy entity HTML to clipboard", the A-Frame editor has additional changes:

- keep the original order of properties in components you defined yourself in the html file
- scene components: remove the injected components if the properties doesn't differ from the defaults
- light: don't remove the `type: directional` property even if it's the default
- geometry: don't remove the `primitive: box` property even if it's the default
- laser-controls: remove all injected components
- hand-controls: remove all injected components
- environment: remove children and fog component on a-scene
- blink-controls: remove created entities
- movement-controls: remove injected components

> [!WARNING]
> Please note that the feature can give wrong results for networked-aframe projects, so be sure to not blindly copy and paste the HTML code. Known issues are that you lose the inside of the template tags and you will have the instantiated networked entities instead of the original html code you had in your html page.
