<?php

class key_exists
{
    static function main()
    {
        $is_true = false;
        $is_true = key_exists(get_variable(get_settings('key')), get_variable(get_settings('array')));
        $i_tpl = ($is_true ? 't' : 'f') . '_tpl';
        $i_tpl = get_settings($i_tpl, null, true);
        if(empty($i_tpl))
            return "";
        $out = render_template($i_tpl, [], true);
        return $out;
    }
}