<?php

class append_head
{
    static function main()
    {
        $tpl = get_settings('tpl');
        $out = render_template($tpl);
        head_manager::append_head($out);
    }
}