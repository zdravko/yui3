YUI.add("editor-bidi",function(A){var B=function(){B.superclass.constructor.apply(this,arguments);},I="host",H="dir",F="BODY",D="nodeChange",E="bidiContextChange",C=F+" > p",G="style";A.extend(B,A.Base,{lastDirection:null,firstEvent:null,_checkForChange:function(){var K=this.get(I),M=K.getInstance(),L=new M.Selection(),J,N;if(L.isCollapsed){J=B.blockParent(L.focusNode);if(J){N=J.getStyle("direction");if(N!==this.lastDirection){K.fire(E,{changedTo:N});this.lastDirection=N;}}}else{K.fire(E,{changedTo:"select"});this.lastDirection=null;}},_afterNodeChange:function(J){if(this.firstEvent||B.EVENTS[J.changedType]){this._checkForChange();this.firstEvent=false;}},_afterMouseUp:function(J){this._checkForChange();this.firstEvent=false;},initializer:function(){var J=this.get(I);this.firstEvent=true;J.after(D,A.bind(this._afterNodeChange,this));J.after("dom:mouseup",A.bind(this._afterMouseUp,this));}},{EVENTS:{"backspace-up":true,"pageup-up":true,"pagedown-down":true,"end-up":true,"home-up":true,"left-up":true,"up-up":true,"right-up":true,"down-up":true,"delete-up":true},BLOCKS:A.Selection.BLOCKS,DIV_WRAPPER:"<DIV></DIV>",blockParent:function(L,K){var J=L,N,M;if(!J){J=A.one(F);}if(!J.test(B.BLOCKS)){J=J.ancestor(B.BLOCKS);}if(K&&J.test(F)){N=A.Node.create(B.DIV_WRAPPER);J.get("children").each(function(P,O){if(O===0){M=P;}else{N.append(P);}});M.replace(N);N.prepend(M);J=N;}return J;},_NODE_SELECTED:"bidiSelected",addParents:function(M){var J,L,K;for(J=0;J<M.length;J+=1){M[J].setData(B._NODE_SELECTED,true);}for(J=0;J<M.length;J+=1){L=M[J].get("parentNode");if(!L.test(F)&&!L.getData(B._NODE_SELECTED)){K=true;L.get("children").some(function(N){if(!N.getData(B._NODE_SELECTED)){K=false;return true;}});if(K){M.push(L);L.setData(B._NODE_SELECTED,true);}}}for(J=0;J<M.length;J+=1){M[J].clearData(B._NODE_SELECTED);}return M;},NAME:"editorBidi",NS:"editorBidi",ATTRS:{host:{value:false}},RE_TEXT_ALIGN:/text-align:\s*\w*\s*;/,removeTextAlign:function(J){if(J){if(J.getAttribute(G).match(B.RE_TEXT_ALIGN)){J.setAttribute(G,J.getAttribute(G).replace(B.RE_TEXT_ALIGN,""));}if(J.hasAttribute("align")){J.removeAttribute("align");}}return J;}});A.namespace("Plugin");A.Plugin.EditorBidi=B;A.Plugin.ExecCommand.COMMANDS.bidi=function(M,S){var P=this.getInstance(),K=new P.Selection(),R=this.get(I).get(I).editorBidi,J,N,O,T,L;if(!R){A.error("bidi execCommand is not available without the EditorBiDi plugin.");return;}P.Selection.filterBlocks();if(K.anchorNode.test(F)){return;}if(K.isCollapsed){N=B.blockParent(K.anchorNode);N=B.removeTextAlign(N);if(!S){L=N.getAttribute(H);if(!L||L=="ltr"){S="rtl";}else{S="ltr";}}N.setAttribute(H,S);if(A.UA.ie){var Q=N.all("br.yui-cursor");if(Q.size()===1&&N.get("childNodes").size()==1){Q.remove();}}J=N;}else{O=K.getSelected();T=[];O.each(function(U){T.push(B.blockParent(U));});T=P.all(B.addParents(T));T.each(function(V){var U=S;V=B.removeTextAlign(V);if(!U){L=V.getAttribute(H);if(!L||L=="ltr"){U="rtl";}else{U="ltr";}}V.setAttribute(H,U);});J=T;}R._checkForChange();return J;};},"@VERSION@",{requires:["editor-base"],skinnable:false});