function findHighestZIndex(jq_elem_level) {
    var elems = jq_elem_level ? jq_elem_level.parent().children("*") : $("*");
    var highest = 0;
    var highest_elem = null;
    elems.each(function () {
        var this_obj = $(this);
        var zindex = this_obj.css('z-index');
        if (zindex != '2147483647' && zindex != 'auto' && !this_obj.is('iframe') && !this_obj.parents('#jivo-iframe-container').is('div')) {
            zindex = parseInt(zindex);
            if (zindex > highest) {
                highest = zindex;
                highest_elem = this_obj;
            }
        }
    });
    // console.log(highest+" "+ highest_elem[0].nodeName+" "+ highest_elem.attr('id') + " " + highest_elem.attr('class'));
    return highest;
}
var utf8_encode = function (string) {
    string = string.replace(/\r\n/g, "\n");
    var utftext = "";

    for (var n = 0; n < string.length; n++) {

        var c = string.charCodeAt(n);

        if (c < 128) {
            utftext += String.fromCharCode(c);
        }
        else if ((c > 127) && (c < 2048)) {
            utftext += String.fromCharCode((c >> 6) | 192);
            utftext += String.fromCharCode((c & 63) | 128);
        }
        else {
            utftext += String.fromCharCode((c >> 12) | 224);
            utftext += String.fromCharCode(((c >> 6) & 63) | 128);
            utftext += String.fromCharCode((c & 63) | 128);
        }

    }

    return utftext;
};

var utf8_decode = function (utftext) {
    var string = "";
    var i = 0;
    var c = 0;
    var c2 = c;
    var c3 = c;

    while (i < utftext.length) {

        c = utftext.charCodeAt(i);

        if (c < 128) {
            string += String.fromCharCode(c);
            i++;
        }
        else if ((c > 191) && (c < 224)) {
            c2 = utftext.charCodeAt(i + 1);
            string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
            i += 2;
        }
        else {
            c2 = utftext.charCodeAt(i + 1);
            c3 = utftext.charCodeAt(i + 2);
            string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
            i += 3;
        }

    }

    return string;
};

var url_code = {
    encode: function (string) {
        return escape(utf8_encode(string));
    },
    decode: function (string) {
        if (string.search(/\%[a-z\d_.-]{2}\%/ig) == -1)
            return string;
        return utf8_decode(unescape(string));
    }
};

function escapeHtml(text) {
    var map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };

    return text.replace(/[&<>"']/g, function (m) {
        return map[m];
    });
}

function unEscapeHtml(text) {
    var map = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#039;': "'"
    };

    return text.replace(/(&amp;|&lt;|&gt;|&quot;|&#039;)/g, function (m) {
        return map[m];
    });
}

var check_email_format = function (email) {
    return /^([0-9a-z]([-_.]?[0-9a-z])*@[0-9a-z]([-.]?[0-9a-z])*\.[a-wyz][a-z](fo|g|l|m|mes|o|op|pa|ro|seum|t|u|v|z)?)$/i.test(email);
};

jQuery(function ($) {
    $.fn.getStyleObject = function () {
        var dom = this.get(0);
        var style;
        var returns = {};
        if (window.getComputedStyle) {
            var camelize = function (a, b) {
                return b.toUpperCase();
            };
            style = window.getComputedStyle(dom, null);
            for (var i = 0, l = style.length; i < l; i++) {
                var prop = style[i];
                var camel = prop.replace(/\-([a-z])/g, camelize);
                var val = style.getPropertyValue(prop);
                returns[camel] = val;
            }
            return returns;
        }
        if (style = dom.currentStyle) {
            for (var prop in style) {
                returns[prop] = style[prop];
            }
            return returns;
        }
        return this.css();
    };
    $.fn.get_int_css_val = function (val) {
        var tmp = this.css(val);
        var int_v = 0;
        if (typeof tmp != 'undefined' && tmp != "")
            int_v = parseInt(tmp, 10);
        return int_v;
    };

    $.fn.hasAttr = function (attr) {
        var obj = this.attr(attr);
        if (typeof obj !== typeof undefined && obj !== false)
            return true;
        return false;
    };
});

function preg_replace(patterns, replacements, text) {
    var len = patterns.length;
    if (len != replacements.length)
        return false;
    for (var i = 0; i < len; i++)
        text = text.replace(new RegExp(patterns[i], 'g'), replacements[i], text);
    return text;
}

var page_unloaded = false;
$(function () {
    $(window).on("beforeunload.system", function (e) {
        page_unloaded = true;
        setTimeout(function () {
            page_unloaded = false;
        }, 1000);
    });
});

function get_ajax(module, query_object, callback_function, custom_alert) {
    query_object.ajax_module = module;
    $.get(window.location.href.replace(window.location.hash, ""), query_object,
        function (data) {
            if (page_unloaded)
                return;
            var check = "<->ajax_complete<->";
            var check_result = data.substring(data.length - check.length);
            if (check_result != check) {
                if (custom_alert)
                    smart_text_box.show_text_window("ERROR GET AJAX: " + data);
                else
                    alert("ERROR GET AJAX: " + data);
                callback_function(null);
                return;
            }
            data = data.substring(0, data.length - check.length);
            callback_function(data);
        });
}
function get_ajax_href(module, href, callback_function, custom_alert) {
    var query_object = {'ajax_module': module};
    $.get(href, query_object,
        function (data) {
            if (page_unloaded)
                return;
            var check = "<->ajax_complete<->";
            var check_result = data.substring(data.length - check.length);
            if (check_result != check) {
                if (custom_alert)
                    smart_text_box.show_text_window(data);
                else
                    alert("ERROR GET AJAX: " + data);
                callback_function(null);
                return;
            }
            data = data.substring(0, data.length - check.length);
            callback_function(data);
        })
        .fail(function (XMLHttpRequest, data, error) {
            if (page_unloaded)
                return;
            if (custom_alert)
                smart_text_box.show_text_window("ERROR GET AJAX: <div style='white-space: pre-wrap; word-wrap:break-word;'>" + window.location.href + " " + $.toJSON(query_object) +
                    "</div><br>ERROR TEXT: " + error);
            else
                alert("ERROR GET AJAX: " + data);
            callback_function(null);
        });
}

function post_ajax(module, query_object, callback_function, custom_alert) {
    query_object.ajax_module = module;
    var obj = $.post(window.location.href.replace(window.location.hash, ""), query_object,
        function (data) {
            if (page_unloaded)
                return;
            var check = "<->ajax_complete<->";
            var check_result = data.substring(data.length - check.length);
            if (check_result != check) {
                if (custom_alert)
                    smart_text_box.show_text_window(data);
                else
                    alert("ERROR GET AJAX: " + data);
                callback_function(null);
                return;
            }
            data = data.substring(0, data.length - check.length);
            if (callback_function)
                callback_function(data);
        })
        .fail(function (xhr, status, error) {
            if (page_unloaded)
                return;
            if (custom_alert)
                smart_text_box.show_text_window("ERROR GET AJAX: <div style='white-space: pre-wrap; word-wrap:break-word;'>" + window.location.href + " " + $.toJSON(query_object) +
                    "</div><br>ERROR TEXT: " + error);
            else
                alert("ERROR GET AJAX: " + error);
            callback_function(null);
        });
}

function post_file(src, module, query_object, callback_function, custom_alert, name_input_img) {
    if (!name_input_img)
        name_input_img = 'uploaded-img';
    var load_callback = function (data_img) {
        query_object.ajax_module = module;
        var data = new FormData();
        data.append(name_input_img, data_img);
        for (var index in query_object) {
            var attr = query_object[index];
            data.append(index, attr);
        }
        data_img = null;
        $.ajax({
            url: window.location.href.replace(window.location.hash, ""),
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            type: 'POST',
            success: function (data) {
                if (page_unloaded)
                    return;
                var check = "<->ajax_complete<->";
                var check_result = data.substring(data.length - check.length);
                if (check_result != check) {
                    if (custom_alert)
                        smart_text_box.show_text_window(data);
                    else
                        alert("ERROR GET AJAX: " + data);
                    callback_function(null);
                    return;
                }
                data = data.substring(0, data.length - check.length);
                if (callback_function)
                    callback_function(data);
            },
            fail: function (XMLHttpRequest, data, error) {
                if (page_unloaded)
                    return;
                if (custom_alert)
                    smart_text_box.show_text_window("ERROR GET AJAX: <div style='white-space: pre-wrap; word-wrap:break-word;'>" + window.location.href + " " + $.toJSON(query_object) +
                        "</div><br>ERROR TEXT: " + error);
                else
                    alert("ERROR GET AJAX: " + data);
                callback_function(null);
            }
        });
    };
    load_callback(src);
}


function multi_post_img(src_arr, module, query_object, callback_function, custom_alert) {
    var work_statuses = [];
    for (var i = 0; i < src_arr.length; i++) {
        work_statuses.push(false);
    }
    var is_work = function () {
        for (var i = 0; i < work_statuses.length; i++) {
            if (work_statuses[i]) {
                return true;
            }
        }
        return false;
    };

    for (var i = 0; i < work_statuses.length; i++) {
        work_statuses[i] = true;
        (function (i) {
            post_file(src_arr[i], module, query_object, function (data) {
                work_statuses[i] = false;
                if (is_work())
                    return true;
                callback_function(data);
            }, custom_alert);
        })(i);

    }
}

function url_transliteratsiya(text) {
    return preg_replace(['(^| |ъ|ь|у|е|ы|а|о|э|я|и|ю)[е^ё]', '(е|ё)', 'ья', 'я', '[и^ы]й($| )', 'и', '(й|ы)', '(ь|ъ)', 'а', 'б', 'в', 'г', 'д', 'ж', 'з', 'к', 'л', 'м', 'н', 'о', 'п', 'р', 'с', 'т', 'у', 'ф', 'х', 'ц', 'ч', 'ш', 'щ', 'э', 'ю', '( | |\n)', '"'], ['$1ey', 'e', 'ia', 'ya', 'iy$1', 'i', 'y', '', 'a', 'b', 'v', 'g', 'd', 'zh', 'z', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'ts', 'ch', 'sh', 'shch', 'e', 'yu', '_', ""], text.toLowerCase());
}

function generate_dom_id() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (input) {
        var output = "";
        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
        var i = 0;

        input = utf8_encode(input);

        while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
                enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
                enc4 = 64;
            }

            output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

        }

        return output;
    },


    decode: function (input) {
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;

        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

        while (i < input.length) {
            enc1 = this._keyStr.indexOf(input.charAt(i++));
            enc2 = this._keyStr.indexOf(input.charAt(i++));
            enc3 = this._keyStr.indexOf(input.charAt(i++));
            enc4 = this._keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
                output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
                output = output + String.fromCharCode(chr3);
            }
        }
        output = utf8_decode(output);
        return output;

    }

};

var decodeEscapeSequence = function (str) {
    str = str.replace(/\\x([0-9A-Fa-f]{2})/g, function () {
        return String.fromCharCode(parseInt(arguments[1], 16));
    });

    var r = /\\u([\d\w]{4})/gi;
    str = str.replace(r, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
    // str = unescape(str);
    return str;
};

isEmptyObject = function (obj) {
    if (obj == null) return true;
    if (obj.length > 0)    return false;
    if (obj.length === 0)  return true;
    if (typeof obj !== "object") return true;
    for (var key in obj)
        if (obj.hasOwnProperty(key)) return false;
    return true;
};

var data_dyn_img_urls = {
    get_all: function (this_obj) {
        var data_ = this_obj.attr('data-urls');
        if (typeof data_ == "undefined")
            return {};
        data_ = data_.replace(/'/ig, '"');
        data_ = $.parseJSON(data_);
        return data_;
    },
    get: function (this_obj, selector_prefix) {
        var urls = this.get_all(this_obj);
        return urls[selector_prefix];
    },
    set_all: function (this_obj, object) {
        var data_ = $.toJSON(object);
        data_ = data_.replace(/\"/ig, "'");
        this_obj.attr('data-urls', data_);
        if (isEmptyObject(object))
            this.del_all(this_obj);
    },
    set: function (this_obj, selector_prefix, url) {
        var urls = this.get_all(this_obj);
        urls[selector_prefix] = url;
        this.set_all(this_obj, urls);
    },
    del_all: function (this_obj) {
        this_obj.removeAttr('data-urls');
    },
    del: function (this_obj, selector_prefix) {
        var urls = this.get_all(this_obj);
        delete urls[selector_prefix];
        this.set_all(this_obj, urls);
    },
    all_exist: function (this_obj) {
        var data_ = this_obj.attr('data-urls');
        return typeof data_ !== "undefined";
    }
};