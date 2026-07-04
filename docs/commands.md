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

### entityreparent

Usage:

```js
AFRAME.INSPECTOR.execute('entityreparent', {
  entity: entity,
  parentEl: 'newParentId',
  indexInParent: 0
});
```

- `entity`: the entity to reparent.
- `parentEl`: the id of the new parent element.
- `indexInParent`: the index at which to insert the entity among the new parent's children. If omitted or out of range, the entity is appended.

The entity's world position, rotation, and scale are preserved — its local transform is recalculated relative to the new parent.

When executed or undone, this emits an `entityremoved` event with the old entity and an `entitycreated` event with the recreated entity.

### entityremove

Usage:

```js
AFRAME.INSPECTOR.execute('entityremove', entity);
```

When executed, this emits an `entityremoved` event with `entity`.
When undone, this emits an `entitycreated` event with `entity`.

### assetcreate

Create an asset element in `<a-assets>` (e.g. `a-material`, `a-mixin`, `img`, `audio`, `video`, `a-asset-item`).

Usage:

```js
AFRAME.INSPECTOR.execute('assetcreate', {
  tagName: 'a-material'
});
```

or with an explicit id, attributes and a callback receiving the created element:

```js
AFRAME.INSPECTOR.execute(
  'assetcreate',
  {
    tagName: 'img',
    id: 'wood',
    attributes: { src: 'wood.png', crossorigin: 'anonymous' }
  },
  undefined,
  (img) => { console.log('created', img); }
);
```

- `tagName`: element tag to create.
- `id`: optional; a unique `<base>-N` id is generated otherwise (e.g. `material-1` for `a-material`). The id stays stable across undo/redo so later commands referencing the asset keep working.
- `attributes`: optional object of attribute name to string value.

When executed, this emits an `assetcreate` event with the created element.
When undone, this emits an `assetremove` event with the asset id.

### assetupdate

Update an attribute of an asset element. Consecutive updates to the same asset attribute are merged in history like entity updates.

Usage:

```js
AFRAME.INSPECTOR.execute('assetupdate', {
  assetEl: materialEl, // element or id string
  attribute: 'color',
  value: 'green' // attribute string, or null to remove the attribute
});
```

When executed or undone, this emits an `assetupdate` event with `{assetEl, attribute, value}`.

### assetremove

Remove an asset element from `<a-assets>`. The tag name, attributes and position are captured so undo recreates the asset in place. For `<a-material>`, entities referencing the asset are re-resolved on undo so they use the recreated `THREE.Material` instance.

Usage:

```js
AFRAME.INSPECTOR.execute('assetremove', {
  assetEl: materialEl // element or id string
});
```

When executed, this emits an `assetremove` event with the asset id.
When undone, this emits an `assetcreate` event with the recreated element.

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

type EntityReparentCommand = [
  "entityreparent",
  {
    entity: Entity;
    parentEl: string;
    indexInParent?: number;
  },
];

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

type AssetCreatePayload = {
  tagName: string;
  id?: string;
  attributes?: Record<string, string>;
};
type AssetCreateCommand =
  | ["assetcreate", AssetCreatePayload]
  | ["assetcreate", AssetCreatePayload, (el: Element) => void];

type AssetUpdateCommand = [
  "assetupdate",
  {
    assetEl: Element | string;
    attribute: string;
    value: string | null;
  },
];

type AssetRemoveCommand = [
  "assetremove",
  {
    assetEl: Element | string;
  },
];

type CommandsForMulti = (
  | AssetCreateCommand
  | AssetRemoveCommand
  | AssetUpdateCommand
  | ComponentAddCommand
  | ComponentRemoveCommand
  | EntityCreateCommand
  | EntityRemoveCommand
  | EntityReparentCommand
  | EntityUpdateCommand
)[];
```
