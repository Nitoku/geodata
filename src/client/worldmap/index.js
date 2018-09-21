import $ from 'jquery';
import 'jquery-mousewheel';
import * as THREE from 'three';
import * as TWEEN from 'tween.js';
import * as d3 from 'd3';

import '../thirdparty/RequestAnimationFrame';
import Stats from '../thirdparty/Stats';
import LogTerminal, { log } from '../LogTerminal';

import '../thirdparty/d3.geo.robinson';

import '../three/CanvasRenderer';
import '../three/PinchZoomControls';
import '../three/Projector';
import '../three/TessellateModifier';
import '../three/TrackballControls';

import '../jquery/jquery.doubleclick';
import '../jquery/jquery.easing.min';
import '../jquery/jquery.immybox';
import '../jquery/jquery.tipsy';

import '../jquery-ui/jquery-ui-1.12.0.custom/jquery-ui';
import '../jquery-ui/jquery-ui.custom.combobox';

import Config from '../config';
import { formatNumber, toSentenceStart, cleanURLString } from '../utils';
import * as CountryDataHelpers from '../utils/countryDataHelpers';
import * as Geometry from './geometry';
import * as Panels from './panel';
import * as UI from './userinterface';

THREE.Vector3.prototype.mix = function(v2, factor) {
  this.x = this.x + (v2.x - this.x) * factor;
  this.y = this.y + (v2.y - this.y) * factor;
  this.z = this.z + (v2.z - this.z) * factor;
};

if(!Date.now) Date.now = function() { return new Date().getTime(); };

export var worldMap;

var stats;


function WorldMap() {

  //emilio
  //make worldMap accessible from other scripts	
  window.worldMap = this;
  window.worldMapUI = UI;
   
  this.connectionLabel = 'connections'; 	  
  this.geo;
  this.scene = {};
  this.renderer = {};
  this.camera = {};
  this.pointLight;
  this.stage = {};
  this.controls;
  this.projector;
  this.raycaster;
  this.clock;

  this.countries;
  this.visaRequirements;

  this.selectedCountry = null;
  this.selectedDestinationCountry = null;
  this.visaInformationFound = false;

  this.sphere;
  this.countriesObject3D;

  this.intersectedObject = null;

  this.introRunning = true;

  this.inited = false;

  this.mode = 'destinations';
  this.viewMode = '2d';

  this.maxNumDestinationsFreeOrOnArrival = 0;
  this.maxNumSourcesFreeOrOnArrival = 0;
  this.maxGDP = 0;
  this.maxGDPPerCapita = 0;
  this.maxPopulation = 0;

  this.totalPopulation = 0;
  this.animationProps = {
    interpolatePos: 0.0,
    lineAnimatePos: 0.0,
    lineAnimateOffset: 0.0,
    colorChangeID: 0
  };

}

WorldMap.prototype = {

  initD3: function() {

    const GeoConfig = function() {

      this.projection = d3.geo.robinson();

      // this.projection = d3.geo.mercator(); // default, works
      // this.projection = d3.geo.equirectangular(); // works, needs scale = 0.2
      // this.projection = d3.geo.albers(); // works, needs scale = 0.2
      // recommended for choropleths as it preserves the relative areas of geographic features.
      // this.projection = d3.geo.conicEqualArea(); 
      // this.projection = d3.geo.azimuthalEqualArea(); // also suitable for choropleths

      // var translate = this.projection.translate();
      // translate[0] = 0;
      // translate[1] = 80;

      // this.projection.translate(translate);

      // var rotate = [0, 0, 90];
      // this.projection.rotate(rotate);

      this.projection = this.projection.scale(Config.geoScale);

      this.path = d3.geo.path().projection(this.projection);

    };

    this.geo = new GeoConfig();
  },


  initThree: function() {

    if(Config.usesWebGL) {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        clearAlpha: 0,
        clearColor: 0x000000,
        sortObjects: false
      });
      this.renderer.autoClear = false;
      // this.renderer.setClearColor( 0xBBBBBB, 1 );
      log('WebGLRenderer, pixel ratio used: ' + this.renderer.getPixelRatio());
      this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    } else {
      this.renderer = new THREE.CanvasRenderer({
        antialias: true,
        alpha: true,
        clearAlpha: 0,
        clearColor: 0x000000,
        sortObjects: false
      });
      log('CanvasRenderer');
    }

    this.clock = new THREE.Clock();

    this.projector = new THREE.Projector();
    this.raycaster = new THREE.Raycaster();

    this.renderer.setSize( $(window).width(), $(window).height() );

    // append renderer to dom element
    $(Config.rendererContainer).append(this.renderer.domElement);

    // create a scene
    this.scene = new THREE.Scene();

    this.scene.add( new THREE.AmbientLight( 0xffffff ) );

    this.pointLight = new THREE.PointLight(0x000000);
    this.pointLight.position.x = 0.0;
    this.pointLight.position.y = 500.0;
    this.pointLight.position.z = 1000.0;
    this.pointLight.intensity = 1.0;
    this.scene.add(this.pointLight);

    // var light1 = new THREE.DirectionalLight( 0xffffff, 0.5 );
    // light1.position.set( 1, 1, 1 );
    // this.scene.add( light1 );

    // var light2 = new THREE.DirectionalLight( 0xffffff, 1.5 );
    // light2.position.set( 0, -1, 0 );
    // this.scene.add( light2 );

    // put a camera in the scene
    this.camera = new THREE.PerspectiveCamera(Config.cameraFOV, $(window).width() / $(window).height(), 0.1, 20000);
    this.camera.position.x = 0.0;
    this.camera.position.y = 0.0;
    this.camera.position.z = Config.cameraDistance;
    // this.camera.lookAt( { x: this.CAMERA_LX, y: 0, z: this.CAMERA_LZ} );
    this.scene.add(this.camera);

  },


  initControls: function() {
    // log('initControls()');

    this.controlsTrackball = new THREE.TrackballControls( this.camera, this.renderer.domElement );
    this.controlsTrackball.rotateSpeed = 0.5; // 1.0
    this.controlsTrackball.zoomSpeed = 1.0;
    this.controlsTrackball.panSpeed = 0.25;

    this.controlsTrackball.noRotate = false;
    this.controlsTrackball.noZoom = false;
    this.controlsTrackball.noPan = true;

    this.controlsTrackball.staticMoving = false;
    this.controlsTrackball.dynamicDampingFactor = 0.2;

    this.controlsTrackball.minDistance = Config.cameraDistanceMin;
    this.controlsTrackball.maxDistance = Config.cameraDistanceMax;

    this.controlsTrackball.keys = []; // [ 65 // A, 83 // S, 68 // D ]; // [ rotateKey, zoomKey, panKey ]
    this.controlsTrackball.enabled = false;

    // this.controlsTrackball.clearStateOnMouseUp = false;
    // this.controlsTrackball.setState(2);

    this.controlsPinchZoom = new THREE.PinchZoomControls( this.camera, this.renderer.domElement );
    this.controlsPinchZoom.staticMoving = true;
    this.controlsPinchZoom.minDistance = Config.cameraDistanceMin2D;
    this.controlsPinchZoom.maxDistance = Config.cameraDistanceMax;
    this.controlsPinchZoom.enabled = false;

    this.controls = this.controlsPinchZoom;

  },


  //emilio
  //can we use this method to update the map?
  //problem: 
  //  - the list has been already created
  //         - need to redo the list 
  setMode: function(mode) {
	  
    this.mode = mode;
    
    //this update the small legend that we have on the botton left
    UI.updateLegend(this);
    
    //clear selected
    worldMap.clearBothSelectedCountries();
    
    //update colors
    worldMap.updateCountryColorsOneByOne();
    
    UI.updateModeStatement(worldMap);

  },


  createCountries: function() {
	  
    log('createCountries()');
    UI.updateLoadingInfo('Creating map ...');

    //emilio
    //this method will create the countries and will push then into 
    //worldMap.countries.push(country);
    Geometry.createCountriesGeometry(this);

    Geometry.updateCountriesGeometry(this, true);

    worldMap.updateAllCountryColors();
 
    worldMap.animationProps.interpolatePos = 1.0;

    if(Config.usesWebGL) {
      Geometry.createCountriesBufferGeometry(this);
      Geometry.updateCountriesBufferGeometry(this);
    }


    window.setTimeout(function() {

      var scaleFinal = 1.0; // has to be one for the picking to work properly in combination with buffer geometry
      worldMap.tweenScale = new TWEEN.Tween(worldMap.countriesObject3D.scale)
        .to({x: scaleFinal, y: scaleFinal, z: scaleFinal}, Config.introRotateDuration) // 3500
        .delay(0)
        .onStart(function() {
          worldMap.animationProps.interpolatePos = 1.0;
        })
        .onUpdate(function() {
          worldMap.geometryNeedsUpdate = true;
        })
        .onComplete(function() {
          // worldMap.controls.enabled = true;
        })
        .easing(TWEEN.Easing.Quadratic.Out)
        // .easing(TWEEN.Easing.Cubic.Out)
        .start();

      worldMap.tweenWarp = new TWEEN.Tween(worldMap.animationProps)
        .to({interpolatePos: 0.0}, Config.introWarpDuration)
        .delay(0)
        .easing(TWEEN.Easing.Exponential.InOut)
        .onUpdate(function() {
          worldMap.geometryNeedsUpdate = true;
        })
        .onComplete(function() {
          UI.initSourceCountryDropDown(worldMap);
          UI.initDestinationCountryDropDown(worldMap);
          UI.showCountryList(worldMap);
          UI.updateModeStatement(worldMap);
          UI.completeInit();

          worldMap.geometryNeedsUpdate = true;
          worldMap.introRunning = false;
          worldMap.controls.enabled = true;
          worldMap.showDisputedAreasBorders();
          worldMap.setParamsFromSearch();

        });

      window.setTimeout(function() {
        worldMap.tweenWarp.start();
      }, Config.introWarpDelay);

      worldMap.tweenRotation = new TWEEN.Tween(worldMap.countriesObject3D.rotation)
        .to({ y: 0.0 }, Config.introRotateDuration) // 3500
        .delay(0)
        .easing(TWEEN.Easing.Quintic.Out)
        .onUpdate(function() {
          worldMap.geometryNeedsUpdate = true;
        })
        // .easing(TWEEN.Easing.Quintic.Out)
        // TWEEN.Easing.Exponential would cause the map to plop in the end, probably due to a rounding error
        .start();

    }, 100);


  },

  updateCountryColorsOneByOne: function() {
    // log('updateCountryColorsOneByOne()');

    if(this.selectedCountry) {
      this.selectedCountry.color.set(Config.colorCountrySelected);
      this.selectedCountry.colorLast.set(this.selectedCountry.color);
    }

    this.animationProps.colorChangeID = 0;
    new TWEEN.Tween({})
      .to({ x: 0 }, Config.updateColorsDuration)
      .onUpdate(function(time) {
        var idLast = worldMap.animationProps.colorChangeID;
        worldMap.animationProps.colorChangeID = parseInt(time * worldMap.countries.length);

        worldMap.updateCountryColors(idLast, worldMap.animationProps.colorChangeID);

        if(Config.usesWebGL) {
          Geometry.updateCountriesBufferGeometryColors(worldMap);
        }
      })
      .start();

  },

  updateAllCountryColors: function(pos) {
    this.updateCountryColors(0, this.countries.length, pos);
  },

  updateCountryColors: function(start, end, pos) {
    // log('updateCountryColors()');

    // for(var i = 0 ; i < this.countries.length; i++) {
    var c = new THREE.Color();

    for(var i = start; i < end; i++) {
      var country = this.countries[i];

      if(this.mode === 'destinations') {

        if(this.selectedCountry && this.selectedDestinationCountry) {

          if( country === this.selectedDestinationCountry ) {
            if(this.visaInformationFound) {
              c.set( CountryDataHelpers.getCountryColorByVisaStatus(country) );

            } else {
              c.set(Config.colorCountryDefault);
            }

          } else if( country === this.selectedCountry ) {
            c.set(Config.colorCountrySelected);

          } else {
            c.set(Config.colorCountryDefault);
          }

        } else if(this.selectedCountry && !this.selectedDestinationCountry) {

          if( country === this.selectedCountry ) {
            c.set(Config.colorCountrySelected);

          } else {
            if(this.visaInformationFound) {
              c.set( CountryDataHelpers.getCountryColorByVisaStatus(country) );

            } else {
              c.set(Config.colorCountryDefault);
            }

          }

        } else if(!this.selectedCountry && this.selectedDestinationCountry) {

          // like nothing selected:
          if(country.destinations.length > 0) {
            c.set(country.colorByFreeDestinations);
          } else {
            c.set(Config.colorVisaDataNotAvailable);
          }

        } else {

          // nothing selected:
          if(country.destinations.length > 0) {
            c.set(country.colorByFreeDestinations);
          } else {
            c.set(Config.colorVisaDataNotAvailable);
          }

        }

        if( country === this.selectedCountry ) {
          c.set(Config.colorCountrySelected);
        }

      } else if(this.mode === 'sources') {

        if(this.selectedCountry && this.selectedDestinationCountry) {

          if( country === this.selectedDestinationCountry ) {
            if(this.visaInformationFound) {
              c.set( CountryDataHelpers.getCountryColorByVisaStatus(country) );

            } else {
              c.set(Config.colorCountryDefault);
            }

          } else if( country === this.selectedCountry ) {
            c.set(Config.colorCountrySelected);

          } else {
            c.set(Config.colorCountryDefault);
          }

        } else if(this.selectedCountry && !this.selectedDestinationCountry) {

          // like nothing selected:
          if(country.disputed) {
            c.set(Config.colorVisaDataNotAvailable);
          } else {
            c.set(country.colorByFreeSources);
          }

        } else if(!this.selectedCountry && this.selectedDestinationCountry) {

          if( country === this.selectedDestinationCountry ) {
            c.set(Config.colorCountrySelected);

          } else {
            if(this.visaInformationFound) {
              c.set( CountryDataHelpers.getCountryColorByVisaStatus(country) );

            } else {
              c.set(Config.colorCountryDefault);
            }

          }

        } else {

          // nothing selected:
          if(country.disputed) {
            c.set(Config.colorVisaDataNotAvailable);
          } else {
            c.set(country.colorByFreeSources);
          }

        }

      } else if(this.mode === 'gdp') {
        if( country === this.selectedCountry ) {
          c.set(Config.colorCountrySelected);
        } else if(country.gdp > 100) {
          c.set(country.colorByGDP);
        } else {
          c.set(Config.colorVisaDataNotAvailable);
        }

      }

      if(pos < 1) {
        country.color.set(country.colorLast);
        country.color.lerp(c, pos);
      } else {
        country.color.set(c);
        country.colorLast.set(c);
      }

      if(country.listItem) country.listItem.find('.box').css('background-color', '#' + country.color.getHexString());

      if( !Config.usesWebGL ) {
        country.mesh.material.color = country.color;
      }

    }
  },

  showDisputedAreasBorders: function() {
    for(var i = 0; i < this.countries.length; i++) {
      var country = this.countries[i];
      if(country.disputed) {
        if(this.viewMode === '2d') {
          this.scene.add(country.borderDisputed2D);
        } else {
          this.scene.add(country.borderDisputed3D);
        }
      }
    }
  },

  hideDisputedAreasBorders: function() {
    for(var i = 0; i < this.countries.length; i++) {
      var country = this.countries[i];
      if(country.disputed) {
          if(this.viewMode === '2d') {
              this.scene.remove(country.borderDisputed2D);
            } else {
              this.scene.remove(country.borderDisputed3D);
            }
      }
    }
  },

  setParamsFromSearch: function() {
    var search = location.search.substring(1);
    const params = search === '' ? {} : 
    	JSON.parse('{"' + search.replace(/&/g, '","').replace(/=/g,'":"') + '"}', 
    			function (key, value) { return key === "" ? value: decodeURIComponent(value) });

    const { mode, source, destination } = params;

    if(mode !== undefined && mode !== '') {
      this.setMode(mode.toLowerCase());
      UI.setModeDropdownValue(mode.toLowerCase());
    }

    if(source !== undefined && source !== '') {
      for(var i = 0; i < this.countries.length; i++) {
        var country = this.countries[i];
        var name = country.name.toLowerCase();

        if(cleanURLString(name) === cleanURLString(source.toLowerCase()) && CountryDataHelpers.isCountry(country)) {
          this.setSelectedCountry(country);
          break;
        }
      }
    }

    if(destination !== undefined && destination !== '') {
      for(i = 0; i < this.countries.length; i++) {
        country = this.countries[i];
        name = country.name.toLowerCase();

        if(cleanURLString(name) === cleanURLString(destination.toLowerCase()) && CountryDataHelpers.isCountry(country)) {
          this.setSelectedDestinationCountry(country);
          break;
        }
      }
    }

  },

  updateCountryHover: function(country) {
    // log('updateCountryHover()');
    if(!Config.isTouchDevice) {
      this.intersectedObject = country.mesh;

      if(this.countryBorder) {
        this.scene.remove(this.countryBorder);
      }

      if(this.viewMode === '3d') {
        this.countryBorder = country.border3D;
      } else {
        this.countryBorder = country.border2D;
      }
      this.scene.add(this.countryBorder);

      if(this.listHover) {
        return;
      }

      if(country.listItem !== undefined) country.listItem.addClass('hover');

      UI.updateCountryTooltip(this, country);

    }

  },

  clearCountryHover: function() {
    if(this.countryBorder) {
      this.scene.remove(this.countryBorder);
      this.countryBorder = null;
    }
    if(this.intersectedObject !== undefined && this.intersectedObject !== null) {
      if(this.intersectedObject.countryObject.listItem !== undefined) 
    	  this.intersectedObject.countryObject.listItem.removeClass('hover');
    }
    this.intersectedObject = null;
  },

  animate: function() {

    if(this.inited) {
      if(!Config.isTouchDevice && !this.introRunning) {
        this.intersectedObjectBefore = this.intersectedObject;

        var intersects = Geometry.getIntersects(this, UI.mouseNormalized);

        if( intersects.length > 0 ) {
          // if( this.intersectedObject !== intersects[ 0 ].object && 
        	// intersects[ 0 ].object.countryObject && intersects[ 0 ].object.countryObject !== this.selectedCountry ) {
          if( this.intersectedObject !== intersects[ 0 ].object && !this.listHover) {
            this.clearCountryHover();

            if(intersects[ 0 ].object.name !== 'sphere') {
              this.intersectedObject = intersects[ 0 ].object;
            }
            var country = intersects[ 0 ].object.countryObject;

            this.updateCountryHover(country);

          }

        } else {
          if(!this.listHover) {
            this.clearCountryHover();
            UI.hideCountryTooltip();
          }
        }

        if(this.intersectedObject) {
          $('body').css( 'cursor', 'pointer' );
        } else {
          $('body').css( 'cursor', 'default' );
        }
      }

      if(this.geometryNeedsUpdate) {
        Geometry.updateCountriesGeometry(this, false);
        if(Config.usesWebGL) {
          Geometry.updateCountriesBufferGeometry(this);
        }
      }

      if(this.selectedCountry || this.selectedDestinationCountry) {
        Geometry.updateLines(this);
      }

      this.render();
    }

  },

  selectCountryFromMap: function(event) {
    // log('selectCountryFromMap');

    var intersects = Geometry.getIntersects(this, UI.mouseNormalizedTouchStart);

    if( intersects.length > 0 ) {
      if(intersects[ 0 ].object.countryObject && this.selectedCountry !== intersects[ 0 ].object.countryObject ) {

        // if(intersects[ 0 ].object.name !== 'sphere' && !intersects[ 0 ].object.countryObject.disputed) {
        if(intersects[ 0 ].object.name !== 'sphere') {
          if(this.mode === 'destinations') {
            if(intersects[ 0 ].object.countryObject.disputed) {
              if(event.ctrlKey || event.altKey || event.metaKey) {
              } else {
                this.setSelectedDisputedCountry(intersects[ 0 ].object.countryObject);
              }
            } else {
              if(event.ctrlKey || event.altKey || event.metaKey) {
                if(this.selectedCountry && this.selectedCountry.disputed) {
                  this.selectedCountry = null;
                } else {
                  this.setSelectedDestinationCountry(intersects[ 0 ].object.countryObject);
                  this.trackEvent('destinationCountryMapClick', intersects[ 0 ].object.countryObject.name);
                }
              } else {
                this.setSelectedCountry(intersects[ 0 ].object.countryObject);
                this.trackEvent('sourceCountryMapClick', intersects[ 0 ].object.countryObject.name);
              }
            }

          } else if(this.mode === 'sources') {
            if(intersects[ 0 ].object.countryObject.disputed) {
              if(event.ctrlKey || event.altKey || event.metaKey) {
              } else {
                this.setSelectedDisputedDestinationCountry(intersects[ 0 ].object.countryObject);
              }
            } else {
              if(event.ctrlKey || event.altKey || event.metaKey) {
                this.setSelectedCountry(intersects[ 0 ].object.countryObject);
                this.trackEvent('sourceCountryMapClick', intersects[ 0 ].object.countryObject.name);
              } else {
                this.setSelectedDestinationCountry(intersects[ 0 ].object.countryObject);
                this.trackEvent('destinationCountryMapClick', intersects[ 0 ].object.countryObject.name);
              }
            }

          } else {
            // this.setSelectedCountry(intersects[ 0 ].object.countryObject);
            // this.trackEvent('mapClickSourceCountry', intersects[ 0 ].object.countryObject.name);
            if(event.ctrlKey || event.altKey || event.metaKey) {
              this.setSelectedDestinationCountry(intersects[ 0 ].object.countryObject);
              this.trackEvent('destinationCountryMapClick', intersects[ 0 ].object.countryObject.name);
            } else {
              this.setSelectedCountry(intersects[ 0 ].object.countryObject);
              this.trackEvent('sourceCountryMapClick', intersects[ 0 ].object.countryObject.name);
            }

          }

          this.updateCountryHover(intersects[ 0 ].object.countryObject);
          UI.centerCountryHoverInfoToMouse();
        }
      }
    } else {
      if(this.mode === 'destinations') {
        if(event.ctrlKey || event.altKey || event.metaKey) {
          this.clearSelectedDestinationCountry();
        } else {
          this.clearBothSelectedCountries();
        }
      } else if(this.mode === 'sources') {
        if(event.ctrlKey || event.altKey || event.metaKey) {
          this.clearSelectedSourceCountry();
        } else {
          this.clearBothSelectedCountries();
        }
      } else {
        if(event.ctrlKey || event.altKey || event.metaKey) {
          this.clearSelectedDestinationCountry();
        } else {
          this.clearBothSelectedCountries();
        }
      }

    }

    this.updateCountryColorsOneByOne();

  },

  clearBothSelectedCountries: function() {
    // log('clearBothSelectedCountries()');

    if(this.selectedCountry || this.selectedDestinationCountry) {
      Geometry.deleteLinesObject(this);
      for(var i = 0; i < this.countries.length; i++) {
        this.countries[i].visa_required = '';
        this.countries[i].visa_title = '';
        this.countries[i].notes = '';
      }
      if(this.selectedCountry) {
        if(this.selectedCountry.listItem !== undefined) this.selectedCountry.listItem.removeClass('selected');
      }
      if(this.selectedDestinationCountry) {
        if(this.selectedDestinationCountry.listItem !== undefined) 
        	this.selectedDestinationCountry.listItem.removeClass('selected');
      }
      this.selectedCountry = null;
      this.selectedDestinationCountry = null;

      UI.hideCountryTooltip();

      UI.clearSourceCountryDropDown();

      UI.clearDestinationCountryDropDown();

      UI.showMainLegend();

      UI.updateModeStatement(this);
    }

    UI.updateCountryList(this);

  },

  clearSelectedSourceCountry: function() {
    if(this.selectedCountry) {
      Geometry.deleteLinesObject(this);
      for(var i = 0; i < this.countries.length; i++) {
        this.countries[i].visa_required = '';
        this.countries[i].visa_title = '';
        this.countries[i].notes = '';
      }
      if(this.selectedCountry) {
        if(this.selectedCountry.listItem !== undefined) this.selectedCountry.listItem.removeClass('selected');
      }
      this.selectedCountry = null;

      UI.updateCountryList(this);

      UI.hideCountryTooltip();

      UI.clearSourceCountryDropDown();

      UI.showMainLegend();

      UI.updateModeStatement(this);
    }

    this.updateCountrySelection();

  },

  clearSelectedDestinationCountry: function() {
    if(this.selectedDestinationCountry) {
      Geometry.deleteLinesObject(this);
      for(var i = 0; i < this.countries.length; i++) {
        this.countries[i].visa_required = '';
        this.countries[i].visa_title = '';
        this.countries[i].notes = '';
      }
      if(this.selectedDestinationCountry) {
        if(this.selectedDestinationCountry.listItem !== undefined) this.selectedDestinationCountry.listItem.removeClass('selected');
      }
      this.selectedDestinationCountry = null;

      UI.updateCountryList(this);

      UI.hideCountryTooltip();

      UI.clearDestinationCountryDropDown();

      UI.showMainLegend();

      UI.updateModeStatement(this);
    }
    this.updateCountrySelection();

  },

  trackEvent: function(category, action) {
	//don't track  
    //if(typeof ga !== undefined) {
    //  ga('send', 'event', category, action);
    //}
  },

  setSelectedCountry: function(selectedCountry) {
    // log('setSelectedCountry()');

    if(!this.introRunning) {
      this.selectedCountry = selectedCountry;

      if(this.selectedCountry) {
        if(this.selectedCountry.listItem !== undefined) this.selectedCountry.listItem.addClass('selected');
        UI.setSourceCountryDropdownValue(this.selectedCountry.name);
      }

      this.updateCountrySelection();
    }
  },

  setSelectedDestinationCountry: function(selectedDestinationCountry) {
    // log('setSelectedDestinationCountry()');

    if(!this.introRunning) {
      this.selectedDestinationCountry = selectedDestinationCountry;

      if(this.selectedDestinationCountry) {
        if(this.selectedDestinationCountry.listItem !== undefined) this.selectedDestinationCountry.listItem.addClass('selected');
        UI.setDestinationCountryDropdownValue(this.selectedDestinationCountry.name);
      }

      this.updateCountrySelection();
    }
  },

  setSelectedDisputedCountry: function(country) {
    if(!this.introRunning) {
      this.selectedCountry = country;
      UI.setHeadline( country.name );
    }
  },

  setSelectedDisputedDestinationCountry: function(country) {
    if(!this.introRunning) {
      this.selectedDestinationCountry = country;
      UI.setHeadline( country.name );
    }
  },

  updateCountrySelection: function() {
	  
    // log('updateCountrySelection()');

    var i;
    var destinations;
    var d;
    var mainCountry;
    var value;
    var html;
    var sovereignty = '';
    var sovereigntyDestination = '';

    for(i = 0; i < this.countries.length; i++) {
      this.countries[i].visa_required = '';
      this.countries[i].visa_title = '';
      this.countries[i].notes = '';
    }

    if(this.mode === 'destinations') {

      if(this.selectedCountry && this.selectedDestinationCountry) {
        this.visaInformationFound = false;

        destinations = this.selectedCountry.destinations;
        if( destinations.length > 0 ) {
          sovereignty = '';

          if(!CountryDataHelpers.isCountry(this.selectedCountry)) {
            sovereignty = ' (' + this.selectedCountry.sovereignt + ')';
          }

          sovereigntyDestination = '';

          if(!CountryDataHelpers.isCountry(this.selectedDestinationCountry)) {
            sovereigntyDestination = ' (' + this.selectedDestinationCountry.sovereignt + ')';
          }

          for(d = 0; d < destinations.length; d++) {
            if( (CountryDataHelpers.matchDestinationToCountryName(destinations[d].d_name, 
            		this.selectedDestinationCountry.name) || 
            		CountryDataHelpers.matchDestinationToCountryName(
            				this.selectedDestinationCountry.name, destinations[d].d_name)) && 
            				this.selectedDestinationCountry.name !== this.selectedCountry.name
            		) {
              this.selectedDestinationCountry.visa_required = destinations[d].visa_required;
              this.selectedDestinationCountry.visa_title = destinations[d].visa_title;
              this.selectedDestinationCountry.notes = destinations[d].notes;

              this.visaInformationFound = true;

              UI.setHeadline(
                // CountryDataHelpers.getCountryDetailsByVisaStatus(this.selectedDestinationCountry) +
                '<span class="visa-title">' 
            		  + CountryDataHelpers.getCountryVisaTitle(this.selectedDestinationCountry) + '</span> ' +
                ' for ' + this.connectionLabel +' from ' + CountryDataHelpers.getCountryNameWithArticle(this.selectedCountry) +
                sovereignty +
                ' to ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) +
                sovereigntyDestination +
                '.<br/>' +
                '<div class="notes">' + this.selectedDestinationCountry.notes +
                '</div>' );

              break;
            }
          }

          // add main sovereignty, if exists:
          mainCountry = CountryDataHelpers.getCountryByName(this.countries, this.selectedCountry.sovereignt);
          if(mainCountry && mainCountry.visa_required === '') {
            mainCountry.visa_required = 'no';
            mainCountry.notes = 'National of same sovereignty (exceptions may exist)';
            this.visaInformationFound = true;

            UI.setHeadline(
              // CountryDataHelpers.getCountryDetailsByVisaStatus(this.selectedDestinationCountry) +
              '<span class="visa-title">' + CountryDataHelpers.getCountryVisaTitle(this.selectedDestinationCountry) + '</span> ' +
              ' for ' + this.connectionLabel +' from ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) +
              sovereignty +
              ' to ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) +
              sovereigntyDestination +
              '.<br/><div class="notes">' + this.selectedDestinationCountry.notes + '</div>' );
          }

        } else {
          this.visaInformationFound = false;
          UI.setHeadline( 'Data not available for ' + this.connectionLabel +' from ' 
        	  + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) 
        	  + '. <div class="notes">Please select a different country or click/tap the background to clear selection.</div>' );

        }

      } else if(this.selectedCountry && !this.selectedDestinationCountry) {
        this.selectedCountry.populationReachable = 0;
        destinations = this.selectedCountry.destinations;
        if( destinations.length > 0 ) {
          for(d = 0; d < destinations.length; d++) {
            var found = false;

            for(var c = 0; c < this.countries.length; c++) {
              // if( (CountryDataHelpers.matchDestinationToCountryName(destinations[d].d_name, this.countries[c].name) || 
              //	CountryDataHelpers.matchDestinationToCountryName(this.countries[c].name, destinations[d].d_name)) 
              //	&& this.countries[c].name !== this.selectedCountry.name) {
              if(
                // ( destinations[d].d_name === this.countries[c].sovereignt) ||
                (
                   CountryDataHelpers.matchDestinationToCountryName(destinations[d].d_name, this.countries[c].name) ||
                   CountryDataHelpers.matchDestinationToCountryName(this.countries[c].name, destinations[d].d_name)
                ) &&
                  this.countries[c].name !== this.selectedCountry.name

                ) {
                this.countries[c].visa_required = destinations[d].visa_required;
                this.countries[c].visa_title = destinations[d].visa_title;
                this.countries[c].notes = destinations[d].notes;

                if(destinations[d].visa_required === 'no' || 
                		destinations[d].visa_required === 'on-arrival' || 
                		destinations[d].visa_required === 'free-eu') {
                  this.selectedCountry.populationReachable += this.countries[c].population;
                }

                found = true;
                break;
              }

            }
            if(!found) {
              // log('ERROR: ' + destinations[d].d_name + ' could not be matched');
            }
          }

          // add main sovereignty, if exists:
          mainCountry = CountryDataHelpers.getCountryByName(this.countries, this.selectedCountry.sovereignt);
          if(mainCountry && mainCountry.visa_required === '') {
            mainCountry.visa_required = 'no';
            mainCountry.notes = 'National of same sovereignty (exceptions may exist)';
            this.selectedCountry.populationReachable += mainCountry.population;
          }

          // this.selectedCountry.populationPercentage = 
          // Math.round( this.selectedCountry.populationReachable / this.totalPopulation * 100 * 10 ) / 10;
          // this.selectedCountry.populationPercentage = formatNumber(this.selectedCountry.populationPercentage, 1);

          this.visaInformationFound = true;

          sovereignty = '';
          if(!CountryDataHelpers.isCountry(this.selectedCountry)) {
            sovereignty = ' (' + this.selectedCountry.sovereignt + ')';
          }

          UI.setHeadline(
            CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) +
            sovereignty +
            ' has '+ worldMap.connectionLabel +' to <b>' + this.selectedCountry.numDestinationsFreeOrOnArrival 
            			+ ' countries.</b>');
          UI.showSelectedLegend();

          // this.selectedCountry.populationPercentage + '&nbsp;% of the global population)

        } else {
          this.visaInformationFound = false;

          UI.setHeadline( 'Data not available for ' + this.connectionLabel +' from ' 
        		  + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) 
        		  + '. <div class="notes">Please select a different country or click/tap the background to clear selection.</div>');
          UI.showSelectedLegend();

          // log('No visa information found for national from ' + this.selectedCountry.name + '');
        }

      } else if(!this.selectedCountry && this.selectedDestinationCountry) {

      } else {
        // nothing selected
      }

    } else if(this.mode === 'sources') {

      if(this.selectedCountry && this.selectedDestinationCountry) {
        this.visaInformationFound = false;

        sovereignty = '';
        if(!CountryDataHelpers.isCountry(this.selectedCountry)) {
          sovereignty = ' (' + this.selectedCountry.sovereignt + ')';
        }

        sovereigntyDestination = '';
        if(!CountryDataHelpers.isCountry(this.selectedDestinationCountry)) {
          sovereigntyDestination = ' (' + this.selectedDestinationCountry.sovereignt + ')';
        }

        destinations = this.selectedCountry.destinations;
        if( destinations.length > 0 ) {
          for(d = 0; d < destinations.length; d++) {
            if( (CountryDataHelpers.matchDestinationToCountryName(destinations[d].d_name, 
            		this.selectedDestinationCountry.name) || 
            		CountryDataHelpers.matchDestinationToCountryName(
            				this.selectedDestinationCountry.name, destinations[d].d_name)) && 
            				this.selectedDestinationCountry.name !== this.selectedCountry.name) {
              this.selectedDestinationCountry.visa_required = destinations[d].visa_required;
              this.selectedDestinationCountry.visa_title = destinations[d].visa_title;
              this.selectedDestinationCountry.notes = destinations[d].notes;

              this.visaInformationFound = true;

              UI.setHeadline(
                // CountryDataHelpers.getCountryDetailsByVisaStatus(this.selectedDestinationCountry) +
                '<span class="visa-title">' + CountryDataHelpers.getCountryVisaTitle(this.selectedDestinationCountry) + '</span> ' +
                ' for ' + this.connectionLabel +' from ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) +
                sovereignty +
                ' to ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) +
                sovereigntyDestination +
                '.<br/><div class="notes">' + this.selectedDestinationCountry.notes + '</div>' );

              break;
            }
          }

          // check, if selected destination country has the same sovereignty
          if(this.selectedCountry.sovereignt === this.selectedDestinationCountry.sovereignt) {
            this.selectedDestinationCountry.visa_required = 'no';
            this.selectedDestinationCountry.notes = 'National of same sovereignty (exceptions may exist)';
            this.visaInformationFound = true;
            UI.setHeadline(
              '<span class="visa-title">' + CountryDataHelpers.getCountryVisaTitle(this.selectedDestinationCountry) + '</span> ' +
              // CountryDataHelpers.getCountryDetailsByVisaStatus(this.selectedDestinationCountry) +
              ' for ' + this.connectionLabel +' from ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) +
              sovereignty +
              ' to ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) +
              sovereigntyDestination +
              '.<br/><div class="notes">' + this.selectedDestinationCountry.notes + '</div>' );
          }

        } else {
          this.visaInformationFound = false;
          UI.setHeadline( 'Data not available for ' + this.connectionLabel +' from ' + 
        		  CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) + 
        		  '. <div class="notes">Please select a different country or click/tap the background to clear selection.</div>' );

        }

      } else if(this.selectedCountry && !this.selectedDestinationCountry) {

      } else if(!this.selectedCountry && this.selectedDestinationCountry) {

        this.selectedDestinationCountry.populationAccepted = 0;

        for(i = 0; i < this.countries.length; i++) {
          destinations = this.countries[i].destinations;
          for(d = 0; d < destinations.length; d++) {
            if( CountryDataHelpers.matchDestinationToCountryName(
            		destinations[d].d_name, this.selectedDestinationCountry.name) || 
            	CountryDataHelpers.matchDestinationToCountryName(
            			this.selectedDestinationCountry.name, destinations[d].d_name)) {
              this.countries[i].visa_required = destinations[d].visa_required;
              this.countries[i].visa_title = destinations[d].visa_title;
              this.countries[i].notes = destinations[d].notes;

              if(destinations[d].visa_required === 'no' || destinations[d].visa_required === 'on-arrival' || 
            		  destinations[d].visa_required === 'free-eu') {
                this.selectedDestinationCountry.populationAccepted += this.countries[i].population;
              }
            }
          }
        }
        this.visaInformationFound = true;

        // add all countries width same sovereignty like destination country:
        var countries = CountryDataHelpers.getAllCountriesWithSameSovereignty(this.countries, 
        												this.selectedDestinationCountry.sovereignt);
        for(i = 0; i < countries.length; i++) {
          if(countries[i].visa_required === '') {
            countries[i].visa_required = 'no';
            countries[i].notes = 'National of same sovereignty (exceptions may exist)';
            this.selectedDestinationCountry.populationAccepted += countries[i].population;
          }
        }

        // var populationPercentage = 
        //		Math.round( this.selectedDestinationCountry.populationAccepted / this.totalPopulation * 100 * 10 ) / 10;
        // populationPercentage = formatNumber(populationPercentage, 1);

        sovereigntyDestination = '';
        if(!CountryDataHelpers.isCountry(this.selectedDestinationCountry)) {
          sovereigntyDestination = ' (' + this.selectedDestinationCountry.sovereignt + ')';
        }

        UI.setHeadline(
          toSentenceStart( 
        		  CountryDataHelpers.getCountryNameWithArticle(this.selectedDestinationCountry) ) +
          sovereigntyDestination +
          ' has ' + worldMap.connectionLabel + ' from <b>' 
          + this.selectedDestinationCountry.numSourcesFreeOrOnArrival +
          ' countries.</b>');
        UI.showSelectedLegend();

        // (' + populationPercentage + '&nbsp;% of the global population)

      } else {
        // nothing selected
      }

    } else if(this.mode === 'gdp') {
      html = '';
      if(this.selectedCountry) {
        if(this.selectedCountry.gdp > 100) {
          value = this.selectedCountry.gdp / 1000;
          value = formatNumber(value, 1) + ' Billion USD';
          html += 'GDP of ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) + ': ' + value + '<br/>';
        } else {
          html += 'Data for ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedCountry ) + ' not available<br/>';
        }
      }
      if(this.selectedDestinationCountry) {
        if(this.selectedDestinationCountry.gdp > 100) {
          value = this.selectedDestinationCountry.gdp / 1000;
          value = formatNumber(value, 1) + ' Billion USD';
          html += 'GDP of ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) 
          				+ ': ' + value + '<br/>';
        } else {
          html += 'Data for ' + CountryDataHelpers.getCountryNameWithArticle( this.selectedDestinationCountry ) 
          				+ ' not available<br/>';
        }
      }
      UI.setHeadline(html);
      UI.showMainLegend();

    }

    UI.updateCountryList(this);
    if(Config.usesWebGL) {
      Geometry.createLines(this);
    }
    this.updateCountryColorsOneByOne();

  },

  render: function() {

    this.renderer.render(this.scene, this.camera);

    if(this.controls) {
      this.controls.update();
    }

    /*
    this.pointLight.position.x = this.camera.position.x;
    this.pointLight.position.y = this.camera.position.y + 300;
    this.pointLight.position.z = this.camera.position.z;
    */

  }
}; /* WorldMap end */


function init() {

  if(!Config.logTerminalVisible) {
    LogTerminal.hide();
  }

  if(Config.statsVisible) {
    stats = new Stats();
    stats.domElement.style.position = 'fixed';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    $('body').append( stats.domElement );
  }

  Panels.initPanels();

  UI.bindWindowResizeHandler();
  UI.centerCountryHoverInfoToScreen();
  UI.createLoadingInfo();

  worldMap = new WorldMap();
  
  //log('Visa requirements loaded for ' + dataRequirements.countries.length + ' sovereignties');
  // log( 'JSON Data: ' + dataRequirements.countries['Germany'].code );
  worldMap.visaRequirements = {
    		"created": "2018-07-01T05:00:01+02:00",
    		"type": "VisaRequirements",
    		"countries": [
    		{ "name": "Afghanistan", "code": "AFG", "destinations": [	
//    																	{ "d_name": "Albania",
//    										"visa_required": "yes",
//    										"visa_title": "Visa required",
//    										"notes": "test notes" },	
    																	{ "d_name": "Algeria",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Andorra",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Angola",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Antigua and Barbuda",
    										"visa_required": "eta",
    										"visa_title": "Electronic Entry Visa",
    										"notes": "" },	{ "d_name": "Argentina",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Armenia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Australia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Austria",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Azerbaijan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Bahamas",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Bahrain",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Bangladesh",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days \n|" },	{ "d_name": "Barbados",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Belarus",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Belgium",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Belize",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Benin",
    										"visa_required": "on-arrival",
    										"visa_title": "eVisa / Visa on arrival",
    										"notes": "30 days \/ 8 days" },	{ "d_name": "Bhutan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Bolivia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Bosnia and Herzegovina",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Botswana",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Brazil",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Brunei",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Bulgaria",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Burkina Faso",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Burundi",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Cambodia",
    										"visa_required": "on-arrival",
    										"visa_title": "eVisa / Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Cameroon",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Canada",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Cape Verde",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "" },	{ "d_name": "Central African Republic",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Chad",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Chile",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "People's Republic of China",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Colombia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Comoros",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "45 days\n|" },	{ "d_name": "Republic of the Congo",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Democratic Republic of the Congo",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Costa Rica",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Côte d'Ivoire",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Croatia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Cuba",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Cyprus",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Czech Republic",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Denmark",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Djibouti",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "" },	{ "d_name": "Dominica",
    										"visa_required": "no",
    										"visa_title": "Visa not required",
    										"notes": "21 days\n|" },	{ "d_name": "Dominican Republic",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Ecuador",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Egypt",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "*Visa not required for passenger aged 50 years and above or 16 years and below" },	{ "d_name": "El Salvador",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Equatorial Guinea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Eritrea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Estonia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Ethiopia",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Fiji",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Finland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "France",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Gabon",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Gambia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Georgia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Germany",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Ghana",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Greece",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Grenada",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Guatemala",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Guinea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Guinea-Bissau",
    										"visa_required": "on-arrival",
    										"visa_title": "eVisa / Visa on arrival",
    										"notes": "90 days\n|" },	{ "d_name": "Guyana",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Haiti",
    										"visa_required": "no",
    										"visa_title": "Visa not required",
    										"notes": "3 months\n|" },	{ "d_name": "Honduras",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Hungary",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Iceland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "India",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Indonesia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Iran",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Iraq",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Ireland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Israel",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "*Confirmation from Israeli government is required before a visa is" },	{ "d_name": "Italy",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Jamaica",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Japan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Jordan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Kazakhstan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Kenya",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Kiribati",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "North Korea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "South Korea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Kuwait",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Kyrgyzstan",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Laos",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Latvia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Lebanon",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Lesotho",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Liberia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Libya",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Liechtenstein",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Lithuania",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Luxembourg",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Macedonia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Madagascar",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "90 days\n|" },	{ "d_name": "Malawi",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Malaysia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Maldives",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Mali",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Malta",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Marshall Islands",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Mauritania",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "*Available at Nouakchott\u2013Oumtounsy International days and 90 days and 1 year visa are available" },	{ "d_name": "Mauritius",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Mexico",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Federated States of Micronesia",
    										"visa_required": "no",
    										"visa_title": "Visa not required",
    										"notes": "30 days\n|" },	{ "d_name": "Moldova",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Monaco",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Mongolia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Montenegro",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Morocco",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Mozambique",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Myanmar",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Namibia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Nauru",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Nepal",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Netherlands",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "New Zealand",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Nicaragua",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Niger",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Nigeria",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Norway",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Oman",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Pakistan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Palau",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Panama",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Papua New Guinea",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Paraguay",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Peru",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Philippines",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Poland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Portugal",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Qatar",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "" },	{ "d_name": "Romania",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Russia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Rwanda",
    										"visa_required": "on-arrival",
    										"visa_title": "eVisa / Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Saint Kitts and Nevis",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Saint Lucia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Saint Vincent and the Grenadines",
    										"visa_required": "no",
    										"visa_title": "Visa not required",
    										"notes": "1 month\n|" },	{ "d_name": "Samoa",
    										"visa_required": "yes|{{sort|Visa not |Visitor's Permit on arrival",
    										"visa_title": "Visitor's Permit on arrival",
    										"notes": "60 days" },	{ "d_name": "San Marino",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "São Tomé and Príncipe",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" },	{ "d_name": "Saudi Arabia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Senegal",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Serbia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Seychelles",
    										"visa_required": "yes|{{sort|Visa not |Visitor's Permit on arrival",
    										"visa_title": "Visitor's Permit on arrival",
    										"notes": "3 months\n|\n* Issued free of" },	{ "d_name": "Sierra Leone",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Singapore",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Slovakia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Slovenia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Solomon Islands",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Somalia",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "South Africa",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "South Sudan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Spain",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Sri Lanka",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Sudan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Suriname",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Swaziland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Sweden",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Switzerland",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Syria",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Tajikistan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Tanzania",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Thailand",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Timor-Leste",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "30 days\n|" },	{ "d_name": "Togo",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "7 days\n|" },	{ "d_name": "Tonga",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Trinidad and Tobago",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Tunisia",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Turkey",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Turkmenistan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Tuvalu",
    										"visa_required": "on-arrival",
    										"visa_title": "Visa on arrival",
    										"notes": "1 month\n|" },	{ "d_name": "Uganda",
    										"visa_required": "on-arrival",
    										"visa_title": "eVisa / Visa on arrival",
    										"notes": "3 moths\n|" },	{ "d_name": "Ukraine",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "United Arab Emirates",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "United Kingdom",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "United States",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Uruguay",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Uzbekistan",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Vanuatu",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Vatican City",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Venezuela",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "|" },	{ "d_name": "Vietnam",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Yemen",
    										"visa_required": "yes",
    										"visa_title": "Visa required",
    										"notes": "" },	{ "d_name": "Zambia",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "" },	{ "d_name": "Zimbabwe",
    										"visa_required": "eta",
    										"visa_title": "eVisa",
    										"notes": "|" }] }
    ]};
    worldMap.initD3();
    worldMap.initThree();

    if(Config.sphereEnabled) {
      Geometry.createSphere(worldMap);
    }

    // log('Loading world map ...');
    UI.updateLoadingInfo('Loading world map ...');

    $.when( $.getJSON(Config.mapDataFile) ).then(function(dataCountries) {
      log('World map loaded.');
      worldMap.dataCountries = dataCountries;

      /*
      // check for duplicate sovereignties:
      var count = 0;
      var features = dataCountries.features;
      worldMap.dataCountries.features = [];
      for(var i = 0 ; i < features.length; i++) {
        var feature2 = features[i];

        var found = false;
        for(var j = 0 ; j < worldMap.dataCountries.features.length ; j++) {
          var feature = worldMap.dataCountries.features[j];
          if( feature.sovereignt === feature2.sovereignt ) {
            found = true;
            break;
          }
        }
        if(!found) {
          worldMap.dataCountries.features.push(feature2);
          // log('Adding country: ' + feature2.name);
        } else {
          log('Duplicate country: ' + feature2.name + ', sovereignty: ' + feature2.sovereignt);
          count++;
        }
      }
      log(count);
      */

      if(Config.mergeDataFromMapDataFile2) {
        $.when( $.getJSON(Config.mapDataFile2) ).then(function(dataCountries2) {
          // console.log( dataCountries2.features.length );

          // merge countries from second higher-res map into first instead of loading full highres map:
          for(var i = 0; i < dataCountries2.features.length; i++) {
            var feature2 = dataCountries2.features[i];

            var found = false;
            for(var j = 0; j < worldMap.dataCountries.features.length; j++) {
              var feature = worldMap.dataCountries.features[j];
              if(feature.properties.NAME === feature2.properties.NAME) {
                found = true;
                break;
              }
            }

            if(!found) {
              worldMap.dataCountries.features.push(feature2);
              log('Adding country: ' + feature2.properties.NAME + ', type: ' + feature2.properties.TYPE);
            }
          }

          if(Config.mergeDataFromDisputedAreasFile) {
            $.when( $.getJSON(Config.disputedAreasFile) ).then(function(disputedAreas) {
              // merge disputed areas:
              for(var i = 0; i < disputedAreas.features.length; i++) {
                var disputedArea = disputedAreas.features[i];
                disputedArea.disputed = true;
                // if(disputedArea.properties.TYPE !== 'Disputed') 
                //		console.log(disputedArea.properties.TYPE, disputedArea.properties.NAME, disputedArea.properties);
                worldMap.dataCountries.features.push(disputedArea);
              }

              console.log(disputedAreas.features.length + ' disputed areas loaded');

              completeInit();
            });
          } else {
            completeInit();

          }

        });

      } else {
        completeInit();
      }

 //   });
  });

  function animate() {
    requestAnimationFrame(animate);

    if(worldMap !== undefined) worldMap.geometryNeedsUpdate = false;

    if(stats !== undefined) stats.update();

    TWEEN.update();

    if(worldMap !== undefined){ worldMap.animate();}
    
    
  }
  animate();

} /* init() end */


function completeInit() {
  if(Config.saveMapData) {
    var jsonPretty = JSON.stringify(worldMap.dataCountries, null, '');
    $.ajax({
      type: 'POST',
      url: 'http://test.local/save-to-file/index.php',
      data: {filename: Config.mergedCountriesFilename, data: jsonPretty},
      success: function() {
        log('JSON map data sent');
      }
    }).done(function( msg ) {
      log( 'Response: ' + msg );
    });
  }

  worldMap.createCountries();
  worldMap.initControls();
  UI.init(worldMap);

  worldMap.inited = true;

}

$(document).ready(init);
