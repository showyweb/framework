<?php

class if_var
{
    static function main()
    {
        $var_name = get_settings('var');
        $eq_var_name = get_settings('eq_var');
        $is_true = false;
        $var = get_variable($var_name);
        $eq_var = get_variable($eq_var_name);
        if(is_null($eq_var))
            $is_true = !is_array($var) ? to_boolean($var) : !!$var;
        else
            $is_true = $var == $eq_var;
        $i_tpl = ($is_true ? 't' : 'f') . '_tpl';
        $i_tpl = get_settings($i_tpl, null, true);
        if(empty($i_tpl))
            return "";
        $out = render_template($i_tpl, [], true);
        return $out;
    }
}