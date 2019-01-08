<?php


class authorization_db_c extends qdbm\schema
{
    public $tab_name = "users";
    const login = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const password = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const salt = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => false, 'is_add_index' => false);
    const role = array('type' => qdbm\type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => true);
    const email = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const phone = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
    const sms_ru_api_id = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => false, 'is_add_index' => false);
    const sipnet_ru_id = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => false, 'is_add_index' => false);
    const sipnet_ru_password = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => false, 'is_add_index' => false);
    const call_hour_start = array('type' => qdbm\type_column::int, 'is_xss_filter' => true, 'is_add_index' => true);
    const call_hour_end = array('type' => qdbm\type_column::int, 'is_xss_filter' => true, 'is_add_index' => true);
}

class a_registration_db_c extends qdbm\schema
{
    public $tab_name = "registration";
    const key = array('type' => qdbm\type_column::string, 'is_xss_filter' => true, 'is_add_index' => true);
    const role = array('type' => qdbm\type_column::unsigned_int, 'is_xss_filter' => true, 'is_add_index' => true);
    const email = array('type' => qdbm\type_column::small_string, 'is_xss_filter' => true, 'is_add_index' => true);
}

class authorization_api
{
    protected static $custom_popup_links = "";
    public static $roles = [
        'admin' => 1,
        'moderator' => 2,
        'user' => 3
    ];

    protected $db = null;
    public $db_c = null;
    private $db_reg = null;

    public function __construct()
    {
        $this->db_c = new authorization_db_c();
        $this->db = new qdbm\db($this->db_c);
        return $this;
    }

    static function is_authorized()
    {
        if(is_background_job())
            return true;
        global $vers;
        if(isset($_SESSION['user_id']) and isset($_SESSION['ver']) and $_SESSION['ver'] == $vers)
            return true;
        else
            return false;
    }

    static function user_is_role($role)
    {
        if(is_background_job())
            return true;
        if(static::is_authorized() and $_SESSION["role"] == $role)
            return true;
        else
            return false;
    }

    static function is_admin()
    {
        if(is_background_job())
            return true;
        return static::user_is_role(authorization_api::$roles['admin']);
    }

    static function is_moderator()
    {
        if(is_background_job())
            return true;
        return static::user_is_role(authorization_api::$roles['moderator']);
    }

    static function is_user()
    {
        if(is_background_job())
            return true;
        return static::user_is_role(authorization_api::$roles['user']);
    }

    static function get_current_login()
    {
        if(!static::is_authorized())
            return null;
        return $_SESSION['login'];
    }


    static function check_admin()
    {
        if(!static::is_admin())
            error_alert_not_log('Недостаточно прав');
    }


    private function get_db_reg()
    {
        if(is_null($this->db_reg))
            $this->db_reg = new qdbm\db(new a_registration_db_c());
        return $this->db_reg;
    }

    function get_user($login, $f_role = null, $xss_filter = true)
    {
        $db = $this->db;
        $where = (new qdbm\where())->equally('login', $login, true, null, $xss_filter);
        $role = is_null($f_role) ? (isset($_SESSION['role']) ? $_SESSION['role'] : null) : $f_role;
        if(!is_null($role))
            $where->more_or_equally("role", $role);
        $result = $db->get_rows(new qdbm\select_q(null, $where));
        return is_null($result) ? null : $result[0];
    }

    function user_add($reg_key, $login, $password, $role)
    {
        $db = $this->db;
        $res = $this->get_user($login);
        if(!is_null($res))
            error("login $login already exist");
        $salt = $this->GenerateSalt();
        $hashed_password = md5(md5($password) . $salt);
        $newid = $db->get_nii();
        $rec = [
            'login' => $login,
            'password' => $hashed_password,
            'salt' => $salt,
            'role' => $role
        ];
        $db->insert($rec, $newid);
        if(!is_null($reg_key))
            $this->remove_key($reg_key);
        $db->unlock_tables();
        return $newid;
    }

    function edit_login($login, $new_login)
    {
        $db = $this->db;
        $res_login = $this->get_user($login);
        if(is_null($res_login))
            error("login $login not found");
        $res_new_login = $this->get_user($new_login);
        if(!is_null($res_new_login))
            error("login $new_login already exist");
        $rec = [
            'login' => $new_login,
        ];
        $db->insert($rec, $res_login['id']);
        if($_SESSION['login'] === $login)
            $_SESSION['login'] = $new_login;
    }

    function remove_user($login, $xss_filter = true)
    {
        $db = $this->db;
        $res = $this->get_user($login, static::$roles['admin'], $xss_filter);
        if(is_null($res))
            error("login $login not found");
        $db->remove_rows((new qdbm\where())->equally('login', $login, true, null, $xss_filter));
    }

    //    function edit_role($login, $role)
    //    {
    //
    //    }

    function edit_password($login, $password, $new_password, $is_force = false)
    {
        $db = $this->db;
        $password = xss_filter($password);
        $new_password = xss_filter($new_password);
        $login = xss_filter($login);
        $result = $this->get_user($login, static::$roles['admin']);
        if(is_null($result))
            error("login $login not found");

        $salt = $result['salt'];
        $text_to_check_password = substr($password, 0, 50);
        $password = md5(md5($text_to_check_password) . $salt);
        if($result['password'] == $password || $is_force || (static::is_admin() && $result['role'] != static::$roles['admin']) || (static::is_moderator() && $result['role'] == static::$roles['user'])) {
            $id = $result['id'];
            $salt = $this->GenerateSalt();
            $hashed_password = md5(md5($new_password) . $salt);
            $rec = [
                'password' => $hashed_password,
                'salt' => $salt
            ];
            $db->insert($rec, $id);
            $mes = "Пароль на сайте " . $_SERVER['SERVER_NAME'] . " был изменен";
            if(!empty($result['phone']))
                sms::send($result['phone'], $mes, $result['sms_ru_api_id']);
            //            if(database::check_db_name("exim_db")) {
            //                database::set_db_name("exim_db");
            //                database::set_db_table("accounts");
            //                database::insert_db('password', $new_password, null, null, (new qdbm\qdbm_where())->equally('login', 'support'));
            //                database::set_db_name($mysqli["db_name"]);
            //            }
        } else
            error('Неправильный пароль');

    }

    function set_notify_contacts($login, $email, $phone, $sms_ru_api_id = null, $sipnet_ru_id = null, $sipnet_ru_password = null, $call_hour_start = null, $call_hour_end = null)
    {
        $db = $this->db;
        $login = xss_filter($login);
        $result = $this->get_user($login, static::$roles['admin']);
        if(is_null(null))
            error('$result == null');

        $id = $result['id'];
        $rec = [
            'email' => $email,
            'phone' => $phone,
            'sms_ru_api_id' => $sms_ru_api_id,
            'sipnet_ru_id' => $sipnet_ru_id,
            'sipnet_ru_password' => $sipnet_ru_password,
            'call_hour_start' => $call_hour_start,
            'call_hour_end' => $call_hour_end
        ];
        $db->insert($rec, $id);
    }


    protected function GenerateSalt($n = 3)
    {
        $key = '';
        $pattern = '1234567890abcdefghijklmnopqrstuvwxyz.,*_-=+';
        $counter = strlen($pattern) - 1;
        for ($i = 0; $i < $n; $i++) {
            $key .= $pattern{rand(0, $counter)};
        }
        return $key;
    }

    function new_key($admin = false, $email)
    {
        $db = $this->get_db_reg();
        $new_id = $db->get_nii();
        $key = generate(33);
        $rec = [
            "key" => $key,
            "admin" => $admin,
            "email" => $email
        ];
        $db->insert($rec, $new_id);
        $db->unlock_tables();
        return $key;
    }

    function get_key_inf($key)
    {
        $db = $this->get_db_reg();
        return $db->get_rows(new qdbm\select_q(null, (new qdbm\where())->equally('key', $key)));
    }

    function keys_read()
    {
        $db = $this->get_db_reg();
        return $db->get_rows();
    }

    function remove_key($key)
    {
        $db = $this->get_db_reg();
        $db->remove_rows((new qdbm\where())->equally('key', $key));
    }

    static function show_link_in_popup_menu($href, $href_but_name)
    {
        static::$custom_popup_links .= "
<tr><td><a href='$href'>$href_but_name</a></td></tr>";
    }
}