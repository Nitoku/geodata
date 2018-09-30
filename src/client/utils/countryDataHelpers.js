import * as THREE from 'three';
import * as TWEEN from 'tween.js';

import Config from '../config';



export function isCountry(country) {
  // return country.type === 'Sovereign country';

  if(country.name === 'Taiwan') {
    return false;
  }

  return country.type === 'Sovereign country' ||
    (country.type === 'Country' && (country.sovereignt === country.name || country.sovereignt === country.nameSort));

};


export function matchDestinationToCountryName(destination, country) {
  if(destination === country) return true;

  if(destination === 'Brunei') {
    destination = 'Brunei Darussalam';
  } else if(destination === 'People\'s Republic of China') {
    destination = 'China';
  } else if(destination === 'Czech Republic') {
    destination = 'Czechia';
  } else if(destination === 'Republic of the Congo') {
    destination = 'Republic of Congo';
  } else if(destination === 'Ivory Coast') {
    destination = 'Côte d\'Ivoire';
  } else if(destination === 'Gambia') {
    destination = 'The Gambia';
  } else if(destination === 'North Korea') {
    destination = 'Dem. Rep. Korea';
  } else if(destination === 'South Korea') {
    destination = 'Republic of Korea';
  } else if(destination === 'Laos') {
    destination = 'Lao PDR';
  } else if(destination === 'Burma') {
    destination = 'Myanmar';
  } else if(destination === 'Russia') {
    destination = 'Russian Federation';
  } else if(destination === 'São Tomé and Príncipe') {
    destination = 'São Tomé and Principe';
  } else if(destination === 'Vatican City') {
    destination = 'Vatican';
  } else if(destination === 'United States of America') {
    destination = 'United States';
  } else if(destination === 'Republic of Serbia') {
    destination = 'Serbia';
  }

  return country === destination;
};


export function getCountryNameWithArticle(country) {
  var name = country.name;
  var nameFormatted = '<b>' + name + '</b>';
  if(name === 'Republic of the Congo') {
    return 'the ' + nameFormatted;
  } else if(name === 'Russia Federation') {
    return 'the ' + nameFormatted;
  } else if(name === 'Vatican') {
    return 'the ' + nameFormatted;
  } else if(name === 'United States') {
    return 'the ' + nameFormatted;
  } else if(name === 'British Indian Ocean Territory') {
    return 'the ' + nameFormatted;
  } else if(name === 'British Virgin Islands') {
    return 'the ' + nameFormatted;
  }
  return nameFormatted;
};


export function getCountryByName(countries, name) {
  for(var c = 0; c < countries.length; c++) {
    if(matchDestinationToCountryName(countries[c].name, name) || 
    		matchDestinationToCountryName(name, countries[c].name)) {
      return countries[c];
    }
  }
  return null;
};


export function getAllCountriesWithSameSovereignty(countries, sov) {
  var countriesMatched = [];
  for(var c = 0; c < countries.length; c++) {
    if(countries[c].sovereignt === sov) {
      countriesMatched.push(countries[c]);
    }
  }
  return countriesMatched;
};


export function correctCenter(country) {
  if(country.name === 'France') {
    country.center2D.x = -55;
    country.center2D.y = 89;
  } else if(country.name === 'Netherlands') {
    country.center2D.x = -47;
    country.center2D.y = 104;
  } else if(country.name === 'Norway') {
    country.center2D.x = -35;
    country.center2D.y = 140;
  } else if(country.name === 'United States') {
    country.center2D.x = -300;
    country.center2D.y = 65;
  } else if(country.name === 'Canada') {
    country.center2D.x = -290;
    country.center2D.y = 130;
  } else if(country.name === 'Denmark') {
    country.center2D.x = -38;
    country.center2D.y = 114;
  } else if(country.name === 'India') {
    country.center2D.x = 145;
    country.center2D.y = 20;
  } else if(country.name === 'Russia') {
    country.center2D.x = 135;
    country.center2D.y = 132;
  } else if(country.name === 'Brazil') {
    country.center2D.x = -190;
    country.center2D.y = -78;
  } else if(country.name === 'United Kingdom') {
    country.center2D.x = -64;
    country.center2D.y = 107;
  } else if(country.name === 'Spain') {
    country.center2D.x = -67;
    country.center2D.y = 70;
  } else if(country.name === 'Portugal') {
    country.center2D.x = -79;
    country.center2D.y = 67;
  }
};


export function getCountryColorByVisaStatus(country) {
  var c;
  if(country.linkTypeName === 'no') {
    c = Config.colorVisaNotRequired;

  } else if(country.linkTypeName === 'on-arrival') {
    c = Config.colorVisaOnArrival;

  } else if(country.linkTypeName === 'eta') {
    c = Config.colorVisaETA;

  } else if(country.linkTypeName === 'free-eu') {
    c = Config.colorVisaFreeEU;

  } else if(country.linkTypeName === 'yes') {
    c = Config.colorVisaRequired;

  } else if(country.linkTypeName === 'admission-refused') {
    c = Config.colorVisaAdmissionRefused;

  } else if(country.linkTypeName === '') {
    c = Config.colorVisaDataNotAvailable;

  } else { // special
    c = Config.colorVisaSpecial;

  }
  return c;
};


export function getLineMaterial(country) {
  var material = Config.materialLineDefault;

  if(country.linkTypeName === 'no') {
    material = Config.materialLineVisaNotRequired;

  } else if(country.linkTypeName === 'on-arrival') {
    material = Config.materialLineVisaOnArrival;

  } else if(country.linkTypeName === 'eta') {
    material = Config.materialLineVisaETA;

  } else if(country.linkTypeName === 'free-eu') {
    material = Config.materialLineVisaFreeEU;

  } else if(country.linkTypeName === 'yes') {
    material = Config.materialLineVisaRequired;

  } else if(country.linkTypeName === 'admission-refused') {
    material = Config.materialLineVisaAdmissionRefused;

  } else if(country.linkTypeName === '') {
    material = Config.materialLineVisaDataNotAvailable;

  } else { // special
    material = Config.materialLineVisaSpecial;
  }
  return material;
};


export function getCountryColorByFreeDestinations(numDestinations, maxNumDestinationsFreeOrOnArrival) {
  var m = numDestinations / maxNumDestinationsFreeOrOnArrival;
  var color = new THREE.Color(Config.colorZeroDestinations);
  color.lerp(Config.colorMaxDestinations, m);
  return color;
};


export function getCountryColorByFreeSources(numSources, maxNumSourcesFreeOrOnArrival) {
  var m = numSources / maxNumSourcesFreeOrOnArrival;
  var color = new THREE.Color(Config.colorZeroDestinations);
  color.lerp(Config.colorMaxDestinations, m);
  return color;
};


export function getCountryColorByGDP(country, maxGDP) {
  var m = country.gdp / maxGDP;
  m = TWEEN.Easing.Exponential.Out(m);
  var color = new THREE.Color(Config.colorZeroDestinations);
  color.lerp(Config.colorMaxDestinations, m);
  return color;
};


export function getCountryColorByGDPPerCapita(country, maxGDPPerCapita) {
  // var m = (country.gdp / country.population * 1000000) / maxGDPPerCapita;
  var m = country.gdpPerCapita / maxGDPPerCapita;
  m = TWEEN.Easing.Exponential.Out(m);
  var color = new THREE.Color(Config.colorZeroDestinations);
  color.lerp(Config.colorMaxDestinations, m);
  return color;
};


export function getPopulationRatio(country, maxPopulation) {
  return parseFloat(country.population) / maxPopulation;    // 1 166 079 220.0;
};


export function getCountryColorByPopulation(country, maxPopulation) {
  var m = getPopulationRatio(country, maxPopulation);
  m = TWEEN.Easing.Exponential.Out(m);
  var color = new THREE.Color(Config.colorZeroDestinations);
  color.lerp(Config.colorMaxDestinations, m);
  // color.copyLinearToGamma(color);
  return color;
};


export function getCountryVisaTitle(country) {
  //emilio 
  //if we don't have data provide no data available	
  if(country.linkTitle === '') {
    //return 'Special regulations';
	  return 'Data not available';
  } else {
    return country.linkTitle;
  }
};


export function getCountryDetailsByVisaStatus(country) {
  var details = '';

  if(country.linkTypeName === 'no') {
    details = 'Visa not required';

  } else if(country.linkTypeName === 'on-arrival') {
    details = 'Visa on arrival';

  } else if(country.linkTypeName === 'free-eu') {
    details = 'Visa not required (EU)';

  } else if(country.linkTypeName === 'yes') {
    details = 'Visa required';

  } else if(country.linkTypeName === 'admission-refused') {
    details = 'Admission refused';

  } else if(country.linkTypeName === 'special') {
    details = 'Special regulations';

  } else if(country.linkTypeName === '') { // data not available
    details = 'Data not available';

  } else { // special
    details = country.linkTypeName;

  }
  return details;
};
