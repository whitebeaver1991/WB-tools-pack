var fs = require('fs');
var lines = fs.readFileSync('C:/Users/ZENGJUNQI.HOCHA/Desktop/ae_effects_list.csv', 'utf8').split('\n');
var pairs = [];
for (var i = 1; i < lines.length; i++) {
    var line = lines[i];
    if (!line) continue;
    var idx = line.lastIndexOf(',');
    if (idx < 0) continue;
    var name = line.substring(0, idx);
    var match = line.substring(idx + 1);
    if (!match) continue;
    name = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    match = match.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    pairs.push("'" + match + "':'" + name + "'");
}
fs.writeFileSync('C:/AE_FX_Panel/AE_FX_Manager (1)/AE_FX_Manager/WB_PieMenu_Official/scripts/name_map.txt', pairs.join(',\n'), 'utf8');
console.log('Done: ' + pairs.length + ' entries');
