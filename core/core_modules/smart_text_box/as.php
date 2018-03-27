<?php

class smart_text_box_as
{
    function __construct()
    {
        if(is_mobile_device()) {
            head_manager::import_css('smart_text_box_mobile.css');
            head_manager::import_css('sw_te_min_style_mobile.css');
        } else {
            head_manager::import_css('smart_text_box.css');
            head_manager::import_css('sw_te_min_style.css');
        }

        head_manager::import_js('smart_text_box.js');
        head_manager::import_js('sw_te_min_script.js');
    }

}