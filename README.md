# Geodata
Interactive worldmap building block, live demo at https://www.nitoku.com/@nitoku.public/geodata

## About

This project is a fork of the awesome Travelscope project https://www.markuslerner.com/travelscope/ All credit should go to Markus Lerner, all bugs are mine. Changes has been made to the original codebase to enable third party users to configure the application.

You could find the original source here https://github.com/markuslerner

This project uses the following libraries/technologies:

* [bootstrap](http://getbootstrap.com/) Bootstrap 3: HTML, CSS, and JS framework
* [three.js](https://github.com/mrdoob/three.js) lightweight JavaScript 3D library using WebGL
* [d3](https://github.com/d3/d3) D3 (or D3.js) is a JavaScript library for visualizing data using web standards
* [d3-threeD](https://github.com/asutherland/d3-threeD) hooking d3.js up to three.js
* [tween.js](https://github.com/tweenjs/tween.js) Javascript tweening engine
* [Sass](http://sass-lang.com/) powerful CSS extension language
* [gulp](http://gulpjs.com/) as a task runner
* [browserify](http://browserify.org/) for bundling
* [watchify](https://github.com/substack/watchify) for watching browserify builds
* [Babel](http://babeljs.io) for ES6 and ES7 magic
* [ESLint](http://eslint.org) to maintain a consistent code style

### Install dependencies

```bash
$ npm install
```


### Install gulp globally

Only, if gulp isn't installed yet.

```bash
$ sudo npm install --global gulp-cli
```


## Running dev server

Files are compiled to `dev` folder, which is automatically created, if it doesn't exist.

```bash
$ gulp
```

Gulp will run a server on your local machine at port 3000. Whenever you change a source file it will re-compile client.js and reload your browser.


## Building production files

Files are compiled to `public` folder.

```bash
$ gulp build
```


## Application Structure


```
.
├── dev                            # Development folder created by gulp/browserify
├── public                         # Distribution folder
│   └── index.php                  # Production index.php file
└── src                            # Application source code
    ├── assets                     # Asset files
    │   ├── fonts                  # Font files
    │   └── img                    # Image files
    ├── client                     # Application JS folder
    │   ├── config.js              # Application settings file
    │   ├── jquery                 # jQuery plugins
    │   ├── jquery-ui              # jQuery UI
    │   ├── LogTerminal            # Window overlay log terminal
    │   ├── thirdparty             # Thirdparty JS files
    │   ├── three                  # Three.js extras
    │   ├── utils                  # Utility function
    │   └── worldmap               # Application core files
    │       ├── geometry.js        # Geometry functions
    │       ├── index.js           # Main application file
    │       ├── panel.js           # UI Panel for displaying content
    │       └── userinterface.js   # UI functions
    ├── client.js                  # Main JS file
    ├── index.html                 # Main HTML page container for app used for development
    └── scss                       # SCSS source files
```


