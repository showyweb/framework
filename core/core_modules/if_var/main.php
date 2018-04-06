<?php

class if_var
{
    static function main()
    {
        global $cur_variables;
        $var_name = get_settings('var');
        $true_inline_tpl = get_settings('ti_tpl');
        $false_inline_tpl = get_settings('fi_tpl');
        $i_tpl = (isset($cur_variables[$var_name]) && to_boolean($cur_variables[$var_name])) ? $true_inline_tpl : $false_inline_tpl;
        if(empty($i_tpl))
            return "";
        $out = render_inline_template($i_tpl);
        return $out;
    }
}