<?php

class head_manager
{
    private static $path_cache_ = ".cache/head_manager";
    private static $result = [
        'css' => '',
        'js' => '',
        'main' => ['', ''],
        'add_html' => ''
    ];

    function __construct()
    {
        global $global_settings, $root, $cms_result;

        if(is_ajax())
            return;
        $path_cache = $root . static::$path_cache_;
        if(!is_dir($path_cache))
            mkdir($path_cache);

        $root_href = get_protocol() . $_SERVER['SERVER_NAME'];
        $title = "";
        $main_title = get_settings("main_title", "global");
        if(is_null($main_title))
            $main_title = "";
        $canonical_href = $root_href . "/";

        if(isset(static::$result['main'])) {
            $title = static::$result['main'][0];
            $canonical_href = $root_href . ((substr(static::$result['main'][1], 0, 1) == "/") ? "" : "/") . static::$result['main'][1];
        }
        $title .= (empty($title) ? "" : " - ") . $main_title;
        $cms_result['head'] .= "
<title>$title</title>
<link rel=\"canonical\" href=\"$canonical_href\" >";
        $s_result = array('css' => "", 'js' => "");
        if(isset($global_settings['global_css']))
            foreach ($global_settings['global_css'] as $val)
                static::import($val, "css", $s_result);
        if(isset($global_settings['global_js']))
            foreach ($global_settings['global_js'] as $val)
                static::import($val, "js", $s_result);
        $settings = get_settings();
        if(isset($settings['page_css']))
            foreach ($settings['page_css'] as $val)
                static::import($val, "css", $s_result);
        if(isset($settings['page_js']))
            foreach ($settings['page_js'] as $val)
                static::import($val, "js", $s_result);
        $cms_result['head'] .= $s_result['css'] . static::$result['css'] . $s_result['js'] . static::$result['js'];
        $cms_result['head'] .= static::$result['add_html'];
    }

    private static function import($url, $type = "js", &$c_result = null)
    {
        global $root, $start_template;
        $s_url = $url;
        $path_cache = $root . static::$path_cache_;
        $is_minify = get_settings('css_js_minify', 'global');
        if(!is_dir($path_cache))
            mkdir($path_cache);

        $result = null;
        if(is_null($c_result))
            $result = &static::$result;
        else
            $result =& $c_result;
        if(!isset($result['css']))
            $result['css'] = "";
        if(!isset($result['js']))
            $result['js'] = "";
        $t_r = getcwd();
        if(!preg_match("/^(http\\:\\/\\/|https\\:\\/\\/|\\/)/ui", $url) && !file_exists($t_r . $url)) {
            $class_name = get_current_module_name();
            $t_url = "/core/core_modules/" . $class_name . "/" . $s_url;
            if(file_exists($t_r . $t_url))
                $url = $t_url;
            else {
                $url = "/modules/" . $class_name . "/" . $s_url;
                if(!file_exists($t_r . $url))
                    $url = "/modules/" . explode("/", $start_template, 2)[0] . "/" . $s_url;
                if(!file_exists($t_r . $url))
                    $url = "/js/" . $s_url;
            }
        }
        if(file_exists($t_r . $url)) {
            $url_cache_file_name = $path_cache . "/" . str_replace("/", "_", $url);
            $web_url_cache_file_name = "/" . static::$path_cache_ . "/" . str_replace("/", "_", $url);
            $x_q = "";
            if($is_minify) {
                $filetime_url = filemtime(getcwd() . $url);
                if(!file_exists($url_cache_file_name . '.txt') or filemtime($url_cache_file_name . '.txt') < $filetime_url or !file_exists($url_cache_file_name) or filemtime($url_cache_file_name) < $filetime_url) {
                    $x_q = "?dynamic=" . generate();
                    save_to_text_file($url_cache_file_name, $x_q);
                    import_custom_library("minify-master/src/Minify.php");
                    import_custom_library("minify-master/src/CSS.php");
                    import_custom_library("minify-master/src/JS.php");
                    import_custom_library("minify-master/src/Exception.php");
                    import_custom_library("path-converter-master/src/Converter.php");
                    $minifier = null;
                    switch ($type) {
                        case "js":
                            $minifier = new MatthiasMullie\Minify\JS();
                            break;
                        case "css":
                            $minifier = new MatthiasMullie\Minify\CSS();
                            break;
                    }
                    if(strpos($url, '.min.') === false) {
                        $minifier->add(getcwd() . $url);
                        $minifier->minify($url_cache_file_name);
                    } else
                        copy(getcwd() . $url, $url_cache_file_name);
                } else
                    $x_q = open_txt_file($url_cache_file_name);
            }
            $url = ($is_minify ? $web_url_cache_file_name : $url) . $x_q;
        }
        switch ($type) {
            case "js":
                $result[$type] .= "\n" . '<script type="text/javascript" src="' . $url . '"></script>';
                break;
            case "css":
                $result[$type] .= "\n" . '<link rel="stylesheet" type="text/css" href="' . $url . '">';
                break;
        }
    }

    static function import_js($url)
    {
        static::import($url);
    }

    static function import_css($url)
    {
        static::import($url, "css");
    }

    static function append_head($html)
    {
        if(isset(static::$result['add_html']))
            static::$result['add_html'] = [];
        static::$result['add_html'][] = '
' . $html;
    }

    static function add_meta_noindex()
    {
        static::append_head('<meta name="robots" content="noindex,nofollow">');
    }

    static function set_main($title, $canonical_href)
    {
        static::$result['main'] = [$title, $canonical_href];
    }
}