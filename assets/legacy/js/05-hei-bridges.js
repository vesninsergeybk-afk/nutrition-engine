// nutrition calculator v5.2.22_mobile_critical_hotfix
// Module: 05-hei-bridges.js
// Responsibility: HEI runtime bridges and action bridge.
// Extracted from v3.8.1 monolithic app.js without changing runtime logic.
// ===== extracted inline script 13; id=hei-bridge =====
(function () {
    function debounce(fn, ms) { var t = null; return function () { clearTimeout(t); var a = arguments, c = this; t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
    function defaultEnergy(db, ration) { try {
        if (!db || !db.byKey || !ration)
            return;
        var k = 0;
        for (var i = 0; i < ration.length; i++) {
            var it = ration[i], g = +it.grams || 0, p = db.byKey.get ? db.byKey.get(it.key) : null;
            if (!p || !g)
                continue;
            k += ((p.kcal || 0) * g / 100);
        }
        return Math.round(k);
    }
    catch (e) { } }
    function install(opts) {
        opts = opts || {};
        var db = opts.db, getRation = opts.getRation, getEnergyRef = opts.getEnergyRef, events = opts.events, storageKey = opts.storageKey || 'nutri_ration_v1';
        if (db && !window.DB)
            window.DB = db;
        window.Ration = window.Ration || { current: [] };
        window.STATE = window.STATE || {};
        function norm(r) { if (!Array.isArray(r))
            return []; return r.map(function (x) { return { key: x.key, grams: +x.grams || 0, parent_composite_id: x.parent_composite_id || null }; }).filter(function (x) { return x.key && x.grams >= 0; }); }
        function flat(r) { try {
            var api = window.CompositeFoodFolderV5377 || window.CompositeFoodDecomposerV5377 || window.CompositeFoodDecomposerV5376;
            if (api && typeof api.flattenForCalculation === 'function')
                return api.flattenForCalculation(r || []);
            if (api && typeof api.flattenCompositeForCalculation === 'function')
                return api.flattenCompositeForCalculation(r || []);
        }
        catch (_) { } return r || []; }
        function readR() { try {
            return flat(typeof getRation === 'function' ? getRation() : []);
        }
        catch (_) {
            return [];
        } }
        function readE(dbRef, r) { try {
            if (typeof getEnergyRef === 'function') {
                var v = getEnergyRef();
                if (Number.isFinite(+v))
                    return +v;
            }
        }
        catch (_) { } return defaultEnergy(dbRef, r); }
        var lastRationSignature = '';
        var lastEnergySignature = '';
        var push = debounce(function () {
            var raw = readR(), r = norm(raw), e = readE(db, r);
            var rationSignature = '';
            try {
                rationSignature = JSON.stringify(r);
            }
            catch (_) {
                rationSignature = String(r && r.length || 0);
            }
            var energySignature = Number.isFinite(e) ? String(Math.round(e * 1000) / 1000) : '';
            var rationChanged = rationSignature !== lastRationSignature;
            var energyChanged = energySignature !== lastEnergySignature;
            window.Ration.current = r;
            window.STATE.ration = r;
            if (Number.isFinite(e))
                window.STATE.energy_kcal = e;
            if (!rationChanged && !energyChanged)
                return;
            lastRationSignature = rationSignature;
            lastEnergySignature = energySignature;
            if (!(window.State && typeof window.State.get === 'function')) {
                if (rationChanged) {
                    try {
                        window.dispatchEvent(new Event('ration:changed'));
                    }
                    catch (_) { }
                }
            }
            else {
                try {
                    window.dispatchEvent(new CustomEvent('hei:bridge-updated', { detail: { rationChanged: rationChanged, energyChanged: energyChanged, version: 'v5.3.208' } }));
                }
                catch (_) {
                    try {
                        window.dispatchEvent(new Event('hei:bridge-updated'));
                    }
                    catch (__) { }
                }
            }
            if (energyChanged && Number.isFinite(e)) {
                try {
                    window.dispatchEvent(new CustomEvent('needs:changed', { detail: { source: 'hei-bridge', version: 'v5.3.208' } }));
                }
                catch (_) { }
            }
        }, 50);
        // initial
        push();
        var detach = [];
        if (events && typeof events.on === 'function') {
            var onCh = function () { push(); };
            ['change', 'region', 'needs', 'ration:add', 'ration:remove', 'ration:update'].forEach(function (ev) {
                try {
                    events.on(ev, onCh);
                    detach.push(function () { try {
                        events.off(ev, onCh);
                    }
                    catch (_) { } });
                }
                catch (_) { }
            });
        }
        else {
            if (window.State && typeof window.State.get === 'function') {
                var rationHandler = function () { push(); };
                window.addEventListener('ration:changed', rationHandler);
                detach.push(function () { window.removeEventListener('ration:changed', rationHandler); });
            }
            else {
                var last = '';
                var poll = setInterval(function () { var now = ''; try {
                    now = JSON.stringify(readR());
                }
                catch (_) {
                    now = '';
                } if (now !== last) {
                    last = now;
                    push();
                } }, 700);
                detach.push(function () { clearInterval(poll); });
            }
            var storHandler = function (e) { if (!e || e.key === storageKey)
                push(); };
            window.addEventListener('storage', storHandler);
            detach.push(function () { window.removeEventListener('storage', storHandler); });
        }
        return { refresh: function () { push(); }, destroy: function () { while (detach.length) {
                (detach.pop())();
            } } };
    }
    // Expose
    window.HEIBridge = window.HEIBridge || { install: install };
    // Autostart when DB/State appear
    function tryBoot() {
        var db = (typeof DB !== 'undefined') ? DB : (window.DB || null);
        var stateAvail = (typeof State !== 'undefined' && State && typeof State.get === 'function');
        var events = (typeof Events !== 'undefined') ? Events : window.Events;
        if (db && (stateAvail || window.STATE)) {
            if (!window.__heiBridgeInstance) {
                var getter = stateAvail ? function () { return State.get(); } : function () { return (window.STATE && window.STATE.ration) || []; };
                window.__heiBridgeInstance = window.HEIBridge.install({ db: db, getRation: getter, events: events });
            }
            else {
                try {
                    window.__heiBridgeInstance.refresh();
                }
                catch (_) { }
            }
            return true;
        }
        return false;
    }
    if (!tryBoot()) {
        var bootTimer = setInterval(function () { if (tryBoot()) {
            clearInterval(bootTimer);
        } }, 300);
        setTimeout(function () { try {
            clearInterval(bootTimer);
        }
        catch (_) { } }, 15000);
    }
})();
;
// ===== extracted inline script 14; id=hei-action-bridge =====
(function () {
    if (window.__heiActionBridgeInstalled)
        return;
    window.__heiActionBridgeInstalled = true;
    function tagMatch(p, tag) {
        if (!p)
            return false;
        const C = window.__HEIClassifiers || {};
        const normalize = C.normalizeTag || (x => String(x || '').toLowerCase().trim());
        const t = normalize(tag);
        if (t === 'dairy')
            return !!(C.isDairy && C.isDairy(p));
        if (t === 'fruits')
            return !!(C.isFruit && C.isFruit(p));
        if (t === 'vegetables')
            return !!((C.isVeg && C.isVeg(p)) || (C.isLegume && C.isLegume(p)));
        if (t === 'whole_grains')
            return !!(C.isWholeGrain && C.isWholeGrain(p));
        if (t === 'refined_grains')
            return !!(C.isRefinedGrain && C.isRefinedGrain(p));
        if (t === 'protein_foods')
            return !!(C.isProteinFood && C.isProteinFood(p));
        if (t === 'seafood_plant_protein')
            return !!(C.isSeafoodPlantProtein && C.isSeafoodPlantProtein(p));
        if (t === 'nuts_seeds')
            return !!(C.isNutsSeeds && C.isNutsSeeds(p));
        if (t === 'legumes')
            return !!(C.isLegume && C.isLegume(p));
        if (t === 'seafood')
            return !!(C.isSeafood && C.isSeafood(p));
        if (t === 'soy')
            return !!(C.isSoyProduct && C.isSoyProduct(p));
        if (t === 'animal_protein')
            return !!(C.isProteinFood && C.isProteinFood(p)) && !(C.isSeafoodPlantProtein && C.isSeafoodPlantProtein(p));
        if (t === 'seafood_plant')
            return !!(C.isSeafoodPlantProtein && C.isSeafoodPlantProtein(p));
        return !!(C.hasTag ? C.hasTag(p, t) : (Array.isArray(p.tags) && p.tags.map(normalize).includes(t)));
    }
    function pickByTag(tag) {
        const DBi = window.DB;
        if (!DBi || !Array.isArray(DBi.items))
            return null;
        const list = DBi.items.filter(p => tagMatch(p, tag));
        if (!list.length)
            return null;
        // prefer lower kcal per 100g for adequacy adds, and higher for moderation adds/reduces? Keep simple: sort by name
        list.sort((a, b) => String(a.name_ru || '').localeCompare(String(b.name_ru || ''), 'ru'));
        return list[0];
    }
    function rationByTag(tag) {
        const r = (window.Ration && Array.isArray(window.Ration.current)) ? window.Ration.current : [];
        const DBi = window.DB;
        return r.map(it => ({ it, p: DBi.byKey.get(it.key) })).filter(x => tagMatch(x.p, tag));
    }
    // Add grams by tag (choose a representative item if not in ration)
    window.addEventListener('hei:quick-add', (e) => {
        try {
            const { tag, grams } = e.detail || {};
            if (!tag || !grams)
                return;
            const DBi = window.DB, State = window.State || (window.STATE_API || {});
            let target = rationByTag(tag)[0];
            if (target) {
                const g = Math.min(5000, (target.it.grams || 0) + grams);
                if (State && typeof State.update === 'function')
                    State.update(target.it.key, g);
                else {
                    const it = window.Ration.current.find(x => x.key === target.it.key);
                    if (it)
                        it.grams = g;
                    window.dispatchEvent(new Event('ration:changed'));
                }
            }
            else {
                const p = pickByTag(tag);
                if (!p)
                    return;
                if (State && typeof State.add === 'function')
                    State.add(p.key, grams);
                else {
                    window.Ration.current.push({ key: p.key, grams });
                    window.dispatchEvent(new Event('ration:changed'));
                }
            }
        }
        catch (_) { }
    });
    // Reduce grams by tag
    window.addEventListener('hei:quick-reduce', (e) => {
        try {
            const { tag, grams } = e.detail || {};
            if (!tag || !grams)
                return;
            const arr = rationByTag(tag).sort((a, b) => (b.it.grams || 0) - (a.it.grams || 0));
            let left = grams;
            for (const { it } of arr) {
                if (left <= 0)
                    break;
                const take = Math.min(it.grams || 0, left);
                const g = Math.max(0, (it.grams || 0) - take);
                if (window.State && typeof window.State.update === 'function')
                    window.State.update(it.key, g);
                else {
                    it.grams = g;
                    window.dispatchEvent(new Event('ration:changed'));
                }
                left -= take;
            }
        }
        catch (_) { }
    });
    // Swap: reduce from-tag and add to-tag
    window.addEventListener('hei:swap', (e) => {
        try {
            const d = e.detail || {};
            if (!d || !d.from || !d.to)
                return;
            window.dispatchEvent(new CustomEvent('hei:quick-reduce', { detail: { tag: d.from.tag, grams: +d.from.grams || 0 } }));
            window.dispatchEvent(new CustomEvent('hei:quick-add', { detail: { tag: d.to.tag, grams: +d.to.grams || 0 } }));
        }
        catch (_) { }
    });
    // Reduce sodium (mg) by cutting the saltiest items
    window.addEventListener('hei:reduce-sodium', (e) => {
        var _a;
        try {
            let { mg } = e.detail || {};
            mg = +mg || 0;
            if (mg <= 0)
                return;
            const DBi = window.DB;
            const arr = (((_a = window.Ration) === null || _a === void 0 ? void 0 : _a.current) || []).map(it => ({ it, p: DBi.byKey.get(it.key) }))
                .filter(x => x.p && (x.p.sodium_mg || 0) > 0)
                .sort((a, b) => (b.p.sodium_mg || 0) - (a.p.sodium_mg || 0));
            for (const { it, p } of arr) {
                if (mg <= 0)
                    break;
                const mgPerGram = (p.sodium_mg || 0) / 100;
                if (mgPerGram <= 0)
                    continue;
                const gramsToCut = Math.min(it.grams || 0, Math.ceil(mg / mgPerGram));
                const g = Math.max(0, (it.grams || 0) - gramsToCut);
                if (window.State && typeof window.State.update === 'function')
                    window.State.update(it.key, g);
                else {
                    it.grams = g;
                    window.dispatchEvent(new Event('ration:changed'));
                }
                mg -= gramsToCut * mgPerGram;
            }
        }
        catch (_) { }
    });
})();
;
