YUI.add('dom', function(Y) {

var NODE_TYPE = 'node',
    OWNER_DOCUMENT = 'ownerDocument',
    DOCUMENT_ELEMENT = 'documentElement',
    DEFAULT_VIEW = 'defaultView',
    PARENT_WINDOW = 'parentWindow',
    TAG_NAME = 'tagName',
    PARENT_NODE = 'parentNode',
    FIRST_CHILD = 'firstChild',
    LAST_CHILD = 'lastChild',
    PREVIOUS_SIBLING = 'previousSibling',
    NEXT_SIBLING = 'nextSibling',
    OFFSET_HEIGHT = 'offsetHeight',
    OFFSET_WIDTH = 'offsetWidth',
    CONTAINS = 'contains',
    COMPARE_DOCUMENT_POSITION = 'compareDocumentPosition',
    INNER_TEXT = 'innerText',
    TEXT_CONTENT = 'textContent',
    CLIENT_HEIGHT = 'clientHeight',
    CLIENT_WIDTH = 'clientWidth',
    LENGTH = 'length',
    STRING = 'string',

    UNDEFINED = undefined;

var re_tag = /<([a-z]+)/i;

var templateCache = {};

Y.DOM = {
    /**
     * Returns the HTMLElement with the given ID (Wrapper for document.getElementById).
     * @method byId         
     * @param {String} id the id attribute 
     * @param {Object} doc optional The document to search. Defaults to current document 
     * @return {HTMLElement | null} The HTMLElement with the id, or null if none found. 
     */
    byId: function(id, doc) {
        return Y.DOM._getDoc(doc).getElementById(id); // @tested
    },

    /**
     * Returns the text content of the HTMLElement. 
     * @method getText         
     * @param {HTMLElement} element The html element. 
     * @return {String} The text content of the element (includes text of any descending elements).
     */
    getText: function(element) {
        var text = element ? element[TEXT_CONTENT] : '';
        if (text === UNDEFINED && INNER_TEXT in element) {
            text = element[INNER_TEXT];
        } 
        return text || ''; // @tested
    },

    /**
     * Finds the firstChild of the given HTMLElement. 
     * @method firstChild
     * @param {HTMLElement} element The html element. 
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, the first found is returned.
     * @return {HTMLElement | null} The first matching child html element.
     */
    firstChild: function(element, fn) {
        return Y.DOM._childBy(element, null, fn); // @tested
    },

    firstChildByTag: function(element, tag, fn) {
        return Y.DOM._childBy(element, tag, fn); // @tested
    },

    /**
     * Finds the lastChild of the given HTMLElement.
     * @method lastChild
     * @param {HTMLElement} element The html element.
     * @param {String} tag The tag to search for.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, the first found is returned.
     * @return {HTMLElement | null} The first matching child html element.
     */
    lastChild: function(element, fn) {
        return Y.DOM._childBy(element, null, fn, true); // @tested
    },

    lastChildByTag: function(element, tag, fn) {
        return Y.DOM._childBy(element, tag, fn, true); // @tested
    },

    /**
     * Finds all HTMLElement childNodes matching the given tag.
     * @method childrenByTag
     * @param {HTMLElement} element The html element.
     * @param {String} tag The tag to search for.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, all children with the given tag are collected.
     * @return {Array} The collection of child elements.
     */
    childrenByTag: function() {
        if (document[DOCUMENT_ELEMENT].children) {
            return function(element, tag, fn, toArray) { // TODO: keep toArray option?
                tag = (tag && tag !== '*') ? tag : null;
                var elements = [];
                if (element) {
                    elements = (tag) ? element.children.tags(tag) : element.children; 

                    if (fn || toArray) {
                        elements = Y.DOM.filterElementsBy(elements, fn);
                    }
                }

                return elements; // @tested
            };
        } else {
            return function(element, tag, fn) {
                tag = (tag && tag !== '*') ? tag.toUpperCase() : null;
                var elements = [],
                    wrapFn = fn;

                if (element) {
                    elements = element.childNodes; 
                    if (tag) { // wrap fn and add tag test TODO: allow tag in filterElementsBy?
                        wrapFn = function(el) {
                            return el[TAG_NAME].toUpperCase() === tag && (!fn || fn(el));
                        };
                    }

                    elements = Y.DOM.filterElementsBy(elements, wrapFn); // @tested
                }
                return elements;
            };
        }
    }(),

    /**
     * Finds all HTMLElement childNodes.
     * @method children
     * @param {HTMLElement} element The html element.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, all children are collected.
     * @return {Array} The collection of child elements.
     */
    children: function(element, fn) {
        return Y.DOM.childrenByTag(element, null, fn); // @tested
    },

    previous: function(element, fn) {
        return Y.DOM.elementByAxis(element, PREVIOUS_SIBLING, fn);
    },

    next: function(element, fn) {
        return Y.DOM.elementByAxis(element, NEXT_SIBLING, fn);
    },

    ancestor: function(element, fn) {
        return Y.DOM.elementByAxis(element, PARENT_NODE, fn);
    },

    /**
     * @method insertBefore 
     * @param {String | HTMLElement} newNode The node to be inserted 
     * @param {String | HTMLElement} referenceNode The node to insert the new node before  
     * @return {HTMLElement} The node that was inserted (or null if insert fails)  
     */ 
    insertBefore: function(newNode, referenceNode, parentNode) { 
        parentNode = parentNode || referenceNode[PARENT_NODE];
        if (!referenceNode) {
            if (parentNode[FIRST_CHILD]) {
                parentNode.insertBefore(newNode, parentNode.firstChild);
            } else {
                parentNode.appendChild(newNode);
            }
        } else {
            return parentNode.insertBefore(newNode, referenceNode);  
        }
    }, 

    /** 
     * Inserts the new node as the next sibling of the reference node  
     * @method insertAfter 
     * @param {String | HTMLElement} newNode The node to be inserted 
     * @param {String | HTMLElement} referenceNode The node to insert the new node after  
     * @return {HTMLElement} The node that was inserted (or null if insert fails)  
     */ 
    insertAfter: function(newNode, referenceNode, parentNode) { 
        parentNode = parentNode || referenceNode[PARENT_NODE];
        if (referenceNode[NEXT_SIBLING]) { 
            return parentNode.insertBefore(newNode, referenceNode[NEXT_SIBLING]);  
        } else { 
            return parentNode.appendChild(newNode); 
        } 
    },

    /**
     * Searches the element by the given axis for matching elements.
     * @method elementsByAxis
     * @param {HTMLElement} element The html element.
     * @param {String} axis The axis to search (parentNode, nextSibling, previousSibling).
     * @param {String} tag optional An optional tag to restrict the search to. 
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, all elements along the axis are collected.
     * @return {Array} The collection of elements.
     */
    elementsByAxis: function(element, axis, fn) {
        var ret = [];

        while (element && (element = element[axis])) { // NOTE: assignment
            if ( element[TAG_NAME] && (!fn || fn(element)) ) {
                ret[ret[LENGTH]] = element;
            }
        }
        return ret;
    },

    /**
     * Searches the element by the given axis for the first matching element.
     * @method elementByAxis
     * @param {HTMLElement} element The html element.
     * @param {String} axis The axis to search (parentNode, nextSibling, previousSibling).
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, the first element is returned.
     * @return {HTMLElement | null} The matching element or null if none found.
     */
    elementByAxis: function(element, axis, fn) {
        while (element && (element = element[axis])) { // NOTE: assignment
                if ( element[TAG_NAME] && (!fn || fn(element)) ) { // TODO: all nodeTypes option?
                    return element;
                }
        }
        return null;
    },

    /**
     * Finds all elements with the given tag.
     * @method byTag
     * @param {String} tag The tag being search for. 
     * @param {HTMLElement} root optional An optional root element to start from.
     * @param {Function} fn optional An optional boolean test to apply.
     * The optional function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, all elements with the given tag are returned.
     * @return {Array} The collection of matching elements.
     */
    byTag: function(tag, root, fn) {
        root = root || Y.config.doc;

        var elements = root.getElementsByTagName(tag),
            retNodes = [];

        for (var i = 0, len = elements[LENGTH]; i < len; ++i) {
            if ( !fn || fn(elements[i]) ) {
                retNodes[retNodes[LENGTH]] = elements[i];
            }
        }
        return retNodes;
    },

    /**
     * Filters a collection of HTMLElements by the given attributes.
     * @method filterElementsBy
     * @param {Array} elements The collection of HTMLElements to filter.
     * @param {Function} fn A boolean test to apply.
     * The function is passed the current HTMLElement being tested as its only argument.
     * If no function is given, all HTMLElements are kept.
     * @return {Array} The filtered collection of HTMLElements.
     */
    filterElementsBy: function(elements, fn, firstOnly) {
        var ret = (firstOnly) ? null : [];
        for (var i = 0, len = elements[LENGTH]; i < len; ++i) {
            if (elements[i][TAG_NAME] && (!fn || fn(elements[i]))) {
                if (firstOnly) {
                    ret = elements[i];
                    break;
                } else {
                    ret[ret[LENGTH]] = elements[i];
                }
            }
        }

        return ret;
    },

    /**
     * Determines whether or not one HTMLElement is or contains another HTMLElement.
     * @method contains
     * @param {HTMLElement} element The containing html element.
     * @param {HTMLElement} needle The html element that may be contained.
     * @return {Boolean} Whether or not the element is or contains the needle.
     */
    contains: function(element, needle) {
        var ret = false;

        if (!needle || !element) {
            ret = false;
        } else if (element[CONTAINS])  {
            if (Y.UA.opera || needle[NODE_TYPE] === 1) { // IE & SAF contains fail if needle not an ELEMENT_NODE
                ret = element[CONTAINS](needle);
            } else {
                ret = Y.DOM._bruteContains(element, needle); 
            }
        } else if (element[COMPARE_DOCUMENT_POSITION]) { // gecko
            if (element === needle || !!(element[COMPARE_DOCUMENT_POSITION](needle) & 16)) { 
                ret = true;
            }
        }

        return ret;
    },

    create: function(html, doc) {
        doc = doc || Y.config.doc;
        var m = re_tag.exec(html);
        var create = Y.DOM._create,
            custom = Y.DOM.creators,
            tag, ret;

        if (m && custom[m[1]]) {
            if (typeof custom[m[1]] === 'function') {
                create = custom[m[1]];
            } else {
                tag = custom[m[1]];
            }
        }
        ret = create(html, doc, tag);
        return (ret.childNodes.length > 1) ? ret.childNodes : ret.childNodes[0]; // collection or item
        //return ret.firstChild;
    },

    _create: function(html, doc, tag) {
        tag = tag || 'div';
        var frag = templateCache[tag] || doc.createElement(tag);
        frag.innerHTML = html;
        return frag;
    },

    /**
     * Brute force version of contains.
     * Used for browsers without contains support for non-HTMLElement Nodes (textNodes, etc).
     * @method _bruteContains
     * @private
     * @param {HTMLElement} element The containing html element.
     * @param {HTMLElement} needle The html element that may be contained.
     * @return {Boolean} Whether or not the element is or contains the needle.
     */
    _bruteContains: function(element, needle) {
        while (needle) {
            if (element === needle) {
                return true;
            }
            needle = needle.parentNode;
        }
        return false;
    },

    /**
     * Memoizes dynamic regular expressions to boost runtime performance. 
     * @method _getRegExp
     * @private
     * @param {String} str The string to convert to a regular expression.
     * @param {String} flags optional An optinal string of flags.
     * @return {RegExp} An instance of RegExp
     */
    _getRegExp: function(str, flags) {
        flags = flags || '';
        Y.DOM._regexCache = Y.DOM._regexCache || {};
        if (!Y.DOM._regexCache[str + flags]) {
            Y.DOM._regexCache[str + flags] = new RegExp(str, flags);
        }
        return Y.DOM._regexCache[str + flags];
    },

    /**
     * returns the appropriate document.
     * @method _getDoc
     * @private
     * @param {HTMLElement} element optional Target element.
     * @return {Object} The document for the given element or the default document. 
     */
    _getDoc: function(element) {
        element = element || {};
        return (element[NODE_TYPE] === 9) ? element : element[OWNER_DOCUMENT] ||
                                                Y.config.doc;
    },

    /**
     * returns the appropriate window.
     * @method _getWin
     * @private
     * @param {HTMLElement} element optional Target element.
     * @return {Object} The window for the given element or the default window. 
     */
    _getWin: function(element) {
        var doc = Y.DOM._getDoc(element);
        return (element.document) ? element : doc[DEFAULT_VIEW] ||
                                        doc[PARENT_WINDOW] || Y.config.win;
    },

    _childBy: function(element, tag, fn, rev) {
        var ret = null,
            root, axis;

        if (element) {
            if (rev) {
                root = element[LAST_CHILD];
                axis = PREVIOUS_SIBLING;
            } else {
                root = element[FIRST_CHILD];
                axis = NEXT_SIBLING;
            }

            if (Y.DOM._testElement(root, tag, fn)) { // is the matching element
                ret = root;
            } else { // need to scan nextSibling axis of firstChild to find matching element
                ret = Y.DOM.elementByAxis(root, axis, fn);
            }
        }
        return ret;

    },

    _testElement: function(element, tag, fn) {
        tag = (tag && tag !== '*') ? tag.toUpperCase() : null;
        return (element && element[TAG_NAME] &&
                (!tag || element[TAG_NAME].toUpperCase() === tag) &&
                (!fn || fn(element)));
    },

    creators: {},

    _IESimpleCreate: function(html, doc) {
        doc = doc || Y.config.doc;
        return doc.createElement(html);
    }
};


(function() {
    var creators = Y.DOM.creators,
        create = Y.DOM.create,
        re_tbody = /(?:\/(?:thead|tfoot|tbody|caption|col|colgroup)>)+\s*<tbody/;

    var TABLE_OPEN = '<table>',
        TABLE_CLOSE = '</table>';

    if (Y.UA.gecko || Y.UA.ie) { // require custom creation code for certain element types
        Y.mix(creators, {
            option: function(html, doc) {
                var frag = create('<select>' + html + '</select>');
                return frag;
            },

            tr: function(html, doc) {
                var frag = creators.tbody('<tbody>' + html + '</tbody>', doc);
                return frag.firstChild;
            },

            td: function(html, doc) {
                var frag = creators.tr('<tr>' + html + '</tr>', doc);
                return frag.firstChild;
            }, 

            tbody: function(html, doc) {
                var frag = create(TABLE_OPEN + html + TABLE_CLOSE, doc);
                return frag;
            },

            legend: 'fieldset'
        });

        creators.col = creators.tbody; // IE wraps in colgroup
    }

    if (Y.UA.ie) {
        // TODO: allow multiples ("<link><link>")
        creators.col = creators.script = creators.link = Y.DOM._IESimpleCreate; 

        // TODO: thead/tfoot with nested tbody
        creators.tbody = function(html, doc) {
            var frag = create(TABLE_OPEN + html + TABLE_CLOSE, doc);
            var tb = frag.children.tags('tbody')[0];
            if (frag.children.length > 1 && tb && !re_tbody.test(html)) {
                tb.parentNode.removeChild(tb);
            }
            return frag;
        };

    }

    if (Y.UA.gecko || Y.UA.ie) { // require custom creation code for certain element types
        Y.mix(creators, {
                th: creators.td,
                thead: creators.tbody,
                tfoot: creators.tbody,
                caption: creators.tbody,
                colgroup: creators.tbody,
                col: creators.tbody,
                optgroup: creators.option
        });
    }
})();
/**
 * Provides helper methods for collecting and filtering DOM elements.
 * @class Selector
 * @static
 */

var NODE_TYPE = 'nodeType',
    NODE_NAME = 'nodeName',
    TAG_NAME = 'tagName',
    TAG = 'tag',
    ATTRIBUTES = 'attributes',
    PSEUDOS = 'pseudos',
    COMBINATOR = 'combinator',
    PARENT_NODE = 'parentNode',
    FIRST_CHILD = 'firstChild',
    LAST_CHILD = 'lastChild',
    PREVIOUS_SIBLING = 'previousSibling',
    NEXT_SIBLING = 'nextSibling';

var reNth = /^(?:([-]?\d*)(n){1}|(odd|even)$)*([-+]?\d*)$/;

Y.Selector = {
    /**
     * Default document for use queries 
     * @property document
     * @type object
     * @default window.document
     */
    document: Y.config.doc,
    /**
     * Mapping of attributes to aliases, normally to work around HTMLAttributes
     * that conflict with JS reserved words.
     * @property attrAliases
     * @type object
     */
    attrAliases: {
    },

    /**
     * Mapping of shorthand tokens to corresponding attribute selector 
     * @property shorthand
     * @type object
     */
    shorthand: {
        //'(?:(?:[^\\)\\]\\s*>+~,]+)(?:-?[_a-z]+[-\\w]))+#(-?[_a-z]+[-\\w]*)': '[id=$1]',
        '\\#(-?[_a-z]+[-\\w]*)': '[id=$1]',
        '\\.(-?[_a-z]+[-\\w]*)': '[class~=$1]'
    },

    /**
     * List of operators and corresponding boolean functions. 
     * These functions are passed the attribute and the current node's value of the attribute.
     * @property operators
     * @type object
     */
    operators: {
        '=': function(attr, val) { return attr === val; }, // Equality
        '!=': function(attr, val) { return attr !== val; }, // Inequality
        '~=': function(attr, val) { // Match one of space seperated words 
            var s = ' ';
            return (s + attr + s).indexOf((s + val + s)) > -1;
        },
        '|=': function(attr, val) { return Y.DOM._getRegExp('^' + val + '[-]?').test(attr); }, // Match start with value followed by optional hyphen
        '^=': function(attr, val) { return attr.indexOf(val) === 0; }, // Match starts with value
        '$=': function(attr, val) { return attr.lastIndexOf(val) === attr[LENGTH] - val[LENGTH]; }, // Match ends with value
        '*=': function(attr, val) { return attr.indexOf(val) > -1; }, // Match contains value as substring 
        '': function(attr, val) { return attr; } // Just test for existence of attribute
    },

    /**
     * List of pseudo-classes and corresponding boolean functions. 
     * These functions are called with the current node, and any value that was parsed with the pseudo regex.
     * @property pseudos
     * @type object
     */
    pseudos: {
        'root': function(node) {
            return node === node[OWNER_DOCUMENT][DOCUMENT_ELEMENT];
        },

        'nth-child': function(node, val) {
            return getNth(node, val);
        },

        'nth-last-child': function(node, val) {
            return getNth(node, val, null, true);
        },

        'nth-of-type': function(node, val) {
            return getNth(node, val, node[TAG_NAME]);
        },
         
        'nth-last-of-type': function(node, val) {
            return getNth(node, val, node[TAG_NAME], true);
        },
         
        'first-child': function(node) {
            return Y.DOM.firstChild(node[PARENT_NODE]) === node;
        },

        'last-child': function(node) {
            return Y.DOM.lastChild(node[PARENT_NODE]) === node;
        },

        'first-of-type': function(node, val) {
            return Y.DOM.firstChildByTag(node[PARENT_NODE], node[TAG_NAME]) === node;
        },
         
        'last-of-type': function(node, val) {
            return Y.DOM.lastChildByTag(node[PARENT_NODE], node[TAG_NAME]) === node;
        },
         
        'only-child': function(node) {
            var children = Y.DOM.children(node[PARENT_NODE]);
            return children[LENGTH] === 1 && children[0] === node;
        },

        'only-of-type': function(node) {
            return Y.DOM.childrenByTag(node[PARENT_NODE], node[TAG_NAME])[LENGTH] === 1;
        },

        'empty': function(node) {
            return node.childNodes[LENGTH] === 0;
        },

        'not': function(node, simple) {
            return !Y.Selector.test(node, simple);
        },

        'contains': function(node, str) {
            var text = node.innerText || node.textContent || '';
            return text.indexOf(str) > -1;
        },
        'checked': function(node) {
            return node.checked === true;
        }
    },

    /**
     * Test if the supplied node matches the supplied selector.
     * @method test
     *
     * @param {HTMLElement | String} node An id or node reference to the HTMLElement being tested.
     * @param {string} selector The CSS Selector to test the node against.
     * @return{boolean} Whether or not the node matches the selector.
     * @static
    
     */
    test: function(node, selector) {
        if (!node) {
            return false;
        }

        var groups = selector ? selector.split(',') : [];
        if (groups[LENGTH]) {
            for (var i = 0, len = groups[LENGTH]; i < len; ++i) {
                if ( rTestNode(node, groups[i]) ) { // passes if ANY group matches
                    return true;
                }
            }
            return false;
        }
        return rTestNode(node, selector);
    },

    /**
     * Filters a set of nodes based on a given CSS selector. 
     * @method filter
     *
     * @param {array} nodes A set of nodes/ids to filter. 
     * @param {string} selector The selector used to test each node.
     * @return{array} An array of nodes from the supplied array that match the given selector.
     * @static
     */
    filter: function(nodes, selector) {
        nodes = nodes || [];

        var result = rFilter(nodes, tokenize(selector)[0]);
        Y.log('filter: returning:' + result[LENGTH], 'info', 'Selector');
        return result;
    },

    /**
     * Retrieves a set of nodes based on a given CSS selector. 
     * @method query
     *
     * @param {string} selector The CSS Selector to test the node against.
     * @param {HTMLElement | String} root optional An id or HTMLElement to start the query from. Defaults to Selector.document.
     * @param {Boolean} firstOnly optional Whether or not to return only the first match.
     * @return {Array} An array of nodes that match the given selector.
     * @static
     */
    query: function(selector, root, firstOnly) {
        var result = query(selector, root, firstOnly);
        //Y.log('query: ' + selector + ' returning ' + result, 'info', 'Selector');
        return result;
    }
};

var query = function(selector, root, firstOnly, deDupe) {
    var result =  (firstOnly) ? null : [];
    if (!selector) {
        return result;
    }

    var groups = selector.split(','); // TODO: handle comma in attribute/pseudo

    if (groups[LENGTH] > 1) {
        var found;
        for (var i = 0, len = groups[LENGTH]; i < len; ++i) {
            found = arguments.callee(groups[i], root, firstOnly, true);
            result = firstOnly ? found : result.concat(found); 
        }
        clearFoundCache();
        return result;
    }

    if (root && !root[NODE_NAME]) { // assume ID
        root = Y.Selector.document.getElementById(root);
        if (!root) {
            Y.log('invalid root node provided', 'error', 'Selector');
            return result;
        }
    }

    root = root || Y.Selector.document;
    var tokens = tokenize(selector);
    var idToken = tokens[getIdTokenIndex(tokens)],
        nodes = [],
        node,
        id,
        token = tokens.pop() || {};
        
    if (idToken) {
        id = getId(idToken[ATTRIBUTES]);
    }

    // use id shortcut when possible
    if (id) {
        node = Y.Selector.document.getElementById(id);

        if (node && (root[NODE_TYPE] === 9 || Y.DOM.contains(root, node))) {
            if ( rTestNode(node, null, idToken) ) {
                if (idToken === token) {
                    nodes = [node]; // simple selector
                } else {
                    root = node; // start from here
                }
            }
        } else {
            return result;
        }
    }

    if (root && !nodes[LENGTH]) {
        nodes = root.getElementsByTagName(token.tag);
    }

    if (nodes[LENGTH]) {
        result = rFilter(nodes, token, firstOnly, deDupe); 
    }
    return result;
};

var rFilter = function(nodes, token, firstOnly, deDupe) {
    var result = firstOnly ? null : [];

    result = Y.DOM.filterElementsBy(nodes, function(node) {
        if (! rTestNode(node, '', token, deDupe)) {
            return false;
        }

        if (deDupe) {
            if (node._found) {
                return false;
            }
            node._found = true;
            foundCache[foundCache[LENGTH]] = node;
        }
        return true;
    }, firstOnly);

    return result;
};

var rTestNode = function(node, selector, token, deDupe) {
    token = token || tokenize(selector).pop() || {};
    var ops = Y.Selector.operators,
        pseudos = Y.Selector.pseudos,
        prev = token.previous;

    if (!node[TAG_NAME] ||
        (token[TAG] !== '*' && node[TAG_NAME].toUpperCase() !== token[TAG]) ||
        (deDupe && node._found) ) {
        return false;
    }

    if (token[ATTRIBUTES][LENGTH]) {
        var attribute;
        for (var i = 0, len = token[ATTRIBUTES][LENGTH]; i < len; ++i) {
            attribute = node.getAttribute(token[ATTRIBUTES][i][0], 2);
            if (attribute === undefined) {
                return false;
            }
            if ( ops[token[ATTRIBUTES][i][1]] &&
                    !ops[token[ATTRIBUTES][i][1]](attribute, token[ATTRIBUTES][i][2])) {
                return false;
            }
        }
    }

    if (token[PSEUDOS][LENGTH]) {
        for (var i = 0, len = token[PSEUDOS][LENGTH]; i < len; ++i) {
            if (pseudos[token[PSEUDOS][i][0]] &&
                    !pseudos[token[PSEUDOS][i][0]](node, token[PSEUDOS][i][1])) {
                return false;
            }
        }
    }
    return (prev && prev[COMBINATOR] !== ',') ?
            combinators[prev[COMBINATOR]](node, token) :
            true;
};


var foundCache = [];
var regexCache = {};

var clearFoundCache = function() {
    Y.log('getBySelector: clearing found cache of ' + foundCache[LENGTH] + ' elements');
    for (var i = 0, len = foundCache[LENGTH]; i < len; ++i) {
        try { // IE no like delete
            delete foundCache[i]._found;
        } catch(e) {
            foundCache[i].removeAttribute('_found');
        }
    }
    foundCache = [];
    Y.log('getBySelector: done clearing foundCache');
};

var combinators = {
    ' ': function(node, token) {
        while (node = node.parentNode) {
            if (rTestNode(node, '', token.previous)) {
                return true;
            }
        }  
        return false;
    },

    '>': function(node, token) {
        return rTestNode(node.parentNode, null, token.previous);
    },
    '+': function(node, token) {
        var sib = node.previousSibling;
        while (sib && sib.nodeType !== 1) {
            sib = sib.previousSibling;
        }

        if (sib && rTestNode(sib, null, token.previous)) {
            return true; 
        }
        return false;
    },

    '~': function(node, token) {
        var sib = node.previousSibling;
        while (sib) {
            if (sib.nodeType === 1 && rTestNode(sib, null, token.previous)) {
                return true;
            }
            sib = sib.previousSibling;
        }

        return false;
    }
};


/*
    an+b = get every _a_th node starting at the _b_th
    0n+b = no repeat ("0" and "n" may both be omitted (together) , e.g. "0n+1" or "1", not "0+1"), return only the _b_th element
    1n+b =  get every element starting from b ("1" may may be omitted, e.g. "1n+0" or "n+0" or "n")
    an+0 = get every _a_th element, "0" may be omitted 
*/
var getNth = function(node, expr, tag, reverse) {
    reNth.test(expr);

    var a = parseInt(RegExp.$1, 10), // include every _a_ elements (zero means no repeat, just first _a_)
        n = RegExp.$2, // "n"
        oddeven = RegExp.$3, // "odd" or "even"
        b = parseInt(RegExp.$4, 10) || 0, // start scan from element _b_
        result = [],
        siblings;

    if (tag) {
        siblings = Y.DOM.childrenByTag(node.parentNode, tag);
    } else {
        siblings = Y.DOM.children(node.parentNode);
    }

    if (oddeven) {
        a = 2; // always every other
        op = '+';
        n = 'n';
        b = (oddeven === 'odd') ? 1 : 0;
    } else if ( isNaN(a) ) {
        a = (n) ? 1 : 0; // start from the first or no repeat
    }

    if (a === 0) { // just the first
        if (reverse) {
            b = siblings[LENGTH] - b + 1; 
        }

        if (siblings[b - 1] === node) {
            return true;
        } else {
            return false;
        }

    } else if (a < 0) {
        reverse = !!reverse;
        a = Math.abs(a);
    }

    if (!reverse) {
        for (var i = b - 1, len = siblings[LENGTH]; i < len; i += a) {
            if ( i >= 0 && siblings[i] === node ) {
                return true;
            }
        }
    } else {
        for (var i = siblings[LENGTH] - b, len = siblings[LENGTH]; i >= 0; i -= a) {
            if ( i < len && siblings[i] === node ) {
                return true;
            }
        }
    }
    return false;
};

var getId = function(attr) {
    for (var i = 0, len = attr[LENGTH]; i < len; ++i) {
        if (attr[i][0] == 'id' && attr[i][1] === '=') {
            return attr[i][2];
        }
    }
};

var getIdTokenIndex = function(tokens) {
    for (var i = 0, len = tokens[LENGTH]; i < len; ++i) {
        if (getId(tokens[i][ATTRIBUTES])) {
            return i;
        }
    }
    return -1;
};

var patterns = {
    tag: /^((?:-?[_a-z]+[\w-]*)|\*)/i,
    attributes: /^\[([a-z]+\w*)+([~\|\^\$\*!=]=?)?['"]?([^\]]*?)['"]?\]/i,
    //attributes: /^\[([a-z]+\w*)+([~\|\^\$\*!=]=?)?['"]?([^'"\]]*)['"]?\]*/i,
    pseudos: /^:([-\w]+)(?:\(['"]?(.+)['"]?\))*/i,
    combinator: /^\s*([>+~]|\s)\s*/
};

/**
    Break selector into token units per simple selector.
    Combinator is attached to left-hand selector.
 */
var tokenize = function(selector) {
    var token = {},     // one token per simple selector (left selector holds combinator)
        tokens = [],    // array of tokens
        id,             // unique id for the simple selector (if found)
        found = false,  // whether or not any matches were found this pass
        match;          // the regex match

    selector = replaceShorthand(selector); // convert ID and CLASS shortcuts to attributes

    /*
        Search for selector patterns, store, and strip them from the selector string
        until no patterns match (invalid selector) or we run out of chars.

        Multiple attributes and pseudos are allowed, in any order.
        for example:
            'form:first-child[type=button]:not(button)[lang|=en]'
    */
    do {
        found = false; // reset after full pass
        for (var re in patterns) {
            if (!patterns.hasOwnProperty(re)) {
                continue;
            }
            if (re != TAG && re != COMBINATOR) { // only one allowed
                token[re] = token[re] || [];
            }
            if (match = patterns[re].exec(selector)) { // note assignment
                found = true;
                if (re != TAG && re != COMBINATOR) { // only one allowed
                    //token[re] = token[re] || [];

                    // capture ID for fast path to element
                    if (re === ATTRIBUTES && match[1] === 'id') {
                        token.id = match[3];
                    }

                    token[re].push(match.slice(1));
                } else { // single selector (tag, combinator)
                    token[re] = match[1];
                }
                selector = selector.replace(match[0], ''); // strip current match from selector
                if (re === COMBINATOR || !selector[LENGTH]) { // next token or done
                    token[ATTRIBUTES] = fixAttributes(token[ATTRIBUTES]);
                    token[PSEUDOS] = token[PSEUDOS] || [];
                    token.tag = token.tag ? token.tag.toUpperCase() : '*';
                    tokens.push(token);

                    token = { // prep next token
                        previous: token
                    };
                }
            }
        }
    } while (found);

    return tokens;
};

var fixAttributes = function(attr) {
    var aliases = Y.Selector.attrAliases;
    attr = attr || [];
    for (var i = 0, len = attr[LENGTH]; i < len; ++i) {
        if (aliases[attr[i][0]]) { // convert reserved words, etc
            attr[i][0] = aliases[attr[i][0]];
        }
        if (!attr[i][1]) { // use exists operator
            attr[i][1] = '';
        }
    }
    return attr;
};

var replaceShorthand = function(selector) {
    var shorthand = Y.Selector.shorthand;
    var attrs = selector.match(patterns[ATTRIBUTES]); // pull attributes to avoid false pos on "." and "#"
    if (attrs) {
        selector = selector.replace(patterns[ATTRIBUTES], 'REPLACED_ATTRIBUTE');
    }
    for (var re in shorthand) {
        if (shorthand.hasOwnProperty(re)) {
            selector = selector.replace(Y.DOM._getRegExp(re, 'gi'), shorthand[re]);
        }
    }

    if (attrs) {
        for (var i = 0, len = attrs[LENGTH]; i < len; ++i) {
            selector = selector.replace('REPLACED_ATTRIBUTE', attrs[i]);
        }
    }
    return selector;
};

Y.Selector.patterns = patterns;

if (Y.UA.ie) { // rewrite class for IE (others use getAttribute('class')
    Y.Selector.attrAliases['class'] = 'className';
    Y.Selector.attrAliases['for'] = 'htmlFor';
}

/**
 * Add className management functionality to DOM.
 * @class DOMClassName
 *
 */

var CLASS_NAME = 'className';

Y.mix(Y.DOM, {
    /**
     * Determines whether an HTMLElement has the given className.
     * @method hasClass
     * @param {String} className the class name to search for
     * @return {Boolean | Array} A boolean value or array of boolean values
     */
    hasClass: function(node, className) {
        var re = Y.DOM._getRegExp('(?:^|\\s+)' + className + '(?:\\s+|$)');
        return re.test(node[CLASS_NAME]);
    },

    /**
     * Adds a class name to a given element or collection of elements.
     * @method addClass         
     * @param {String} className the class name to add to the class attribute
     * @return {Boolean | Array} A pass/fail boolean or array of booleans
     */
    addClass: function(node, className) {
        if (!Y.DOM.hasClass(node, className)) { // skip if already present 
            node[CLASS_NAME] = Y.Lang.trim([node[CLASS_NAME], className].join(' '));
        }
    },

    /**
     * Removes a class name from a given element or collection of elements.
     * @method removeClass         
     * @param {String} className the class name to remove from the class attribute
     * @return {Boolean | Array} A pass/fail boolean or array of booleans
     */
    removeClass: function(node, className) {
        if (className && Y.DOM.hasClass(node, className)) {
            node[CLASS_NAME] = Y.Lang.trim(node[CLASS_NAME].replace(Y.DOM._getRegExp('(?:^|\\s+)' +
                            className + '(?:\\s+|$)'), ' '));

            if ( Y.DOM.hasClass(node, className) ) { // in case of multiple adjacent
                Y.DOM.removeClass(node, className);
            }

            //Y.log('removeClass removing ' + className, 'info', 'Node');
        }                 
    },

    /**
     * Replace a class with another class for a given element or collection of elements.
     * If no oldClassName is present, the newClassName is simply added.
     * @method replaceClass  
     * @param {String} oldClassName the class name to be replaced
     * @param {String} newClassName the class name that will be replacing the old class name
     * @return {Boolean | Array} A pass/fail boolean or array of booleans
     */
    replaceClass: function(node, oldC, newC) {
        //Y.log('replaceClass replacing ' + oldC + ' with ' + newC, 'info', 'Node');
        Y.DOM.addClass(node, newC);
        Y.DOM.removeClass(node, oldC);
    },

    /**
     * If the className exists on the node it is removed, if it doesn't exist it is added.
     * @method toggleClass  
     * @param {String} className the class name to be toggled
     */
    toggleClass: function(node, className) {
        if (Y.DOM.hasClass(node, className)) {
            Y.DOM.removeClass(node, className);
        } else {
            Y.DOM.addClass(node, className);
        }
    }
});

/**
 * Provides color conversion functionality.
 * @class Color
 *
 */

var TO_STRING = 'toString',
    RE = RegExp,
    re_color = /color$/i,
    re_rgb = /^rgb\(([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\)$/i,
    re_hex = /^#?([0-9A-F]{2})([0-9A-F]{2})([0-9A-F]{2})$/i,
    re_hex3 = /([0-9A-F])/gi;

Y.Color = {
    KEYWORDS: {
        black: '000',
        silver: 'c0c0c0',
        gray: '808080',
        white: 'fff',
        maroon: '800000',
        red: 'f00',
        purple: '800080',
        fuchsia: 'f0f',
        green: '008000',
        lime: '0f0',
        olive: '808000',
        yellow: 'ff0',
        navy: '000080',
        blue: '00f',
        teal: '008080',
        aqua: '0ff'
    },

    toRGB: function(val) {
        val = Y.Color.toHex(val);

        if(re_hex.exec(val)) {
            val = 'rgb(' + [
                parseInt(RE.$1, 16),
                parseInt(RE.$2, 16),
                parseInt(RE.$3, 16)
            ].join(', ') + ')';
        }
        return val;
    },

    toHex: function(val) {
        val = Y.Color.KEYWORDS[val] || val;
        if (re_rgb.exec(val)) {
            val = [
                Number(RE.$1)[TO_STRING](16),
                Number(RE.$2)[TO_STRING](16),
                Number(RE.$3)[TO_STRING](16)
            ].join('');
        }

        if (val[LENGTH] < 6) {
            val = val.replace(re_hex3, '$1$1');
        }

        return (val.indexOf('#') < 0 ? val = '#' + val : val).toLowerCase();
    }
};

var STYLE = 'style',
    FLOAT = 'float',
    CSS_FLOAT = 'cssFloat',
    STYLE_FLOAT = 'styleFloat',
    TRANSPARENT = 'transparent',
    VISIBLE = 'visible',
    WIDTH = 'width',
    HEIGHT = 'height',
    BORDER_TOP_WIDTH = 'borderTopWidth',
    BORDER_RIGHT_WIDTH = 'borderRightWidth',
    BORDER_BOTTOM_WIDTH = 'borderBottomWidth',
    BORDER_LEFT_WIDTH = 'borderLeftWidth',
    GET_COMPUTED_STYLE = 'getComputedStyle',

    DOCUMENT = Y.config.doc;


Y.mix(Y.DOM, {
    CUSTOM_STYLES: {},

    setStyle: function(node, att, val) {
        var style = node[STYLE],
            CUSTOM_STYLES = Y.DOM.CUSTOM_STYLES;

        if (style) {
            if (att in CUSTOM_STYLES) {
                if (CUSTOM_STYLES[att].set) {
                    CUSTOM_STYLES[att].set(node, val, style);
                    return; // NOTE: return
                } else if (typeof CUSTOM_STYLES[att] === 'string') {
                    att = CUSTOM_STYLES[att];
                }
            }
            style[att] = val; 
        }
    },

    getStyle: function(node, att) {
        var style = node[STYLE],
            CUSTOM_STYLES = Y.DOM.CUSTOM_STYLES,
            val = '';

        if (style) {
            if (att in CUSTOM_STYLES) {
                if (CUSTOM_STYLES[att].get) {
                    return CUSTOM_STYLES[att].get(node, att, style); // NOTE: return
                } else if (typeof CUSTOM_STYLES[att] === 'string') {
                    att = CUSTOM_STYLES[att];
                }
            }
            val = style[att];
            if (val === '') { // TODO: is empty string sufficient?
                val = Y.DOM[GET_COMPUTED_STYLE](node, att);
            }
        }

        return val;
    },

    getComputedStyle: function(node, att) {
        var val = '',
            doc = node[OWNER_DOCUMENT];

        if (node[STYLE]) {
            val = doc[DEFAULT_VIEW][GET_COMPUTED_STYLE](node, '')[att];
        }
        return val;
    }
});

if (DOCUMENT[DOCUMENT_ELEMENT][STYLE][CSS_FLOAT] !== UNDEFINED) {
    Y.DOM.CUSTOM_STYLES[FLOAT] = CSS_FLOAT;
} else if (DOCUMENT[DOCUMENT_ELEMENT][STYLE][STYLE_FLOAT] !== UNDEFINED) {
    Y.DOM.CUSTOM_STYLES[FLOAT] = STYLE_FLOAT;
}

if (Y.UA.opera) { // opera defaults to hex instead of RGB
    Y.DOM[GET_COMPUTED_STYLE] = function(node, att) {
        var view = node[OWNER_DOCUMENT][DEFAULT_VIEW],
            val = view[GET_COMPUTED_STYLE](node, '')[att];

        if (re_color.test(att)) {
            val = Y.Color.toRGB(val);
        }

        return val;
    };

}

if (Y.UA.webkit) { // safari converts transparent to rgba()
    Y.DOM[GET_COMPUTED_STYLE] = function(node, att) {
        var view = node[OWNER_DOCUMENT][DEFAULT_VIEW],
            val = view[GET_COMPUTED_STYLE](node, '')[att];

        if (val === 'rgba(0, 0, 0, 0)') {
            val = TRANSPARENT; 
        }

        return val;
    };

}

/**
 * Add position and window/document size detection functionality to DOM.
 * @class DOMScreen
 */

var OFFSET_TOP = 'offsetTop',
    COMPAT_MODE = 'compatMode',
    OFFSET_LEFT = 'offsetLeft',
    OFFSET_PARENT = 'offsetParent',
    POSITION = 'position',
    FIXED = 'fixed',
    RELATIVE = 'relative',
    LEFT = 'left',
    TOP = 'top',
    SCROLL_LEFT = 'scrollLeft',
    SCROLL_TOP = 'scrollTop',
    _BACK_COMPAT = 'BackCompat',
    MEDIUM = 'medium',
    GET_BOUNDING_CLIENT_RECT = 'getBoundingClientRect',
    RE_TABLE = /^t(?:able|d|h)$/i;

Y.mix(Y.DOM, {
    /**
     * Returns the inner height of the viewport (exludes scrollbar). 
     * @method winHeight
     */
    winHeight: function(node) {
        var h = Y.DOM._getWinSize(node)[HEIGHT];
        Y.log('winHeight returning ' + h, 'info', 'DOM');
        return h;
    },

    /**
     * Returns the inner width of the viewport (exludes scrollbar). 
     * @method winWidth
     */
    winWidth: function(node) {
        var w = Y.DOM._getWinSize(node)[WIDTH];
        Y.log('winWidth returning ' + w, 'info', 'DOM');
        return w;
    },

    /**
     * Document height 
     * @method docHeight
     */
    docHeight:  function(node) {
        var h = Y.DOM._getDocSize(node)[HEIGHT];
        Y.log('docHeight returning ' + h, 'info', 'DOM');
        return Math.max(h, Y.DOM._getWinSize(node)[HEIGHT]);
    },

    /**
     * Document width 
     * @method docWidth
     */
    docWidth:  function(node) {
        var w = Y.DOM._getDocSize(node)[WIDTH];
        Y.log('docWidth returning ' + w, 'info', 'DOM');
        return Math.max(w, Y.DOM._getWinSize(node)[WIDTH]);
    },

    /**
     * Amount page has been scroll vertically 
     * @method docScrollX
     */
    docScrollX: function(node) {
        var doc = Y.DOM._getDoc();
        return Math.max(doc[DOCUMENT_ELEMENT][SCROLL_LEFT], doc.body[SCROLL_LEFT]);
    },

    /**
     * Amount page has been scroll horizontally 
     * @method docScrollY
     */
    docScrollY:  function(node) {
        var doc = Y.DOM._getDoc();
        return Math.max(doc[DOCUMENT_ELEMENT][SCROLL_TOP], doc.body[SCROLL_TOP]);
    },

    /**
     * Gets the current position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getXY
     * @return {Array} The XY position of the element

     TODO: test inDocument/display
     */
    getXY: function() {
        if (document.documentElement[GET_BOUNDING_CLIENT_RECT]) {
            return function(node) {
                var scrollLeft = Y.DOM.docScrollX(node),
                    scrollTop = Y.DOM.docScrollY(node),
                    box = node[GET_BOUNDING_CLIENT_RECT](),
                    doc = Y.DOM._getDoc(node),
                    //Round the numbers so we get sane data back
                    xy = [Math.floor(box[LEFT]), Math.floor(box[TOP])];

                    if (Y.UA.ie) {
                        var off1 = 2, off2 = 2,
                        mode = doc[COMPAT_MODE],
                        bLeft = Y.DOM[GET_COMPUTED_STYLE](doc[DOCUMENT_ELEMENT], BORDER_LEFT_WIDTH),
                        bTop = Y.DOM[GET_COMPUTED_STYLE](doc[DOCUMENT_ELEMENT], BORDER_TOP_WIDTH);

                        if (Y.UA.ie === 6) {
                            if (mode !== _BACK_COMPAT) {
                                off1 = 0;
                                off2 = 0;
                            }
                        }
                        
                        if ((mode == _BACK_COMPAT)) {
                            if (bLeft !== MEDIUM) {
                                off1 = parseInt(bLeft, 10);
                            }
                            if (bTop !== MEDIUM) {
                                off2 = parseInt(bTop, 10);
                            }
                        }
                        
                        xy[0] -= off1;
                        xy[1] -= off2;
                    }

                if ((scrollTop || scrollLeft)) {
                    xy[0] += scrollLeft;
                    xy[1] += scrollTop;
                }

                // gecko may return sub-pixel (non-int) values
                xy[0] = Math.floor(xy[0]);
                xy[1] = Math.floor(xy[1]);

                return xy;                   
            };
        } else {
            return function(node) { // manually calculate by crawling up offsetParents
                //Calculate the Top and Left border sizes (assumes pixels)
                var xy = [node[OFFSET_LEFT], node[OFFSET_TOP]],
                    parentNode = node,
                    bCheck = ((Y.UA.gecko || (Y.UA.webkit > 519)) ? true : false);

                while ((parentNode = parentNode[OFFSET_PARENT])) {
                    xy[0] += parentNode[OFFSET_LEFT];
                    xy[1] += parentNode[OFFSET_TOP];
                    if (bCheck) {
                        xy = Y.DOM._calcBorders(parentNode, xy);
                    }
                }

                // account for any scrolled ancestors
                if (Y.DOM.getStyle(node, POSITION) != FIXED) {
                    parentNode = node;
                    var scrollTop, scrollLeft;

                    while ((parentNode = parentNode[PARENT_NODE])) {
                        scrollTop = parentNode[SCROLL_TOP];
                        scrollLeft = parentNode[SCROLL_LEFT];

                        //Firefox does something funky with borders when overflow is not visible.
                        if (Y.UA.gecko && (Y.DOM.getStyle(parentNode, 'overflow') !== VISIBLE)) {
                                xy = Y.DOM._calcBorders(parentNode, xy);
                        }
                        

                        if (scrollTop || scrollLeft) {
                            xy[0] -= scrollLeft;
                            xy[1] -= scrollTop;
                        }
                    }
                    xy[0] += Y.DOM.docScrollX(node);
                    xy[1] += Y.DOM.docScrollY(node);

                } else {
                    //Fix FIXED position -- add scrollbars
                    if (Y.UA.opera) {
                        xy[0] -= Y.DOM.docScrollX(node);
                        xy[1] -= Y.DOM.docScrollY(node);
                    } else if (Y.UA.webkit || Y.UA.gecko) {
                        xy[0] += Y.DOM.docScrollX(node);
                        xy[1] += Y.DOM.docScrollY(node);
                    }
                }
                //Round the numbers so we get sane data back
                xy[0] = Math.floor(xy[0]);
                xy[1] = Math.floor(xy[1]);

                return xy;                
            };
        }
    }(),// NOTE: Executing for loadtime branching

    /**
     * Gets the current X position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getX
     * @return {Int} The X position of the element
     */

    getX: function(node) {
        return Y.DOM.getXY(node)[0];
    },

    /**
     * Gets the current Y position of an element based on page coordinates. 
     * Element must be part of the DOM tree to have page coordinates
     * (display:none or elements not appended return false).
     * @method getY
     * @return {Int} The Y position of the element
     */

    getY: function(node) {
        return Y.DOM.getXY(node)[1];
    },

    /**
     * Set the position of an html element in page coordinates, regardless of how the element is positioned.
     * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setXY
     * @param {Array} xy Contains X & Y values for new position (coordinates are page-based)
     * @param {Boolean} noRetry By default we try and set the position a second time if the first fails
     */
    setXY: function(node, xy, noRetry) {
        var pos = Y.DOM.getStyle(node, POSITION),
            setStyle = Y.DOM.setStyle,
            delta = [ // assuming pixels; if not we will have to retry
                parseInt( Y.DOM[GET_COMPUTED_STYLE](node, LEFT), 10 ),
                parseInt( Y.DOM[GET_COMPUTED_STYLE](node, TOP), 10 )
            ];
    
        if (pos == 'static') { // default to relative
            pos = RELATIVE;
            setStyle(node, POSITION, pos);
        }

        var currentXY = Y.DOM.getXY(node);

        if (currentXY === false) { // has to be part of doc to have xy
            Y.log('xy failed: node not available', 'error', 'Node');
            return false; 
        }
        
        if ( isNaN(delta[0]) ) {// in case of 'auto'
            delta[0] = (pos == RELATIVE) ? 0 : node[OFFSET_LEFT];
        } 
        if ( isNaN(delta[1]) ) { // in case of 'auto'
            delta[1] = (pos == RELATIVE) ? 0 : node[OFFSET_TOP];
        } 

        if (xy[0] !== null) {
            setStyle(node, LEFT, xy[0] - currentXY[0] + delta[0] + 'px');
        }

        if (xy[1] !== null) {
            setStyle(node, TOP, xy[1] - currentXY[1] + delta[1] + 'px');
        }
      
        if (!noRetry) {
            var newXY = Y.DOM.getXY(node);

            // if retry is true, try one more time if we miss 
           if ( (xy[0] !== null && newXY[0] != xy[0]) || 
                (xy[1] !== null && newXY[1] != xy[1]) ) {
               Y.DOM.setXY(node, xy, true);
           }
        }        

        Y.log('setXY setting position to ' + xy, 'info', 'Node');
    },

    /**
     * Set the X position of an html element in page coordinates, regardless of how the element is positioned.
     * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setX
     * @param {Int} x The X values for new position (coordinates are page-based)
     */
    setX: function(node, x) {
        return Y.DOM.setXY(node, [x, null]);
    },

    /**
     * Set the Y position of an html element in page coordinates, regardless of how the element is positioned.
     * The element(s) must be part of the DOM tree to have page coordinates (display:none or elements not appended return false).
     * @method setY
     * @param {Int} y The Y values for new position (coordinates are page-based)
     */
    setY: function(node, y) {
        return Y.DOM.setXY(node, [null, y]);
    },

    _calcBorders: function(node, xy2) {
        var t = parseInt(Y.DOM[GET_COMPUTED_STYLE](node, BORDER_TOP_WIDTH), 10) || 0,
            l = parseInt(Y.DOM[GET_COMPUTED_STYLE](node, BORDER_LEFT_WIDTH), 10) || 0;
        if (Y.UA.gecko) {
            if (RE_TABLE.test(node[TAG_NAME])) {
                t = 0;
                l = 0;
            }
        }
        xy2[0] += l;
        xy2[1] += t;
        return xy2;
    },

    _getWinSize: function(node) {
        var doc = Y.DOM._getDoc(),
            win = doc[DEFAULT_VIEW] || doc[PARENT_WINDOW],
            mode = doc[COMPAT_MODE],
            h = win.innerHeight,
            w = win.innerWidth,
            root = doc[DOCUMENT_ELEMENT];

        if ( mode && !Y.UA.opera ) { // IE, Gecko
            if (mode != 'CSS1Compat') { // Quirks
                root = doc.body; 
            }
            h = root[CLIENT_HEIGHT];
            w = root[CLIENT_WIDTH];
        }
        return { height: h, width: w }; 
    },

    _getDocSize: function(node) {
        var doc = Y.DOM._getDoc(),
            root = doc[DOCUMENT_ELEMENT];

        if (doc[COMPAT_MODE] != 'CSS1Compat') {
            root = doc.body;
        }

        return { height: root.scrollHeight, width: root.scrollWidth };
    }
});

/**
 * Adds region management functionality to DOM.
 * @class DOMRegion
 *
 */
var getOffsets = function(r1, r2) {

    var t = Math.max(r1.top,    r2.top   ),
        r = Math.min(r1.right,  r2.right ),
        b = Math.min(r1.bottom, r2.bottom),
        l = Math.max(r1.left,   r2.left  );
    
    return {
        top: t,
        bottom: b,
        left: l,
        right: r
    };
};

Y.mix(Y.DOM, {
    /**
     * Returns an Object literal containing the following about this node: (top, right, bottom, left) positions, height and width
     * @method region
     @return {Object} Object literal containing the following about this node: (top, right, bottom, left) positions, height and width
     */
    region: function(node) {
        var x = Y.DOM.getXY(node),
            ret = false;
        
        if (x) {
            ret = {
                '0': x[0],
                '1': x[1],
                top: x[1],
                right: x[0] + node[OFFSET_WIDTH],
                bottom: x[1] + node[OFFSET_HEIGHT],
                left: x[0],
                height: node[OFFSET_HEIGHT],
                width: node[OFFSET_WIDTH]
            }
        }

        return ret;
    },

    /**
     * Find the intersect information for this node and the node passed in.
     * @method intersect
     * @param {Object} node2 The node to check the interect with
     * @param {Object} altRegion An object literal containing the region for this node if we already have the data (for performance i.e. DragDrop)
     * @return {Object} Returns an Object literal with the intersect information for the nodes
     */
    intersect: function(node, node2, altRegion) {
        var r = altRegion || Y.DOM.region(node), region = {};

        var n = node2;
        if (n[TAG_NAME]) {
            region = Y.DOM.region(n);
        } else if (Y.Lang.isObject(node2)) {
            region = node2;
        } else {
            return false;
        }
        
        var off = getOffsets(region, r);
        return {
            top: off.top,
            right: off.right,
            bottom: off.bottom,
            left: off.left,
            area: ((off.bottom - off.top) * (off.right - off.left)),
            yoff: ((off.bottom - off.top)),
            xoff: (off.right - off.left),
            inRegion: Y.DOM.inRegion(node, node2, false, altRegion)
        };
        
    },
    /**
     * Check if any part of this node is in the passed region
     * @method inRegion
     * @param {Object} node2 The node to get the region from or an Object literal of the region
     * $param {Boolean} all Should all of the node be inside the region
     * @param {Object} altRegion An object literal containing the region for this node if we already have the data (for performance i.e. DragDrop)
     * @return {Boolean} True if in region, false if not.
     */
    inRegion: function(node, node2, all, altRegion) {
        var region = {},
            r = altRegion || Y.DOM.region(node);

        var n = node2;
        if (n[TAG_NAME]) {
            region = Y.DOM.region(n);
        } else if (Y.Lang.isObject(node2)) {
            region = node2;
        } else {
            return false;
        }
            
        if (all) {
            return ( r.left   >= region.left   &&
                r.right  <= region.right  && 
                r.top    >= region.top    && 
                r.bottom <= region.bottom    );
        } else {
            var off = getOffsets(region, r);
            if (off.bottom >= off.top && off.right >= off.left) {
                return true;
            } else {
                return false;
            }
            
        }
    },

    /**
     * Check if any part of this node is in the viewport
     * @method inViewportRegion
     * $param {Boolean} all Should all of the node be inside the region
     * @param {Object} altRegion An object literal containing the region for this node if we already have the data (for performance i.e. DragDrop)
     * @return {Boolean} True if in region, false if not.
     */
    inViewportRegion: function(node, all, altRegion) {
        return Y.DOM.inRegion(node, Y.DOM.viewportRegion(node), all, altRegion);
            
    },

    viewportRegion: function(node) {
        node = node || Y.config.doc.documentElement;
        var r = {
            top: Y.DOM.docScrollY(node),
            right: Y.DOM.winWidth(node) + Y.DOM.docScrollX(node),
            bottom: (Y.DOM.docScrollY(node) + Y.DOM.winHeight(node)),
            left: Y.DOM.docScrollX(node)
        };

        return r;
    }
});
var CLIENT_TOP = 'clientTop',
    CLIENT_LEFT = 'clientLeft',
    RIGHT = 'right',
    HAS_LAYOUT = 'hasLayout',
    PX = 'px',
    FILTER = 'filter',
    FILTERS = 'filters',
    OPACITY = 'opacity',
    AUTO = 'auto',
    CURRENT_STYLE = 'currentStyle';

// use alpha filter for IE opacity
if (document[DOCUMENT_ELEMENT][STYLE][OPACITY] === UNDEFINED &&
        document[DOCUMENT_ELEMENT][FILTERS]) {
    Y.DOM.CUSTOM_STYLES[OPACITY] = {
        get: function(node) {
            var val = 100;
            try { // will error if no DXImageTransform
                val = node[FILTERS]['DXImageTransform.Microsoft.Alpha'][OPACITY];

            } catch(e) {
                try { // make sure its in the document
                    val = node[FILTERS]('alpha')[OPACITY];
                } catch(e) {
                    Y.log('getStyle: IE opacity filter not found; returning 1', 'warn', 'DOM');
                }
            }
            return val / 100;
        },

        set: function(node, val, style) {
            if (typeof style[FILTER] == STRING) { // in case not appended
                style[FILTER] = 'alpha(' + OPACITY + '=' + val * 100 + ')';
                
                if (!node[CURRENT_STYLE] || !node[CURRENT_STYLE][HAS_LAYOUT]) {
                    style.zoom = 1; // needs layout 
                }
            }
        }
    };
}

// IE getComputedStyle
// TODO: unit-less lineHeight (e.g. 1.22)
var re_size = /^width|height$/,
    re_unit = /^(\d[.\d]*)+(em|ex|px|gd|rem|vw|vh|vm|ch|mm|cm|in|pt|pc|deg|rad|ms|s|hz|khz|%){1}?/i;

var ComputedStyle = {
    CUSTOM_STYLES: {},

    get: function(el, property) {
        var value = '',
            current = el[CURRENT_STYLE][property];

        if (property === OPACITY) {
            value = Y.DOM.CUSTOM_STYLES[OPACITY].get(el);        
        } else if (!current || current.indexOf(PX) > -1) { // no need to convert
            value = current;
        } else if (Y.DOM.IE.COMPUTED[property]) { // use compute function
            value = Y.DOM.IE.COMPUTED[property](el, property);
        } else if (re_unit.test(current)) { // convert to pixel
            value = Y.DOM.IE.ComputedStyle.getPixel(el, property);
        } else {
            value = current;
        }

        return value;
    },

    getOffset: function(el, prop) {
        var current = el[CURRENT_STYLE][prop],                        // value of "width", "top", etc.
            capped = prop.charAt(0).toUpperCase() + prop.substr(1), // "Width", "Top", etc.
            offset = 'offset' + capped,                             // "offsetWidth", "offsetTop", etc.
            pixel = 'pixel' + capped,                               // "pixelWidth", "pixelTop", etc.
            value = '';

        if (current == AUTO) {
            var actual = el[offset]; // offsetHeight/Top etc.
            if (actual === UNDEFINED) { // likely "right" or "bottom"
                value = 0;
            }

            value = actual;
            if (re_size.test(prop)) { // account for box model diff 
                el[STYLE][prop] = actual; 
                if (el[offset] > actual) {
                    // the difference is padding + border (works in Standards & Quirks modes)
                    value = actual - (el[offset] - actual);
                }
                el[STYLE][prop] = AUTO; // revert to auto
            }
        } else { // convert units to px
            if (!el[STYLE][pixel] && !el[STYLE][prop]) { // need to map style.width to currentStyle (no currentStyle.pixelWidth)
                el[STYLE][prop] = current;              // no style.pixelWidth if no style.width
            }
            value = el[STYLE][pixel];
        }
        return value + PX;
    },

    getBorderWidth: function(el, property) {
        // clientHeight/Width = paddingBox (e.g. offsetWidth - borderWidth)
        // clientTop/Left = borderWidth
        var value = null;
        if (!el[CURRENT_STYLE][HAS_LAYOUT]) { // TODO: unset layout?
            el[STYLE].zoom = 1; // need layout to measure client
        }

        switch(property) {
            case BORDER_TOP_WIDTH:
                value = el[CLIENT_TOP];
                break;
            case BORDER_BOTTOM_WIDTH:
                value = el[OFFSET_HEIGHT] - el[CLIENT_HEIGHT] - el[CLIENT_TOP];
                break;
            case BORDER_LEFT_WIDTH:
                value = el[CLIENT_LEFT];
                break;
            case BORDER_RIGHT_WIDTH:
                value = el[OFFSET_WIDTH] - el[CLIENT_WIDTH] - el[CLIENT_LEFT];
                break;
        }
        return value + PX;
    },

    getPixel: function(node, att) {
        // use pixelRight to convert to px
        var val = null,
            styleRight = node[CURRENT_STYLE][RIGHT],
            current = node[CURRENT_STYLE][att];

        node[STYLE][RIGHT] = current;
        val = node[STYLE].pixelRight;
        node[STYLE][RIGHT] = styleRight; // revert

        return val + PX;
    },

    getMargin: function(node, att) {
        var val;
        if (node[CURRENT_STYLE][att] == AUTO) {
            val = 0 + PX;
        } else {
            val = Y.DOM.IE.ComputedStyle.getPixel(node, att);
        }
        return val;
    },

    getVisibility: function(node, att) {
        var current;
        while ( (current = node[CURRENT_STYLE]) && current[att] == 'inherit') { // NOTE: assignment in test
            node = node[PARENT_NODE];
        }
        return (current) ? current[att] : VISIBLE;
    },

    getColor: function(node, att) {
        var current = node[CURRENT_STYLE][att];

        if (!current || current === TRANSPARENT) {
            Y.DOM.elementByAxis(node, PARENT_NODE, null, function(parent) {
                current = parent[CURRENT_STYLE][att];
                if (current && current !== TRANSPARENT) {
                    node = parent;
                    return true;
                }
            });
        }

        return Y.Color.toRGB(current);
    },

    getBorderColor: function(node, att) {
        var current = node[CURRENT_STYLE];
        var val = current[att] || current.color;
        return Y.Color.toRGB(Y.Color.toHex(val));
    }

};

//fontSize: getPixelFont,
var IEComputed = {};

IEComputed[WIDTH] = IEComputed[HEIGHT] = ComputedStyle.getOffset;

IEComputed.color = IEComputed.backgroundColor = ComputedStyle.getColor;

IEComputed[BORDER_TOP_WIDTH] = IEComputed[BORDER_RIGHT_WIDTH] =
        IEComputed[BORDER_BOTTOM_WIDTH] = IEComputed[BORDER_LEFT_WIDTH] =
                ComputedStyle.getBorderWidth;

IEComputed.marginTop = IEComputed.marginRight = IEComputed.marginBottom =
        IEComputed.marginLeft = ComputedStyle.getMargin;

IEComputed.visibility = ComputedStyle.getVisibility;
IEComputed.borderTopColor = IEComputed.borderRightColor =
        IEComputed.borderBottomColor = IEComputed.borderLeftColor =
                ComputedStyle.getBorderColor;

if (!Y.config.win[GET_COMPUTED_STYLE]) {
    Y.DOM[GET_COMPUTED_STYLE] = ComputedStyle.get; 
}

Y.namespace('DOM.IE');
Y.DOM.IE.COMPUTED = IEComputed;
Y.DOM.IE.ComputedStyle = ComputedStyle;



}, '@VERSION@' );
