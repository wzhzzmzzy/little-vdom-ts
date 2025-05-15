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
  updateFn?: (nextState: VNodeState) => ReturnType<typeof mount>
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
  _patched?: VNodeLike;
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
      _children: children.filter((child) => child !== null && child !== ""),
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

const render = (newVNode: VNodeLike, dom: DOMElement) => {
  if (dom._vnode) {
    dom.childNodes.forEach((n) => n.remove());
    dom._vnode = undefined;
  }
  return mount(h(Fragment, {}, newVNode), dom);
};

const mount = (
  newVNodeLike: VNodeLike | VNodeLike[],
  dom: DOMElement,
  currentChildIndex = -1
) => {
  // VNode[]
  if (Array.isArray(newVNodeLike)) {
    return mountChildren(dom, newVNodeLike);
  }

  const newVNode: VNode =
    (newVNodeLike as VNode)._type !== undefined
      ? (newVNodeLike as VNode)
      : h("", "" + newVNodeLike);

  // FCVNode
  if (typeof newVNode._type === "function") {
    newVNode._state = {};

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
        return render(newVNode, dom);
      }
    );

    // Memoized renderResult in _patched
    newVNode._patched = mount(renderResult, dom);

    return (dom._vnode = newVNode);
  }

  // ElementVNode or TextVNode
  // Create DOM instance
  const newDom = newVNode._type
    ? document.createElement(newVNode._type)
    : new Text(newVNode._props as string);

  // Standard ElementVNode
  if (newVNode._type && newVNode._props) {
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
      } else {
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

  mountChildren(newDom, (newVNode as ElementVNode)._children);

  // Insert at position
  // 1. oldVNode doesn't have dom means initial render
  // 2. rendered but currentChildIndex === -1 means just remove
  dom.insertBefore(
    (newVNode.dom = newDom),
    dom.childNodes[(currentChildIndex as number) + 1] || null
  );

  return (dom._vnode = newVNode);
};

const mountChildren = (
  parentDom: DOMElement,
  newChildren: VNodeLike[]
): VNode => {
  newChildren.concat
    .apply([], newChildren)
    .forEach((child: VNodeLike, index: number) => {
      // If the vnode has no children we assume that we have a string and
      // convert it into a text vnode.
      let nextNewChild: VNode;
      if ((child as VNode)._type === undefined) {
        nextNewChild = h("", "" + child);
      } else {
        nextNewChild = child as VNode;
      }

      // Continue diffing recursively against the next child.
      mount(nextNewChild, parentDom, index);
    });

  return nilVNode();
};

export { h, Fragment, render, mount };
