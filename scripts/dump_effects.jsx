$.local = true;

var desktop = Folder.desktop.fsName;
var filePath = desktop + '/ae_effects_list.csv';

var f = new File(filePath);
f.open('w');
f.writeln('display_name,match_name');

var effects = app.effects;
if (effects && effects.length) {
    for (var i = 0; i < effects.length; i++) {
        var e = effects[i];
        var name = (e.name || '').replace(/,/g, ' ').replace(/\n/g, ' ');
        var match = (e.matchName || '').replace(/,/g, ' ').replace(/\n/g, ' ');
        f.writeln(name + ',' + match);
    }
}
f.close();

alert('Done! ' + effects.length + ' effects exported to:\n' + filePath);
