<?php

class set_var
{
    static function main()
    {
        $variables = get_settings();
        set_variables($variables);
    }
}