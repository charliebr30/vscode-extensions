[Japanese Readme](https://github.com/cssho/vscode-svgviewer/blob/master/README-ja.md)
# vscode-svgviewer
SVG Viewer for Visual Studio Code
[Visual Studio Marketplace](https://marketplace.visualstudio.com/items/cssho.vscode-svgviewer)

[![](http://vsmarketplacebadge.apphb.com/version/cssho.vscode-svgviewer.svg)](https://marketplace.visualstudio.com/items?itemName=cssho.vscode-svgviewer)
[![](http://vsmarketplacebadge.apphb.com/installs/cssho.vscode-svgviewer.svg)](https://marketplace.visualstudio.com/items?itemName=cssho.vscode-svgviewer)

## Usage 
0. Press Ctrl+P and type `ext install SVG Viewer` with a trailing space. 
0. Press Enter and restart VSCode.
0. Open a SVG File.
0. Choose process from `Command Palette` or `Shortcut`.

![palette](https://github.com/cssho/vscode-svgviewer/raw/master/img/palette.png)

### View SVG - `Ctrl(Cmd)+Shift+V O`
Display SVG on an Editor

### Export PNG - `Ctrl(Cmd)+Shift+V E`
Convert from SVG to PNG

### Export PNG with explicitly size - `Ctrl(Cmd)+Shift+V X`
Convert from SVG to PNG with explicitly size

### Copy data URI scheme - `Ctrl(Cmd)+Shift+V C`
Convert from SVG to data URI scheme and copy to the clipboard

![preview](https://github.com/cssho/vscode-svgviewer/raw/master/img/preview.png)

### Options
The following Visual Studio Code setting is available for the SVG Viewer.  This can be set in `User Settings` or `Workspace Settings`.

```javascript
{
    // Show Transparency Grid
	"svgviewer.transparencygrid": true
}
```