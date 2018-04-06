<?php
/**
 * Name:    SHOWYWeb Framework
 * Version: 5.0.1
 * Author:  Novojilov Pavel Andreevich
 * Support: http://SHOWYWEB.ru
 * License: Attribution-ShareAlike 4.0 International (CC BY-SA 4.0) https://creativecommons.org/licenses/by-sa/4.0/
 */
mb_internal_encoding('UTF-8');
error_reporting(E_ALL & ~E_NOTICE & ~E_STRICT & ~E_DEPRECATED);
$start1 = gettimeofday();
header("Content-type: text/html; charset=utf-8");
$root = getcwd() . "/";
spl_autoload_register(function ($class_name) {
    global $root;
    $class_path = $root . "core/core_modules/" . $class_name . "/main.php";
    if(file_exists($class_path)) {
        require_once $class_path;
        return;
    }

    $tmp_n = strlen($class_name) - 4;
    $tmp = substr($class_name, $tmp_n);
    $c_pref = $tmp == "_ext" || $tmp == "_api";
    $type = "";
    if($c_pref) {
        $type = substr($tmp, 1);
        $tmp = substr($class_name, 0, $tmp_n);
        $class_path = $root . "core/core_modules/" . $tmp . "/" . $type . ".php";
        if(file_exists($class_path)) {
            require_once $class_path;
            return;
        }
    }

    $class_path = $root . "modules/" . $class_name . "/main.php";
    if(file_exists($class_path)) {
        require_once $class_path;
        return;
    }


    if($c_pref) {
        $class_path = $root . "modules/" . $tmp . "/" . $type . ".php";
        require_once $class_path;
        return;
    }
});


set_error_handler(function ($errno, $errstr, $errfile, $errline, array $errcontext) {
    // error was suppressed with the @-operator
    if(0 === error_reporting()) {
        return false;
    }

    throw new Exception("$errstr in $errfile on line $errline. Generated Exception", $errno);
});
$cloud_flare_proxy = false;
$global_template_zones = ['head', 'main', 'footer'];
$cms_result = [];
foreach ($global_template_zones as $template_zone) {
    $cms_result[$template_zone] = "";
}
$pattern_i = -1;
$pattern_connectors_i = -1;
$time_exec = false;
$start_template = "";
$ajax_modules = '';
$modules_save_result = array();
$modules_restart_status = false;
$current_pattern_name = null;
$module_settings = array();
$module_all_settings = array();
require_once "globals_functions.php";
import_custom_library("QuickDBM/QuickDBM.php");
require_once 'session_start.php';
require_once "$root/settings.php";


qdbm::set_mysqli_auth($global_settings['mysqli']);


//**************************************************************************

if(is_ajax() or is_background_job()) {
    $start_template = "_empty_";
    if(is_ajax())
        $ajax_modules = get_request('ajax_module');
}
//**************************************************************************
if(is_get('once_reg')) {
    $mysqli_link = qdbm::get_mysqli_link();
    if(!($check_table = mysqli_query($mysqli_link, 'SELECT `id` FROM `users`LIMIT 1')) or !isset($check_table) or !mysqli_fetch_assoc($check_table)) {
        $global_settings["once_reg"] = true;
    } else
        exit("Администратор уже зарегистрирован!");
}
if(!isset($time_exec))
    $time_exec = false;
if($start_template != "") {
    $pattern_name = $start_template;
} else {
    $pattern_name = "_empty_";
}

if($pattern_name !== "_empty_" || is_background_job()) {
    if(!is_dir($root . '.cache'))
        mkdir($root . '.cache', 0777, true);
    if(!is_dir($root . '.cache/page_patterns'))
        mkdir($root . '.cache/page_patterns', 0777, true);

    //ch_p_u cache start
    if(!file_exists($root . '.cache/ch_p_u') or filemtime($root . '.cache/ch_p_u') < filemtime($root . 'ch_p_u.cfg')) {
        $text = open_txt_file('ch_p_u', 'cfg');
        if($text != "") {
            $text = str_replace("  ", "", $text);
            $text_arr = explode("\r\n", $text);
            $core_ch_p_u_tmp = array();
            $core_ch_p_u_tmp['ch_p_u_pattern'] = null;
            $core_ch_p_u_tmp['ch_p_u_replacement'] = null;
            foreach ($text_arr as $value) {
                $tmp_arr = explode(" ", $value);
                $tmp_arr[0] = preg_replace('/$\\#/u', '#', $tmp_arr[0]);
                if(mb_strpos($tmp_arr[0], "#", 0, 'UTF-8') !== 0) {
                    $core_ch_p_u_tmp['ch_p_u_pattern'][] = '/' . $tmp_arr[0] . "/u";
                    $core_ch_p_u_tmp['ch_p_u_replacement'][] = $tmp_arr[1];
                }
                unset ($tmp_arr);
            }
        } else {
            $core_ch_p_u_tmp['ch_p_u_pattern'][] = "//u";
            $core_ch_p_u_tmp['ch_p_u_replacement'][] = "";
        }
        $ch_p_u_text_file = serialize($core_ch_p_u_tmp);

        save_to_text_file($root . '.cache/ch_p_u', $ch_p_u_text_file, null);
        files::remove_dir(".cache/page_patterns", true);
        mkdir($root . '.cache/page_patterns', 0777, true);
    }

    $core_ch_p_u = unserialize(open_txt_file($root . '.cache/ch_p_u', null));
    $ch_p_u_pattern = $core_ch_p_u["ch_p_u_pattern"];
    $ch_p_u_replacement = $core_ch_p_u["ch_p_u_replacement"];

    //ch_p_u cache end


    if(!isset($global_settings['global_css']))
        $global_settings['global_css'] = [];
    if(!isset($global_settings['global_js']))
        $global_settings['global_js'] = [];


    //***************************************************************************************************************AUTO_START
    if(!is_ajax()) {
        $cache_as_filename = $root . '.cache/auto_start';
        if(!file_exists($cache_as_filename) or filemtime($cache_as_filename) < stat($root . 'modules')['mtime'] or filemtime($cache_as_filename) < stat($root . 'core/core_modules')['mtime']) {
            $modules_arr = scandir($root . 'modules');
            $modules_arr_len = count($modules_arr);
            $module_as_arr = array();
            for ($modules_arr_i = 0; $modules_arr_i < $modules_arr_len; $modules_arr_i++) {
                $module_dir = $modules_arr[$modules_arr_i];
                $module_name = $module_dir;
                $module_as_name = $module_name . '_as';
                $module_as_file_name = $root . 'modules/' . $module_dir . '/as.php';
                if(file_exists($module_as_file_name)) {
                    array_push($module_as_arr, array('name' => $module_name, 'as_name' => $module_as_name, 'filename' => $module_as_file_name));
                }
            }

            $modules_arr = scandir($root . 'core/core_modules');
            $modules_arr_len = count($modules_arr);
            for ($modules_arr_i = 0; $modules_arr_i < $modules_arr_len; $modules_arr_i++) {
                $module_dir = $modules_arr[$modules_arr_i];
                $module_name = $module_dir;
                $module_as_name = $module_name . '_as';
                $module_as_file_name = $root . 'core/core_modules/' . $module_dir . '/as.php';
                if(file_exists($module_as_file_name)) {
                    array_push($module_as_arr, array('name' => $module_name, 'as_name' => $module_as_name, 'filename' => $module_as_file_name));
                }
            }
            save_to_text_file($cache_as_filename, serialize($module_as_arr), null);
            unset($modules_arr);
            unset($module_as_arr);
        }

        $module_as_arr = unserialize(open_txt_file($cache_as_filename, null));

        $module_as_arr_len = count($module_as_arr);
        for ($module_as_arr_i = 0; $module_as_arr_i < $module_as_arr_len; $module_as_arr_i++) {
            $module_name = $module_as_arr[$module_as_arr_i]['name'];
            $module_as_name = $module_as_arr[$module_as_arr_i]['as_name'];
            $module_filename = $module_as_arr[$module_as_arr_i]['filename'];
            require_once $module_filename;
            $exec_class = new $module_as_name();
            unset($exec_class);
        }
        unset($module_as_arr);
    }

    if($pattern_name !== "_empty_") {
        $pattern_cache_filename = 'global_template_zones' . "_" . str_replace("/", "_", $pattern_name);
        if(!file_exists($root . '.cache/page_patterns/' . $pattern_cache_filename) or filemtime($root . '.cache/page_patterns/' . $pattern_cache_filename) < filemtime($root . 'modules/' . $pattern_name . '.html')) {
            ini_set('pcre.backtrack_limit', '52428800');//50 mb
            ini_set('pcre.jit', '0');//
            $core_pattern_tmp = [
                'css_urls' => [],
                'js_urls' => []
            ];
            $text = open_txt_file($root . 'modules/' . $pattern_name, 'html');
            if(preg_match_all("/<!-- *#section_start\\((.*?)\\) *-->([\n\r ]*)?([\\s\\S]*?)([\n\r ]*)?<!-- *#section_end *-->/ui", $text, $matches)) {
                files::remove_dir('.cache/page_patterns/', true);
                mkdir($root . '.cache/page_patterns', 0777, true);
                mkdir($root . '.cache/page_patterns/section', 0777, true);
                $len_sub_patterns = count($matches[1]);
                for ($sub_pattern_i = 0; $sub_pattern_i < $len_sub_patterns; $sub_pattern_i++) {
                    $sub_pattern_name = $matches[1][$sub_pattern_i];
                    $sub_pattern_text = $matches[3][$sub_pattern_i];
                    $text = preg_replace("/<!-- *#section_start\\($sub_pattern_name\\) *-->([\n\r ]*)?([\\s\\S]*?)([\n\r ]*)?<!-- *#section_end *-->/ui", "<!-- #include_section($sub_pattern_name) -->", $text);
                    save_to_text_file($root . '.cache/page_patterns/section' . $sub_pattern_name, $sub_pattern_text, 'html');
                }
            }

            if(preg_match_all('/<!-- *?#include_section\((.+?)\) *?-->/ui', $text, $matches)) {
                $reg_exp_tmp_arr = preg_replace('/(\/|\.|\*|\?|\=|\(|\)|\[|\]|\'|")/Uui', '\\\$1', $matches[0]);
                $len_sub_patterns = count($reg_exp_tmp_arr);
                for ($sub_pattern_i = 0; $sub_pattern_i < $len_sub_patterns; $sub_pattern_i++) {
                    $reg_exp_tmp = $reg_exp_tmp_arr[$sub_pattern_i];
                    $text = preg_replace('/' . $reg_exp_tmp . '/ui', open_txt_file($root . '.cache/page_patterns/section/' . $matches[1][$sub_pattern_i], 'html'), $text);
                }
            }


            $text = preg_replace_callback("/^(.|\\r|\\n)*?<\\/head>/ui", function ($matches) use (&$core_pattern_tmp, &$global_settings) {
                $head_text = $matches[0];
                $head_text = preg_replace("/<title>.*<\\/title>\r?\n?.*?</uim", "<", $head_text, 1);
                $regexp = '/([\n\r ]*)?<link.*?rel="stylesheet".*?href=("|\')([^?\r\n\'"]+)("|\').*?>([\n\r ]*)?/uim';
                preg_match_all($regexp, $head_text, $matches);
                $save_css_url_arr = $matches[3];
                $save_url_arr_len = count($save_css_url_arr);
                if($save_url_arr_len != 0) {
                    $head_text = preg_replace($regexp, "$1", $head_text);
                    $core_pattern_tmp['css_urls'] = $save_css_url_arr;
                }

                $regexp = '/([\n\r ]*)?<script.*?src=("|\')([^\r\n\'"]+?)("|\').*?>.*?<\/script>([\n\r ]*)?/ui';
                preg_match_all($regexp, $head_text, $matches);
                $save_js_url_arr = $matches[3];
                $save_url_arr_len = count($save_js_url_arr);
                if($save_url_arr_len != 0) {
                    $head_text = preg_replace($regexp, "", $head_text);
                    $core_pattern_tmp['js_urls'] = $save_js_url_arr;
                }
                $head_text = preg_replace("/<\\/head>$/ui", "", $head_text);
                $core_pattern_tmp['head'] = $head_text;
                return "</head>";
            }, $text);
            if(is_null($text)) {
                throw new Exception(preg_errtxt(preg_last_error()));
            }
            $text = preg_replace_callback("/<\\/body>(.|\\r|\\n)*$/ui", function ($matches) use (&$core_pattern_tmp) {
                $core_pattern_tmp['footer'] = $matches[0];
                return "";
            }, $text);
            if(is_null($text)) {
                throw new Exception(preg_errtxt(preg_last_error()));
            }
            $core_pattern_tmp['main'] = $text;
            $pattern_text_file = serialize($core_pattern_tmp);
            save_to_text_file($root . '.cache/page_patterns/' . $pattern_cache_filename, $pattern_text_file, null);
            unset($pattern_text_file, $core_pattern_tmp);
        }
        $core_pattern = unserialize(open_txt_file($root . '.cache/page_patterns/' . $pattern_cache_filename, null));
        $global_settings['global_css'] = array_merge($global_settings['global_css'], $core_pattern['css_urls']);
        $global_settings['global_js'] = array_merge($global_settings['global_js'], $core_pattern['js_urls']);
        $cms_result['head'] = $core_pattern['head'];
        $cms_result['footer'] = $core_pattern['footer'];
        $cms_result['main'] = render_template($pattern_name);
    }
} elseif($ajax_modules !== '') {
    $core_ch_p_u = unserialize(open_txt_file($root . '.cache/ch_p_u', null));
    $ch_p_u_pattern = $core_ch_p_u["ch_p_u_pattern"];
    $ch_p_u_replacement = $core_ch_p_u["ch_p_u_replacement"];
    $am_arr = explode(',', preg_replace('/ /ui', '', $ajax_modules));
    foreach ($am_arr as $module_name)
        echo $module_name::main();
}


//***************************************************************************************************************
echo $cms_result['head'] . "\n";
echo $cms_result['main'];
echo "\n" . $cms_result['footer'];

$end1 = gettimeofday();
if($time_exec) {
    $totaltime1 = (float)($end1['sec'] - $start1['sec']) + ((float)($end1['usec'] - $start1['usec']) / 1000000);
    echo "<script type=\"text/javascript\">alert(\"Время выполнения: " . round($totaltime1, 2) . " сек.\");</script>";
}
if(is_ajax())
    echo "<->ajax_complete<->";

if(is_background_job())
    session_destroy();