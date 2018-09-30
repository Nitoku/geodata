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

  visaRequirementsFile: cdnURL + VISA_REQUIREMENTS_URL,

  mergeDataFromMapDataFile2: false,
  mergeDataFromDisputedAreasFile: false,
  mapDataFile: cdnURL + 'data/4.1.0/ne_50m_admin_0_countries_simplified.json?v=' + mapVersion,
  //mapDataFile2: cdnURL + 'data/4.1.0/ne_10m_admin_0_countries_simplified.json?v=' + mapVersion, // merge into: ne_50m_admin_0_countries_simplified
  //disputedAreasFile: cdnURL + 'data/4.1.0/ne_10m_admin_0_disputed_areas_simplified.json?v=' + mapVersion,

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

  colorCountryDefault: new THREE.Color(0x777777), //standard grey
  colorCountrySelected: new THREE.Color(0x6b9282), //dark green (source country)
  colorVisaOnArrival: new THREE.Color(0x26c400), // light green (destination countries)
  colorVisaRequired: new THREE.Color(0x777777), // light grey (neither of the above)
  colorZeroDestinations: new THREE.Color(0x242e1d), // 
  colorMaxDestinations: new THREE.Color(0x26c400), //  light green
  
  //Not used by the nitoku travelscope data
  colorVisaNotRequired: new THREE.Color(0x6b7e00), // 
  colorVisaETA: new THREE.Color(0xfcff00), // 0xff9000
  colorVisaFreeEU: new THREE.Color(0x0055FF), // 0x0055FF
  colorVisaSpecial: new THREE.Color(0xa52c6d), // 0xff9000
  colorVisaAdmissionRefused: new THREE.Color(0xaa0000), //
  colorVisaDataNotAvailable: new THREE.Color(0x444444), // 0xFF00FF

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
	  		transparent: true, 
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
	new THREE.LineBasicMaterial( { color: 0x18415d, linewidth: 1.5 } );

config.materialCountryBorderDisputed = 
	new THREE.LineBasicMaterial( { color: 0x444444, linewidth: 2.0 } );

config.materialLineDefault = 
	new THREE.LineDashedMaterial( { 
		color: config.colorCountryDefault, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaNotRequired = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaNotRequired, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaOnArrival = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaOnArrival, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaETA = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaETA, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaFreeEU = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaFreeEU, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaRequired = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaRequired, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } );

config.materialLineVisaSpecial = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaSpecial, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 

config.materialLineVisaAdmissionRefused = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaAdmissionRefused, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 

config.materialLineVisaDataNotAvailable = 
	new THREE.LineDashedMaterial( { 
		color: config.colorVisaDataNotAvailable, 
		linewidth: 1.2, dashSize: 3, gapSize: 2, opacity: 0.5, transparent: true } ); 


export default config;
