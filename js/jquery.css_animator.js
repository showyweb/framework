/*
 * Name:    jQuery CSS Animator
 * Version: 2.0.3
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: MIT license. http://www.opensource.org/licenses/mit-license.php
 * Copyright (c) 2015 Pavel Novojilov;
 */
var JgCssAnimator = {};
(function ($) {
    var ease_ = {
        'linear': 'linear',
        'ease': 'ease',
        'easeIn': 'ease-in',
        'easeOut': 'ease-out',
        'easeInOut': 'ease-in-out',
        'easeInCubic': 'cubic-bezier(.55,.055,.675,.19)',
        'easeOutCubic': 'cubic-bezier(.215,.61,.355,1)',
        'easeInOutCubic': 'cubic-bezier(.645,.045,.355,1)',
        'easeInCirc': 'cubic-bezier(.6,.04,.98,.335)',
        'easeOutCirc': 'cubic-bezier(.075,.82,.165,1)',
        'easeInOutCirc': 'cubic-bezier(.785,.135,.15,.86)',
        'easeInExpo': 'cubic-bezier(.95,.05,.795,.035)',
        'easeOutExpo': 'cubic-bezier(.19,1,.22,1)',
        'easeInOutExpo': 'cubic-bezier(1,0,0,1)',
        'easeInQuad': 'cubic-bezier(.55,.085,.68,.53)',
        'easeOutQuad': 'cubic-bezier(.25,.46,.45,.94)',
        'easeInOutQuad': 'cubic-bezier(.455,.03,.515,.955)',
        'easeInQuart': 'cubic-bezier(.895,.03,.685,.22)',
        'easeOutQuart': 'cubic-bezier(.165,.84,.44,1)',
        'easeInOutQuart': 'cubic-bezier(.77,0,.175,1)',
        'easeInQuint': 'cubic-bezier(.755,.05,.855,.06)',
        'easeOutQuint': 'cubic-bezier(.23,1,.32,1)',
        'easeInOutQuint': 'cubic-bezier(.86,0,.07,1)',
        'easeInSine': 'cubic-bezier(.47,0,.745,.715)',
        'easeOutSine': 'cubic-bezier(.39,.575,.565,1)',
        'easeInOutSine': 'cubic-bezier(.445,.05,.55,.95)',
        'easeInBack': 'cubic-bezier(.6,-.28,.735,.045)',
        'easeOutBack': 'cubic-bezier(.175, .885,.32,1.275)',
        'easeInOutBack': 'cubic-bezier(.68,-.55,.265,1.55)'
    };
    JgCssAnimator = {ease: ease_};


    var work_col = 0;

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
    $.fn.stop_animate = function (not_acceleration) {
        if (!SW_BS.browser.isTransitionSupported || not_acceleration) {
            this.stop();
        } else {
            this.css({'transition': 'none'});
        }
    };

    $.fn.animate_translate3d = function (x, y, z, ease, duration_ms, callback_finish, not_disable_hover, not_acceleration) {
        duration_ms = Math.round(duration_ms);
        ease = (ease == null) ? ease_.linear : ease;
        var translate3d = 'translate3d(' + x + 'px,' + y + "px," + z + 'px)';
        if (!SW_BS.browser.isTranslate3dSupported || !SW_BS.browser.isTransitionSupported || not_acceleration)
            translate3d = 'translate(' + x + 'px,' + y + 'px)';
        var transition = 'transform ' + duration_ms + 'ms ' + ease_[ease];
        var css_properties_transition = {"transition":transition};
        var css_properties_transform = {"transform":translate3d};


        var this_ = this;
        if(duration_ms===0){
            this_.css(css_properties_transform);
            if (callback_finish)
                callback_finish.call(this_);
            return this;
        }
        if (!SW_BS.browser.isTransitionSupported || not_acceleration) {
            this.stop();

            this.animate({transform: translate3d}, {
                duration: duration_ms, easing: ease, complete: function () {
                    if (callback_finish)
                        callback_finish.call(this_);
                }
            })
        } else {
            work_col++;
            if (!SW_BS.browser.isMobile.any && !not_disable_hover)
                SW_BS.browser.disable_hover();

            var t_start = new Date().getTime();
            requestAnimFrame(function () {
                this_.attr('jq_css_animator_is_working', 'true');
                this_.css(css_properties_transition);
                requestAnimFrame(function () {
                    this_.css(css_properties_transform);
                    duration_ms = duration_ms - (new Date().getTime() - t_start);
                    if (duration_ms < 0)
                        duration_ms = 0;
                    setTimeout(function () {
                        work_col--;
                        setTimeout(function () {
                            if (work_col === 0) {
                                this_.css({'transition': ''});
                                this_.removeAttr('jq_css_animator_is_working');
                                //console.log('set none');
                            }
                            else if (this_.attr('jq_css_animator_is_working') === 'true')
                                setTimeout(arguments.callee, 1);
                        }, 1);

                        if (!SW_BS.browser.isMobile.any && !not_disable_hover)
                            SW_BS.browser.enable_hover();
                        if (callback_finish)
                            callback_finish.call(this_);
                    }, duration_ms);
                }, this_[0]);
            }, this_[0]);
            return this;
        }
    };

    $.fn.css_animate = function (css_properties, ease, duration_ms, callback_finish, not_disable_hover, not_acceleration) {
        duration_ms = Math.round(duration_ms);
        ease = (ease == null) ? ease_.linear : ease;
        var this_ = this;
        if (duration_ms === 0) {
            this_.css(css_properties);
            if (callback_finish)
                callback_finish.call(this_);
            return this;
        }
        for (var k in css_properties) {
            if (css_properties.hasOwnProperty(k)) {
                this_.css({k: this_.css(k)});
                //console.log( k + " : " + css_properties[k]);
            }
        }

        if (!SW_BS.browser.isTransitionSupported || not_acceleration) {
            this.stop();

            this.animate(css_properties, {
                duration: duration_ms, easing: ease, complete: function () {
                    if (callback_finish)
                        callback_finish.call(this_);
                }
                //, progress:function(animation,progress,remainingMs){
                //    console.log(animation.elem.style['width'])
                //}
            })
        } else {
            var transition = 'all ' + duration_ms + 'ms ' + ease_[ease];
            var animate_css_properties = {transition:transition};
            work_col++;

            if (!SW_BS.browser.isMobile.any && !not_disable_hover) {
                //console.log("x")
                SW_BS.browser.disable_hover();
            }
            var t_start = new Date().getTime();
            requestAnimFrame(function () {
                this_.attr('jq_css_animator_is_working', 'true');
                this_.css(animate_css_properties);
                requestAnimFrame(function () {
                    this_.css(css_properties);
                    duration_ms = duration_ms - (new Date().getTime() - t_start);
                    if (duration_ms < 0)
                        duration_ms = 0;
                    setTimeout(function () {
                        work_col--;
                        setTimeout(function () {
                            if (work_col === 0)
                            {
                                this_.css({'transition': ''});
                                this_.removeAttr('jq_css_animator_is_working');
                            }
                            else if (this_.attr('jq_css_animator_is_working') === 'true')
                                setTimeout(arguments.callee, 1);
                        }, 1);

                        if (!SW_BS.browser.isMobile.any && !not_disable_hover)
                            SW_BS.browser.enable_hover();
                        if (callback_finish)
                            callback_finish.call(this_);
                    }, duration_ms);
                    //console.log(duration_ms+" "+(duration_ms-(new Date().getTime()-t_start)))

                }, this_[0]);
            }, this_[0]);
            return this;
        }
    };

}(jQuery));