<?php

class for_each
{
    static function main()
    {
        $rows_name = get_settings('rows');
        $rows = get_variable($rows_name);
        $delimiter = get_settings('delimiter');
        $tpl = get_settings('tpl', null, true);
        $row_key_prefix = get_settings('row_key_prefix');
        if(empty($rows))
            return "";
        if(!is_array($rows)) {
            if(empty($delimiter))
                $delimiter = ",";
            $rows = explode($delimiter, $rows);
        }
        $out = "";
        $i = 0;
        foreach ($rows as $key => $row) {
            if(!is_null($row_key_prefix)) {
                $m_row = [];
                foreach ($row as $key2 => $value)
                    $m_row[$row_key_prefix . $key2] = $value;
                $row = $m_row;
            } else
                $row_key_prefix = "";
            $row[$row_key_prefix . '_index'] = $i;
            $row[$row_key_prefix . '_key'] = $key;
            $out .= render_template($tpl, $row, true);
            $i++;
        }
        return $out;
    }
}