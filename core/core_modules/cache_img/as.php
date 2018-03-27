<?php


class cache_img_as
{
    function __construct()
    {
        if(is_background_job()) {
            import_custom_library("FastBackground/fast_background.php");
            $fb = new fast_background(cache_img::$path_cache_);
            $fb->clear_cache();
        }
    }
}