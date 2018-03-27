var global_js = {};
if (window.location.hash == "" && window.location.href.indexOf("#") != -1)
    window.location.href = window.location.href.split('#')[0];

$(document).ready(function () {
    var browser = SW_BS.browser;
    
    global_js.mobile = true;
    global_js.main_page = false;

    if (browser.error_css || (!browser.chrome && browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537)) {
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
        window.addEventListener('orientationchange', function (ev) {
            //window.scrollTo(0, 0);
            switch (window.orientation) {
                case -90:
                case 90:
                    //alert('landscape');
                    //if (global_js.main_page) {
                    //    window.location.reload();
                    //    $('body').text('Пожалуйста подождите');
                    //}
                    global_js.fix_page();
                    break;
                default:
                    //alert('portrait');
                    //$("#center").animate_translate3d(0, 0, 0, null, 0, null, true, true);
                    global_js.fix_page();
                    setTimeout(function () {
                        //log("orientationchange");

                    }, 100);
                    break;
            }


        });


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
                //console.log('1');
            }
            else {
                //console.log('0');
                //window.scrollTo(0, 0);
                $("#center").animate_translate3d(0, 0, 0, null,0,null,true,true);
                global_js.size_compatibility = false;
                if (global_js.v_slider.isEnable())
                    global_js.v_slider.disable();

            }

    };

//Top menu

    var mobile_menu_phone = $(' #mobile_menu_phone');
    var phone = mobile_menu_phone.text();
    phone = preg_replace(['[ ()-]', "\r|\n", '^[8]'], ["", "", "+7"], phone);
    mobile_menu_phone.attr('href', 'tel:' + phone);

    if (is_admin) {
        $("#menu_elements>div").append('<div class="menu_item"><a href="#account_edit">Аккаунт' + (notify_len ? ' <span style="color: red;">' + notify_len + '</span>' : '') + '</a></div>');
    }
    global_js.top_menu_items = $(".menu_item a");
    global_js.top_menu_item_save_index = 0;


    $("#mobile_menu_button").hammer(null,function (ev) {
        //alert(1);
        ev.preventDefault();
        //ev.stopPropagation();

        if ($("#menu_elements").hasClass('show')){
            $("#menu_elements").css_animate({'opacity': 0}, null, 500, function () {
                $("#menu_elements").toggleClass('show');
            });}
        else {
            $("#menu_elements").toggleClass('show');
            $("#menu_elements").css_animate({'opacity': 1}, null, 500);
        }

        return false;
    });

    $("#center").click(function () {
        if ($("#menu_elements").hasClass('show'))
            $("#mobile_menu_button").click();
    });

    $("#jivo_open").click(function (ev) {
        ev.preventDefault();
        jivo_api.open();
        return false;
    });

    main();
    global_js.fix_page();

});