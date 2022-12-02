/* global console, unescape */
'use strict';
import b8r from 'https://rawgit.com/tonioloewald/bindinator.js/master/source/b8r.js';
import*as _utils from './utils.js';
import {Star} from './star.js';

/*
  Worker
*/
const GalaxyWorker = new Worker("js/worker.js",{
  type: "module"
});

/*
  Initialize b8r and Settings 
*/
window.b8r = b8r;
b8r.register('settings', {
  filter: {
    search: '',
    habitability: 5
  }
});

/*
  Select and deselect 
*/

//handle picking star on display 
function pick_star(evt) {
  const star = b8r.getListInstance(evt.target);
  if (!evt.target.matches('.current')) {
    b8r.setByPath('settings', 'star', b8r.getByPath('galaxy', 'stars').indexOf(star));
    const zoom = b8r.getByPath('settings', 'zoom');
    if (!zoom || zoom > 1000) {
      b8r.setByPath('settings', 'zoom', 500);
    }
  }
  render();
}

function deselect() {
  b8r.setByPath('settings', 'star', undefined);
  b8r.setByPath('settings', 'zoom', undefined);
  b8r.setByPath('settings', 'x', undefined);
  b8r.setByPath('settings', 'y', undefined);
  render();
  return true;
}

/*
  Zoom Functions 
*/
function zoomIn() {
  const {zoom} = b8r.getByPath('settings');
  if (zoom) {
    b8r.setByPath('settings', 'zoom', zoom * 0.5);
  } else {
    b8r.setByPath('settings', 'zoom', 1000);
  }
  render();
}

function zoomOut() {
  const {zoom} = b8r.getByPath('settings');
  if (zoom < 1000) {
    b8r.setByPath('settings', 'zoom', zoom * 2);
  } else {
    b8r.setByPath('settings', 'zoom', undefined);
    b8r.setByPath('settings', 'x', undefined);
    b8r.setByPath('settings', 'y', undefined);
  }
  render();
}

/*
  Filter and Search 
*/
const filter = b8r.debounce(()=>{
  let filter_index = 0;
  const needle = b8r.get('settings.filter.search').toLowerCase();
  const habitability = b8r.get('settings.filter.habitability');
  const stars = b8r.get('galaxy.stars');

  const filter_star = star=>{
    if (needle && star.name.toLowerCase().indexOf(needle) === -1) {
      star.filtered = true;
    } else if (habitability < 5 && star.habitability() > habitability) {
      star.filtered = true;
    } else {
      star.filtered = false;
    }
  }
  ;

  const filter_slice = ()=>{
    const start = Date.now();
    for (; (filter_index < stars.length) && (Date.now() - start < 30); filter_index++) {
      filter_star(stars[filter_index]);
    }
    if (filter_index < stars.length) {
      console.log(filter_index);
      requestAnimationFrame(filter_slice);
    } else {
      b8r.touch('galaxy.stars');
    }
  }
  ;

  filter_slice();
}
, 250);

const star_fill = (element,[color,filtered])=>{
  if (filtered) {
    color = color.replace(/rgb/, 'rgba').replace(/\)/, ',0.25)');
  }
  element.setAttribute('fill', color);
}
;

/*
  Controls and events 
*/

b8r.register('galaxy-controls', {
  pick_star,
  star_fill,
  filter,
  deselect,
  zoomIn,
  zoomOut
});

const last_render_params = {};
const xPos = b8r.findOne('.x-position');
const yPos = b8r.findOne('.y-position');
const systemInfo = b8r.findOne('.system');
const galaxyFrame = b8r.findOne('.galaxy-frame');

/*
  Render Galaxy svg
*/

function render() {
  //define filter 
  if (b8r.get('settings.filter.search') || b8r.get('settings.filter.habitability') < 5) {
    filter();
  }

  const {star, zoom} = b8r.getByPath('settings');

  b8r.find('.current').forEach(elt=>elt.classList.remove('current'));
  if (star === undefined) {
    [systemInfo, xPos, yPos].forEach(elt=>b8r.hide(elt));
  } else if (typeof star === 'number' && star !== last_render_params.star) {
    const _star = b8r.getByPath('galaxy', 'stars')[star];
    const planets = _star.planetsDetail();
    console.log(_star, planets);
    b8r.set('system', {
      star: _star,
      planets
    });
    b8r.find(`[data-list-instance="galaxy.stars[name=${_star.name}]"]`).forEach(elt=>{
      elt.classList.add('current');
      const y = elt.offsetTop - elt.parentElement.scrollTop;
      if (y < 0 || y + elt.offsetHeight > elt.parentElement.offsetHeight) {
        elt.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }
    );
    xPos.setAttribute('x1', _star._x);
    xPos.setAttribute('x2', _star._x);
    yPos.setAttribute('y1', _star._y);
    yPos.setAttribute('y2', _star._y);
    [systemInfo, xPos, yPos].forEach(elt=>b8r.show(elt));
  }
  if (zoom && star !== undefined) {
    const _star = b8r.getByPath('galaxy', 'stars')[star];
    changeViewBox(_star._x - zoom * 0.5, _star._y - zoom * 0.5, zoom);
  } else {
    changeViewBox(0, 0, 2000);
  }
  Object.assign(last_render_params, {
    star,
    zoom,
  });
}

/*
  Change View Box 
*/

function changeViewBox(x, y, w) {
  if (w === undefined || x === undefined || y === undefined) {
    x = 0;
    y = 0;
    w = 2000;
  }

  const [x0,y0,w0] = galaxyFrame.getAttribute('viewBox').split(' ');

  const duration = 500;
  const animationEnds = Date.now() + duration;

  function iterate() {
    if (Date.now() > animationEnds) {
      console.log('done changing viewbox');
      galaxyFrame.setAttribute('viewBox', `${x} ${y} ${w} ${w}`);
    } else {
      var t = 1 - (animationEnds - Date.now()) / duration;
      t = (Math.sin((t - 0.5) * Math.PI) + 1) * 0.5;
      const xt = Math.lerp(x0, x, t);
      const yt = Math.lerp(y0, y, t);
      const wt = Math.lerp(w0, w, t);
      galaxyFrame.setAttribute('viewBox', `${xt} ${yt} ${wt} ${wt}`);
      requestAnimationFrame(iterate);
    }
  }

  requestAnimationFrame(iterate);
}

//handle worker messages 
GalaxyWorker.onmessage = (e)=>{
  let {id, data} = e.data

  if (id == "init") {
    //format stars from initial generator  
    let stars = data.map(s => new Star(s))
    stars.sort( (a, b) => a.name > b.name ? 1 : ( a.name < b.name ? -1 : 0 ) );
    //set galaxy data 
    b8r.set('galaxy', {
      stars
    });
  }
  render()
}
