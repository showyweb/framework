/**
 * Name:    SHOWYWeb GALLERY JS
 * Version: 5.1.0
 * Author:  Novojilov Pavel Andreevich
 * Support: http://showyweb.com
 * License: Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) https://creativecommons.org/licenses/by-nc-nd/4.0/
 */
var SW_GALLERY = {
    ANIMATE_TYPES: {SCROLL: 1},
    init: function (jq_gallery_cont, callback_init, animate_type, speed) {
        var g_obj = {
            destroy: function () {
                main_obj.find("a, div").off("click.SW_GALLERY");
                images_gallery.off("click.SW_GALLERY");
                $(".showyweb_gallery_full_screen").remove();
                $(window).off("resize.SW_GALLERY");
                slider.destroy();
            }
        };
        if (!animate_type)
            animate_type = SW_GALLERY.ANIMATE_TYPES.SCROLL;
        if (!speed)
            speed = 600;

        var get_href = function (jq_img, dynamic_size) {
            var href = "";
            if (jq_img.is('a'))
                href = jq_img.attr('href');
            else
                href = jq_img.attr('data-url');
            if (dynamic_size) {
                var w_w = $(window).width();
                var w_h = $(window).height();
                var size = (w_w > w_h) ? w_w : w_h;
                var url_code_url = url_code.encode(href);
                href = '/?ajax_module=cache_img&dynamic_url=' + url_code_url + "&size=" + size;
            }
            return href;
        };

        function loader_img(index, callback, not_preloader) {
            // console.log(index+' '+ not_preloader);
            var img = new Image();
            img.onload = function () {
                img_load_complete_status[index] = true;
            };
            var jq_img = images_gallery.eq(index);
            img.src = get_href(jq_img, true);
            if (img.complete || img_load_complete_status[index]) {
                img_load_complete_status[index] = true;
                if (callback)
                    callback();
                if (not_preloader)
                    return;
                //preloader
                for (var i = (index - 2 >= 0) ? index - 2 : 0; i < images_gallery.length && i < index + 2; i++)
                    loader_img(i, null, true);
            }
            else {
                setTimeout(function () {
                    if (img_load_complete_status[index]) {
                        if (callback)
                            callback();
                    }
                    else {
                        setTimeout(arguments.callee, 100);
                    }
                }, 100);
            }
        }

        function set_image_on_slide(index) {
            loader_img(index, function () {
                var jq_img = images_gallery.eq(index);
                var img_src = get_href(jq_img, true);
                gallery_cont_items.children('div').eq(index).children('div').css({'background-image': 'url("' + img_src + '")'});
            }, true);
        }

        var img_load_complete_status = [];
        var images_arr = [];
        var images_gallery = new $();
        var main_obj = $('<div class="showyweb_gallery_full_screen" style="display: none;"> ' +
            '<div> ' +
            '<div class="items"> ' +
            '</div> ' +
            '<a title="Предыдущее" class="arrow arrow_left" href="#prev"><i class="fa fa-angle-left"></i></a> ' +
            '<a title="Cледующее" class="arrow" href="#next"><i class="fa fa-angle-right"></i></a> ' +
            '<a title="Закрыть" href="#close" class="close"><i class="fa fa-times-circle"></i></a> ' +
            '<a title="Открыть оригинал" href="#link" class="link"><i class="fa fa-external-link" aria-hidden="true"></i></a> ' +
            '</div> ' +
            '<div class="loader"><a href="#close"><i class="fa fa-refresh fa-spin"></i></a></div> ' +
            '</div>');
        $("body").append(main_obj);


        var gallery_cont_items = main_obj.find(".items");
        var tmp_arr = [];
        var images = jq_gallery_cont.find("a, *:not(a) > img[data-url]");
        var tmp_len = images.length;

        images.each(function () {
            var jq_img = $(this);
            var tmp_str = get_href(jq_img);
            if (tmp_str)
                tmp_str = tmp_str.substring(tmp_str.length - 4).toLowerCase();
            if (tmp_str == ".jpg" || tmp_str == ".png" || tmp_str == "jpeg") {
                $.merge(images_gallery, jq_img);
                jq_img.addClass('showyweb_gallery_item');
            }
        });

        for (var i = 0; i < images_gallery.length; i++) {
            img_load_complete_status.push(false);
            gallery_cont_items.append('<div data-href="#next" style="left: ' + 100 * i + '%"><div></div></div>');
        }

        $(window).on("resize.SW_GALLERY", function () {
            for (var i = 0; i < img_load_complete_status.length; i++) {
                img_load_complete_status[i] = false;
            }
        });

        var work_status = false;
        var touch_active = false;
        var slider = showyweb_smart_slider.init(gallery_cont_items, showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL, animate_type, function () {
            var gallery_cont = {
                callback_change_start: null,
                callback_change_finish: null,
                callback_touch_start: null,
                callback_touch_move_start: null,
                callback_touch_end: null,
                get_cur_index: function () {
                    return slider.get_cur_index();
                },
                get_size: function () {
                    return slider.get_size();
                }
                , show_img: function (index) {
                    if (work_status || touch_active)
                        return;
                    var size = slider.get_size();
                    if (index < 0 || index >= size)
                        return;
                    main_obj.css('z-index', findHighestZIndex());
                    save_index = index;
                    work_status = true;
                    var tmp_f = function () {
                        slider.speed = speed;
                        slider.to_slide(index, function () {
                            work_status = false;
                        });
                    };
                    if (!slider.isEnable())
                        slider.enable(tmp_f, index);
                    else
                        setTimeout(function () {
                            if (slider.is_work_active()) {
                                setTimeout(arguments.callee, 100);
                                return;
                            }
                            tmp_f();
                        }, 0)
                },
                hide: function () {
                    main_obj.removeClass('show');
                    slider.disable();
                    slider.speed = 0;
                }
            };

            slider.enable_scroll_block();
            slider.disable();
            slider.speed = 0;
            slider.callback_touch_move_start = function (pointerType) {
                touch_active = true;
                if (gallery_cont.callback_touch_start)
                    gallery_cont.callback_touch_start(pointerType);
            };
            slider.callback_touch_end = function () {
                setTimeout(function () {
                    touch_active = false;
                    if (gallery_cont.callback_touch_end)
                        gallery_cont.callback_touch_end();
                }, 500);

            };
            slider.callback_slide_change_start = function (index) {
                if (gallery_cont.callback_change_start)
                    gallery_cont.callback_change_start(index);
                main_obj.addClass('show load');
                //console.log(index);
                loader_img(index, function () {
                    set_image_on_slide(index);
                    if (index > 0)
                        set_image_on_slide(index - 1);
                    if (index < slider.get_size() - 1)
                        set_image_on_slide(index + 1);
                    main_obj.removeClass('load');
                });
            };
            slider.callback_slide_change_finish = function (index) {
                if (gallery_cont.callback_change_finish)
                    gallery_cont.callback_change_finish(index);
            };
            var save_index = -1;

            main_obj.find("a, div").on("click.SW_GALLERY", function (ev) {
                ev.preventDefault();
                var obj = $(this);
                var href = "";
                if (obj.is('a'))
                    href = obj.attr('href');
                else
                    href = obj.attr('data-href');
                if (!href)
                    return true;
                href = href.replace("#", "");
                var cur_index = slider.get_cur_index();
                switch (href) {
                    case 'prev':
                        gallery_cont.show_img(cur_index - 1);
                        break;
                    case 'next':
                        gallery_cont.show_img(cur_index + 1);
                        if (work_status || touch_active)
                            return;
                        if (cur_index + 1 == slider.get_size())
                            gallery_cont.hide();
                        break;
                    case 'close':
                        gallery_cont.hide();
                        break;
                    case 'link':
                        var jq_img = images_gallery.eq(cur_index);
                        var href = get_href(jq_img);
                        window.open(href);
                        break;
                }
                return false;
            });

            images_gallery.on("click.SW_GALLERY", function (ev) {
                ev.preventDefault();
                var index = images_gallery.index(this);
                gallery_cont.show_img(index);
                return false;
            });
            if (callback_init)
                callback_init(gallery_cont);
        });
        return g_obj;
    }
};
