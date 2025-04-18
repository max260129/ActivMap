
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
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
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
    function empty() {
        return text('');
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
    function select_option(select, value, mounting) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        if (!mounting || value !== undefined) {
            select.selectedIndex = -1; // no option should be selected
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked');
        return selected_option && selected_option.__value;
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

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    const { console: console_1$3 } = globals;
    const file$6 = "src/components/Login.svelte";

    // (181:8) {#if loading}
    function create_if_block_2$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "loading-spinner svelte-97oszj");
    			add_location(div, file$6, 181, 12, 5344);
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
    			add_location(p, file$6, 185, 12, 5435);
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
    function create_else_block$2(ctx) {
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
    			add_location(span, file$6, 193, 35, 5716);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(193:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (191:8) {#if isRegisterMode}
    function create_if_block$3(ctx) {
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
    			add_location(span, file$6, 191, 27, 5597);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(191:8) {#if isRegisterMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
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
    		if (/*isRegisterMode*/ ctx[4]) return create_if_block$3;
    		return create_else_block$2;
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
    			add_location(h2, file$6, 149, 4, 4301);
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$6, 153, 12, 4462);
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "email");
    			input0.required = true;
    			attr_dev(input0, "autocomplete", "email");
    			attr_dev(input0, "placeholder", "votre@email.com");
    			add_location(input0, file$6, 154, 12, 4509);
    			attr_dev(div0, "class", "form-group svelte-97oszj");
    			add_location(div0, file$6, 152, 8, 4425);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$6, 165, 12, 4805);
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			input1.required = true;

    			attr_dev(input1, "autocomplete", input1_autocomplete_value = /*isRegisterMode*/ ctx[4]
    			? 'new-password'
    			: 'current-password');

    			attr_dev(input1, "placeholder", "Votre mot de passe");
    			add_location(input1, file$6, 166, 12, 4862);
    			attr_dev(div1, "class", "form-group svelte-97oszj");
    			add_location(div1, file$6, 164, 8, 4768);
    			attr_dev(button, "type", "submit");
    			button.disabled = /*loading*/ ctx[3];
    			add_location(button, file$6, 176, 8, 5179);
    			add_location(form, file$6, 151, 4, 4370);
    			attr_dev(div2, "class", "toggle-mode svelte-97oszj");
    			add_location(div2, file$6, 189, 4, 5515);
    			attr_dev(div3, "class", "auth-container svelte-97oszj");
    			add_location(div3, file$6, 148, 0, 4233);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const API_URL$1 = 'http://localhost:5000';

    function instance$6($$self, $$props, $$invalidate) {
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$3.warn(`<Login> was created with unknown prop '${key}'`);
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    const preferences = writable({
      map_style: 'dark',
      default_distance: 150,
      max_points: 5000,
      language: 'fr',
      notifications_enabled: true,
      username: '',
      email: ''
    });

    const locale = writable('fr');

    preferences.subscribe(p => {
      if (p && p.language) {
        locale.set(p.language);
      }
    });

    const dict = {
      fr: {
        map_generator: 'Générateur de carte stylisée',
        latitude: 'Latitude',
        longitude: 'Longitude',
        distance: 'Distance (m)',
        generate_map: 'Générer la carte',
        generated_map: 'Carte générée :',
        download_svg: "Télécharger l'image SVG",
        settings: 'Paramètres',
        map_settings: 'Paramètres de carte',
        map_style: 'Style de carte',
        default_distance: 'Distance par défaut (m)',
        max_points: 'Points maximum',
        general_prefs: 'Préférences générales',
        enable_notifications: 'Activer les notifications',
        language: 'Langue',
        account_settings: 'Paramètres du compte',
        username: "Nom d'utilisateur", 
        email: 'Email',
        change_password: 'Changer le mot de passe',
        save: 'Enregistrer les modifications',
        reset: 'Réinitialiser',
        sidebar_map: 'Carte',
        sidebar_stats: 'Statistiques',
        sidebar_settings: 'Paramètres',
        sidebar_team: 'Équipe',
        sidebar_history: 'Historique',
        logout: 'Déconnexion',
      },
      en: {
        map_generator: 'Stylized Map Generator',
        latitude: 'Latitude',
        longitude: 'Longitude',
        distance: 'Distance (m)',
        generate_map: 'Generate Map',
        generated_map: 'Generated Map:',
        download_svg: 'Download SVG image',
        settings: 'Settings',
        map_settings: 'Map settings',
        map_style: 'Map style',
        default_distance: 'Default distance (m)',
        max_points: 'Maximum points',
        general_prefs: 'General preferences',
        enable_notifications: 'Enable notifications',
        language: 'Language',
        account_settings: 'Account settings',
        username: 'Username',
        email: 'Email',
        change_password: 'Change password',
        save: 'Save changes',
        reset: 'Reset',
        sidebar_map: 'Map',
        sidebar_stats: 'Statistics',
        sidebar_settings: 'Settings',
        sidebar_team: 'Team',
        sidebar_history: 'History',
        logout: 'Logout',
      }
    };

    function t(key, lang = null) {
      const l = lang || get_store_value(locale);
      return (dict[l] && dict[l][key]) || dict['fr'][key] || key;
    }

    /* src/components/Sidebar.svelte generated by Svelte v3.59.2 */
    const file$5 = "src/components/Sidebar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (37:3) {#each menu as item (item.id)}
    function create_each_block$2(key_1, ctx) {
    	let a;
    	let t0_value = /*item*/ ctx[3].label() + "";
    	let t0;
    	let t1;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(a, "href", `#${/*item*/ ctx[3].id}`);
    			attr_dev(a, "class", "menu-item svelte-1wvfsqf");
    			attr_dev(a, "aria-current", "page");
    			add_location(a, file$5, 37, 2, 988);
    			this.first = a;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			append_dev(a, t0);
    			append_dev(a, t1);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(37:3) {#each menu as item (item.id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let aside;
    	let section;
    	let img;
    	let img_src_value;
    	let t0;
    	let div;
    	let h2;
    	let t1_value = (/*$currentUser*/ ctx[0]?.username || "Utilisateur") + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*$currentUser*/ ctx[0]?.email + "";
    	let t3;
    	let t4;
    	let nav;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t5;
    	let button;
    	let mounted;
    	let dispose;
    	let each_value = /*menu*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*item*/ ctx[3].id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			section = element("section");
    			img = element("img");
    			t0 = space();
    			div = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			nav = element("nav");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			button = element("button");
    			button.textContent = `${t('logout')}`;
    			attr_dev(img, "class", "avatar svelte-1wvfsqf");
    			if (!src_url_equal(img.src, img_src_value = "https://www.gravatar.com/avatar/?d=identicon")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar utilisateur");
    			add_location(img, file$5, 23, 3, 603);
    			attr_dev(h2, "class", "username svelte-1wvfsqf");
    			add_location(h2, file$5, 29, 2, 740);
    			attr_dev(p, "class", "email svelte-1wvfsqf");
    			add_location(p, file$5, 30, 2, 812);
    			attr_dev(div, "class", "user-info");
    			add_location(div, file$5, 28, 3, 714);
    			attr_dev(section, "class", "profile svelte-1wvfsqf");
    			add_location(section, file$5, 22, 1, 574);
    			attr_dev(nav, "class", "menu svelte-1wvfsqf");
    			attr_dev(nav, "aria-label", "Navigation principale");
    			add_location(nav, file$5, 35, 1, 898);
    			attr_dev(button, "class", "logout svelte-1wvfsqf");
    			add_location(button, file$5, 44, 1, 1124);
    			attr_dev(aside, "class", "sidebar svelte-1wvfsqf");
    			add_location(aside, file$5, 20, 2, 531);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, section);
    			append_dev(section, img);
    			append_dev(section, t0);
    			append_dev(section, div);
    			append_dev(div, h2);
    			append_dev(h2, t1);
    			append_dev(div, t2);
    			append_dev(div, p);
    			append_dev(p, t3);
    			append_dev(aside, t4);
    			append_dev(aside, nav);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(nav, null);
    				}
    			}

    			append_dev(aside, t5);
    			append_dev(aside, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*handleLogout*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentUser*/ 1 && t1_value !== (t1_value = (/*$currentUser*/ ctx[0]?.username || "Utilisateur") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$currentUser*/ 1 && t3_value !== (t3_value = /*$currentUser*/ ctx[0]?.email + "")) set_data_dev(t3, t3_value);

    			if (dirty & /*menu*/ 2) {
    				each_value = /*menu*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, nav, destroy_block, create_each_block$2, null, get_each_context$2);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $currentUser;
    	validate_store(currentUser, 'currentUser');
    	component_subscribe($$self, currentUser, $$value => $$invalidate(0, $currentUser = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Sidebar', slots, []);

    	const menu = [
    		{
    			id: "carte",
    			label: () => t('sidebar_map')
    		},
    		{
    			id: "statistique",
    			label: () => t('sidebar_stats')
    		},
    		{
    			id: "parametre",
    			label: () => t('sidebar_settings')
    		},
    		{
    			id: "equipe",
    			label: () => t('sidebar_team')
    		},
    		{
    			id: "historique",
    			label: () => t('sidebar_history')
    		}
    	];

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
    		t,
    		menu,
    		handleLogout,
    		$currentUser
    	});

    	return [$currentUser, menu, handleLogout];
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Sidebar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/Statistique.svelte generated by Svelte v3.59.2 */
    const file$4 = "src/pages/Statistique.svelte";

    function create_fragment$4(ctx) {
    	let sidebar;
    	let t0;
    	let div7;
    	let div6;
    	let h1;
    	let t2;
    	let div3;
    	let div0;
    	let h30;
    	let t4;
    	let p0;
    	let t6;
    	let div1;
    	let h31;
    	let t8;
    	let p1;
    	let t10;
    	let div2;
    	let h32;
    	let t12;
    	let p2;
    	let t14;
    	let div5;
    	let h2;
    	let t16;
    	let div4;
    	let p3;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Statistiques";
    			t2 = space();
    			div3 = element("div");
    			div0 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Cartes générées";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "24";
    			t6 = space();
    			div1 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Distance totale";
    			t8 = space();
    			p1 = element("p");
    			p1.textContent = "125 km";
    			t10 = space();
    			div2 = element("div");
    			h32 = element("h3");
    			h32.textContent = "Utilisation hebdomadaire";
    			t12 = space();
    			p2 = element("p");
    			p2.textContent = "+15%";
    			t14 = space();
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Activité mensuelle";
    			t16 = space();
    			div4 = element("div");
    			p3 = element("p");
    			p3.textContent = "Graphique d'activité (données à venir)";
    			attr_dev(h1, "class", "svelte-1jf6u2l");
    			add_location(h1, file$4, 8, 4, 139);
    			add_location(h30, file$4, 11, 8, 233);
    			attr_dev(p0, "class", "stat-value svelte-1jf6u2l");
    			add_location(p0, file$4, 12, 8, 266);
    			attr_dev(div0, "class", "stat-card svelte-1jf6u2l");
    			add_location(div0, file$4, 10, 6, 201);
    			add_location(h31, file$4, 15, 8, 346);
    			attr_dev(p1, "class", "stat-value svelte-1jf6u2l");
    			add_location(p1, file$4, 16, 8, 379);
    			attr_dev(div1, "class", "stat-card svelte-1jf6u2l");
    			add_location(div1, file$4, 14, 6, 314);
    			add_location(h32, file$4, 19, 8, 463);
    			attr_dev(p2, "class", "stat-value svelte-1jf6u2l");
    			add_location(p2, file$4, 20, 8, 505);
    			attr_dev(div2, "class", "stat-card svelte-1jf6u2l");
    			add_location(div2, file$4, 18, 6, 431);
    			attr_dev(div3, "class", "stats-container svelte-1jf6u2l");
    			add_location(div3, file$4, 9, 4, 165);
    			attr_dev(h2, "class", "svelte-1jf6u2l");
    			add_location(h2, file$4, 24, 6, 600);
    			add_location(p3, file$4, 26, 8, 674);
    			attr_dev(div4, "class", "graph-placeholder svelte-1jf6u2l");
    			add_location(div4, file$4, 25, 6, 634);
    			attr_dev(div5, "class", "graph-container svelte-1jf6u2l");
    			add_location(div5, file$4, 23, 4, 564);
    			attr_dev(div6, "class", "card svelte-1jf6u2l");
    			add_location(div6, file$4, 7, 2, 116);
    			attr_dev(div7, "class", "content-auth svelte-1jf6u2l");
    			add_location(div7, file$4, 6, 0, 87);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, h1);
    			append_dev(div6, t2);
    			append_dev(div6, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h30);
    			append_dev(div0, t4);
    			append_dev(div0, p0);
    			append_dev(div3, t6);
    			append_dev(div3, div1);
    			append_dev(div1, h31);
    			append_dev(div1, t8);
    			append_dev(div1, p1);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, h32);
    			append_dev(div2, t12);
    			append_dev(div2, p2);
    			append_dev(div6, t14);
    			append_dev(div6, div5);
    			append_dev(div5, h2);
    			append_dev(div5, t16);
    			append_dev(div5, div4);
    			append_dev(div4, p3);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Statistique', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Statistique> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Sidebar });
    	return [];
    }

    class Statistique extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Statistique",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const BASE$1 = '/settings';

    async function getSettings() {
      const res = await fetchWithAuth(BASE$1);
      if (!res.ok) throw new Error('Erreur récupération paramètres');
      return await res.json();
    }

    async function updateSettings(payload) {
      const res = await fetchWithAuth(BASE$1, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Erreur mise à jour paramètres');
      return await res.json();
    }

    var settings = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getSettings: getSettings,
        updateSettings: updateSettings
    });

    /* src/pages/Parametre.svelte generated by Svelte v3.59.2 */

    const { console: console_1$2 } = globals;
    const file$3 = "src/pages/Parametre.svelte";

    // (146:4) {#if message}
    function create_if_block$2(ctx) {
    	let p;
    	let t_1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t_1 = text(/*message*/ ctx[7]);
    			set_style(p, "color", "#0f0");
    			add_location(p, file$3, 146, 6, 3981);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 128) set_data_dev(t_1, /*message*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(146:4) {#if message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let sidebar;
    	let t0;
    	let div12;
    	let div11;
    	let h1;
    	let t2;
    	let div3;
    	let h20;
    	let t4;
    	let div0;
    	let label0;
    	let t6;
    	let select0;
    	let option0;
    	let option1;
    	let option2;
    	let t10;
    	let div1;
    	let label1;
    	let t12;
    	let input0;
    	let t13;
    	let div2;
    	let label2;
    	let t15;
    	let input1;
    	let t16;
    	let div6;
    	let h21;
    	let t18;
    	let div4;
    	let label3;
    	let input2;
    	let t19;
    	let t20_value = t('enable_notifications') + "";
    	let t20;
    	let t21;
    	let div5;
    	let label4;
    	let t23;
    	let select1;
    	let option3;
    	let option4;
    	let t26;
    	let div9;
    	let h22;
    	let t28;
    	let div7;
    	let label5;
    	let t30;
    	let input3;
    	let t31;
    	let div8;
    	let label6;
    	let t33;
    	let input4;
    	let t34;
    	let button0;
    	let t36;
    	let t37;
    	let div10;
    	let button1;
    	let t39;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;
    	sidebar = new Sidebar({ $$inline: true });
    	let if_block = /*message*/ ctx[7] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div12 = element("div");
    			div11 = element("div");
    			h1 = element("h1");
    			h1.textContent = `${t('settings')}`;
    			t2 = space();
    			div3 = element("div");
    			h20 = element("h2");
    			h20.textContent = `${t('map_settings')}`;
    			t4 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = `${t('map_style')}`;
    			t6 = space();
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Sombre";
    			option1 = element("option");
    			option1.textContent = "Clair";
    			option2 = element("option");
    			option2.textContent = "Satellite";
    			t10 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = `${t('default_distance')}`;
    			t12 = space();
    			input0 = element("input");
    			t13 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = `${t('max_points')}`;
    			t15 = space();
    			input1 = element("input");
    			t16 = space();
    			div6 = element("div");
    			h21 = element("h2");
    			h21.textContent = `${t('general_prefs')}`;
    			t18 = space();
    			div4 = element("div");
    			label3 = element("label");
    			input2 = element("input");
    			t19 = space();
    			t20 = text(t20_value);
    			t21 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = `${t('language')}`;
    			t23 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Français";
    			option4 = element("option");
    			option4.textContent = "English";
    			t26 = space();
    			div9 = element("div");
    			h22 = element("h2");
    			h22.textContent = `${t('account_settings')}`;
    			t28 = space();
    			div7 = element("div");
    			label5 = element("label");
    			label5.textContent = `${t('username')}`;
    			t30 = space();
    			input3 = element("input");
    			t31 = space();
    			div8 = element("div");
    			label6 = element("label");
    			label6.textContent = `${t('email')}`;
    			t33 = space();
    			input4 = element("input");
    			t34 = space();
    			button0 = element("button");
    			button0.textContent = `${t('change_password')}`;
    			t36 = space();
    			if (if_block) if_block.c();
    			t37 = space();
    			div10 = element("div");
    			button1 = element("button");
    			button1.textContent = `${t('save')}`;
    			t39 = space();
    			button2 = element("button");
    			button2.textContent = `${t('reset')}`;
    			attr_dev(h1, "class", "svelte-fhtsrc");
    			add_location(h1, file$3, 88, 4, 2046);
    			attr_dev(h20, "class", "svelte-fhtsrc");
    			add_location(h20, file$3, 91, 6, 2117);
    			attr_dev(label0, "for", "mapStyle");
    			attr_dev(label0, "class", "svelte-fhtsrc");
    			add_location(label0, file$3, 93, 8, 2185);
    			option0.__value = "dark";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 95, 10, 2295);
    			option1.__value = "light";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 96, 10, 2342);
    			option2.__value = "satellite";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 97, 10, 2389);
    			attr_dev(select0, "id", "mapStyle");
    			attr_dev(select0, "class", "svelte-fhtsrc");
    			if (/*mapStyle*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[10].call(select0));
    			add_location(select0, file$3, 94, 8, 2240);
    			attr_dev(div0, "class", "form-group svelte-fhtsrc");
    			add_location(div0, file$3, 92, 6, 2152);
    			attr_dev(label1, "for", "defaultDistance");
    			attr_dev(label1, "class", "svelte-fhtsrc");
    			add_location(label1, file$3, 102, 8, 2511);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "id", "defaultDistance");
    			attr_dev(input0, "min", "50");
    			attr_dev(input0, "max", "1000");
    			attr_dev(input0, "class", "svelte-fhtsrc");
    			add_location(input0, file$3, 103, 8, 2580);
    			attr_dev(div1, "class", "form-group svelte-fhtsrc");
    			add_location(div1, file$3, 101, 6, 2478);
    			attr_dev(label2, "for", "maxPoints");
    			attr_dev(label2, "class", "svelte-fhtsrc");
    			add_location(label2, file$3, 107, 8, 2733);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "maxPoints");
    			attr_dev(input1, "min", "1000");
    			attr_dev(input1, "max", "10000");
    			attr_dev(input1, "class", "svelte-fhtsrc");
    			add_location(input1, file$3, 108, 8, 2790);
    			attr_dev(div2, "class", "form-group svelte-fhtsrc");
    			add_location(div2, file$3, 106, 6, 2700);
    			attr_dev(div3, "class", "settings-section svelte-fhtsrc");
    			add_location(div3, file$3, 90, 4, 2080);
    			attr_dev(h21, "class", "svelte-fhtsrc");
    			add_location(h21, file$3, 113, 6, 2945);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-fhtsrc");
    			add_location(input2, file$3, 116, 10, 3047);
    			attr_dev(label3, "class", "svelte-fhtsrc");
    			add_location(label3, file$3, 115, 8, 3029);
    			attr_dev(div4, "class", "form-group checkbox-group svelte-fhtsrc");
    			add_location(div4, file$3, 114, 6, 2981);
    			attr_dev(label4, "for", "language");
    			attr_dev(label4, "class", "svelte-fhtsrc");
    			add_location(label4, file$3, 122, 8, 3223);
    			option3.__value = "fr";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 124, 10, 3332);
    			option4.__value = "en";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 125, 10, 3379);
    			attr_dev(select1, "id", "language");
    			attr_dev(select1, "class", "svelte-fhtsrc");
    			if (/*language*/ ctx[4] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[14].call(select1));
    			add_location(select1, file$3, 123, 8, 3277);
    			attr_dev(div5, "class", "form-group svelte-fhtsrc");
    			add_location(div5, file$3, 121, 6, 3190);
    			attr_dev(div6, "class", "settings-section svelte-fhtsrc");
    			add_location(div6, file$3, 112, 4, 2908);
    			attr_dev(h22, "class", "svelte-fhtsrc");
    			add_location(h22, file$3, 131, 6, 3503);
    			attr_dev(label5, "for", "username");
    			attr_dev(label5, "class", "svelte-fhtsrc");
    			add_location(label5, file$3, 133, 8, 3575);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", "username");
    			attr_dev(input3, "class", "svelte-fhtsrc");
    			add_location(input3, file$3, 134, 8, 3629);
    			attr_dev(div7, "class", "form-group svelte-fhtsrc");
    			add_location(div7, file$3, 132, 6, 3542);
    			attr_dev(label6, "for", "email");
    			attr_dev(label6, "class", "svelte-fhtsrc");
    			add_location(label6, file$3, 138, 8, 3746);
    			attr_dev(input4, "type", "email");
    			attr_dev(input4, "id", "email");
    			attr_dev(input4, "class", "svelte-fhtsrc");
    			add_location(input4, file$3, 139, 8, 3794);
    			attr_dev(div8, "class", "form-group svelte-fhtsrc");
    			add_location(div8, file$3, 137, 6, 3713);
    			attr_dev(button0, "class", "btn-change-password svelte-fhtsrc");
    			add_location(button0, file$3, 142, 6, 3873);
    			attr_dev(div9, "class", "settings-section svelte-fhtsrc");
    			add_location(div9, file$3, 130, 4, 3466);
    			attr_dev(button1, "class", "btn-save svelte-fhtsrc");
    			add_location(button1, file$3, 149, 6, 4067);
    			attr_dev(button2, "class", "btn-reset svelte-fhtsrc");
    			attr_dev(button2, "type", "button");
    			add_location(button2, file$3, 150, 6, 4150);
    			attr_dev(div10, "class", "action-buttons svelte-fhtsrc");
    			add_location(div10, file$3, 148, 4, 4032);
    			attr_dev(div11, "class", "card svelte-fhtsrc");
    			add_location(div11, file$3, 87, 2, 2023);
    			attr_dev(div12, "class", "content-auth svelte-fhtsrc");
    			add_location(div12, file$3, 86, 0, 1994);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div11);
    			append_dev(div11, h1);
    			append_dev(div11, t2);
    			append_dev(div11, div3);
    			append_dev(div3, h20);
    			append_dev(div3, t4);
    			append_dev(div3, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t6);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			append_dev(select0, option1);
    			append_dev(select0, option2);
    			select_option(select0, /*mapStyle*/ ctx[0], true);
    			append_dev(div3, t10);
    			append_dev(div3, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t12);
    			append_dev(div1, input0);
    			set_input_value(input0, /*defaultDistance*/ ctx[1]);
    			append_dev(div3, t13);
    			append_dev(div3, div2);
    			append_dev(div2, label2);
    			append_dev(div2, t15);
    			append_dev(div2, input1);
    			set_input_value(input1, /*maxPoints*/ ctx[2]);
    			append_dev(div11, t16);
    			append_dev(div11, div6);
    			append_dev(div6, h21);
    			append_dev(div6, t18);
    			append_dev(div6, div4);
    			append_dev(div4, label3);
    			append_dev(label3, input2);
    			input2.checked = /*notificationsEnabled*/ ctx[3];
    			append_dev(label3, t19);
    			append_dev(label3, t20);
    			append_dev(div6, t21);
    			append_dev(div6, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t23);
    			append_dev(div5, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			select_option(select1, /*language*/ ctx[4], true);
    			append_dev(div11, t26);
    			append_dev(div11, div9);
    			append_dev(div9, h22);
    			append_dev(div9, t28);
    			append_dev(div9, div7);
    			append_dev(div7, label5);
    			append_dev(div7, t30);
    			append_dev(div7, input3);
    			set_input_value(input3, /*username*/ ctx[5]);
    			append_dev(div9, t31);
    			append_dev(div9, div8);
    			append_dev(div8, label6);
    			append_dev(div8, t33);
    			append_dev(div8, input4);
    			set_input_value(input4, /*email*/ ctx[6]);
    			append_dev(div9, t34);
    			append_dev(div9, button0);
    			append_dev(div11, t36);
    			if (if_block) if_block.m(div11, null);
    			append_dev(div11, t37);
    			append_dev(div11, div10);
    			append_dev(div10, button1);
    			append_dev(div10, t39);
    			append_dev(div10, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[10]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[12]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[13]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[14]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[15]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[16]),
    					listen_dev(button1, "click", prevent_default(/*save*/ ctx[8]), false, true, false, false),
    					listen_dev(button2, "click", /*resetForm*/ ctx[9], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*mapStyle*/ 1) {
    				select_option(select0, /*mapStyle*/ ctx[0]);
    			}

    			if (dirty & /*defaultDistance*/ 2 && to_number(input0.value) !== /*defaultDistance*/ ctx[1]) {
    				set_input_value(input0, /*defaultDistance*/ ctx[1]);
    			}

    			if (dirty & /*maxPoints*/ 4 && to_number(input1.value) !== /*maxPoints*/ ctx[2]) {
    				set_input_value(input1, /*maxPoints*/ ctx[2]);
    			}

    			if (dirty & /*notificationsEnabled*/ 8) {
    				input2.checked = /*notificationsEnabled*/ ctx[3];
    			}

    			if (dirty & /*language*/ 16) {
    				select_option(select1, /*language*/ ctx[4]);
    			}

    			if (dirty & /*username*/ 32 && input3.value !== /*username*/ ctx[5]) {
    				set_input_value(input3, /*username*/ ctx[5]);
    			}

    			if (dirty & /*email*/ 64 && input4.value !== /*email*/ ctx[6]) {
    				set_input_value(input4, /*email*/ ctx[6]);
    			}

    			if (/*message*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div11, t37);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div12);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Parametre', slots, []);
    	let mapStyle = "dark";
    	let defaultDistance = 150;
    	let maxPoints = 5000;
    	let notificationsEnabled = true;
    	let language = "fr";
    	let username = "";
    	let email = "";
    	let message = "";

    	// Valeurs « usine » des préférences
    	const DEFAULTS = {
    		map_style: 'dark',
    		default_distance: 150,
    		max_points: 5000,
    		language: 'fr',
    		notifications_enabled: true,
    		username: '',
    		email: ''
    	};

    	onMount(async () => {
    		try {
    			const data = await getSettings();
    			$$invalidate(0, { map_style: mapStyle, default_distance: defaultDistance, max_points: maxPoints, language, notifications_enabled: notificationsEnabled, username, email } = data, mapStyle, $$invalidate(1, defaultDistance), $$invalidate(2, maxPoints), $$invalidate(4, language), $$invalidate(3, notificationsEnabled), $$invalidate(5, username), $$invalidate(6, email));
    			preferences.set(data);
    		} catch(e) {
    			console.error(e);
    		}
    	});

    	async function save() {
    		const payload = {
    			map_style: mapStyle,
    			default_distance: defaultDistance,
    			max_points: maxPoints,
    			language,
    			notifications_enabled: notificationsEnabled,
    			username,
    			email
    		};

    		try {
    			await updateSettings(payload);
    			$$invalidate(7, message = "Préférences enregistrées !");
    			preferences.set(payload);
    		} catch(e) {
    			$$invalidate(7, message = "Erreur: " + e.message);
    		}
    	}

    	function resetForm() {
    		$$invalidate(0, { map_style: mapStyle, default_distance: defaultDistance, max_points: maxPoints, language, notifications_enabled: notificationsEnabled, username, email } = DEFAULTS, mapStyle, $$invalidate(1, defaultDistance), $$invalidate(2, maxPoints), $$invalidate(4, language), $$invalidate(3, notificationsEnabled), $$invalidate(5, username), $$invalidate(6, email));

    		// Met à jour le store global pour garder la cohérence
    		preferences.set({ ...DEFAULTS });

    		$$invalidate(7, message = "Paramètres remis aux valeurs par défaut.");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Parametre> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		mapStyle = select_value(this);
    		$$invalidate(0, mapStyle);
    	}

    	function input0_input_handler() {
    		defaultDistance = to_number(this.value);
    		$$invalidate(1, defaultDistance);
    	}

    	function input1_input_handler() {
    		maxPoints = to_number(this.value);
    		$$invalidate(2, maxPoints);
    	}

    	function input2_change_handler() {
    		notificationsEnabled = this.checked;
    		$$invalidate(3, notificationsEnabled);
    	}

    	function select1_change_handler() {
    		language = select_value(this);
    		$$invalidate(4, language);
    	}

    	function input3_input_handler() {
    		username = this.value;
    		$$invalidate(5, username);
    	}

    	function input4_input_handler() {
    		email = this.value;
    		$$invalidate(6, email);
    	}

    	$$self.$capture_state = () => ({
    		Sidebar,
    		onMount,
    		get: get_store_value,
    		getSettings,
    		updateSettings,
    		preferences,
    		t,
    		mapStyle,
    		defaultDistance,
    		maxPoints,
    		notificationsEnabled,
    		language,
    		username,
    		email,
    		message,
    		DEFAULTS,
    		save,
    		resetForm
    	});

    	$$self.$inject_state = $$props => {
    		if ('mapStyle' in $$props) $$invalidate(0, mapStyle = $$props.mapStyle);
    		if ('defaultDistance' in $$props) $$invalidate(1, defaultDistance = $$props.defaultDistance);
    		if ('maxPoints' in $$props) $$invalidate(2, maxPoints = $$props.maxPoints);
    		if ('notificationsEnabled' in $$props) $$invalidate(3, notificationsEnabled = $$props.notificationsEnabled);
    		if ('language' in $$props) $$invalidate(4, language = $$props.language);
    		if ('username' in $$props) $$invalidate(5, username = $$props.username);
    		if ('email' in $$props) $$invalidate(6, email = $$props.email);
    		if ('message' in $$props) $$invalidate(7, message = $$props.message);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		mapStyle,
    		defaultDistance,
    		maxPoints,
    		notificationsEnabled,
    		language,
    		username,
    		email,
    		message,
    		save,
    		resetForm,
    		select0_change_handler,
    		input0_input_handler,
    		input1_input_handler,
    		input2_change_handler,
    		select1_change_handler,
    		input3_input_handler,
    		input4_input_handler
    	];
    }

    class Parametre extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Parametre",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Equipe.svelte generated by Svelte v3.59.2 */
    const file$2 = "src/pages/Equipe.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (56:6) {#each teamMembers as member}
    function create_each_block$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let t0;
    	let h3;
    	let t1_value = /*member*/ ctx[5].name + "";
    	let t1;
    	let t2;
    	let p0;
    	let t3_value = /*member*/ ctx[5].role + "";
    	let t3;
    	let t4;
    	let p1;
    	let t5_value = /*member*/ ctx[5].email + "";
    	let t5;
    	let t6;
    	let div0;
    	let span;
    	let t7;
    	let t8_value = /*member*/ ctx[5].joined + "";
    	let t8;
    	let t9;
    	let button;
    	let t11;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p0 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = space();
    			div0 = element("div");
    			span = element("span");
    			t7 = text("Depuis ");
    			t8 = text(t8_value);
    			t9 = space();
    			button = element("button");
    			button.textContent = "Contact";
    			t11 = space();
    			if (!src_url_equal(img.src, img_src_value = /*member*/ ctx[5].avatar)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar de " + /*member*/ ctx[5].name);
    			attr_dev(img, "class", "member-avatar svelte-1onfe5l");
    			add_location(img, file$2, 57, 10, 1493);
    			attr_dev(h3, "class", "svelte-1onfe5l");
    			add_location(h3, file$2, 58, 10, 1581);
    			attr_dev(p0, "class", "member-role svelte-1onfe5l");
    			add_location(p0, file$2, 59, 10, 1614);
    			attr_dev(p1, "class", "member-email svelte-1onfe5l");
    			add_location(p1, file$2, 60, 10, 1665);
    			attr_dev(span, "class", "joined svelte-1onfe5l");
    			add_location(span, file$2, 62, 12, 1758);
    			attr_dev(button, "class", "btn-contact svelte-1onfe5l");
    			add_location(button, file$2, 63, 12, 1821);
    			attr_dev(div0, "class", "member-footer svelte-1onfe5l");
    			add_location(div0, file$2, 61, 10, 1718);
    			attr_dev(div1, "class", "team-card svelte-1onfe5l");
    			add_location(div1, file$2, 56, 8, 1459);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, h3);
    			append_dev(h3, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(p1, t5);
    			append_dev(div1, t6);
    			append_dev(div1, div0);
    			append_dev(div0, span);
    			append_dev(span, t7);
    			append_dev(span, t8);
    			append_dev(div0, t9);
    			append_dev(div0, button);
    			append_dev(div1, t11);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(56:6) {#each teamMembers as member}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let sidebar;
    	let t0;
    	let div7;
    	let div6;
    	let div0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div1;
    	let t5;
    	let div5;
    	let h2;
    	let t7;
    	let div4;
    	let div2;
    	let label0;
    	let t9;
    	let input;
    	let t10;
    	let div3;
    	let label1;
    	let t12;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let option3;
    	let t17;
    	let button;
    	let div7_transition;
    	let current;
    	let mounted;
    	let dispose;
    	sidebar = new Sidebar({ $$inline: true });
    	let each_value = /*teamMembers*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Notre équipe";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Découvrez les personnes qui travaillent avec vous";
    			t4 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t5 = space();
    			div5 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Inviter un nouveau membre";
    			t7 = space();
    			div4 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t9 = space();
    			input = element("input");
    			t10 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Rôle";
    			t12 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Membre";
    			option1 = element("option");
    			option1.textContent = "Administrateur";
    			option2 = element("option");
    			option2.textContent = "Éditeur";
    			option3 = element("option");
    			option3.textContent = "Visualiseur";
    			t17 = space();
    			button = element("button");
    			button.textContent = "Envoyer une invitation";
    			attr_dev(h1, "class", "svelte-1onfe5l");
    			add_location(h1, file$2, 50, 6, 1269);
    			attr_dev(p, "class", "subtitle svelte-1onfe5l");
    			add_location(p, file$2, 51, 6, 1297);
    			attr_dev(div0, "class", "header-section svelte-1onfe5l");
    			add_location(div0, file$2, 49, 4, 1234);
    			attr_dev(div1, "class", "team-grid svelte-1onfe5l");
    			add_location(div1, file$2, 54, 4, 1391);
    			attr_dev(h2, "class", "svelte-1onfe5l");
    			add_location(h2, file$2, 70, 6, 1967);
    			attr_dev(label0, "for", "inviteEmail");
    			attr_dev(label0, "class", "svelte-1onfe5l");
    			add_location(label0, file$2, 73, 10, 2077);
    			attr_dev(input, "type", "email");
    			attr_dev(input, "id", "inviteEmail");
    			attr_dev(input, "placeholder", "email@exemple.com");
    			attr_dev(input, "class", "svelte-1onfe5l");
    			add_location(input, file$2, 74, 10, 2126);
    			attr_dev(div2, "class", "form-group svelte-1onfe5l");
    			add_location(div2, file$2, 72, 8, 2042);
    			attr_dev(label1, "for", "inviteRole");
    			attr_dev(label1, "class", "svelte-1onfe5l");
    			add_location(label1, file$2, 77, 10, 2281);
    			option0.__value = "Membre";
    			option0.value = option0.__value;
    			add_location(option0, file$2, 79, 12, 2389);
    			option1.__value = "Administrateur";
    			option1.value = option1.__value;
    			add_location(option1, file$2, 80, 12, 2440);
    			option2.__value = "Éditeur";
    			option2.value = option2.__value;
    			add_location(option2, file$2, 81, 12, 2507);
    			option3.__value = "Visualiseur";
    			option3.value = option3.__value;
    			add_location(option3, file$2, 82, 12, 2560);
    			attr_dev(select, "id", "inviteRole");
    			attr_dev(select, "class", "svelte-1onfe5l");
    			if (/*inviteRole*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[4].call(select));
    			add_location(select, file$2, 78, 10, 2328);
    			attr_dev(div3, "class", "form-group svelte-1onfe5l");
    			add_location(div3, file$2, 76, 8, 2246);
    			attr_dev(button, "class", "btn-invite svelte-1onfe5l");
    			add_location(button, file$2, 85, 8, 2652);
    			attr_dev(div4, "class", "invite-form svelte-1onfe5l");
    			add_location(div4, file$2, 71, 6, 2008);
    			attr_dev(div5, "class", "invite-section svelte-1onfe5l");
    			add_location(div5, file$2, 69, 4, 1932);
    			attr_dev(div6, "class", "team-page svelte-1onfe5l");
    			add_location(div6, file$2, 48, 2, 1206);
    			attr_dev(div7, "class", "content-auth svelte-1onfe5l");
    			add_location(div7, file$2, 47, 0, 1135);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(div6, t4);
    			append_dev(div6, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div6, t5);
    			append_dev(div6, div5);
    			append_dev(div5, h2);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t9);
    			append_dev(div2, input);
    			set_input_value(input, /*inviteEmail*/ ctx[0]);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t12);
    			append_dev(div3, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			append_dev(select, option3);
    			select_option(select, /*inviteRole*/ ctx[1], true);
    			append_dev(div4, t17);
    			append_dev(div4, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[3]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*teamMembers*/ 4) {
    				each_value = /*teamMembers*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*inviteEmail*/ 1 && input.value !== /*inviteEmail*/ ctx[0]) {
    				set_input_value(input, /*inviteEmail*/ ctx[0]);
    			}

    			if (dirty & /*inviteRole*/ 2) {
    				select_option(select, /*inviteRole*/ ctx[1]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div7_transition) div7_transition = create_bidirectional_transition(div7, fly, { y: 20, duration: 600 }, true);
    				div7_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			if (!div7_transition) div7_transition = create_bidirectional_transition(div7, fly, { y: 20, duration: 600 }, false);
    			div7_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div7);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div7_transition) div7_transition.end();
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Equipe', slots, []);

    	const teamMembers = [
    		{
    			id: 1,
    			name: "Maxence Dupont",
    			role: "Chef de projet",
    			avatar: "https://www.gravatar.com/avatar/1?d=identicon",
    			email: "maxence@activmap.fr",
    			joined: "2022"
    		},
    		{
    			id: 2,
    			name: "Sophie Martin",
    			role: "Développeuse frontend",
    			avatar: "https://www.gravatar.com/avatar/2?d=identicon",
    			email: "sophie@activmap.fr",
    			joined: "2023"
    		},
    		{
    			id: 3,
    			name: "Lucas Bernard",
    			role: "Développeur backend",
    			avatar: "https://www.gravatar.com/avatar/3?d=identicon",
    			email: "lucas@activmap.fr",
    			joined: "2022"
    		},
    		{
    			id: 4,
    			name: "Emma Petit",
    			role: "Graphiste UI/UX",
    			avatar: "https://www.gravatar.com/avatar/4?d=identicon",
    			email: "emma@activmap.fr",
    			joined: "2023"
    		}
    	];

    	// État pour le formulaire d'invitation
    	let inviteEmail = "";

    	let inviteRole = "Membre";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Equipe> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		inviteEmail = this.value;
    		$$invalidate(0, inviteEmail);
    	}

    	function select_change_handler() {
    		inviteRole = select_value(this);
    		$$invalidate(1, inviteRole);
    	}

    	$$self.$capture_state = () => ({
    		Sidebar,
    		fly,
    		teamMembers,
    		inviteEmail,
    		inviteRole
    	});

    	$$self.$inject_state = $$props => {
    		if ('inviteEmail' in $$props) $$invalidate(0, inviteEmail = $$props.inviteEmail);
    		if ('inviteRole' in $$props) $$invalidate(1, inviteRole = $$props.inviteRole);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		inviteEmail,
    		inviteRole,
    		teamMembers,
    		input_input_handler,
    		select_change_handler
    	];
    }

    class Equipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Equipe",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const BASE = '/history';

    async function getHistory(page = 1, limit = 20) {
      const res = await fetchWithAuth(`${BASE}?page=${page}&limit=${limit}`);
      if (!res.ok) throw new Error('Erreur récupération historique');
      return await res.json();
    }

    async function deleteHistory(id) {
      const res = await fetchWithAuth(`${BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erreur suppression');
      return await res.json();
    }

    // Télécharge le SVG protégé et renvoie une URL Blob locale
    async function fetchFile(id) {
      const res = await fetchWithAuth(`${BASE}/${id}/file`);
      if (!res.ok) throw new Error('Erreur téléchargement carte');
      const blob = await res.blob();
      return URL.createObjectURL(blob);
    }

    /* src/pages/Historique.svelte generated by Svelte v3.59.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src/pages/Historique.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (115:6) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Aucun résultat trouvé pour votre recherche.";
    			add_location(p, file$1, 116, 10, 3573);
    			attr_dev(div, "class", "empty-state svelte-fytraf");
    			add_location(div, file$1, 115, 8, 3537);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(115:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:6) {#if filteredHistory.length > 0}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let each_value = /*filteredHistory*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*handleDelete, filteredHistory, window*/ 12) {
    				each_value = /*filteredHistory*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(97:6) {#if filteredHistory.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (98:8) {#each filteredHistory as item}
    function create_each_block(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*item*/ ctx[11].location + "";
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4_value = /*item*/ ctx[11].coordinates + "";
    	let t4;
    	let t5;
    	let p1;
    	let span0;
    	let t6;
    	let t7_value = /*item*/ ctx[11].date + "";
    	let t7;
    	let t8;
    	let span1;
    	let t9;
    	let t10_value = /*item*/ ctx[11].distance + "";
    	let t10;
    	let t11;
    	let t12;
    	let div1;
    	let button0;
    	let t14;
    	let button1;
    	let t16;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*item*/ ctx[11]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*item*/ ctx[11]);
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p0 = element("p");
    			t3 = text("Coordonnées: ");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			span0 = element("span");
    			t6 = text("Généré le: ");
    			t7 = text(t7_value);
    			t8 = space();
    			span1 = element("span");
    			t9 = text("Distance: ");
    			t10 = text(t10_value);
    			t11 = text("m");
    			t12 = space();
    			div1 = element("div");
    			button0 = element("button");
    			button0.textContent = "Voir";
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Supprimer";
    			t16 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[11].blobUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Miniature de la carte");
    			attr_dev(img, "class", "history-thumbnail svelte-fytraf");
    			add_location(img, file$1, 99, 12, 2769);
    			attr_dev(h3, "class", "svelte-fytraf");
    			add_location(h3, file$1, 101, 14, 2906);
    			attr_dev(p0, "class", "coordinates svelte-fytraf");
    			add_location(p0, file$1, 102, 14, 2945);
    			attr_dev(span0, "class", "date");
    			add_location(span0, file$1, 104, 16, 3056);
    			attr_dev(span1, "class", "distance");
    			add_location(span1, file$1, 105, 16, 3121);
    			attr_dev(p1, "class", "meta-info svelte-fytraf");
    			add_location(p1, file$1, 103, 14, 3018);
    			attr_dev(div0, "class", "history-details svelte-fytraf");
    			add_location(div0, file$1, 100, 12, 2862);
    			attr_dev(button0, "class", "btn-view svelte-fytraf");
    			add_location(button0, file$1, 109, 14, 3272);
    			attr_dev(button1, "class", "btn-delete svelte-fytraf");
    			add_location(button1, file$1, 110, 14, 3378);
    			attr_dev(div1, "class", "history-actions svelte-fytraf");
    			add_location(div1, file$1, 108, 12, 3228);
    			attr_dev(div2, "class", "history-item svelte-fytraf");
    			add_location(div2, file$1, 98, 10, 2730);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, img);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p0);
    			append_dev(p0, t3);
    			append_dev(p0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(p1, span0);
    			append_dev(span0, t6);
    			append_dev(span0, t7);
    			append_dev(p1, t8);
    			append_dev(p1, span1);
    			append_dev(span1, t9);
    			append_dev(span1, t10);
    			append_dev(span1, t11);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(div1, t14);
    			append_dev(div1, button1);
    			append_dev(div2, t16);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filteredHistory*/ 4 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[11].blobUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*filteredHistory*/ 4 && t1_value !== (t1_value = /*item*/ ctx[11].location + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*filteredHistory*/ 4 && t4_value !== (t4_value = /*item*/ ctx[11].coordinates + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*filteredHistory*/ 4 && t7_value !== (t7_value = /*item*/ ctx[11].date + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*filteredHistory*/ 4 && t10_value !== (t10_value = /*item*/ ctx[11].distance + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(98:8) {#each filteredHistory as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let sidebar;
    	let t0;
    	let div7;
    	let div6;
    	let div0;
    	let h1;
    	let t2;
    	let p;
    	let t4;
    	let div3;
    	let div1;
    	let input;
    	let t5;
    	let button0;
    	let span;
    	let t7;
    	let div2;
    	let label;
    	let t9;
    	let select;
    	let option0;
    	let option1;
    	let t12;
    	let div4;
    	let t13;
    	let div5;
    	let button1;
    	let t15;
    	let button2;
    	let t17;
    	let button3;
    	let t19;
    	let button4;
    	let t21;
    	let button5;
    	let current;
    	let mounted;
    	let dispose;
    	sidebar = new Sidebar({ $$inline: true });

    	function select_block_type(ctx, dirty) {
    		if (/*filteredHistory*/ ctx[2].length > 0) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Historique des cartes";
    			t2 = space();
    			p = element("p");
    			p.textContent = "Retrouvez toutes vos cartes générées précédemment";
    			t4 = space();
    			div3 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t5 = space();
    			button0 = element("button");
    			span = element("span");
    			span.textContent = "🔍";
    			t7 = space();
    			div2 = element("div");
    			label = element("label");
    			label.textContent = "Trier par :";
    			t9 = space();
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Plus récent";
    			option1 = element("option");
    			option1.textContent = "Plus ancien";
    			t12 = space();
    			div4 = element("div");
    			if_block.c();
    			t13 = space();
    			div5 = element("div");
    			button1 = element("button");
    			button1.textContent = "«";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "1";
    			t17 = space();
    			button3 = element("button");
    			button3.textContent = "2";
    			t19 = space();
    			button4 = element("button");
    			button4.textContent = "3";
    			t21 = space();
    			button5 = element("button");
    			button5.textContent = "»";
    			attr_dev(h1, "class", "svelte-fytraf");
    			add_location(h1, file$1, 70, 6, 1863);
    			attr_dev(p, "class", "subtitle svelte-fytraf");
    			add_location(p, file$1, 71, 6, 1900);
    			attr_dev(div0, "class", "header-section svelte-fytraf");
    			add_location(div0, file$1, 69, 4, 1828);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Rechercher par lieu ou coordonnées");
    			attr_dev(input, "class", "svelte-fytraf");
    			add_location(input, file$1, 76, 8, 2055);
    			attr_dev(span, "class", "search-icon");
    			add_location(span, file$1, 82, 10, 2241);
    			attr_dev(button0, "class", "search-button svelte-fytraf");
    			add_location(button0, file$1, 81, 8, 2200);
    			attr_dev(div1, "class", "search-bar svelte-fytraf");
    			add_location(div1, file$1, 75, 6, 2022);
    			attr_dev(label, "for", "sortOrder");
    			attr_dev(label, "class", "svelte-fytraf");
    			add_location(label, file$1, 87, 8, 2357);
    			option0.__value = "newest";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 89, 10, 2465);
    			option1.__value = "oldest";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 90, 10, 2519);
    			attr_dev(select, "id", "sortOrder");
    			attr_dev(select, "class", "svelte-fytraf");
    			if (/*sortOrder*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[6].call(select));
    			add_location(select, file$1, 88, 8, 2408);
    			attr_dev(div2, "class", "sort-controls svelte-fytraf");
    			add_location(div2, file$1, 86, 6, 2321);
    			attr_dev(div3, "class", "filters svelte-fytraf");
    			add_location(div3, file$1, 74, 4, 1994);
    			attr_dev(div4, "class", "history-list svelte-fytraf");
    			add_location(div4, file$1, 95, 4, 2614);
    			attr_dev(button1, "class", "page-btn svelte-fytraf");
    			add_location(button1, file$1, 122, 6, 3702);
    			attr_dev(button2, "class", "page-btn active svelte-fytraf");
    			add_location(button2, file$1, 123, 6, 3744);
    			attr_dev(button3, "class", "page-btn svelte-fytraf");
    			add_location(button3, file$1, 124, 6, 3793);
    			attr_dev(button4, "class", "page-btn svelte-fytraf");
    			add_location(button4, file$1, 125, 6, 3835);
    			attr_dev(button5, "class", "page-btn svelte-fytraf");
    			add_location(button5, file$1, 126, 6, 3877);
    			attr_dev(div5, "class", "pagination svelte-fytraf");
    			add_location(div5, file$1, 121, 4, 3671);
    			attr_dev(div6, "class", "history-page svelte-fytraf");
    			add_location(div6, file$1, 68, 2, 1797);
    			attr_dev(div7, "class", "content-auth svelte-fytraf");
    			add_location(div7, file$1, 67, 0, 1768);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div6);
    			append_dev(div6, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(div6, t4);
    			append_dev(div6, div3);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*searchQuery*/ ctx[0]);
    			append_dev(div1, t5);
    			append_dev(div1, button0);
    			append_dev(button0, span);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, label);
    			append_dev(div2, t9);
    			append_dev(div2, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			select_option(select, /*sortOrder*/ ctx[1], true);
    			append_dev(div6, t12);
    			append_dev(div6, div4);
    			if_block.m(div4, null);
    			append_dev(div6, t13);
    			append_dev(div6, div5);
    			append_dev(div5, button1);
    			append_dev(div5, t15);
    			append_dev(div5, button2);
    			append_dev(div5, t17);
    			append_dev(div5, button3);
    			append_dev(div5, t19);
    			append_dev(div5, button4);
    			append_dev(div5, t21);
    			append_dev(div5, button5);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[6])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*searchQuery*/ 1 && input.value !== /*searchQuery*/ ctx[0]) {
    				set_input_value(input, /*searchQuery*/ ctx[0]);
    			}

    			if (dirty & /*sortOrder*/ 2) {
    				select_option(select, /*sortOrder*/ ctx[1]);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div4, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div7);
    			if_block.d();
    			mounted = false;
    			run_all(dispose);
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
    	let filteredHistory;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Historique', slots, []);
    	let historyItems = [];
    	let loading = true;

    	async function loadHistory() {
    		try {
    			const data = await getHistory();

    			// Téléchargement des blobs en parallèle
    			const itemsWithMeta = data.items.map(it => ({
    				id: it.id,
    				date: new Date(it.created_at).toLocaleString(),
    				location: `${it.latitude.toFixed(4)}, ${it.longitude.toFixed(4)}`,
    				coordinates: `${it.latitude}, ${it.longitude}`,
    				distance: it.distance
    			}));

    			// Récupérer les blobs protégés
    			$$invalidate(4, historyItems = await Promise.all(itemsWithMeta.map(async el => {
    				try {
    					el.blobUrl = await fetchFile(el.id);
    				} catch(e) {
    					console.error('Erreur fetchFile', e);
    					el.blobUrl = '';
    				}

    				return el;
    			})));
    		} catch(e) {
    			console.error(e);
    		} finally {
    			loading = false;
    		}
    	}

    	onMount(loadHistory);

    	async function handleDelete(id) {
    		await deleteHistory(id);
    		$$invalidate(4, historyItems = historyItems.filter(h => h.id !== id));
    	}

    	// État pour les filtres
    	let searchQuery = "";

    	let sortOrder = "newest";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<Historique> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		searchQuery = this.value;
    		$$invalidate(0, searchQuery);
    	}

    	function select_change_handler() {
    		sortOrder = select_value(this);
    		$$invalidate(1, sortOrder);
    	}

    	const click_handler = item => window.open(item.blobUrl, '_blank');
    	const click_handler_1 = item => handleDelete(item.id);

    	$$self.$capture_state = () => ({
    		Sidebar,
    		onMount,
    		getHistory,
    		deleteHistory,
    		fetchFile,
    		historyItems,
    		loading,
    		loadHistory,
    		handleDelete,
    		searchQuery,
    		sortOrder,
    		filteredHistory
    	});

    	$$self.$inject_state = $$props => {
    		if ('historyItems' in $$props) $$invalidate(4, historyItems = $$props.historyItems);
    		if ('loading' in $$props) loading = $$props.loading;
    		if ('searchQuery' in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ('sortOrder' in $$props) $$invalidate(1, sortOrder = $$props.sortOrder);
    		if ('filteredHistory' in $$props) $$invalidate(2, filteredHistory = $$props.filteredHistory);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*historyItems, searchQuery, sortOrder*/ 19) {
    			// Filtrer et trier l'historique
    			$$invalidate(2, filteredHistory = historyItems.filter(item => item.location.toLowerCase().includes(searchQuery.toLowerCase()) || item.coordinates.includes(searchQuery)).sort((a, b) => {
    				if (sortOrder === "newest") {
    					return new Date(b.date) - new Date(a.date);
    				} else {
    					return new Date(a.date) - new Date(b.date);
    				}
    			}));
    		}
    	};

    	return [
    		searchQuery,
    		sortOrder,
    		filteredHistory,
    		handleDelete,
    		historyItems,
    		input_input_handler,
    		select_change_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class Historique extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Historique",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.59.2 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    // (475:1) {:else}
    function create_else_block(ctx) {
    	let div;
    	let h1;
    	let t1;
    	let login;
    	let div_transition;
    	let current;
    	login = new Login({ $$inline: true });
    	login.$on("login-success", /*handleLoginSuccess*/ ctx[18]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "ActivMap";
    			t1 = space();
    			create_component(login.$$.fragment);
    			attr_dev(h1, "class", "svelte-1smhzp2");
    			add_location(h1, file, 477, 3, 11377);
    			attr_dev(div, "class", "card svelte-1smhzp2");
    			add_location(div, file, 476, 2, 11312);
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
    		source: "(475:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (403:1) {#if $isAuthenticated}
    function create_if_block(ctx) {
    	let sidebar;
    	let t_1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	sidebar = new Sidebar({ $$inline: true });

    	const if_block_creators = [
    		create_if_block_1,
    		create_if_block_5,
    		create_if_block_6,
    		create_if_block_7,
    		create_if_block_8
    	];

    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*currentPage*/ ctx[1] === 'carte') return 0;
    		if (/*currentPage*/ ctx[1] === 'statistique') return 1;
    		if (/*currentPage*/ ctx[1] === 'parametre') return 2;
    		if (/*currentPage*/ ctx[1] === 'equipe') return 3;
    		if (/*currentPage*/ ctx[1] === 'historique') return 4;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type_1(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t_1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t_1, anchor);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(sidebar, detaching);
    			if (detaching) detach_dev(t_1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(403:1) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (472:41) 
    function create_if_block_8(ctx) {
    	let historique;
    	let current;
    	historique = new Historique({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(historique.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(historique, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(historique.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(historique.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(historique, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(472:41) ",
    		ctx
    	});

    	return block;
    }

    // (470:37) 
    function create_if_block_7(ctx) {
    	let equipe;
    	let current;
    	equipe = new Equipe({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(equipe.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(equipe, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(equipe.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(equipe.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(equipe, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(470:37) ",
    		ctx
    	});

    	return block;
    }

    // (468:40) 
    function create_if_block_6(ctx) {
    	let parametre;
    	let current;
    	parametre = new Parametre({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(parametre.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(parametre, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(parametre.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(parametre.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(parametre, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(468:40) ",
    		ctx
    	});

    	return block;
    }

    // (466:42) 
    function create_if_block_5(ctx) {
    	let statistique;
    	let current;
    	statistique = new Statistique({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(statistique.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(statistique, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(statistique.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(statistique.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(statistique, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(466:42) ",
    		ctx
    	});

    	return block;
    }

    // (408:2) {#if currentPage === 'carte'}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t0_value = t('map_generator', /*$locale*/ ctx[9]) + "";
    	let t0;
    	let t1;
    	let form;
    	let label0;
    	let t2_value = t('latitude', /*$locale*/ ctx[9]) + "";
    	let t2;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t5_value = t('longitude', /*$locale*/ ctx[9]) + "";
    	let t5;
    	let t6;
    	let input1;
    	let t7;
    	let label2;
    	let t8_value = t('distance', /*$locale*/ ctx[9]) + "";
    	let t8;
    	let t9;
    	let input2;
    	let t10;
    	let button;
    	let t11_value = t('generate_map', /*$locale*/ ctx[9]) + "";
    	let t11;
    	let t12;
    	let t13;
    	let div0_transition;
    	let t14;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[6] && create_if_block_4(ctx);
    	let if_block1 = /*error*/ ctx[7] && create_if_block_3(ctx);
    	let if_block2 = /*svgUrl*/ ctx[5] && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text(t2_value);
    			t3 = text(" :\n\t\t\t\t\t\t\t");
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			t5 = text(t5_value);
    			t6 = text(" :\n\t\t\t\t\t\t\t");
    			input1 = element("input");
    			t7 = space();
    			label2 = element("label");
    			t8 = text(t8_value);
    			t9 = text(" :\n\t\t\t\t\t\t\t");
    			input2 = element("input");
    			t10 = space();
    			button = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			if (if_block0) if_block0.c();
    			t13 = space();
    			if (if_block1) if_block1.c();
    			t14 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "svelte-1smhzp2");
    			add_location(h1, file, 410, 5, 9133);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.000001");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1smhzp2");
    			add_location(input0, file, 414, 7, 9278);
    			attr_dev(label0, "class", "svelte-1smhzp2");
    			add_location(label0, file, 412, 6, 9229);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.000001");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1smhzp2");
    			add_location(input1, file, 418, 7, 9420);
    			attr_dev(label1, "class", "svelte-1smhzp2");
    			add_location(label1, file, 416, 6, 9370);
    			attr_dev(input2, "type", "number");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-1smhzp2");
    			add_location(input2, file, 422, 7, 9562);
    			attr_dev(label2, "class", "svelte-1smhzp2");
    			add_location(label2, file, 420, 6, 9513);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-1smhzp2");
    			add_location(button, file, 425, 6, 9645);
    			attr_dev(form, "class", "svelte-1smhzp2");
    			add_location(form, file, 411, 5, 9177);
    			attr_dev(div0, "id", "carte");
    			attr_dev(div0, "class", "card svelte-1smhzp2");
    			add_location(div0, file, 409, 4, 9055);
    			attr_dev(div1, "class", "content-auth svelte-1smhzp2");
    			add_location(div1, file, 408, 3, 9024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(div0, t1);
    			append_dev(div0, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, t3);
    			append_dev(label0, input0);
    			set_input_value(input0, /*latitude*/ ctx[2]);
    			append_dev(form, t4);
    			append_dev(form, label1);
    			append_dev(label1, t5);
    			append_dev(label1, t6);
    			append_dev(label1, input1);
    			set_input_value(input1, /*longitude*/ ctx[3]);
    			append_dev(form, t7);
    			append_dev(form, label2);
    			append_dev(label2, t8);
    			append_dev(label2, t9);
    			append_dev(label2, input2);
    			set_input_value(input2, /*distance*/ ctx[4]);
    			append_dev(form, t10);
    			append_dev(form, button);
    			append_dev(button, t11);
    			append_dev(div0, t12);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t13);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div1, t14);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[23]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[24]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[25]),
    					listen_dev(form, "submit", prevent_default(/*generateMap*/ ctx[10]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$locale*/ 512) && t0_value !== (t0_value = t('map_generator', /*$locale*/ ctx[9]) + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*$locale*/ 512) && t2_value !== (t2_value = t('latitude', /*$locale*/ ctx[9]) + "")) set_data_dev(t2, t2_value);

    			if (dirty[0] & /*latitude*/ 4 && to_number(input0.value) !== /*latitude*/ ctx[2]) {
    				set_input_value(input0, /*latitude*/ ctx[2]);
    			}

    			if ((!current || dirty[0] & /*$locale*/ 512) && t5_value !== (t5_value = t('longitude', /*$locale*/ ctx[9]) + "")) set_data_dev(t5, t5_value);

    			if (dirty[0] & /*longitude*/ 8 && to_number(input1.value) !== /*longitude*/ ctx[3]) {
    				set_input_value(input1, /*longitude*/ ctx[3]);
    			}

    			if ((!current || dirty[0] & /*$locale*/ 512) && t8_value !== (t8_value = t('distance', /*$locale*/ ctx[9]) + "")) set_data_dev(t8, t8_value);

    			if (dirty[0] & /*distance*/ 16 && to_number(input2.value) !== /*distance*/ ctx[4]) {
    				set_input_value(input2, /*distance*/ ctx[4]);
    			}

    			if ((!current || dirty[0] & /*$locale*/ 512) && t11_value !== (t11_value = t('generate_map', /*$locale*/ ctx[9]) + "")) set_data_dev(t11, t11_value);

    			if (/*loading*/ ctx[6]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div0, t13);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[7]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*svgUrl*/ ctx[5]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*svgUrl*/ 32) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_2(ctx);
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

    			add_render_callback(() => {
    				if (!current) return;
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: -20, duration: 600 }, true);
    				div0_transition.run(1);
    			});

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { y: -20, duration: 600 }, false);
    			div0_transition.run(0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
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
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(408:2) {#if currentPage === 'carte'}",
    		ctx
    	});

    	return block;
    }

    // (428:5) {#if loading}
    function create_if_block_4(ctx) {
    	let div;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Génération en cours...";
    			attr_dev(div, "class", "loading-spinner svelte-1smhzp2");
    			add_location(div, file, 428, 6, 9743);
    			set_style(p, "text-align", "center");
    			add_location(p, file, 429, 6, 9785);
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
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(428:5) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (432:5) {#if error}
    function create_if_block_3(ctx) {
    	let p;
    	let t_1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t_1 = text(/*error*/ ctx[7]);
    			attr_dev(p, "class", "error svelte-1smhzp2");
    			add_location(p, file, 432, 6, 9877);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*error*/ 128) set_data_dev(t_1, /*error*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(432:5) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (437:4) {#if svgUrl}
    function create_if_block_2(ctx) {
    	let h2;
    	let t0_value = t('generated_map', /*$locale*/ ctx[9]) + "";
    	let t0;
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
    	let t9_value = t('download_svg', /*$locale*/ ctx[9]) + "";
    	let t9;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			t0 = text(t0_value);
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
    			t9 = text(t9_value);
    			set_style(h2, "text-align", "center");
    			attr_dev(h2, "class", "svelte-1smhzp2");
    			add_location(h2, file, 437, 5, 9955);
    			attr_dev(button0, "aria-label", "Zoom In");
    			attr_dev(button0, "class", "svelte-1smhzp2");
    			add_location(button0, file, 451, 8, 10492);
    			attr_dev(button1, "aria-label", "Zoom Out");
    			attr_dev(button1, "class", "svelte-1smhzp2");
    			add_location(button1, file, 452, 8, 10558);
    			attr_dev(button2, "aria-label", "Rotate");
    			attr_dev(button2, "class", "svelte-1smhzp2");
    			add_location(button2, file, 453, 8, 10626);
    			attr_dev(div0, "class", "zoom-controls svelte-1smhzp2");
    			add_location(div0, file, 450, 7, 10456);
    			if (!src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Carte stylisée");
    			attr_dev(img, "class", "svelte-1smhzp2");
    			set_style(img, "transform", /*transformValue*/ ctx[8]);
    			add_location(img, file, 455, 7, 10707);
    			attr_dev(div1, "class", "svg-container svelte-1smhzp2");
    			attr_dev(div1, "role", "application");
    			attr_dev(div1, "aria-label", "Carte stylisée");
    			add_location(div1, file, 440, 6, 10183);
    			attr_dev(div2, "class", "card svelte-1smhzp2");
    			add_location(div2, file, 438, 5, 10043);
    			attr_dev(button3, "class", "svelte-1smhzp2");
    			add_location(button3, file, 460, 7, 10943);
    			attr_dev(a, "download", "carte.svg");
    			attr_dev(a, "href", /*svgUrl*/ ctx[5]);
    			add_location(a, file, 459, 6, 10897);
    			attr_dev(div3, "class", "download-container svelte-1smhzp2");
    			add_location(div3, file, 458, 5, 10858);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
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
    			append_dev(button3, t9);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*zoomIn*/ ctx[12], false, false, false, false),
    					listen_dev(button1, "click", /*zoomOut*/ ctx[13], false, false, false, false),
    					listen_dev(button2, "click", /*rotateMap*/ ctx[14], false, false, false, false),
    					listen_dev(div1, "wheel", prevent_default(/*handleWheel*/ ctx[11]), false, true, false, false),
    					listen_dev(div1, "mousedown", /*startDrag*/ ctx[15], false, false, false, false),
    					listen_dev(div1, "mousemove", /*drag*/ ctx[16], false, false, false, false),
    					listen_dev(div1, "mouseup", /*endDrag*/ ctx[17], false, false, false, false),
    					listen_dev(div1, "mouseleave", /*endDrag*/ ctx[17], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty[0] & /*$locale*/ 512) && t0_value !== (t0_value = t('generated_map', /*$locale*/ ctx[9]) + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty[0] & /*svgUrl*/ 32 && !src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*transformValue*/ 256) {
    				set_style(img, "transform", /*transformValue*/ ctx[8]);
    			}

    			if ((!current || dirty[0] & /*$locale*/ 512) && t9_value !== (t9_value = t('download_svg', /*$locale*/ ctx[9]) + "")) set_data_dev(t9, t9_value);

    			if (!current || dirty[0] & /*svgUrl*/ 32) {
    				attr_dev(a, "href", /*svgUrl*/ ctx[5]);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(437:4) {#if svgUrl}",
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
    			attr_dev(main, "class", "svelte-1smhzp2");
    			add_location(main, file, 401, 0, 8853);
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
    	let $locale;
    	validate_store(isAuthenticated, 'isAuthenticated');
    	component_subscribe($$self, isAuthenticated, $$value => $$invalidate(0, $isAuthenticated = $$value));
    	validate_store(locale, 'locale');
    	component_subscribe($$self, locale, $$value => $$invalidate(9, $locale = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let currentPage = 'carte';

    	// Fonction pour définir la page active
    	function setActivePage() {
    		const hash = window.location.hash.replace('#', '');
    		$$invalidate(1, currentPage = hash || 'carte');
    	}

    	// Variables pour la carte
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

    	// Vérifier l'authentification au démarrage et configurer la navigation
    	onMount(() => {
    		// Vérifier l'authentification sans forcer la déconnexion
    		checkAuth();

    		// Charger les préférences si déjà authentifié
    		isAuthenticated.subscribe(async v => {
    			if (v) {
    				try {
    					const { getSettings } = await Promise.resolve().then(function () { return settings; });
    					const data = await getSettings();
    					preferences.set(data);
    				} catch(e) {
    					console.error('Erreur chargement préférences', e);
    				}
    			}
    		});

    		// Configurer la navigation basée sur le hash
    		setActivePage();

    		window.addEventListener('hashchange', setActivePage);

    		// Nettoyage lors du démontage du composant
    		return () => {
    			window.removeEventListener('hashchange', setActivePage);
    		};
    	});

    	// Mettre à jour la distance par défaut selon les préférences
    	preferences.subscribe(p => {
    		if (p && p.default_distance) {
    			$$invalidate(4, distance = p.default_distance);
    		}

    		if (p && p.map_style) {
    			const isLight = p.map_style === 'light';
    			document.body.classList.toggle('theme-light', isLight);
    			document.body.classList.toggle('theme-dark', !isLight);
    		}
    	});

    	async function generateMap() {
    		$$invalidate(6, loading = true);
    		$$invalidate(7, error = "");
    		$$invalidate(5, svgUrl = "");

    		// Réinitialise zoom, rotation et panning
    		$$invalidate(19, scale$1 = 1.0);

    		$$invalidate(20, rotate = 0);
    		$$invalidate(21, translateX = 0);
    		$$invalidate(22, translateY = 0);

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
    					$$invalidate(7, error = "Vous devez être connecté pour générer une carte.");
    					set_store_value(isAuthenticated, $isAuthenticated = false, $isAuthenticated);
    				} else {
    					const errData = await response.json();
    					$$invalidate(7, error = errData.error || "Erreur lors de la génération de la carte.");
    				}
    			} else {
    				const blob = await response.blob();
    				$$invalidate(5, svgUrl = URL.createObjectURL(blob));
    			}
    		} catch(err) {
    			$$invalidate(7, error = "Erreur réseau : " + err);
    		} finally {
    			$$invalidate(6, loading = false);
    		}
    	}

    	function handleWheel(e) {
    		e.preventDefault();

    		if (e.deltaY < 0) {
    			$$invalidate(19, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    		} else {
    			$$invalidate(19, scale$1 = Math.max(minScale, scale$1 / 1.1));
    		}
    	}

    	function zoomIn() {
    		$$invalidate(19, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    	}

    	function zoomOut() {
    		$$invalidate(19, scale$1 = Math.max(minScale, scale$1 / 1.1));
    	}

    	// Incrémente la rotation de 15 degrés à chaque clic
    	function rotateMap() {
    		$$invalidate(20, rotate = rotate + 15);
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
    			$$invalidate(21, translateX = initialTranslateX + dx);
    			$$invalidate(22, translateY = initialTranslateY + dy);
    		}
    	}

    	function endDrag() {
    		isDragging = false;
    	}

    	function handleLogout() {
    		logout();
    		$$invalidate(5, svgUrl = "");
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
    		$$invalidate(2, latitude);
    	}

    	function input1_input_handler() {
    		longitude = to_number(this.value);
    		$$invalidate(3, longitude);
    	}

    	function input2_input_handler() {
    		distance = to_number(this.value);
    		$$invalidate(4, distance);
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
    		preferences,
    		t,
    		locale,
    		Statistique,
    		Parametre,
    		Equipe,
    		Historique,
    		API_URL,
    		currentPage,
    		setActivePage,
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
    		$isAuthenticated,
    		$locale
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentPage' in $$props) $$invalidate(1, currentPage = $$props.currentPage);
    		if ('latitude' in $$props) $$invalidate(2, latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate(3, longitude = $$props.longitude);
    		if ('distance' in $$props) $$invalidate(4, distance = $$props.distance);
    		if ('svgUrl' in $$props) $$invalidate(5, svgUrl = $$props.svgUrl);
    		if ('loading' in $$props) $$invalidate(6, loading = $$props.loading);
    		if ('error' in $$props) $$invalidate(7, error = $$props.error);
    		if ('scale' in $$props) $$invalidate(19, scale$1 = $$props.scale);
    		if ('rotate' in $$props) $$invalidate(20, rotate = $$props.rotate);
    		if ('usePublicEndpoint' in $$props) usePublicEndpoint = $$props.usePublicEndpoint;
    		if ('translateX' in $$props) $$invalidate(21, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(22, translateY = $$props.translateY);
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

    		if ($$self.$$.dirty[0] & /*translateX, translateY, rotate, scale*/ 7864320) {
    			// Transformation combinée : translation, rotation et zoom
    			$$invalidate(8, transformValue = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale$1})`);
    		}
    	};

    	return [
    		$isAuthenticated,
    		currentPage,
    		latitude,
    		longitude,
    		distance,
    		svgUrl,
    		loading,
    		error,
    		transformValue,
    		$locale,
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
    		input2_input_handler
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
