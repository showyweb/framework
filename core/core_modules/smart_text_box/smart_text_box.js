/**
 * Name:    SHOWYWEB SMART TEXT BOX
 * Version: 1.0.0 (11.10.2016)
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) https://creativecommons.org/licenses/by-nc-nd/4.0/
 */
var smart_text_box = {
    global_callback_close: null, reinit: function () {
        setTimeout(smart_text_box.reinit, 100);
    }
};
$(document).ready(function () {
    var browser = SW_BS.browser;

    smart_text_box.reinit = function () {
        var work_ajax = false;
        var work_timeout_arr = {};
        var boxes = $('.smart_text_box>span:first-child[data-contenteditable="true"]');
        for (var i = 0; i < boxes.length; i++) {
            var obj = boxes.eq(i);
            if (obj.attr('data-multiline') == "false")
                obj.css('white-space', 'nowrap');
            obj.parent().children('.save').remove();
            obj[0].onpaste = function (e) {
                var this_obj = $(this);
                setTimeout(function () {
                    var text = this_obj.text();
                    //console.log(text);
                    this_obj.text(text);
                    if (this_obj.attr('data-multiline') == "false")
                        $('br,p', this_obj).replaceWith(' ');
                }, 100)
            };
            var name = obj.parent().attr('data-smart_text_box_name');
            work_timeout_arr[name] = null;
        }
        $(window).off("beforeunload.smart_text_box");
        $(window).on("beforeunload.smart_text_box", function (e) {
            //e.preventDefault();
            //e.stopPropagation();
            var if_work = false;
            for (var i = 0; i < boxes.length; i++) {
                var obj = boxes.eq(i);
                var name = obj.parent().attr('data-smart_text_box_name');
                if (work_timeout_arr[name]) {
                    if_work = true;
                    break;
                }
            }
            var msg = "В настоящее время идет фоновое сохранение измененного текста.";
            if (if_work)
                return msg;
            //return true;
        });

        var save_name = null;
        var save_text = null;
        var save_s = false;
        boxes.off();
        boxes.click(function (e) {
            //e.preventDefault();
            //e.stopPropagation();
            var this_obj = $(this);
            if (this_obj.attr('data-editor') == "modal") {
                smart_text_box.show_text_window(this_obj.parent().parent().html(), function () {
                    this_obj = $('.text_window .smart_text_box span');
                    this_obj.removeAttr('data-editor');
                }, function () {
                    smart_text_box.reinit();
                    return true;
                }, true);
                return;
            }
            if (!this_obj.hasClass('disabled') && !this_obj.parent().hasClass('disabled')) {
                e.preventDefault();
                e.stopPropagation();
                if (this_obj.attr('contenteditable') != 'true') {
                    this_obj.attr('contenteditable', 'true');
                    this_obj.focus();
                    save_name = this_obj.parent().attr('data-smart_text_box_name');
                    save_text = this_obj.html();
                    this_obj.focus();
                    save_s = false;
                }
            }
        });
        boxes.blur(function () {
            var this_obj = $(this);
            setTimeout(function () {
                this_obj.removeAttr('contenteditable');
                this_obj.parent().children('.save').remove();
                this_obj.parent().removeClass('focus');
                this_obj.parent().css({'padding-right': 0});
                if (!save_s && this_obj.attr('data-save_button') != 'false')
                    save_box(save_name, save_text);
            }, 100);
        });

        function save_box(name, data, callback) {

            clearTimeout(work_timeout_arr[name]);
            work_timeout_arr[name] = setTimeout(function () {
                if (work_ajax) {
                    setTimeout(arguments.callee, 1000);
                    return;
                }
                work_ajax = true;

                var boxes_len = boxes.length;
                for (var i = 0; i < boxes_len; i++)
                    if (boxes.eq(i).parent().attr('data-smart_text_box_name') == name && data != boxes.eq(i).html())
                        boxes.eq(i).html(data);
                if (data == save_text) {
                    work_ajax = false;
                    work_timeout_arr[name] = null;
                    return;
                }
                post_ajax('smart_text_box', {smart_text_box: 'update_box', 'name': name, 'data': data}, function (data) {
                    work_ajax = false;
                    work_timeout_arr[name] = null;
                    if (data == "")
                        alert('Сохранено');
                    if (callback)
                        callback();
                }, true);
            }, 0)
        }

        boxes.keypress(function (e) {
            var this_obj = $(this);
            var code = e.keyCode || e.which;
            if (this_obj.attr('data-multiline') == "false" && code == 13) {
                e.preventDefault();
                return false;
            }
        });

        boxes.keyup(function (e) {
            var this_obj = $(this);
            if (this_obj.html() != save_text && this_obj.attr('data-save_button') != 'false') {
                if (!this_obj.parent().hasClass('focus')) {
                    this_obj.parent().addClass('focus');
                    var f_s = parseInt(this_obj.css('font-size')) + 10;
                    this_obj.parent().css({'padding-right': f_s + 'px'});
                    this_obj.parent().append('<a class="save" title="Сохранить"><i class="fa fa-floppy-o"></i></a>');
                    var obj = $('.smart_text_box .save');
                    obj.mousedown(function (ev) {
                        save_s = true;
                        ev.stopPropagation();
                        ev.preventDefault();
                        save_box(save_name, this_obj.html(), function () {
                            this_obj.blur();
                        });
                        return false;
                    });
                }
            }
        });
    };

    var callback_close_ = {};
    var interval = {};
    smart_text_box.show_text_window = function (inf_html, callback_open, callback_close, reinit, iframe_ignore, width) {
        // if (browser.isMobile.iOS) {
        //     var st = $(document).scrollTop();
        //     $('body').css({'position': 'fixed', 'top': -st});
        //     $(document).scrollTop(0);
        // }

        $('body').append('<div class="text_window" style="z-index: ' + (findHighestZIndex($('body').children("*").eq(0)) + 1) + ';">' +
            '<div>' +
            '<div>' +
            '<div><a class="close_text_window" title="Закрыть" href="#"><i class="fa fa-times"></i></i></a><div><div></div></div></div>' +
            '</div>' +
            '</div>' +
            '</div>');


        var inf = inf_html;
        var p75 = 0;
        var tw_cont = $(".text_window>div>div>div>div");
        var index = tw_cont.length - 1;
        tw_cont = tw_cont.eq(index);
        if (typeof width !== "undefined")
            tw_cont.parent().css("width", width);
        callback_close_[index] = callback_close;
        tw_cont.children('*').html(inf);

        $(".text_window>div").eq(index).css({
            "visibility": "visible",
            'display': 'table',
            'top': 0
        });

        var resize_callback = function () {
            p75 = $(window).height() - 110;
        };

        resize_callback();

        $(window).resize(resize_callback);

        var scroll_show = {};

        smart_text_box.scoll_tw_reinit = function (index) {
            var tw_ = $(".text_window").eq(index);
            var iframe_obj = tw_.find(".stb_iframe");
            if (iframe_obj.is('iframe') && iframe_obj[0].contentWindow.document.body != null) {
                iframe_obj[0].height = p75;
                iframe_obj[0].width = iframe_obj.parent().width();
            }
            var tw_cont_ = $(".text_window>div>div>div>div").eq(index);
            if (tw_cont_.children("*").height() >= p75) {
                if (scroll_show[index])
                    return false;
                scroll_show[index] = true;
                tw_cont_.css({'height': p75 + 'px', 'display': 'block'});
                if (tw_cont_.find('iframe').length == 0 || iframe_ignore)
                    tw_cont_.css('overflow-y', 'auto');
                if (tw_cont_.attr('data-scroll_fix') != 'true') {
                    tw_cont_.attr('data-scroll_fix', 'true');
                    tw_cont_.css('-webkit-overflow-scrolling', 'auto');
                    setTimeout(function () {
                        tw_cont_.css('-webkit-overflow-scrolling', 'touch');
                    }, 500);
                }
            }
            else {
                if (!scroll_show[index])
                    return false;
                scroll_show[index] = false;
                tw_cont_.css({'height': 'auto', 'display': 'block'});
            }
        };
        clearInterval(interval[index]);
        interval[index] = setInterval(function () {
            scroll_show[index] = false;
            if (smart_text_box)
                smart_text_box.scoll_tw_reinit(index);
            else
                clearInterval(interval[index]);
        }, 500);

        if (callback_open)
            callback_open(index);

        $(".text_window>div>div>div").eq(index).mousedown(function (e) {
            e.stopPropagation();
        });
        $(".text_window .close_text_window").eq(index).mousedown(function () {
            smart_text_box.close_text_window(index);
        });
        $(" .text_window").eq(index).mousedown(function () {
            smart_text_box.close_text_window(index);
        });
        if (reinit)
            smart_text_box.reinit();
    };

    smart_text_box.show_iframe_window = function (href, callback_open, callback_close) {
        var html = '<div class="stb_iframe_cont"></div>';
        smart_text_box.show_text_window(html, function (index) {
            var tw_ = $(".text_window").eq(index);
            tw_.find(".stb_iframe_cont").append(
                $('<iframe>', {
                    src: href,
                    class: 'stb_iframe',
                    frameborder: 0,
                    scrolling: 'no'
                })
            );

            var iframe_obj = tw_.find(".stb_iframe");

            iframe_obj[0].onload = function () {
                if (callback_open) {
                    callback_open();
                    callback_open = null;
                }

            }
        }, callback_close);
    };

    smart_text_box.close_text_window = function (index) {
        if (!index)
            index = 0;
        if (index < $(".text_window").length - 1)
            smart_text_box.close_text_window(index + 1);

        clearInterval(interval[index]);

        if (callback_close_[index] && !callback_close_[index]())
            return false;
        if (smart_text_box.global_callback_close)
            smart_text_box.global_callback_close();
        $(".text_window").eq(index).remove();
        // if ($(".text_window").length < 1)
        //     if (browser.isMobile.iOS) {
        //         var st = -parseInt($('body').css('top'));
        //         $('body').css({'position': 'absolute', 'top': 0});
        //         $(document).scrollTop(st);
        //     }
        return false;
    };
    //smart_text_box.is_show_text_window = function () {
    //    return ($(".text_window").css('visibility')=='hidden')?false:true;
    //};


    smart_text_box.reinit();
});