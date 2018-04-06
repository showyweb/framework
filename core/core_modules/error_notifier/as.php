<?php

class error_notifier_as
{
    function __construct()
    {
        if(!is_background_job() || !get_settings('is_enable'))
            return;
        echo (new error_notifier_api())->check();
    }
}