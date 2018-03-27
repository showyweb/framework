/*
 * Name:    SHOWYWEB BROWSERS SCANNER JS
 * Version: 3.5.0
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru/
 * License: MIT license. http://www.opensource.org/licenses/mit-license.php
 * Copyright (c) 2015 Pavel Novojilov;
 */

var SW_BS = {
    isInit: false,
    msie_min_browser_version: 9.0,
    opera_min_browser_version: 12,
    m_opera_min_browser_version: 12.10,
    opera_mini_min_browser_version: 7.0,
    firefox_min_browser_version: 7.0,
    m_firefox_min_browser_version: 29.0,
    webkit_min_browser_version: 532.9,
    chrome_min_browser_version: 7,
    div_id_display_error: "error_css",
    mobile_error_message: "'Версия вашего интернет браузера ' + browser.name + ' устарела, в связи с этим возможно некорректное отображение текущей страницы сайта. Пожалуйста обновите браузер ' + browser.name + ' до последней версии.'",
    error_message: "'<h1>Версия вашего интернет браузера ' + browser.name + ' устарела, в связи с этим возможно некорректное отображение текущей страницы сайта. Пожалуйста обновите браузер ' + browser.name + ' до последней версии, сделать это можно пройдя по <a href=\"' + browser_get_link + '\"> этой ссылке</a></h1>'",
    init: function () {
        var browser = {
            firefox: false,
            webkit: false,
            opera: false,
            opera_mini: false,
            safari: false,
            chrome: false,
            android: false,
            msie: false,
            msedge: false
        };
        if (typeof $ != "undefined") {
            var body = document.body,
                timer;
            browser.disable_user_select = function (selector) {
                if (!selector)
                    selector = 'body';
                $(selector).addClass('disable-user-select');
                if (browser.msie && browser.version < 10)
                    $(selector + ' *').attr('unselectable', 'on');
            };
            browser.enable_user_select = function (selector) {
                if (!selector)
                    selector = 'body';
                $(selector).removeClass('disable-user-select');
                if (browser.msie && browser.version < 10)
                    $(selector + ' *').attr('unselectable', 'off');
            };
            browser.disable_hover = function (selector) {
                if (!selector)
                    selector = 'body';
                $(selector).addClass('disable-hover');
            };
            browser.enable_hover = function (selector) {
                if (!selector)
                    selector = 'body';
                $(selector).removeClass('disable-hover');
            };
            browser.hover_controller = function () {
                clearTimeout(timer);
                this.disable_hover();
                timer = setTimeout(this.enable_hover, 100);
            };
            window.addEventListener('scroll', this.hover_controller, false);
        }
        browser.isMobile = {
            Android: (function () {
                return navigator.userAgent.match(/Android/i) ? true : false;
            })(),
            BlackBerry: (function () {
                return navigator.userAgent.match(/BlackBerry|BB/i) ? true : false;
            })(),
            iOS: (function () {
                return navigator.userAgent.match(/iPhone|iPad|iPod/i) ? true : false;
            })(),
            Windows: (function () {
                return navigator.userAgent.match(/IEMobile/i) ? true : false;
            })()
        };
        browser.isMobile.any = (function () {
            return (browser.isMobile.Android || browser.isMobile.BlackBerry || browser.isMobile.iOS || browser.opera_mini || browser.isMobile.Windows);
        })();
        browser.isMobile.anyPhone = (function () {
            if (!browser.isMobile.any)
                return false;
            return (navigator.userAgent.match(/iphone|ipod/i) ? true : false) || (browser.isMobile.Android && (navigator.userAgent.match(/mobile/i) ? true : false)) || (browser.isMobile.BlackBerry && !(navigator.userAgent.match(/tablet/i) ? true : false)) || browser.isMobile.Windows;
        })();
        browser.isMobile.anyTablet = (function () {
            if (!browser.isMobile.any)
                return false;
            return (navigator.userAgent.match(/ipad/i) ? true : false) || (browser.isMobile.Android && !(navigator.userAgent.match(/mobile/i) ? true : false)) || (browser.isMobile.BlackBerry && (navigator.userAgent.match(/tablet/i) ? true : false));
        })();

        var nAgt = navigator.userAgent;
        browser.ua = nAgt;
        browser.name = navigator.appName;
        browser.fullVersion = parseFloat(navigator.appVersion);
        var nameOffset, verOffset, ix;
        if ((verOffset = nAgt.indexOf("Opera")) != -1) {
            browser.opera = true;
            browser.name = "Opera";
            browser.fullVersion = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf("Version")) != -1)
                browser.fullVersion = nAgt.substring(verOffset + 8);
            if ((verOffset = nAgt.indexOf("Opera Mini")) != -1) {
                browser.fullVersion = nAgt.substring(verOffset + 11);
                browser.name = 'Opera Mini';
                browser.opera_mini = true;
            }
        }
        else if ((verOffset = nAgt.indexOf("OPR")) != -1) {
            browser.opera = true;
            browser.name = "Opera";
            browser.fullVersion = nAgt.substring(verOffset + 4);
        }
        else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
            browser.msie = true;
            browser.name = "Microsoft Internet Explorer";
            browser.fullVersion = nAgt.substring(verOffset + 5);
        }
        else if (nAgt.indexOf("Trident") != -1) {
            browser.msie = true;
            browser.name = "Microsoft Internet Explorer";
            var start = nAgt.indexOf("rv:") + 3;
            var end = start + 4;
            browser.fullVersion = nAgt.substring(start, end);
        }
        else if (browser.isMobile.Android && nAgt.indexOf('Version/') !== -1) {
            browser.webkit = true;
            browser.name = "Android Browser";
            browser.android = true;
            verOffset = 0;
            browser.fullVersion = "";
        }
        else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
            browser.webkit = true;
            browser.chrome = true;
            browser.name = "Google Chrome";
            verOffset = 0;
            browser.fullVersion = "";
            if ((verOffset = nAgt.indexOf("Edge")) != -1) {
                browser.msedge = true;
                browser.chrome = false;
                browser.name = "Microsoft EDGE";
                browser.fullVersion = nAgt.substring(verOffset + 5);
            }
        }
        else if ((verOffset = nAgt.indexOf("CriOS")) != -1) {
            browser.webkit = true;
            browser.chrome = true;
            browser.name = "Google Chrome";
            verOffset = nAgt.indexOf("AppleWebKit");
            browser.fullVersion = nAgt.substring(verOffset + 12);

        }
        else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
            browser.firefox = true;
            browser.name = "Firefox";
            browser.fullVersion = nAgt.substring(verOffset + 8);
        }
        else if ((verOffset = nAgt.indexOf("Safari")) != -1 && nAgt.match(/(Macintosh|iPhone|iPad|iPod).+Version\/[0-9.]*.*Safari/i)) {
            browser.webkit = true;
            browser.safari = true;
            browser.name = "Safari";
            verOffset = nAgt.indexOf("AppleWebKit");
            browser.fullVersion = nAgt.substring(verOffset + 12);
        }
        else if ((verOffset = nAgt.indexOf("AppleWebKit")) != -1) {
            browser.webkit = true;
            browser.name = "";
            browser.fullVersion = nAgt.substring(verOffset + 12);
        }
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {

            browser.name = nAgt.substring(nameOffset, verOffset);
            browser.fullVersion = nAgt.substring(verOffset + 1);
            if (browser.name.toLowerCase() == browser.name.toUpperCase()) {
                browser.name = navigator.appName;
            }
        }
        if ((ix = browser.fullVersion.indexOf(";")) != -1 || (ix = browser.fullVersion.indexOf(" ")) != -1)
            browser.fullVersion = browser.fullVersion.substring(0, ix);
        browser.version = parseInt('' + browser.fullVersion, 10);
        if (isNaN(browser.version)) {
            browser.fullVersion = navigator.appVersion;
            browser.version = parseFloat(navigator.appVersion);
        }

        if (browser.chrome) {
            var myString = nAgt;
            var myRegexp = /(Chrome|CriOS)\/([^ ]*)/ig;
            var match = myRegexp.exec(myString);
            browser.fullVersion = match[2];
            browser.version = parseFloat(browser.fullVersion);
        }
        if (browser.android) {
            var myString = nAgt;
            var myRegexp = /(Android) ([^ ]*)/ig;
            var match = myRegexp.exec(myString);
            browser.fullVersion = match[2];
            browser.version = parseFloat(browser.fullVersion);
        }


        if (window.location.search.indexOf('disable_browsers_scanner=1') != -1)
            return false;
        var div_id_display_error = this.div_id_display_error;
        var error_css = false;
        var browser_get_link;
        var min_browser_version;
        if (browser.msie) {
            min_browser_version = this.msie_min_browser_version;
            if (browser.fullVersion < min_browser_version) {
                browser_get_link = "http://windows.microsoft.com/ru-RU/internet-explorer/downloads/ie";
                error_css = true;
            }
        }
        if (browser.opera) {
            min_browser_version = this.opera_min_browser_version;
            if (browser.isMobile.any)
                min_browser_version = this.m_opera_min_browser_version;
            if (browser.opera_mini)
                min_browser_version = this.opera_mini_min_browser_version;
            if (browser.fullVersion < min_browser_version) {
                browser_get_link = "http://ru.opera.com/browser/";
                error_css = true;
            }
        }

        else if (browser.firefox) {
            min_browser_version = this.firefox_min_browser_version;
            if (browser.isMobile.any)
                min_browser_version = this.m_firefox_min_browser_version;
            if (browser.fullVersion < min_browser_version) {
                browser_get_link = "http://www.mozilla.com/ru/firefox/";
                error_css = true;
            }
        }
        else if (browser.chrome) {

            min_browser_version = this.chrome_min_browser_version;
            if (browser.version < min_browser_version) {
                browser_get_link = "http://www.google.com/chrome/";
                error_css = true;
            }
        }
        else if (browser.safari) {
            min_browser_version = this.webkit_min_browser_version;
            if (browser.fullVersion < min_browser_version) {
                browser_get_link = "http://www.apple.com/ru/safari/";
                error_css = true;
            }
        }
        else if (browser.webkit && !browser.msedge) {
            min_browser_version = this.webkit_min_browser_version;
            if (browser.fullVersion < min_browser_version) {

                browser_get_link = "https://www.google.ru/?q=%D0%B1%D1%80%D0%B0%D1%83%D0%B7%D0%B5%D1%80%D1%8B%20%D0%BD%D0%B0%20webkit";
                error_css = true;
            }
        }
        browser.error_css = false;
        if (error_css) {
            browser.error_css = true;
            if (browser.isMobile.any) {
                if (typeof $ == "undefined" || !$.cookie("alert")) {
                    alert(eval(this.mobile_error_message));
                    var date = new Date();
                    var minutes = 1;
                    date.setTime(date.getTime() + (minutes * 60 * 1000));
                    $.cookie("alert", true, {expires: date});
                }
            }
            else
                document.getElementsByTagName('body')[0].innerHTML = '<div id="' + div_id_display_error + '">' + eval(this.error_message) + '</div>' + document.getElementsByTagName('body')[0].innerHTML;
        }
        $('head').append('<style type="text/css"> .disable-hover,.disable-hover * {pointer-events: none !important;} .disable-user-select{-webkit-touch-callout: none;-webkit-user-select: none;-khtml-user-select: none;-moz-user-select: none;-ms-user-select: none;-o-user-select: none;user-select: none;} .SW_BS_is_retina {display: none; opacity: 0; } @media only screen and (-Webkit-min-device-pixel-ratio: 1.5), only screen and (-moz-min-device-pixel-ratio: 1.5), only screen and (-o-min-device-pixel-ratio: 3 / 2), only screen and (min-device-pixel-ratio: 1.5), only screen and (-webkit-min-device-pixel-ratio: 3) {.SW_BS_is_retina {opacity: 1; }} ' + '</style>');
        var prefixs = ['', '-webkit-', '-moz-', '-o-', '-ms-'];
        browser.isShapeOutsideSupported = (function () {
            if (typeof $ == "undefined")
                return false;
            var css_properties = {};
            for (var i = 0; i < prefixs.length; i++)
                css_properties[prefixs[i] + 'shape-outside'] = 'circle(10px)';
            $("body").append("<div id='test_SW_BS'></div>");
            $("#test_SW_BS").css(css_properties);
            var support = ($("#test_SW_BS").attr('style')) ? true : false;
            $("#test_SW_BS").remove();
            return support;
        })();
        browser.isTranslate3dSupported = (function () {
            if (typeof $ == "undefined")
                return false;
            var css_properties = {};
            for (var i = 0; i < prefixs.length; i++)
                css_properties[prefixs[i] + 'transform'] = 'translate3d(0px,0px,0px)';
            $("body").append("<div id='test_SW_BS'></div>");
            $("#test_SW_BS").css(css_properties);
            var support = ($("#test_SW_BS").attr('style')) ? true : false;
            $("#test_SW_BS").remove();
            return support;
        })();
        browser.isTranslate2dSupported = (function () {
            if (typeof $ == "undefined")
                return false;
            var css_properties = {};
            for (var i = 0; i < prefixs.length; i++)
                css_properties[prefixs[i] + 'transform'] = 'translate(0px,0px)';
            $("body").append("<div id='test_SW_BS'></div>");
            $("#test_SW_BS").css(css_properties);
            var support = ($("#test_SW_BS").attr('style')) ? true : false;
            $("#test_SW_BS").remove();
            return support;
        })();
        browser.isTransitionSupported = (function () {
            if (typeof $ == "undefined")
                return false;
            if (browser.error_css || (browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537))
                return false;
            var css_properties = {};
            for (var i = 0; i < prefixs.length; i++)
                css_properties[prefixs[i] + 'transition'] = 'all linear';
            $("body").append("<div id='test_SW_BS'></div>");
            $("#test_SW_BS").css(css_properties);

            var support = $("#test_SW_BS").attr('style') ? true : false;
            $("#test_SW_BS").remove();
            return support;
        })();

        browser.isCss_vw_vh_Supported = (function () {
            if (typeof $ == "undefined")
                return false;
            if (browser.error_css || (browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537))
                return false;

            $("body").append("<div id='test_SW_BS' style='height: 50vh;'></div>");


            var support = $("#test_SW_BS").height() ? true : false;
            $("#test_SW_BS").remove();
            return support;
        })();

        browser.isFontFaceSupported = (function () {
            if (typeof $ == "undefined")
                return false;
            'use strict';
            var doc = document,
                head = doc.head || doc.getElementsByTagName("head")[0] || doc.documentElement,
                style = doc.createElement("style"),
                rule = "@font-face { font-family: 'webfont'; src: 'https://'; }",
                supportFontFace = false,
                blacklist = (function () {
                    var ua = navigator.userAgent.toLowerCase(),
                        wkvers = ua.match(/applewebkit\/([0-9]+)/gi) && parseFloat(RegExp.$1),
                        webos = ua.match(/w(eb)?osbrowser/gi),
                        wppre8 = ua.indexOf("windows phone") > -1 && navigator.userAgent.match(/IEMobile\/([0-9])+/) && parseFloat(RegExp.$1) >= 9,
                        oldandroid = wkvers < 533 && ua.indexOf("Android 2.1") > -1;
                    return webos || oldandroid || wppre8;
                }()),
                sheet;
            style.type = "text/css";
            head.insertBefore(style, head.firstChild);
            if (typeof style.sheet == "undefined")
                style.sheet = undefined;

            sheet = style.sheet || style.styleSheet;

            if (!!sheet && !blacklist) {
                try {
                    sheet.insertRule(rule, 0);
                    supportFontFace = sheet.cssRules[0].cssText && ( /webfont/i ).test(sheet.cssRules[0].cssText);
                    sheet.deleteRule(sheet.cssRules.length - 1);
                } catch (e) {
                }
            }
            return supportFontFace;
        })();
        browser.isRetinaDisplay = (function () {
            if (typeof $ == "undefined")
                return false;
            if (browser.error_css || (browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537))
                return false;
            $("body").append("<div id='test_SW_BS' class='is_retina'></div>");
            var is_retina = ($('#test_.SW_BS_is_retina').css('opacity') == '1') ? true : false;
            $("#test_SW_BS").remove();
            return is_retina;
        })();
        browser.isImgSrcBase64Support = (function () {
            if (typeof $ == "undefined")
                return false;
            if (browser.error_css || (browser.isMobile.Android && browser.fullVersion < 534) || (browser.isMobile.BlackBerry && browser.fullVersion < 537))
                return false;
            $("body").append("<img id='test_SW_BS'>");
            $("#test_SW_BS").attr("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=");
            var support = ($("#test_SW_BS").width() == 1) ? true : false;
            $("#test_SW_BS").remove();

            return support;
        })();
        browser.isLocalStorageSupported = typeof localStorage != "undefined";
        browser.isSessionStorageSupported = typeof sessionStorage != "undefined";
        if (browser.isSessionStorageSupported) {
            try {
                sessionStorage.setItem('test_SW_BS_sessionStorage', 1);
                sessionStorage.removeItem('test_SW_BS_sessionStorage');
            } catch (e) {
                browser.isLocalStorageSupported = false;
                browser.isSessionStorageSupported = false;
            }
        }

        browser.orientation_mode = {portrait: false, landscape: false};
        if (typeof orientation == "undefined") {
            browser.orientation_mode.landscape = true;
        } else {
            if (orientation == 0 || orientation == 180) {
                browser.orientation_mode.portrait = true;
            }
            else if (orientation == 90 || orientation == -90) {
                browser.orientation_mode.landscape = true;
            }
        }
        this.browser = browser;

        this.isInit = true;
    }
};
