<?php


class head_manager_as
{
    function __construct()
    {
        global $global_settings;
        $global_settings['global_js'][]= "/core/core_modules/head_manager/system.js";
    }
}