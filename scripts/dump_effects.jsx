$.local = true;

var desktop = Folder.desktop.fsName;
var filePath = desktop + '/ae_effects_list.csv';

var f = new File(filePath);
f.open('w');
f.writeln('display_name,match_name');

var unique = {};
var total = 0;

function addEffect(e) {
    var match = e.matchName || '';
    if (!match || unique[match]) return;
    unique[match] = true;
    var name = '';
    try {
        if (e.displayName && e.displayName !== e.matchName) name = e.displayName;
        else if (e.name) name = e.name;
    } catch(ex) {}
    if (!name) name = match;
    name = name.replace(/,/g, ';').replace(/\n/g, ' ');
    match = match.replace(/,/g, ';').replace(/\n/g, ' ');
    f.writeln(name + ',' + match);
    total++;
}

// Method 1: app.effects (covers all installed effects)
try {
    var effects = app.effects;
    if (effects && effects.length) {
        for (var i = 0; i < effects.length; i++) {
            addEffect(effects[i]);
        }
    }
} catch(e) {}

// Method 2: iterate categories (catches effects app.effects might miss)
try {
    var cats = app.categories;
    if (cats && cats.length) {
        for (var c = 0; c < cats.length; c++) {
            var catEffects = cats[c].effects;
            if (!catEffects) continue;
            for (var i = 0; i < catEffects.length; i++) {
                addEffect(catEffects[i]);
            }
        }
    }
} catch(ex) {}

f.close();

alert('Done! ' + total + ' unique effects exported to:\n' + filePath);
