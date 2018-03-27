<?php

class error_notifier_as
{
    function __construct(){
        if(!is_background_job())
            return;
        (new error_notifier_api())->check();
    }
}