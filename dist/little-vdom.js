// little-vdom.ts
var nilVNode = () => ({ _type: "" });
function h(_type, _props, ...children) {
  if (_type === "") {
    return {
      _type,
      _props,
      _children: [],
      key: _props.key
    };
  }
  if (typeof _type === "string") {
    return {
      _type,
      _props,
      _children: children.filter((child) => child !== null && child !== ""),
      key: _props?.key
    };
  }
  return {
    _type,
    _props,
    _children: children.filter((child) => child !== false && child !== null),
    key: _props?.key
  };
}
var Fragment = (props) => {
  return props.children;
};
var render = (newVNode, dom, oldVNode = dom._vnode) => {
  if (!oldVNode) oldVNode = dom._vnode = nilVNode();
  return diff(h(Fragment, {}, newVNode), dom, oldVNode);
};
var diff = (newVNodeLike, dom, oldVNode, currentChildIndex = -1) => {
  if (Array.isArray(newVNodeLike)) {
    return diffChildren(dom, newVNodeLike, oldVNode);
  }
  const newVNode = newVNodeLike._type !== void 0 ? newVNodeLike : h("", "" + newVNodeLike);
  if (typeof newVNode._type === "function") {
    newVNode._state = oldVNode._state || {};
    const props = { children: newVNode._children, ...newVNode._props };
    const renderResult = newVNode._type(
      props,
      newVNode._state,
      // Updater function that is passed as 3rd argument to components
      (nextState) => {
        Object.assign(newVNode._state, nextState);
        return diff(newVNode, dom, newVNode);
      }
    );
    newVNode._patched = diff(
      renderResult,
      dom,
      oldVNode?._patched || nilVNode(),
      currentChildIndex
    );
    return dom._vnode = newVNode;
  }
  const newDom = oldVNode?.dom || (newVNode._type ? document.createElement(newVNode._type) : new Text(newVNode._props));
  if (newVNode._props != oldVNode?._props) {
    if (newVNode._type) {
      const { key, ref, ...newProps } = newVNode._props;
      if (ref) ref.current = newDom;
      for (let name in newProps) {
        const value = newProps[name];
        if (name === "style" && !value.trim) {
          for (const styleProp in value) {
            newDom.style[styleProp] = value[styleProp];
          }
        } else if (value != oldVNode?._props?.[name]) {
          if (name in newDom || (name = name.toLowerCase()) in newDom) {
            newDom[name] = value;
          } else if (value != null) {
            newDom.setAttribute(name, value);
          } else {
            newDom.removeAttribute(name);
          }
        }
      }
    } else {
      newDom.data = newVNode._props;
    }
  }
  diffChildren(newDom, newVNode._children, oldVNode);
  if (!oldVNode?.dom || currentChildIndex !== -1) {
    dom.insertBefore(
      newVNode.dom = newDom,
      dom.childNodes[currentChildIndex + 1] || null
    );
  }
  return dom._vnode = Object.assign(oldVNode, newVNode);
};
var diffChildren = (parentDom, newChildren, oldVNode) => {
  const oldChildren = oldVNode._normalizedChildren || [];
  oldVNode._normalizedChildren = newChildren.concat.apply([], newChildren).map((child, index) => {
    let nextNewChild;
    if (child._type === void 0) {
      nextNewChild = h("", "" + child);
    } else {
      nextNewChild = child;
    }
    const nextOldChild = oldChildren.find((oldChild, childIndex) => {
      const isMatchingChild = oldChild && oldChild._type === nextNewChild._type && oldChild.key === nextNewChild.key;
      if (isMatchingChild) {
        if (childIndex === index) {
          index = -1;
        }
        oldChildren[childIndex] = null;
        return oldChild;
      }
      return isMatchingChild;
    }) || nilVNode();
    return diff(nextNewChild, parentDom, nextOldChild, index);
  });
  oldChildren.filter((i) => !!i).map(removePatchedChildren);
  return oldVNode;
};
function removePatchedChildren(child) {
  const { _children = [], _patched = [] } = child;
  _children.concat(_patched).map((c) => c && removePatchedChildren(c));
  child.dom && child.dom.remove();
}
export {
  Fragment,
  diff,
  h,
  render
};
