<?php

class cache_img
{
    static $path_cache_ = ".cache/cache_img";

    static function main()
    {
        global $root;
        $debug_mode = get_settings("debug_mode");
        //        if($debug_mode)
        //            import_custom_library("_FastBackground/fast_background.php");
        //        else
        import_custom_library("FastBackground/fast_background.php");
        $fb = new fast_background("/" . static::$path_cache_);


        $min_cp = $debug_mode ? ".iife" : ".min";
        $min_p = $debug_mode ? "" : ".min";
        head_manager::import_js("/js/cssobj/dist/cssobj$min_cp.js");
        //        if(($debug_mode))
        //            head_manager::import_js("/custom_libraries/_FastBackground/fast_background$min_p.js");
        //        else
        head_manager::import_js("/custom_libraries/FastBackground/fast_background$min_p.js");
        head_manager::import_js("loader.js");

        $path_cache = $root . static::$path_cache_;
        if(!is_dir($path_cache))
            mkdir($path_cache);

        if(!is_get('dynamic_url'))
            $fb->request_proc();
        else {
            $size = get_request('size');
            $url = $fb->get_url(get_request('dynamic_url'), true, $size, $size);
            redirect("", $url);
        }
        return "";
    }
}