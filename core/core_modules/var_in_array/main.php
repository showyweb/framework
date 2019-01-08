<?php

/**
 * #mod(var_in_array[var='array.key.sub_key', as='var_name'])
 */
class var_in_array
{
    static function main()
    {
        $var_name = get_settings('var');
        $var_name = explode('.', $var_name);
        $as = get_settings('as');
        $var = get_variable($var_name[0]);
        if(isset($var_name[1])) {
            $len = count($var_name);
            for ($i = 1; $i < $len; $i++) {
                $var_key = $var_name[$i];
                if(isset($var[$var_key]))
                    $var = $var[$var_key];
                else {
                    $var = null;
                    break;
                }
            }
        }
        set_variables([$as => $var]);
        return '';
    }
}