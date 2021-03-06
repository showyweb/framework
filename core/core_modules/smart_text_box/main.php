<?php

class smart_text_box {
   static function main()
    {
        $settings = get_settings();
        $box_exec = new smart_text_box_ext();
        if(is_ajax()) {
            $f_name = get_request('smart_text_box');
            switch ($f_name){
                case 'update_box':
                    $box_exec->update_box(get_request('name'), get_request('data',false));
                    break;
                case 'add_cc_img_in_box':
                    return $box_exec->add_cc_img_in_box(get_request('name'),'uploaded-img');
                    break;
            }
            return "";
        }
       return $box_exec->show_text_box($settings['name']);
    }
}