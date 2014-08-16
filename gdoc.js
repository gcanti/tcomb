function parse(source) {
    var comments = require('esprima').parse(source, {comment: true}).comments;

    return comments.filter(function(c) {
        // Only block comments with double asterisks
        return c.type == 'Block' && c.value[0] == '*' && c.value[c.value.length - 1] == '*';
    }).map(function(c) {
        // Remove equal prefixed whitespace
        var value = c.value.slice(1, c.value.length - 1).replace(/\s+$/, ''),
            r = /(\n[ \t]+)[^ \t\n]/g,
            prefix,
            result;

        while(result = r.exec(value)) {
            if(prefix === undefined || result[1].length < prefix.length)
                prefix = result[1];
        }

        return value.split(prefix).join('\n').replace(/^\n+/, '');
    }).join('\n\n');
}
exports.parse = parse;