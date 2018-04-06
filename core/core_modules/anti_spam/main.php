<?php



class anti_spam_db_c extends qdbm_schema
{
    public $tab_name = "anti_spam";
    const count_reg = array('type' => qdbm_type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => true);
    const empty_day = array('type' => qdbm_type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => true);
}

class anti_spam_io_db_c extends qdbm_schema
{
    public $tab_name = "anti_spam_ip";
    const prefix = array('type' => qdbm_type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const attempts = array('type' => qdbm_type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => false);
    const empty_day = array('type' => qdbm_type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => true);
    const ip = array('type' => qdbm_type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
}

class anti_spam
{
    private static $max_count_day = 10;

    private $db = null;
    public $db_c = null;
    private $db_ip = null;
    public $db_ip_c = null;

    static function main(){
        new static();
        return "";
    }

    public function __construct()
    {
        $this->db_c = new anti_spam_db_c();
        $this->db = new qdbm($this->db_c);
        $this->db_ip_c = new anti_spam_io_db_c();
        $this->db_ip = new qdbm($this->db_ip_c);
        return $this;
    }

    private function is_proxy()
    {
        $socket = socket_create(AF_INET, SOCK_STREAM, SOL_TCP);
        if($socket < 0) {
            throw new Exception('socket_create() failed: ' . socket_strerror(socket_last_error()) . "\n");
        }
        socket_set_option($socket, SOL_SOCKET, SO_RCVTIMEO, array('sec' => 3, 'usec' => 0));
        socket_set_option($socket, SOL_SOCKET, SO_SNDTIMEO, array('sec' => 3, 'usec' => 0));
        $result = @socket_connect($socket, $_SERVER["REMOTE_ADDR"], 80);
        if(isset($socket))
            socket_close($socket);
        if($result !== false)
            return true;
        if(isset($_SERVER['HTTP_X_FORWARDED_FOR']))
            return true;
        return false;
    }

    private function get_max_count_reg()
    {
        $db = $this->db;
        $empty_day = strftime("%d", time());
        $day_count = 0;
        $res = $db->get_rows();
        $day_count = intval($res[0]['count_reg']);
        if($empty_day != $res[0]['empty_day']) {
            $day_count = 0;
            $db->remove_rows((new qdbm_where())->equally($empty_day, $res[0]['empty_day']));
        }
        return $day_count;
    }

    function max_count_reg_plus()
    {
        $day_count = $this->get_max_count_reg();
        $day_count++;
        $db = $this->db;
        $empty_day = strftime("%d", time());
        $rec = [
            'count_reg' => $day_count,
            'empty_day' => $empty_day
        ];
        $db->insert($rec, 1);
    }

    private function is_max_count_reg()
    {
        $day_count = $this->get_max_count_reg();
        if($day_count >= static::$max_count_day)
            return true;
        return false;
    }

    function enable_captcha_on_client_ip()
    {
        $db = $this->db_ip;
        $ip = get_client_ip();
        $newid = $db->get_nii();
        $empty_day = strftime("%d", time());
        $res = null;
        if($newid != 1) {
            $where = new qdbm_where();
            $where->equally('ip', $ip);
            $where->equally('empty_day', $empty_day);
            $res = $db->get_rows([
                'where' => $where,
                'order_by' => 'id',
                'limit' => 1
            ]);
        }
        if($res != null)
            $newid = $res[0]["id"];

        $rec = [
            "ip" => $ip,
            "empty_day" => $empty_day,
            "captcha" => 1
        ];
        $db->insert($rec, $newid);
        $db->unlock_tables();
    }

    function disable_captcha_on_client_ip()
    {
        $this->enable_captcha_on_client_ip();
        $ip = get_client_ip();
        $db = $this->db_ip;
        $empty_day = strftime("%d", time());
        $where = new qdbm_where();
        $where->not_equally('empty_day', $empty_day);
        $db->remove_rows($where);
        $db->format_ids_in_table();
        $where = new qdbm_where();
        $where->equally('ip', $ip);
        $where->equally('empty_day', $empty_day);
        $db->insert(
            ["captcha" => false],
            null, $where
        );
        $db->unlock_tables();
    }

    private static $is_captcha = 0;

    static function check_captcha()
    {
        global $global_settings;
        if($global_settings["re_captcha"]['disable'])
            return true;
        import_custom_library('recaptcha/src/autoload.php');
        $publickey = $global_settings["re_captcha"]["publickey"];
        $privatekey = $global_settings["re_captcha"]["privatekey"];
        $resp = null;

        $reCaptcha = new \ReCaptcha\ReCaptcha($privatekey);

        // Was there a reCAPTCHA response?
        if(isset($_REQUEST["g-recaptcha-response"])) {

            $resp = $reCaptcha->verify($_REQUEST["g-recaptcha-response"], get_client_ip());
        }

        if($resp != null && $resp->isSuccess())
            return true;
        return false;
    }

    static function get_captcha_html($js_onloadCallback = null, $verifyCallback = null)
    {
        global $global_settings;

        $publickey = $global_settings["re_captcha"]["publickey"];
        $privatekey = $global_settings["re_captcha"]["privatekey"];
        $error = null;
        $html = "<script type=\"text/javascript\">
 grecaptcha_render = function() {
var elem = $('#grecaptcha_element')[0];
  grecaptcha.render(elem, {
          'sitekey' : '$publickey' " . (is_null($verifyCallback) ? "" : ", 'callback' : " . $verifyCallback) . "
        });
};
";
        if(is_null($js_onloadCallback)) {
            $html .= "var grecaptcha_onloadCallback = function() {
          grecaptcha_render();
      };
   ";
            $js_onloadCallback = "grecaptcha_onloadCallback";
        }
        $html .= "</script>";
        $html .= "<div id='grecaptcha_element'></div>";
        $html .= ' <script src="https://www.google.com/recaptcha/api.js?onload=' . $js_onloadCallback . '&amp;render=explicit" async defer></script>';
        return $html;
    }

    function is_captcha()
    {
        if(static::$is_captcha == 1)
            return false;
        if(static::$is_captcha == 2)
            return true;
        if(static::check_captcha()) {
            $this->disable_captcha_on_client_ip();
            static::$is_captcha = 1;
            return false;
        } else
            static::$is_captcha = 2;

        $empty_day = strftime("%d", time());
        $ip = get_client_ip();
        $db = $this->db_ip;
        $new_id = $db->get_nii(false);
        if($new_id == 1) {
            static::$is_captcha = 1;
            return false;
        }

        if($db->get_count((new qdbm_where())->equally('ip', $ip)->equally('empty_day', $empty_day)->equally('captcha', 1)) != 0) {
            static::$is_captcha = 2;
            return true;
        }
        if($this->is_max_count_reg() or $this->is_proxy()) {
            if($db->get_count((new qdbm_where())->equally('ip', $ip)->equally('empty_day', $empty_day)->equally('captcha', 0)) != 0) {
                static::$is_captcha = 1;
                return false;
            } else {
                static::$is_captcha = 2;
                return true;
            }
        }
        static::$is_captcha = 1;
        return false;
    }

    private static function get_attempts_where($ip, $empty_day, $prefix)
    {
        return (new qdbm_where())->equally('ip', $ip)->equally('empty_day', $empty_day)->equally('prefix', $prefix);
    }

    function attempts_plus($prefix, $ip = null)
    {
        if(is_null($ip))
            $ip = get_client_ip();
        $empty_day = strftime("%d", time());
        $db = $this->db_ip;
        $newid = $db->get_nii();
        $res = null;
        if($newid != 1)
            $res = $db->get_rows([
                'where' => static::get_attempts_where($ip, $empty_day, $prefix),
                'limit' => 1
            ]);
        if(!is_null($res))
            $newid = $res[0]['id'];
        $attempts = 0;
        if(!is_null($res))
            $attempts = intval($res[0]['attempts']);
        $attempts++;
        $rec = [
            'prefix' => $prefix,
            'ip' => $ip,
            'empty_day' => $empty_day,
            'attempts' => $attempts
        ];
        $db->insert($rec, $newid);
        $where = new qdbm_where();
        $where->not_equally('empty_day', $empty_day);

        if($db->get_count($where) > 0) {
            $db->remove_rows($where);
            $db->format_ids_in_table();
        }
        $db->unlock_tables();
        return $attempts;
    }

    function get_attempts($prefix, $ip = null)
    {
        if(is_null($ip))
            $ip = get_client_ip();
        $empty_day = strftime("%d", time());
        $db = $this->db_ip;
        $res = $db->get_rows([
            'where' => static::get_attempts_where($ip, $empty_day, $prefix),
            'limit' => 1
        ]);
        $attempts = 0;
        if(!is_null($res))
            $attempts = intval($res[0]['attempts']);
        return $attempts;
    }

    function reset_attempts($prefix, $ip = null)
    {
        $empty_day = strftime("%d", time());
        if(is_null($ip))
            $ip = get_client_ip();
        $db = $this->db_ip;
        $newid = $db->get_nii();
        $res = null;
        if($newid != 1)
            $res = $db->get_rows([
                'where' => static::get_attempts_where($ip, $empty_day, $prefix),
                'limit' => 1
            ]);
        if($res != null)
            $newid = $res[0]['id'];
        $rec = [
            'ip' => $ip,
            'attempts' => 0
        ];
        $db->insert($rec, $newid);
        $db->unlock_tables();
    }
} 