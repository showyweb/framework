<?php

class smart_text_box_db_c extends qdbm_schema
{
    public $tab_name = 'smart_text_box';
    const name = array('type' => qdbm_type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const data = array('type' => qdbm_type_column::string, 'is_xss_filter' => false, 'is_add_index' => false);
    const images_info = array('type' => qdbm_type_column::string, 'is_xss_filter' => false, 'is_add_index' => false);
    const is_public = array('type' => qdbm_type_column::bool, 'is_xss_filter' => true, 'is_add_index' => true);
}

class smart_text_box_api
{
    private static $is_js_css_imported = false;
    private static $is_css_for_iframe_imported = false;

    private $db = null;
    public $db_c = null;

    public function __construct()
    {
        $this->db_c = new smart_text_box_db_c();
        $this->db = new qdbm($this->db_c);
        return $this;
    }

    function import_js_css_extend_editor()
    {
        if(static::$is_js_css_imported)
            return;
        static::$is_js_css_imported = true;
        $d_mode = get_settings('extend_editor_debug_mode');
        if(is_null($d_mode)) $d_mode = false;
        head_manager::import_css('showyweb_text_editor/showyweb_text_editor.css');
        head_manager::import_js('/js/JavaScript-Load-Image-master/js/load-image.all.min.js');
        head_manager::import_js('showyweb_text_editor/showyweb_text_editor.' . ($d_mode ? 'np' : 'min') . '.js');
    }

    function import_css_extend_editor_for_iframe()
    {
        if(static::$is_css_for_iframe_imported)
            return;
        static::$is_css_for_iframe_imported = true;
        head_manager::import_css('showyweb_text_editor/showyweb_text_editor.css');
    }

    function add_cc_img_in_box($name, $input_name, $admin = false)
    {
        if(is_null($name)) {
            error("name == null");
        }
        if(!authorization_api::is_admin() && !$admin)
            error_alert_not_log('Недостаточно прав');
        $db = $this->db;
        $id = $db->get_nii();
        $result = null;
        if($id !== 1)
            $result = $db->get_rows(null, (new qdbm_where())->equally('name', $name));
        if(is_null($result))
            error("name $name not found");
        $id = $result[0]['id'];
        $images_info = $result[0]['images_info'];
        if(empty($images_info))
            $images_info = array();
        else
            $images_info = unserialize($images_info);
        $filename = null;
        if(is_get($input_name) && is_string($_REQUEST[$input_name])) {
            $find_str_base64 = "data:image/ext;base64,";
            $len_find_str_base64 = strlen($find_str_base64);
            $file = get_request($input_name, false);
            $type = substr($file, 0, $len_find_str_base64);
            $type = substr($type, strlen('data:image/'), strlen('ext'));
            if($type == "jpe")
                $type = "jpg";
            $file_ = substr($file, $len_find_str_base64);
            unset($file);
            $filename = u_rand_key_generate() . "." . $type;
            $file_decoded = base64_decode($file_, true);
            unset($file_);
            if($file_decoded === false) {
                unlink($filename);
                error('base64_decode return false');
            }
            save_to_text_file(files::get_cur_module_upload_path() . $filename, $file_decoded, null);
            unset($file_decoded);
        } else
            $filename = files::save_file_uploaded($input_name, null, true, false, true);
        img::compressing_img(null, files::get_web_url($filename), null, null, JPEG_QUALITY::HIGHEST);
        $sub_dir = substr($filename, 0, 1);
        $sub_dir2 = substr($filename, 0, 2);
        if(!files::exist(null, $sub_dir))
            files::create_dir($sub_dir);
        $sub_dir = "$sub_dir/$sub_dir2";
        if(!files::exist(null, $sub_dir))
            files::create_dir($sub_dir);
        files::move_file($filename, null, $sub_dir);
        array_push($images_info, $filename);
        $images_info = serialize($images_info);
        $db->insert(['images_info' => $images_info], $id);
        $db->unlock_tables();
        return files::get_web_url($filename, $sub_dir);
    }

    function restore_cc_img_in_box($name, $full_img_path, $admin = false)
    {
        if(is_null($name))
            error("name == null");
        if(!authorization_api::is_admin() and !$admin)
            error_alert_not_log('Недостаточно прав');
        ini_set('pcre.backtrack_limit', '52428800');//50 mb
        $db = $this->db;
        $db->smart_write_lock();
        $result = $db->get_rows(null, (new qdbm_where())->equally('name', $name));
        if(is_null($result))
            error("name_not_found");

        $id = $result[0]['id'];
        $data = $result[0]['data'];
        $images_info = $result[0]['images_info'];
        if(empty($images_info))
            $images_info = array();
        else
            $images_info = unserialize($images_info);

        $f_name = basename($full_img_path);
        $n_f_name = preg_replace("/ /ui", "", xss_filter(basename($full_img_path)));
        if($n_f_name !== $f_name || !file_exists($full_img_path))
            error("xss");
        if(empty($f_name))
            $f_name = u_rand_key_generate();
        if(in_array($f_name, $images_info))
            return false;

        $sub_dir = substr($f_name, 0, 1);
        $sub_dir2 = substr($f_name, 0, 2);
        $sub_dir2 = "$sub_dir/$sub_dir2";
        $web_url = files::get_web_url($f_name, $sub_dir2, false);
        if(utf8_strpos($data, $web_url) === false)
            error("not found in data");

        $is_replace_wu = false;
        if(files::exist($f_name, $sub_dir2)) {
            $type = img::get_img_type($web_url);
            $text_type = "";
            switch ($type) {
                case IMAGETYPE_JPEG:
                    $text_type = '.jpg';
                    break;
                case IMAGETYPE_PNG:
                    $text_type = '.png';
                    break;
            }
            $f_name = u_rand_key_generate() . $text_type;
            $sub_dir = substr($f_name, 0, 1);
            $sub_dir2 = substr($f_name, 0, 2);
            $sub_dir2 = "$sub_dir/$sub_dir2";
            $is_replace_wu = true;
        }
        if(!files::exist(null, $sub_dir))
            files::create_dir($sub_dir);
        if(!files::exist(null, $sub_dir2))
            files::create_dir($sub_dir2);
        $upl_dir = files::get_cur_module_upload_path($sub_dir2);
        rename($full_img_path, $upl_dir . $f_name);
        if($is_replace_wu) {
            $p_p = "/" . preg_replace("/\//u", "\/", $web_url) . "/u";
            $data = preg_replace($p_p, files::get_web_url($f_name, $sub_dir2), $data);
        }
        $images_info[] = $f_name;
        sort($images_info);
        $images_info = serialize($images_info);
        $rec = [
            'data' => $data,
            'images_info' => $images_info
        ];
        $db->insert($rec, $id);
        $db->unlock_tables();
        return true;
    }

    function update_box($name, $data, $is_public = true, $admin = false)
    {
        if(is_null($name))
            error("name == null");
        if(!authorization_api::is_admin() and !$admin)
            error_alert_not_log('Недостаточно прав');
        $images_info = '';
        $db = $this->db;
        $id = $db->get_nii();
        $result = null;
        if($id != 1)
            $result = $db->get_rows(null, (new qdbm_where())->equally('name', $name));
        if(!is_null($result)) {
            $id = $result[0]['id'];
            $images_info = $result[0]['images_info'];
            if($images_info == '')
                $images_info = array();
            else
                $images_info = unserialize($images_info);
            foreach ($images_info as $key => $filename) {
                $sub_dir = substr($filename, 0, 1);
                $sub_dir2 = substr($filename, 0, 2);
                $sub_dir2 = "$sub_dir/$sub_dir2";
                if(!files::exist($filename, $sub_dir2)) {
                    unset($images_info[$key]);
                } else {
                    $web_url = files::get_web_url($filename, $sub_dir2);
                    if(utf8_strpos($data, $web_url) === false) {
                        files::remove_file($filename, $sub_dir2);
                        if(files::is_dir_empty($sub_dir2)) {
                            files::remove_dir($sub_dir2);
                            if(files::is_dir_empty($sub_dir))
                                files::remove_dir($sub_dir);
                        }
                        unset($images_info[$key]);
                    }
                }
            }
            sort($images_info);
            $images_info = serialize($images_info);
        }
        //        $data = preg_replace("/(\r\n)|\n/u", "<br>", $data);
        $rec = [
            'name' => $name,
            'data' => $data,
            'images_info' => $images_info,
            'is_public' => $is_public
        ];
        $db->insert($rec, $id);
        $db->unlock_tables();
        return true;
    }

    function get_box($name, $only_public = true, $all_columns = false)
    {
        if(is_null($name)) {
            return null;
        }
        $db = $this->db;
        $new_id = $db->get_nii();
        if($new_id == 1)
            $this->update_box($name, 'Новый текст', true, true);
        $name = xss_filter($name);
        $where = (new qdbm_where())->equally('name', $name);
        if($only_public)
            $where->equally('is_public', true);
        $result = $db->get_rows(null, $where);
        if($result == null) {
            $str = "Новый текст";
            $this->update_box($name, $str, true, true);
            return $str;
        }
        if($all_columns)
            return $result[0];
        return $result[0]['data'];
    }

    function get_all_boxes($offset = null, $limit = null, $only_public = true)
    {
        $where = new qdbm_where();
        if($only_public)
            $where->equally('is_public', true);
        $db = $this->db;
        return $db->get_rows([
            'where' => $where,
            'offset' => $offset,
            'limit' => $limit
        ]);
    }

    function remove_box($name, $admin = false)
    {
        if(!authorization_api::is_admin() && !$admin)
            error_alert_not_log('Недостаточно прав');
        $db = $this->db;
        $result = $db->get_rows(null, (new qdbm_where())->equally('name', $name));
        if(is_null($result))
            error('smart_text_box ' . $name . ' not found');

        $images_info = $result[0]['images_info'];
        if($images_info == '')
            $images_info = array();
        else
            $images_info = unserialize($images_info);

        foreach ($images_info as $filename) {
            $sub_dir = substr($filename, 0, 1);
            $sub_dir2 = substr($filename, 0, 2);
            $sub_dir2 = "$sub_dir/$sub_dir2";
            files::remove_file($filename, $sub_dir2);
            if(files::is_dir_empty($sub_dir2)) {
                files::remove_dir($sub_dir2);
                if(files::is_dir_empty($sub_dir))
                    files::remove_dir($sub_dir);
            }
        }

        $db->remove_rows((new qdbm_where())->equally('name', $name));
        return true;
    }

    function prepare_box_html($data_html, $smart_text_box_name, $editor = "standard", $multiline = true, $edit = false, $save_button = true, $scroll_cont = null)
    {
        if(is_null($editor)) $editor = "standard";
        $res_html = "";
        $data = $data_html;
        $name = $smart_text_box_name;
        $multiline = $multiline ? "true" : "false";
        $save_button = $save_button ? "true" : "false";
        if(compress_code(str_replace('<br>', '', $data)) == "")
            $data = "Новый текст";

        if($editor == "extend") {
            if($edit) {
                $this->import_js_css_extend_editor();
            }
            $res_html .= "
            <div class=\"SW_TE_text_cont\" data-smart_text_box_name='$name' " . ($edit ? ' data-multiline="' . $multiline . '" data-editor="' . $editor . '" data-save_button="' . $save_button . '"' : '') . " " . (is_null($scroll_cont) ? '' : "data-scroll_cont='$scroll_cont'") . ">$data</div>";
        } else {
            $res_html .= '
        <span class="smart_text_box" data-smart_text_box_name="' . $name . '"><span ' . ($edit ? 'data-contenteditable="true" data-multiline="' . $multiline . '" data-editor="' . $editor . '" data-save_button="' . $save_button . '"' : '') . '>' . $data . '</span></span>';
        }
        return $res_html;
    }

    function get_box_html($name, $editor = "standard", $multiline = true, $edit = false, $save_button = true, $scroll_cont = null, $only_public = true)
    {
        $name = xss_filter($name);
        $data = $this->get_box($name, $only_public);
        if(compress_code(str_replace('<br>', '', $data)) == "")
            $data = "Новый текст";

        return $this->prepare_box_html($data, $name, $editor, $multiline, $edit, $save_button, $scroll_cont);
    }

    function get_img_path($filename)
    {
        $up = files::get_cur_module_upload_path();
        $sub_dir = substr($filename, 0, 1);
        $sub_dir2 = substr($filename, 0, 2);
        $sub_dir2 = "$sub_dir/$sub_dir2";
        if(!files::exist($filename, $sub_dir2))
            return null;
        return $up . $sub_dir2 . "/" . $filename;
    }
}