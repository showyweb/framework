var global_js = {};

if (window.location.hash == "" && window.location.href.indexOf("#") != -1)
    window.location.href = window.location.href.split('#')[0];

$(document).ready(function () {
    var browser = SW_BS.browser;
    if (browser.error_css || (!browser.chrome && browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537)) {
        if (typeof _2gis_full == "undefined") {
          var  _2gis_full = false;
        }
        _2gis_full = false;
        browser.isTransitionSupported = false;
    }

    //ios hover fix
    $('a').on('touchstart mouseenter focus', function (e) {
        if (e.type == 'touchstart') {
            // Don't trigger mouseenter even if they hold
            //e.stopImmediatePropagation();
            // If $item is a link (<a>), don't go to said link on mobile, show menu instead
            //e.preventDefault();
        }

        // Show the submenu here
    });
    global_js.main_page = false;
    
    global_js.mobile = false;


    global_js.get_css_int = function (jq_obj, css_prop) {
        return parseInt(jq_obj.css(css_prop), 10);
    };


    global_js.percentage_w_to_px = function (percentage, obj_width) {
        var obj = obj_width ? obj_width : $(window);
        return Math.round(obj.width() / 100 * percentage);
    };

    global_js.percentage_h_to_px = function (percentage, obj_height) {
        var obj = obj_height ? obj_height : $(window);
        return Math.round(obj.height() / 100 * percentage);
    };

    global_js.getRandomInt = function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };


    global_js.requestAnimFrame = (function () {
        return window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (/* function */ callback, /* DOMElement */ element) {
                window.setTimeout(callback, 1000 / 60);
            };
    })();

    if (browser.isTranslate2dSupported)
        window.addEventListener('orientationchange', function () {
            window.scrollTo(0, 0);
            setTimeout(function () {
                //log("orientationchange");
                global_js.fix_page();
            }, 100);
        });

    var start_timeout = false;
    global_js.size_compatibility = true;
    global_js.fix_page = function () {
        var size_fix = true;
        var body = $('body');
        var width = body.width();
        var height = body.height();

        if (global_js.main_page)
            if ($("#slide_animation_toggle").css("visibility") == "visible") {
                window.scrollTo(0, 0);
                global_js.requestAnimFrame.call(window, function () {
                    global_js.size_compatibility = true;
                    if (!global_js.v_slider.isEnable())
                        global_js.v_slider.enable(function () {
                            global_js.v_slider.to_slide(0);
                        });
                }, window);

            }
            else {
                global_js.size_compatibility = false;
                if (global_js.v_slider.isEnable())
                    global_js.v_slider.disable();
                $("#center").animate_translate3d(0, 0, 0, 'easeOutCubic', 400);
            }

    };

//Top menu
    if (is_admin) {
        if (typeof notify_len == "undefined") {
            var notify_len = 0;
        }
        $("#menu_elements>div").append('<div class="menu_item"><a href="#account_edit">Аккаунт' + (notify_len ? ' <span style="color: red;">' + notify_len + '</span>' : '') + '</a></div>');
    }
    global_js.top_menu_items = $(".menu_item a");
    global_js.top_menu_item_save_index = 0;
    var top_menu_item_timeout = null;
    global_js.top_menu_items.smart_hover(function (e) {
        clearTimeout(top_menu_item_timeout);
        //console.log('hover')
        global_js.top_menu_items.removeClass('active');
        this.addClass('active');
    }, function (e) {
        clearTimeout(top_menu_item_timeout);
        top_menu_item_timeout = setTimeout(function () {
            //console.log('unhover')
            global_js.top_menu_items.removeClass('active');
            global_js.top_menu_items.eq(global_js.top_menu_item_save_index).addClass('active');
        }, 150);

    });

    main();
    global_js.fix_page();

});