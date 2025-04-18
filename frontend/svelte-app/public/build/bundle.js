
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

    const { console: console_1$2 } = globals;
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
    function create_if_block$2(ctx) {
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
    		id: create_if_block$2.name,
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
    		if (/*isRegisterMode*/ ctx[4]) return create_if_block$2;
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$2.warn(`<Login> was created with unknown prop '${key}'`);
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

    /* src/components/Sidebar.svelte generated by Svelte v3.59.2 */
    const file$5 = "src/components/Sidebar.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (36:3) {#each menu as item (item.id)}
    function create_each_block$2(key_1, ctx) {
    	let a;
    	let t0_value = /*item*/ ctx[3].label + "";
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
    			add_location(a, file$5, 36, 2, 896);
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
    		source: "(36:3) {#each menu as item (item.id)}",
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
    			button.textContent = "Déconnexion";
    			attr_dev(img, "class", "avatar svelte-1wvfsqf");
    			if (!src_url_equal(img.src, img_src_value = "https://www.gravatar.com/avatar/?d=identicon")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Avatar utilisateur");
    			add_location(img, file$5, 22, 3, 511);
    			attr_dev(h2, "class", "username svelte-1wvfsqf");
    			add_location(h2, file$5, 28, 2, 648);
    			attr_dev(p, "class", "email svelte-1wvfsqf");
    			add_location(p, file$5, 29, 2, 720);
    			attr_dev(div, "class", "user-info");
    			add_location(div, file$5, 27, 3, 622);
    			attr_dev(section, "class", "profile svelte-1wvfsqf");
    			add_location(section, file$5, 21, 1, 482);
    			attr_dev(nav, "class", "menu svelte-1wvfsqf");
    			attr_dev(nav, "aria-label", "Navigation principale");
    			add_location(nav, file$5, 34, 1, 806);
    			attr_dev(button, "class", "logout svelte-1wvfsqf");
    			add_location(button, file$5, 43, 1, 1030);
    			attr_dev(aside, "class", "sidebar svelte-1wvfsqf");
    			add_location(aside, file$5, 19, 2, 439);
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
    		{ id: "carte", label: "Générer une carte" },
    		{ id: "statistique", label: "Statistique" },
    		{ id: "parametre", label: "Paramètre" },
    		{ id: "equipe", label: "Équipe" },
    		{ id: "historique", label: "Historique" }
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

    /* src/pages/Parametre.svelte generated by Svelte v3.59.2 */
    const file$3 = "src/pages/Parametre.svelte";

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
    	let t20;
    	let div5;
    	let label4;
    	let t22;
    	let select1;
    	let option3;
    	let option4;
    	let option5;
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
    	let div10;
    	let button1;
    	let t38;
    	let button2;
    	let current;
    	let mounted;
    	let dispose;
    	sidebar = new Sidebar({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(sidebar.$$.fragment);
    			t0 = space();
    			div12 = element("div");
    			div11 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Paramètres";
    			t2 = space();
    			div3 = element("div");
    			h20 = element("h2");
    			h20.textContent = "Paramètres de carte";
    			t4 = space();
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Style de carte";
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
    			label1.textContent = "Distance par défaut (m)";
    			t12 = space();
    			input0 = element("input");
    			t13 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Points maximum";
    			t15 = space();
    			input1 = element("input");
    			t16 = space();
    			div6 = element("div");
    			h21 = element("h2");
    			h21.textContent = "Préférences générales";
    			t18 = space();
    			div4 = element("div");
    			label3 = element("label");
    			input2 = element("input");
    			t19 = text("\n          Activer les notifications");
    			t20 = space();
    			div5 = element("div");
    			label4 = element("label");
    			label4.textContent = "Langue";
    			t22 = space();
    			select1 = element("select");
    			option3 = element("option");
    			option3.textContent = "Français";
    			option4 = element("option");
    			option4.textContent = "English";
    			option5 = element("option");
    			option5.textContent = "Español";
    			t26 = space();
    			div9 = element("div");
    			h22 = element("h2");
    			h22.textContent = "Paramètres du compte";
    			t28 = space();
    			div7 = element("div");
    			label5 = element("label");
    			label5.textContent = "Nom d'utilisateur";
    			t30 = space();
    			input3 = element("input");
    			t31 = space();
    			div8 = element("div");
    			label6 = element("label");
    			label6.textContent = "Email";
    			t33 = space();
    			input4 = element("input");
    			t34 = space();
    			button0 = element("button");
    			button0.textContent = "Changer le mot de passe";
    			t36 = space();
    			div10 = element("div");
    			button1 = element("button");
    			button1.textContent = "Enregistrer les modifications";
    			t38 = space();
    			button2 = element("button");
    			button2.textContent = "Réinitialiser";
    			attr_dev(h1, "class", "svelte-fhtsrc");
    			add_location(h1, file$3, 17, 4, 393);
    			attr_dev(h20, "class", "svelte-fhtsrc");
    			add_location(h20, file$3, 20, 6, 459);
    			attr_dev(label0, "for", "mapStyle");
    			attr_dev(label0, "class", "svelte-fhtsrc");
    			add_location(label0, file$3, 22, 8, 527);
    			option0.__value = "dark";
    			option0.value = option0.__value;
    			add_location(option0, file$3, 24, 10, 635);
    			option1.__value = "light";
    			option1.value = option1.__value;
    			add_location(option1, file$3, 25, 10, 682);
    			option2.__value = "satellite";
    			option2.value = option2.__value;
    			add_location(option2, file$3, 26, 10, 729);
    			attr_dev(select0, "id", "mapStyle");
    			attr_dev(select0, "class", "svelte-fhtsrc");
    			if (/*mapStyle*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[7].call(select0));
    			add_location(select0, file$3, 23, 8, 580);
    			attr_dev(div0, "class", "form-group svelte-fhtsrc");
    			add_location(div0, file$3, 21, 6, 494);
    			attr_dev(label1, "for", "defaultDistance");
    			attr_dev(label1, "class", "svelte-fhtsrc");
    			add_location(label1, file$3, 31, 8, 851);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "id", "defaultDistance");
    			attr_dev(input0, "min", "50");
    			attr_dev(input0, "max", "1000");
    			attr_dev(input0, "class", "svelte-fhtsrc");
    			add_location(input0, file$3, 32, 8, 920);
    			attr_dev(div1, "class", "form-group svelte-fhtsrc");
    			add_location(div1, file$3, 30, 6, 818);
    			attr_dev(label2, "for", "maxPoints");
    			attr_dev(label2, "class", "svelte-fhtsrc");
    			add_location(label2, file$3, 36, 8, 1073);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "id", "maxPoints");
    			attr_dev(input1, "min", "1000");
    			attr_dev(input1, "max", "10000");
    			attr_dev(input1, "class", "svelte-fhtsrc");
    			add_location(input1, file$3, 37, 8, 1127);
    			attr_dev(div2, "class", "form-group svelte-fhtsrc");
    			add_location(div2, file$3, 35, 6, 1040);
    			attr_dev(div3, "class", "settings-section svelte-fhtsrc");
    			add_location(div3, file$3, 19, 4, 422);
    			attr_dev(h21, "class", "svelte-fhtsrc");
    			add_location(h21, file$3, 42, 6, 1282);
    			attr_dev(input2, "type", "checkbox");
    			attr_dev(input2, "class", "svelte-fhtsrc");
    			add_location(input2, file$3, 45, 10, 1385);
    			attr_dev(label3, "class", "svelte-fhtsrc");
    			add_location(label3, file$3, 44, 8, 1367);
    			attr_dev(div4, "class", "form-group checkbox-group svelte-fhtsrc");
    			add_location(div4, file$3, 43, 6, 1319);
    			attr_dev(label4, "for", "language");
    			attr_dev(label4, "class", "svelte-fhtsrc");
    			add_location(label4, file$3, 51, 8, 1559);
    			option3.__value = "fr";
    			option3.value = option3.__value;
    			add_location(option3, file$3, 53, 10, 1659);
    			option4.__value = "en";
    			option4.value = option4.__value;
    			add_location(option4, file$3, 54, 10, 1706);
    			option5.__value = "es";
    			option5.value = option5.__value;
    			add_location(option5, file$3, 55, 10, 1752);
    			attr_dev(select1, "id", "language");
    			attr_dev(select1, "class", "svelte-fhtsrc");
    			if (/*language*/ ctx[4] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[11].call(select1));
    			add_location(select1, file$3, 52, 8, 1604);
    			attr_dev(div5, "class", "form-group svelte-fhtsrc");
    			add_location(div5, file$3, 50, 6, 1526);
    			attr_dev(div6, "class", "settings-section svelte-fhtsrc");
    			add_location(div6, file$3, 41, 4, 1245);
    			attr_dev(h22, "class", "svelte-fhtsrc");
    			add_location(h22, file$3, 61, 6, 1876);
    			attr_dev(label5, "for", "username");
    			attr_dev(label5, "class", "svelte-fhtsrc");
    			add_location(label5, file$3, 63, 8, 1945);
    			attr_dev(input3, "type", "text");
    			attr_dev(input3, "id", "username");
    			attr_dev(input3, "class", "svelte-fhtsrc");
    			add_location(input3, file$3, 64, 8, 2001);
    			attr_dev(div7, "class", "form-group svelte-fhtsrc");
    			add_location(div7, file$3, 62, 6, 1912);
    			attr_dev(label6, "for", "email");
    			attr_dev(label6, "class", "svelte-fhtsrc");
    			add_location(label6, file$3, 68, 8, 2118);
    			attr_dev(input4, "type", "email");
    			attr_dev(input4, "id", "email");
    			attr_dev(input4, "class", "svelte-fhtsrc");
    			add_location(input4, file$3, 69, 8, 2159);
    			attr_dev(div8, "class", "form-group svelte-fhtsrc");
    			add_location(div8, file$3, 67, 6, 2085);
    			attr_dev(button0, "class", "btn-change-password svelte-fhtsrc");
    			add_location(button0, file$3, 72, 6, 2238);
    			attr_dev(div9, "class", "settings-section svelte-fhtsrc");
    			add_location(div9, file$3, 60, 4, 1839);
    			attr_dev(button1, "class", "btn-save svelte-fhtsrc");
    			add_location(button1, file$3, 76, 6, 2362);
    			attr_dev(button2, "class", "btn-reset svelte-fhtsrc");
    			add_location(button2, file$3, 77, 6, 2432);
    			attr_dev(div10, "class", "action-buttons svelte-fhtsrc");
    			add_location(div10, file$3, 75, 4, 2327);
    			attr_dev(div11, "class", "card svelte-fhtsrc");
    			add_location(div11, file$3, 16, 2, 370);
    			attr_dev(div12, "class", "content-auth svelte-fhtsrc");
    			add_location(div12, file$3, 15, 0, 341);
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
    			append_dev(div6, t20);
    			append_dev(div6, div5);
    			append_dev(div5, label4);
    			append_dev(div5, t22);
    			append_dev(div5, select1);
    			append_dev(select1, option3);
    			append_dev(select1, option4);
    			append_dev(select1, option5);
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
    			append_dev(div11, div10);
    			append_dev(div10, button1);
    			append_dev(div10, t38);
    			append_dev(div10, button2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[7]),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[10]),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[11]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[12]),
    					listen_dev(input4, "input", /*input4_input_handler*/ ctx[13])
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
    	let username = "Utilisateur";
    	let email = "utilisateur@exemple.com";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Parametre> was created with unknown prop '${key}'`);
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
    		mapStyle,
    		defaultDistance,
    		maxPoints,
    		notificationsEnabled,
    		language,
    		username,
    		email
    	});

    	$$self.$inject_state = $$props => {
    		if ('mapStyle' in $$props) $$invalidate(0, mapStyle = $$props.mapStyle);
    		if ('defaultDistance' in $$props) $$invalidate(1, defaultDistance = $$props.defaultDistance);
    		if ('maxPoints' in $$props) $$invalidate(2, maxPoints = $$props.maxPoints);
    		if ('notificationsEnabled' in $$props) $$invalidate(3, notificationsEnabled = $$props.notificationsEnabled);
    		if ('language' in $$props) $$invalidate(4, language = $$props.language);
    		if ('username' in $$props) $$invalidate(5, username = $$props.username);
    		if ('email' in $$props) $$invalidate(6, email = $$props.email);
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

    async function regenerateHistory(id) {
      const res = await fetchWithAuth(`${BASE}/${id}/regenerate`, { method: 'POST' });
      if (!res.ok) throw new Error('Erreur regénération');
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
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (121:6) {:else}
    function create_else_block$1(ctx) {
    	let div;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "Aucun résultat trouvé pour votre recherche.";
    			add_location(p, file$1, 122, 10, 3796);
    			attr_dev(div, "class", "empty-state svelte-3mxh4e");
    			add_location(div, file$1, 121, 8, 3760);
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
    		source: "(121:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (102:6) {#if filteredHistory.length > 0}
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
    			if (dirty & /*handleDelete, filteredHistory, handleRegenerate, window*/ 28) {
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
    		source: "(102:6) {#if filteredHistory.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (103:8) {#each filteredHistory as item}
    function create_each_block(ctx) {
    	let div2;
    	let img;
    	let img_src_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*item*/ ctx[13].location + "";
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4_value = /*item*/ ctx[13].coordinates + "";
    	let t4;
    	let t5;
    	let p1;
    	let span0;
    	let t6;
    	let t7_value = /*item*/ ctx[13].date + "";
    	let t7;
    	let t8;
    	let span1;
    	let t9;
    	let t10_value = /*item*/ ctx[13].distance + "";
    	let t10;
    	let t11;
    	let t12;
    	let div1;
    	let button0;
    	let t14;
    	let button1;
    	let t16;
    	let button2;
    	let t18;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[8](/*item*/ ctx[13]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[9](/*item*/ ctx[13]);
    	}

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[10](/*item*/ ctx[13]);
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
    			button1.textContent = "Regénérer";
    			t16 = space();
    			button2 = element("button");
    			button2.textContent = "Supprimer";
    			t18 = space();
    			if (!src_url_equal(img.src, img_src_value = /*item*/ ctx[13].blobUrl)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Miniature de la carte");
    			attr_dev(img, "class", "history-thumbnail svelte-3mxh4e");
    			add_location(img, file$1, 104, 12, 2885);
    			attr_dev(h3, "class", "svelte-3mxh4e");
    			add_location(h3, file$1, 106, 14, 3022);
    			attr_dev(p0, "class", "coordinates svelte-3mxh4e");
    			add_location(p0, file$1, 107, 14, 3061);
    			attr_dev(span0, "class", "date");
    			add_location(span0, file$1, 109, 16, 3172);
    			attr_dev(span1, "class", "distance");
    			add_location(span1, file$1, 110, 16, 3237);
    			attr_dev(p1, "class", "meta-info svelte-3mxh4e");
    			add_location(p1, file$1, 108, 14, 3134);
    			attr_dev(div0, "class", "history-details svelte-3mxh4e");
    			add_location(div0, file$1, 105, 12, 2978);
    			attr_dev(button0, "class", "btn-view svelte-3mxh4e");
    			add_location(button0, file$1, 114, 14, 3388);
    			attr_dev(button1, "class", "btn-regenerate svelte-3mxh4e");
    			add_location(button1, file$1, 115, 14, 3494);
    			attr_dev(button2, "class", "btn-delete svelte-3mxh4e");
    			add_location(button2, file$1, 116, 14, 3601);
    			attr_dev(div1, "class", "history-actions svelte-3mxh4e");
    			add_location(div1, file$1, 113, 12, 3344);
    			attr_dev(div2, "class", "history-item svelte-3mxh4e");
    			add_location(div2, file$1, 103, 10, 2846);
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
    			append_dev(div1, t16);
    			append_dev(div1, button2);
    			append_dev(div2, t18);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false),
    					listen_dev(button2, "click", click_handler_2, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*filteredHistory*/ 4 && !src_url_equal(img.src, img_src_value = /*item*/ ctx[13].blobUrl)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*filteredHistory*/ 4 && t1_value !== (t1_value = /*item*/ ctx[13].location + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*filteredHistory*/ 4 && t4_value !== (t4_value = /*item*/ ctx[13].coordinates + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*filteredHistory*/ 4 && t7_value !== (t7_value = /*item*/ ctx[13].date + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*filteredHistory*/ 4 && t10_value !== (t10_value = /*item*/ ctx[13].distance + "")) set_data_dev(t10, t10_value);
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
    		source: "(103:8) {#each filteredHistory as item}",
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
    			attr_dev(h1, "class", "svelte-3mxh4e");
    			add_location(h1, file$1, 75, 6, 1979);
    			attr_dev(p, "class", "subtitle svelte-3mxh4e");
    			add_location(p, file$1, 76, 6, 2016);
    			attr_dev(div0, "class", "header-section svelte-3mxh4e");
    			add_location(div0, file$1, 74, 4, 1944);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Rechercher par lieu ou coordonnées");
    			attr_dev(input, "class", "svelte-3mxh4e");
    			add_location(input, file$1, 81, 8, 2171);
    			attr_dev(span, "class", "search-icon");
    			add_location(span, file$1, 87, 10, 2357);
    			attr_dev(button0, "class", "search-button svelte-3mxh4e");
    			add_location(button0, file$1, 86, 8, 2316);
    			attr_dev(div1, "class", "search-bar svelte-3mxh4e");
    			add_location(div1, file$1, 80, 6, 2138);
    			attr_dev(label, "for", "sortOrder");
    			attr_dev(label, "class", "svelte-3mxh4e");
    			add_location(label, file$1, 92, 8, 2473);
    			option0.__value = "newest";
    			option0.value = option0.__value;
    			add_location(option0, file$1, 94, 10, 2581);
    			option1.__value = "oldest";
    			option1.value = option1.__value;
    			add_location(option1, file$1, 95, 10, 2635);
    			attr_dev(select, "id", "sortOrder");
    			attr_dev(select, "class", "svelte-3mxh4e");
    			if (/*sortOrder*/ ctx[1] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[7].call(select));
    			add_location(select, file$1, 93, 8, 2524);
    			attr_dev(div2, "class", "sort-controls svelte-3mxh4e");
    			add_location(div2, file$1, 91, 6, 2437);
    			attr_dev(div3, "class", "filters svelte-3mxh4e");
    			add_location(div3, file$1, 79, 4, 2110);
    			attr_dev(div4, "class", "history-list svelte-3mxh4e");
    			add_location(div4, file$1, 100, 4, 2730);
    			attr_dev(button1, "class", "page-btn svelte-3mxh4e");
    			add_location(button1, file$1, 128, 6, 3925);
    			attr_dev(button2, "class", "page-btn active svelte-3mxh4e");
    			add_location(button2, file$1, 129, 6, 3967);
    			attr_dev(button3, "class", "page-btn svelte-3mxh4e");
    			add_location(button3, file$1, 130, 6, 4016);
    			attr_dev(button4, "class", "page-btn svelte-3mxh4e");
    			add_location(button4, file$1, 131, 6, 4058);
    			attr_dev(button5, "class", "page-btn svelte-3mxh4e");
    			add_location(button5, file$1, 132, 6, 4100);
    			attr_dev(div5, "class", "pagination svelte-3mxh4e");
    			add_location(div5, file$1, 127, 4, 3894);
    			attr_dev(div6, "class", "history-page svelte-3mxh4e");
    			add_location(div6, file$1, 73, 2, 1913);
    			attr_dev(div7, "class", "content-auth svelte-3mxh4e");
    			add_location(div7, file$1, 72, 0, 1884);
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
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(select, "change", /*select_change_handler*/ ctx[7])
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
    			$$invalidate(5, historyItems = await Promise.all(itemsWithMeta.map(async el => {
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
    		$$invalidate(5, historyItems = historyItems.filter(h => h.id !== id));
    	}

    	async function handleRegenerate(id) {
    		await regenerateHistory(id);
    		loadHistory();
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
    	const click_handler_1 = item => handleRegenerate(item.id);
    	const click_handler_2 = item => handleDelete(item.id);

    	$$self.$capture_state = () => ({
    		Sidebar,
    		onMount,
    		getHistory,
    		deleteHistory,
    		regenerateHistory,
    		fetchFile,
    		historyItems,
    		loading,
    		loadHistory,
    		handleDelete,
    		handleRegenerate,
    		searchQuery,
    		sortOrder,
    		filteredHistory
    	});

    	$$self.$inject_state = $$props => {
    		if ('historyItems' in $$props) $$invalidate(5, historyItems = $$props.historyItems);
    		if ('loading' in $$props) loading = $$props.loading;
    		if ('searchQuery' in $$props) $$invalidate(0, searchQuery = $$props.searchQuery);
    		if ('sortOrder' in $$props) $$invalidate(1, sortOrder = $$props.sortOrder);
    		if ('filteredHistory' in $$props) $$invalidate(2, filteredHistory = $$props.filteredHistory);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*historyItems, searchQuery, sortOrder*/ 35) {
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
    		handleRegenerate,
    		historyItems,
    		input_input_handler,
    		select_change_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2
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

    // (430:1) {:else}
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
    			attr_dev(h1, "class", "svelte-1t6sz4d");
    			add_location(h1, file, 432, 3, 10193);
    			attr_dev(div, "class", "card svelte-1t6sz4d");
    			add_location(div, file, 431, 2, 10128);
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
    		source: "(430:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (358:1) {#if $isAuthenticated}
    function create_if_block(ctx) {
    	let sidebar;
    	let t;
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
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(sidebar, target, anchor);
    			insert_dev(target, t, anchor);

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
    			if (detaching) detach_dev(t);

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
    		source: "(358:1) {#if $isAuthenticated}",
    		ctx
    	});

    	return block;
    }

    // (427:41) 
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
    		source: "(427:41) ",
    		ctx
    	});

    	return block;
    }

    // (425:37) 
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
    		source: "(425:37) ",
    		ctx
    	});

    	return block;
    }

    // (423:40) 
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
    		source: "(423:40) ",
    		ctx
    	});

    	return block;
    }

    // (421:42) 
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
    		source: "(421:42) ",
    		ctx
    	});

    	return block;
    }

    // (363:2) {#if currentPage === 'carte'}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let form;
    	let label0;
    	let t2;
    	let input0;
    	let t3;
    	let label1;
    	let t4;
    	let input1;
    	let t5;
    	let label2;
    	let t6;
    	let input2;
    	let t7;
    	let button;
    	let t9;
    	let t10;
    	let div0_transition;
    	let t11;
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
    			h1.textContent = "Générateur de carte stylisée";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Latitude :\n\t\t\t\t\t\t\t");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Longitude :\n\t\t\t\t\t\t\t");
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Distance (m) :\n\t\t\t\t\t\t\t");
    			input2 = element("input");
    			t7 = space();
    			button = element("button");
    			button.textContent = "Générer la carte";
    			t9 = space();
    			if (if_block0) if_block0.c();
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			if (if_block2) if_block2.c();
    			attr_dev(h1, "class", "svelte-1t6sz4d");
    			add_location(h1, file, 365, 5, 8025);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.000001");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1t6sz4d");
    			add_location(input0, file, 369, 7, 8153);
    			attr_dev(label0, "class", "svelte-1t6sz4d");
    			add_location(label0, file, 367, 6, 8120);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.000001");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-1t6sz4d");
    			add_location(input1, file, 373, 7, 8279);
    			attr_dev(label1, "class", "svelte-1t6sz4d");
    			add_location(label1, file, 371, 6, 8245);
    			attr_dev(input2, "type", "number");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-1t6sz4d");
    			add_location(input2, file, 377, 7, 8409);
    			attr_dev(label2, "class", "svelte-1t6sz4d");
    			add_location(label2, file, 375, 6, 8372);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-1t6sz4d");
    			add_location(button, file, 380, 6, 8492);
    			attr_dev(form, "class", "svelte-1t6sz4d");
    			add_location(form, file, 366, 5, 8068);
    			attr_dev(div0, "id", "carte");
    			attr_dev(div0, "class", "card svelte-1t6sz4d");
    			add_location(div0, file, 364, 4, 7947);
    			attr_dev(div1, "class", "content-auth svelte-1t6sz4d");
    			add_location(div1, file, 363, 3, 7916);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*latitude*/ ctx[2]);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, input1);
    			set_input_value(input1, /*longitude*/ ctx[3]);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(label2, t6);
    			append_dev(label2, input2);
    			set_input_value(input2, /*distance*/ ctx[4]);
    			append_dev(form, t7);
    			append_dev(form, button);
    			append_dev(div0, t9);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t10);
    			if (if_block1) if_block1.m(div0, null);
    			append_dev(div1, t11);
    			if (if_block2) if_block2.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[22]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[23]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[24]),
    					listen_dev(form, "submit", prevent_default(/*generateMap*/ ctx[9]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*latitude*/ 4 && to_number(input0.value) !== /*latitude*/ ctx[2]) {
    				set_input_value(input0, /*latitude*/ ctx[2]);
    			}

    			if (dirty[0] & /*longitude*/ 8 && to_number(input1.value) !== /*longitude*/ ctx[3]) {
    				set_input_value(input1, /*longitude*/ ctx[3]);
    			}

    			if (dirty[0] & /*distance*/ 16 && to_number(input2.value) !== /*distance*/ ctx[4]) {
    				set_input_value(input2, /*distance*/ ctx[4]);
    			}

    			if (/*loading*/ ctx[6]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_4(ctx);
    					if_block0.c();
    					if_block0.m(div0, t10);
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
    		source: "(363:2) {#if currentPage === 'carte'}",
    		ctx
    	});

    	return block;
    }

    // (383:5) {#if loading}
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
    			attr_dev(div, "class", "loading-spinner svelte-1t6sz4d");
    			add_location(div, file, 383, 6, 8578);
    			set_style(p, "text-align", "center");
    			add_location(p, file, 384, 6, 8620);
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
    		source: "(383:5) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (387:5) {#if error}
    function create_if_block_3(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[7]);
    			attr_dev(p, "class", "error svelte-1t6sz4d");
    			add_location(p, file, 387, 6, 8712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*error*/ 128) set_data_dev(t, /*error*/ ctx[7]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(387:5) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (392:4) {#if svgUrl}
    function create_if_block_2(ctx) {
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
    			attr_dev(h2, "class", "svelte-1t6sz4d");
    			add_location(h2, file, 392, 5, 8790);
    			attr_dev(button0, "aria-label", "Zoom In");
    			attr_dev(button0, "class", "svelte-1t6sz4d");
    			add_location(button0, file, 406, 8, 9313);
    			attr_dev(button1, "aria-label", "Zoom Out");
    			attr_dev(button1, "class", "svelte-1t6sz4d");
    			add_location(button1, file, 407, 8, 9379);
    			attr_dev(button2, "aria-label", "Rotate");
    			attr_dev(button2, "class", "svelte-1t6sz4d");
    			add_location(button2, file, 408, 8, 9447);
    			attr_dev(div0, "class", "zoom-controls svelte-1t6sz4d");
    			add_location(div0, file, 405, 7, 9277);
    			if (!src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[5])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Carte stylisée");
    			attr_dev(img, "class", "svelte-1t6sz4d");
    			set_style(img, "transform", /*transformValue*/ ctx[8]);
    			add_location(img, file, 410, 7, 9528);
    			attr_dev(div1, "class", "svg-container svelte-1t6sz4d");
    			attr_dev(div1, "role", "application");
    			attr_dev(div1, "aria-label", "Carte stylisée");
    			add_location(div1, file, 395, 6, 9004);
    			attr_dev(div2, "class", "card svelte-1t6sz4d");
    			add_location(div2, file, 393, 5, 8864);
    			attr_dev(button3, "class", "svelte-1t6sz4d");
    			add_location(button3, file, 415, 7, 9764);
    			attr_dev(a, "download", "carte.svg");
    			attr_dev(a, "href", /*svgUrl*/ ctx[5]);
    			add_location(a, file, 414, 6, 9718);
    			attr_dev(div3, "class", "download-container svelte-1t6sz4d");
    			add_location(div3, file, 413, 5, 9679);
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
    			if (!current || dirty[0] & /*svgUrl*/ 32 && !src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[5])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty[0] & /*transformValue*/ 256) {
    				set_style(img, "transform", /*transformValue*/ ctx[8]);
    			}

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
    		source: "(392:4) {#if svgUrl}",
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
    			attr_dev(main, "class", "svelte-1t6sz4d");
    			add_location(main, file, 356, 0, 7745);
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

    		// Configurer la navigation basée sur le hash
    		setActivePage();

    		window.addEventListener('hashchange', setActivePage);

    		// Nettoyage lors du démontage du composant
    		return () => {
    			window.removeEventListener('hashchange', setActivePage);
    		};
    	});

    	async function generateMap() {
    		$$invalidate(6, loading = true);
    		$$invalidate(7, error = "");
    		$$invalidate(5, svgUrl = "");

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
    		$isAuthenticated
    	});

    	$$self.$inject_state = $$props => {
    		if ('currentPage' in $$props) $$invalidate(1, currentPage = $$props.currentPage);
    		if ('latitude' in $$props) $$invalidate(2, latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate(3, longitude = $$props.longitude);
    		if ('distance' in $$props) $$invalidate(4, distance = $$props.distance);
    		if ('svgUrl' in $$props) $$invalidate(5, svgUrl = $$props.svgUrl);
    		if ('loading' in $$props) $$invalidate(6, loading = $$props.loading);
    		if ('error' in $$props) $$invalidate(7, error = $$props.error);
    		if ('scale' in $$props) $$invalidate(18, scale$1 = $$props.scale);
    		if ('rotate' in $$props) $$invalidate(19, rotate = $$props.rotate);
    		if ('usePublicEndpoint' in $$props) usePublicEndpoint = $$props.usePublicEndpoint;
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
    		currentPage,
    		latitude,
    		longitude,
    		distance,
    		svgUrl,
    		loading,
    		error,
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
