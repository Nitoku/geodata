import * as THREE from 'three';
import Detector from './three/Detector';

const mapVersion = '4.1.0.1';
const cdnURL = 'https://cdn.markuslerner.com/travelscope/'; // 'http://cdn.markuslerner.com/travelscope/'

const config = {
		
  usesWebGL: Detector.webgl,
  isTouchDevice: ('ontouchstart' in document.documentElement),
  isMac: navigator.platform.toUpperCase().indexOf('MAC') >= 0,

  logTerminalVisible: false,
  statsVisible: false,

  rendererContainer: '#container',

  //mapDataFile: cdnURL + 'data/4.1.0/country_data.json?v=' + mapVersion,

  //visaRequirementsFile: cdnURL + VISA_REQUIREMENTS_URL,

  mergeDataFromMapDataFile2: false,
  mergeDataFromDisputedAreasFile: false,
  mapDataFile: cdnURL + 'data/4.1.0/ne_50m_admin_0_countries_simplified.json?v=' + mapVersion,
  //merge into: ne_50m_admin_0_countries_simplified
  mapDataFile2: cdnURL + 'data/4.1.0/ne_10m_admin_0_countries_simplified.json?v=' + mapVersion, 
  disputedAreasFile: cdnURL + 'data/4.1.0/ne_10m_admin_0_disputed_areas_simplified.json?v=' + mapVersion,

  saveMapData: false,
  mergedCountriesFilename: 'country_data.json',

  introRotateDuration: 4000, // 4000
  introWarpDelay: 2000, // 2000
  introWarpDuration: 2500, // 2500

  lineAnimateDuration: 800,
  lineAnimateSpeed: 10.0,
  lineDashOffsetLimit: 5.3,

  updateColorsDuration: 800,

  sourceCountryDefaultText: 'Source country',
  destinationCountryDefaultText: 'Destination country',

  viewSwitchDuration: 800,

  geoScale: 150, // 115
  mapOffsetX: -540, // -500
  mapOffsetY: 200, // 160
  globeRadius: 180,
  globeRotationX: -2.25,
  globeRotationY: 1.7,

  extrudeEnabled: false,
  extrudeDepth: 0.05,

  tesselationEnabled: false,
  tesselationMaxEdgeLength: 5,
  tesselationIterations: 8,

  cameraFOV: 60.0,
  cameraDistance: 500.0,
  cameraDistanceMin2D: 50.0,
  cameraDistanceMin: 250.0,
  cameraDistanceMax: 1000.0,

  sphereEnabled: false,
  sphereVisible: false,

  //colorCountryDefault: new THREE.Color(0x777777), //standard grey
  colorCountryDefault: new THREE.Color("#777777"), //standard grey
  colorCountrySelected: new THREE.Color("#6b9282"), //dark green (source country)
  
  //type 2 light green (destination countries)
  colorType2: new THREE.Color("#a52c6d"),
  
  //type 5 light grey (neither of the above)
  colorType5: new THREE.Color("#777777"),
  
  //type 1 dark brownish-green
  colorType1: new THREE.Color("#6b7e00"),
  
  //type 3 yellow
  colorType3: new THREE.Color("#fcff00"), // 0xff9000
  
  //type 4 blue 
  colorType4: new THREE.Color("#0055FF"), // 0x0055FF
  
  //default : 
  //  no link data (but we have the country on defined by user data)
  colorLinkTypeNotDefined: new THREE.Color("#26c400"), // 0xff9000
  
  //type 6 red
  colorType6: new THREE.Color("#aa0000"), //
  
  //no data
  colorDataNotAvailable: new THREE.Color("#444444"), // 0xFF00FF
 
  colorMaxDestinations: new THREE.Color("#26c400"), //  light green
  
  //note that the colors for countries are automatically calculated
  //depending on the number of connections/value high value countries
  //will have a very green color, countries with no values 
  //will have a dark color
  colorZeroDestinations: new THREE.Color("#242e1d"), //
  materialSphere: new THREE.MeshPhongMaterial({ 
	  		color: 0x888888, 
	  		transparent: false, 
	  		opacity: 1.0, 
	  		wireframe: false, 
	  		shading: THREE.SmoothShading, 
	  		side: THREE.DoubleSide }),

  materialMap: new THREE.MeshPhongMaterial( { 
	  		color: 0xFFFFFF, 
	  		specular: 0xFFFFFF, 
	  		shininess: 5, 
	  		transparent: false, 
	  		opacity: 0.9, side: 
	  		THREE.DoubleSide, 
	  		vertexColors: THREE.VertexColors } )

};


// only for non-BufferedGeometries:
config.materialCountryDefault = new THREE.MeshPhongMaterial({ 
	color: config.colorCountryDefault, 
	transparent: false, 
	wireframe: false, 
	shading: THREE.SmoothShading, 
	side: THREE.DoubleSide });

// Chrome and Firefox seem to ignore linewidth when using WebGLRenderer:
config.materialCountryBorder = 
	new THREE.LineBasicMaterial( { color: 0xceedc4, linewidth: 1 } );

config.materialCountryBorderDisputed = 
	new THREE.LineBasicMaterial( { color: 0x444444, linewidth: 2.0 } );

config.materialLineDefault = 
	new THREE.LineDashedMaterial( { 
		color: config.colorCountryDefault, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineType1 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType1, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineType2 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType2, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineType3 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType3, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineType4 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType4, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineType5 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType5, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineLinkTypeNotDefined = 
	new THREE.LineDashedMaterial( { 
		color: config.colorLinkTypeNotDefined, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 

config.materialLineType6 = 
	new THREE.LineDashedMaterial( { 
		color: config.colorType6, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 

config.materialLineDataNotAvailable = 
	new THREE.LineDashedMaterial( { 
		color: config.colorDataNotAvailable, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 


export default config;
