/*
 * Name:    jQuery Smart hover
 * Version: 1.0.2 (22.05.2015)
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: MIT license. http://www.opensource.org/licenses/mit-license.php
 * Copyright (c) 2015 Pavel Novojilov;
 */

(function ($) {
    $.fn.smart_hover = function (hover_callback, unhover_callback) {
        var elements = this;
        var size = elements.length;
        for (var i = 0; i < size; i++) {
            (function () {
                var status = false;
                var element_ = elements.eq(i);
                $(document).mousemove(function (e) {
                    var element_width = element_.outerWidth();
                    var element_height = element_.outerHeight();
                    var posX = e.pageX;
                    var posY = e.pageY;
                    var offset_left = element_.offset().left;
                    var offset_top = element_.offset().top;
                    if (posX >= offset_left && posX <= (offset_left + element_width) && posY >= offset_top && posY <= (offset_top + element_height)) {
                        if (status)
                            return;
                        status = true;
                        if (hover_callback)
                            hover_callback.call(element_, e);
                    }
                    else {
                        if (!status)
                            return;
                        status = false;
                        if (unhover_callback)
                            unhover_callback.call(element_, e);
                    }
                });
            })()
        }
    };
}(jQuery));