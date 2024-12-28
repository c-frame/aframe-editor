# Commands and undo/redo

## Commands

### entitycreate

Usage:

```js
AFRAME.INSPECTOR.execute('entitycreate', {
  position: '0 0 0',
  components: { 'gltf-model': 'model.glb' }
});
```

If you need to do something after the entity is created you can pass a callback:

```js
AFRAME.INSPECTOR.execute("entitycreate", {
  position: "0 0 0",
  components: { "gltf-model": "model.glb" },
}, "Add model", (entity: Entity) => {
  const listener = (event) => {
    if (event.target !== entity) return; // we got an event for a child, ignore
    // do something with the model
    // ...
    entity.removeEventListener("model-loaded", listener);
  };
  entity.addEventListener("model-loaded", listener);
});
```

You can pass `parentEl` (the element or the id) to create the entity under a specific parent:

```js
AFRAME.INSPECTOR.execute('entitycreate', {
  position: '0 0 0',
  components: { 'gltf-model': 'model.glb' },
  parentEl: parentEntity
});
```

When executed, this emits an `entitycreated` event with `entity`.

When undone, this emits an `entityremoved` event with `entity`.

Those events are used to update the inspector UI, for now those can only be used internally, `Events.on`/`Events.off` are not exposed to the inspector interface.

### componentadd

Usage:

```js
AFRAME.INSPECTOR.execute('componentadd', {
  entity: entity,
  component: 'material',
  value: 'color: red'
});
```

When executed, this emits a `componentadd` event with `{entity, component, value}`.

When undone, this emits a `componentremove` event with `{entity, component}`.

### componentremove

Usage:

```js
AFRAME.INSPECTOR.execute('componentremove', {
  entity: entity,
  component: 'material'
});
```

When executed, this emits a `componentremove` event with `{entity, component}`.

When undone, this emits a `componentadd` event with `{entity, component, value}`.

### entityupdate

Usage:

```js
AFRAME.INSPECTOR.execute('entityupdate', {
  entity: entity,
  component: 'material',
  value: 'color: green; opacity: 0.5'
});
```

or a single property:

```js
AFRAME.INSPECTOR.execute('entityupdate', {
  entity: entity,
  component: 'material',
  property: 'color',
  value: 'green'
});
```

When executed or undone, this emits an `entityupdate` event with `{entity, component, property, value}`.

### entityremove

Usage:

```js
AFRAME.INSPECTOR.execute('entityremove', entity);
```

When executed, this emits an `entityremoved` event with `entity`.
When undone, this emits an `entitycreated` event with `entity`.

### multi

Create two entities in a row:

```js
const commands: CommandsForMulti = [
  ["entitycreate", {position: "0 0 0", components: {"gltf-model": "model.glb"}],
  ["entitycreate", {position: "1 0 0", components: {"gltf-model": "model.glb"}],
];
AFRAME.INSPECTOR.execute("multi", commands)
```

Create a parent with a child entity, passing the id of the parent with parentEl when creating the child:

```js
const parentEntityId = createUniqueId();
const definition = {
  id: parentEntityId,
  components: {
    position: "0 0 0",
    "gltf-model": "parent.glb",
  },
};
const commands: CommandsForMulti = [];
commands.push(["entitycreate", definition]);
commands.push(["entitycreate", {
  parentEl: parentEntityId,
  components: {
    position: "0 1 0",
    "gltf-model": "child.glb"
  },
  (entity) => {
    // do something with the child entity
  }
]);
const afterCreate = (entity: Entity | null) => {
  if (!entity) return; // actually not possible because we ended with entitycreate and not entityremove, but typescript doesn't know that
  // update some UI
  // ...
};
AFRAME.INSPECTOR.execute("multi", commands, "Add complex model", afterCreate);
```

When executed or undone, this doesn't emit anything.

## undo/redo

undo action:

```js
AFRAME.INSPECTOR.undo();
```

redo action:

```js
AFRAME.INSPECTOR.redo();
```

## interface/types

```js
import type { Entity } from "aframe";

type EntityObject {
  id?: string;
  class?: string;
  element?: string;
  mixin?: string;
  components: Record<string, string | object>;
  children?: EntityObject[];
  parentEl?: string | Entity;
}

interface AframeInspector {
  history: { undos: Command[]; redos: Command[] };
  undo: () => void;
  redo: () => void;
  execute: (
    cmdName: string,
    payload: EntityObject | Entity | CommandsForMulti,
    optionalName?: string,
    callback?: (entity: Entity | null) => void
  ) => void | Entity;
  selectedEntity: Entity | null;
  selectEntity: (entity: Entity | null, emit?: undefined | false) => void;
  toggle: () => void;
  open: (focusEl?: Entity) => void;
  close: () => void;
}

type ComponentAddCommand = [
  "componentadd",
  {
    entity: Entity;
    component: string;
    value: string;
  },
];

type ComponentRemoveCommand = [
  "componentremove",
  {
    entity: Entity;
    component: string;
  },
];

type EntityCreateCommand = ["entitycreate", EntityObject] | ["entitycreate", EntityObject, (el: Entity) => void];

type EntityRemoveCommand = ["entityremove", Entity];

type EntityUpdateCommand = [
  "entityupdate",
  {
    entity: Entity;
    component: string;
    property?: string | undefined;
    value: string;
  },
];

type CommandsForMulti = (
  | ComponentAddCommand
  | ComponentRemoveCommand
  | EntityCreateCommand
  | EntityRemoveCommand
  | EntityUpdateCommand
)[];
```
