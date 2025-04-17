
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        if (value == null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Creates an event dispatcher that can be used to dispatch [component events](/docs#template-syntax-component-directives-on-eventname).
     * Event dispatchers are functions that can take two arguments: `name` and `detail`.
     *
     * Component events created with `createEventDispatcher` create a
     * [CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent).
     * These events do not [bubble](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Building_blocks/Events#Event_bubbling_and_capture).
     * The `detail` argument corresponds to the [CustomEvent.detail](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/detail)
     * property and can contain any type of data.
     *
     * https://svelte.dev/docs#run-time-svelte-createeventdispatcher
     */
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        const options = { direction: 'both' };
        let config = fn(node, params, options);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config(options);
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    // Définir l'URL de l'API pour éviter les problèmes de CORS
    const API_URL$2 = 'http://localhost:5000';

    // Store pour l'état d'authentification - initialisation explicite à false
    const isAuthenticated = writable(false);
    const currentUser = writable(null);

    // Vérifier le token au démarrage
    function checkAuth() {
        // Initialiser l'état d'authentification à false par défaut
        isAuthenticated.set(false);
        currentUser.set(null);
        
        if (typeof window === 'undefined' || !window.localStorage) {
            console.log("Environnement sans localStorage, authentification désactivée");
            return false;
        }
        
        const token = localStorage.getItem('auth_token');
        const userStr = localStorage.getItem('user');
        
        if (!token || !userStr) {
            console.log("Pas de token ou d'utilisateur en localStorage");
            return false;
        }
        
        try {
            const user = JSON.parse(userStr);
            
            // Vérifier la validité du token avec le backend
            fetch(`${API_URL$2}/api/auth/me`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                console.log("Réponse du serveur pour /me:", response.status);
                if (response.ok) {
                    console.log("Token validé par le backend");
                    isAuthenticated.set(true);
                    currentUser.set(user);
                    return true;
                } else {
                    console.log("Token invalide, déconnexion");
                    // Token invalide, nettoyer le stockage
                    logout();
                    return false;
                }
            })
            .catch((err) => {
                console.log("Erreur de vérification du token:", err);
                logout();
                return false;
            });
        } catch (e) {
            console.log("Erreur de parsing JSON:", e);
            // En cas d'erreur de parsing, nettoyer le stockage
            logout();
            return false;
        }
        return false;
    }

    // Fonction de déconnexion
    function logout() {
        console.log("Déconnexion utilisateur");
        if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
        }
        isAuthenticated.set(false);
        currentUser.set(null);
    }

    // Fonction pour récupérer le token
    function getToken() {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }
        return localStorage.getItem('auth_token');
    }

    // Intercepteur pour les requêtes API
    async function fetchWithAuth(url, options = {}) {
        const token = getToken();
        
        // Adapter l'URL en fonction du type de requête
        let apiUrl = url;
        
        // Si l'URL ne contient pas déjà http:// et ne commence pas par /api, ajuster le format
        if (!url.includes('http://') && !url.startsWith('/api')) {
            apiUrl = `${API_URL$2}/api${url.startsWith('/') ? url : `/${url}`}`;
        } else if (url.startsWith('/api')) {
            apiUrl = `${API_URL$2}${url}`;
        }
        
        console.log("URL modifiée pour fetch:", apiUrl);
        
        if (token) {
            options.headers = {
                ...options.headers || {},
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            };
            console.log("Envoi requête avec token:", `Bearer ${token}`);
        }
        
        try {
            const response = await fetch(apiUrl, {
                ...options
            });
            
            // Si on reçoit une erreur 401, on déconnecte l'utilisateur
            if (response.status === 401) {
                console.log("Erreur 401, déconnexion");
                logout();
            }
            
            return response;
        } catch (error) {
            console.error("Erreur de connexion API:", error);
            throw error;
        }
    }

    /* src/components/Login.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$2 = "src/components/Login.svelte";

    // (181:8) {#if loading}
    function create_if_block_2$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "loading-spinner svelte-97oszj");
    			add_location(div, file$2, 181, 12, 5344);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(181:8) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (185:8) {#if error}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t;
    	let p_intro;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[2]);
    			attr_dev(p, "class", "error-message svelte-97oszj");
    			add_location(p, file$2, 185, 12, 5435);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 4) set_data_dev(t, /*error*/ ctx[2]);
    		},
    		i: function intro(local) {
    			if (!p_intro) {
    				add_render_callback(() => {
    					p_intro = create_in_transition(p, fade, {});
    					p_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(185:8) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (193:8) {:else}
    function create_else_block$1(ctx) {
    	let t0;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Pas encore de compte ? ");
    			span = element("span");
    			span.textContent = "S'inscrire";
    			attr_dev(span, "class", "toggle-link svelte-97oszj");
    			add_location(span, file$2, 193, 35, 5716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*toggleMode*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(193:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (191:8) {#if isRegisterMode}
    function create_if_block$1(ctx) {
    	let t0;
    	let span;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			t0 = text("Déjà inscrit ? ");
    			span = element("span");
    			span.textContent = "Se connecter";
    			attr_dev(span, "class", "toggle-link svelte-97oszj");
    			add_location(span, file$2, 191, 27, 5597);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span, anchor);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*toggleMode*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(191:8) {#if isRegisterMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div3;
    	let h2;

    	let t0_value = (/*isRegisterMode*/ ctx[4]
    	? 'Créer un compte'
    	: 'Connexion') + "";

    	let t0;
    	let t1;
    	let form;
    	let div0;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let div1;
    	let label1;
    	let t6;
    	let input1;
    	let input1_autocomplete_value;
    	let t7;
    	let button;

    	let t8_value = (/*isRegisterMode*/ ctx[4]
    	? 'S\'inscrire'
    	: 'Se connecter') + "";

    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let div2;
    	let div3_intro;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[3] && create_if_block_2$1(ctx);
    	let if_block1 = /*error*/ ctx[2] && create_if_block_1$1(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*isRegisterMode*/ ctx[4]) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block2 = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email :";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Mot de passe :";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button = element("button");
    			t8 = text(t8_value);
    			t9 = space();
    			if (if_block0) if_block0.c();
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			div2 = element("div");
    			if_block2.c();
    			add_location(h2, file$2, 149, 4, 4301);
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$2, 153, 12, 4462);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "email");
    			input0.required = true;
    			attr_dev(input0, "autocomplete", "email");
    			attr_dev(input0, "placeholder", "votre@email.com");
    			add_location(input0, file$2, 154, 12, 4509);
    			attr_dev(div0, "class", "form-group svelte-97oszj");
    			add_location(div0, file$2, 152, 8, 4425);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$2, 165, 12, 4805);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			input1.required = true;

    			attr_dev(input1, "autocomplete", input1_autocomplete_value = /*isRegisterMode*/ ctx[4]
    			? 'new-password'
    			: 'current-password');

    			attr_dev(input1, "placeholder", "Votre mot de passe");
    			add_location(input1, file$2, 166, 12, 4862);
    			attr_dev(div1, "class", "form-group svelte-97oszj");
    			add_location(div1, file$2, 164, 8, 4768);
    			attr_dev(button, "type", "submit");
    			button.disabled = /*loading*/ ctx[3];
    			add_location(button, file$2, 176, 8, 5179);
    			add_location(form, file$2, 151, 4, 4370);
    			attr_dev(div2, "class", "toggle-mode svelte-97oszj");
    			add_location(div2, file$2, 189, 4, 5515);
    			attr_dev(div3, "class", "auth-container svelte-97oszj");
    			add_location(div3, file$2, 148, 0, 4233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h2);
    			append_dev(h2, t0);
    			append_dev(div3, t1);
    			append_dev(div3, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t3);
    			append_dev(div0, input0);
    			set_input_value(input0, /*email*/ ctx[0]);
    			append_dev(form, t4);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t6);
    			append_dev(div1, input1);
    			set_input_value(input1, /*password*/ ctx[1]);
    			append_dev(form, t7);
    			append_dev(form, button);
    			append_dev(button, t8);
    			append_dev(form, t9);
    			if (if_block0) if_block0.m(form, null);
    			append_dev(form, t10);
    			if (if_block1) if_block1.m(form, null);
    			append_dev(div3, t11);
    			append_dev(div3, div2);
    			if_block2.m(div2, null);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[7]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[8]),
    					listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[5]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*isRegisterMode*/ 16 && t0_value !== (t0_value = (/*isRegisterMode*/ ctx[4]
    			? 'Créer un compte'
    			: 'Connexion') + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*email*/ 1 && input0.value !== /*email*/ ctx[0]) {
    				set_input_value(input0, /*email*/ ctx[0]);
    			}

    			if (dirty & /*isRegisterMode*/ 16 && input1_autocomplete_value !== (input1_autocomplete_value = /*isRegisterMode*/ ctx[4]
    			? 'new-password'
    			: 'current-password')) {
    				attr_dev(input1, "autocomplete", input1_autocomplete_value);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}

    			if (dirty & /*isRegisterMode*/ 16 && t8_value !== (t8_value = (/*isRegisterMode*/ ctx[4]
    			? 'S\'inscrire'
    			: 'Se connecter') + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*loading*/ 8) {
    				prop_dev(button, "disabled", /*loading*/ ctx[3]);
    			}

    			if (/*loading*/ ctx[3]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(form, t10);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*error*/ 4) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(form, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div2, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			transition_in(if_block1);

    			if (!div3_intro) {
    				add_render_callback(() => {
    					div3_intro = create_in_transition(div3, fly, { y: -20, duration: 400 });
    					div3_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const API_URL$1 = 'http://localhost:5000';

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	const dispatch = createEventDispatcher();
    	let email = '';
    	let password = '';
    	let error = '';
    	let loading = false;
    	let isRegisterMode = false;

    	async function handleSubmit() {
    		$$invalidate(2, error = '');
    		$$invalidate(3, loading = true);

    		// Validation simple côté client
    		if (!email || !password) {
    			$$invalidate(2, error = 'Veuillez remplir tous les champs');
    			$$invalidate(3, loading = false);
    			return;
    		}

    		// Validation email simple
    		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    		if (!emailRegex.test(email)) {
    			$$invalidate(2, error = 'Format d\'email invalide');
    			$$invalidate(3, loading = false);
    			return;
    		}

    		// Validation du mot de passe
    		if (password.length < 6) {
    			$$invalidate(2, error = 'Le mot de passe doit contenir au moins 6 caractères');
    			$$invalidate(3, loading = false);
    			return;
    		}

    		try {
    			const endpoint = isRegisterMode
    			? `${API_URL$1}/api/auth/register`
    			: `${API_URL$1}/api/auth/login`;

    			console.log('Tentative de connexion à:', endpoint);

    			const response = await fetch(endpoint, {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ email, password })
    			});

    			const data = await response.json();

    			if (!response.ok) {
    				$$invalidate(2, error = data.error || `Erreur de connexion: ${response.status} ${response.statusText}`);
    				$$invalidate(3, loading = false);
    				return;
    			}

    			if (isRegisterMode) {
    				// Si c'est une inscription réussie, passer en mode connexion
    				$$invalidate(4, isRegisterMode = false);

    				$$invalidate(0, email = '');
    				$$invalidate(1, password = '');
    				$$invalidate(2, error = '');
    				$$invalidate(3, loading = false);
    				return;
    			}

    			console.log('Connexion réussie, redirection...');
    			console.log('Token reçu du serveur:', data.access_token);

    			// Sauvegarder le token et les infos utilisateur
    			localStorage.setItem('auth_token', data.access_token);

    			localStorage.setItem('user', JSON.stringify(data.user));
    			console.log('Token et user stockés dans localStorage');

    			// Mettre à jour les stores
    			isAuthenticated.set(true);

    			currentUser.set(data.user);

    			// Informer le composant parent de la connexion réussie
    			dispatch('login-success');
    		} catch(err) {
    			console.error('Erreur de connexion détaillée:', err);
    			$$invalidate(2, error = 'Erreur de connexion au serveur. Vérifiez que le backend est accessible.');
    		} finally {
    			$$invalidate(3, loading = false);
    		}
    	}

    	function toggleMode() {
    		$$invalidate(4, isRegisterMode = !isRegisterMode);
    		$$invalidate(2, error = '');
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		fly,
    		isAuthenticated,
    		currentUser,
    		dispatch,
    		API_URL: API_URL$1,
    		email,
    		password,
    		error,
    		loading,
    		isRegisterMode,
    		handleSubmit,
    		toggleMode
    	});

    	$$self.$inject_state = $$props => {
    		if ('email' in $$props) $$invalidate(0, email = $$props.email);
    		if ('password' in $$props) $$invalidate(1, password = $$props.password);
    		if ('error' in $$props) $$invalidate(2, error = $$props.error);
    		if ('loading' in $$props) $$invalidate(3, loading = $$props.loading);
    		if ('isRegisterMode' in $$props) $$invalidate(4, isRegisterMode = $$props.isRegisterMode);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		password,
    		error,
    		loading,
    		isRegisterMode,
    		handleSubmit,
    		toggleMode,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/components/Sidebar.svelte generated by Svelte v3.59.2 */
    const file$1 = "src/components/Sidebar.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let t0;
    	let h2;
    	let t1_value = (/*$currentUser*/ ctx[0]?.username || 'Utilisateur') + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*$currentUser*/ ctx[0]?.email + "";
    	let t3;
    	let t4;
    	let nav;
    	let ul;
    	let li0;
    	let a0;
    	let t6;
    	let li1;
    	let a1;
    	let t8;
    	let li2;
    	let a2;
    	let t10;
    	let li3;
    	let a3;
    	let t12;
    	let li4;
    	let a4;
    	let t14;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			a0 = element("a");
    			a0.textContent = "Générer une carte";
    			t6 = space();
    			li1 = element("li");
    			a1 = element("a");
    			a1.textContent = "Statistique";
    			t8 = space();
    			li2 = element("li");
    			a2 = element("a");
    			a2.textContent = "Paramètre";
    			t10 = space();
    			li3 = element("li");
    			a3 = element("a");
    			a3.textContent = "Équipe";
    			t12 = space();
    			li4 = element("li");
    			a4 = element("a");
    			a4.textContent = "Historique";
    			t14 = space();
    			button = element("button");
    			button.textContent = "Déconnexion";
    			attr_dev(img, "class", "avatar svelte-146f3sj");
    			if (!src_url_equal(img.src, img_src_value = "https://www.gravatar.com/avatar/?d=identicon")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar utilisateur");
    			add_location(img, file$1, 93, 1, 1539);
    			attr_dev(h2, "class", "username svelte-146f3sj");
    			add_location(h2, file$1, 95, 1, 1640);
    			attr_dev(p, "class", "email svelte-146f3sj");
    			add_location(p, file$1, 96, 1, 1709);
    			attr_dev(a0, "href", "#carte");
    			attr_dev(a0, "class", "svelte-146f3sj");
    			add_location(a0, file$1, 100, 7, 1774);
    			add_location(li0, file$1, 100, 3, 1770);
    			attr_dev(a1, "href", "#statistique");
    			attr_dev(a1, "class", "svelte-146f3sj");
    			add_location(a1, file$1, 101, 7, 1825);
    			add_location(li1, file$1, 101, 3, 1821);
    			attr_dev(a2, "href", "#parametre");
    			attr_dev(a2, "class", "svelte-146f3sj");
    			add_location(a2, file$1, 102, 7, 1876);
    			add_location(li2, file$1, 102, 3, 1872);
    			attr_dev(a3, "href", "#equipe");
    			attr_dev(a3, "class", "svelte-146f3sj");
    			add_location(a3, file$1, 103, 7, 1923);
    			add_location(li3, file$1, 103, 3, 1919);
    			attr_dev(a4, "href", "#historique");
    			attr_dev(a4, "class", "svelte-146f3sj");
    			add_location(a4, file$1, 104, 7, 1964);
    			add_location(li4, file$1, 104, 3, 1960);
    			attr_dev(ul, "class", "svelte-146f3sj");
    			add_location(ul, file$1, 99, 2, 1762);
    			attr_dev(nav, "class", "svelte-146f3sj");
    			add_location(nav, file$1, 98, 1, 1754);
    			attr_dev(button, "class", "logout-btn svelte-146f3sj");
    			add_location(button, file$1, 108, 1, 2024);
    			attr_dev(div, "class", "sidebar svelte-146f3sj");
    			add_location(div, file$1, 91, 0, 1458);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);
    			append_dev(div, t4);
    			append_dev(div, nav);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, a0);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, a1);
    			append_dev(ul, t8);
    			append_dev(ul, li2);
    			append_dev(li2, a2);
    			append_dev(ul, t10);
    			append_dev(ul, li3);
    			append_dev(li3, a3);
    			append_dev(ul, t12);
    			append_dev(ul, li4);
    			append_dev(li4, a4);
    			append_dev(div, t14);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleLogout*/ ctx[1], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentUser*/ 1 && t1_value !== (t1_value = (/*$currentUser*/ ctx[0]?.username || 'Utilisateur') + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$currentUser*/ 1 && t3_value !== (t3_value = /*$currentUser*/ ctx[0]?.email + "")) set_data_dev(t3, t3_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $currentUser;
    	validate_store(currentUser, 'currentUser');
    	component_subscribe($$self, currentUser, $$value => $$invalidate(0, $currentUser = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);

    	function handleLogout() {
    		logout();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		currentUser,
    		logout,
    		handleLogout,
    		$currentUser
    	});

    	return [$currentUser, handleLogout];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;

    const file = "src/App.svelte";

    // (395:1) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let login;
    	let div_transition;
    	let current;
    	login = new Login({ $$inline: true });
    	login.$on("login-success", /*handleLoginSuccess*/ ctx[17]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "ActivMap";
    			t1 = space();
    			create_component(login.$$.fragment);
    			attr_dev(h1, "class", "svelte-1531khk");
    			add_location(h1, file, 397, 3, 9139);
    			attr_dev(div, "class", "card svelte-1531khk");
    			add_location(div, file, 396, 2, 9074);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			mount_component(login, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -20, duration: 600 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -20, duration: 600 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(login);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(395:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (328:1) {#if $isAuthenticated}
    function create_if_block(ctx) {
    	let sidebar;
    	let t0;
    	let div1;
    	let div0;
    	let h1;
    	let t2;
    	let form;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t5;
    	let input1;
    	let t6;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let label3;
    	let input3;
    	let t9;
    	let t10;
    	let button;
    	let t12;
    	let t13;
    	let div0_transition;
    	let t14;
    	let current;
    	let mounted;
    	let dispose;
    	sidebar = new Sidebar({ $$inline: true });
    	let if_block0 = /*loading*/ ctx[5] && create_if_block_3(ctx);
    	let if_block1 = /*error*/ ctx[6] && create_if_block_2(ctx);
    	let if_block2 = /*svgUrl*/ ctx[4] && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Générateur de carte stylisée";
    			t2 = space();
    			form = element("form");
    			label0 = element("label");
    			t3 = text("Latitude :\n\t\t\t\t\t");
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Longitude :\n\t\t\t\t\t");
    			input1 = element("input");
    			t6 = space();
    			label2 = element("label");
    			t7 = text("Distance (m) :\n\t\t\t\t\t");
    			input2 = element("input");
    			t8 = space();
    			label3 = element("label");
    			input3 = element("input");
    			t9 = text("\n\t\t\t\t\tUtiliser la version non-protégée (debug)");
    			t10 = space();
    			button = element("button");
    			button.textContent = "Générer la carte";
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			if (if_block1) if_block1.c();
    			t14 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "svelte-1531khk");
    			add_location(h1, file, 333, 3, 7078);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.000001");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1531khk");
    			add_location(input0, file, 337, 5, 7198);
    			attr_dev(label0, "class", "svelte-1531khk");
    			add_location(label0, file, 335, 4, 7169);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.000001");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1531khk");
    			add_location(input1, file, 341, 5, 7316);
    			attr_dev(label1, "class", "svelte-1531khk");
    			add_location(label1, file, 339, 4, 7286);
    			attr_dev(input2, "type", "number");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-1531khk");
    			add_location(input2, file, 345, 5, 7438);
    			attr_dev(label2, "class", "svelte-1531khk");
    			add_location(label2, file, 343, 4, 7405);
    			attr_dev(input3, "type", "checkbox");
    			attr_dev(input3, "class", "svelte-1531khk");
    			add_location(input3, file, 350, 5, 7604);
    			attr_dev(label3, "class", "checkbox-label svelte-1531khk");
    			add_location(label3, file, 349, 4, 7568);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-1531khk");
    			add_location(button, file, 354, 4, 7729);
    			attr_dev(form, "class", "svelte-1531khk");
    			add_location(form, file, 334, 3, 7119);
    			attr_dev(div0, "id", "carte");
    			attr_dev(div0, "class", "card svelte-1531khk");
    			add_location(div0, file, 332, 2, 7002);
    			attr_dev(div1, "class", "content-auth svelte-1531khk");
    			add_location(div1, file, 331, 2, 6973);
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, form);
    			append_dev(form, label0);
    			append_dev(label0, t3);
    			append_dev(label0, input0);
    			set_input_value(input0, /*latitude*/ ctx[1]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, t5);
    			append_dev(label1, input1);
    			set_input_value(input1, /*longitude*/ ctx[2]);
    			append_dev(form, t6);
    			append_dev(form, label2);
    			append_dev(label2, t7);
    			append_dev(label2, input2);
    			set_input_value(input2, /*distance*/ ctx[3]);
    			append_dev(form, t8);
    			append_dev(form, label3);
    			append_dev(label3, input3);
    			input3.checked = /*usePublicEndpoint*/ ctx[7];
    			append_dev(label3, t9);
    			append_dev(form, t10);
    			append_dev(form, button);
    			append_dev(div0, t12);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t13);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div1, t14);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[22]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[23]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[24]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[25]),
    					listen_dev(form, "submit", prevent_default(/*generateMap*/ ctx[9]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*latitude*/ 2 && to_number(input0.value) !== /*latitude*/ ctx[1]) {
    				set_input_value(input0, /*latitude*/ ctx[1]);
    			}

    			if (dirty[0] & /*longitude*/ 4 && to_number(input1.value) !== /*longitude*/ ctx[2]) {
    				set_input_value(input1, /*longitude*/ ctx[2]);
    			}

    			if (dirty[0] & /*distance*/ 8 && to_number(input2.value) !== /*distance*/ ctx[3]) {
    				set_input_value(input2, /*distance*/ ctx[3]);
    			}

    			if (dirty[0] & /*usePublicEndpoint*/ 128) {
    				input3.checked = /*usePublicEndpoint*/ ctx[7];
    			}

    			if (/*loading*/ ctx[5]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_3(ctx);
    					if_block0.c();
    					if_block0.m(div0, t13);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*svgUrl*/ ctx[4]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*svgUrl*/ 16) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: -20, duration: 600 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: -20, duration: 600 }, false);
    			div0_transition.run(0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching && div0_transition) div0_transition.end();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(328:1) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (357:3) {#if loading}
    function create_if_block_3(ctx) {
    	let div;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Génération en cours...";
    			attr_dev(div, "class", "loading-spinner svelte-1531khk");
    			add_location(div, file, 357, 4, 7809);
    			set_style(p, "text-align", "center");
    			add_location(p, file, 358, 4, 7849);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, p, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(357:3) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (361:3) {#if error}
    function create_if_block_2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[6]);
    			attr_dev(p, "class", "error svelte-1531khk");
    			add_location(p, file, 361, 4, 7935);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*error*/ 64) set_data_dev(t, /*error*/ ctx[6]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(361:3) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (366:2) {#if svgUrl}
    function create_if_block_1(ctx) {
    	let h2;
    	let h2_transition;
    	let t1;
    	let div2;
    	let div1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let button2;
    	let t7;
    	let img;
    	let img_src_value;
    	let img_transition;
    	let div2_transition;
    	let t8;
    	let div3;
    	let a;
    	let button3;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Carte générée :";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "+";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "–";
    			t5 = space();
    			button2 = element("button");
    			button2.textContent = "⟳";
    			t7 = space();
    			img = element("img");
    			t8 = space();
    			div3 = element("div");
    			a = element("a");
    			button3 = element("button");
    			button3.textContent = "Télécharger l'image SVG";
    			set_style(h2, "text-align", "center");
    			attr_dev(h2, "class", "svelte-1531khk");
    			add_location(h2, file, 366, 3, 8003);
    			attr_dev(button0, "aria-label", "Zoom In");
    			attr_dev(button0, "class", "svelte-1531khk");
    			add_location(button0, file, 380, 6, 8498);
    			attr_dev(button1, "aria-label", "Zoom Out");
    			attr_dev(button1, "class", "svelte-1531khk");
    			add_location(button1, file, 381, 6, 8562);
    			attr_dev(button2, "aria-label", "Rotate");
    			attr_dev(button2, "class", "svelte-1531khk");
    			add_location(button2, file, 382, 6, 8628);
    			attr_dev(div0, "class", "zoom-controls svelte-1531khk");
    			add_location(div0, file, 379, 5, 8464);
    			if (!src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Carte stylisée");
    			attr_dev(img, "class", "svelte-1531khk");
    			set_style(img, "transform", /*transformValue*/ ctx[8]);
    			add_location(img, file, 384, 5, 8705);
    			attr_dev(div1, "class", "svg-container svelte-1531khk");
    			attr_dev(div1, "role", "application");
    			attr_dev(div1, "aria-label", "Carte stylisée");
    			add_location(div1, file, 369, 4, 8211);
    			attr_dev(div2, "class", "card svelte-1531khk");
    			add_location(div2, file, 367, 3, 8075);
    			attr_dev(button3, "class", "svelte-1531khk");
    			add_location(button3, file, 389, 5, 8931);
    			attr_dev(a, "download", "carte.svg");
    			attr_dev(a, "href", /*svgUrl*/ ctx[4]);
    			add_location(a, file, 388, 4, 8887);
    			attr_dev(div3, "class", "download-container svelte-1531khk");
    			add_location(div3, file, 387, 3, 8850);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			append_dev(div0, t5);
    			append_dev(div0, button2);
    			append_dev(div1, t7);
    			append_dev(div1, img);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, a);
    			append_dev(a, button3);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*zoomIn*/ ctx[11], false, false, false, false),
    					listen_dev(button1, "click", /*zoomOut*/ ctx[12], false, false, false, false),
    					listen_dev(button2, "click", /*rotateMap*/ ctx[13], false, false, false, false),
    					listen_dev(div1, "wheel", prevent_default(/*handleWheel*/ ctx[10]), false, true, false, false),
    					listen_dev(div1, "mousedown", /*startDrag*/ ctx[14], false, false, false, false),
    					listen_dev(div1, "mousemove", /*drag*/ ctx[15], false, false, false, false),
    					listen_dev(div1, "mouseup", /*endDrag*/ ctx[16], false, false, false, false),
    					listen_dev(div1, "mouseleave", /*endDrag*/ ctx[16], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*svgUrl*/ 16 && !src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[4])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*transformValue*/ 256) {
    				set_style(img, "transform", /*transformValue*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*svgUrl*/ 16) {
    				attr_dev(a, "href", /*svgUrl*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (!h2_transition) h2_transition = create_bidirectional_transition(h2, fade, {}, true);
    				h2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!current) return;
    				if (!img_transition) img_transition = create_bidirectional_transition(img, scale, { duration: 400 }, true);
    				img_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { y: 20, duration: 600 }, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!h2_transition) h2_transition = create_bidirectional_transition(h2, fade, {}, false);
    			h2_transition.run(0);
    			if (!img_transition) img_transition = create_bidirectional_transition(img, scale, { duration: 400 }, false);
    			img_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { y: 20, duration: 600 }, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching && h2_transition) h2_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching && img_transition) img_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(366:2) {#if svgUrl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$isAuthenticated*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			if_block.c();
    			attr_dev(main, "class", "svelte-1531khk");
    			add_location(main, file, 326, 0, 6892);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const API_URL = 'http://localhost:5000';
    const minScale = 0.5;
    const maxScale = 3.0;

    function instance($$self, $$props, $$invalidate) {
    	let transformValue;
    	let $isAuthenticated;
    	validate_store(isAuthenticated, 'isAuthenticated');
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(0, $isAuthenticated = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let latitude = 49.444838;
    	let longitude = 1.094214;
    	let distance = 150;
    	let svgUrl = "";
    	let loading = false;
    	let error = "";
    	let scale$1 = 1.0;
    	let rotate = 0; // Angle de rotation en degrés

    	// Flag pour utiliser l'endpoint public (non-protégé)
    	let usePublicEndpoint = false;

    	// Variables pour le panning
    	let translateX = 0;

    	let translateY = 0;
    	let isDragging = false;
    	let initialDragX = 0;
    	let initialDragY = 0;
    	let initialTranslateX = 0;
    	let initialTranslateY = 0;

    	// Vérifier l'authentification au démarrage
    	onMount(() => {
    		// Vérifier l'authentification sans forcer la déconnexion
    		checkAuth();
    	});

    	async function generateMap() {
    		$$invalidate(5, loading = true);
    		$$invalidate(6, error = "");
    		$$invalidate(4, svgUrl = "");

    		// Réinitialise zoom, rotation et panning
    		$$invalidate(18, scale$1 = 1.0);

    		$$invalidate(19, rotate = 0);
    		$$invalidate(20, translateX = 0);
    		$$invalidate(21, translateY = 0);

    		try {
    			// Choisir l'endpoint en fonction du flag
    			const endpoint = usePublicEndpoint
    			? `${API_URL}/generate-public`
    			: `${API_URL}/generate-map`;

    			console.log("Endpoint utilisé:", endpoint);

    			const response = await fetchWithAuth(endpoint, {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ latitude, longitude, distance })
    			});

    			if (!response.ok) {
    				if (response.status === 401) {
    					$$invalidate(6, error = "Vous devez être connecté pour générer une carte.");
    					set_store_value(isAuthenticated, $isAuthenticated = false, $isAuthenticated);
    				} else {
    					const errData = await response.json();
    					$$invalidate(6, error = errData.error || "Erreur lors de la génération de la carte.");
    				}
    			} else {
    				const blob = await response.blob();
    				$$invalidate(4, svgUrl = URL.createObjectURL(blob));
    			}
    		} catch(err) {
    			$$invalidate(6, error = "Erreur réseau : " + err);
    		} finally {
    			$$invalidate(5, loading = false);
    		}
    	}

    	function handleWheel(e) {
    		e.preventDefault();

    		if (e.deltaY < 0) {
    			$$invalidate(18, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    		} else {
    			$$invalidate(18, scale$1 = Math.max(minScale, scale$1 / 1.1));
    		}
    	}

    	function zoomIn() {
    		$$invalidate(18, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    	}

    	function zoomOut() {
    		$$invalidate(18, scale$1 = Math.max(minScale, scale$1 / 1.1));
    	}

    	// Incrémente la rotation de 15 degrés à chaque clic
    	function rotateMap() {
    		$$invalidate(19, rotate = rotate + 15);
    	}

    	function startDrag(e) {
    		isDragging = true;
    		initialDragX = e.clientX;
    		initialDragY = e.clientY;
    		initialTranslateX = translateX;
    		initialTranslateY = translateY;
    	}

    	function drag(e) {
    		if (isDragging) {
    			const dx = e.clientX - initialDragX;
    			const dy = e.clientY - initialDragY;
    			$$invalidate(20, translateX = initialTranslateX + dx);
    			$$invalidate(21, translateY = initialTranslateY + dy);
    		}
    	}

    	function endDrag() {
    		isDragging = false;
    	}

    	function handleLogout() {
    		logout();
    		$$invalidate(4, svgUrl = "");
    	}

    	function handleLoginSuccess() {
    		// Rafraîchir l'état d'authentification
    		checkAuth();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		latitude = to_number(this.value);
    		$$invalidate(1, latitude);
    	}

    	function input1_input_handler() {
    		longitude = to_number(this.value);
    		$$invalidate(2, longitude);
    	}

    	function input2_input_handler() {
    		distance = to_number(this.value);
    		$$invalidate(3, distance);
    	}

    	function input3_change_handler() {
    		usePublicEndpoint = this.checked;
    		$$invalidate(7, usePublicEndpoint);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		scaleTransition: scale,
    		onMount,
    		Login,
    		Sidebar,
    		isAuthenticated,
    		currentUser,
    		checkAuth,
    		logout,
    		fetchWithAuth,
    		API_URL,
    		latitude,
    		longitude,
    		distance,
    		svgUrl,
    		loading,
    		error,
    		scale: scale$1,
    		minScale,
    		maxScale,
    		rotate,
    		usePublicEndpoint,
    		translateX,
    		translateY,
    		isDragging,
    		initialDragX,
    		initialDragY,
    		initialTranslateX,
    		initialTranslateY,
    		generateMap,
    		handleWheel,
    		zoomIn,
    		zoomOut,
    		rotateMap,
    		startDrag,
    		drag,
    		endDrag,
    		handleLogout,
    		handleLoginSuccess,
    		transformValue,
    		$isAuthenticated
    	});

    	$$self.$inject_state = $$props => {
    		if ('latitude' in $$props) $$invalidate(1, latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate(2, longitude = $$props.longitude);
    		if ('distance' in $$props) $$invalidate(3, distance = $$props.distance);
    		if ('svgUrl' in $$props) $$invalidate(4, svgUrl = $$props.svgUrl);
    		if ('loading' in $$props) $$invalidate(5, loading = $$props.loading);
    		if ('error' in $$props) $$invalidate(6, error = $$props.error);
    		if ('scale' in $$props) $$invalidate(18, scale$1 = $$props.scale);
    		if ('rotate' in $$props) $$invalidate(19, rotate = $$props.rotate);
    		if ('usePublicEndpoint' in $$props) $$invalidate(7, usePublicEndpoint = $$props.usePublicEndpoint);
    		if ('translateX' in $$props) $$invalidate(20, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(21, translateY = $$props.translateY);
    		if ('isDragging' in $$props) isDragging = $$props.isDragging;
    		if ('initialDragX' in $$props) initialDragX = $$props.initialDragX;
    		if ('initialDragY' in $$props) initialDragY = $$props.initialDragY;
    		if ('initialTranslateX' in $$props) initialTranslateX = $$props.initialTranslateX;
    		if ('initialTranslateY' in $$props) initialTranslateY = $$props.initialTranslateY;
    		if ('transformValue' in $$props) $$invalidate(8, transformValue = $$props.transformValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*$isAuthenticated*/ 1) {
    			// État d'authentification forcé à false au démarrage
    			console.log("État d'authentification:", $isAuthenticated);
    		}

    		if ($$self.$$.dirty[0] & /*translateX, translateY, rotate, scale*/ 3932160) {
    			// Transformation combinée : translation, rotation et zoom
    			$$invalidate(8, transformValue = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale$1})`);
    		}
    	};

    	return [
    		$isAuthenticated,
    		latitude,
    		longitude,
    		distance,
    		svgUrl,
    		loading,
    		error,
    		usePublicEndpoint,
    		transformValue,
    		generateMap,
    		handleWheel,
    		zoomIn,
    		zoomOut,
    		rotateMap,
    		startDrag,
    		drag,
    		endDrag,
    		handleLoginSuccess,
    		scale$1,
    		rotate,
    		translateX,
    		translateY,
    		input0_input_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_change_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {}, null, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
