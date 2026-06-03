$.local = true;

var desktop = Folder.desktop.fsName;
var csvFile = new File(desktop + '/ae_effects_list.csv');
csvFile.open('r');
var lines = csvFile.read().split('\n');
csvFile.close();

var pairs = [];
for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var idx = line.lastIndexOf(',');
    if (idx < 0) continue;
    var name = line.substring(0, idx);
    var match = line.substring(idx + 1);
    if (!match) continue;
    // Escape for JS string
    name = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    match = match.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    pairs.push("'" + match + "':'" + name + "'");
}

var mapFile = new File(desktop + '/name_map.txt');
mapFile.open('w');
mapFile.writeln(pairs.join(',\n'));
mapFile.close();

alert('Generated ' + pairs.length + ' entries to:\n' + desktop + '/name_map.txt');
