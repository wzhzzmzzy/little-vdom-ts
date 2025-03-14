type VNodeState = Record<string, any>;
type ElementName = string & {
    __nonEmpty: true;
};
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
type FC = (props: VNodeProps, state?: VNodeState, updateFn?: (nextState: VNodeState) => ReturnType<typeof diff>) => VNodeLike | VNodeLike[];
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
declare function h(_type: ElementName, _props?: ElementProps, ...children: VNodeLike[]): ElementVNode;
declare function h(_type: FC, _props?: ElementProps, ...children: VNodeLike[]): FCVNode;
declare function h(_type: "", _props?: string, ...children: VNodeLike[]): TextVNode;
declare const Fragment: FC;
declare const render: (newVNode: VNodeLike, dom: DOMElement, oldVNode?: VNode | undefined) => VNode;
declare const diff: (newVNodeLike: VNodeLike | VNodeLike[], dom: DOMElement, oldVNode: VNode, currentChildIndex?: number) => VNode;
export { h, Fragment, render, diff };
