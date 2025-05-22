# 🍼 little-vdom-ts

Added TypeScript Declaration, more read-friendly

[👷 Explaination in Chinese](./EXPLAINATION-CN.md)

> Forked from luwes's [little-vdom](https://github.com/luwes/little-vdom)

---

- ~~650B~~ 824B(gzip) Virtual DOM
- Components
- State
- Diffing
- Keys
- Fragments
- Refs
- Style maps

Use reactive JSX with minimal overhead.

## Usage

[CodePen](https://codepen.io/wzhzzmzzy/pen/ByyMELJ)

```jsx
import { render, update, h, Fragment } from "./dist/little-vdom";

/** @jsx h */

// Components get passed (props, state, setState)
function Counter(props, { count = 0 }, update) {
  const increment = () => update({ count: ++count });
  return <button onclick={increment}>{count}</button>;
}

function Since({ time }, state, update) {
  setTimeout(update, 1000); // update every second
  const ago = ((Date.now() - time) / 1000) | 0;
  return <time>{ago}s ago</time>;
}

render(
  <div id="app">
    <h1>Hello</h1>
    <Since time={Date.now()} />
    <Counter />
  </div>,
  document.body
);
```
