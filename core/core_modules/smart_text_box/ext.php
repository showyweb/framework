<?php

class smart_text_box_ext extends smart_text_box_api
{
    function show_text_box($name)
    {
        $is_admin = is_admin();
        $name = xss_filter($name);
        $data = $this->get_box($name);
        if(compress_code(str_replace('<br>', '', $data)) == "")
            $data = "Новый текст";
        $edit = get_settings( 'edit');
        $edit = is_null($edit) ? $is_admin : $edit;
        $edit = to_boolean($edit);

        $save_button = get_settings( 'save_button');
        $save_button = is_null($save_button) ? "true" : $save_button;
        $save_button = to_boolean($save_button);

        $multiline = get_settings( 'multiline');
        $multiline = is_null($multiline) ? "true" : $multiline;
        $multiline = to_boolean($multiline);

        $editor = get_settings( 'editor');
        $editor = is_null($editor) ? 'standard' : $editor;
        append($this->prepare_box_html($data, $name, $editor, $multiline, $edit, $save_button));
    }


    function update_text_box($name, $data)
    {
        $this->update_box($name, $data);
    }


}