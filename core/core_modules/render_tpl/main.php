<?php

class render_tpl
{
    static function main()
    {
        $name = get_settings('name');
        return render_template($name);
    }
}