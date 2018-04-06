<?php
$is_root_template = !is_ajax();
$g_pattern_i = 0;
$cur_variables = [];
function set_variables(array $variables = [])
{
    global $cur_variables;
    $cur_variables = array_merge($cur_variables, $variables);
}

function get_variable($key)
{
    global $cur_variables;
    return isset($cur_variables[$key]) ? $cur_variables[$key] : null;
}

function render_template($pattern_name, array $set_variables = [])
{
    return _render_template($pattern_name, $set_variables);
}

function render_inline_template($content, array $set_variables = [])
{
    return _render_template($content, $set_variables, true);
}

function _render_template($pattern_name_or_content, array $set_variables = [], $is_inline = false)
{
    global $root, $module_settings, $module_all_settings, $core_pattern, $is_root_template, $g_pattern_i, $cur_variables;
    set_variables($set_variables);
    $out = "";
    $save_g_pattern_i = $g_pattern_i;
    $pattern_cache_name = !$is_inline ? str_replace("/", "_", $pattern_name_or_content) : "inline_" . crc32($pattern_name_or_content);
    if(!file_exists($root . '.cache/page_patterns/' . $pattern_cache_name) or (!$is_inline && filemtime($root . '.cache/page_patterns/' . $pattern_cache_name) < filemtime($root . 'modules/' . $pattern_name_or_content . '.html'))) {
        ini_set('pcre.backtrack_limit', '52428800');//50 mb
        $core_pattern_tmp = array();
        $text = $is_root_template ? $core_pattern['main'] : (!$is_inline ? open_txt_file($root . 'modules/' . $pattern_name_or_content, 'html') : $pattern_name_or_content);
        if($is_root_template)
            $text .= "#include_modules(authorization,cache_img,head_manager)";
        $matches = preg_split('/(#include_modules\\(([\\s\\S]+?)\\)|{{(.+?)}})/uim', $text, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
        $pattern = array();
        $core_pattern_tmp['pattern'] = null;
        $core_pattern_tmp['pattern_connectors'] = null;
        $core_pattern_tmp['p_connector_types'] = null;
        $core_pattern_tmp['pattern_settings'] = null;
        for ($i = 0; isset($matches[$i]); $i += 3) {
            $pattern[] = $matches[$i];
            if(!isset($matches[$i + 2]))
                break;
            $is_module = utf8_strpos($matches[$i + 1], "#include_modules") !== false;
            $tmp_mod_text = $matches[$i + 2];
            $tmp_mod_settings = null;
            if($is_module) {
                preg_match_all('/(([^,]+)(\\[([^[\\]]+)\\]))|([^,]+)/u', $tmp_mod_text, $settings_matches);
                if(isset($settings_matches[4][0])) {
                    $tmp_mod_settings = array();
                    for ($i3 = 0; $i3 < count($settings_matches[4]); $i3++) {
                        $tmp = $settings_matches[4][$i3];
                        preg_match_all('/([^,]+?)=({[\\s\\S]+?}|(\'[\\s\\S]+?(?<!\\\)\')|("[\\s\\S]+?(?<!\\\)")|\\d*)/u', $tmp, $settings_matches2);
                        for ($i2 = 0; $i2 < count($settings_matches2[2]); $i2++) {
                            $var_key = preg_replace("/[ \\r\\n]/u", "", $settings_matches2[1][$i2]);
                            preg_match("/^{[\\s\\S]+}$/u", $settings_matches2[2][$i2], $res);
                            if(count($res) == 1) {
                                preg_match_all("/[{,](('[\\s\\S]+?(?<!\\\\)')|(\"[\\s\\S]+?(?<!\\\\)\")|\\d*)/u", $settings_matches2[2][$i2], $res);
                                foreach ($res[1] as $val)
                                    $tmp_mod_settings[$i3][$var_key][] = preg_replace(array('/^(\'|")([\\s\\S]*)(\'|")$/u', '/\\\\\'/u', '/\\\"/u'), array('$2', '\'', '"'), $val);
                            } else
                                $tmp_mod_settings[$i3][$var_key] = preg_replace(array('/^(\'|")([\\s\\S]*)(\'|")$/u', '/\\\\\'/u', '/\\\"/u'), array('$2', '\'', '"'), $settings_matches2[2][$i2]);
                        }
                        if(count($settings_matches2[2]) == 0)
                            $tmp_mod_settings[$i3] = null;
                    }
                }
            }

            $core_pattern_tmp['pattern_settings'][] = $tmp_mod_settings;
            $tmp_mod_text = preg_replace('/\[[^[\]]+\]/ui', '', $tmp_mod_text);
            $tmp_mod_arr = explode(",", $tmp_mod_text);
            $core_pattern_tmp['p_connector_types'][] = $is_module ? "module" : "variable";
            $core_pattern_tmp['pattern_connectors'][] = $tmp_mod_arr;
        }
        unset($matches, $settings_matches, $settings_matches2);
        for ($i = 0; isset($pattern[$i]); $i++)
            $core_pattern_tmp['pattern'][] = html_href_encode($pattern[$i]);

        unset($pattern);
        $pattern_text_file = serialize($core_pattern_tmp);

        save_to_text_file($root . '.cache/page_patterns/' . $pattern_cache_name, $pattern_text_file, null);
        unset($pattern_text_file, $core_pattern_tmp);
    }
    $is_root_template = false;
    $pattern = unserialize(open_txt_file($root . '.cache/page_patterns/' . $pattern_cache_name, null));
    $pattern_c = $pattern['pattern'];
    $pattern_connectors = $pattern['pattern_connectors'];
    $pattern_settings = $pattern['pattern_settings'];
    $p_connector_types = $pattern['p_connector_types'];
    $pattern_connectors[] = false;
    $pattern_i = 0;
    while (isset($pattern_connectors[$pattern_i])) {
        $pattern_connectors_i = 0;
        while (isset($pattern_connectors[$pattern_i][$pattern_connectors_i])) {
            if(isset($current_settings))
                unset($current_settings);
            $connector_name = $pattern_connectors[$pattern_i][$pattern_connectors_i];
            $current_settings = array();
            if(isset($module_settings[$connector_name]))
                $current_settings = $module_settings[$connector_name];
            if(isset($pattern_settings) and isset($pattern_settings[$pattern_i][$pattern_connectors_i]))
                $current_settings = array_merge($current_settings, (array)$pattern_settings[$pattern_i][$pattern_connectors_i]);
            $module_all_settings[$pattern_i][$connector_name] = $current_settings;
            $pattern_connectors_i++;
        }
        $pattern_i++;
    }

    $pattern_i = 0;
    while (isset($pattern_connectors[$pattern_i])) {
        if(isset($pattern_c[$pattern_i]))
            $out .= $pattern_c[$pattern_i];
        if(isset($p_connector_types[$pattern_i])) {
            $p_connector_type = $p_connector_types[$pattern_i];
            $pattern_connectors_len = count($pattern_connectors[$pattern_i]);
            for ($pattern_connectors_i = 0; $pattern_connectors_i < $pattern_connectors_len; $pattern_connectors_i++) {
                $connector_name = $pattern_connectors[$pattern_i][$pattern_connectors_i];
                switch ($p_connector_type) {
                    case "module":
                        $g_pattern_i = $pattern_i;
                        $out .= $connector_name::main();
                        unset($exec_class);
                        break;
                    case "variable":
                        $out .= isset($cur_variables[$connector_name]) ? $cur_variables[$connector_name] : "";
                        break;
                }
            }
        }
        $pattern_i++;
    }
    $g_pattern_i = $save_g_pattern_i;
    return $out;
}


function is_os_windows()
{
    return strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
}

function html_to_text($data_html)
{
    return preg_replace(array('/<.*?>/ui', '/ +/ui', '/^ /ui'), array(' ', ' ', ''), $data_html);
}

function to_boolean($val)
{
    return filter_var($val, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
}

function redirect($query_string, $location_ = "PHP_SELF")
{
    if($location_ == "PHP_SELF")
        $location_ = $_SERVER['PHP_SELF'];
    header('Location:' . $location_ . $query_string, TRUE, 301);
}

function header_403()
{
    header("HTTP/1.0 403 Forbidden");
}

function header_404()
{
    header("HTTP/1.0 404 Not Found");
}

function print_r_($arr)
{
    $str = '<xmp>' . print_r($arr, true) . '</xmp>';
    return $str;
}

function html_href_encode($html)
{
    preg_match_all('/<a.*?href=["\']([^<>]+?)["\'].*?>/uim', $html, $matches);
    $save_url_arr = $matches[1];
    $save_url_arr = preg_replace(array('/(\/|\.|\*|\?|\=)/Uuim', '/(.+)/uim'), array('\\\$1', '/$1/Uuim'), $save_url_arr);
    for ($i = 0; isset($matches[1][$i]); $i++) {
        $matches[1][$i] = ch_p_u($matches[1][$i]);
        //        echo "\n".$matches[1][$i];
        //        $matches[1][$i] = urlencode($matches[1][$i]);
    }

    //    $matches[1] = preg_replace(array('/%27/Uuim', '/%22/Uuim', '/%2F/Uuim', '/%3A/Uuim', '/%3F/Uuim', '/%3D/Uuim', '/%23/Uuim', '/%26/Uuim'), array("'", '"', '/', ':', '?', '=', '#', '&amp;'), $matches[1]);
    return preg_replace($save_url_arr, $matches[1], $html);
}

function compress_code($code)
{
    return preg_replace("/([\n\r\t]|  )/ui", "", $code);
}

function generate($length = 8)
{
    $chars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
    $numChars = strlen($chars);
    $string = '';
    for ($i = 0; $i < $length; $i++) {
        $string .= substr($chars, rand(1, $numChars) - 1, 1);
    }
    return $string;
}

function u_rand_key_generate()
{
    return strtolower(md5(uniqid(generate(50)))) . generate(50);
}

function check_email_format($email)
{
    return (preg_match("/^([0-9a-z]([-_.]?[0-9a-z])*@[0-9a-z]([-.]?[0-9a-z])*\\.[a-wyz][a-z](fo|g|l|m|mes|o|op|pa|ro|seum|t|u|v|z)?)$/i", $email)) ? true : false;

}

function create_email_header($name, $str, $utf8_str = null)
{
    $res = "";
    if(!is_null($utf8_str)) {
        $res = mb_encode_mimeheader($utf8_str, "UTF-8", "B") . " " . $str;
        $res_arr = explode("\r\n", $res);
        $len = count($res_arr);
        $res_arr[$len - 1] = chunk_split($res_arr[$len - 1], 73, "\r\n ");
        $res = implode("\r\n", $res_arr);
        unset($res_arr);
    } else
        $res = chunk_split($str, 73, "\r\n ");
    $res = $name . ": " . $res . "\r\n";
    return $res;
}

function send_html_email($to, $subject, $message, $List_Unsubscribe_url = null)
{
    global $global_settings;
    ob_implicit_flush();

    try {


        $socket = fsockopen($global_settings['smtp_address'], $global_settings['smtp_port'], $errno, $errstr, 30);
        if(!$socket) {
            throw new Exception("$errstr ($errno)<br />\n");
        }

        // Читаем информацию о сервере
        read_smtp_answer($socket);

        // Приветствуем сервер
        write_smtp_response($socket, 'EHLO ' . $global_settings['smtp_address'] . '.');
        read_smtp_answer($socket); // ответ сервера

        //echo 'Authentication ... ';

        // Делаем запрос авторизации
        write_smtp_response($socket, 'AUTH LOGIN');
        read_smtp_answer($socket); // ответ сервера

        // Отравляем логин
        write_smtp_response($socket, base64_encode($global_settings['smtp_login']));
        read_smtp_answer($socket); // ответ сервера

        // Отравляем пароль
        write_smtp_response($socket, base64_encode($global_settings['smtp_password']));
        read_smtp_answer($socket); // ответ сервера

        //echo "OK\n";
        //echo "Check sender address ... ";

        // Задаем адрес отправителя
        write_smtp_response($socket, 'MAIL FROM:<' . $global_settings['smtp_from'] . '>');
        read_smtp_answer($socket); // ответ сервера

        // echo "OK\n";
        //echo "Check recipient address ... ";

        // Задаем адрес получателя
        write_smtp_response($socket, 'RCPT TO:<' . $to . '>');
        read_smtp_answer($socket); // ответ сервера

        // echo "OK\n";
        //echo "Send message text ... ";

        // Готовим сервер к приему данных
        write_smtp_response($socket, 'DATA');
        read_smtp_answer($socket); // ответ сервера

        // Отправляем данные

        $headers = "";
        $headers .= create_email_header('Message-ID', "<" . time() . '_' . $global_settings['smtp_from'] . ">");
        $headers .= create_email_header('Subject', '', $subject);
        $headers .= create_email_header('To', $to);
        $headers .= create_email_header('Reply-To', "<" . $global_settings['smtp_from'] . ">", $global_settings['smtp_from_name']);
        $headers .= create_email_header('From', "<" . $global_settings['smtp_from'] . ">", $global_settings['smtp_from_name']);

        if(!is_null($List_Unsubscribe_url))
            $headers .= create_email_header('List-Unsubscribe', "<$List_Unsubscribe_url>");

        $headers .= "Precedence: bulk\r\n";
        $headers .= "MIME-Version: 1.0\r\n";
        $headers .= "X-Priority: 3\r\n";
        $headers .= "X-Mailer: PHP" . phpversion() . "\r\n";
        $headers .= "Date: " . date("r") . "\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
        $message = $headers . chunk_split(base64_encode($message), 74, "\r\n");
        write_smtp_response($socket, $message . "\r\n.");
        read_smtp_answer($socket); // ответ сервера

        //echo "OK\n";
        //echo 'Close connection ... ';

        // Отсоединяемся от сервера
        write_smtp_response($socket, 'QUIT');
        read_smtp_answer($socket); // ответ сервера


    } catch (Throwable | Exception $e) {
        trigger_error("Error: " . $e->getMessage());
        return "Error: " . $e->getMessage();
    }

    if(isset($socket)) {
        fclose($socket);
    }
    return true;
}

function read_smtp_answer($socket)
{
    $read = fread($socket, 1024);

    if($read{0} != '2' && $read{0} != '3') {
        if(!empty($read)) {
            throw new Exception('SMTP failed: ' . $read . "\n");
        } else {
            throw new Exception('Unknown error' . "\n");
        }
    }
}

function write_smtp_response($socket, $msg)
{
    $msg = $msg . "\r\n";
    fputs($socket, $msg, strlen($msg));
}

function utf8_str_split($str)
{
    $split = 1;
    $array = array();
    for ($i = 0; $i < strlen($str);) {
        $value = ord($str[$i]);
        if($value > 127) {
            if($value >= 192 && $value <= 223)
                $split = 2;
            elseif($value >= 224 && $value <= 239)
                $split = 3;
            elseif($value >= 240 && $value <= 247)
                $split = 4;
        } else {
            $split = 1;
        }
        $key = NULL;
        for ($j = 0; $j < $split; $j++, $i++) {
            $key .= $str[$i];
        }
        array_push($array, $key);
    }
    return $array;
}

$chr_to_escape = "()*°%:+";
function characters_escape($variable)
{
    global $chr_to_escape;

    $chr_to_escape_arr = utf8_str_split($chr_to_escape);
    $patterns_chr_to_escape = [];
    $code_escape_arr = [];
    foreach ($chr_to_escape_arr as $chr)
        $code_escape_arr[] = "&#" . ord($chr) . ";";

    $chr_to_escape_arr = preg_replace('/(\/|\.|\*|\?|\=|\(|\)|\[|\]|\'|"|\+)/Uui', '\\\$1', $chr_to_escape_arr);
    foreach ($chr_to_escape_arr as $chr) {
        $patterns_chr_to_escape[] = "/$chr/uim";
    }


    $variable = remove_nbsp(htmlspecialchars($variable, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    $variable = preg_replace($patterns_chr_to_escape, $code_escape_arr, $variable);
    return $variable;
}

function characters_unescape($variable)
{
    global $chr_to_escape;
    $chr_to_escape_arr = utf8_str_split($chr_to_escape);
    $patterns_chr_to_escape = [];
    $code_escape_arr = [];
    foreach ($chr_to_escape_arr as $chr)
        $code_escape_arr[] = "&#" . ord($chr) . ";";

    $code_escape_arr = preg_replace('/(\/|\.|\*|\?|\=|\(|\)|\[|\]|\'|"|\+)/Uui', '\\\$1', $code_escape_arr);
    foreach ($code_escape_arr as $chr) {
        $patterns_chr_to_escape[] = "/$chr/uim";
    }

    $variable = preg_replace($patterns_chr_to_escape, $chr_to_escape_arr, $variable);
    $variable = htmlspecialchars_decode($variable, ENT_QUOTES | ENT_HTML5);
    return $variable;
}

/**
 * Не фильтрует атаки в css
 * @param string $variable
 * @param bool $max_level
 * @return array|null|string
 */
function xss_filter($variable, $max_level = false)
{
    return qdbm_ext_tools::xss_filter($variable, $max_level);
}

function save_remote_web_file($input_file, $output_file)
{
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $input_file);
    curl_setopt($ch, CURLOPT_TIMEOUT, 300);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $st = curl_exec($ch);
    if(!$st) {
        echo 'Ошибка curl: ' . curl_error($ch);
        return false;
    }
    curl_close($ch);
    $fd = fopen($output_file . '.tmp', "w");
    if(!$fd)
        return false;
    $result = fwrite($fd, $st);
    fclose($fd);
    if(!$result)
        return false;
    if(file_exists($output_file))
        unlink($output_file);
    if(!file_exists($output_file . '.tmp') or !rename($output_file . '.tmp', $output_file))
        return false;
    return true;
}

function open_txt_file($path, $extn = 'txt')
{
    return qdbm_ext_tools::open_txt_file($path, $extn);
}

function save_to_text_file($path, $text, $extn = 'txt')
{
    return qdbm_ext_tools::save_to_text_file($path, $text, $extn);

}

function url_transliteratsiya($text, $cyrillic_not_remove = false)
{
    $text = xss_filter($text, true);
    if($cyrillic_not_remove)
        return preg_replace(array('/( |\n|\/)/u', '/(\)|\(|"|&quot;|\.)/u'), array('_', ''), mb_strtolower($text, "UTF-8"));
    return preg_replace(array('/(^| |ъ|ь|у|е|ы|а|о|э|я|и|ю)[е^ё]/u', '/(е|ё)/u', '/ья/u', '/я/u', '/[и^ы]й($| )/u', '/и/u', '/(й|ы)/u', '/(ь|ъ)/u', '/а/u', '/б/u', '/в/u', '/г/u', '/д/u', '/ж/u', '/з/u', '/к/u', '/л/u', '/м/u', '/н/u', '/о/u', '/п/u', '/р/u', '/с/u', '/т/u', '/у/u', '/ф/u', '/х/u', '/ц/u', '/ч/u', '/ш/u', '/щ/u', '/э/u', '/ю/u', '/( |\n|\/)/u', '/(\)|\(|"|&quot;|\.)/u'), array('$1ey', 'e', 'ia', 'ya', 'iy$1', 'i', 'y', '', 'a', 'b', 'v', 'g', 'd', 'zh', 'z', 'k', 'l', 'm', 'n', 'o', 'p', 'r', 's', 't', 'u', 'f', 'kh', 'ts', 'ch', 'sh', 'shch', 'e', 'yu', '_', ''), mb_strtolower($text, "UTF-8"));
}

function error($mes)
{

    throw new exception($mes);
}

function error_log_e(Throwable $e)
{
    $text = $e->getFile() . ":" . $e->getLine() . " - " . $e->getMessage();
    error_log($text);
}

function get_name_back_class($depth = 0)
{
    $callers = debug_backtrace();
    $count = count($callers);
    for ($i = 0; $i < $count; $i++)
        if(isset($callers[$i]['class']) and in_array($callers[$i]['type'], ["->", "::"]) && isset($callers[$i]['class']) && utf8_strpos($callers[$i]['class'], "\\") === false)
            return ($i + $depth < $count && isset($callers[$i + $depth]['class'])) ? $callers[$i + $depth]['class'] : null;
    return null;
}

function is_get($request)
{
    return isset($_REQUEST[$request]);
}

function get_request($request, $xss_filter = true)
{
    return isset($_REQUEST[$request]) ? ($xss_filter ? xss_filter($_REQUEST[$request]) : $_REQUEST[$request]) : null;
}

function get_referer()
{
    return isset($_SERVER["HTTP_REFERER"]) ? $_SERVER["HTTP_REFERER"] : null;
}

function is_ajax()
{
    return is_get("ajax_module");
}

function inet_to_bits($inet)
{
    $unpacked = unpack('A16', $inet);
    $unpacked = str_split($unpacked[1]);
    $binaryip = '';
    foreach ($unpacked as $char) {
        $binaryip .= str_pad(decbin(ord($char)), 8, '0', STR_PAD_LEFT);
    }
    return $binaryip;
}

function ip_v4_in_cidr($ip, $cidr)
{
    $parts = explode('/', $cidr);
    $ipc = explode('.', $parts[0]);
    foreach ($ipc as &$v)
        $v = str_pad(decbin($v), 8, '0', STR_PAD_LEFT);
    $ipc = substr(join('', $ipc), 0, $parts[1]);
    $ipu = explode('.', $ip);
    foreach ($ipu as &$v)
        $v = str_pad(decbin($v), 8, '0', STR_PAD_LEFT);
    $ipu = substr(join('', $ipu), 0, $parts[1]);
    return $ipu == $ipc;
}

function ip_v6_in_cidr($ip, $cidr)
{
    $ip = inet_pton($ip);
    $binaryip = inet_to_bits($ip);

    list($net, $maskbits) = explode('/', $cidr);
    $net = inet_pton($net);
    $binarynet = inet_to_bits($net);

    $ip_net_bits = substr($binaryip, 0, $maskbits);
    $net_bits = substr($binarynet, 0, $maskbits);

    if($ip_net_bits !== $net_bits)
        return false;
    return true;
}

function get_client_ip()
{
    global $root;
    $ip = $_SERVER["REMOTE_ADDR"];
    if(isset($_SERVER["HTTP_CF_CONNECTING_IP"])) {
        $ip_tmp = $_SERVER["HTTP_CF_CONNECTING_IP"];
        $ip_v6_status = (strpos($ip_tmp, ':') === false) ? false : true;
        $path_ip = ".cache/cf_ipv4.txt";
        $path_ipv6 = ".cache/cf_ipv6.txt";
        $url_ip = "https://www.cloudflare.com/ips-v4";
        $url_ipv6 = "https://www.cloudflare.com/ips-v6";

        if($ip_v6_status) {
            $path_ip = $path_ipv6;
            $url_ip = $url_ipv6;
        }

        if(!file_exists($root . $path_ip) or strftime("%d", filemtime($root . $path_ip) != strftime("%d", time())))
            if(!save_remote_web_file($url_ip, $root . $path_ip)) {
                return $ip;
            }

        $ip_cidr_arr = explode("\n", open_txt_file($root . $path_ip, null));

        if($ip_v6_status) {
            foreach ($ip_cidr_arr as $ip_cidr) {
                if(ip_v6_in_cidr($ip_tmp, $ip_cidr)) {
                    $ip = $ip_tmp;
                    break;
                }
            }
        } else {
            foreach ($ip_cidr_arr as $ip_cidr) {
                if(ip_v4_in_cidr($ip_tmp, $ip_cidr)) {
                    $ip = $ip_tmp;
                    break;
                }
            }
        }
    }
    return $ip;
}

function remove_nbsp($str)
{
    return str_replace(array("&nbsp;", chr(194) . chr(160)), array(" ", " "), $str);
}

function replace_tab($str)
{
    return str_replace("\t", "&nbsp;", $str);
}

function ch_p_u($href)
{
    global $ch_p_u_pattern, $ch_p_u_replacement, $global_settings;
    if(!$global_settings['ch_p_u_mode'])
        return $href;
    $res = preg_replace($ch_p_u_pattern, $ch_p_u_replacement, $href, 1);
    if($res == null) {
        if(preg_last_error() == PREG_NO_ERROR) {
            return "";
        } else if(preg_last_error() == PREG_INTERNAL_ERROR) {
            print 'There is an internal error!';
        } else if(preg_last_error() == PREG_BACKTRACK_LIMIT_ERROR) {
            print 'Backtrack limit was exhausted!';
        } else if(preg_last_error() == PREG_RECURSION_LIMIT_ERROR) {
            print 'Recursion limit was exhausted!';
        } else if(preg_last_error() == PREG_BAD_UTF8_ERROR) {
            print 'Bad UTF8 error!';
        } else if(preg_last_error() == PREG_BAD_UTF8_ERROR) {
            print 'Bad UTF8 offset error!';
        }
        error("ch_p_u_preg_error");
    }
    $res = urlencode($res);
    $res = preg_replace(array('/%27/Uuim', '/%22/Uuim', '/%2F/Uuim', '/%3A/Uuim', '/%3F/Uuim', '/%3D/Uuim', '/%23/Uuim', '/%26/Uuim'), array("'", '"', '/', ':', '?', '=', '#', '&amp;'), $res);
    return $res;
}

function alert($mes)
{
    return '<script type="text/javascript">alert("' . $mes . '")</script>';
}

function error_alert_not_log($mes)
{
    exit('<script type="text/javascript">alert("' . $mes . '")</script>');
}

function remove_param_in_query_string($query_string, $param)
{
    if(is_array($param))
        foreach ($param as $val)
            $query_string = preg_replace('/(^|&|\?)(' . $val . '=?[^?&=#]*)/u', '', $query_string);
    else
        $query_string = preg_replace('/(^|&|\?)(' . $param . '=?[^?&=#]*)/u', '', $query_string);
    return $query_string;
}

function replace_param_in_query_string($query_string, $param, $new_value)
{
    $query_string = preg_replace('/(^|&|\?)(' . $param . '=?[^?&=#]*)/u', '$1' . $param . '=' . $new_value, $query_string);
    return $query_string;
}

/**
 * @param null $key
 * @param string $module_name current или global
 * @return array|bool|int|mixed|null|string
 */
function get_settings($key = null, $module_name = "current")
{
    global $g_pattern_i, $module_all_settings, $module_settings, $global_settings;
    if(is_null($module_name)) $module_name = "current";
    switch ($module_name) {
        case'global':
            if(is_null($key))
                return $global_settings;
            else
                return isset($global_settings[$key]) ? $global_settings[$key] : null;
        case 'current':
            $module_name = get_current_module_name();
        default:
            $settings = isset($module_all_settings[$g_pattern_i][$module_name]) ? $module_all_settings[$g_pattern_i][$module_name] : null;
            if(is_null($settings))
                $settings = isset($module_settings[$module_name]) ? $module_settings[$module_name] : null;
            if(is_null($key))
                return $settings;
            else
                return isset($settings[$key]) ? $settings[$key] : null;
    }
}

function get_current_module_name($depth = 0)
{
    $current_module_name = get_name_back_class($depth);
    //    if (substr($current_module_name, 0, 5) == "")
    //        $current_module_name = get_name_back_class(4);
    //    if(is_null($current_module_name))
    //        $current_module_name = get_name_back_class();
    $tmp_n = strlen($current_module_name) - 4;
    $tmp = substr($current_module_name, $tmp_n);
    if($tmp == "_ext" or $tmp == "_api")
        $current_module_name = substr($current_module_name, 0, $tmp_n);
    else {
        $tmp = substr($tmp, 1);
        if($tmp == "_as")
            $current_module_name = substr($current_module_name, 0, $tmp_n + 1);
    }

    return $current_module_name;
}

function get_http_host_name()
{
    return isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : $_SERVER['SERVER_NAME'];
}

function get_query_string()
{
    return isset($_SERVER['QUERY_STRING']) ? ('?' . $_SERVER['QUERY_STRING']) : "";
}

function import_custom_library($library)
{
    global $root;
    require_once($root . 'custom_libraries/' . $library);
}

function get_constants_in_class($class_name)
{
    $refl = new ReflectionClass($class_name);
    return $refl->getConstants();
}

function is_mobile_device()
{
    $is_mobile = false;
    if(isset($_SESSION['is_mobile']))
        $is_mobile = $_SESSION['is_mobile'];
    else {
        $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : "";

        $Android = preg_match('/Android/ui', $user_agent) ? true : false;
        $BlackBerry = preg_match('/BlackBerry|BB/ui', $user_agent) ? true : false;
        $iOS = preg_match('/iPhone|iPad|iPod/ui', $user_agent) ? true : false;
        $Windows = preg_match('/IEMobile/ui', $user_agent) ? true : false;
        $opera_mini = preg_match('/Opera Mini|Opera Mobi/ui', $user_agent) ? true : false;

        $is_mobile = ($Android || $BlackBerry || $iOS || $opera_mini || $Windows);
        $is_tablet = $is_mobile ? ((preg_match('/ipad/ui', $user_agent) ? true : false) || ($Android && !(preg_match('/mobile/ui', $user_agent) ? true : false)) || ($BlackBerry && (preg_match('/tablet/ui', $user_agent) ? true : false))) : false;
        if($is_tablet)
            $is_mobile = false;
    }

    return $is_mobile;
}

function set_mobile_device($is)
{
    $_SESSION['is_mobile'] = $is;
}

function utf8_strpos($text, $search, $offset = 0)
{
    return mb_strpos($text, $search, $offset, 'UTF-8');
}

function utf8_substr($str, $start, $length = null)
{
    return mb_substr($str, $start, $length, 'UTF-8');
}

function utf8_strlen($str)
{
    return mb_strlen($str, 'UTF-8');
}

function get_bcscale($val)
{
    $a_arr = explode('.', $val);
    $scale_a = (count($a_arr) == 2) ? strlen($a_arr[1]) : 0;
    return $scale_a;
}

function get_max_bcscale($val, $val2)
{
    $scale_a = get_bcscale($val);

    $scale_b = get_bcscale($val2);

    return ($scale_a > $scale_b) ? $scale_a : $scale_b;
}

function mb_preg_match_all(
    $ps_pattern,
    $ps_subject,
    &$pa_matches,
    $pn_flags = PREG_PATTERN_ORDER,
    $pn_offset = 0,
    $ps_encoding = NULL
)
{

    // WARNING! - All this function does is to correct offsets, nothing else:
    //(code is independent of PREG_PATTER_ORDER / PREG_SET_ORDER)

    if(is_null($ps_encoding)) $ps_encoding = mb_internal_encoding();

    $pn_offset = strlen(mb_substr($ps_subject, 0, $pn_offset, $ps_encoding));
    $ret = preg_match_all($ps_pattern, $ps_subject, $pa_matches, $pn_flags, $pn_offset);

    if($ret && ($pn_flags & PREG_OFFSET_CAPTURE))
        foreach ($pa_matches as &$ha_match)
            foreach ($ha_match as &$ha_match)
                $ha_match[1] = mb_strlen(substr($ps_subject, 0, $ha_match[1]), $ps_encoding);

    return $ret;

}

function is_background_job()
{
    global $global_settings;
    if(!isset($global_settings["background_job_sec_key"]) or is_ajax() or get_request('background_job_sec_key') !== $global_settings["background_job_sec_key"])
        return false;
    return true;
}

function is_hhvm()
{
    return defined('HHVM_VERSION');
}

function function_router($class_obj, $f_name, $args_xss_filter_disabled = [])
{
    try {
        if(substr($f_name, 0, 3) !== "_a_") {
            header_403();
            exit('this function not support function_router');
        }
        $r = new ReflectionMethod($class_obj, $f_name);
        $params = $r->getParameters();
        $args = [];
        foreach ($params as $param) {
            $p_name = $param->getName();
            if(is_get($p_name))
                $args[] = get_request($p_name, !in_array($p_name, $args_xss_filter_disabled));
            elseif($param->isOptional())
                $args[] = $param->getDefaultValue();
            else
                throw new InvalidArgumentException("Missing argument $p_name for " . get_class($class_obj) . "::$f_name()");
        }
        return call_user_func_array(array($class_obj, $f_name), $args);
    } catch (Throwable | Exception $e) {
        $trace = $e->getTrace();
        if($trace[0]['function'] == "function_router" || $trace[1]['function'] == "function_router" || ($trace[0]['function'] == "{closure}" && $trace[2]['function'] == "function_router")) {
            header_403();
            exit('function_router error: ' . $e->getMessage() . "\n");
        } else {
            $trace_str = "";
            $trace = array_reverse($trace);
            foreach ($trace as $key => $value) {
                $trace_str .= (isset($value['file']) ? $value['file'] : "") . ":" . (isset($value['line']) ? $value['line'] : "") . " ";
                if(isset($value['class']))
                    $trace_str .= $value['class'] . $value['type'];
                if(isset($value['function']))
                    $trace_str .= $value['function'];
                $trace_str .= "\n\n";
            }
            $e_str = "\n\n\n###function_router tracer###\n\n" . $e->getMessage() . "\n\n" . $trace_str;
            echo "<xmp>$e_str</xmp>";
            error_log($e_str);
            throw $e;
        }
    }
}

function get_protocol()
{
    $proto = "";
    if(!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
        $proto = $_SERVER['HTTP_X_FORWARDED_PROTO'] . '://';
    } else {
        $proto = !empty($_SERVER['HTTPS']) ? "https://" : "http://";
    }
    return $proto;
}

function preg_errtxt($errcode)
{
    static $errtext;

    if(!isset($errtxt)) {
        $errtext = array();
        $constants = get_defined_constants(true);
        foreach ($constants['pcre'] as $c => $n) if(preg_match('/_ERROR$/', $c)) $errtext[$n] = $c;
    }

    return array_key_exists($errcode, $errtext) ? $errtext[$errcode] : NULL;
}