// =====================================================================
// WB CopyCat - ExtendScript
// Generate test comp, capture current comp, rebuild from JSON
// =====================================================================

$.local = true;

// ─── Random helpers ────────────────────────────────────────────────
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randF(min, max) { return Math.random() * (max - min) + min; }
function pick(arr) { return arr[rand(0, arr.length-1)]; }

var COLOR_NAMES = ['Red','Green','Blue','Cyan','Magenta','Yellow','Orange','Purple','Teal','Pink'];
var COLORS = [
    [1,0,0], [0,1,0], [0,0,1], [0,1,1], [1,0,1],
    [1,1,0], [1,0.5,0], [0.5,0,1], [0,0.5,0.5], [1,0.7,0.8]
];
var BLEND_MODES = [BlendMode.NORMAL, BlendMode.SCREEN, BlendMode.MULTIPLY,
    BlendMode.OVERLAY, BlendMode.SOFT_LIGHT, BlendMode.ADD, BlendMode.DIFFERENCE];
var EFFECT_NAMES = ['Fast Blur','Curves','Hue/Saturation','Levels','Fill',
    'Drop Shadow','Sharpen','Color Balance','Tint','Invert','Radial Blur','Directional Blur'];

// ─── Step 1: Generate Test Comp ───────────────────────────────────
function generateTestComp() {
    try {
        var proj = app.project;
        if (!proj) return "ERR:No project open";

        // Create comp
        var comp = proj.items.addComp("CopyCat_Test_" + new Date().getTime(),
            1920, 1080, 1, 5, 30);
        comp.openInViewer();

        var layerCount = rand(5, 8);
        for (var i = 0; i < layerCount; i++) {
            var c = pick(COLORS);
            var name = pick(COLOR_NAMES) + "_" + (i+1);

            // Create solid layer
            var solid = comp.layers.addSolid(
                [c[0],c[1],c[2]],
                name,
                1920, 1080,
                1);

            // Random position
            var pos = solid.property("Transform").property("Position");
            if (i > 0) {
                pos.setValue([rand(100,1820), rand(100,980)]);
            }

            // Random scale
            var scale = solid.property("Transform").property("Scale");
            var s = randF(40, 150);
            scale.setValue([s,s,100]);

            // Random opacity
            solid.property("Transform").property("Opacity").setValue(rand(30,100));

            // Random blend mode (first layer keep normal for background)
            if (i > 0 && Math.random() > 0.3) {
                solid.blendMode = pick(BLEND_MODES);
            }

            // Random rotation
            if (Math.random() > 0.5) {
                solid.property("Transform").property("Rotation").setValue(rand(-30,30));
            }

            // Add 1-3 random effects
            var effectCount = rand(1, 3);
            var usedEffects = [];
            for (var e = 0; e < effectCount; e++) {
                var effName = pick(EFFECT_NAMES);
                if (usedEffects.indexOf(effName) >= 0) { e--; continue; }
                usedEffects.push(effName);

                try {
                    var eff = solid.property("ADBE Effect Parade").addProperty(effName);
                } catch(ex) {
                    try {
                        // Try alternate name format
                        eff = solid.property("ADBE Effect Parade").addProperty("ADBE " + effName);
                    } catch(ex2) { continue; }
                }
            }

            // Keyframes on the first 2 layers
            if (i < 2) {
                var posProp = solid.property("Transform").property("Position");
                var startX = rand(100,700);
                posProp.setValueAtTime(0, [startX, rand(100,980)]);
                posProp.setValueAtTime(2, [startX + rand(-200,200), rand(100,980)]);
                posProp.setValueAtTime(4, [startX, rand(100,980)]);

                var rotProp = solid.property("Transform").property("Rotation");
                rotProp.setValueAtTime(0, 0);
                rotProp.setValueAtTime(4, 360);
            }

            // Random start/end trim
            if (Math.random() > 0.5) {
                solid.inPoint = randF(0, 1);
                solid.outPoint = randF(3.5, 5);
            }
        }

        // Add one adjustment layer with effects
        if (Math.random() > 0.3) {
            var adjLayer = comp.layers.addSolid([0,0,0], "Adjustment", 1920, 1080, 1);
            adjLayer.adjustmentLayer = true;
            adjLayer.blendMode = BlendMode.NORMAL;
            try { adjLayer.property("ADBE Effect Parade").addProperty("Fast Blur"); } catch(e) {}
        }

        return "OK:" + layerCount + " layers created in " + comp.name;
    } catch(e) {
        return "ERR:" + e.toString();
    }
}


// ─── Step 2: Capture Current Comp ─────────────────────────────────
function captureComp() {
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            return "ERR:No active comp";
        }

        var result = {
            compName: comp.name,
            width: comp.width,
            height: comp.height,
            duration: comp.duration,
            frameRate: comp.frameRate,
            layers: [],
            effects: 0,
            keyframes: 0
        };

        for (var li = 1; li <= comp.layers.length; li++) {
            var layer = comp.layer(li);
            var layerData = {
                name: layer.name,
                type: layer.typeName,
                adjust: layer.adjustmentLayer || false,
                enabled: layer.enabled,
                solo: layer.solo || false,
                locked: layer.locked || false,
                blendMode: blendModeToString(layer.blendMode),
                inPoint: layer.inPoint,
                outPoint: layer.outPoint,
                stretch: layer.stretch,
                startTime: layer.startTime,
                transform: {},
                effects: [],
                eco: 0
            };

            // Read transform
            var tf = layer.property("Transform");
            if (tf) {
                var p = tf.property("Position");
                if (p && p.numKeys > 0) {
                    layerData.transform.position = readProperty(p);
                    result.keyframes += p.numKeys;
                } else if (p) {
                    layerData.transform.position = { v: p.value.toString() };
                }

                var s = tf.property("Scale");
                if (s && s.numKeys > 0) {
                    layerData.transform.scale = readProperty(s);
                    result.keyframes += s.numKeys;
                } else if (s) {
                    layerData.transform.scale = { v: s.value.toString() };
                }

                var r = tf.property("Rotation");
                if (r && r.numKeys > 0) {
                    layerData.transform.rotation = readProperty(r);
                    result.keyframes += r.numKeys;
                } else if (r) {
                    layerData.transform.rotation = { v: r.value.toString() };
                }

                var o = tf.property("Opacity");
                if (o && o.numKeys > 0) {
                    layerData.transform.opacity = readProperty(o);
                    result.keyframes += o.numKeys;
                } else if (o) {
                    layerData.transform.opacity = { v: o.value.toString() };
                }

                var ap = tf.property("Anchor Point");
                if (ap) layerData.transform.anchorPoint = { v: ap.value.toString() };
            }

            // Read effects
            var ep = layer.property("ADBE Effect Parade");
            if (ep && ep.numProperties > 0) {
                for (var ei = 1; ei <= ep.numProperties; ei++) {
                    try {
                        var eff = ep.property(ei);
                        var effData = {
                            name: eff.name,
                            matchName: eff.matchName,
                            enabled: eff.enabled,
                            params: []
                        };

                        // Read effect parameters (up to 20 for demo)
                        for (var pi = 1; pi <= Math.min(eff.numProperties, 20); pi++) {
                            try {
                                var param = eff.property(pi);
                                var pName = param.name;
                                var pType = param.propertyValueType;
                                if (pType === PropertyValueType.COLOR) {
                                    var cv = param.value;
                                    effData.params.push({
                                        name: pName, type: "color",
                                        v: [cv[0],cv[1],cv[2],cv.length>3?cv[3]:1]
                                    });
                                } else {
                                    effData.params.push({
                                        name: pName, type: "value",
                                        v: param.value.toString()
                                    });
                                }
                                result.effects++;
                            } catch(epp) {}
                        }
                        layerData.effects.push(effData);
                    } catch(ee) {}
                }
            }

            result.layers.push(layerData);
        }

        return JSON.stringify(result);
    } catch(e) {
        return "ERR:" + e.toString();
    }
}

function readProperty(prop) {
    var data = { v: prop.value.toString(), keys: [] };
    for (var ki = 1; ki <= prop.numKeys; ki++) {
        try {
            data.keys.push({
                t: prop.keyTime(ki),
                i: prop.keyInInterpolationType(ki).toString(),
                o: prop.keyOutInterpolationType(ki).toString(),
                v: prop.keyValue(ki).toString()
            });
        } catch(ek) {}
    }
    return data;
}

function blendModeToString(bm) {
    var map = {};
    map[BlendMode.NORMAL] = "NORMAL";
    map[BlendMode.SCREEN] = "SCREEN";
    map[BlendMode.MULTIPLY] = "MULTIPLY";
    map[BlendMode.OVERLAY] = "OVERLAY";
    map[BlendMode.SOFT_LIGHT] = "SOFT_LIGHT";
    map[BlendMode.ADD] = "ADD";
    map[BlendMode.DIFFERENCE] = "DIFFERENCE";
    map[BlendMode.DARKEN] = "DARKEN";
    map[BlendMode.LIGHTEN] = "LIGHTEN";
    return map[bm] || "NORMAL";
}

function stringToBlendMode(s) {
    var map = {
        "NORMAL": BlendMode.NORMAL,
        "SCREEN": BlendMode.SCREEN,
        "MULTIPLY": BlendMode.MULTIPLY,
        "OVERLAY": BlendMode.OVERLAY,
        "SOFT_LIGHT": BlendMode.SOFT_LIGHT,
        "ADD": BlendMode.ADD,
        "DIFFERENCE": BlendMode.DIFFERENCE,
        "DARKEN": BlendMode.DARKEN,
        "LIGHTEN": BlendMode.LIGHTEN
    };
    return map[s] || BlendMode.NORMAL;
}


// ─── Step 3: Rebuild from JSON ────────────────────────────────────
function rebuildComp(jsonStr) {
    try {
        var data = eval('(' + jsonStr + ')');
        var proj = app.project;
        if (!proj) return "ERR:No project open";

        var comp = proj.items.addComp(data.compName + "_Clone",
            data.width, data.height, 1, data.duration, data.frameRate);
        comp.openInViewer();

        for (var li = 0; li < data.layers.length; li++) {
            var ld = data.layers[li];

            // Create a solid layer (all layers become solids in rebuild for simplicity)
            var layer = comp.layers.addSolid([0.5,0.5,0.5], ld.name, data.width, data.height, 1);

            // Apply basic properties
            layer.enabled = ld.enabled;
            layer.locked = ld.locked;
            layer.blendMode = stringToBlendMode(ld.blendMode);
            layer.inPoint = ld.inPoint;
            layer.outPoint = ld.outPoint;
            layer.adjustmentLayer = ld.adjust;

            // Transform
            var tf = layer.property("Transform");

            if (ld.transform.position) setProperty(tf, "Position", ld.transform.position);
            if (ld.transform.scale) setProperty(tf, "Scale", ld.transform.scale);
            if (ld.transform.rotation) setProperty(tf, "Rotation", ld.transform.rotation);
            if (ld.transform.opacity) setProperty(tf, "Opacity", ld.transform.opacity);
            if (ld.transform.anchorPoint) {
                try { tf.property("Anchor Point").setValue(parseArray(ld.transform.anchorPoint.v)); } catch(e) {}
            }

            // Effects
            for (var ei = 0; ei < ld.effects.length; ei++) {
                var ed = ld.effects[ei];
                try {
                    var eff = layer.property("ADBE Effect Parade").addProperty(ed.matchName);
                    eff.enabled = ed.enabled;
                    for (var pi = 0; pi < ed.params.length; pi++) {
                        var pp = ed.params[pi];
                        try {
                            // Find param by name
                            for (var pj = 1; pj <= eff.numProperties; pj++) {
                                var ep = eff.property(pj);
                                if (ep.name === pp.name) {
                                    if (pp.type === "color") {
                                        ep.setValue(pp.v);
                                    } else {
                                        ep.setValue(parseFloat(pp.v) || 0);
                                    }
                                    break;
                                }
                            }
                        } catch(esp) {}
                    }
                } catch(ee) {}
            }
        }

        return "OK:" + data.layers.length + " layers rebuilt in " + comp.name;
    } catch(e) {
        return "ERR:" + e.toString();
    }
}

function setProperty(tf, name, data) {
    if (!data) return;
    try {
        var prop = tf.property(name);
        if (!prop) return;

        // Set value at current time
        try { prop.setValue(parseArray(data.v)); } catch(esv) {}

        // Set keyframes
        if (data.keys && data.keys.length > 0) {
            for (var ki = 0; ki < data.keys.length; ki++) {
                var k = data.keys[ki];
                try {
                    prop.setValueAtTime(k.t, parseArray(k.v));
                    prop.setInterpolationTypeAtKey(ki+1,
                        parseInterp(k.i), parseInterp(k.o));
                } catch(esk) {}
            }
        }
    } catch(est) {}
}

function parseArray(str) {
    if (!str) return 0;
    str = str.replace(/[\[\]]/g, '');
    var parts = str.split(',').map(function(x){return parseFloat(x)});
    if (parts.length === 1) return parts[0];
    return parts;
}

function parseInterp(s) {
    if (!s || s.indexOf("LINEAR") >= 0) return KeyframeInterpolationType.LINEAR;
    if (s.indexOf("BEZIER") >= 0) return KeyframeInterpolationType.BEZIER;
    if (s.indexOf("HOLD") >= 0) return KeyframeInterpolationType.HOLD;
    return KeyframeInterpolationType.LINEAR;
}

