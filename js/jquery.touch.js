/*
 * Name:    SHOWYWeb jQuery Touch
 * Version: 1.0.6
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru/
 * License: MIT license. http://www.opensource.org/licenses/mit-license.php
 * Copyright (c) 2015 Pavel Novojilov;
 */
var swt_last_touchstart_type = null;
var swt_last_touchend_type = null;
(function ($) {
    $.fn.touch = function (options) {
        // console.log('init');
        var def_options = {
            touch_start: null,
            touch_move_start: null,
            touch_move: null,
            touch_end_all: null,
            touch_press: null,
            touch_tap: null,
            animFPS: 60,
            use_requestAnimFrame: true
        };

        var requestAnimFrame = (function () {
            return window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function (/* function */ callback, /* DOMElement */ element) {
                    window.setTimeout(callback, 1000 / 60);
                };
        })();

        var ev_prepare = function (ev, startX, startY) {
            if (!ev.clientX) {
                if (!ev.changedTouches || !ev.changedTouches[0])
                    return null;
                ev.clientX = ev.changedTouches[0].clientX;
                ev.clientY = ev.changedTouches[0].clientY;
                // console.log('clientX'+ev.changedTouches[0].clientX);
            }
            if (typeof startX === "undefined") {
                startX = ev.clientX;
                startY = ev.clientY;
            }
            ev.deltaX = ev.clientX - startX;
            ev.deltaY = ev.clientY - startY;
            return ev;
        };

        var calc_velocity = function (dt, dx, dy) {
            var velocity = {
                x: dx / dt || 0,
                y: dy / dt || 0
            };

            velocity.x = Number(velocity.x.toString().substr(0, 10));
            velocity.y = Number(velocity.y.toString().substr(0, 10));
            return velocity;
        };

        var opts = $.extend({}, def_options, options);
        var touch_loop_delay = 1000 / opts.animFPS;
        var elements = this;
        var touch_objs = {};

        elements.each(function (index) {
            var touch_obj = {
                trigger_touchstart: function (ev) {
                },
                trigger_touchmove: function (ev) {
                },
                trigger_touchend: function (ev) {
                },
                destroy: function () {
                },
                init: function (element_) {
                    var touch_start_ = false;
                    var touch_move_start_ = false;
                    var p_timeout = null;
                    var startTime = 0;
                    var endTime = 0;
                    var start_x = 0;
                    var end_x = 0;
                    var start_y = 0;
                    var end_y = 0;
                    element_.attr('draggable', 'false');
                    var touchstart = function (ev, is_trigger) {
                        if (swt_last_touchstart_type == null || ev.type == swt_last_touchstart_type) {
                            is_trigger = is_trigger ? "true" : "false";
                            // console.log(swt_last_touchstart_type + " | " + ev.type + " is_trigger=" + is_trigger);
                            swt_last_touchstart_type = ev.type;
                            // console.log($(ev.target).text());
                            ev = ev_prepare(ev);
                            if (!ev)
                                return;
                            startTime = new Date().getTime();
                            start_x = ev.clientX;
                            start_y = ev.clientY;
                            if (opts.touch_start) {
                                opts.touch_start.call(element_[0], ev);
                            }
                            touch_start_ = true;
                            if (opts.use_requestAnimFrame)
                                requestAnimFrame(touch_move_loop);
                            else
                                touch_move_loop_interval = setInterval(touch_move_loop, touch_loop_delay);
                            clearTimeout(p_timeout);
                            if (opts.touch_press) {
                                p_timeout = setTimeout(function () {
                                    p_timeout = setInterval(function () {
                                        opts.touch_press.call(element_[0], ev);
                                    }, 150);
                                }, 300);
                            }
                        }
                    };

                    var touch_move_loop_interval = null;
                    var last_touch_move_ev = null;
                    var touch_move_loop = function () {
                        if (last_touch_move_ev !== null) {
                            var ev = last_touch_move_ev;
                            last_touch_move_ev = null;
                            ev = ev_prepare(ev, start_x, start_y);
                            if (!ev)
                                return;
                            endTime = new Date().getTime();
                            var velocity = calc_velocity(endTime - startTime, ev.deltaX, ev.deltaY);
                            ev.velocityX = velocity.x;
                            ev.velocityY = velocity.y;
                            opts.touch_move.call(element_[0], ev);
                        }
                        if (touch_start_ && touch_move_loop_interval === null)
                            if (opts.use_requestAnimFrame)
                                requestAnimFrame(touch_move_loop);
                            else
                                touch_move_loop_interval = setInterval(touch_move_loop, touch_loop_delay);
                    };
                    var touchmove = function (ev) {
                        // console.log(touch_start_);
                        if (ev.clientX || ev.changedTouches) {
                            if (touch_start_) {
                                if (!touch_move_start_) {
                                    ev = ev_prepare(ev, start_x, start_y);
                                    if (!ev)
                                        return;
                                    if (ev.deltaX !== 0 || ev.deltaY !== 0) {
                                        touch_move_start_ = true;
                                        if (opts.touch_move_start)
                                            opts.touch_move_start.call(element_[0], ev);
                                    }
                                }
                                if (opts.touch_move) {
                                    last_touch_move_ev = ev;
                                }
                            }
                        }
                    };

                    var touchend = function (ev) {
                        // console.log("sx"+ start_x);
                        if (swt_last_touchend_type == null || ev.type == swt_last_touchend_type) {
                            swt_last_touchend_type = ev.type;
                            last_touch_move_ev = null;
                            ev = ev_prepare(ev, start_x, start_y);
                            endTime = new Date().getTime();
                            if (ev) {
                                var velocity = calc_velocity(endTime - startTime, ev.deltaX, ev.deltaY);
                                ev.velocityX = velocity.x;
                                ev.velocityY = velocity.y;
                            }
                            else {
                                if (!ev)
                                    ev = {};
                                ev.velocityX = 0;
                                ev.velocityY = 0;
                            }
                            clearInterval(touch_move_loop_interval);
                            clearTimeout(p_timeout);
                            setTimeout(function () {
                                clearTimeout(p_timeout);
                            }, 300);

                            if (opts.touch_end_all)
                                opts.touch_end_all.call(element_[0], ev);
                            if (touch_start_ && opts.touch_tap)
                                opts.touch_tap.call(element_[0], ev);
                            touch_start_ = false;
                            touch_move_start_ = false;
                        }
                    };

                    if (window.navigator.msPointerEnabled) {
                        element_[0].addEventListener("MSPointerDown", touchstart, false);
                        document.addEventListener("MSPointerMove", touchmove, false);
                        document.addEventListener("MSPointerUp", touchend, false);
                    } else if (window.navigator.PointerEnabled) {
                        element_[0].addEventListener("PointerDown", touchstart, false);
                        document.addEventListener("PointerMove", touchmove, false);
                        document.addEventListener("PointerUp", touchend, false);
                    } else {
                        element_[0].addEventListener("touchstart", touchstart, false);
                        document.addEventListener("touchmove", touchmove, false);
                        document.addEventListener("touchend", touchend, false);
                        document.addEventListener("touchcancel", touchend, false);
                    }
                    element_[0].addEventListener("mousedown", touchstart, false);
                    document.addEventListener("mousemove", touchmove, false);
                    document.addEventListener("mouseup", touchend, false);
                    this.destroy = function () {
                        if (window.navigator.msPointerEnabled) {
                            element_[0].removeEventListener("MSPointerDown", touchstart, false);
                            document.removeEventListener("MSPointerMove", touchmove, false);
                            document.removeEventListener("MSPointerUp", touchend, false);
                        } else if (window.navigator.PointerEnabled) {
                            element_[0].removeEventListener("PointerDown", touchstart, false);
                            document.removeEventListener("PointerMove", touchmove, false);
                            document.removeEventListener("PointerUp", touchend, false);
                        } else {
                            element_[0].removeEventListener("touchstart", touchstart, false);
                            document.removeEventListener("touchmove", touchmove, false);
                            document.removeEventListener("touchend", touchend, false);
                            document.removeEventListener("touchcancel", touchend, false);
                        }
                        element_[0].removeEventListener("mousedown", touchstart, false);
                        document.removeEventListener("mousemove", touchmove, false);
                        document.removeEventListener("mouseup", touchend, false);
                    };
                    this.trigger_touchstart = function (ev) {
                        touchstart(ev, true);
                    };
                    this.trigger_touchmove = touchmove;
                    this.trigger_touchend = touchend;
                }
            };
            touch_obj.init($(this));
            touch_objs[index] = touch_obj;
        });

        var f_exec = function (os, f_name, ev) {
            for (var key in os) {
                if (!touch_objs.hasOwnProperty(key)) continue;
                if (os[key][f_name])
                    os[key][f_name](ev);
            }
        };
        touch_objs.destroy = function () {
            // console.log('destroy');
            f_exec(this, "destroy");
        };
        touch_objs.trigger_touchstart = function (ev) {
            f_exec(this, "trigger_touchstart", ev);
        };
        touch_objs.trigger_touchmove = function (ev) {
            f_exec(this, "trigger_touchmove", ev);
        };
        touch_objs.trigger_touchend = function (ev) {
            f_exec(this, "trigger_touchend", ev);
        };
        return touch_objs;
    };
})(jQuery);