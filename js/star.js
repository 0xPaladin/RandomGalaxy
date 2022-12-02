import {romanNumeral} from './utils.js';
import {starTypeData} from './astrophysics.js';
import {Planet} from './planet.js';

class Star {
  constructor ( data ){
    //assign data 
    Object.assign(this,data)
  }

  detail() {   
    return this._detail;
  }

  planets () {
    return this._planets.map((p,i) => new Planet( this.name.capitalize() + "-" + romanNumeral(i + 1), ...p))
  }

  planetsDetail () {
    return this.planets().map(planet => planet.detail());
  }

  habitability () {
    if (!this._habitability) {
      const list = this.planetsDetail().map(detail => detail.HI).sort();
      this._habitability = list.length ? list.shift() : 5;
    }
    return this._habitability;
  }

  description() {
    var output = '';
    output += '<h3>' + this.name.capitalize() + "</h3>\n";
    output += this.detail().toHTML(true);
    this.planets().forEach( planet => output += '<div class="subrecord">' + planet.description() + '</div>' );
    return output;
  }
}

export {Star}