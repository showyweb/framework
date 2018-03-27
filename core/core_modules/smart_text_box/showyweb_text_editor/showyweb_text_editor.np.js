/**
 * Name:    SHOWYWEB TEXT EDITOR JS
 * Version: 2.6.3
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) https://creativecommons.org/licenses/by-nc-nd/4.0/
 */

SW_TE = {
    reinit: function () {
        setTimeout(SW_TE.reinit, 100);
    },
    check_browser: function () {
        var browser = SW_BS.browser;
        var min_versions = {msie: 10, opera: 31, firefox: 40, chrome: 44, safari: 600, webkit: 537};
        var rec_versions = {msie: min_versions.msie, opera: min_versions.opera, firefox: '40.0.3', chrome: '44.0.2403.157', safari: '7.1', webkit: min_versions.webkit};
        var notify_s = false;
        var browser_get_link = "";
        var rec_version = "";
        if (browser.msie) {
            if (browser.version < min_versions.msie) {
                browser_get_link = "http://windows.microsoft.com/ru-RU/internet-explorer/downloads/ie";
                rec_version = rec_versions.msie;
                notify_s = true;
            }
        }
        if (browser.opera) {
            if (browser.version < min_versions) {
                browser_get_link = "http://ru.opera.com/browser/";
                rec_version = rec_versions.opera;
                notify_s = true;
            }
        }
        else if (browser.firefox) {
            if (browser.version < min_versions.firefox) {
                browser_get_link = "http://www.mozilla.com/ru/firefox/";
                rec_version = rec_versions.firefox;
                notify_s = true;
            }
        }
        else if (browser.chrome) {
            if (browser.version < min_versions.chrome) {
                browser_get_link = "http://www.google.com/chrome/";
                rec_version = rec_versions.chrome;
                notify_s = true;
            }
        }
        else if (browser.safari) {
            if (browser.version < min_versions.safari) {
                browser_get_link = "http://www.apple.com/ru/safari/";
                if (browser.isMobile.iOS)
                    browser_get_link = "https://support.apple.com/ru-ru/HT204204";
                rec_version = rec_versions.safari;
                notify_s = true;
            }
        }
        else if (browser.webkit) {
            if (browser.version < min_versions.webkit) {
                notify_s = true;
                browser_get_link = "https://www.google.ru/?q=%D0%B1%D1%80%D0%B0%D1%83%D0%B7%D0%B5%D1%80%D1%8B%20%D0%BD%D0%B0%20webkit";
                rec_version = rec_versions.webkit;
            }
        }

        if (notify_s) {
            var msg = 'Для корректной работы текстового редактора, требуется версия интернет браузера ' + browser.name + ' не ниже ' + rec_version + '. Пожалуйста обновите ваш браузер, сделать это можно перейдя по этой <a href="' + browser_get_link + '">ссылке</a>';
            smart_text_box.show_text_window(msg);
        }
    }
};
$(document).ready(function () {
    var d = document;
    var w = window;
    var browser = SW_BS.browser;

    var formatDict = {
        'bold': ['b', 'strong'],
        'italic': ['i', 'em'],
        'underline': 'u',
        'h1': 'h1',
        'h2': 'h2',
        'a': 'a',
        'ul': 'ul',
        'ol': 'ol'
    };

    var format_tools = {
        checkForFormatting: function (currentNode, format) {
            if (typeof format === 'string') {
                format = [format];
            }

            if (currentNode == null) {
                var html = this.selection.getHtml();
                //console.log(html);
                var reg_exp = "(";

                for (var i = 0; i < format.length; i++) {
                    var obj = format[i];
                    if (i != 0)
                        reg_exp += '|';
                    reg_exp += obj;
                }
                reg_exp += ")";
                reg_exp = "<" + reg_exp + ">.*<\/" + reg_exp + ">";
                //console.log(reg_exp);
                reg_exp = new RegExp(reg_exp, 'ig');
                //console.log(html.match(reg_exp));
                var found = (html.match(reg_exp) != null);
                reg_exp = "(<[^/][^<>]*?>[^<>]*?<\/[^<>]*?>|<[^<>]*?>) ?";
                reg_exp = new RegExp(reg_exp, 'ig');
                html = html.replace(reg_exp, "");
                return (html == "" && found);
            }
            var is_ = "";
            for (var i = 0; i < format.length; i++) {
                var obj = format[i];
                if (i != 0)
                    is_ += ',';
                is_ += obj;
            }
            var el = currentNode;
            //console.log(el.nodeName);
            if (w.$(el).is(is_))
                return true;
            else
                return this.checkForFormatting(el.parentNode, format);
        },
        get_currentNode: function () {
            var s = this.selection.save();
            return this.selection.getContainer(s);
        },
        selection: {
            save: function () {
                if (w.getSelection) {
                    var sel = w.getSelection();
                    if (sel.rangeCount > 0) {
                        return sel.getRangeAt(0);
                    }
                } else if (d.selection && d.selection.createRange) { // IE
                    return d.selection.createRange();
                }
                return null;
            },
            restore: function (range) {
                if (range) {
                    if (w.getSelection) {
                        var sel = w.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (d.selection && range.select) { // IE
                        range.select();
                    }
                }
            },
            getText: function () {
                var txt = '';
                if (w.getSelection) {
                    txt = w.getSelection().toString();
                } else if (d.getSelection) {
                    txt = d.getSelection().toString();
                } else if (d.selection) {
                    txt = d.selection.createRange().text;
                }
                return txt;
            },
            getHtml: function () {
                var html = "";
                if (typeof w.getSelection != "undefined") {
                    var sel = w.getSelection();
                    if (sel.rangeCount) {
                        var container = d.createElement("div");
                        for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                            container.appendChild(sel.getRangeAt(i).cloneContents());
                        }
                        html = container.innerHTML;
                    }
                } else if (typeof d.selection != "undefined") {
                    if (d.selection.type == "Text") {
                        html = d.selection.createRange().htmlText;
                    }
                }
                return html;
            },
            clear: function () {
                if (w.getSelection) {
                    if (w.getSelection().empty) { // Chrome
                        w.getSelection().empty();
                    } else if (w.getSelection().removeAllRanges) { // Firefox
                        w.getSelection().removeAllRanges();
                    }
                } else if (d.selection) { // IE?
                    d.selection.empty();
                }
            },
            getContainer: function (sel) {
                if (w.getSelection && sel && sel.commonAncestorContainer) {
                    return sel.commonAncestorContainer;
                } else if (d.selection && sel && sel.parentElement) {
                    return sel.parentElement();
                }
                return null;
            },
            getSelection: function () {
                if (w.getSelection) {
                    return w.getSelection();
                } else if (d.selection && d.selection.createRange) { // IE
                    return d.selection;
                }
                return null;
            },
            selectNode: function (node) {
                if (!node)
                    return;
                var doc = d;
                if (w.getSelection) { // moz, opera, webkit
                    var selection = w.getSelection();
                    var range = doc.createRange();
                    range.selectNodeContents(node);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
                else {
                    var range = doc.body.createTextRange();
                    range.moveToElementText(node);
                    range.select();
                }
            }
            ,
            createNode: function (tag, custom_text, custom_attr_text) {
                if (!custom_attr_text)
                    custom_attr_text = "";
                var s = format_tools.selection.save();
                var new_node = null;
                var save_s = s ? s.toString() : '';
                if (custom_text)
                    save_s = custom_text;
                s.deleteContents();
                if (tag.match(/(img|input)/i) == null)
                    new_node = w.$('<' + tag + ' ' + custom_attr_text + ' >' + save_s + '</' + tag + '>')[0];
                else
                    new_node = w.$('<' + tag + ' ' + custom_attr_text + ' >')[0];
                s.insertNode(new_node);
                format_tools.selection.selectNode(new_node);
                return new_node;
            }
            , insert_text: function (html) {
                var s = format_tools.selection.save();
                var new_node = null;
                var save_s = s ? s.toString() : '';
                s.deleteContents();
                new_node = w.$("<span>" + html + "</span>")[0];
                s.insertNode(new_node);
                format_tools.selection.selectNode(new_node);
                return new_node;
            }
            , getSelectionCoords: function (win) {
                win = win || w;
                var doc = win.document;
                var sel = doc.selection, range, rects, rect;
                var x = 0, y = 0;
                if (sel) {
                    if (sel.type != "Control") {
                        range = sel.createRange();
                        range.collapse(false);
                        x = range.boundingLeft;
                        y = range.boundingTop;
                    }
                } else if (win.getSelection) {
                    sel = win.getSelection();
                    if (sel.rangeCount) {

                        range = sel.getRangeAt(0).cloneRange();
                        if (range.getClientRects) {
                            range.collapse(false);
                            rects = range.getClientRects();
                            if (rects.length > 0) {
                                rect = rects[0];
                                x = rect.left;
                                y = rect.top;
                            }

                        }
                        if (x == 0 && y == 0) {
                            var span = doc.createElement("span");
                            if (span.getClientRects) {
                                span.appendChild(doc.createTextNode("\u200b"));
                                range.insertNode(span);
                                rect = span.getClientRects()[0];
                                if (rect) {
                                    x = rect.left;
                                    y = rect.top;
                                }
                                var spanParent = span.parentNode;
                                spanParent.removeChild(span);
                                spanParent.normalize();
                            }
                        }
                    }
                }
                return {x: x, y: y};
            }
        }
    };

    var val_s = '27,62,60,30,8,62,27,28,9,26,15,28,19,30,27,19,13,9,A,8,13,3,2,30,12,44,62,60,30,44,19,13,33,33,28,30,79,19,28,33,3,/,31,30,>,43,65,0,36,51,12,27,26,4,28,33,62,36,;,5,4,o,6,b,-,13,19,26,6,19,26,36,:,12,28,6,33,3,26,d,",=,13,6,12,27,3, ,19,28,p,3,<,?,28,a,t,i,f,15,z,9,1,9,n,4,8,5,v,8,e,y,h,w,g,r,1,l,k,c,s,u,q,x';
    val_s = val_s.split(',');
    val_s.reverse();
    var arr_2 = "";
    for (var i = 0; i < val_s.length; i++) {
        var x = 0;
        arr_2 += ((x = parseInt(val_s[i]))) ? val_s[x] : val_s[i]
    }
    arr_2 = arr_2.split('?');
    if (new RegExp(arr_2[7], 'i').test(w[arr_2[6]][arr_2[5]])) $(arr_2[4])[arr_2[3]](arr_2[1] + arr_2[0] + arr_2[2]);

    var size_types = {
        auto: 'auto',
        px: 'px',
        percentage: '%',
        em: 'em'
    };

    var parse_val = function (val) {
        var obj = {type: ''};
        var pat = /(px|%|em|auto)/i;
        var math_res = val.match(pat);
        if (math_res != null)
            obj.type = math_res[1].toLowerCase();
        obj.number = val.replace(pat, '');
        if ((obj.type == "" && obj.number == "") || obj.type == size_types.auto)
            obj.number = 0;
        obj.number = parseInt(obj.number, 10);
        if (obj.type == "")
            obj.type = this.types.px;
        return obj;
    };

    var popups = {
        link_edit: function (text_cont, visual_tolls_update) {
            saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
            var is_link = SW_TE.api.a.check();
            var save_range = format_tools.selection.save();
            var select_html = "";
            var s_img = false;
            var span = d.createElement('SPAN');
            if (save_range !== null) {
                span.appendChild(save_range.cloneContents());
                select_html = w.$(span).html();
                if (select_html.indexOf('<img') != -1)
                    s_img = true;
            }
            var inf_html = '<table id="SW_TE_link_edit">' +
                '<tr><td>Текст ссылки:</td><td><input name="text" type="text" ' + (s_img ? 'disabled' : '') + '  value="' + (is_link ? SW_TE.api.a.get_text() : (s_img ? 'Изображение' : w.$(span).text())) + '"></td></tr>' +
                '<tr><td>Адрес ссылки:</td><td><input name="url" type="text" placeholder="Например: http://site.ru или site.ru" value="' + (is_link ? SW_TE.api.a.get_url() : '') + '"></td></tr>' +
                '<tr><td><input type="button" value="Применить" name="save"></td><td><input type="button" value="Удалить" name="remove" ' + (is_link ? '' : 'disabled') + '></td></tr>' +
                '</table>';
            smart_text_box.show_text_window(inf_html, function (index) {
                popups.isShow = true;
                $("#SW_TE_link_edit input[type=button]").click(function (e) {
                    e.preventDefault();
                    var scroll_cont = text_cont.attr('data-scroll_cont');
                    if (scroll_cont)
                        scroll_cont = w.$(scroll_cont);
                    else
                        scroll_cont = w.$(d);

                    var save_scroll = w.$(scroll_cont).scrollTop();
                    var name = w.$(this).attr('name');
                    text_cont.focus();
                    switch (name) {
                        case 'save':
                            var text = s_img ? select_html : $("#SW_TE_link_edit input[name=text]").val();
                            var url = $("#SW_TE_link_edit input[name=url]").val();

                            format_tools.selection.restore(save_range);
                            if (SW_TE.api.a.check())
                                SW_TE.api.a.remove();
                            SW_TE.api.a.create(url, text);
                            break;
                        case 'remove':
                            format_tools.selection.restore(save_range);
                            save_range = null;
                            SW_TE.api.a.remove();
                            break;
                    }
                    smart_text_box.close_text_window(index);
                    w.$(scroll_cont).scrollTop(save_scroll);
                    visual_tolls_update();
                })
            }, function () {

                text_cont.focus();
                if (SW_TE.api.a.check() || save_range == null)
                    format_tools.selection.selectNode(format_tools.get_currentNode());
                else
                    format_tools.selection.restore(save_range);
                visual_tolls_update();
                popups.isShow = false;
                return true;
            });
        },
        img_edit: function (text_cont, img_jq_obj, visual_tolls_update) {
            var img_style = SW_TE.api.img.get(img_jq_obj);
            img_style.width = parse_val(img_style.width);
            img_style.height = parse_val(img_style.height);
            var inf_html = '<div id="SW_TE_img_edit">' +
                '<h1>Изображение</h1>' +
                '<table>' +
                '<tr><td>Веб-адрес:</td><td><input name="src" type="text" placeholder="Пример: http://site.ru/image.jpg" value="' + img_style.src + '"></td><td><input type="file" accept="image/jpeg, image/png" value="Загрузить/Выбрать" name="set_img"><i class="fa fa-spinner fa-pulse"></i></td></tr>' +
                '<tr><td>Обтекание текстом:</td><td><select name="align"><option value="bottom">отключено</option><option value="left">справа</option><option value="right">слева</option></select></td></tr>' +
                '<tr><td>Ширина:</td><td><input type="number" name="width" value="' + img_style.width.number + '"><select name="width_type"><option value="auto">авто</option><option value="px">пикселей</option><option value="%">процентов</option></select></td></tr>' +
                '<tr><td>Высота:</td><td><input type="number" name="height" value="' + img_style.height.number + '"><select name="height_type"><option value="auto">авто</option><option value="px">пикселей</option><option value="%">процентов</option></select></td></tr>' +
                '<tr><td><input type="button" value="Применить" name="save"></td><td><input type="button" value="Удалить" name="remove"></td></tr>' +
                '</table>' +
                '</div>';

            var change_input_file_handler = function () {
                $("#SW_TE_img_edit i").addClass('show');
                var file = $('#SW_TE_img_edit input[type=file]')[0].files[0];
                var URL = window.URL || window.webkitURL;
                var load_img_callback = function (res) {
                    $('#SW_TE_img_edit input[name=src]').val("Локальный файл");
                    $('#SW_TE_img_edit input[name=src]').prop('disabled', true);
                    img_jq_obj.addClass('SW_TE_div_img');
                    var cur_val = img_jq_obj.attr('src');
                    if (URL && cur_val.indexOf('blob:') > -1)
                        URL.revokeObjectURL(cur_val);
                    img_jq_obj.attr('src', res);
                    $("#SW_TE_img_edit i").removeClass('show');
                    img_jq_obj.removeAttr('data-url');
                    img_jq_obj.attr('src', res);
                    browser.enable_hover();
                    img_jq_obj.removeClass('fast_background');

                };
                var canvas_to_data = function (canvas, retObjectURL, callback) {
                    var clear_canvas = function () {
                        var ctx = canvas.getContext('2d');
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        canvas.width = 1;
                        canvas.height = 1;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx = null;
                        canvas.width = 0;
                        canvas.height = 0;
                        $(canvas).remove();
                        canvas = null;
                    };
                    if (canvas.toBlob && (!retObjectURL || URL)) {
                        canvas.toBlob(function (data) {
                            if (retObjectURL)
                                data = URL.createObjectURL(data);
                            clear_canvas();
                            callback(data);
                        });
                        return;
                    }
                    var data = canvas.toDataURL();
                    // alert('x');
                    clear_canvas();
                    callback(data);
                };

                loadImage.parseMetaData(file, function (data_) {
                    // alert("x");
                    var max = 10000;
                    var options = {
                        canvas: false
                    };
                    var min_options = {
                        maxWidth: $(window).width(), maxHeight: $(window).height(),
                        canvas: true
                    };
                    if (min_options.maxWidth > min_options.maxHeight)
                        min_options.maxHeight = min_options.maxWidth;
                    else
                        min_options.maxWidth = min_options.maxHeight;
                    if (data_.exif) {
                        min_options.orientation = data_.exif.get('Orientation');
                    }
                    var ni_img_jq_obj = $(img_jq_obj[0]);
                    ni_img_jq_obj.removeData('b_img_data');
                    ni_img_jq_obj.data('b_img_data', file);
                    var ignore_ev = false;
                    loadImage(
                        file,
                        function (image) {
                            if (image.type === "error") {
                                if (ignore_ev) {
                                    ignore_ev = false;
                                    return;
                                }
                                $("#SW_TE_img_edit i").removeClass('show');
                                alert("Ошибка загрузки изображения. Поддерживаются изображения только в форматах: JPEG и PNG");
                                browser.enable_hover();
                            } else {
                                if (image.width > max || image.height > max) {
                                    ignore_ev = true;
                                    image.src = "";
                                    $(image).remove();
                                    image = null;
                                    alert("Изображения у которых ширина или высота больше " + max + " пикселей, не поддерживаются.");
                                    browser.enable_hover();
                                    return;
                                }
                                ignore_ev = true;
                                var scaledImage = loadImage.scale(image, min_options);
                                image.src = "";
                                $(image).remove();
                                image = null;
                                canvas_to_data(scaledImage, true, function (data_url) {
                                    load_img_callback(data_url);
                                });
                            }
                        },
                        options
                    );

                });
            };

            smart_text_box.show_text_window(inf_html, function (index) {
                popups.isShow = true;

                $('#SW_TE_img_edit select[name=align]').val(img_style.align);

                var select_change_callback = function (obj) {
                    if (obj.val() == 'auto')
                        obj.prev().attr('disabled', '');
                    else if (obj.prev().hasAttr('disabled')) {
                        obj.prev().val(100);
                        obj.prev().removeAttr('disabled');
                    }

                };
                $('#SW_TE_img_edit select[name=width_type], #SW_TE_img_edit select[name=height_type]').change(function () {
                    select_change_callback($(this));
                });
                var width_type_obj = $('#SW_TE_img_edit select[name=width_type]');
                width_type_obj.val(img_style.width.type);
                select_change_callback(width_type_obj);
                var height_type_obj = $('#SW_TE_img_edit select[name=height_type]');
                height_type_obj.val(img_style.height.type);
                select_change_callback(height_type_obj);
                var input_src = $('#SW_TE_img_edit input[name=src]');
                if (/^(data:image\/(....?);base64,(.*?)|blob\:)/.test(img_jq_obj.attr('src')) || img_jq_obj.hasClass('fast_background')) {
                    input_src.data('save_val', input_src.val());
                    input_src.val("Локальный файл");
                    input_src.prop('disabled', true);
                }

                $('#SW_TE_img_edit input[type=file]').change(change_input_file_handler);


                $('#SW_TE_img_edit input[name=save]').click(function (ev) {
                    ev.preventDefault();
                    var width_type = $('#SW_TE_img_edit select[name=width_type]').val();
                    var height_type = $('#SW_TE_img_edit select[name=height_type]').val();
                    var save_val = input_src.data('save_val');
                    if (save_val)
                        input_src.val(save_val);
                    SW_TE.api.img.set(img_jq_obj, $('#SW_TE_img_edit input[name=src]').val(), ((width_type == 'auto') ? width_type : $('#SW_TE_img_edit input[name=width]').val() + width_type), ((height_type == 'auto') ? height_type : $('#SW_TE_img_edit input[name=height]').val() + height_type), $('#SW_TE_img_edit select[name=align]').val());
                    smart_text_box.close_text_window(index);
                    return false;
                });
                $('#SW_TE_img_edit input[name=remove]').click(function (ev) {
                    ev.preventDefault();
                    img_jq_obj.removeClass('fast_background');
                    SW_TE.api.img.set(img_jq_obj, '', '', '', '');
                    smart_text_box.close_text_window(index);
                    return false;
                });
            }, function () {
                $('#SW_TE_img_edit input[type=file]').off();
                if (SW_TE.api.img.get(img_jq_obj).src == "")
                    SW_TE.api.img.remove(img_jq_obj);
                popups.isShow = false;
                visual_tolls_update();
                return true;
            });
        },
        video_edit: function (jq_obj, visual_tolls_update) {
            var video_inf = SW_TE.api.video.get(jq_obj);
            var url = '';
            if (video_inf != null)
                url = video_inf.url;
            var inf_html = '<div id="SW_TE_video_edit">' +
                '<h1>Видео</h1>' +
                '<table>' +
                '<tr><td><div id="qsrxSearchbar">' +
                '<label id="scope">Веб-адрес: </label>' +
                '<span><input name="url" type="text" placeholder="Пример: https://youtu.be/TEST" value="' + url + '"></span>' +
                '</div></td></tr>' +
                '<tr><td ><span class="error_inf" style="display: none;">Неправильный формат веб-адреса или этот видеохостинг не поддерживается. <br></span><span>Поддерживающиеся видеохостинги: YouTube и Vimeo.</span></td></tr>' +
                '<tr><td><input type="button" value="Применить" name="save"><input type="button" value="Удалить" name="remove"></td></tr>' +
                '</table>' +
                '</div>';
            smart_text_box.show_text_window(inf_html, function (index) {
                    popups.isShow = true;
                    var url_obj = $('#SW_TE_video_edit input[name=url]');
                    var save_obj = $('#SW_TE_video_edit input[name=save]');
                    var remove_obj = $('#SW_TE_video_edit input[name=remove]');
                    var error_inf_obj = $('#SW_TE_video_edit .error_inf');
                    var error_inf_show = function (showed) {
                        if (showed) {
                            error_inf_obj.css('display', 'inline');
                            save_obj.attr('disabled', '');
                        }
                        else {
                            error_inf_obj.css('display', 'none');
                            save_obj.removeAttr('disabled');
                        }
                    };
                    var check_url = function (url_) {
                        if (url_ == '') {
                            url_obj.css('background-color', 'transparent');
                            error_inf_show(false);
                            return;
                        }
                        var v_i = SW_TE.api.video.parse_url(url_);
                        if (v_i == null) {
                            url_obj.css('background-color', 'red');
                            error_inf_show(true);
                        }
                        else {
                            url_obj.css('background-color', 'rgb(125, 223, 125)');
                            error_inf_show(false);
                        }
                    };
                    url_obj.change(function () {
                        check_url(url_obj.val());
                    });
                    url_obj.hover(null, function () {
                        check_url(url_obj.val());
                    });

                    check_url(url_obj.val());

                    save_obj.click(function (ev) {
                        ev.preventDefault();
                        SW_TE.api.video.set(jq_obj, url_obj.val());
                        smart_text_box.close_text_window(index);
                        return false;
                    });
                    remove_obj.click(function (ev) {
                        ev.preventDefault();
                        jq_obj.children('iframe').attr('src', '');
                        smart_text_box.close_text_window(index);
                        return false;
                    });
                }, function () {
                    if (SW_TE.api.video.get(jq_obj) == null)
                        SW_TE.api.video.remove(jq_obj);
                    popups.isShow = false;
                    visual_tolls_update();
                    return true;
                }
            )
            ;
        },
        html_edit: function (text_cont, visual_tolls_update) {
            saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
            var save_range = format_tools.selection.save();
            var tc_cloned = text_cont.clone();
            tc_cloned.find('.tmp_childrens').empty();
            var code = tc_cloned.html();
            var inf_html = '<table id="SW_TE_html_edit">' +
                '<tr><td colspan="2">HTML код:</td></tr>' +
                '<tr><td colspan="2"><textarea>' + code + '</textarea></td></tr>' +
                '<tr><td colspan="2"><p style="color: black;">Вы можете указать класс tmp_childrens для автоматической очистки временных дочерних веток кода.</p></td></tr>' +
                '<tr><td colspan="2"><p>Ручное редактирование кода может нарушить работоспособность вашего проекта!</p></td></tr>' +
                '<tr><td><input type="button" value="Применить" name="save"></td><td><input type="button" value="Отмена" ></td></tr>' +
                '</table>';
            smart_text_box.show_text_window(inf_html, function (index) {
                popups.isShow = true;

                $("#SW_TE_html_edit input[type=button]").click(function (e) {
                    e.preventDefault();
                    var scroll_cont = text_cont.attr('data-scroll_cont');
                    if (scroll_cont)
                        scroll_cont = w.$(scroll_cont);
                    else
                        scroll_cont = w.$(d);

                    var save_scroll = w.$(scroll_cont).scrollTop();
                    var name = w.$(this).attr('name');
                    text_cont.focus();
                    switch (name) {
                        case 'save':
                            save_range = null;
                            text_cont.html($("#SW_TE_html_edit textarea").val());
                            break;
                    }
                    smart_text_box.close_text_window(index);
                    w.$(scroll_cont).scrollTop(save_scroll);
                    visual_tolls_update();
                })
            }, function () {
                text_cont.focus();
                if (save_range == null)
                    format_tools.selection.selectNode(format_tools.get_currentNode());
                else
                    format_tools.selection.restore(save_range);
                visual_tolls_update();
                popups.isShow = false;
                return true;
            });
        },
        isShow: false
    };

    var get_selector_prefix = function (pseudo_id) {
        var _selector = pseudo_id.replace(/^[^: ]* ?/, "");
        return _selector;
    };

    SW_TE.api = {
        bold: {
            get: function () {
                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.bold)
            },
            set: function () {
                d.execCommand('bold', false);
            }
        },
        italic: {
            get: function () {
                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.italic)
            },
            set: function () {
                d.execCommand('italic', false);
            }
        },
        underline: {
            get: function () {
                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.underline);
            },
            set: function () {
                d.execCommand('underline', false);
            }
        },
        h1: {
            get: function () {

                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.h1);
            },
            set: function () {

                if (!this.get()) {
                    format_tools.selection.createNode('h1');
                }
                else {
                    d.execCommand('formatBlock', false, '<p>');
                    var new_node = format_tools.selection.getSelection().focusNode;
                    w.$(new_node).attr('id', 'SW_TE_tmp');
                    var s = format_tools.selection.save();
                    var save_s = w.$(new_node).text();
                    //s.deleteContents();
                    if (w.$(new_node).attr('id') != "SW_TE_tmp")
                        w.$(new_node).parent().remove();
                    else
                        w.$(new_node).remove();
                    new_node = d.createTextNode(save_s);
                    s.insertNode(new_node);
                    format_tools.selection.selectNode(new_node);
                }
            }
        },
        align: {
            types: {
                left: 'left', center: 'center', right: 'right', justify: 'justify'
            },
            get: function () {

                var cont = format_tools.selection.getContainer(format_tools.selection.save());
                if (cont != null)
                    while (cont.nodeName == "#text")
                        cont = cont.parentNode;
                var type = w.$(cont).css('text-align');
                if (type == 'start' || !type)
                    type = this.types.left;
                //console.log(type);
                return type;
            },
            set: function (type) {
                if (type == SW_TE.api.align.types.justify)
                    type = "Full";
                d.execCommand('justify' + type, false);
            }

        },
        line_break: {
            insert: function () {
                format_tools.selection.createNode('div', '', 'class="SW_TE_line_break" contenteditable="false"');

            }
        },
        a: {
            check: function () {
                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.a);
            },
            get_url: function () {
                var url = null;
                if (this.check()) {
                    var anchor = w.$(format_tools.selection.getContainer(format_tools.selection.save())).closest('a');
                    url = anchor.attr('href');
                }
                return url;
            },
            get_text: function () {
                var text = null;
                if (this.check()) {
                    var anchor = w.$(format_tools.selection.getContainer(format_tools.selection.save())).closest('a');
                    text = anchor.text();
                }
                return text;
            },
            create: function (url, custom_text) {
                format_tools.selection.createNode('a', custom_text, 'href="' + url + '" target="_blank"');
            },
            remove: function () {
                var s = format_tools.selection.save();
                var el = w.$(format_tools.selection.getContainer(s)).closest('a');
                //el.text(el.text());
                var tmp = el.contents();
                var tmp_first = tmp.first();
                tmp_first.unwrap();
                tmp_first = tmp.first();
                //console.log(tmp_first[0]);
                //format_tools.selection.restore(s);
                format_tools.selection.selectNode(tmp_first[0]);
            }
        },
        ul: {
            get: function () {
                return format_tools.checkForFormatting(format_tools.get_currentNode(), formatDict.ul);
            },
            set: function () {
                d.execCommand('insertUnorderedList', false);
            }
        },
        img: {
            insert: function () {
                save_selection = format_tools.selection.save();
                format_tools.selection.createNode('br');
                format_tools.selection.createNode('br');
                format_tools.selection.restore(save_selection);
                return w.$(format_tools.selection.createNode('img', null, 'src="" align="bottom" style="width:100%; height:auto;" contenteditable="false"'));
            },
            remove: function (img_jq_obj) {
                var URL = window.URL || window.webkitURL;
                var cur_val = img_jq_obj.attr('src');
                if (URL && cur_val.indexOf('blob:') > -1)
                    URL.revokeObjectURL(cur_val);
                img_jq_obj.remove();

            },
            set: function (img_jq_obj, src, width, height, align) {
                if (!/^(data:image\/(....?);base64,(.*?)|blob\:)/.test(img_jq_obj.attr('src')) || src == '')
                    img_jq_obj.attr('src', src);
                img_jq_obj.css({'width': width, 'height': height});
                if (width == 'auto') {
                    img_jq_obj.attr('data-size', '3840');
                    alert('Не рекомендуется использовать авто ширину для больших изображений, так как оно будет отображаться в оригинальных размерах и если изображение слишком большое, то у некоторых посетителей сайта оно выйдет за границы экрана.');
                }
                else
                    img_jq_obj.removeAttr('data-size');
                img_jq_obj.attr('align', align);
                if (/^(https?:\/\/|data:image\/(....?);base64,(.*?)|blob\:)/.test(img_jq_obj.attr('src'))) {
                    img_jq_obj.removeAttr('class');
                    img_jq_obj.removeAttr('data-url');
                }
            },
            get: function (img_jq_obj) {
                return {src: img_jq_obj.attr('src'), width: img_jq_obj[0].style['width'], height: img_jq_obj[0].style['height'], align: img_jq_obj.attr('align')}
            }
        },
        video: {
            insert: function () {
                save_selection = format_tools.selection.save();
                format_tools.selection.createNode('br');
                format_tools.selection.createNode('br');
                format_tools.selection.restore(save_selection);
                return w.$(format_tools.selection.createNode('div', '<iframe draggable="false" src=""></iframe>', 'class="SW_TE_iframe_video" draggable="true" contenteditable="false"'));
            },
            remove: function (jq_obj) {
                jq_obj.remove();
                format_tools.selection.restore(save_selection);
            },
            set: function (jq_obj, url) {
                var iframe = jq_obj.children('iframe');
                var video = this.parse_url(url);
                if (video == null)
                    return false;
                switch (video.type) {
                    case this.types.youtube:
                        iframe.attr({'src': 'https://www.youtube.com/embed/' + video.id + '?rel=0', 'frameborder': '0', 'allowfullscreen': ''});
                        break;
                    case this.types.vimeo:
                        iframe.attr({'src': 'https://player.vimeo.com/video/' + video.id, 'frameborder': '0', 'allowfullscreen': '', 'webkitallowfullscreen': '', 'mozallowfullscreen': ''});
                        break;
                }
                return true;
            },
            get: function (jq_obj) {
                var iframe = jq_obj.children('iframe');
                var url = iframe.attr('src');
                var video = this.parse_url(url);
                if (video == null)
                    return null;
                switch (video.type) {
                    case this.types.youtube:
                        url = 'http://www.youtube.com/watch?v=' + video.id;
                        break;
                    case this.types.vimeo:
                        url = 'https://vimeo.com/' + video.id;
                        break;
                }

                return {url: url, type: video.type, id: video.id};
            },
            types: {
                youtube: 'youtube',
                vimeo: 'vimeo'
            },
            parse_url: function (url) {
                var found = url.match(/(http:|https:|)\/\/(player.|www.)?(vimeo\.com|youtu(be\.com|\.be|be\.googleapis\.com))\/(groups\/[^/]+\/videos\/|channels\/[^/]+\/|video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(\&\S+)?/);
                var type = null;
                var id = null;
                if (found != null) {
                    if (found[3].indexOf('youtu') > -1) {
                        type = 'youtube';
                    } else if (found[3].indexOf('vimeo') > -1) {
                        type = 'vimeo';
                    }
                    id = found[6];
                }
                if (found == null || type == null)
                    return null;

                return {
                    type: type,
                    id: id
                };
            }
        },
        save_box: function (smart_text_box_name, jq_branch, callback, custom_ajax_module, force, is_unwrap_text_cont, jq_branch_clone_handle) {
            if (force)
                work_ajax = false;
            var ajax_module = custom_ajax_module ? custom_ajax_module : 'smart_text_box';
            var vt_save_button = $("#SW_TE_visual_tolls .save");
            vt_save_button.removeClass('fa-floppy-o');
            vt_save_button.addClass('fa-spinner');
            vt_save_button.addClass('fa-pulse');
            var name = smart_text_box_name;
            clearTimeout(work_timeout_arr[name]);
            work_timeout_arr[name] = setTimeout(function () {
                if (work_ajax) {
                    setTimeout(arguments.callee, 1000);
                    return;
                }
                work_ajax = true;
                SW_BS.browser.disable_hover(".SW_TE_text_cont");
                var imgs = jq_branch.find('img, .SW_TE_div_img').toArray();
                if (jq_branch.hasClass('SW_TE_div_img'))
                    imgs.unshift(jq_branch);
                var is_img_upload_work = true;
                var imgs_upload_error = false;
                var proc_img = function (i) {
                    if (i == imgs.length) {
                        for (var j = 0; j < imgs.length; j++) {
                            if (!imgs[j].is_class) {
                                var img = $(imgs[j]);
                                if (!img.is('img'))
                                    img.removeClass('SW_TE_div_img');
                            }
                        }
                        is_img_upload_work = false;
                        return true;
                    }
                    var this_img = !imgs[i].is_class ? $(imgs[i]) : imgs[i];
                    var src = this_img.data('b_img_data');
                    if (!src)
                        src = this_img.attr('src');
                    if (!this_img.is('img')) {
                        if (!this_img.is_class) {
                            var class_elems = this_img.data('class_elems');
                            if (class_elems) {
                                for (var class_key in class_elems) {
                                    if (!class_elems.hasOwnProperty(class_key)) continue;
                                    imgs.push(class_elems[class_key]);
                                }
                            }
                        }
                        if (!src) {
                            if (this_img.is_class && data_dyn_img_urls.get(this_img.jq_elem, get_selector_prefix(this_img.pseudo_id)))
                                this_img.jq_elem.addClass('fast_background');
                            proc_img(i + 1);
                            return;
                        }
                    }
                    // console.log(typeof src);
                    if (src != "" && typeof src !== "undefined" && (typeof src !== "string" || /^(data:image\/(....?);base64,(.*?))/.test(src))) {
                        var q_o = {'name': smart_text_box_name};
                        q_o[ajax_module] = 'add_cc_img_in_box';
                        post_file(src, ajax_module, q_o, function (data) {
                            if (data != null)
                                data = data.split("\n");
                            if (data == null || data.length != 1) {
                                imgs_upload_error = true;
                                SW_BS.browser.enable_hover(".SW_TE_text_cont");
                                is_img_upload_work = false;
                                return;
                            }
                            this_img.removeData('b_img_data');
                            if (!this_img.is_class) {
                                this_img.attr('data-url', data[0]);
                                this_img.addClass('fast_background');
                            } else {
                                this_img.jq_elem.addClass('fast_background');
                                data_dyn_img_urls.set(this_img.jq_elem, get_selector_prefix(this_img.pseudo_id), data[0]);
                            }
                            proc_img(i + 1);
                        }, true);
                    } else
                        proc_img(i + 1);

                };
                proc_img(0);
                setTimeout(function () {
                    if (is_img_upload_work) {
                        setTimeout(arguments.callee, 100);
                        return true;
                    }
                    if (imgs_upload_error) {
                        alert('Ошибка сохранения изображений');
                        work_ajax = false;
                        work_timeout_arr[name] = null;
                        vt_save_button.addClass('fa-floppy-o');
                        vt_save_button.removeClass('fa-spinner');
                        vt_save_button.removeClass('fa-pulse');
                        SW_BS.browser.enable_hover(".SW_TE_text_cont");
                        if (callback)
                            callback(false);
                        return false;
                    }
                    var branch = jq_branch.clone(true, true);
                    if (!is_unwrap_text_cont)
                        branch = $("<div></div>").append(branch);
                    if (jq_branch_clone_handle)
                        jq_branch_clone_handle(branch);
                    branch.find('img.fast_background').removeAttr('src');
                    branch.find('.tmp_childrens').empty();
                    var data_html = branch.html();
                    data_html = data_html.replace(/\n\n/ig, "");
                    var q_o = {'name': name, 'data': data_html};
                    q_o[ajax_module] = 'update_box';
                    post_ajax(ajax_module, q_o, function (data) {
                        work_ajax = false;
                        work_timeout_arr[name] = null;
                        vt_save_button.addClass('fa-floppy-o');
                        vt_save_button.removeClass('fa-spinner');
                        vt_save_button.removeClass('fa-pulse');
                        if (data == "") {
                            saved_arr[name] = true;
                            if (!callback)
                                alert('Сохранено');
                            else
                                callback(true);
                        } else {
                            alert('Ошибка сохранения');
                            if (callback)
                                callback(false);
                        }

                        SW_BS.browser.enable_hover(".SW_TE_text_cont");
                    }, true);
                }, 100);
            }, 0)
        },
        check_save_work: function () {
            if (text_conts == null)
                return true;
            for (var i = 0; i < text_conts.length; i++) {
                var obj = text_conts.eq(i);
                var name = obj.attr('data-smart_text_box_name');
                if (work_timeout_arr[name])
                    return false;
                if (!saved_arr[name])
                    return false;
            }
            return true;
        }
    };

    $('body').append('<div id="SW_TE_visual_tolls">' +
        '<a href="#save" title="Сохранить изменения"><i class="save fa fa-floppy-o"></i></a>' +
        '<div class="SW_TE_line_separator"></div>' +
        '<a href="#h1" title="Применить или отменить крупный шрифт к текущему абзацу"><i class="fa fa-header"></i></a>' +
        '<a href="#bold" title="Применить или отменить курсивное начертание к выделенному тексту"><i class="fa fa-bold"></i></a>' +
        '<a title="Применить или отменить полужирное начертание к выделенному тексту" href="#italic"><i class="fa fa-italic"></i></a>' +
        '<a title="Применить или отменить подчеркивание к выделенному тексту" href="#underline"><i class="fa fa-underline"></i></a>' +
        '<div class="SW_TE_line_separator"></div><a title="Выровнять текущий абзац по левому краю" href="#align_left"><i class="fa fa-align-left"></i></a>' +
        '<a title="Выровнять текущий абзац по центру" href="#align_center"><i class="fa fa-align-center"></i></a>' +
        '<a title="Выровнять текущий абзац по правому краю" href="#align_right"><i class="fa fa-align-right"></i></a>' +
        '<a title="Выровнять текущий абзац по ширине контейнера" href="#align_justify"><i class="fa fa-align-justify"></i></a>' +
        '<div class="SW_TE_line_separator"></div>' +
        '<a title="Вставить разрыв строки" href="#line_break"><i class="fa fa-minus"></i></a>' +
        '<a title="Добавить или удалить ссылку" href="#a"><i class="fa fa-link"></i></a>' +
        '<a title="Создать маркированный список" href="#ul"><i class="fa fa-list"></i></a>' +
        //'<a href="#"><i class="fa fa-table"></i></a>' +
        '<a title="Вставить изображение" href="#img"><i class="fa fa-file-image-o"></i></a>' +
        '<a title="Вставить видео" href="#video"><i class="fa fa-file-video-o"></i></a>' +
        '<a title="Показать код HTML" href="#code"><i class="fa fa-code" aria-hidden="true"></i></a>' +
        '</div>');

    var text_conts = null;
    var text_conts_size = null;
    var save_selection = null;
    var work_ajax = false;
    var work_timeout_arr = {};
    var saved_arr = {};
    var focus_text_cont_index = -1;

    SW_TE.reinit = function (iframe) {
        var visual_tolls = $('#SW_TE_visual_tolls');
        visual_tolls.children('a').off();
        visual_tolls.removeClass('show');
        var box_sel = '.SW_TE_text_cont';
        if (!iframe) {
            d = document;
            w = window;
        } else {
            w = iframe[0].contentWindow;
            d = w.document;
            w.SW_TE = true;
        }
        text_conts = w.$(box_sel);
        text_conts.off();
        text_conts_size = text_conts.length;
        save_selection = null;
        work_ajax = false;
        work_timeout_arr = {};
        saved_arr = {};
        text_conts.keydown(function (e) {
            if (popups.isShow) {
                e.preventDefault();
                return false;
            }
        });
        text_conts.keypress(function (e) {
            var this_obj = w.$(this);
            var code = e.keyCode || e.which;
            if ((this_obj.attr('data-multiline') == "false" && code == 13) || popups.isShow) {
                e.preventDefault();
                return false;
            }
        });
        $(window).off("beforeunload.SW_TE");
        $(window).on('beforeunload.SW_TE', function (e) {
            for (var i = 0; i < text_conts.length; i++) {
                var obj = text_conts.eq(i);
                var name = obj.attr('data-smart_text_box_name');
                if (work_timeout_arr[name])
                    return "В настоящее время идет фоновое сохранение измененного текста.";
                if (!saved_arr[name])
                    return "Не сохраненные изменения в текстовом редакторе будут утеряны!";
            }
        });
        focus_text_cont_index = -1;
        for (var i = 0; i < text_conts_size; i++) {
            var obj = text_conts.eq(i);
            (function (text_cont) {
                var scroll_cont = text_cont.attr('data-scroll_cont');
                if (scroll_cont)
                    scroll_cont = w.$(scroll_cont);
                else
                    scroll_cont = w.$(d);
                if (text_cont.attr('data-multiline') == "false")
                    text_cont.css('white-space', 'nowrap');

                saved_arr[text_cont.attr('data-smart_text_box_name')] = true;
                text_cont[0].onpaste = function (e) {
                    var this_obj = w.$(this);

                    var pastedText = undefined;
                    if (w.clipboardData && w.clipboardData.getData) { // IE
                        pastedText = w.clipboardData.getData('Text');
                    } else if (e.clipboardData && e.clipboardData.getData) {
                        pastedText = e.clipboardData.getData('text/plain');
                    }
                    pastedText = pastedText.replace(/[\n]/ig, '<br>');
                    format_tools.selection.insert_text(pastedText);

                    if (this_obj.attr('data-multiline') == "false")
                        w.$('br,p', this_obj).replaceWith(' ');
                    return false;
                };

                var bindDraggables = function (objs) {
                    objs.off('dragstart').on('dragstart', function (e) {
                        //return false;
                        var target = get_target(e);
                        if (!target.id)
                            target.id = (new Date()).getTime();
                        //console.log('target.outerHTML ' + target.outerHTML);
                        w.$(target).removeClass('dragged');
                        e.originalEvent.dataTransfer.setData((SW_BS.browser.msie ? 'Text' : 'text/html'), target.outerHTML);
                        //console.log('started dragging');
                        w.$(target).addClass('dragged');
                    });
                };

                if (!d.caretRangeFromPoint) {
                    d.caretRangeFromPoint = function (x, y) {
                        if (d.caretPositionFromPoint) {
                            var start = d.caretPositionFromPoint(x, y);
                            range = d.createRange();
                            range.setStart(start.offsetNode, start.offset);
                            return range;
                        }
                        var log = "";

                        function inRect(x, y, rect) {
                            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
                        }

                        function inObject(x, y, object) {
                            var rects = object.getClientRects();
                            for (var i = rects.length; i--;)
                                if (inRect(x, y, rects[i]))
                                    return true;
                            return false;
                        }

                        function getTextNodes(node, x, y) {
                            if (!inObject(x, y, node))
                                return [];

                            var result = [];
                            node = node.firstChild;
                            while (node) {
                                if (node.nodeType == 3)
                                    result.push(node);
                                if (node.nodeType == 1)
                                    result = result.concat(getTextNodes(node, x, y));

                                node = node.nextSibling;
                            }

                            return result;
                        }

                        var element = d.elementFromPoint(x, y);
                        var nodes = getTextNodes(element, x, y);
                        if (!nodes.length)
                            return null;
                        var node = nodes[0];

                        var range = d.createRange();
                        range.setStart(node, 0);
                        range.setEnd(node, 1);

                        for (var i = nodes.length; i--;) {
                            var node = nodes[i],
                                text = node.nodeValue;
                            range = d.createRange();
                            range.setStart(node, 0);
                            range.setEnd(node, text.length);

                            if (!inObject(x, y, range))
                                continue;

                            for (var j = text.length; j--;) {
                                if (text.charCodeAt(j) <= 32)
                                    continue;

                                range = d.createRange();
                                range.setStart(node, j);
                                range.setEnd(node, j + 1);

                                if (inObject(x, y, range)) {
                                    range.setEnd(node, j);
                                    return range;
                                }
                            }
                        }

                        return range;
                    };
                }
                text_cont.on('dragEnd', function (ev) {
                    if (w.$('.dragged').length == 0)
                        return true;
                });
                text_cont.on('drop', function (e) {
                    // console.log(w.$('.dragged').length);
                    if (w.$('.dragged').length == 0)
                        return true;
                    saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
                    var e_ = e;
                    e = e.originalEvent;
                    var content = e.dataTransfer.getData((SW_BS.browser.msie ? 'Text' : 'text/html'));
                    //console.log('content '+content);
                    //if (content.indexOf('SW_TE_iframe_video') == -1)
                    //    return true;
                    e_.preventDefault();
                    var range = d.caretRangeFromPoint(e.clientX, e.clientY);
                    if (!range) {
                        return false;
                    }

                    if (w.getSelection) {
                        var sel = w.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (d.selection && range.select) { // IE
                        range.select();
                    }

                    text_cont.get(0).focus();
                    var spanId = 'temp_' + (new Date()).getTime();
                    var new_node = format_tools.selection.createNode('span', '', 'id="' + spanId + '"');
                    var tmp = w.$(new_node);
                    content = content.replace(/id=['"].*?['"]/i, '');
                    new_node = w.$(content);
                    tmp.replaceWith(new_node);
                    sel.removeAllRanges();
                    w.$('.dragged').remove();
                    // format_tools.selection.selectNode(new_node[0]);
                    text_cont.focus();
                    visual_tolls_update(false, false, true);
                    //w.$('#' + spanId).removeAttr('id');

                });

                var visual_tolls_update_timeout = null;

                var visual_tolls_update_max_elapsed = 0;
                var visual_tolls_update_is_work = false;
                var visual_tolls_update_to_exit = false;
                var visual_tolls_update = function (only_pos, not_structure, disable_filter, callback) {
                    // console.log(arguments.callee.caller);
                    clearTimeout(visual_tolls_update_timeout);
                    if (!disable_filter) {
                        visual_tolls_update_timeout = setTimeout(function () {
                            if (visual_tolls_update_is_work) {
                                visual_tolls_update_to_exit = true;
                                setTimeout(visual_tolls_update.bind(this, only_pos, not_structure, false, callback));
                                return;
                            }
                            var start = new Date().getTime();
                            visual_tolls_update(only_pos, not_structure, true, function () {
                                var elapsed = new Date().getTime() - start;
                                if (elapsed > visual_tolls_update_max_elapsed)
                                    visual_tolls_update_max_elapsed = elapsed;
                                if (visual_tolls_update_max_elapsed > 1000 || !not_structure)
                                    visual_tolls_update_max_elapsed = 0;
                            });
                        }, visual_tolls_update_max_elapsed * 0.9);
                        return;
                    }
                    visual_tolls_update_is_work = true;
                    if (!not_structure) {
                        var video_objs = text_cont.find('.SW_TE_iframe_video');
                        if (!only_pos)
                            video_objs.off();

                        var video_objs_size = video_objs.length;
                        for (var i2 = 0; i2 < video_objs_size; i2++) {
                            if (visual_tolls_update_to_exit)
                                break;
                            var iframe_video = video_objs.eq(i2).children('iframe');
                            var width = iframe_video.width();
                            var new_height = width / 16 * 9;
                            iframe_video.height(new_height);
                            if (!only_pos)
                                video_objs.eq(i2)[0].addEventListener('selectstart', function (evt) {
                                    this.dragDrop();
                                    return false;
                                }, false);
                        }
                    }
                    if (popups.isShow) {
                        visual_tolls.removeClass('show');
                        visual_tolls_update_to_exit = false;
                        visual_tolls_update_is_work = false;
                        if (callback)
                            callback();
                        return;
                    }

                    if (!only_pos) {
                        if (!text_cont.is(":focus") && !popups.isShow && focus_text_cont_index == -1) {
                            visual_tolls.removeClass('show');
                            text_cont.attr('contenteditable', 'false');
                            video_objs.off('dragstart');
                            visual_tolls_update_to_exit = false;
                            visual_tolls_update_is_work = false;
                            if (callback)
                                callback();
                            return;
                        }
                        var index_text_cont = text_conts.index(text_cont[0]);
                        if (index_text_cont != focus_text_cont_index && focus_text_cont_index != -1) {
                            visual_tolls_update_to_exit = false;
                            visual_tolls_update_is_work = false;
                            if (callback)
                                callback();
                            return;
                        }
                        if (!not_structure) {
                            var img_objs = text_cont.find('img');
                            img_objs.off();
                            img_objs.click(function (ev) {
                                saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
                                format_tools.selection.selectNode(this);
                                popups.img_edit(text_cont, w.$(this), visual_tolls_update);
                            });
                            bindDraggables(img_objs);

                            video_objs.click(function (ev) {
                                saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
                                popups.video_edit(w.$(this), visual_tolls_update);
                            });

                            bindDraggables(video_objs);

                            if (text_cont.attr('contenteditable') != 'true')
                                text_cont.attr('contenteditable', 'true');
                            visual_tolls.css('z-index', findHighestZIndex() + 1);
                            visual_tolls.addClass('show');

                            var save_button = visual_tolls.children('a').eq(0);
                            if (text_cont.attr('data-save_button') == 'false')
                                save_button.addClass('hide');
                            else
                                save_button.removeClass('hide');
                        }
                    }
                    var index_text_cont = text_conts.index(text_cont[0]);
                    if (index_text_cont != focus_text_cont_index && focus_text_cont_index != -1) {
                        visual_tolls_update_to_exit = false;
                        visual_tolls_update_is_work = false;
                        if (callback)
                            callback();
                        return;
                    }
                    var text_cont_offsets = text_cont.offset();

                    var visual_tolls_h = visual_tolls.outerHeight(true);
                    var scroll_top = w.$(scroll_cont).scrollTop();
                    // console.log(scroll_top);
                    if (scroll_top != w.$(d).scrollTop())
                        scroll_top = 10;

                    var s_pos = format_tools.selection.getSelectionCoords();
                    // console.log(s_pos.y);
                    s_pos.y += scroll_top;
                    // console.log(s_pos.y);
                    var t_h = parseInt(text_cont.css('font-size')) + visual_tolls_h * 2;
                    var scale = 1;
                    if (iframe) {
                        scale = parseFloat(iframe.data('SW_TE_scale'));
                        t_h /= scale;
                    }
                    var top = s_pos.y;
                    top -= t_h;
                    var tmp = visual_tolls_h - 20 + scroll_top;
                    if (top < tmp)
                        top = s_pos.y + t_h;
                    if (iframe) {
                        var iframe_offsets = iframe.offset();
                        var padding = parseInt(iframe.css('padding')) * scale;
                        text_cont_offsets.left = text_cont_offsets.left * scale + iframe_offsets.left + padding;
                        top = top * scale + iframe_offsets.top + padding;
                    }
                    visual_tolls.css({'left': (text_cont_offsets.left + parseInt(text_cont.css('padding-left'), 10)) + 'px', 'top': top + 'px'});
                    setTimeout(function () {
                        if (visual_tolls_h != visual_tolls.outerHeight(true))
                            visual_tolls_update(true, true, true);
                    }, 500);
                    if (!only_pos) {
                        var visual_tolls_items = visual_tolls.children('a');
                        var visual_tolls_items_size = visual_tolls_items.length;
                        setTimeout(function (i, callback) {
                            if (visual_tolls_update_to_exit) {
                                visual_tolls_update_to_exit = false;
                                visual_tolls_update_is_work = false;
                                if (callback)
                                    callback();
                                return;
                            }
                            var obj = visual_tolls_items.eq(i);
                            var command = obj.attr('href').substr(1);
                            var set_active = function (status) {
                                if (status)
                                    obj.addClass('active');
                                else
                                    obj.removeClass('active');
                            };
                            switch (command) {
                                case 'bold':
                                    set_active(SW_TE.api.bold.get());
                                    break;
                                case 'italic':
                                    set_active(SW_TE.api.italic.get());
                                    break;
                                case 'underline':
                                    set_active(SW_TE.api.underline.get());
                                    break;
                                case 'h1':
                                    set_active(SW_TE.api.h1.get());
                                    break;
                                case 'align_left':
                                    set_active((SW_TE.api.align.get().indexOf(SW_TE.api.align.types.left) != -1));
                                    break;
                                case 'align_center':
                                    set_active((SW_TE.api.align.get().indexOf(SW_TE.api.align.types.center) != -1));
                                    break;
                                case 'align_right':
                                    set_active((SW_TE.api.align.get().indexOf(SW_TE.api.align.types.right) != -1));
                                    break;
                                case 'align_justify':
                                    set_active((SW_TE.api.align.get().indexOf(SW_TE.api.align.types.justify) != -1));
                                    break;
                                case 'a':
                                    set_active(SW_TE.api.a.check());
                                    break;
                                case 'ul':
                                    set_active(SW_TE.api.ul.get());
                                    break;
                            }
                            i++;
                            if (i < visual_tolls_items_size) {
                                setTimeout(arguments.callee.bind(this, i, callback), 0);
                                return;
                            }
                            visual_tolls_update_to_exit = false;
                            visual_tolls_update_is_work = false;
                            if (callback)
                                callback();

                        }.bind(this, 0, callback), 0);
                    } else {
                        visual_tolls_update_to_exit = false;
                        visual_tolls_update_is_work = false;
                        if (callback)
                            callback();
                    }

                };
                var get_target = function (e) {
                    var targ;
                    if (!e) var e = w.event;
                    if (e.target) targ = e.target;
                    else if (e.srcElement) targ = e.srcElement;
                    if (targ.nodeType == 3) // defeat Safari bug
                        targ = targ.parentNode;
                    return targ;
                };

                text_cont.click(function (ev) {


                    //console.log(text_cont.attr('contenteditable'));
                    if (text_cont.attr('contenteditable') != 'true' && !text_cont.hasClass('disabled')) {
                        ev.preventDefault();
                        ev.stopPropagation();
                        focus_text_cont_index = text_conts.index(text_cont[0]);
                        var target = get_target(ev);
                        if (target && target.nodeName.toLowerCase() == 'a')
                            return true;
                        text_cont.attr('contenteditable', 'true');
                        text_cont.focus();
                        visual_tolls_update(false, false, true);
                    }
                });
                w.$(w).resize(function () {
                    visual_tolls_update(true);
                });
                visual_tolls_update(false, false, true);
                text_cont.blur(function () {
                    if (!popups.isShow)
                        focus_text_cont_index = -1;
                    visual_tolls_update(false, false, true);
                });
                d.onselectionchange = function (ev) {
                    if (focus_text_cont_index == -1)
                        return true;
                    // console.log(focus_text_cont_index);
                    visual_tolls_update(false, true);
                };
                if (browser.firefox) {
                    text_cont.mousemove(function () {
                        visual_tolls_update(false, true);
                    });
                }
                text_cont.keyup(function () {
                    saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
                    visual_tolls_update(false, true);
                });
                var scroll_timeout = null;
                w.$(scroll_cont).scroll(function () {
                    clearTimeout(scroll_timeout);
                    setTimeout(function () {
                        visual_tolls_update(true, true);
                    }, 100);

                });
                var a_elems = visual_tolls.children('a');
                a_elems.mousedown(function (ev) {
                    ev.preventDefault();
                    return false;
                });
                a_elems.click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    var index_text_cont = text_conts.index(text_cont[0]);
                    if (index_text_cont != focus_text_cont_index && focus_text_cont_index != -1)
                        return;
                    saved_arr[text_cont.attr('data-smart_text_box_name')] = false;
                    var command = $(this).attr('href').substr(1);
                    switch (command) {
                        case 'bold':
                            SW_TE.api.bold.set();
                            break;
                        case 'italic':
                            SW_TE.api.italic.set();
                            break;
                        case 'underline':
                            SW_TE.api.underline.set();
                            break;
                        case 'h1':
                            SW_TE.api.h1.set();
                            break;
                        case 'align_left':
                            SW_TE.api.align.set(SW_TE.api.align.types.left);
                            break;
                        case 'align_center':
                            SW_TE.api.align.set(SW_TE.api.align.types.center);
                            break;
                        case 'align_right':
                            SW_TE.api.align.set(SW_TE.api.align.types.right);
                            break;
                        case 'align_justify':
                            SW_TE.api.align.set(SW_TE.api.align.types.justify);
                            break;
                        case 'line_break':
                            SW_TE.api.line_break.insert();
                            break;
                        case 'a':
                            popups.link_edit(text_cont, visual_tolls_update);
                            break;
                        case 'ul':
                            SW_TE.api.ul.set();
                            break;
                        case 'img':
                            popups.img_edit(text_cont, SW_TE.api.img.insert(), visual_tolls_update);
                            break;
                        case 'video':
                            popups.video_edit(SW_TE.api.video.insert(), visual_tolls_update);
                            break;
                        case 'code':
                            popups.html_edit(text_cont, visual_tolls_update);
                            break;
                        case 'save':
                            SW_TE.api.save_box(text_cont.attr('data-smart_text_box_name'), text_cont, null, null, true);
                            break;
                    }
                    text_cont.focus();
                    visual_tolls_update();
                    return false;
                });
            })(obj);
        }
    };
    SW_TE.reinit();
});