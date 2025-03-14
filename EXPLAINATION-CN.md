> https://github.com/wzhzzmzzy/little-vdom-ts
> 
> Forked from: https://github.com/luwes/little-vdom

## JSX

一般来说，我们在现代前端开发流程当中开发网页时，写 HTML 的方法主要有三种：
首先，第一种方法自然是直接写 HTML，这种方法中也包含一些扩展了 HTML 的库或者框架，包括 HTMX、AlpineJS 等，特点是可以直接在 `.html` 文件中使用，对工具链没有要求或者要求很低，顶多是一次性文本转义。

类似的，第二种方式是编写模版语言或者基于框架的 HTML 方言，Vue、Svelte、Astro 都属于此类，特点是语法近似于 HTML，通过自定义指令或者属性对 HTML 做操作；他们一般会对工具链有更多的要求，例如编写成特定后缀名的文件，构建过程中与 JS 深度绑定，甚至会直接将 HTML 模板转成 JS 生成产物。

至于最后一种方式，也是最流行的，就是 JSX/TSX 了。JSX 的独特之处在于他本就是 JS 文件，我们可以将 HTML 元素当作 JS Object 来使用，随意地在代码当中引用和传递。在构建过程方面，JSX 则介于上面两者之间。对于我们来说，使用 JSX 时，需要告诉打包器关于 JSX 的一些约定，决定了打包器将如何处理 JSX，主要有以下几个配置项：

```typescript
interface Config {
	"jsx": "react" | "preserve" | "react-jsx" | "react-jsxdev" | "react-native",
	"jsxFactory": "React.createElement",
	"jsxFragment": "React.Fragment",
	"jsxImportSource": "react",
}
```

打包器帮我们完成了 JSX 到 JS 转义的语法部分工作，所以我们只要有一个能将 JS 正常渲染为 DOM 的库，就可以使用 JSX 写 HTML 了！

## Little VDOM

Little VDOM 是一个 JSX 渲染器玩具，一共只有 160 行代码（TS 版本 260 行），提供了 `h`、`Fragment`、`render` 这三个核心函数，使常规的打包器（babel、esbuild、tsc）能够将 JSX 代码转义成 JS 函数调用，进而渲染成 DOM 元素。这个 Lib 通过 Cherry-Pick 部分 Preact 的单元测试（`render`、`keys`、`fragment`、`refs`、`createRoot`）来验证它的功能。

`@luwes/little-vdom` 提供的使用方法是这样的：

```jsx
/** @jsx h */

// Components get passed (props, state, setState)
function Counter(props, { count = 0 }, update) {
  const increment = () => update({ count: ++count });
  return <button onclick={increment}>{count}</button>
}

function Since({ time }, state, update) {
  setTimeout(update, 1000); // update every second
  const ago = (Date.now() - time) / 1000 | 0;
  return <time>{ago}s ago</time>
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

### TypeScript Version

> 我花了一些时间，对 `@luwes/little-vdom` 这个版本进行了一些改写，同时给源码部分添加了 TypeScript 类型定义，改掉了一些难以理解或是不太合理的写法。

### JSX 转义

先看看 JSX 转义部分：

```jsx
// JSX Component
const App = ({ name }) => <><div class="app">Hello, {name}</div></>
// equivalent to
const App = ({ name }) => h(Fragment, {}, [
	h('div', { ["class"]: "app" }, [`Hello, ${name}`])
])

const root = document.getElementById('root')
// JSX render
const main = render(<App name="My Love" />, root)
// equivalent to
const main = render(h(App， { name: "My Love" }), root)
```

这个转义部分决定了渲染库实现 `h` 和 `Fragment` 时的函数定义，其中 `Fragment` 本质就是个空节点，用于渲染多个同一级的兄弟节点。可以看到，每一个 JSX 组件函数的返回值都是一次 `h` 调用，渲染时被送入 `render` 函数，被渲染成 `root` 节点的子节点。

### 渲染入口

下面是我微调过的 `little-vdom.js` 部分源码，是 `h` \ `Fragment` \ `render` 的实现，同时给所有属性添加了注释。

```ts
const h = (type, props, ...children): VNode => {
  return {
    // VNode 类型，有函数组件、标准 DOM 和纯文本三种
    _type: type,
    // 外部传入的属性，也就是 jsx 标签上的属性
    _props: props,
    // 子节点
    _children: children.filter((_) => _ !== false && _ !== null),
    // VNode 的唯一标识
    key: props && props.key,
  };
};

const Fragment: FunctionalComponent = (props) => {
  return props.children;
};

const render = (newVNode, dom, oldVNode = dom._vnode) => {
  // _vnode 是 dom 对象上对应 vnode 的引用，初始化时设置为空 VNode，diff 时会更新 VNode
  if (!oldVNode) oldVNode = dom._vnode = nilVNode();
  return diff(h(Fragment, {}, newVNode), dom, oldVNode);
};
```

`h` 函数的每次调用会返回一个 `VNode`，`Fragment` 是一个函数组件，`render` 则会调用另一个名叫 `diff` 的函数，同时在外面包裹一层 `Fragment`，整体逻辑还是非常简单的。有一些特别的是这个 `dom._vnode`，这里为了简单起见，没有自行维护一份和 DOM 对应的 VDOM 树在内存当中，而是直接在现成的 DOM 节点上添加了一份引用，用于缓存对应的 VNode。

### DIFF

如果对 VDOM 有所耳闻的话，肯定会了解到虚拟 DOM 的核心逻辑之一就是在渲染阶段进行 DIFF 。所谓 DIFF，就是用新生成的虚拟 DOM 节点和原先的虚拟 DOM 节点进行比较，根据比较结果修改真实 DOM 树（插入、删除）。

 `little-vdom` 的核心逻辑就是一个递归的 DIFF 函数，核心思路是将 VNode 分三类处理：数组、函数组件和标准 DOM 元素。函数组件需要先执行渲染函数，然后对新旧两份渲染函数结果再次进行 DIFF；标准 DOM 元素需要先创建对应元素、更新 Props，然后对子元素进行 DIFF，二次绘制的情况还需要判断是否需要插入到原位；对于数组，直接对子元素进行 DIFF 即可。简化过后的逻辑如下：

```js
const diff = (
  newVNode: VNode | VNode[],
  dom: DOMElement,
  oldVNode: VNode,
  currentChildIndex: number = -1
): VNode => {
  // VNode[]
  if (Array.isArray(newVNode)) {
    return diffChildren(dom, newVNode, oldVNode);
  }

  // FCVNode
  if (typeof newVNode._type === "function") {
    // FC render result
    const renderResult = newVNode._type(
		/* ... */
    );

    // Memoized renderResult in _patched
    // diff renderResult with oldVNode
    newVNode._patched = diff(
      renderResult,
      dom,
      oldVNode?._patched || nilVNode(),
      currentChildIndex
    );

    return (dom._vnode = newVNode);
  }

  // ElementVNode or TextVNode
  // Create DOM instance
  const newDom =
    newVNode._type
      ? document.createElement(newVNode._type)
      : new Text(newVNode._props as string);

  // Rerender DOM only if props changed
  if (newVNode._props != oldVNode?._props) {
    // Standard ElementVNode
    if (newVNode._type) {
      const { key, ref, ...newProps } = (newVNode as ElementVNode)._props;

      if (ref) ref.current = newDom;

      // Merge props to DOM
      for (let name in newProps) {
        // Simplified logic
	    (newDom as HTMLElement).setAttribute(name, value);
      }
    }
    // Update Text element
    else {
      (newDom as Text).data = newVNode._props as string;
    }
  }

  // diff child nodes
  diffChildren(newDom, (newVNode as ElementVNode)._children, oldVNode);

  // Insert at position
  // 1. oldVNode doesn't have dom means initial render
  // 2. rendered but currentChildIndex === -1 means just remove
  if (!oldVNode?.dom || currentChildIndex !== -1) {
    dom.insertBefore(
      (newVNode.dom = newDom),
      dom.childNodes[(currentChildIndex as number) + 1] || null
    );
  }

  // Update dom._vnode
  return (dom._vnode = Object.assign(oldVNode, newVNode));
};
```