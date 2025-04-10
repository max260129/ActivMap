
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

    /* src/App.svelte generated by Svelte v3.59.2 */
    const file = "src/App.svelte";

    // (288:2) {#if loading}
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let p;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Génération en cours...";
    			attr_dev(div, "class", "loading-spinner svelte-8oap6u");
    			add_location(div, file, 288, 3, 5960);
    			set_style(p, "text-align", "center");
    			add_location(p, file, 289, 3, 5999);
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
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(288:2) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (292:2) {#if error}
    function create_if_block_1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[5]);
    			attr_dev(p, "class", "error svelte-8oap6u");
    			add_location(p, file, 292, 3, 6082);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 32) set_data_dev(t, /*error*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(292:2) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (297:1) {#if svgUrl}
    function create_if_block(ctx) {
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
    			attr_dev(h2, "class", "svelte-8oap6u");
    			add_location(h2, file, 297, 2, 6145);
    			attr_dev(button0, "aria-label", "Zoom In");
    			attr_dev(button0, "class", "svelte-8oap6u");
    			add_location(button0, file, 308, 5, 6501);
    			attr_dev(button1, "aria-label", "Zoom Out");
    			attr_dev(button1, "class", "svelte-8oap6u");
    			add_location(button1, file, 309, 5, 6564);
    			attr_dev(button2, "aria-label", "Rotate");
    			attr_dev(button2, "class", "svelte-8oap6u");
    			add_location(button2, file, 310, 5, 6629);
    			attr_dev(div0, "class", "zoom-controls svelte-8oap6u");
    			add_location(div0, file, 307, 4, 6468);
    			if (!src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Carte stylisée");
    			attr_dev(img, "class", "svelte-8oap6u");
    			set_style(img, "transform", /*transformValue*/ ctx[6]);
    			add_location(img, file, 312, 4, 6704);
    			attr_dev(div1, "class", "svg-container svelte-8oap6u");
    			add_location(div1, file, 299, 3, 6280);
    			attr_dev(div2, "class", "card svelte-8oap6u");
    			add_location(div2, file, 298, 2, 6216);
    			attr_dev(button3, "class", "svelte-8oap6u");
    			add_location(button3, file, 317, 4, 6925);
    			attr_dev(a, "download", "carte.svg");
    			attr_dev(a, "href", /*svgUrl*/ ctx[3]);
    			add_location(a, file, 316, 3, 6882);
    			attr_dev(div3, "class", "download-container svelte-8oap6u");
    			add_location(div3, file, 315, 2, 6846);
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
    					listen_dev(button0, "click", /*zoomIn*/ ctx[9], false, false, false, false),
    					listen_dev(button1, "click", /*zoomOut*/ ctx[10], false, false, false, false),
    					listen_dev(button2, "click", /*rotateMap*/ ctx[11], false, false, false, false),
    					listen_dev(div1, "wheel", prevent_default(/*handleWheel*/ ctx[8]), false, true, false, false),
    					listen_dev(div1, "mousedown", /*startDrag*/ ctx[12], false, false, false, false),
    					listen_dev(div1, "mousemove", /*drag*/ ctx[13], false, false, false, false),
    					listen_dev(div1, "mouseup", /*endDrag*/ ctx[14], false, false, false, false),
    					listen_dev(div1, "mouseleave", /*endDrag*/ ctx[14], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*svgUrl*/ 8 && !src_url_equal(img.src, img_src_value = /*svgUrl*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*transformValue*/ 64) {
    				set_style(img, "transform", /*transformValue*/ ctx[6]);
    			}

    			if (!current || dirty & /*svgUrl*/ 8) {
    				attr_dev(a, "href", /*svgUrl*/ ctx[3]);
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
    		id: create_if_block.name,
    		type: "if",
    		source: "(297:1) {#if svgUrl}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div;
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
    	let div_transition;
    	let t11;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*loading*/ ctx[4] && create_if_block_2(ctx);
    	let if_block1 = /*error*/ ctx[5] && create_if_block_1(ctx);
    	let if_block2 = /*svgUrl*/ ctx[3] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Générateur de carte stylisée";
    			t1 = space();
    			form = element("form");
    			label0 = element("label");
    			t2 = text("Latitude :\n\t\t\t\t");
    			input0 = element("input");
    			t3 = space();
    			label1 = element("label");
    			t4 = text("Longitude :\n\t\t\t\t");
    			input1 = element("input");
    			t5 = space();
    			label2 = element("label");
    			t6 = text("Distance (m) :\n\t\t\t\t");
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
    			attr_dev(h1, "class", "svelte-8oap6u");
    			add_location(h1, file, 271, 2, 5465);
    			attr_dev(input0, "type", "number");
    			attr_dev(input0, "step", "0.000001");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-8oap6u");
    			add_location(input0, file, 275, 4, 5581);
    			attr_dev(label0, "class", "svelte-8oap6u");
    			add_location(label0, file, 273, 3, 5554);
    			attr_dev(input1, "type", "number");
    			attr_dev(input1, "step", "0.000001");
    			input1.required = true;
    			attr_dev(input1, "class", "svelte-8oap6u");
    			add_location(input1, file, 279, 4, 5695);
    			attr_dev(label1, "class", "svelte-8oap6u");
    			add_location(label1, file, 277, 3, 5667);
    			attr_dev(input2, "type", "number");
    			input2.required = true;
    			attr_dev(input2, "class", "svelte-8oap6u");
    			add_location(input2, file, 283, 4, 5813);
    			attr_dev(label2, "class", "svelte-8oap6u");
    			add_location(label2, file, 281, 3, 5782);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-8oap6u");
    			add_location(button, file, 285, 3, 5883);
    			attr_dev(form, "class", "svelte-8oap6u");
    			add_location(form, file, 272, 2, 5505);
    			attr_dev(div, "class", "card svelte-8oap6u");
    			add_location(div, file, 270, 1, 5401);
    			attr_dev(main, "class", "svelte-8oap6u");
    			add_location(main, file, 269, 0, 5393);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, form);
    			append_dev(form, label0);
    			append_dev(label0, t2);
    			append_dev(label0, input0);
    			set_input_value(input0, /*latitude*/ ctx[0]);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(label1, t4);
    			append_dev(label1, input1);
    			set_input_value(input1, /*longitude*/ ctx[1]);
    			append_dev(form, t5);
    			append_dev(form, label2);
    			append_dev(label2, t6);
    			append_dev(label2, input2);
    			set_input_value(input2, /*distance*/ ctx[2]);
    			append_dev(form, t7);
    			append_dev(form, button);
    			append_dev(div, t9);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t10);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(main, t11);
    			if (if_block2) if_block2.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[19]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[20]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[21]),
    					listen_dev(form, "submit", prevent_default(/*generateMap*/ ctx[7]), false, true, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*latitude*/ 1 && to_number(input0.value) !== /*latitude*/ ctx[0]) {
    				set_input_value(input0, /*latitude*/ ctx[0]);
    			}

    			if (dirty & /*longitude*/ 2 && to_number(input1.value) !== /*longitude*/ ctx[1]) {
    				set_input_value(input1, /*longitude*/ ctx[1]);
    			}

    			if (dirty & /*distance*/ 4 && to_number(input2.value) !== /*distance*/ ctx[2]) {
    				set_input_value(input2, /*distance*/ ctx[2]);
    			}

    			if (/*loading*/ ctx[4]) {
    				if (if_block0) ; else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t10);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*svgUrl*/ ctx[3]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty & /*svgUrl*/ 8) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(main, null);
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
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -20, duration: 600 }, true);
    				div_transition.run(1);
    			});

    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { y: -20, duration: 600 }, false);
    			div_transition.run(0);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching && div_transition) div_transition.end();
    			if (if_block2) if_block2.d();
    			mounted = false;
    			run_all(dispose);
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

    const minScale = 0.5;
    const maxScale = 3.0;

    function instance($$self, $$props, $$invalidate) {
    	let transformValue;
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

    	// Variables pour le panning
    	let translateX = 0;

    	let translateY = 0;
    	let isDragging = false;
    	let initialDragX = 0;
    	let initialDragY = 0;
    	let initialTranslateX = 0;
    	let initialTranslateY = 0;

    	async function generateMap() {
    		$$invalidate(4, loading = true);
    		$$invalidate(5, error = "");
    		$$invalidate(3, svgUrl = "");

    		// Réinitialise zoom, rotation et panning
    		$$invalidate(15, scale$1 = 1.0);

    		$$invalidate(16, rotate = 0);
    		$$invalidate(17, translateX = 0);
    		$$invalidate(18, translateY = 0);

    		try {
    			const response = await fetch('http://localhost:5000/generate', {
    				method: 'POST',
    				headers: { 'Content-Type': 'application/json' },
    				body: JSON.stringify({ latitude, longitude, distance })
    			});

    			if (!response.ok) {
    				const errData = await response.json();
    				$$invalidate(5, error = errData.error || "Erreur lors de la génération de la carte.");
    			} else {
    				const blob = await response.blob();
    				$$invalidate(3, svgUrl = URL.createObjectURL(blob));
    			}
    		} catch(err) {
    			$$invalidate(5, error = "Erreur réseau : " + err);
    		} finally {
    			$$invalidate(4, loading = false);
    		}
    	}

    	function handleWheel(e) {
    		e.preventDefault();

    		if (e.deltaY < 0) {
    			$$invalidate(15, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    		} else {
    			$$invalidate(15, scale$1 = Math.max(minScale, scale$1 / 1.1));
    		}
    	}

    	function zoomIn() {
    		$$invalidate(15, scale$1 = Math.min(maxScale, scale$1 * 1.1));
    	}

    	function zoomOut() {
    		$$invalidate(15, scale$1 = Math.max(minScale, scale$1 / 1.1));
    	}

    	// Incrémente la rotation de 15 degrés à chaque clic
    	function rotateMap() {
    		$$invalidate(16, rotate = rotate + 15);
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
    			$$invalidate(17, translateX = initialTranslateX + dx);
    			$$invalidate(18, translateY = initialTranslateY + dy);
    		}
    	}

    	function endDrag() {
    		isDragging = false;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		latitude = to_number(this.value);
    		$$invalidate(0, latitude);
    	}

    	function input1_input_handler() {
    		longitude = to_number(this.value);
    		$$invalidate(1, longitude);
    	}

    	function input2_input_handler() {
    		distance = to_number(this.value);
    		$$invalidate(2, distance);
    	}

    	$$self.$capture_state = () => ({
    		fade,
    		fly,
    		scaleTransition: scale,
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
    		transformValue
    	});

    	$$self.$inject_state = $$props => {
    		if ('latitude' in $$props) $$invalidate(0, latitude = $$props.latitude);
    		if ('longitude' in $$props) $$invalidate(1, longitude = $$props.longitude);
    		if ('distance' in $$props) $$invalidate(2, distance = $$props.distance);
    		if ('svgUrl' in $$props) $$invalidate(3, svgUrl = $$props.svgUrl);
    		if ('loading' in $$props) $$invalidate(4, loading = $$props.loading);
    		if ('error' in $$props) $$invalidate(5, error = $$props.error);
    		if ('scale' in $$props) $$invalidate(15, scale$1 = $$props.scale);
    		if ('rotate' in $$props) $$invalidate(16, rotate = $$props.rotate);
    		if ('translateX' in $$props) $$invalidate(17, translateX = $$props.translateX);
    		if ('translateY' in $$props) $$invalidate(18, translateY = $$props.translateY);
    		if ('isDragging' in $$props) isDragging = $$props.isDragging;
    		if ('initialDragX' in $$props) initialDragX = $$props.initialDragX;
    		if ('initialDragY' in $$props) initialDragY = $$props.initialDragY;
    		if ('initialTranslateX' in $$props) initialTranslateX = $$props.initialTranslateX;
    		if ('initialTranslateY' in $$props) initialTranslateY = $$props.initialTranslateY;
    		if ('transformValue' in $$props) $$invalidate(6, transformValue = $$props.transformValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*translateX, translateY, rotate, scale*/ 491520) {
    			// Transformation combinée : translation, rotation et zoom
    			$$invalidate(6, transformValue = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg) scale(${scale$1})`);
    		}
    	};

    	return [
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
    		init(this, options, instance, create_fragment, safe_not_equal, {});

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
