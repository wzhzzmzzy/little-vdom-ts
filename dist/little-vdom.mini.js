var _=()=>({_type:""});function y(r,t,...n){return r===""?{_type:r,_props:t,_children:[],key:t.key}:typeof r=="string"?{_type:r,_props:t,_children:n.filter(o=>!!o),key:t?.key}:{_type:r,_props:t,_children:n.filter(o=>o!==!1&&o!==null),key:t?.key}}var V=r=>r.children,u=(r,t,n=t._vnode)=>(n||(n=t._vnode=_()),m(y(V,{},r),t,n)),m=(r,t,n,o=-1)=>{if(Array.isArray(r))return f(t,r,n);let e=r._type!==void 0?r:y("",""+r);if(typeof e._type=="function"){e._state=n._state||{};let d={children:e._children,...e._props},l=e._type(d,e._state,a=>(Object.assign(e._state,a),m(e,t,e)));return e._patched=m(l,t,n?._patched||_(),o),t._vnode=e}let s=n?.dom||(e._type?document.createElement(e._type):new Text(e._props));if(e._props!=n?._props)if(e._type){let{key:d,ref:l,...a}=e._props;l&&(l.current=s);for(let i in a){let p=a[i];if(i==="style"&&!p.trim)for(let N in p)s.style[N]=p[N];else p!=n?._props?.[i]&&(i in s||(i=i.toLowerCase())in s?s[i]=p:p!=null?s.setAttribute(i,p):s.removeAttribute(i))}}else s.data=e._props;return f(s,e._children,n),(!n?.dom||o!==-1)&&t.insertBefore(e.dom=s,t.childNodes[o+1]||null),t._vnode=Object.assign(n,e)},f=(r,t,n)=>{let o=n._normalizedChildren||[];return n._normalizedChildren=t.concat.apply([],t).map((e,s)=>{let d;e._type===void 0?d=y("",""+e):d=e;let l=o.find((a,i)=>{let p=a&&a._type===d._type&&a.key===d.key;return p&&(i===s&&(s=-1),o[i]=null,a)})||_();return m(d,r,l,s)}),o.filter(e=>!!e).map(c),n};function c(r){let{_children:t=[],_patched:n=[]}=r;t.concat(n).map(o=>o&&c(o)),r.dom&&r.dom.remove()}export{V as Fragment,m as diff,y as h,u as render};
