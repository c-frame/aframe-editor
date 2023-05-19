import React from 'react';
//import { notifications } from '../../solid-components/message';
import Events from '../lib/Events';
import pickPointOnGroundPlane from '../lib/pick-point-on-ground-plane';

// TODO pass that as props
const library = [
  {
    title: 'base molding',
    thumb: '/models/kitchen/base_molding.jpg',
    url: '/models/kitchen/base_molding.glb?v=2'
  },
  {
    title: 'cooktop',
    thumb: '/models/kitchen/cooktop.jpg',
    url: '/models/kitchen/cooktop.glb?v=2'
  },
  {
    title: 'counter top',
    thumb: '/models/kitchen/countertop.jpg',
    url: '/models/kitchen/countertop.glb?v=2'
  },
  {
    title: 'furniture 1',
    thumb: '/models/kitchen/facade_001.jpg',
    url: '/models/kitchen/facade_001.glb?v=2'
  },
  {
    title: 'furniture 2',
    thumb: '/models/kitchen/facade_003.jpg',
    url: '/models/kitchen/facade_003.glb?v=2'
  },
  {
    title: 'furniture 3',
    thumb: '/models/kitchen/facade_004.jpg',
    url: '/models/kitchen/facade_004.glb?v=2'
  },
  {
    title: 'hood',
    thumb: '/models/kitchen/hood_001.jpg',
    url: '/models/kitchen/hood_001.glb?v=2'
  },
  {
    title: 'panel',
    thumb: '/models/kitchen/kitchen_panel.jpg',
    url: '/models/kitchen/kitchen_panel.glb?v=2'
  },
  {
    title: 'sink',
    thumb: '/models/kitchen/sink.jpg',
    url: '/models/kitchen/sink.glb?v=2'
  },
  {
    title: 'washer',
    thumb: '/models/kitchen/washer.001.jpg?v=2',
    url: '/models/kitchen/washer.001.glb?v=2'
  }
];

function onItemDragOver(e) {
  if (e.preventDefault) e.preventDefault(); // Necessary. Allows us to drop.

  e.dataTransfer.dropEffect = 'move'; // See the section on the DataTransfer object.

  return false;
}

let showDragAndDropHint = true;

export default class Library extends React.Component {
  render() {
    const dropPlaneEl = React.createRef();
    function fadeInDropPlane() {
      dropPlaneEl.current.style.display = 'block';
      setTimeout(function () {
        if (dropPlaneEl.current) {
          dropPlaneEl.current.style.opacity = 1;
        }
      }, 50);
    }

    function fadeOutDropPlane() {
      dropPlaneEl.current.style.opacity = 0;
      setTimeout(function () {
        if (dropPlaneEl.current) {
          dropPlaneEl.current.style.display = 'none';
        }
      }, 300);
    }

    // TODO pass that as props
    const onItemDropCallback = (item, position, callback) => {
      Events.emit('entitycreate', {
        element: 'a-entity',
        components: {
          // geometry: 'primitive:box',
          // position: '0 0.5 0'
          'gltf-model': item.url,
          position: position
        }
      });
      if (callback) {
        callback();
      }
    };

    function onItemDrop(e) {
      e.preventDefault(); // stops the browser from redirecting.
      e.stopPropagation(); // stops the browser from redirecting.

      // hide dropPlaneEl
      fadeOutDropPlane();

      // get picking point
      var position = pickPointOnGroundPlane({
        x: e.clientX,
        y: e.clientY,
        canvas: AFRAME.scenes[0].canvas,
        camera: AFRAME.INSPECTOR.camera
      });

      // get item data
      var item = JSON.parse(e.dataTransfer.getData('text/plain'));

      onItemDropCallback(item, position);

      return false;
    }

    return (
      <>
        <div
          ref={dropPlaneEl}
          onDragOver={onItemDragOver}
          onDrop={onItemDrop}
          style={{ display: 'none' }}
          className="pointer-events-auto absolute inset-0 top-8 flex select-none border-2 border-sky-600 bg-sky-600/20 text-4xl text-slate-50 transition-opacity duration-200"
        >
          <div className="text-center leading-[80vh]">drop here</div>
        </div>
        <div
          id="bottomPanel"
          className="absolute bottom-0 flex w-full select-none justify-center"
        >
          <div className="pointer-events-auto flex">
            {library.map((item, idx) => {
              return (
                <div
                  className="border-2 border-white hover:border-sky-600"
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => {
                    e.stopPropagation();
                    fadeInDropPlane();
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', JSON.stringify(item));
                    return false;
                  }}
                  onDragEnd={(e) => {
                    e.stopPropagation();
                    fadeOutDropPlane();
                    return false;
                  }}
                  onClick={(e) => {
                    e.stopPropagation();

                    // add to screen center
                    // const position = pickPointOnGroundPlane({
                    //   normalizedX: 0,
                    //   normalizedY: 0,
                    //   camera: AFRAME.INSPECTOR.camera
                    // });
                    const position = new THREE.Vector3(0, 0, -3);

                    onItemDropCallback(item, position, function () {
                      // show drag & drop hint after loading success message
                      if (showDragAndDropHint) {
                        setTimeout(function () {
                          // TODO pass a showHint function as props
                          console.log('Hint: You can use drag & drop ;)');
                          //                          notifications.create({
                          //                            type: 'log',
                          //                            code: 40,
                          //                            level: 'info'
                          //                          }); // Hint: You can use drag & drop ;)
                          showDragAndDropHint = false;
                        }, 1000);
                      }
                    });
                    return false;
                  }}
                >
                  <img
                    src={item.thumb}
                    alt={item.title}
                    title={item.title}
                    width="128"
                    height="128"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }
}
