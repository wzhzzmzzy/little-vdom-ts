type VNodeState = Record<string, any>;
type ElementName = string & { __nonEmpty: true };
type ElementProps = {
  [key: string]: any;
  key?: string;
  ref?: {
    current: DOMElement;
  };
};
type VNodeProps = ElementProps & {
  children: VNodeLike[];
};
type FC = (
  props: VNodeProps,
  state?: VNodeState,
  updateFn?: (nextState: VNodeState) => ReturnType<typeof diff>
) => VNodeLike | VNodeLike[];

type ElementVNode = {
  _type: ElementName;
  _props: ElementProps;
  _children: VNode[];
  _state?: VNodeState;
  _patched?: never;
  _normalizedChildren?: VNode[];
  dom?: DOMElement;
  key?: string;
};

type FCVNode = {
  _type: FC;
  _props: ElementProps;
  _children: VNode[];
  _state?: VNodeState;
  _patched?: ReturnType<typeof diff>;
  _normalizedChildren?: VNode[];
  dom?: DOMElement;
  key?: string;
};

type TextVNode = {
  _type: "";
  _props?: string;
  _state?: never;
  _patched?: never;
  _normalizedChildren?: VNode[];
  dom?: DOMElement;
};

type VNode = ElementVNode | FCVNode | TextVNode;
type VNodeLike = VNode | unknown;

type DOMElement = (HTMLElement | Text) & {
  _vnode?: VNode;
};

const nilVNode = () => ({ _type: "" } as TextVNode);
function h(
  _type: ElementName,
  _props?: ElementProps,
  ...children: VNodeLike[]
): ElementVNode;
function h(_type: FC, _props?: ElementProps, ...children: VNodeLike[]): FCVNode;
function h(_type: "", _props?: string, ...children: VNodeLike[]): TextVNode;
function h(
  _type: ElementName | FC | "",
  _props?: ElementProps | string,
  ...children: VNodeLike[]
) {
  if (_type === "") {
    return {
      _type,
      _props: _props as unknown as string,
      _children: [],
      key: (_props as ElementProps).key,
    } as TextVNode;
  }

  if (typeof _type === "string") {
    return {
      _type,
      _props: _props,
      _children: children.filter((child) => !!child),
      key: (_props as ElementProps)?.key,
    } as ElementVNode;
  }

  return {
    _type,
    _props: _props,
    _children: children.filter((child) => child !== false && child !== null),
    key: (_props as ElementProps)?.key,
  } as FCVNode;
}

const Fragment: FC = (props) => {
  return props.children;
};

const render = (
  newVNode: VNodeLike,
  dom: DOMElement,
  oldVNode: VNode | undefined = dom._vnode
) => {
  if (!oldVNode) oldVNode = dom._vnode = nilVNode();
  return diff(h(Fragment, {}, newVNode), dom, oldVNode);
};

const diff = (
  newVNodeLike: VNodeLike | VNodeLike[],
  dom: DOMElement,
  oldVNode: VNode,
  currentChildIndex: number = -1
): VNode => {
  // VNode[]
  if (Array.isArray(newVNodeLike)) {
    return diffChildren(dom, newVNodeLike, oldVNode);
  }

  const newVNode: VNode =
    (newVNodeLike as VNode)._type !== undefined
      ? (newVNodeLike as VNode)
      : h("", "" + newVNodeLike);

  // FCVNode
  if (typeof newVNode._type === "function") {
    newVNode._state = oldVNode._state || {};

    // FC render props
    const props = { children: newVNode._children, ...newVNode._props };

    // FC render result
    const renderResult = newVNode._type(
      props,
      newVNode._state,
      // Updater function that is passed as 3rd argument to components
      (nextState) => {
        // Update state with new value
        Object.assign(newVNode._state as VNodeState, nextState);
        return diff(newVNode, dom, newVNode);
      }
    );

    // Memoized renderResult in _patched
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
    oldVNode?.dom ||
    (newVNode._type
      ? document.createElement(newVNode._type)
      : new Text(newVNode._props as string));

  // Rerender DOM only if props changed
  if (newVNode._props != oldVNode?._props) {
    // Standard ElementVNode
    if (newVNode._type) {
      const { key, ref, ...newProps } = (newVNode as ElementVNode)._props;

      if (ref) ref.current = newDom;

      // Merge props to DOM
      for (let name in newProps) {
        const value = newProps[name];
        // value cannot be string
        if (name === "style" && !value.trim) {
          for (const styleProp in value) {
            (newDom as HTMLElement).style[styleProp as any] = value[styleProp];
          }
        } else if (value != (oldVNode?._props as ElementProps)?.[name]) {
          if (name in newDom || (name = name.toLowerCase()) in newDom) {
            (newDom as any)[name] = value;
          } else if (value != null) {
            (newDom as HTMLElement).setAttribute(name, value);
          } else {
            (newDom as HTMLElement).removeAttribute(name);
          }
        }
      }
    }
    // Update Text element
    else {
      (newDom as Text).data = newVNode._props as string;
    }
  }

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

  return (dom._vnode = Object.assign(oldVNode, newVNode));
};

const diffChildren = (
  parentDom: DOMElement,
  newChildren: VNodeLike[],
  oldVNode: VNode
): VNode => {
  const oldChildren: (VNode | null)[] = oldVNode._normalizedChildren || [];

  oldVNode._normalizedChildren = newChildren.concat
    .apply([], newChildren)
    .map((child: VNodeLike, index: number) => {
      // If the vnode has no children we assume that we have a string and
      // convert it into a text vnode.
      let nextNewChild: VNode;
      if ((child as VNode)._type === undefined) {
        nextNewChild = h("", "" + child);
      } else {
        nextNewChild = child as VNode;
      }

      // If we have previous children we search for one that matches our
      // current vnode.
      const nextOldChild =
        oldChildren.find((oldChild, childIndex) => {
          // Check if oldChild exists and matches the new child
          const isMatchingChild =
            oldChild &&
            oldChild._type === nextNewChild._type &&
            (oldChild as any).key === (nextNewChild as any).key;

          if (isMatchingChild) {
            // If child index matches old child index
            if (childIndex === index) {
              index = -1;
            }
            oldChildren[childIndex] = null;
            return oldChild;
          }

          return isMatchingChild;
        }) || nilVNode();

      // Continue diffing recursively against the next child.
      return diff(nextNewChild, parentDom, nextOldChild, index);
    });

  // remove old children if there are any
  oldChildren.filter((i) => !!i).map(removePatchedChildren);

  return oldVNode;
};

function removePatchedChildren(child: VNode) {
  const { _children = [], _patched = [] } = child as FCVNode;
  // remove children
  _children.concat(_patched).map((c) => c && removePatchedChildren(c));
  // remove dom
  child.dom && child.dom.remove();
}

export { h, Fragment, render, diff };
