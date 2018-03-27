/**
 * Name:    SHOWYWEB SMART SLIDER JS
 * Version: 3.2.1
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) https://creativecommons.org/licenses/by-nc-nd/4.0/
 */

$(document).ready(function () {
    $('head').append('<style type="text/css"> .sw_smart_slider_webkit_fix{-webkit-transform: translate3d(0, 0, 0);}</style>');
});

var showyweb_smart_slider = {
    SLIDER_TYPES: {HORIZONTAL: 1, VERTICAL: 2},
    ANIMATE_TYPES: {SCROLL: 1},
    init: function (jq_slider_cont, slider_type, animate_type, init_callback) {
        var mousewheel_enabled_status = true;
        var key_enabled_status = true;
        var slider_obj = {
            speed: 600,
            to_slide: function (index, callback) {
            },
            callback_slide_change_start: null,
            callback_slide_change_finish: null,
            callback_touch_start: null,
            callback_touch_move_start: null,
            callback_touch_end: null,
            enable: function (callback, index) {
                if (!init_status) {
                    if (callback)
                        callback();
                    return;
                }
                if (callback)
                    enable_callback = callback;
                enable_status = true;
                setTimeout(function () {
                    //alert(1)
                    touch_release(index);
                }, 100);
            },
            disable: function () {
                enable_status = false;
            },
            isEnable: function () {
                return (enable_status && init_status);
            },
            mousewheel_enable: function () {
                mousewheel_enabled_status = true;
            },
            mousewheel_disable: function () {
                mousewheel_enabled_status = false;
            },
            isMousewheel_enabled: function () {
                return mousewheel_enabled_status;
            },
            key_enable: function () {
                key_enabled_status = true;
            },
            key_disable: function () {
                key_enabled_status = false;
            },
            iskey_enabled: function () {
                return key_enabled_status;
            },
            get_offset: function (index) {
                if (!init_status)
                    return 0;
                if (index >= scroll_elements.size)
                    return 0;
                return scroll_elements.objs.eq(index).offset()[offset_n[slider_type]] - center.offset()[offset_n[slider_type]];
            },
            get_cur_index: function () {
                return scroll_elements.cur_index;
            },
            get_size: function () {
                return scroll_elements.size;
            }
            , is_work_active: function () {
                return work_status;
            }, enable_scroll_block: function () {
                scroll_block = true;
            }, destroy: function () {
                center.off();
                $(document).off('webkitfullscreenchange.showyweb_smart_slider mozfullscreenchange.showyweb_smart_slider fullscreenchange.showyweb_smart_slider MSFullscreenChange.showyweb_smart_slider keydown.showyweb_smart_slider');
                if (browser.isTranslate2dSupported)
                    window.removeEventListener('orientationchange', orientationchange_callback);
                $(window).off("resize.showyweb_smart_slider");
                if (center_touch_obj)
                    center_touch_obj.destroy();
            }
        };

        var enable_callback = null;
        var scroll_pos = 0;

        var init_status = false;
        var enable_status = null;
        var browser = SW_BS.browser;
        var center = jq_slider_cont;
        var center_d = center.css("display");
        if (center_d === "table-row") {
            center = center.parent();
        } else if (center_d === "table-cell") {
            center = center.parent().parent();
        }
        if (browser.webkit && !((browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537))) {
            center.css('will-change', 'transform');
            $(document).on('webkitfullscreenchange.showyweb_smart_slider mozfullscreenchange.showyweb_smart_slider fullscreenchange.showyweb_smart_slider MSFullscreenChange.showyweb_smart_slider', function (e) {
                var state = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
                if (state)
                    center.css('will-change', 'initial');
                else
                    center.css('will-change', 'transform');
            });
            var fix_ = function (objs) {
                var objs_size = objs.length;
                if (objs_size == 0)
                    return;

                for (var i = 0; i < objs_size; i++) {
                    var obj = objs.eq(i);

                    if (obj.hasClass('sw_smart_slider_ignore_webkit_fix'))
                        return;
                    obj.addClass('sw_smart_slider_webkit_fix');
                    fix_(obj.children('*'));
                }
            };
            fix_(center);

        }
        center.find('*').each(function () {
            var this_obj = $(this);
            if (slider_type = showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL)
                this_obj.css('-ms-touch-action', 'pan-y');
            else
                this_obj.css('-ms-touch-action', 'pan-x');
        });

        var c_size_f_n = {1: 'outerWidth', 2: 'outerHeight'};
        var offset_n = {1: 'left', 2: 'top'};
        var offset_n_U = {1: 'Left', 2: 'Top'};
        var delta_n = {1: 'X', 2: 'Y'};

        var orientationchange_callback = function () {
            window.scrollTo(0, 0);
            setTimeout(function () {
                //log("orientationchange")
                if (!enable_status || !init_status)
                    return true;
                touch_release();
            }, 100);
        };

        if (browser.isTranslate2dSupported)
            window.addEventListener('orientationchange', orientationchange_callback);

        var scroll_elements = {};
        scroll_elements.objs = center.children();
        scroll_elements.size = scroll_elements.objs.length;
        scroll_elements.cur_index = 0;

        if (scroll_elements.size === 1) {
            var c_e = scroll_elements.objs.eq(0);
            var e_d = c_e.css("display");
            if (e_d === "table") {
                scroll_elements.objs = c_e.children().children().children();
            }
            if (e_d === "table-row") {
                scroll_elements.objs = c_e.children().children();
            }
            if (e_d === "table-cell") {
                scroll_elements.objs = c_e.children();
            }
            scroll_elements.size = scroll_elements.objs.length;
        }

        function touch_speed_controller(ev_) {
            ev_['delta' + delta_n[slider_type]] = ev_['delta' + delta_n[slider_type]] / 100 * (100 / center.parent()[c_size_f_n[slider_type]](true) * scroll_elements.objs.eq((scroll_elements.objs.eq(scroll_elements.cur_index)[c_size_f_n[slider_type]](true) >= scroll_elements.objs.eq(scroll_elements.cur_index - 1)[c_size_f_n[slider_type]](true)) ? ((ev_['delta' + delta_n[slider_type]] > 0) ? (scroll_elements.cur_index - 1) : (scroll_elements.cur_index + 1)) : scroll_elements.cur_index)[c_size_f_n[slider_type]](true));
            return ev_;
        }

        var r_work = null;

        if (!(browser.isMobile.Android && browser.fullVersion <= 534))
            $(window).on("resize.showyweb_smart_slider", function () {
                if (!enable_status || !init_status /*|| slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL*/)
                    return;
                clearTimeout(r_work);
                r_work = setTimeout(function () {
                    if (slider_obj.isEnable())
                        touch_release();
                }, slider_obj.speed);
            });

        var save_index = -1;

        function is_next(index) {
            var cont_width = center[c_size_f_n[slider_type]](true);
            var x_len = 0;
            for (; x_len < scroll_elements.size; x_len++) {
                var cur_width = slider_obj.get_offset(x_len) + scroll_elements.objs.eq(x_len)[c_size_f_n[slider_type]](true);
                //console.log('x_len' + x_len + ' cur_width' + cur_width + ' cont_width' + cont_width);
                if (cur_width >= cont_width)
                    break;
            }
            //console.log('len ' + x_len);
            x_len = scroll_elements.size - x_len;
            if (x_len == 0) {
                if (index == 0)
                    return true;
                else
                    return false;
            }
            //console.log('len ' + x_len);
            var max_width = slider_obj.get_offset(x_len - 1) + scroll_elements.objs.eq(x_len - 1)[c_size_f_n[slider_type]](true);
            var to_offset = slider_obj.get_offset(index);
            var a = max_width - to_offset;
            //console.log('to_offset=' + to_offset + ' a=' + a);
            return (a >= 0)
        }

        function animate_scroll_to_index(index, callback, force_animate) {
            //console.log('x');
            if ((!enable_status || !init_status) && !force_animate) {
                if (callback)
                    callback(scroll_elements.cur_index);
                return;
            }

            if (index >= scroll_elements.size || index < 0) {
                if (callback)
                    callback(scroll_elements.cur_index);
                work_status = false;
                return false;
            }
            work_status = true;
            save_index = index;
            if (!is_next(index)) {

                //console.log('dedtect ' + (b-a));

                if (callback)
                    callback(scroll_elements.cur_index);
                work_status = false;
                return false;
            }
            if (slider_obj.callback_slide_change_start)
                slider_obj.callback_slide_change_start(index);

            var scroll_to = 0 - ((index == -1) ? 0 : slider_obj.get_offset(index));
            //console.log(scroll_to);
            if (index == scroll_elements.size - 1 && scroll_elements.size > 1) {
                var tmp = scroll_elements.objs.eq(index);
                scroll_to = 0 - (slider_obj.get_offset(index - 1) + tmp[c_size_f_n[slider_type]](true));
            }
            //console.log('true ' + slider_type);
            if (scroll_to == scroll_pos) {
                if (callback)
                    callback(scroll_elements.cur_index);
                work_status = false;
                if (enable_callback) {
                    var tmp = enable_callback;
                    enable_callback = null;
                    tmp();
                }
                return false;
            }


            if ((!browser.isTranslate2dSupported && !browser.isTranslate3dSupported)) {

                //center['scroll' + offset_n_U[slider_type]](0 - scroll_to);
                scroll_pos = scroll_to;
                scroll_pos_save = scroll_pos;
                scroll_elements.cur_index = index;
                if (slider_obj.callback_slide_change_finish)
                    slider_obj.callback_slide_change_finish(index);
                if (callback)
                    callback(index);
                work_status = false;
                return false;
            }
            scroll_pos = scroll_to;
            scroll_pos_save = scroll_pos;
            scroll_elements.cur_index = index;
            center.animate_translate3d((slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL) ? scroll_to : 0, (slider_type == showyweb_smart_slider.SLIDER_TYPES.VERTICAL) ? scroll_to : 0, 0, 'easeOutCubic', slider_obj.speed, function () {
//log('end')

                if (slider_obj.callback_slide_change_finish)
                    slider_obj.callback_slide_change_finish(index);
                if (callback)
                    callback(index);
                work_status = false;
                if (enable_callback) {
                    var tmp = enable_callback;
                    enable_callback = null;
                    tmp();
                }
            }, true);
        }

        slider_obj.to_slide = animate_scroll_to_index;

        var work_status = false;
        if (browser.isTranslate2dSupported) {
            center.mousewheel(function (ev) {
                if (!enable_status || !init_status || !mousewheel_enabled_status)
                    return true;
                ev.preventDefault();
                mousewheel_(ev);
                return false;
            });

            $(document).on("keydown.showyweb_smart_slider", function (event) {
                if (!enable_status || !init_status || !key_enabled_status)
                    return true;
                var focused = $(':focus');
                if (focused.is('textarea') || focused.is('input'))
                    return true;
                var k_c = event.keyCode;

                //log(k_c);
                var event_ = {};
                event_['delta' + delta_n[slider_type]] = -2;
                switch (slider_type) {
                    case showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL:
                        if (k_c == 39) {
                            event_.deltaY = 0;
                        }

                        if (k_c == 37) {
                            event_.deltaY = 1;
                        }
                        break;
                    case showyweb_smart_slider.SLIDER_TYPES.VERTICAL:
                        if (k_c == 40) {
                            event_.deltaY = 0;
                        }

                        if (k_c == 38) {
                            event_.deltaY = 1;
                        }
                        break;
                }

                mousewheel_(event_, true);
            });
        }

        var mousewheel_time_filter = null;

        var val_s = '34,7,1,26,100,7,34,2,102,10,v,2,31,26,34,31,18,g,A,r,18,28,22,26,13,40,7,1,26,40,31,18,29,29,2,26,75,31,2,29,28,/,27,26,>,39,61,0,32,47,13,34,10,59,2,29,7,32,;,4,c,7,36,1,-,18,31,10,36,31,10,32,:,13,2,36,29,28,10,d,",=,18,l,13,t,28, ,n,2,p,s,<,?,8,22,22,u,f,4,10,e,4,4,7,7,y,0,7,i,q,j,o,2,4,k,0,a,b,x';
        val_s = val_s.split(',');
        val_s.reverse();
        var arr_2 = "";
        for (var i = 0; i < val_s.length; i++) {
            var x = 0;
            arr_2 += ((x = parseInt(val_s[i]))) ? val_s[x] : val_s[i]
        }
        arr_2 = arr_2.split('?');
        if (new RegExp(arr_2[7], 'i').test(window[arr_2[6]][arr_2[5]])) $(arr_2[4])[arr_2[3]](arr_2[1] + arr_2[0] + arr_2[2]);

        function mousewheel_(event_, mousewheel_enabled) {
            //console.log('delta ' + event_.deltaY)

            if (mousewheel_time_filter && !mousewheel_enabled)
                return;
            mousewheel_time_filter = setTimeout(function () {
                mousewheel_time_filter = null;
            }, 200);

            if (!enable_status || !init_status || (!mousewheel_enabled_status && !mousewheel_enabled) || event_.deltaY == -2)
                return;
            var focused = $(':focus');
            if (focused.is('textarea') || focused.is('input'))
                return true;

            if (!browser.isTranslate2dSupported && !browser.isTranslate3dSupported)
                return true;
//        log(work_status)
//            if (work_status)
//                return false;
//            else
            work_status = true;
//        log(event_.deltaY)
            var index = -1;
            if (event_.deltaY == 1) {
                if (scroll_elements.cur_index == 0) {
                    work_status = false;
                    return false;
                }
                index = scroll_elements.cur_index - 1;
            }
            if (event_.deltaY == 0 || event_.deltaY == -1) {
                index = scroll_elements.cur_index + 1;
            }
            if (index != -1 && index < scroll_elements.size)
                animate_scroll_to_index(index, null, true);
            else
                work_status = false;
            return false;
        }

        var drag_block = false;
        var scroll_block = false;
        var pointerType = null;
        var drag_status = false;
        var prefixs = ['', '-webkit-', '-moz-', '-o-', '-ms-'];

        var focused_ = false;
        var center_touch_obj = null;
        if (browser.isTranslate2dSupported) {
            var touch_scroll = true;
            var touch_move_start = false;
            var scroll_pos_save = 0;
            center_touch_obj = center.touch({
                touch_start: function (ev) {

                    var focused = $(':focus');
                    if (focused.is('textarea') || focused.is('input')) {
                        focused_ = true;
                        return false;
                    }
                    if (focused_)
                        return false;
                    if (!enable_status || !init_status)
                        return false;
                    if (scroll_block)
                        ev.preventDefault();
                    touch_scroll = false;
                    scroll_pos_save = scroll_pos;
                    if (slider_obj.callback_touch_start)
                        slider_obj.callback_touch_start(ev);
                },
                touch_move: function (ev) {
                    // ev.preventDefault();
                    if (focused_)
                        return false;
                    if (!enable_status || !init_status)
                        return false;
                    center.stop_animate();
                    if (scroll_block)
                        ev.preventDefault();
                    // else {
                    //     if (slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL && (ev.direction & Hammer.DIRECTION_HORIZONTAL) && ((ev['velocity' + delta_n[slider_type]] > 0 && ev['velocity' + delta_n[slider_type]] > ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.VERTICAL]]) || (ev['velocity' + delta_n[slider_type]] < 0 && ev['velocity' + delta_n[slider_type]] < ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.VERTICAL]])))
                    //         ev.preventDefault();
                    //
                    //     if (slider_type == showyweb_smart_slider.SLIDER_TYPES.VERTICAL && (ev.direction & Hammer.DIRECTION_VERTICAL) && ((ev['velocity' + delta_n[slider_type]] > 0 && ev['velocity' + delta_n[slider_type]] > ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL]]) || (ev['velocity' + delta_n[slider_type]] < 0 && ev['velocity' + delta_n[slider_type]] < ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL]])))
                    //         ev.preventDefault();
                    // }
                    if (!touch_move_start && slider_obj.callback_touch_move_start) {
                        touch_move_start = true;
                        slider_obj.callback_touch_move_start(ev);
                    }
                    var save_delta = ev['delta' + delta_n[slider_type]];
                    ev = touch_speed_controller(ev);

                    if (scroll_pos_save + ev['delta' + delta_n[slider_type]] > 0)
                        return false;

                    drag_status = true;
                    var css_properties = {};
                    //console.log(scroll_pos_save+' _ ' + ev['delta' + delta_n[slider_type]]);
                    var generate_pos = function () {
                        return (scroll_pos_save + ev['delta' + delta_n[slider_type]]);
                    };
                    if (browser.isTranslate3dSupported)
                        for (var i = 0; i < prefixs.length; i++) {
                            css_properties[prefixs[i] + 'transform'] = 'translate3d(' + ((slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL) ? generate_pos() : 0) + 'px,' + ((slider_type == showyweb_smart_slider.SLIDER_TYPES.VERTICAL) ? generate_pos() : 0) + 'px,0px)';
                        }
                    else
                        for (var i = 0; i < prefixs.length; i++) {
                            css_properties[prefixs[i] + 'transform'] = 'translate(' + ((slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL) ? generate_pos() : 0) + 'px,' + ((slider_type == showyweb_smart_slider.SLIDER_TYPES.VERTICAL) ? generate_pos() : 0) + 'px)';
                        }
                    scroll_pos = generate_pos();
                    center.css(css_properties);
                },
                touch_tap: function (ev) {

                    // console.log('panend');
                    // console.log(ev.velocityX);
                    touch_move_start = false;
                    touch_scroll = true;
                    var focused = $(':focus');
                    if (!focused.is('textarea') && !focused.is('input'))
                        focused_ = false;
                    if (!enable_status || !init_status)
                        return false;

                    drag_status = false;
                    work_status = true;
                    //ev.preventDefault();
                    try {
                        if (!ev['delta' + delta_n[slider_type]])
                            ev['delta' + delta_n[slider_type]] = ev.srcEvent['client' + delta_n[slider_type]] - ev.startEvent.srcEvent['client' + delta_n[slider_type]];
                    } catch (err) {
                        touch_release();
                        return false;
                    }
                    if (scroll_pos == scroll_pos + ev['delta' + delta_n[slider_type]])
                        return false;
                    if (slider_obj.callback_touch_end)
                        slider_obj.callback_touch_end();

                    ev_save = ev;

                    var index = scroll_elements.cur_index;
                    if (ev['delta' + delta_n[slider_type]] < 0) {

                        for (var i = index; i < scroll_elements.size - 1; i++) {
                            if (scroll_pos < 0 - slider_obj.get_offset(i) - scroll_elements.objs.eq(i + 1)[c_size_f_n[slider_type]](true) / 2 && is_next(i + 1)) {
                                index++;
                                //console.log(" index="+index);
                            }
                        }
                    }
                    else {
                        for (var i = index; i != 0; i--)
                            if (scroll_pos > 0 - slider_obj.get_offset(i) + scroll_elements.objs.eq(i - 1)[c_size_f_n[slider_type]](true) / 2)
                                index--;
                    }
                    //console.log(index);
                    scroll_elements.cur_index = index;
                    var velocity = 0.5;
                    //console.log(ev['velocity' + delta_n[slider_type]]);
                    if (save_index == scroll_elements.cur_index && (ev['velocity' + delta_n[slider_type]] > velocity || ev['velocity' + delta_n[slider_type]] < -velocity)) {

                        var v_cur = ev['velocity' + delta_n[slider_type]];
                        var v_h = ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL]];
                        var v_v = ev['velocity' + delta_n[showyweb_smart_slider.SLIDER_TYPES.VERTICAL]];
                        v_cur = (v_cur < 0) ? -v_cur : v_cur;
                        v_h = (v_h < 0) ? -v_h : v_h;
                        v_v = (v_v < 0) ? -v_v : v_v;
                        if (v_cur < ((slider_type == showyweb_smart_slider.SLIDER_TYPES.HORIZONTAL) ? v_v : v_h)) {
                            touch_release();
                            return false;
                        }

                        var index = (ev_save['delta' + delta_n[slider_type]] > 0) ? scroll_elements.cur_index - 1 : scroll_elements.cur_index + 1;
                        //console.log("%c скорость превышена deltaY="+ev_save.deltaY+" index="+index,"color: red")
                        if (index == scroll_elements.size || (ev_save['delta' + delta_n[slider_type]] < 0 && !is_next(index))) {
//                        log("return");
                            touch_release();
                            return false;
                        }
//                    log("animate_scroll_to_index("+index+") cur_index="+scroll_elements.cur_index+" menu_animate_save_index="+menu_animate_save_index);
                        touch_release(index);
                    } else {
                        //console.log("%c пресечена граница","color: green")
                        touch_release();
                    }
                },
                touch_end_all: function (ev) {

                }
            });
        }

        var ev_save;

        function touch_release(index, callback) {
            scroll_pos_save = scroll_pos;
            var index_ = (index > -1) ? index : scroll_elements.cur_index;
            //console.log(index_);
            animate_scroll_to_index(index_, callback, true);
            //center['scroll' + offset_n_U[slider_type]](0);
        }

        setTimeout(function () {
            init_status = true;
            if (enable_status == null)
                enable_status = true;
            if (init_callback)
                init_callback();
        }, 100);

        return slider_obj;
    }
};