<?php

class render_tpl
{
    static function main()
    {
        $name = get_settings('name');
        $out = render_template($name, [], true);
        $out_var_name = get_settings('out_var_name');
        if(!empty($out_var_name)) {
            set_variables([
                $out_var_name => $out
            ]);
            return "";
        }
        return $out;
    }
}