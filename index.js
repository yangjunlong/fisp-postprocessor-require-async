/*
 * fis
 * http://fis.baidu.com/
 */

'use strict';
function pregQuote (str, delimiter) {
    // http://kevin.vanzonneveld.net
    return (str + '').replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
}

//require.async(path) to require resource
function parseJs(content, file, conf){
    var reg = /"(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|(\/\/[^\r\n\f]+|\/\*[\s\S]+?(?:\*\/|$))|\b(require\.async)\s*\(\s*("(?:[^\\"\r\n\f]|\\[\s\S])*"|'(?:[^\\'\n\r\f]|\\[\s\S])*'|\[[\s\S]*?\])\s*/g;
    return content.replace(reg, function(m, comment, type, value){
        if(type){
            switch (type){
                case 'require.async':
                    var hasBrackets = false;
                    var values = [];
                    value = value.trim().replace(/(^\[|\]$)/g, function(m, v) {
                        if (v) {
                            hasBrackets = true;
                        }
                        return '';
                    });
                    values = value.split(/\s*,\s*/);
                    values = values.map(function(v) {
                        var info = fis.util.stringQuote(v);
                        v = info.rest.trim();
                        var uri = fis.uri.getId(v, file.dirname);
                        if (file.extras.async.indexOf(uri.id) < 0) {
                            file.extras.async.push(uri.id);
                        }
                        return info.quote + uri.id + info.quote;
                    });
                    if (hasBrackets) {
                        m = 'require.async([' + values.join(', ') + ']';
                    } else {
                        m = 'require.async(' + values.join(', ');
                    }
                    break;
            }
        }
        return m;
    });
}

//<script|style ...>...</script|style> to analyse as js|css
function parseHtml(content, file, conf){
    var ld = pregQuote(conf.ld);
    var rd = pregQuote(conf.rd);
    var reg = /(<script(?:\s+[\s\S]*?["'\s\w\/]>|\s*>))([\s\S]*?)(?=<\/script>|$)/ig;
    content = content.replace(reg, function(m, $1, $2) {
        if($1){//<script>
            m = $1 + parseJs($2, file, conf);
        }
        return m;
    });
    reg = new RegExp('('+ld+'script(?:\\s+[\\s\\S]*?["\'\\s\\w\\/]'+rd+'|\\s*'+rd+'))([\\s\\S]*?)(?='+ld+'\\/script'+rd+'|$)', 'ig');
    return content.replace(reg, function(m, $1, $2) {
        if($1){//<script>
            m = $1 + parseJs($2, file, conf);
        }
        return m;
    });
}

module.exports = function(content, file, conf){

    conf.ld = conf.ld ? conf.ld : '{%';
    conf.rd = conf.rd ? conf.rd : '%}';

    var initial = false;
    if (file.extras == undefined) {
        file.extras = {};
        initial = true;
    }
    file.extras.async = [];
    if (file.rExt === '.tpl' || file.rExt === '.html') {
        content = parseHtml(content, file, conf);
        if (file.extras.isPage) {
            var reg = new RegExp('(?:'+pregQuote(conf.ld) +'\\*[\\s\\S]+?(?:\\*'+pregQuote(conf.rd)+'|$))|(?:([\\s\\S]*)('+pregQuote(conf.ld)+'\\/block'+pregQuote(conf.rd)+'))', 'im');
            content = content.replace(reg,
                function(m, before, blockClose) {
                    if (blockClose) {
                        m = before +
                            conf.ld + 'require name="' + file.id + '"' + conf.rd +
                            blockClose;
                    }
                    return m;
                }
            );
            //don't match block
            if (!reg.test(content)) {
                content = content + conf.ld + 'require name="' + file.id + '"' + conf.rd;
            }
        }
    } else if (file.rExt === '.js') {
        content = parseJs(content, file, conf);
    }
    //
    if (file.extras.async.length == 0) {
        delete file.extras.async;
        if (initial) {
            delete file.extras;
        }
    }
    return content;
};
