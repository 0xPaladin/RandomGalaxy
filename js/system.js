import {PRNG} from './prng.js';
import {isBadWord} from './badwords.js';
import {random_name} from './random_name.js';

import {starTypeData} from './astrophysics.js';

/*
  Galaxy Data for genertion 
*/

const spiral_arms = 2
  , spiral_angle_degrees = 360
  , min_radius = 0.05
  , max_radius = 0.92
  , thickness = 0.1
  , scatter_theta = Math.PI / spiral_arms * 0.3
  , scatter_radius = min_radius * 0.4
  , spiral_b = spiral_angle_degrees / Math.PI * min_radius / max_radius
  , start = (new Date()).getTime()
  , names = []
  , rejects = {
  badwords: 0,
  duplicates: 0
};

//generating a system based upon a seed 
const System = (seed)=>{
  let system = {}

  var pseudoRandom = new PRNG(seed)

  var number_of_syllables = Math.floor(pseudoRandom.value() * 2 + 2), new_name;

  //generate a unique name without badwords
  while (true) {
    new_name = random_name(pseudoRandom, number_of_syllables);
    if (names.indexOf(new_name) >= 0) {
      rejects.duplicates++;
    } else if (isBadWord(new_name)) {
      rejects.badwords++;
    } else {
      break;
    }
  }
  names.push(new_name);
  system.name = new_name

  //positioning according to galaxy spiral
  var r = pseudoRandom.realRange(min_radius, max_radius);
  var theta = spiral_b * Math.log(r / max_radius) + pseudoRandom.gaussrandom(scatter_theta);
  r += pseudoRandom.gaussrandom(scatter_radius);
  // assign to a spiral arm
  theta += pseudoRandom.range(0, spiral_arms - 1) * Math.PI * 2 / spiral_arms;
  //determine position
  system.position = {
    x: Math.cos(theta) * r,
    y: Math.sin(theta) * r,
    z: pseudoRandom.gaussrandom(thickness * 0.5)
  };

  //star detail 
  let detail = {}
    , spectralClass = pseudoRandom.pick(["O", "B", "A", "F", "G", "K", "M"], [0.0001, 0.2, 1, 3, 8, 12, 20])
    , spectralIndex = pseudoRandom.range(0, 9)
    , stellarTemplate = starTypeData[spectralClass];

  detail.spectralType = spectralClass + spectralIndex;
  detail.luminosity = stellarTemplate.luminosity * (4 / (spectralIndex + 2));
  detail.template = stellarTemplate;

  //assign fixed detail 
  system._detail = detail

  //svg display positioning
  const x = system.position.x * 1000 + 1000;
  const y = system.position.y * 1000 + 1000;
  const z = system.position.z * 1000 + 1000;

  system._x = x.toFixed(1);
  system._y = y.toFixed(1);
  system._z = z.toFixed(1);
  system._cx = (system.position.x * 50000).toFixed(2);
  system._cy = (system.position.y * 50000).toFixed(2);
  system._cz = (system.position.z * 50000).toFixed(2);

  //radius 
  var s = Math.log(detail.luminosity) + 8;
  s = Math.max(Math.min(s, 20), 2);
  system._r = s;

  //svg stransform
  system._transform = `translate3d(${x}px, ${y}px, ${z}px) rotateX(0deg)`;
  //svg styling 
  system._star_style = {
    width: s + 'px',
    height: s + 'px',
    backgroundColor: detail.template.color,
    border: `${s * 0.25}px solid rgba(0,0,0,0.7)`,
  };

  //planets 
  let numberOfPlanets = pseudoRandom.range(stellarTemplate.planets[0], stellarTemplate.planets[1])
    , radius_min = 0.4 * pseudoRandom.realRange(0.5, 2)
    , radius_max = 50 * pseudoRandom.realRange(0.5, 2)
    , total_weight = (Math.pow(numberOfPlanets, 2) + numberOfPlanets) * 0.5
    , pr = radius_min
    , _planets = [];

  for (var i = 0; i < numberOfPlanets; i++) {
    pr += i / total_weight * pseudoRandom.realRange(0.5, 1) * (radius_max - radius_min);
    _planets.push([pseudoRandom.range(0, Number.MAX_SAFE_INTEGER), pr, detail.luminosity / Math.pow(pr, 2)])
  }
  system._planets = _planets;

  return system
}

export {System}
