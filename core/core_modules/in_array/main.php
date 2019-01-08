<?php

class in_array
{
    static function main()
    {
        $is_true = false;
        $is_true = in_array(get_variable(get_settings('needle')), get_variable(get_settings('haystack')));
        $i_tpl = ($is_true ? 't' : 'f') . '_tpl';
        $i_tpl = get_settings($i_tpl, null, true);
        if(empty($i_tpl))
            return "";
        $out = render_template($i_tpl, [], true);
        return $out;
    }
}